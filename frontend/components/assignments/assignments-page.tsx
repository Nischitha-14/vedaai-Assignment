"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ClipboardPlus,
  FileStack,
  Layers3,
  Sparkles,
  TimerReset
} from "lucide-react";
import { format } from "date-fns";
import { listAssignments } from "@/lib/api";
import { useAssignmentStore } from "@/stores/assignment-store";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/types/assignment";

const getAssignmentTarget = (assignment: Assignment) =>
  assignment.status === "completed"
    ? `/assignments/${assignment._id}/paper`
    : `/assignments/${assignment._id}/progress`;

const statusAccent: Record<Assignment["status"], string> = {
  pending: "from-slate-400 to-slate-200",
  processing: "from-amber-500 to-yellow-300",
  completed: "from-emerald-500 to-emerald-200",
  failed: "from-red-500 to-rose-200"
};

export const AssignmentsPage = () => {
  const assignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAssignments = async () => {
      try {
        const data = await listAssignments();
        if (!active) {
          return;
        }

        setAssignments(data);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load assignments.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadAssignments();
    const interval = window.setInterval(() => {
      void loadAssignments();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [setAssignments]);

  const activeCount = assignments.filter(
    (assignment) => assignment.status === "processing" || assignment.status === "pending"
  ).length;
  const completedCount = assignments.filter((assignment) => assignment.status === "completed").length;
  const latestAssignment = assignments[0];

  return (
    <div className="page-enter space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[40px] border border-white/70 bg-gradient-to-br from-white via-[#fff8ed] to-[#ffe0ae] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(17,24,39,0.06),transparent_42%)]" />
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full border border-white/60" />
          <div className="absolute bottom-6 right-10 h-16 w-16 rounded-full bg-white/55 backdrop-blur" />

          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-brand-dark" />
            AI Assessment Studio
          </span>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            Clean, bold assessment workflows with a warmer teacher-first feel.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Build structured exams, monitor generation live, and deliver printable papers without sacrificing presentation quality.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/assignments/create">
              <Button variant="primary" className="gap-2">
                <ClipboardPlus className="h-4 w-4" />
                Create Assignment
              </Button>
            </Link>
            <div className="glass-surface inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm text-slate-600">
              <Layers3 className="h-4 w-4 text-brand-dark" />
              Claude-backed generation with structured JSON output
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="relative overflow-hidden rounded-[34px] bg-[#151515] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-white/10" />
            <div className="absolute right-8 top-8 h-16 w-16 rounded-full border border-white/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Studio overview</p>
            <p className="mt-4 text-4xl font-semibold">{assignments.length}</p>
            <p className="mt-2 text-sm text-white/65">Total assignments created</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand via-[#ffcf7d] to-white"
                style={{
                  width: `${assignments.length ? Math.max((completedCount / assignments.length) * 100, 18) : 18}%`
                }}
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">In motion</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{activeCount}</p>
            <p className="mt-1 text-sm text-slate-500">Assignments currently queued or processing</p>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Latest activity</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {latestAssignment ? latestAssignment.title : "No activity yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {latestAssignment
                ? `${latestAssignment.subject} / ${latestAssignment.gradeLevel}`
                : "Create your first assignment to start the feed"}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Assignments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent papers, generation states, and ready-to-open outputs.
            </p>
          </div>
          <Link href="/assignments/create">
            <Button variant="secondary" className="gap-2">
              <ClipboardPlus className="h-4 w-4" />
              New Assignment
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[30px] border border-white/70 bg-white/70 shadow-card"
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="glass-surface rounded-[34px] p-10 text-center shadow-card">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-brand-soft to-white">
              <FileStack className="h-8 w-8 text-brand-dark" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-950">No assignments yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Start with one polished assessment and VedaAI will build the full paper flow from there.
            </p>
            <Link href="/assignments/create" className="mt-6 inline-flex">
              <Button variant="primary" className="gap-2">
                <ClipboardPlus className="h-4 w-4" />
                Create Assignment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="group relative overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                    statusAccent[assignment.status]
                  )}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {assignment.subject}
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-950">{assignment.title}</h3>
                    <p className="text-sm text-slate-500">{assignment.gradeLevel}</p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {assignment.questionTypes.map((questionType) => (
                    <span
                      key={`${assignment._id}-${questionType.type}`}
                      className="rounded-full bg-[#fff7ea] px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {questionType.type} {questionType.count} x {questionType.marks}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Questions
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{assignment.totalQuestions}</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Difficulty
                    </p>
                    <p className="mt-3 text-lg font-semibold capitalize text-slate-950">
                      {assignment.difficulty}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Due</p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      {format(new Date(assignment.dueDate), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-[26px] bg-gradient-to-r from-slate-50 to-[#fff8eb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4 text-brand-dark" />
                    Updated {format(new Date(assignment.updatedAt), "dd MMM, hh:mm a")}
                  </span>
                  <Link
                    href={getAssignmentTarget(assignment)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition group-hover:text-brand-dark"
                  >
                    {assignment.status === "completed" ? "Open paper" : "Track progress"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <TimerReset className="h-3.5 w-3.5" />
                    Live status
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
