import { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore as useAuth } from "../store/authStore";
import {
  UploadCloud,
  Radio,
  CheckCircle2,
  Cloud,
  LayoutList,
  Settings,
  LogOut,
  Layers,
} from "lucide-react";
import { update } from "jdenticon";
import { cn } from "@/lib/utils";

function Identicon({ value, size }: { value: string; size: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) update(ref.current, value);
  }, [value]);
  return <svg ref={ref} width={size} height={size} />;
}

const navItems = [
  { to: "/task1", label: "Upload", icon: UploadCloud },
  { to: "/task2", label: "SOAP", icon: Radio },
  { to: "/task3", label: "Validate", icon: CheckCircle2 },
  { to: "/task4", label: "Weather", icon: Cloud },
  { to: "/task5", label: "Categories", icon: LayoutList },
  { to: "/settings", label: "Settings", icon: Settings },
];


export default function Layout() {
  const { email, role, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Glass Sidebar */}
      <nav className="w-14 min-w-14 flex flex-col items-center border-r border-white/10 py-3 gap-0 backdrop-blur-xl"
           style={{ background: "rgba(255,255,255,0.04)" }}>

        {/* Logo — glowing frosted orb */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-5 shrink-0"
             style={{
               background: "linear-gradient(135deg, rgba(162,155,254,0.9) 0%, rgba(223,186,244,0.85) 100%)",
               boxShadow: "0 0 20px rgba(162,155,254,0.55), 0 0 8px rgba(223,186,244,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
               border: "1px solid rgba(255,255,255,0.18)",
             }}>
          <Layers size={17} className="text-white drop-shadow-sm" strokeWidth={1.5} />
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-center gap-1 w-full px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  "w-full h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                )
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(162,155,254,0.20)",
                boxShadow: "0 0 12px rgba(162,155,254,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
                border: "1px solid rgba(162,155,254,0.35)",
              } : {
                background: "transparent",
                border: "1px solid transparent",
              }}
            >
              {({ isActive }) => (
                <item.icon
                  size={18}
                  className={cn(
                    "transition-all duration-200",
                    isActive
                      ? "text-[#a29bfe] drop-shadow-[0_0_6px_rgba(162,155,254,0.8)]"
                      : "text-white/40 group-hover:text-white/80"
                  )}
                />
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom: user avatar + logout */}
        <div className="flex flex-col items-center gap-2 pt-3 w-full px-2"
             style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Avatar with glass ring */}
          <div
            title={email ?? ""}
            className="w-8 h-8 rounded-full overflow-hidden cursor-default shrink-0"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.15), 0 0 8px rgba(139,92,246,0.2)",
            }}
          >
            <Identicon value={email ?? "?"} size={32} />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 transition-all duration-200 hover:text-red-400"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            }}
          >
            <LogOut size={16} />
          </button>

          {/* Role badge */}
          <span
            className={cn(
              "text-[8px] font-bold uppercase tracking-widest text-center leading-tight",
              role === "full-access"
                ? "text-emerald-400"
                : "text-amber-400"
            )}
            style={{
              textShadow: role === "full-access"
                ? "0 0 8px rgba(52,211,153,0.6)"
                : "0 0 8px rgba(251,191,36,0.6)",
            }}
          >
            {role === "full-access" ? "Admin" : "Read"}
          </span>
        </div>
      </nav>

      {/* Main area — let background show through */}
      <main className="flex-1 overflow-auto flex flex-col" style={{ background: "transparent" }}>
        <Outlet />
      </main>
    </div>
  );
}
