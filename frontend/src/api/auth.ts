const API_URL = import.meta.env.VITE_API_URL || ""

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Login failed")
  }
  return res.json()
}

export async function refreshApi(refreshToken: string, signal?: AbortSignal) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    signal,
  })
  if (!res.ok) throw new Error("Refresh failed")
  return res.json()
}
