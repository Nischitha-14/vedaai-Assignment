import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/types/assignment";

const statusMap: Record<AssignmentStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700"
  },
  processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-700"
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700"
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700"
  }
};

export const StatusBadge = ({ status }: { status: AssignmentStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/5",
      statusMap[status].className
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {statusMap[status].label}
  </span>
);
