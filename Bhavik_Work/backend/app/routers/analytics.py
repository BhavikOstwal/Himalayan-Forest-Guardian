from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import csv
import math
import os
import json
import google.generativeai as genai
from typing import List, Optional
from app.models.schemas import SpeciesDetection

router = APIRouter()

# Schema for the incoming request
class MapClickRequest(BaseModel):
    lat: float
    lng: float

# Initialize Gemini if key exists
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

def find_nearest_species(lat: float, lng: float) -> str:
    nearest_species = "Mix"
    min_dist = float('inf')
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'istp.csv')
    
    try:
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    p_lat = float(row['Latitude'])
                    p_lng = float(row['Longitude'])
                    dist = math.sqrt((lat - p_lat)**2 + (lng - p_lng)**2)
                    if dist < min_dist:
                        min_dist = dist
                        nearest_species = row['species type'].capitalize()
                except ValueError:
                    continue
    except Exception as e:
        print(f"Error reading CSV: {e}")
    
    return nearest_species

@router.post("/species-info")
def get_species_info(req: MapClickRequest):
    species_name = find_nearest_species(req.lat, req.lng)
    
    # Prompt for Gemini
    prompt = f"""
    You are an expert forestry and ecosystem analyst for the Himalayan Kullu region.
    Provide a brief JSON profile about the tree/land class '{species_name}'.
    Return exactly this JSON structure and nothing else:
    {{
        "name": "{species_name}",
        "totalSpecies": <integer between 50 and 5000>,
        "lastSurvey": "2025-11",
        "dominant": "Brief description of its ecological dominance in Kullu",
        "risk": ["Low", "Medium", "High", "Critical"][random selection],
        "size": "<number> sq km",
        "description": "2-3 sentences about this species/cover type in the Himalayas",
        "trend_data": [60, 65, 58, 50, 42, 35] (6 integers representing historical density trends)
    }}
    """
    
    try:
        if gemini_api_key:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            # Clean up potential markdown formatting from Gemini response
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
            
            return json.loads(text)
    except Exception as e:
        print("Gemini API error or missing, using fallback:", e)
        
    # Fallback mock data if API fails or key is missing
    return {
        "name": species_name,
        "totalSpecies": 1420,
        "lastSurvey": "2025-11",
        "dominant": f"{species_name} spans across the mid-altitude elevations.",
        "risk": "Medium",
        "size": "24 sq km",
        "description": f"The {species_name} zones in the Kullu valley are critical for local biodiversity and soil stabilization, though increasingly pressured by modern climatic shifts.",
        "trend_data": [70, 72, 68, 60, 55, 52]
    }

@router.get("/biodiversity/trends", response_model=List[SpeciesDetection])
def get_biodiversity_trends():
    """Returns mock biodiversity data trends."""
    return [
        {"species": "Leopard", "detection_count": 12, "lat": 31.95, "lng": 77.15},
        {"species": "Himalayan Monal", "detection_count": 45, "lat": 32.0, "lng": 77.05},
    ]
