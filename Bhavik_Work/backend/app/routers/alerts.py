from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.alert_service import alert_manager

router = APIRouter()

@router.websocket("/ws/ranger-alerts")
async def websocket_endpoint(websocket: WebSocket):
    await alert_manager.connect(websocket)
    try:
        while True:
            # We just wait to keep connection open and let server push
            data = await websocket.receive_text()
            print(f"Received from client (should not happen typically): {data}")
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
