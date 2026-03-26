"""LiteLLM-based AI client for multi-provider LLM integration."""
from __future__ import annotations

from litellm import acompletion

from utils.crypto import decrypt_api_key


PROVIDER_PREFIX = {
    "openai": "",
    "anthropic": "anthropic/",
    "deepseek": "deepseek/",
    "custom": "openai/",
}


class AIClient:
    """Unified AI client using LiteLLM for multi-provider support."""

    def _resolve_model(self, provider: str, model: str) -> str:
        prefix = PROVIDER_PREFIX.get(provider, "")
        return f"{prefix}{model}"

    async def complete(
        self,
        provider: str,
        model: str,
        api_key_enc: str | None,
        base_url: str | None,
        messages: list[dict],
        response_format: dict | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        resolved_model = self._resolve_model(provider, model)
        api_key = decrypt_api_key(api_key_enc) if api_key_enc else None

        kwargs: dict = {
            "model": resolved_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if api_key:
            kwargs["api_key"] = api_key
        if base_url:
            kwargs["api_base"] = base_url
        if response_format:
            kwargs["response_format"] = response_format

        response = await acompletion(**kwargs)
        return response.choices[0].message.content


ai_client = AIClient()
