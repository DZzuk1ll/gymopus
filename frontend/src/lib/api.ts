const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("gymopus_anonymous_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("gymopus_anonymous_id", id);
  }
  return id;
}

interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getLLMConfig(): LLMConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("gymopus_llm_config");
  if (!raw) return null;
  try {
    const config = JSON.parse(raw) as LLMConfig;
    if (config.baseUrl && config.apiKey && config.model) return config;
    return null;
  } catch {
    return null;
  }
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json");

  const anonymousId = getAnonymousId();
  if (anonymousId) {
    headers.set("X-Anonymous-Id", anonymousId);
  }

  const llmConfig = getLLMConfig();
  if (llmConfig) {
    headers.set("X-LLM-Base-URL", llmConfig.baseUrl);
    headers.set("X-LLM-API-Key", llmConfig.apiKey);
    headers.set("X-LLM-Model", llmConfig.model);
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = buildHeaders(options.headers);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

export async function apiStreamChat(
  message: string,
  onToken: (token: string) => void,
  onFinal: (data: {
    response: string;
    intent: string;
    workout_plan: Record<string, unknown> | null;
    meal_plan: Record<string, unknown> | null;
    diet_analysis: Record<string, unknown> | null;
  }) => void,
  onError: (error: string) => void
): Promise<void> {
  const headers = buildHeaders();

  const res = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload);
        if (event.type === "token") {
          onToken(event.content);
        } else if (event.type === "final") {
          onFinal(event);
        } else if (event.type === "error") {
          onError(event.message);
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}
