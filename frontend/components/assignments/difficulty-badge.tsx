import { cn } from "@/lib/utils";
import type { QuestionDifficulty } from "@/types/assignment";

const difficultyClasses: Record<QuestionDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700"
};

export const DifficultyBadge = ({
  difficulty
}: {
  difficulty: QuestionDifficulty;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-black/5",
      difficultyClasses[difficulty]
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {difficulty}
  </span>
);
