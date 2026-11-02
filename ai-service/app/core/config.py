"""Application configuration using Pydantic Settings."""

import os
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "DEBUG"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:8080"

    # Security / Auth
    INTERNAL_API_KEY: Optional[str] = None

    # LLM API Keys
    DEEPSEEK_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # LLM Routing Config
    DEFAULT_MODEL: str = "gemini-3.8-flash"
    FALLBACK_MODEL: str = "gemini-3.8-flash"
    MAX_RETRIES: int = 3
    REQUEST_TIMEOUT: int = 30

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_PER_HOUR: int = 200

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @model_validator(mode="after")
    def resolve_gemini_aliases(self):
        if not self.GOOGLE_AI_API_KEY:
            self.GOOGLE_AI_API_KEY = (
                os.getenv("GEMINI_API_KEY")
                or os.getenv("GEMINI_API_PRO_KEY")
                or os.getenv("GEMINI_API_MAX_KEY")
                or os.getenv("GEMINI_API_KEY_PRO")
                or os.getenv("GEMINI_API_KEY_MAX")
                or os.getenv("GEMINI_API_FREE_KEY")
            )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
