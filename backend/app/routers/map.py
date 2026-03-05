from fastapi import APIRouter
from typing import List
from app.models.schemas import Hotspot

router = APIRouter()

@router.get("/map/hotspots", response_model=List[Hotspot])
def get_hotspots():
    """Returns detected deforestation hotspots."""
    return [
        {"id": 1, "lat": 31.9, "lng": 77.1, "risk_score": 0.85, "ndvi_change": -0.15},
        {"id": 2, "lat": 32.1, "lng": 77.2, "risk_score": 0.92, "ndvi_change": -0.22},
    ]
