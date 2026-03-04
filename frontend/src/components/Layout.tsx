import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/task1", label: "Task 1 - Upload" },
  { to: "/task2", label: "Task 2 - SOAP" },
  { to: "/task3", label: "Task 3 - XML Validate" },
  { to: "/task4", label: "Task 4 - Weather" },
  { to: "/task5", label: "Task 5 - CRUD" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const { email, role, logout, isAuthenticated } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 240,
          background: "#1a1a2e",
          color: "#fff",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid #333" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>IIS Project</h2>
          {isAuthenticated && (
            <div style={{ fontSize: 12, marginTop: 8, color: "#aaa" }}>
              <div>{email}</div>
              <div style={{ color: role === "full-access" ? "#4caf50" : "#ff9800" }}>
                {role}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "10px 0" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block",
                padding: "10px 16px",
                color: isActive ? "#fff" : "#aaa",
                textDecoration: "none",
                background: isActive ? "#16213e" : "transparent",
                borderLeft: isActive ? "3px solid #0f3460" : "3px solid transparent",
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {isAuthenticated && (
          <div style={{ padding: "10px 16px" }}>
            <button
              onClick={logout}
              style={{
                width: "100%",
                padding: "8px",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <main style={{ flex: 1, padding: 24, background: "#f5f5f5" }}>
        <Outlet />
      </main>
    </div>
  );
}
