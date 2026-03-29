from __future__ import annotations

import json
import logging
import re
from collections.abc import Iterable
from typing import Any

import yaml

logger = logging.getLogger(__name__)

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_SMART_QUOTES = str.maketrans({
    "“": '"',
    "”": '"',
    "‘": "'",
    "’": "'",
})


def _normalize_text(text: str) -> str:
    return _CONTROL_CHARS_RE.sub("", text.replace("\ufeff", "").translate(_SMART_QUOTES)).strip()


def _strip_code_fences(text: str) -> str:
    if not text.startswith("```"):
        return text

    lines = text.splitlines()
    if len(lines) <= 1:
        return text

    if lines[-1].strip() == "```":
        return "\n".join(lines[1:-1]).strip()
    return "\n".join(lines[1:]).strip()


def _strip_leading_think_block(text: str) -> str:
    stripped = text.lstrip()
    if not stripped.startswith("<think>"):
        return text

    end_idx = stripped.find("</think>")
    if end_idx == -1:
        return text
    return stripped[end_idx + len("</think>"):].lstrip()


def _extract_balanced_json(text: str) -> str | None:
    start = -1
    stack: list[str] = []
    pairs = {"{": "}", "[": "]"}
    in_string = False
    escape = False
    quote_char = ""

    for idx, char in enumerate(text):
        if start == -1:
            if char in pairs:
                start = idx
                stack.append(pairs[char])
            continue

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote_char:
                in_string = False
            continue

        if char in {'"', "'"}:
            in_string = True
            quote_char = char
            continue

        if char in pairs:
            stack.append(pairs[char])
        elif stack and char == stack[-1]:
            stack.pop()
            if not stack:
                return text[start:idx + 1].strip()

    if start != -1:
        return text[start:].strip()
    return None


def _candidate_payloads(text: str) -> Iterable[str]:
    cleaned = _normalize_text(_strip_leading_think_block(_strip_code_fences(text)))
    yield cleaned

    extracted = _extract_balanced_json(cleaned)
    if extracted and extracted != cleaned:
        yield extracted


def parse_llm_json(text: str, *, context: str) -> Any:
    if not isinstance(text, str):
        logger.error("%s expected string structured output but got %r", context, type(text).__name__)
        raise RuntimeError(f"{context} returned non-string structured output")

    json_errors: list[str] = []
    yaml_errors: list[str] = []
    candidates = list(dict.fromkeys(_candidate_payloads(text)))

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            json_errors.append(str(exc))

    for candidate in candidates:
        try:
            parsed = yaml.safe_load(candidate)
            if isinstance(parsed, (dict, list)):
                logger.warning("%s required YAML fallback after JSON parsing failed", context)
                return parsed
        except yaml.YAMLError as exc:
            yaml_errors.append(str(exc))

    preview = candidates[0][:800] if candidates else ""
    logger.error(
        "%s returned malformed structured output. JSON errors=%s YAML errors=%s preview=%r",
        context,
        json_errors[:2],
        yaml_errors[:2],
        preview,
    )
    raise RuntimeError(f"{context} returned malformed structured output")
