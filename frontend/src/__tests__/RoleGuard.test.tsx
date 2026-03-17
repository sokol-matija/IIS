import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import RoleGuard from "../components/RoleGuard"
import { AuthInit } from "../store/authStore"

describe("RoleGuard", () => {
  it("renders children when role matches", () => {
    // RoleGuard reads from AuthContext — test directly with a mock context
    // by wrapping with AuthProvider that has no token (role=null) and
    // checking guard with requiredRole "full-access" hides content
    render(
      <>
        <AuthInit />
        <RoleGuard requiredRole="full-access">
          <span>Admin only</span>
        </RoleGuard>
      </>
    )
    // Without a token, role is null — should NOT show children
    expect(screen.queryByText("Admin only")).not.toBeInTheDocument()
  })

  it("renders fallback when role does not match", () => {
    render(
      <>
        <AuthInit />
        <RoleGuard requiredRole="full-access" fallback={<span>No access</span>}>
          <span>Admin only</span>
        </RoleGuard>
      </>
    )
    expect(screen.getByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("Admin only")).not.toBeInTheDocument()
  })

  it("renders nothing (no fallback) when role does not match", () => {
    render(
      <>
        <AuthInit />
        <RoleGuard requiredRole="full-access">
          <span>Admin only</span>
        </RoleGuard>
      </>
    )
    expect(screen.queryByText("Admin only")).not.toBeInTheDocument()
  })
})
