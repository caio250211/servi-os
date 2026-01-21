import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  ClipboardList,
  CalendarDays,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_2460b93f-9170-44ea-8a4c-717f4e4be696/artifacts/6cc67isd_logo.png.JPG.png";

function SidebarItem({ to, icon: Icon, label, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
          "text-white/90 hover:text-white",
          "hover:bg-white/10",
          isActive && "bg-black/25 text-white ring-1 ring-white/15"
        )
      }
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl",
          "bg-black/25 ring-1 ring-white/15",
          "group-hover:bg-black/30"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div data-testid="app-shell" className="min-h-screen bg-[#050509] text-zinc-50">
      <div className="pointer-events-none fixed inset-0 opacity-65">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.38),transparent_55%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.22),transparent_55%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 md:grid-cols-[280px_1fr] md:px-6">
        <aside
          data-testid="app-sidebar"
          className={cn(
            "sticky top-4 hidden h-[calc(100vh-2rem)] flex-col rounded-2xl border border-white/10",
            "bg-gradient-to-b from-[#b91c1c] via-[#be123c] to-[#9f1239]",
            "p-4 shadow-[0_20px_70px_-30px_rgba(220,38,38,0.65)]",
            "md:flex"
          )}
        >
          <div className="flex items-center gap-3 px-1">
            <div className="h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/20 bg-black/20">
              <img
                data-testid="sidebar-logo"
                src={LOGO_URL}
                alt="InsectControl Tupy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div data-testid="sidebar-title" className="truncate text-sm font-bold text-white">
                InsectControl Tupy
              </div>
              <div
                data-testid="sidebar-subtitle"
                className="truncate text-xs text-white/80"
              >
                Gestão de serviços
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <SidebarItem to="/" icon={LayoutGrid} label="Dashboard" testid="nav-dashboard" />
            <SidebarItem to="/clientes" icon={Users} label="Clientes" testid="nav-clients" />
            <SidebarItem to="/servicos" icon={ClipboardList} label="Serviços" testid="nav-services" />
            <SidebarItem to="/agenda" icon={CalendarDays} label="Agenda" testid="nav-agenda" />
            <SidebarItem to="/resumo" icon={BarChart3} label="Resumo" testid="nav-summary" />
          </div>

          <div className="mt-auto space-y-3 pt-4">
            <div data-testid="sidebar-user-box" className="rounded-xl bg-black/25 p-3 ring-1 ring-white/15">
              <div className="text-xs text-white/80">Logado como</div>
              <div data-testid="sidebar-user-name" className="truncate text-sm text-white">
                {user?.displayName || user?.email || "—"}
              </div>
              <div data-testid="sidebar-user-username" className="truncate text-xs text-white/80">
                {user?.email || ""}
              </div>
            </div>

            <Button
              data-testid="logout-button"
              variant="outline"
              className="w-full justify-start rounded-xl border-white/25 bg-black/15 text-white hover:bg-black/25"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>

            <div data-testid="sidebar-route-indicator" className="text-[11px] text-white/70">
              {location.pathname}
            </div>
          </div>
        </aside>

        <main data-testid="app-main" className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
