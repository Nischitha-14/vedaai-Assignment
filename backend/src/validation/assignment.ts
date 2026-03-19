import { z } from "zod";
import { normalizeQuestionTypeLabel } from "../utils/questionTypes";

const questionTypeSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1)
    .transform((value) => normalizeQuestionTypeLabel(value)),
  count: z.coerce.number().int().min(1).max(50),
  marks: z.coerce.number().int().min(1).max(20)
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Assignment title is required."),
  subject: z.string().trim().min(1, "Subject is required."),
  gradeLevel: z.string().trim().min(1, "Grade/Class is required."),
  dueDate: z.coerce
    .date()
    .refine((date) => date.getTime() > Date.now(), "Due date must be in the future."),
  additionalInstructions: z.string().trim().default(""),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  questionTypes: z.array(questionTypeSchema).min(1, "Select at least one question type.")
});

const parseQuestionTypes = (value: unknown) => {
  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
};

export const parseCreateAssignmentPayload = (body: Record<string, unknown>) =>
  createAssignmentSchema.parse({
    ...body,
    questionTypes: parseQuestionTypes(body.questionTypes)
  });
