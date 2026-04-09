const API_URL = import.meta.env.VITE_API_URL || ""

// Helper to make authenticated requests with cookie support
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // Include cookies in request/response
  })
}

export async function loginApi(email: string, password: string) {
  const res = await authenticatedFetch(`${API_URL}/auth/login`, {
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

export async function refreshApi(_refreshToken: string, signal?: AbortSignal) {
  // Refresh token is now sent via HttpOnly cookie automatically
  const res = await authenticatedFetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // Empty body, token is in cookie
    signal,
  })
  if (!res.ok) throw new Error("Refresh failed")
  return res.json()
}

export async function registerApi(email: string, password: string) {
  const res = await authenticatedFetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Registration failed")
  }
  return res.json()
}

export async function logoutApi(accessToken: string) {
  await authenticatedFetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  })
}

export async function fetchUsersApi(accessToken: string) {
  const res = await authenticatedFetch(`${API_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("Failed to fetch users")
  return res.json() as Promise<{ id: number; email: string; role: string }[]>
}

export async function revokeUserApi(accessToken: string, userId: number) {
  const res = await authenticatedFetch(`${API_URL}/auth/revoke-user/${userId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Revoke failed")
  }
  return res.json()
}
