import json
from typing import List
from fastapi import WebSocket

class AlertManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert_data: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(alert_data))

alert_manager = AlertManager()

def send_sms_alert(phone_number: str, message: str):
    # Mock Twilio SMS sending
    print(f"[SMS ALERT to {phone_number}]: {message}")
    return True
