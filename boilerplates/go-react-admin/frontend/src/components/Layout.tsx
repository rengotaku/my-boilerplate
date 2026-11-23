import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavHeading, SideNavItem } from "@astryxdesign/core/SideNav";
import {
  Activity,
  BarChart3,
  CalendarClock,
  FileText,
  ListChecks,
  Settings,
} from "lucide-react";

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

const COLLAPSE_KEY = "admin.sidebar.collapsed";

// localStorage may be unavailable (SSR, some test envs), so access it defensively.
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // ignore persistence failures
  }
}

export function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);

  const onCollapsedChange = (next: boolean) => {
    setCollapsed(next);
    writeCollapsed(next);
  };

  return (
    <AppShell
      height="fill"
      variant="surface"
      sideNav={
        <SideNav
          header={<SideNavHeading heading="Admin Console" icon={<Activity />} />}
          collapsible={{
            isCollapsed: collapsed,
            onCollapsedChange,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const selected =
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);
            return (
              <SideNavItem
                key={item.to}
                label={item.label}
                href={item.to}
                icon={item.icon}
                isSelected={selected}
              />
            );
          })}
        </SideNav>
      }
    >
      <div className="page">
        <Outlet />
      </div>
    </AppShell>
  );
}
