import type { GlobalProvider } from "@ladle/react";
import "../src/index.css";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="p-6">{children}</div>
);
