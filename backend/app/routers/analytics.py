from fastapi import APIRouter
from typing import List
from app.models.schemas import SpeciesDetection

router = APIRouter()

@router.get("/biodiversity/trends", response_model=List[SpeciesDetection])
def get_biodiversity_trends():
    """Returns mock biodiversity data trends."""
    return [
        {"species": "Leopard", "detection_count": 12, "lat": 31.95, "lng": 77.15},
        {"species": "Himalayan Monal", "detection_count": 45, "lat": 32.0, "lng": 77.05},
    ]
