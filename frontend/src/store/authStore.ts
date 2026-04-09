import { useEffect } from "react"
import { create } from "zustand"
import { loginApi, logoutApi, refreshApi, registerApi } from "../api/auth"

interface AuthPayload {
  userId: number
  email: string
  role: string
  exp: number
}

function decodeJwt(token: string): AuthPayload {
  const base64 = token.split(".")[1]
  const json = atob(base64)
  return JSON.parse(json) as AuthPayload
}

interface AuthStoreState {
  accessToken: string | null
  role: string | null
  email: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  getToken: () => Promise<string | null>
  _setAuth: (accessToken: string, role: string, email: string) => void
  _clearAuth: () => void
}

const initialState = {
  accessToken: null as string | null,
  role: null as string | null,
  email: null as string | null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  ...initialState,

  _setAuth: (accessToken: string, role: string, email: string) => {
    set({ accessToken, role, email, isAuthenticated: true })
  },

  _clearAuth: () => {
    set({ accessToken: null, role: null, email: null, isAuthenticated: false })
  },

  login: async (emailInput: string, password: string) => {
    const data = await loginApi(emailInput, password)
    const decoded = decodeJwt(data.accessToken)
    get()._setAuth(data.accessToken, decoded.role, decoded.email)
    // Refresh token is now in HttpOnly cookie, no need to store locally
  },

  register: async (emailInput: string, password: string) => {
    const data = await registerApi(emailInput, password)
    const decoded = decodeJwt(data.accessToken)
    get()._setAuth(data.accessToken, decoded.role, decoded.email)
    // Refresh token is now in HttpOnly cookie, no need to store locally
  },

  logout: () => {
    const { accessToken } = get()
    if (accessToken) {
      logoutApi(accessToken).catch(() => {})
    }
    get()._clearAuth()
    // Refresh token is in HttpOnly cookie, automatically cleared on server
  },

  getToken: async (): Promise<string | null> => {
    const { accessToken, logout } = get()
    if (accessToken) {
      const decoded = decodeJwt(accessToken)
      if (decoded.exp * 1000 > Date.now() + 10000) {
        return accessToken
      }
    }
    // Refresh token is now in HttpOnly cookie
    try {
      const data = await refreshApi("")
      const decoded = decodeJwt(data.accessToken)
      get()._setAuth(data.accessToken, decoded.role, decoded.email)
      // New refresh token is set in cookie automatically
      return data.accessToken
    } catch {
      logout()
      return null
    }
  },
}))

/** Reset store to initial state — intended for use in tests only. */
export function resetAuthStore() {
  useAuthStore.setState(initialState)
}

/** Hook that handles silent token refresh on app mount. Use once at the app root. */
export function useAuthInit() {
  const _setAuth = useAuthStore((s) => s._setAuth)
  useEffect(() => {
    // Use a flag to prevent double-refresh in React Strict Mode (dev)
    let isMounted = true

    resetAuthStore()
    const controller = new AbortController()

    refreshApi("", controller.signal)
      .then((data) => {
        if (!isMounted) return
        const decoded = decodeJwt(data.accessToken)
        _setAuth(data.accessToken, decoded.role, decoded.email)
        // New refresh token is set in cookie automatically
      })
      .catch((err) => {
        if (!isMounted || err.name === "AbortError") return
        // Refresh failed, user will need to log in again
      })

    return () => {
      isMounted = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Drop-in replacement for AuthProvider — renders nothing, runs useAuthInit. */
export function AuthInit() {
  useAuthInit()
  return null
}
