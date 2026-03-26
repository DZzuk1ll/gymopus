const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `API error ${res.status}`)
  }
  return res.json()
}

// User ID management via localStorage
const USER_ID_KEY = "gymops_user_id"

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_ID_KEY)
}

export function setStoredUserId(id: string) {
  localStorage.setItem(USER_ID_KEY, id)
}

export function clearStoredUserId() {
  localStorage.removeItem(USER_ID_KEY)
}
