from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx

from ..config import settings


@dataclass
class LlmCompletion:
    ok: bool
    text: str
    error: str | None
    model: str
    latency_ms: int
    prompt_tokens: int | None
    completion_tokens: int | None
    base_host: str


def api_key() -> str:
    key = settings.model_api_key.strip()
    if "\r" in key or "\n" in key:
        return ""
    return key


def base_host(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"http://{url}")
    host = parsed.hostname or "unknown"
    if parsed.port:
        return f"{host}:{parsed.port}"
    return host


def _message_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(str(item.get("text") or item.get("content") or ""))
        return "".join(parts)
    if content is None:
        return ""
    return str(content)


class LlmGateway:
    """Chat completions against MODEL_BASE_URL. Never raises for gateway errors."""

    def __init__(self, transport: httpx.BaseTransport | None = None) -> None:
        self._transport = transport
        self._probe = ("skipped", "Probe has not run")
        self._probe_lock = threading.Lock()

    def configured(self) -> bool:
        return bool(api_key()) and not settings.force_deterministic

    def mode(self) -> str:
        return "omniroute" if self.configured() else "deterministic"

    def status(self) -> dict[str, object]:
        with self._probe_lock:
            probe, detail = self._probe
        if not api_key():
            probe, detail = "not_configured", "MODEL_API_KEY is empty"
        elif settings.force_deterministic and probe == "pending":
            probe, detail = "skipped", "FORCE_DETERMINISTIC is true"
        return {
            "mode": self.mode(),
            "configured": self.configured(),
            "force_deterministic": settings.force_deterministic,
            "model": settings.model_name,
            "base_host": base_host(settings.model_base_url),
            "probe": probe,
            "probe_detail": detail,
        }

    def start_probe(self) -> None:
        if not api_key():
            self._set_probe("not_configured", "MODEL_API_KEY is empty")
            return
        if settings.force_deterministic:
            self._set_probe("skipped", "FORCE_DETERMINISTIC is true")
            return
        self._set_probe("pending", "Probing GET /models")
        threading.Thread(target=self._probe_models, name="omniroute-probe", daemon=True).start()

    def complete(self, *, system: str, user: str, max_tokens: int = 700) -> LlmCompletion:
        host = base_host(settings.model_base_url)
        model = settings.model_name
        if not self.configured():
            reason = "forced_deterministic" if settings.force_deterministic else "not_configured"
            return LlmCompletion(False, "", reason, model, 0, None, None, host)

        url = settings.model_base_url.rstrip("/") + "/chat/completions"
        payload = {
            "model": model,
            "temperature": 0.2,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user[:8000]},
            ],
        }
        headers = {
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
        }
        started = time.perf_counter()
        try:
            with httpx.Client(timeout=settings.model_timeout_seconds, transport=self._transport) as client:
                response = client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException:
            return self._fail("timeout", model, host, started)
        except httpx.HTTPError:
            return self._fail("unreachable", model, host, started)

        latency = int((time.perf_counter() - started) * 1000)
        if response.status_code in {401, 403}:
            return LlmCompletion(False, "", "http_401", model, latency, None, None, host)
        if response.status_code >= 400:
            return LlmCompletion(False, "", f"http_{response.status_code}", model, latency, None, None, host)
        try:
            data = response.json()
            text = _message_text(data["choices"][0]["message"]["content"]).strip()
        except (KeyError, IndexError, TypeError, ValueError):
            return LlmCompletion(False, "", "bad_shape", model, latency, None, None, host)
        if not text:
            return LlmCompletion(False, "", "empty", model, latency, None, None, host)
        usage = data.get("usage") if isinstance(data, dict) else None
        prompt_tokens = usage.get("prompt_tokens") if isinstance(usage, dict) else None
        completion_tokens = usage.get("completion_tokens") if isinstance(usage, dict) else None
        return LlmCompletion(
            True,
            text,
            None,
            str(data.get("model") or model),
            latency,
            int(prompt_tokens) if isinstance(prompt_tokens, int) else None,
            int(completion_tokens) if isinstance(completion_tokens, int) else None,
            host,
        )

    def _fail(self, error: str, model: str, host: str, started: float) -> LlmCompletion:
        latency = int((time.perf_counter() - started) * 1000)
        return LlmCompletion(False, "", error, model, latency, None, None, host)

    def _set_probe(self, probe: str, detail: str) -> None:
        with self._probe_lock:
            self._probe = (probe, detail)

    def _probe_models(self) -> None:
        url = settings.model_base_url.rstrip("/") + "/models"
        try:
            with httpx.Client(timeout=5.0, transport=self._transport) as client:
                response = client.get(
                    url,
                    headers={"Authorization": f"Bearer {api_key()}"},
                )
        except httpx.HTTPError:
            self._set_probe("unreachable", "GET /models failed")
            return
        if response.status_code in {401, 403}:
            self._set_probe("auth_failed", "OmniRoute rejected the API key")
            return
        if response.status_code >= 400:
            self._set_probe("unreachable", f"GET /models HTTP {response.status_code}")
            return
        self._set_probe("ok", "OmniRoute /models reachable")


llm_gateway = LlmGateway()
