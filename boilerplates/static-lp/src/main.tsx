import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// ビルド時プリレンダリング（scripts/prerender.mjs）により #root に静的 HTML が
// 埋め込まれている場合は hydrateRoot でハイドレートし、既存 DOM を再利用する。
// dev サーバー等、#root が空の場合は従来どおり createRoot で新規レンダーする。
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
