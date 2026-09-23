from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_demo_data_dir() -> str:
    # apps/api/app/config.py → repo root / demo-data
    return str(Path(__file__).resolve().parents[3] / "demo-data")


class Settings(BaseSettings):
    app_name: str = "AgentOps Studio API"
    # OmniRoute's OpenAI-compatible API. On Contabo this is the local service,
    # not the public sslip.io URL. Override in the environment; never commit a key.
    model_base_url: str = "http://127.0.0.1:20128/v1"
    model_api_key: str = ""
    model_name: str = "auto"
    model_timeout_seconds: float = 25.0
    # Empty keeps the in-memory store (tests, local smoke). Set to a file path
    # on Contabo so restarts keep runs.
    run_db_path: str = ""
    public_demo_mode: bool = True
    # Seed showcase runs (approval + done + traces) so a first public visit
    # is not an empty dashboard. Distinct from PUBLIC_DEMO_MODE, which only
    # forces sandbox tool behavior.
    demo_public: bool = True

    database_url: str = "postgresql://agentops:agentops@localhost:5432/agentops"
    redis_url: str = "redis://localhost:6379/0"
    searxng_url: str = "http://localhost:8080"
    demo_data_dir: str = _default_demo_data_dir()

    # Direct browser calls (API on its own origin). Same-origin /api via
    # Next or Caddy does not need these. Comma-separated; no spaces required.
    cors_origins: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:3010,"
        "http://127.0.0.1:3010,"
        "https://agentops.169.58.185.43.sslip.io,"
        "http://agentops.169.58.185.43.sslip.io"
    )
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    # When true, operator runs stay on templates even if MODEL_API_KEY is set.
    # Contabo sets this false and supplies the key via EnvironmentFile.
    force_deterministic: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
