import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RunDetailContent } from "@/components/RunDetailContent";

// Full-page route for /runs/:id (deep link). The list view opens the same
// content in a drawer; here it gets page chrome (a back link).
export function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/runs"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to runs
      </Link>
      {id === undefined ? (
        <div className="text-sm text-red-700">Invalid run id</div>
      ) : (
        <RunDetailContent runId={id} />
      )}
    </div>
  );
}
