import { Outlet, Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <span className="text-lg font-semibold flex-1">React SPA</span>
            <nav className="flex gap-1">
              <Button
                variant="ghost"
                asChild
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
              >
                <RouterLink to="/">Home</RouterLink>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
              >
                <RouterLink to="/users">Users</RouterLink>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
