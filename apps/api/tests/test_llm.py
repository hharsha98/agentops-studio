from __future__ import annotations

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.llm.client import LlmCompletion, LlmGateway, base_host
from app.llm.client import llm_gateway


def test_base_host_strips_path() -> None:
    assert base_host("http://127.0.0.1:20128/v1") == "127.0.0.1:20128"
    assert base_host("https://omniroute.169.58.185.43.sslip.io/v1") == "omniroute.169.58.185.43.sslip.io"


def test_padded_key_is_stripped(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "  secret\n")
    monkeypatch.setattr(settings, "force_deterministic", False)

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer secret"
        return httpx.Response(200, json={"choices": [{"message": {"content": "ok"}}]})

    result = LlmGateway(transport=httpx.MockTransport(handler)).complete(system="s", user="u")
    assert result.ok is True


def test_key_with_internal_newline_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "bad\nkey")
    monkeypatch.setattr(settings, "force_deterministic", False)
    gateway = LlmGateway()
    assert gateway.configured() is False
    assert gateway.complete(system="s", user="u").error == "not_configured"


def test_unconfigured_gateway_does_not_call_network(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "")
    monkeypatch.setattr(settings, "force_deterministic", False)
    gateway = LlmGateway()
    assert gateway.configured() is False
    result = gateway.complete(system="s", user="u")
    assert result.ok is False
    assert result.error == "not_configured"


def test_forced_deterministic_is_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "secret")
    monkeypatch.setattr(settings, "force_deterministic", True)
    gateway = LlmGateway()
    assert gateway.configured() is False
    assert gateway.mode() == "deterministic"


def test_chat_completion_parser(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "test-key")
    monkeypatch.setattr(settings, "force_deterministic", False)
    monkeypatch.setattr(settings, "model_base_url", "http://omniroute.local/v1")
    monkeypatch.setattr(settings, "model_name", "auto")

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer test-key"
        body = request.read()
        assert b"auto" in body
        return httpx.Response(
            200,
            json={
                "model": "auto",
                "choices": [{"message": {"role": "assistant", "content": "hello from gateway"}}],
                "usage": {"prompt_tokens": 3, "completion_tokens": 4},
            },
        )

    gateway = LlmGateway(transport=httpx.MockTransport(handler))
    result = gateway.complete(system="system", user="user")
    assert result.ok is True
    assert result.text == "hello from gateway"
    assert result.prompt_tokens == 3
    assert result.completion_tokens == 4
    assert result.base_host == "omniroute.local"
    assert "test-key" not in result.text


def test_auth_failure_is_structured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "model_api_key", "bad")
    monkeypatch.setattr(settings, "force_deterministic", False)
    monkeypatch.setattr(settings, "model_base_url", "http://omniroute.local/v1")

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": {"message": "nope"}})

    result = LlmGateway(transport=httpx.MockTransport(handler)).complete(system="s", user="u")
    assert result.ok is False
    assert result.error == "http_401"


def test_run_stays_deterministic_without_a_key(client: TestClient) -> None:
    created = client.post("/runs", json={"workflow_id": "compliance-review"})
    assert created.status_code == 200
    run = created.json()
    assert run["mode"] == "deterministic"
    spans = client.get(f"/runs/{run['id']}").json()["spans"]
    assert not any(span["kind"] == "model" for span in spans)


def test_gateway_failure_degrades_without_dropping_the_artifact(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(llm_gateway, "configured", lambda: True)

    def fail(**_kwargs: object) -> LlmCompletion:
        return LlmCompletion(False, "", "timeout", "auto", 12, None, None, "127.0.0.1:20128")

    monkeypatch.setattr(llm_gateway, "complete", fail)
    created = client.post("/runs", json={"workflow_id": "compliance-review"})
    assert created.status_code == 200
    run = created.json()
    assert run["mode"] == "degraded"
    assert run["artifact"]
    assert run["status"] == "done"
    spans = client.get(f"/runs/{run['id']}").json()["spans"]
    assert any(span["kind"] == "model" and span["status"] == "error" for span in spans)


def test_gateway_success_marks_run_omniroute(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(llm_gateway, "configured", lambda: True)

    def ok(**_kwargs: object) -> LlmCompletion:
        return LlmCompletion(True, "LIVE BRIEF FROM GATEWAY", None, "auto", 8, 1, 2, "127.0.0.1:20128")

    monkeypatch.setattr(llm_gateway, "complete", ok)
    created = client.post("/runs", json={"workflow_id": "compliance-review"})
    run = created.json()
    assert run["mode"] == "omniroute"
    assert "LIVE BRIEF FROM GATEWAY" in run["artifact"]
    assert any("LIVE BRIEF FROM GATEWAY" in step["summary"] for step in run["steps"])


def test_health_reports_llm_block(client: TestClient) -> None:
    body = client.get("/health").json()
    assert body["persistence"] == "memory"
    llm = body["llm"]
    assert llm["mode"] == "deterministic"
    assert llm["configured"] is False
    assert llm["probe"] == "not_configured"
    assert llm["probe_detail"] == "MODEL_API_KEY is empty"
    assert "Bearer" not in str(llm)
    assert "sk-" not in str(llm)


def test_knowledge_document_detail_and_404(client: TestClient) -> None:
    listed = client.get("/knowledge").json()["documents"]
    assert listed
    detail = client.get(f"/knowledge/{listed[0]['id']}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["document"]["id"] == listed[0]["id"]
    assert body["chunks"]
    missing = client.get("/knowledge/does-not-exist")
    assert missing.status_code == 404
