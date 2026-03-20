import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div>
      <h1>React SPA Boilerplate</h1>
      <p>A minimal React SPA template with:</p>
      <ul>
        <li>Vite + TypeScript</li>
        <li>React Router</li>
        <li>TanStack Query (API state)</li>
        <li>Zustand (UI state)</li>
        <li>ky (HTTP client)</li>
        <li>Vitest + Testing Library</li>
      </ul>
      <nav>
        <Link to="/users">Users</Link>
      </nav>
    </div>
  );
}
