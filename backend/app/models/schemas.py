from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AudioChunk(BaseModel):
    device_id: str
    timestamp: datetime
    audio_data: str  # Base64 encoded audio or mock data string
    lat: float
    lng: float

class AlertResponse(BaseModel):
    alert_id: str
    confidence: float
    timestamp: datetime
    message: str

class AudioAnalysisResponse(BaseModel):
    prediction_class: str
    confidence: float
    is_chainsaw: bool
    message: str

class Hotspot(BaseModel):
    id: int
    lat: float
    lng: float
    risk_score: float
    ndvi_change: float

class SpeciesDetection(BaseModel):
    species: str
    detection_count: int
    lat: float
    lng: float

class SurveyPoint(BaseModel):
    id: int
    loc: str
    lat: float
    lng: float
    species: str
    date: str
    zone: str
    notes: str

class SurveyPointCreate(BaseModel):
    lat: float
    lng: float
    species_type: str
    no: int
    loc: Optional[str] = None
    zone: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None

class DeviceTelemetry(BaseModel):
    device_id: str
    label: str
    confidence: float
    amplitude: float
    battery: float
