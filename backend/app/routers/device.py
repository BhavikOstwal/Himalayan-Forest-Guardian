from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.schemas import DeviceTelemetry
from app.services.device_ws_service import device_ws_manager
import asyncio

router = APIRouter()

@router.post("/data")
async def receive_device_data(data: DeviceTelemetry):
    """
    Endpoint for the ESP basestation to send realtime telemetry & classification labels.
    """
    # Transform Pydantic model to a dict so we can broadcast it as JSON
    payload = data.dict()
    
    # Broadcast to all connected websocket clients
    await device_ws_manager.broadcast(payload)
    
    return {"status": "success", "message": "Data received and broadcasted"}

@router.websocket("/ws/device-data")
async def websocket_device_data(websocket: WebSocket):
    """
    WebSocket endpoint for the React Dashboard to receive real-time stream.
    """
    await device_ws_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive, wait for incoming dummy messages if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        device_ws_manager.disconnect(websocket)
