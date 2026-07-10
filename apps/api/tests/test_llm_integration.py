from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_advance_run_appends_llm_completion_when_enabled() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "research-report",
            "goal": "Live LLM integration test for research workflow.",
        },
    )
    run_id = create_response.json()["id"]

    with patch("app.replay_store.settings.enable_live_llm", True):
        with patch("app.replay_store.settings.model_api_key", "freellmapi-test-key"):
            with patch(
                "app.replay_store.complete_chat",
                return_value=("Synthetic model summary for the operator trace.", 24),
            ):
                advance_response = client.post(f"/runs/{run_id}/advance")

    assert advance_response.status_code == 200
    trace_types = {event["type"] for event in advance_response.json()["trace"]}
    assert "llm_completion" in trace_types
