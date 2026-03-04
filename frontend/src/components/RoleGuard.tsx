import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  requiredRole: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { role } = useAuth();

  if (role !== requiredRole) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
