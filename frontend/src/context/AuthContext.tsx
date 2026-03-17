/**
 * Compatibility shim — thin wrapper around the Zustand authStore.
 * Consumers should prefer importing useAuthStore directly from
 * "../store/authStore". This file exists so existing tests and any
 * legacy imports continue to work without modification.
 */
import { useEffect, type ReactNode } from "react"
import { refreshApi } from "../api/auth"
import { useAuthStore, resetAuthStore } from "../store/authStore"

export { useAuthStore }

// Re-export useAuth as an alias so existing imports keep working.
export const useAuth = useAuthStore

function decodeJwt(token: string): { role: string; email: string; exp: number } {
  const base64 = token.split(".")[1]
  return JSON.parse(atob(base64)) as { role: string; email: string; exp: number }
}

/**
 * AuthProvider — mounts once at the app root, attempts a silent token
 * refresh from a stored refresh token, then renders children.
 * No React Context is created; state lives entirely in Zustand.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const _setAuth = useAuthStore((s) => s._setAuth)

  useEffect(() => {
    // Reset in-memory state on each mount so test renders start clean.
    resetAuthStore()
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) return
    const controller = new AbortController()
    refreshApi(refreshToken, controller.signal)
      .then((data) => {
        const decoded = decodeJwt(data.accessToken)
        _setAuth(data.accessToken, decoded.role, decoded.email)
      })
      .catch((err) => {
        if (err.name !== "AbortError") localStorage.removeItem("refreshToken")
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
