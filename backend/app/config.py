import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/forest_guardian")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "mock_sid")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key")
    GEE_PROJECT_ID: str = os.getenv("GEE_PROJECT_ID", "your-gee-project-id")
    EBIRD_API_KEY: str = os.getenv("EBIRD_API_KEY", "")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

settings = Settings()
