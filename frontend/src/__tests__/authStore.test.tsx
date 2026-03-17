import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { AuthInit, useAuthStore, resetAuthStore } from "../store/authStore"

// Helper: create a minimal valid JWT with a base64-encoded payload (not actually signed)
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 900 }))
  return `${header}.${body}.signature`
}

// Small test component that shows auth state
function AuthDisplay() {
  const { isAuthenticated, role, email, accessToken, logout } = useAuthStore()
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="role">{role ?? "null"}</span>
      <span data-testid="email">{email ?? "null"}</span>
      <span data-testid="has-token">{accessToken !== null ? "yes" : "no"}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function LoginButton({ email, password }: { email: string; password: string }) {
  const { login } = useAuthStore()
  return (
    <button
      onClick={async () => {
        await login(email, password)
      }}
    >
      Login
    </button>
  )
}

// Clear localStorage manually (avoids Node v25 native localStorage stub)
function clearStorage() {
  window.localStorage.removeItem("refreshToken")
  window.localStorage.removeItem("accessToken")
}

describe("authStore", () => {
  beforeEach(() => {
    resetAuthStore()
    clearStorage()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearStorage()
  })

  it("starts unauthenticated when no refresh token in localStorage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))

    render(
      <>
        <AuthInit />
        <AuthDisplay />
      </>
    )

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("false")
    })
    expect(screen.getByTestId("role").textContent).toBe("null")
    expect(screen.getByTestId("has-token").textContent).toBe("no")
  })

  it("after login(), isAuthenticated becomes true", async () => {
    const user = userEvent.setup()
    const adminToken = makeJwt({ userId: 1, email: "admin@iis.hr", role: "full-access" })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: adminToken,
          refreshToken: "mock-refresh-token",
          role: "full-access",
        }),
      })
    )

    render(
      <>
        <AuthInit />
        <AuthDisplay />
        <LoginButton email="admin@iis.hr" password="admin123" />
      </>
    )

    await user.click(screen.getByText("Login"))

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true")
    })
    expect(screen.getByTestId("role").textContent).toBe("full-access")
    expect(screen.getByTestId("email").textContent).toBe("admin@iis.hr")
  })

  it("after logout(), isAuthenticated becomes false", async () => {
    const user = userEvent.setup()
    const adminToken = makeJwt({ userId: 1, email: "admin@iis.hr", role: "full-access" })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: adminToken,
          refreshToken: "mock-refresh-token",
          role: "full-access",
        }),
      })
    )

    render(
      <>
        <AuthInit />
        <AuthDisplay />
        <LoginButton email="admin@iis.hr" password="admin123" />
      </>
    )

    await user.click(screen.getByText("Login"))
    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true")
    })

    await user.click(screen.getByText("Logout"))
    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("false")
    })
    expect(screen.getByTestId("role").textContent).toBe("null")
  })

  it("role is correctly set from login response", async () => {
    const user = userEvent.setup()
    const readerToken = makeJwt({ userId: 2, email: "reader@iis.hr", role: "read-only" })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: readerToken,
          refreshToken: "reader-refresh",
          role: "read-only",
        }),
      })
    )

    render(
      <>
        <AuthInit />
        <AuthDisplay />
        <LoginButton email="reader@iis.hr" password="reader123" />
      </>
    )

    await user.click(screen.getByText("Login"))

    await waitFor(() => {
      expect(screen.getByTestId("role").textContent).toBe("read-only")
    })
    expect(screen.getByTestId("email").textContent).toBe("reader@iis.hr")
  })

  it("accessToken is stored in memory (not in localStorage)", async () => {
    const user = userEvent.setup()
    const adminToken = makeJwt({ userId: 1, email: "admin@iis.hr", role: "full-access" })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: adminToken,
          refreshToken: "refresh-token-value",
          role: "full-access",
        }),
      })
    )

    render(
      <>
        <AuthInit />
        <AuthDisplay />
        <LoginButton email="admin@iis.hr" password="admin123" />
      </>
    )

    await user.click(screen.getByText("Login"))

    await waitFor(() => {
      expect(screen.getByTestId("has-token").textContent).toBe("yes")
    })

    expect(window.localStorage.getItem("accessToken")).toBeNull()
    expect(window.localStorage.getItem("refreshToken")).toBe("refresh-token-value")
  })

  it("throws error and remains unauthenticated when login fails", async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      })
    )

    function LoginWithError() {
      const { login } = useAuthStore()
      const [error, setError] = React.useState("")
      return (
        <>
          <span data-testid="error">{error}</span>
          <button
            onClick={async () => {
              try {
                await login("bad@test.hr", "wrong")
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            Login
          </button>
        </>
      )
    }

    render(
      <>
        <AuthInit />
        <AuthDisplay />
        <LoginWithError />
      </>
    )

    await user.click(screen.getByText("Login"))

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("Invalid credentials")
    })
    expect(screen.getByTestId("authenticated").textContent).toBe("false")
  })
})
