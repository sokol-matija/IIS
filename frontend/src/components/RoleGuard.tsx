import type { ReactNode } from "react"
import { useAuthStore } from "../store/authStore"

interface RoleGuardProps {
  requiredRole: string
  children: ReactNode
  fallback?: ReactNode
}

export default function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { role } = useAuthStore()

  if (role !== requiredRole) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
