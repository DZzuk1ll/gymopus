"""LiteLLM-based AI client for multi-provider LLM integration."""
from __future__ import annotations

import json

from litellm import acompletion

from utils.crypto import decrypt_api_key


PROVIDER_PREFIX = {
    "openai": "",
    "anthropic": "anthropic/",
    "deepseek": "deepseek/",
}


def resolve_custom_prefix(base_url: str | None) -> str:
    """Detect API format from custom base URL path."""
    if base_url and "/anthropic" in base_url:
        return "anthropic/"
    return "openai/"


def is_minimax_url(base_url: str | None) -> bool:
    if not base_url:
        return False
    lowered = base_url.lower()
    return "minimax" in lowered or "minimaxi" in lowered


class AIClient:
    """Unified AI client using LiteLLM for multi-provider support."""

    def _resolve_model(self, provider: str, model: str, base_url: str | None = None) -> str:
        if provider == "custom":
            prefix = resolve_custom_prefix(base_url)
        else:
            prefix = PROVIDER_PREFIX.get(provider, "")
        return f"{prefix}{model}"

    def _extract_text(self, response) -> str:
        chunks: list[str] = []

        for choice in getattr(response, "choices", []) or []:
            message = getattr(choice, "message", None)
            if not message:
                continue

            content = getattr(message, "content", None)
            if isinstance(content, str):
                chunks.append(content)
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, str):
                        chunks.append(item)
                    elif isinstance(item, dict):
                        if isinstance(item.get("text"), str):
                            chunks.append(item["text"])
                        elif item.get("type") == "text":
                            text_payload = item.get("text")
                            if isinstance(text_payload, dict) and isinstance(text_payload.get("value"), str):
                                chunks.append(text_payload["value"])

            tool_calls = getattr(message, "tool_calls", None)
            if tool_calls:
                for tool_call in tool_calls:
                    function_data = getattr(tool_call, "function", None)
                    arguments = getattr(function_data, "arguments", None) if function_data else None
                    if isinstance(arguments, str):
                        chunks.append(arguments)
                    elif hasattr(tool_call, "model_dump_json"):
                        chunks.append(tool_call.model_dump_json())

            function_call = getattr(message, "function_call", None)
            if function_call:
                arguments = getattr(function_call, "arguments", None)
                if isinstance(arguments, str):
                    chunks.append(arguments)
                elif hasattr(function_call, "model_dump_json"):
                    chunks.append(function_call.model_dump_json())

        return "".join(chunk for chunk in chunks if chunk)

    def _build_error(self, response, resolved_model: str, base_url: str | None) -> RuntimeError:
        first_choice = (getattr(response, "choices", None) or [None])[0]
        finish_reason = getattr(first_choice, "finish_reason", None) if first_choice else None
        message = getattr(first_choice, "message", None) if first_choice else None
        reasoning_content = getattr(message, "reasoning_content", None) if message else None

        if finish_reason == "length" and reasoning_content and is_minimax_url(base_url) and base_url and "/anthropic" in base_url:
            return RuntimeError(
                "AI provider exhausted output on reasoning_content and never emitted final text. "
                "For MiniMax M2 models, avoid the Anthropic-compatible endpoint for strict JSON generation; "
                "switch Base URL to https://api.minimax.io/v1 (or https://api.minimaxi.com/v1) and retry."
            )

        return RuntimeError(
            f"AI provider returned empty content for model {resolved_model}. "
            f"Raw response: {json.dumps(response.model_dump(), ensure_ascii=False, default=str)[:1200]}"
        )

    async def complete(
        self,
        provider: str,
        model: str,
        api_key_enc: str | None,
        base_url: str | None,
        messages: list[dict],
        response_format: dict | None = None,
        temperature: float = 0.3,
        max_tokens: int | None = None,
    ) -> str:
        resolved_model = self._resolve_model(provider, model, base_url)
        api_key = decrypt_api_key(api_key_enc) if api_key_enc else None

        kwargs: dict = {
            "model": resolved_model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if api_key:
            kwargs["api_key"] = api_key
        if base_url:
            kwargs["api_base"] = base_url
        if response_format:
            kwargs["response_format"] = response_format
        if provider == "custom" and is_minimax_url(base_url) and ("/anthropic" not in (base_url or "")):
            kwargs["extra_body"] = {"reasoning_split": True}

        response = await acompletion(**kwargs)
        text = self._extract_text(response)
        if text:
            return text

        raise self._build_error(response, resolved_model, base_url)


ai_client = AIClient()
