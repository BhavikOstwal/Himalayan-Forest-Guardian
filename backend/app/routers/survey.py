import os
import csv
import io
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from app.models.schemas import SurveyPoint, SurveyPointCreate
from pydantic import BaseModel
from typing import Optional

class RetrainRequest(BaseModel):
    polygon: Optional[List[List[float]]] = None
from app.services.gee_processor import train_and_classify, get_latest_classified_map
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "istp.csv")
HEADERS = ['Latitude', 'Longitude', 'species type', 'no', 'loc', 'zone', 'notes', 'date']

def get_location_name(lat, lng):
    # Mock logic to generate location names based on lat/lng
    lat_diff = int((lat - 31.9) * 1000)
    lng_diff = int((lng - 77.0) * 1000)
    return f"Sector {lat_diff}{chr(65 + (lng_diff % 26))} Ridge"

def get_zone(lat, lng):
    # Simple zone logic
    if lat > 31.94:
        return "North"
    elif lat < 31.935:
        return "South"
    elif lng > 77.05:
        return "East"
    else:
        return "West"

@router.get("/survey/points", response_model=List[SurveyPoint])
def get_survey_points():
    """Returns survey points from istp.csv."""
    if not os.path.exists(DATA_PATH):
        logger.error(f"Survey data file not found at {DATA_PATH}")
        return []

    points = []
    try:
        with open(DATA_PATH, mode='r', encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                lat = float(row['Latitude'])
                lng = float(row['Longitude'])

                # Use value from CSV if present, otherwise auto-calculate
                loc = row.get('loc') or get_location_name(lat, lng)
                zone = row.get('zone') or get_zone(lat, lng)
                notes = row.get('notes') or f"Observed {row['species type']} cluster."
                date = row.get('date') or datetime.now().strftime("%Y-%m-%d")

                points.append({
                    "id": i + 1,
                    "loc": loc,
                    "lat": lat,
                    "lng": lng,
                    "species": row['species type'].capitalize(),
                    "date": date,
                    "zone": zone,
                    "notes": notes
                })
    except Exception as e:
        logger.error(f"Error reading survey data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return points

@router.post("/survey/add-point")
def add_single_point(point: SurveyPointCreate):
    """Adds a single survey point to istp.csv."""
    try:
        file_exists = os.path.exists(DATA_PATH)
        current_date = point.date or datetime.now().strftime("%Y-%m-%d")
        loc = point.loc or get_location_name(point.lat, point.lng)
        zone = point.zone or get_zone(point.lat, point.lng)
        notes = point.notes or ""

        with open(DATA_PATH, mode='a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=HEADERS)
            if not file_exists:
                writer.writeheader()
            writer.writerow({
                'Latitude': point.lat,
                'Longitude': point.lng,
                'species type': point.species_type,
                'no': point.no,
                'loc': loc,
                'zone': zone,
                'notes': notes,
                'date': current_date
            })

        return {"status": "success", "message": "Point added successfully."}
    except Exception as e:
        logger.error(f"Error adding survey point: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survey/upload-csv")
async def upload_survey_csv(file: UploadFile = File(...)):
    """Uploads survey points via CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")

    try:
        content = await file.read()
        decoded_content = content.decode('utf-8')
        if decoded_content.startswith('\ufeff'):
            decoded_content = decoded_content[1:]

        csv_reader = csv.DictReader(io.StringIO(decoded_content))
        current_date_str = datetime.now().strftime("%Y-%m-%d")

        points_to_add = []
        for row in csv_reader:
            # Map common variants to our CSV headers
            lat = row.get('Latitude') or row.get('lat')
            lng = row.get('Longitude') or row.get('lng') or row.get('long')
            species = row.get('species type') or row.get('species_type') or row.get('species')
            no = row.get('no') or row.get('class')

            # Optional fields
            loc = row.get('loc') or row.get('location') or row.get('Location')
            zone = row.get('zone') or row.get('Zone')
            notes = row.get('notes') or row.get('Notes') or row.get('note')
            date = row.get('date') or row.get('Date') or current_date_str

            if lat is not None and lng is not None and species is not None and no is not None:
                # Fill in auto-calculated fields if missing in CSV
                f_lat, f_lng = float(lat), float(lng)
                if not loc: loc = get_location_name(f_lat, f_lng)
                if not zone: zone = get_zone(f_lat, f_lng)

                points_to_add.append({
                    'Latitude': f_lat,
                    'Longitude': f_lng,
                    'species type': species,
                    'no': no,
                    'loc': loc,
                    'zone': zone,
                    'notes': notes or "",
                    'date': date
                })

        if not points_to_add:
            raise HTTPException(status_code=400, detail="No valid data found in CSV.")

        with open(DATA_PATH, mode='a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=HEADERS)
            writer.writerows(points_to_add)

        return {"status": "success", "message": f"{len(points_to_add)} points added from CSV."}

    except Exception as e:
        logger.error(f"Error uploading CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survey/retrain")
def retrain_model(req: RetrainRequest = None):
    """Triggers GEE RF model retraining."""
    try:
        polygon = req.polygon if req else None
        result = train_and_classify(polygon_coords=polygon)
        return result
    except Exception as e:
        logger.error(f"Retraining error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey/latest-map")
def get_latest_map():
    """Returns the latest classified map ID from GEE."""
    return get_latest_classified_map()