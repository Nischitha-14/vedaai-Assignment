"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Sparkles,
  Waves,
  XCircle
} from "lucide-react";
import { getAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/stores/assignment-store";
import { StatusBadge } from "./status-badge";
import type { Assignment } from "@/types/assignment";
import { Button } from "@/components/ui/button";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const enableRealtime =
  (process.env.NEXT_PUBLIC_ENABLE_WS ?? "true") !== "false" && Boolean(wsUrl);

export const ProgressPage = ({ assignmentId }: { assignmentId: string }) => {
  const router = useRouter();
  const setPaper = useAssignmentStore((state) => state.setPaper);
  const jobStatus = useAssignmentStore((state) => state.jobStatus);
  const updateJobStatus = useAssignmentStore((state) => state.updateJobStatus);
  const resetJobStatus = useAssignmentStore((state) => state.resetJobStatus);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const redirectedRef = useRef(false);
  const progressRef = useRef(jobStatus.progress);

  useEffect(() => {
    progressRef.current = jobStatus.progress;
  }, [jobStatus.progress]);

  useEffect(() => {
    resetJobStatus();
    updateJobStatus({
      progress: 5,
      message: "Queued for generation...",
      status: "pending"
    });
  }, [resetJobStatus, updateJobStatus]);

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;

    const syncAssignment = async () => {
      try {
        const assignmentResponse = await getAssignment(assignmentId);
        if (!active) {
          return;
        }

        setAssignment(assignmentResponse);
        setPageError(null);

        if (
          assignmentResponse.status === "completed" &&
          assignmentResponse.result &&
          !redirectedRef.current
        ) {
          redirectedRef.current = true;
          setPaper(assignmentResponse.result);
          updateJobStatus({
            progress: 100,
            message: "Question paper ready.",
            status: "completed"
          });
          router.replace(`/assignments/${assignmentId}/paper`);
          return;
        }

        if (assignmentResponse.status === "failed") {
          updateJobStatus({
            status: "failed",
            message:
              assignmentResponse.jobMessage ||
              assignmentResponse.lastError ||
              "Generation failed.",
            progress: Math.max(progressRef.current, assignmentResponse.jobProgress || 20)
          });
          return;
        }

        if (assignmentResponse.status === "processing") {
          updateJobStatus({
            status: "processing",
            message: assignmentResponse.jobMessage || "Generating question paper...",
            progress: Math.max(progressRef.current, assignmentResponse.jobProgress || 20)
          });
        }

        if (assignmentResponse.status === "pending") {
          updateJobStatus({
            status: "pending",
            message: assignmentResponse.jobMessage || "Queued for generation...",
            progress: Math.max(progressRef.current, assignmentResponse.jobProgress || 5)
          });
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setPageError(error instanceof Error ? error.message : "Unable to load assignment progress.");
      }
    };

    void syncAssignment();
    const interval = window.setInterval(() => {
      void syncAssignment();
    }, 4000);

    if (enableRealtime) {
      socket = io(wsUrl, {
        transports: ["websocket"]
      });

      socket.on("connect", () => {
        socket?.emit("assignment:join", assignmentId);
      });

      socket.on("job:progress", (event) => {
        if (event.assignmentId !== assignmentId) {
          return;
        }

        updateJobStatus({
          progress: event.progress,
          message: event.message,
          status: event.status
        });
      });

      socket.on("job:completed", (event) => {
        if (event.assignmentId !== assignmentId || redirectedRef.current) {
          return;
        }

        redirectedRef.current = true;
        setPaper(event.result);
        updateJobStatus({
          progress: 100,
          message: "Question paper ready.",
          status: "completed"
        });
        router.replace(`/assignments/${assignmentId}/paper`);
      });

      socket.on("job:failed", (event) => {
        if (event.assignmentId !== assignmentId) {
          return;
        }

        updateJobStatus({
          status: "failed",
          message: event.message,
          progress: Math.max(progressRef.current, 20)
        });
      });
    }

    return () => {
      active = false;
      window.clearInterval(interval);
      if (enableRealtime) {
        socket?.emit("assignment:leave", assignmentId);
      }
      socket?.disconnect();
    };
  }, [assignmentId, router, setPaper, updateJobStatus]);

  const milestones = useMemo(
    () => [
      {
        label: "Queued",
        detail: "Job accepted and room attached",
        complete: jobStatus.progress >= 5
      },
      {
        label: "Generating questions",
        detail: "Preparing the assessment draft",
        complete: jobStatus.progress >= 25
      },
      {
        label: "Structuring sections",
        detail: "Formatting sections and answer keys",
        complete: jobStatus.progress >= 70
      },
      {
        label: "Saving paper",
        detail: "Persisting the final result",
        complete: jobStatus.progress >= 90
      },
      {
        label: "Completed",
        detail: "Ready to view and download",
        complete: jobStatus.progress >= 100
      }
    ],
    [jobStatus.progress]
  );

  const progressGradient = `conic-gradient(#f5a623 ${jobStatus.progress * 3.6}deg, rgba(255,255,255,0.08) 0deg)`;

  return (
    <div className="page-enter mx-auto max-w-6xl space-y-6">
      <section className="dark-glass overflow-hidden rounded-[38px] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Live generation progress
            </span>
            <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
              {assignment?.title || "Preparing assignment"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {assignment
                ? `${assignment.subject} / ${assignment.gradeLevel}`
                : "Fetching assignment details and joining the live job room..."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {assignment ? <StatusBadge status={assignment.status} /> : null}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
                <Waves className="h-4 w-4 text-brand" />
                {jobStatus.message}
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Runtime status</span>
                <span className="font-semibold">{jobStatus.progress}%</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand via-[#ffcf7a] to-white transition-all duration-500"
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative flex h-[250px] w-[250px] items-center justify-center rounded-full p-4 shadow-[0_18px_80px_rgba(245,166,35,0.18)]">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: progressGradient
                }}
              />
              <div className="absolute inset-5 rounded-full border border-white/10" />
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full bg-[#121212] text-center">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Generation
                </span>
                <span className="mt-3 text-6xl font-semibold text-white">{jobStatus.progress}</span>
                <span className="mt-1 text-sm text-white/65">percent complete</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="glass-surface rounded-[34px] p-6 shadow-card">
          <h2 className="text-xl font-semibold text-slate-950">Generation stages</h2>
          <div className="mt-6 space-y-4">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.label}
                className="flex items-start gap-4 rounded-[26px] border border-white/60 bg-white/80 px-4 py-4"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  {jobStatus.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-300" />
                  ) : milestone.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <LoaderCircle className="h-5 w-5 animate-spin text-brand" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{milestone.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{milestone.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-slate-950">What happens next</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 h-4 w-4 text-brand-dark" />
                <p>Questions are grouped into exam-ready sections with clear instructions.</p>
              </div>
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 h-4 w-4 text-brand-dark" />
                <p>Answer keys are attached to the structured output for review and export.</p>
              </div>
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 h-4 w-4 text-brand-dark" />
                <p>The paper view opens automatically the moment the job completes.</p>
              </div>
            </div>

            {jobStatus.status === "failed" ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
                {jobStatus.message}
              </div>
            ) : null}
          </div>

          <div className="rounded-[34px] border border-white/70 bg-gradient-to-br from-white to-[#fff8ea] p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Exit</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">Need to step away?</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You can return to the assignments list at any time. The job will keep processing in the background.
            </p>
            <div className="mt-6">
              <Link href="/assignments">
                <Button variant="ghost">Back to Assignments</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
