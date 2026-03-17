const API_URL = import.meta.env.VITE_API_URL || ""

interface Settings {
  useCustomApi: boolean
}

export async function getSettings(signal?: AbortSignal): Promise<Settings> {
  const res = await fetch(`${API_URL}/api/settings`, { signal })
  return res.json()
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })
  return res.json()
}
