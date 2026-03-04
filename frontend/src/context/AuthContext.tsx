import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

interface AuthContextType {
  accessToken: string | null;
  role: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || "";

function decodeJwt(token: string): AuthPayload {
  const base64 = token.split(".")[1];
  const json = atob(base64);
  return JSON.parse(json);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // On mount, try to refresh from stored refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Refresh failed");
          return res.json();
        })
        .then((data) => {
          const decoded = decodeJwt(data.accessToken);
          setAccessToken(data.accessToken);
          setRole(decoded.role);
          setEmail(decoded.email);
        })
        .catch(() => {
          localStorage.removeItem("refreshToken");
        });
    }
  }, []);

  const login = useCallback(async (emailInput: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    const decoded = decodeJwt(data.accessToken);

    setAccessToken(data.accessToken);
    setRole(decoded.role);
    setEmail(decoded.email);
    localStorage.setItem("refreshToken", data.refreshToken);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem("refreshToken");
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) {
      const decoded = decodeJwt(accessToken);
      // If token expires in less than 1 minute, refresh
      if (decoded.exp * 1000 > Date.now() + 60000) {
        return accessToken;
      }
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) throw new Error("Refresh failed");

      const data = await res.json();
      const decoded = decodeJwt(data.accessToken);
      setAccessToken(data.accessToken);
      setRole(decoded.role);
      setEmail(decoded.email);
      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  }, [accessToken, logout]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        role,
        email,
        isAuthenticated: !!accessToken,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
