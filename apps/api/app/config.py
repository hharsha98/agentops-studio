from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_demo_data_dir() -> str:
    # apps/api/app/config.py → repo root / demo-data
    return str(Path(__file__).resolve().parents[3] / "demo-data")


class Settings(BaseSettings):
    app_name: str = "AgentOps Studio API"
    model_base_url: str = "http://localhost:3001/v1"
    model_api_key: str = ""
    model_name: str = "auto"
    public_demo_mode: bool = True

    database_url: str = "postgresql://agentops:agentops@localhost:5432/agentops"
    redis_url: str = "redis://localhost:6379/0"
    searxng_url: str = "http://localhost:8080"
    demo_data_dir: str = _default_demo_data_dir()

    # When true (default), orchestration uses deterministic studio agents and
    # only optionally enriches with a live model when MODEL_API_KEY is set.
    force_deterministic: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
