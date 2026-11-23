import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { RunDetailContent } from "@/components/RunDetailContent";

// Full-page route for /runs/:id (deep link). The list view opens the same
// content in a drawer; here it gets page chrome (a back link).
export function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;

  return (
    <VStack gap={4}>
      <div>
        <Button
          label="Back to runs"
          href="/runs"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft />}
        />
      </div>
      {id === undefined ? (
        <Banner status="error" title="Invalid run id" />
      ) : (
        <RunDetailContent runId={id} />
      )}
    </VStack>
  );
}
