from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AgentOps Studio API"
    model_base_url: str = "http://localhost:3001/v1"
    model_name: str = "auto"
    model_api_key: str = ""
    enable_live_llm: bool = False
    public_demo_mode: bool = True
    database_url: str = "sqlite:///./agentops-studio.db"
    redis_url: str = "redis://localhost:6379/0"
    worker_queue_name: str = "agentops"
    demo_data_dir: str | None = None
    require_redis_for_ready: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
