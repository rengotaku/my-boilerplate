import { Link as RouterLink } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { TailwindDemo } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  const features = [
    "Vite + TypeScript",
    "React Router",
    "TanStack Query (API state)",
    "Zustand (UI state)",
    "ky (HTTP client)",
    "Vitest + Testing Library",
    "shadcn/ui + Tailwind CSS",
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">React SPA Boilerplate</h1>

      <Card className="max-w-sm mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-3">Features</h2>
          <ul className="space-y-1">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <CircleCheck className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button asChild>
        <RouterLink to="/users">Users</RouterLink>
      </Button>

      <TailwindDemo />
    </div>
  );
}
