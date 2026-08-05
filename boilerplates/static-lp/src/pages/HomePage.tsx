import { Link as RouterLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const FEATURES = [
  "Vite 8 + TypeScript 5.9",
  "React 19 + React Router",
  "Tailwind CSS v4 + shadcn/ui",
  "ビルド時プリレンダリング（SSG）で SEO 対応",
  "Vitest + Testing Library",
  "Cloudflare Pages デプロイ",
];

/**
 * LP のトップページ（プレースホルダ）。
 *
 * scaffold 後、見出し・本文・Features はプロジェクトの実際の訴求内容に差し替えること。
 */
export function HomePage() {
  return (
    <div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Static LP Boilerplate</h1>

      <p className="mb-6 text-muted-foreground">
        ビルド時プリレンダリング（SSG）済みの静的 HTML を配信する、SEO 向け React SPA
        ボイラープレートです。{" "}
        <a href="#features" className="underline underline-offset-4">
          Features を見る
        </a>
      </p>

      <Card id="features" className="mb-6 max-w-md">
        <CardHeader>
          <h2 className="text-lg font-semibold leading-none tracking-tight">Features</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <RouterLink to="/privacy">プライバシーポリシー</RouterLink>
      </Button>
    </div>
  );
}
