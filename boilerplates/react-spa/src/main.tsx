import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Order matters: reset -> components -> theme. The theme CSS is scoped to
// [data-astryx-theme], which index.html sets on <html>.
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";
import "./index.css";

import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

import App from "./App.tsx";
import { RouterLink } from "@/components/RouterLink";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={neutralTheme} mode="system">
      <LinkProvider component={RouterLink}>
        <App />
      </LinkProvider>
    </Theme>
  </StrictMode>
);
