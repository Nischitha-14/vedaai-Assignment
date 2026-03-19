import { addDays, format } from "date-fns";
import { z } from "zod";
import type { Difficulty, QuestionTypeConfig } from "@/types/assignment";

export const tomorrowDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

const questionToggleSchema = z.object({
  enabled: z.boolean(),
  count: z.coerce.number().int().min(1).max(50),
  marks: z.coerce.number().int().min(1).max(20)
});

const allowedFileTypes = new Set(["application/pdf", "text/plain"]);

export const createAssignmentFormSchema = z
  .object({
    title: z.string().trim().min(1, "Assignment title is required."),
    subject: z.string().trim().min(1, "Subject is required."),
    gradeLevel: z.string().trim().min(1, "Grade/Class is required."),
    dueDate: z
      .string()
      .min(1, "Due date is required.")
      .refine((value) => new Date(value).getTime() > Date.now(), "Due date must be in the future."),
    additionalInstructions: z.string().trim().max(3000).default(""),
    difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
    questionConfigs: z.object({
      mcq: questionToggleSchema,
      shortAnswer: questionToggleSchema,
      longAnswer: questionToggleSchema
    }),
    file: z
      .custom<File | undefined>((value) => value === undefined || value instanceof File, {
        message: "File must be a PDF or TXT document."
      })
      .optional()
      .refine((value) => !value || value.size <= 5 * 1024 * 1024, "File must be 5MB or smaller.")
      .refine(
        (value) =>
          !value ||
          allowedFileTypes.has(value.type) ||
          value.name.toLowerCase().endsWith(".pdf") ||
          value.name.toLowerCase().endsWith(".txt"),
        "Only PDF and TXT files are supported."
      )
  })
  .refine(
    (value) =>
      Object.values(value.questionConfigs).some((questionConfig) => questionConfig.enabled),
    {
      message: "Select at least one question type.",
      path: ["questionConfigs"]
    }
  );

export type CreateAssignmentFormValues = z.infer<typeof createAssignmentFormSchema>;

export const getDefaultAssignmentFormValues = (): CreateAssignmentFormValues => ({
  title: "",
  subject: "",
  gradeLevel: "",
  dueDate: tomorrowDate,
  additionalInstructions: "",
  difficulty: "mixed",
  questionConfigs: {
    mcq: {
      enabled: true,
      count: 5,
      marks: 1
    },
    shortAnswer: {
      enabled: true,
      count: 3,
      marks: 3
    },
    longAnswer: {
      enabled: false,
      count: 2,
      marks: 5
    }
  },
  file: undefined
});

export const buildQuestionTypes = (
  values: CreateAssignmentFormValues
): QuestionTypeConfig[] => {
  const configs: Array<{
    enabled: boolean;
    count: number;
    marks: number;
    type: QuestionTypeConfig["type"];
  }> = [
    {
      enabled: values.questionConfigs.mcq.enabled,
      count: values.questionConfigs.mcq.count,
      marks: values.questionConfigs.mcq.marks,
      type: "MCQ"
    },
    {
      enabled: values.questionConfigs.shortAnswer.enabled,
      count: values.questionConfigs.shortAnswer.count,
      marks: values.questionConfigs.shortAnswer.marks,
      type: "Short Answer"
    },
    {
      enabled: values.questionConfigs.longAnswer.enabled,
      count: values.questionConfigs.longAnswer.count,
      marks: values.questionConfigs.longAnswer.marks,
      type: "Long Answer"
    }
  ];

  return configs
    .filter((config) => config.enabled)
    .map(({ enabled: _enabled, ...config }) => config);
};

export const getDifficultyLabel = (difficulty: Difficulty) =>
  difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
