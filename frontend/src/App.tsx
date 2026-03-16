import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuthStore as useAuth } from "./store/authStore";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import Task1Page from "./pages/Task1Page";
import Task2Page from "./pages/Task2Page";
import Task3Page from "./pages/Task3Page";
import Task4Page from "./pages/Task4Page";
import Task5Page from "./pages/Task5Page";
import SettingsPage from "./pages/SettingsPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/task1" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/task1" replace />} />
        <Route path="task1" element={<Task1Page />} />
        <Route path="task2" element={<Task2Page />} />
        <Route path="task3" element={<Task3Page />} />
        <Route path="task4" element={<Task4Page />} />
        <Route path="task5" element={<Task5Page />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
