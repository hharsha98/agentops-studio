"""OpenAI-compatible model gateway (OmniRoute on Contabo)."""

from .client import LlmCompletion, LlmGateway, llm_gateway

__all__ = ["LlmCompletion", "LlmGateway", "llm_gateway"]
