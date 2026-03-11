from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME:                str = "Clinical Trial Matching Engine"
    DEBUG:                   bool = True
    FRONTEND_URL:            str = "http://localhost:3000"
    CLINICALTRIALS_API_URL:  str = "https://clinicaltrials.gov/api/v2"

    # PostgreSQL
    POSTGRES_HOST:     str = "localhost"
    POSTGRES_PORT:     int = 5432
    POSTGRES_USER:     str = "ctme_user"
    POSTGRES_PASSWORD: str = "ctme_pass"
    POSTGRES_DB:       str = "ctme_db"
    DATABASE_URL:      str = "postgresql+asyncpg://ctme_user:ctme_pass@localhost:5432/ctme_db"

    # MongoDB
    MONGO_URI:   str = "mongodb://ctme_user:ctme_pass@localhost:27017/ctme_db?authSource=admin"

    # Redis
    REDIS_URL:   str = "redis://localhost:6379"

    # Auth
    SECRET_KEY:  str = "dev-secret-key-change-in-production"

    # Extra fields from .env are ignored
    APP_ENV:     Optional[str] = "development"

    class Config:
        env_file = ".env"
        extra    = "ignore"


settings = Settings()