import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="text-center mt-16">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl text-muted-foreground mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <RouterLink to="/">Go to Home</RouterLink>
      </Button>
    </div>
  );
}
