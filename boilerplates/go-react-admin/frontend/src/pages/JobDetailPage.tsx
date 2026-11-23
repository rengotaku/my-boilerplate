import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { JobDetailContent } from "@/components/JobDetailContent";

// Full-page route for /jobs/:id (deep link). The list view opens the same
// content in a drawer; here it gets page chrome (a back link).
export function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = params.id ? Number(params.id) : undefined;

  return (
    <VStack gap={4}>
      <div>
        <Button
          label="Back to jobs"
          href="/jobs"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft />}
        />
      </div>
      {id === undefined ? (
        <Banner status="error" title="Invalid job id" />
      ) : (
        <JobDetailContent
          jobId={id}
          onEdit={() => navigate(`/jobs/${id}/edit`)}
          onDeleted={() => navigate("/jobs")}
        />
      )}
    </VStack>
  );
}
