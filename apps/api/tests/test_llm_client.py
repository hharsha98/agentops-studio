from unittest.mock import patch

from app.llm_client import LLMClientError, complete_chat


def test_complete_chat_returns_message_and_tokens() -> None:
    fake_body = {
        "choices": [{"message": {"content": "Hello from the model."}}],
        "usage": {"total_tokens": 42},
    }

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            import json

            return json.dumps(fake_body).encode()

    with patch("app.llm_client.settings.model_api_key", "freellmapi-test-key"):
        with patch("urllib.request.urlopen", return_value=FakeResponse()):
            text, tokens = complete_chat("Say hello")

    assert "Hello" in text
    assert tokens == 42


def test_complete_chat_requires_api_key() -> None:
    with patch("app.llm_client.settings.model_api_key", ""):
        try:
            complete_chat("noop")
            raised = False
        except LLMClientError:
            raised = True
    assert raised
