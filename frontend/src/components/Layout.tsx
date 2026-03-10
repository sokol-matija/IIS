import { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
      {/* Sidebar */}
      <nav className="w-14 min-w-14 bg-sidebar flex flex-col items-center border-r border-sidebar-border py-3 gap-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-5 shrink-0 shadow-[0_2px_16px_rgba(124,58,237,0.5)] ring-1 ring-white/10">
          <Layers size={17} className="text-white" strokeWidth={1.5} />
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
                  "w-full h-10 rounded-md flex items-center justify-center transition-colors",
                  isActive
                    ? "bg-primary/20 ring-1 ring-primary/40 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <item.icon
                  size={18}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground opacity-70"
                  )}
                />
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom: user avatar + logout */}
        <div className="flex flex-col items-center gap-2 pt-3 border-t border-sidebar-border w-full">
          {/* Avatar */}
          <div
            title={email ?? ""}
            className="w-8 h-8 rounded-full overflow-hidden cursor-default shrink-0 ring-1 ring-border"
          >
            <Identicon value={email ?? "?"} size={32} />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log out"
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={16} />
          </button>

          {/* Role badge */}
          <span
            className={cn(
              "text-[8px] font-bold uppercase tracking-wide text-center leading-tight",
              role === "full-access" ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {role === "full-access" ? "Admin" : "Read"}
          </span>
        </div>
      </nav>

      {/* Main area */}
      <main className="flex-1 overflow-auto bg-background flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
