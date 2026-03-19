import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  buildQuestionTypes,
  createAssignmentFormSchema,
  getDefaultAssignmentFormValues
} from "@/lib/validation";

describe("createAssignmentFormSchema", () => {
  it("accepts a valid assignment payload", () => {
    const values = {
      ...getDefaultAssignmentFormValues(),
      title: "Quiz on Electricity",
      subject: "Physics",
      gradeLevel: "Class 10",
      dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd")
    };
    const result = createAssignmentFormSchema.safeParse(values);

    expect(result.success).toBe(true);
    expect(buildQuestionTypes(values)).toHaveLength(2);
  });

  it("rejects past due dates", () => {
    const values = {
      ...getDefaultAssignmentFormValues(),
      dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd")
    };

    const result = createAssignmentFormSchema.safeParse(values);

    expect(result.success).toBe(false);
  });

  it("requires at least one enabled question type", () => {
    const values = {
      ...getDefaultAssignmentFormValues(),
      dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd"),
      questionConfigs: {
        mcq: { enabled: false, count: 1, marks: 1 },
        shortAnswer: { enabled: false, count: 1, marks: 1 },
        longAnswer: { enabled: false, count: 1, marks: 1 }
      }
    };

    const result = createAssignmentFormSchema.safeParse(values);

    expect(result.success).toBe(false);
  });
});
