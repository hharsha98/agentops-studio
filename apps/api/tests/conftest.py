from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.rag import knowledge_index


@pytest.fixture(autouse=True)
def _seed_knowledge() -> None:
    knowledge_index.load(Path(settings.demo_data_dir))


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
