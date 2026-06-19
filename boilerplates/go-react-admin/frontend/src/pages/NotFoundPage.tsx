import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="text-slate-500">This page could not be found.</p>
      <Link to="/runs" className="text-sm text-indigo-600 hover:underline">
        Go to Runs
      </Link>
    </div>
  );
}
