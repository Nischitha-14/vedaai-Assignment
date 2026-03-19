"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { getAssignment, getQuestionPaper, getQuestionPaperPdfUrl, regenerateAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/stores/assignment-store";
import type { Assignment } from "@/types/assignment";
import { QuestionPaperView } from "./question-paper-view";
import { Button } from "@/components/ui/button";

export const QuestionPaperPage = ({ assignmentId }: { assignmentId: string }) => {
  const router = useRouter();
  const currentPaper = useAssignmentStore((state) => state.currentPaper);
  const setPaper = useAssignmentStore((state) => state.setPaper);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPaper = async () => {
      try {
        const assignmentResponse = await getAssignment(assignmentId);
        if (!active) {
          return;
        }

        setAssignment(assignmentResponse);

        if (assignmentResponse.status !== "completed") {
          if (assignmentResponse.status === "pending" || assignmentResponse.status === "processing") {
            router.replace(`/assignments/${assignmentId}/progress`);
            return;
          }

          throw new Error(assignmentResponse.lastError || "Question paper is not available.");
        }

        const paper = assignmentResponse.result || (await getQuestionPaper(assignmentId));

        if (!active) {
          return;
        }

        setPaper(paper);
        setPageError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setPageError(error instanceof Error ? error.message : "Unable to load question paper.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadPaper();

    return () => {
      active = false;
    };
  }, [assignmentId, router, setPaper]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      await regenerateAssignment(assignmentId);
      router.push(`/assignments/${assignmentId}/progress`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to regenerate assignment.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    window.open(getQuestionPaperPdfUrl(assignmentId), "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-[34px] bg-white shadow-card" />;
  }

  if (pageError || !assignment || !currentPaper) {
    return (
      <div className="mx-auto max-w-3xl rounded-[34px] bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900">Paper unavailable</h1>
        <p className="mt-3 text-sm text-slate-500">{pageError || "The question paper could not be loaded."}</p>
        <Link href="/assignments" className="mt-6 inline-flex">
          <Button variant="primary">Back to Assignments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <section className="rounded-[34px] border border-white/70 bg-gradient-to-br from-white via-[#fff8ec] to-[#ffe0ae] p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-brand-dark" />
              Generated paper
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-slate-950 sm:text-4xl">{assignment.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review the final paper, regenerate when needed, or export a clean printable PDF.
            </p>
          </div>
          <div className="rounded-[24px] bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-sm">
            {assignment.subject} / {assignment.gradeLevel}
          </div>
        </div>
      </section>

      <QuestionPaperView assignmentTitle={assignment.title} paper={currentPaper} />

      <div className="glass-surface sticky bottom-4 z-20 flex flex-col gap-3 rounded-[28px] p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Question paper actions</p>
          <p className="text-sm text-slate-500">Regenerate the assessment or download a printable PDF.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="gap-2" onClick={handleRegenerate} disabled={isRegenerating}>
            <RefreshCw className="h-4 w-4" />
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
          <Button variant="secondary" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
