import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/task1", label: "Upload", icon: "📋" },
  { to: "/task2", label: "SOAP", icon: "📡" },
  { to: "/task3", label: "Validate", icon: "✅" },
  { to: "/task4", label: "Weather", icon: "🌤" },
  { to: "/task5", label: "Categories", icon: "🗃" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

function getInitials(email: string | null): string {
  if (!email) return "?";
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export default function Layout() {
  const { email, role, logout } = useAuth();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <nav
        style={{
          width: 56,
          minWidth: 56,
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRight: "1px solid var(--border)",
          padding: "12px 0",
          gap: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 20,
            flexShrink: 0,
            letterSpacing: "-0.5px",
          }}
        >
          IIS
        </div>

        {/* Nav items */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            width: "100%",
            padding: "0 8px",
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              style={({ isActive }) => ({
                width: "100%",
                height: 40,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                textDecoration: "none",
                background: isActive ? "rgba(73,69,255,0.2)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(73,69,255,0.4)" : "none",
                transition: "background 0.15s",
                cursor: "pointer",
              })}
            >
              {({ isActive }) => (
                <span
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    transition: "opacity 0.15s",
                  }}
                >
                  {item.icon}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom: user avatar + logout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            width: "100%",
          }}
        >
          {/* Avatar */}
          <div
            title={email ?? ""}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              cursor: "default",
              flexShrink: 0,
            }}
          >
            {getInitials(email)}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 16,
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(238,94,82,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            ⏏
          </button>

          {/* Role badge */}
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: role === "full-access" ? "var(--success)" : "var(--warning)",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {role === "full-access" ? "Admin" : "Read"}
          </span>
        </div>
      </nav>

      {/* Main area */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
