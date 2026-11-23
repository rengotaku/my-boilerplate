import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Text } from "@astryxdesign/core/Text";
import { TopNav, TopNavItem } from "@astryxdesign/core/TopNav";

export function Layout() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <AppShell
      height="auto"
      variant="surface"
      topNav={
        <TopNav
          label="Main"
          heading={<Text weight="semibold">React SPA Cloudflare</Text>}
          startContent={
            <>
              <TopNavItem label="Home" href="/" isSelected={pathname === "/"} />
              <TopNavItem
                label="About"
                href="/about"
                isSelected={pathname === "/about"}
              />
              <TopNavItem
                label="Greeting"
                href="/greeting"
                isSelected={pathname === "/greeting" || pathname.startsWith("/greeting/")}
              />
            </>
          }
        />
      }
    >
      <div className="page">
        <Outlet />
      </div>
    </AppShell>
  );
}
