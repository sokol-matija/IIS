import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from "react";
import { loginApi, refreshApi } from "../api/auth";

interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

interface AuthState {
  accessToken: string | null;
  role: string | null;
  email: string | null;
}

type AuthAction =
  | { type: "set"; accessToken: string; role: string; email: string }
  | { type: "clear" };

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "set": return { accessToken: action.accessToken, role: action.role, email: action.email };
    case "clear": return { accessToken: null, role: null, email: null };
  }
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

function decodeJwt(token: string): AuthPayload {
  const base64 = token.split(".")[1];
  const json = atob(base64);
  return JSON.parse(json);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { accessToken: null, role: null, email: null });

  // On mount, try to refresh from stored refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return;
    const controller = new AbortController();
    refreshApi(refreshToken, controller.signal)
      .then((data) => {
        const decoded = decodeJwt(data.accessToken);
        dispatch({ type: "set", accessToken: data.accessToken, role: decoded.role, email: decoded.email });
      })
      .catch((err) => {
        if (err.name !== "AbortError") localStorage.removeItem("refreshToken");
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (emailInput: string, password: string) => {
    const data = await loginApi(emailInput, password);
    const decoded = decodeJwt(data.accessToken);
    dispatch({ type: "set", accessToken: data.accessToken, role: decoded.role, email: decoded.email });
    localStorage.setItem("refreshToken", data.refreshToken);
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "clear" });
    localStorage.removeItem("refreshToken");
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (state.accessToken) {
      const decoded = decodeJwt(state.accessToken);
      if (decoded.exp * 1000 > Date.now() + 60000) {
        return state.accessToken;
      }
    }
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;
    try {
      const data = await refreshApi(refreshToken);
      const decoded = decodeJwt(data.accessToken);
      dispatch({ type: "set", accessToken: data.accessToken, role: decoded.role, email: decoded.email });
      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  }, [state.accessToken, logout]);

  return (
    <AuthContext.Provider
      value={{
        accessToken: state.accessToken,
        role: state.role,
        email: state.email,
        isAuthenticated: !!state.accessToken,
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
