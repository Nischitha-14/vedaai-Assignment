import { describe, expect, it } from "vitest";
import { parseCreateAssignmentPayload } from "../validation/assignment";

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

describe("parseCreateAssignmentPayload", () => {
  it("parses multipart-style form data and normalizes question types", () => {
    const dueDate = addDays(new Date(), 2).toISOString();

    const result = parseCreateAssignmentPayload({
      title: "Unit Test Assignment",
      subject: "Science",
      gradeLevel: "Class 8",
      dueDate,
      additionalInstructions: "Focus on diagrams.",
      difficulty: "mixed",
      questionTypes: JSON.stringify([
        { type: "mcq", count: 4, marks: 1 },
        { type: "short answer", count: 2, marks: 3 }
      ])
    });

    expect(result.questionTypes).toEqual([
      { type: "MCQ", count: 4, marks: 1 },
      { type: "Short Answer", count: 2, marks: 3 }
    ]);
  });

  it("rejects past due dates", () => {
    expect(() =>
      parseCreateAssignmentPayload({
        title: "Past Assignment",
        subject: "Maths",
        gradeLevel: "Class 6",
        dueDate: new Date("2020-01-01").toISOString(),
        additionalInstructions: "",
        difficulty: "easy",
        questionTypes: JSON.stringify([{ type: "mcq", count: 2, marks: 1 }])
      })
    ).toThrowError(/future/i);
  });
});
