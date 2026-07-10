from fastapi import FastAPI

from .config import settings

app = FastAPI(title=settings.app_name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentops-api"}


@app.get("/platform")
def platform() -> dict[str, object]:
    return {
        "name": "AgentOps Studio",
        "agents": 30,
        "workflows": 10,
        "cloud_paths": ["Docker", "k3d", "AWS EKS", "GCP GKE"],
        "model_gateway": settings.model_name,
        "public_demo_mode": settings.public_demo_mode,
    }

