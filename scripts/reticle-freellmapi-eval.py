#!/usr/bin/env python3
"""Headless LLM eval via FreeLLMAPI — mirrors Reticle LLM-judge style checks."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

CAREER_OPS_CONFIG = Path.home() / "career-ops" / "extension" / "config.json"
PROXY_BASE = os.environ.get("MODEL_BASE_URL", "http://localhost:3001/v1")
MODEL = os.environ.get("MODEL_NAME", "auto")


@dataclass
class Check:
    name: str
    passed: bool
    detail: str


def load_api_key() -> str:
    env_key = os.environ.get("MODEL_API_KEY", "").strip()
    if env_key.startswith("freellmapi-"):
        return env_key
    if CAREER_OPS_CONFIG.is_file():
        key = json.loads(CAREER_OPS_CONFIG.read_text()).get("apiKey", "").strip()
        if key.startswith("freellmapi-"):
            return key
    raise SystemExit("FreeLLMAPI key not found. Run: python3 scripts/setup-reticle-keys.py")


def chat(api_key: str, prompt: str) -> str:
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 64,
        "temperature": 0,
    }
    req = urllib.request.Request(
        f"{PROXY_BASE}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        body = json.loads(response.read().decode())
    return body["choices"][0]["message"]["content"]


def check_models_list(api_key: str) -> Check:
    req = urllib.request.Request(
        f"{PROXY_BASE}/models",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        body = json.loads(response.read().decode())
    count = len(body.get("data", []))
    ok = count >= 3
    return Check("freellmapi_models", ok, f"models={count}")


def check_chat_completion(api_key: str) -> Check:
    text = chat(api_key, "Reply with exactly: AGENTOPS_OK")
    ok = "AGENTOPS_OK" in text.upper()
    return Check("freellmapi_chat", ok, text[:120].replace("\n", " "))


def check_agentops_judge(api_key: str) -> Check:
    sample = (
        "Workflow executive-daily-brief replay reached approval gate with trace events "
        "run_started and workflow_success scored in benchmarks."
    )
    prompt = (
        "Answer YES if the word 'executive' appears anywhere in the text below, "
        "otherwise NO. Reply with only YES or NO.\n\n"
        f"{sample}"
    )
    text = chat(api_key, prompt).strip().upper()
    ok = "YES" in text and not text.startswith("NO")
    return Check("freellmapi_llm_judge", ok, text[:80])


def main() -> int:
    api_key = load_api_key()
    checks: list[Check] = []
    try:
        checks = [
            check_models_list(api_key),
            check_chat_completion(api_key),
            check_agentops_judge(api_key),
        ]
    except urllib.error.URLError as error:
        print(f"FreeLLMAPI unreachable at {PROXY_BASE}: {error}")
        print("Start proxy: cd ~/dev/freellmapi && npm run dev -w server")
        return 1

    for item in checks:
        status = "PASS" if item.passed else "FAIL"
        print(f"[{status}] {item.name}: {item.detail}")

    failed = sum(1 for item in checks if not item.passed)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
