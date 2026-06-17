import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { JobDetailContent } from "@/components/JobDetailContent";

// Full-page route for /jobs/:id (deep link). The list view opens the same
// content in a drawer; here it gets page chrome (a back link).
export function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = params.id ? Number(params.id) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>
      {id === undefined ? (
        <div className="text-sm text-red-700">Invalid job id</div>
      ) : (
        <JobDetailContent
          jobId={id}
          onEdit={() => navigate(`/jobs/${id}/edit`)}
          onDeleted={() => navigate("/jobs")}
        />
      )}
    </div>
  );
}
