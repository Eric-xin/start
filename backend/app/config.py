from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://cardecon:cardecon_dev@localhost:5432/cardecon"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    smtp_host: str = "smtp.mailtrap.io"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@cardecon.app"
    smtp_from_name: str = "CardEcon"
    email_backend: str = "console"

    frontend_url: str = "http://localhost:8081"
    environment: str = "development"
    openai_api_key: str = ""
    google_api_key: str = ""
    google_cse_id: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
