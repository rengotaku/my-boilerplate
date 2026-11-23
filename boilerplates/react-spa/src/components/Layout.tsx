import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { TopNav, TopNavItem } from "@astryxdesign/core/TopNav";

import { useAuthStore } from "@/hooks";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const pathname = location.pathname;

  return (
    <AppShell
      height="auto"
      variant="surface"
      topNav={
        <TopNav
          label="Main"
          heading={<Text weight="semibold">React SPA</Text>}
          startContent={
            <>
              <TopNavItem label="Home" href="/" isSelected={pathname === "/"} />
              <TopNavItem
                label="Users"
                href="/users"
                isSelected={pathname === "/users" || pathname.startsWith("/users/")}
              />
            </>
          }
          endContent={
            token ? (
              <Button label="Logout" variant="ghost" size="sm" onClick={handleLogout} />
            ) : (
              <TopNavItem
                label="Login"
                href="/login"
                isSelected={pathname === "/login"}
              />
            )
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
