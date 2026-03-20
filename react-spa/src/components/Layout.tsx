import { Outlet, Link } from "react-router-dom";

export function Layout() {
  return (
    <div className="app">
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
