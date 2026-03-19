import { ProgressPage } from "@/components/assignments/progress-page";

export default function AssignmentProgressRoute({
  params
}: {
  params: { id: string };
}) {
  return <ProgressPage assignmentId={params.id} />;
}
