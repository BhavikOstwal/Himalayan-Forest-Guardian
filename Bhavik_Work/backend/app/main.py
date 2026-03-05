from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.routers import audio, map, alerts, analytics
from app.database import engine, Base

app = FastAPI(title="Himalayan Forest Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],  # Default for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio.router, prefix="/v1", tags=["audio"])
app.include_router(map.router, prefix="/v1", tags=["map"])
app.include_router(alerts.router, prefix="/v1", tags=["alerts"])
app.include_router(analytics.router, prefix="/v1", tags=["analytics"])

@app.get("/")
def root():
    return {"status": "Himalayan Forest Guardian API v1.0", "message": "Running on Forest Conda Env"}
