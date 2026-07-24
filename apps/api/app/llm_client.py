"""OpenAI-compatible chat client for FreeLLMAPI / local model gateway."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from .config import settings


class LLMClientError(RuntimeError):
    pass


def complete_chat(
    prompt: str,
    *,
    max_tokens: int = 128,
    temperature: float = 0.2,
) -> tuple[str, int]:
    """Return (assistant_text, estimated_tokens)."""
    if not settings.model_api_key:
        raise LLMClientError("MODEL_API_KEY is not configured")

    payload = {
        "model": settings.model_name,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    req = urllib.request.Request(
        f"{settings.model_base_url.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.model_api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            body = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:300]
        raise LLMClientError(f"LLM HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise LLMClientError(f"LLM unreachable at {settings.model_base_url}") from exc

    message = body["choices"][0]["message"]["content"].strip()
    usage = body.get("usage", {})
    tokens = int(usage.get("total_tokens") or max(len(prompt.split()), 1) + len(message.split()))
    return message, tokens
