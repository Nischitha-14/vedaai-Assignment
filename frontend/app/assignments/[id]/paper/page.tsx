import { QuestionPaperPage } from "@/components/paper/question-paper-page";

export default function AssignmentPaperRoute({
  params
}: {
  params: { id: string };
}) {
  return <QuestionPaperPage assignmentId={params.id} />;
}
