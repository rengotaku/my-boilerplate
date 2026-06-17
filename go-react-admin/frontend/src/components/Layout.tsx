import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarClock,
  FileText,
  ListChecks,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Activity;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/runs", label: "Runs", icon: ListChecks },
  { to: "/jobs", label: "Jobs", icon: CalendarClock },
  { to: "/metrics", label: "Metrics", icon: BarChart3 },
  { to: "/logs", label: "Logs", icon: FileText },
  { to: "/config", label: "Config", icon: Settings },
];

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <Activity className="h-5 w-5 text-indigo-500" />
          <span>Admin Console</span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-x-hidden px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
