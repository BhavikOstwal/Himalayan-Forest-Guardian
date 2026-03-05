from fastapi import APIRouter, UploadFile, File
from app.models.schemas import AudioChunk, AlertResponse, AudioAnalysisResponse
from app.services.ml_service import process_audio_chunk
from app.services.alert_service import alert_manager, send_sms_alert
from app.services.audio_classifier import AudioClassifierService
import uuid
import os
import tempfile
from datetime import datetime

router = APIRouter()

@router.post("/audio/test-chunk", response_model=AlertResponse)
async def process_test_chunk(chunk: AudioChunk):
    """
    Test endpoint for receiving audio chunks and triggering mock ML analysis and alerts.
    """
    prediction = process_audio_chunk(chunk.audio_data)
    
    alert_id = str(uuid.uuid4())
    message = "Audio chunk processed cleanly."
    
    if prediction["is_chainsaw"] and prediction["confidence"] > 90.0:
        message = f"URGENT: Chainsaw detected with {prediction['confidence']}% confidence"
        
        # Dispatch Real-time WebSocket Alert
        alert_data = {
            "type": "CHAINSAW_ALERT",
            "alert_id": alert_id,
            "device_id": chunk.device_id,
            "confidence": prediction["confidence"],
            "lat": chunk.lat,
            "lng": chunk.lng,
            "timestamp": chunk.timestamp.isoformat(),
            "message": message
        }
        await alert_manager.broadcast_alert(alert_data)
        
        # Simulate SMS alert dispatch
        send_sms_alert("+1234567890", message)
    
    return AlertResponse(
        alert_id=alert_id,
        confidence=prediction["confidence"],
        timestamp=datetime.utcnow(),
        message=message
    )

@router.post("/audio/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio_file(file: UploadFile = File(...)):
    """
    Endpoint for uploading an actual .wav file, running inference via VGGish + PyTorch, 
    and returning the prediction label and confidence.
    """
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as f:
        f.write(await file.read())
        
    classifier = AudioClassifierService.get_instance()
    
    # Run prediction
    result = classifier.analyze_audio_file(temp_path)
    
    # Clean up
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    message = "Audio analyzed successfully."
    if result["is_chainsaw"] and result["confidence"] > 70.0:
        message = f"URGENT: Chainsaw detected with {result['confidence']}% confidence"
        
        # Dispatch Real-time WebSocket Alert
        alert_id = str(uuid.uuid4())
        alert_data = {
            "type": "CHAINSAW_ALERT",
            "alert_id": alert_id,
            "device_id": "TEST-NODE",
            "confidence": result["confidence"],
            "lat": 0.0,
            "lng": 0.0,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message
        }
        await alert_manager.broadcast_alert(alert_data)
        
    return AudioAnalysisResponse(
        prediction_class=result.get("prediction_class", "unknown"),
        confidence=result.get("confidence", 0.0),
        is_chainsaw=result.get("is_chainsaw", False),
        message=message
    )
