import { describe, expect, it } from "vitest";
import { generateLocalQuestionPaper } from "../services/localGenerationService";

const assignment = {
  _id: "assignment-1",
  title: "Quiz on Electricity",
  subject: "Physics",
  gradeLevel: "Class 10",
  dueDate: new Date(),
  questionTypes: [
    { type: "MCQ", count: 2, marks: 1 },
    { type: "Short Answer", count: 2, marks: 3 }
  ],
  additionalInstructions: "Focus on current, voltage, resistance, and Ohm law.",
  difficulty: "mixed",
  totalQuestions: 4,
  sourceText: "Ohm law connects current, voltage, and resistance.",
  status: "pending"
} as const;

describe("generateLocalQuestionPaper", () => {
  it("creates sections, questions, and answer keys that match the assignment", () => {
    const paper = generateLocalQuestionPaper(assignment as never, "VedaAI Public School");

    expect(paper.sections).toHaveLength(2);
    expect(paper.sections[0]?.title).toBe("Section A");
    expect(paper.sections[1]?.title).toBe("Section B");
    expect(paper.answerKey).toHaveLength(4);
    expect(paper.maxMarks).toBe(8);
    expect(paper.sections[0]?.questions[0]?.options).toHaveLength(4);
  });
});
