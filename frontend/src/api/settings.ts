import { useAuthStore } from "@/store/authStore"

const API_URL = import.meta.env.VITE_API_URL || ""

interface Settings {
  useCustomApi: boolean
}

export async function getSettings(signal?: AbortSignal): Promise<Settings> {
  const token = await useAuthStore.getState().getToken()
  const res = await fetch(`${API_URL}/api/settings`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  })
  return res.json()
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const token = await useAuthStore.getState().getToken()
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(settings),
  })
  return res.json()
}
