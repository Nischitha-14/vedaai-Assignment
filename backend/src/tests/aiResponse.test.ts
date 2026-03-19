import { describe, expect, it } from "vitest";
import { normalizeAiQuestionPaper } from "../utils/aiResponse";

const assignment = {
  _id: "assignment-2",
  title: "Energy Assessment",
  subject: "Science",
  gradeLevel: "Class 7",
  dueDate: new Date(),
  questionTypes: [
    { type: "MCQ", count: 1, marks: 1 },
    { type: "Long Answer", count: 1, marks: 5 }
  ],
  additionalInstructions: "",
  difficulty: "mixed",
  totalQuestions: 2,
  status: "processing"
} as const;

describe("normalizeAiQuestionPaper", () => {
  it("extracts a valid structured question paper from JSON text", () => {
    const rawResponse = JSON.stringify({
      sections: [
        {
          title: "Anything",
          instruction: "Anything",
          questions: [
            {
              id: "mcq-1",
              text: "Which option is correct?",
              type: "MCQ",
              difficulty: "easy",
              marks: 1,
              options: ["Option A", "Option B", "Option C", "Option D"]
            },
            {
              id: "long-1",
              text: "Explain renewable energy with examples.",
              type: "Long Answer",
              difficulty: "hard",
              marks: 5
            }
          ]
        }
      ],
      answerKey: [
        { questionId: "mcq-1", answer: "Option A" },
        { questionId: "long-1", answer: "A complete answer discusses sources and applications." }
      ]
    });

    const paper = normalizeAiQuestionPaper(
      assignment as never,
      rawResponse,
      "VedaAI Public School"
    );

    expect(paper.sections).toHaveLength(2);
    expect(paper.sections[0]?.questions[0]?.type).toBe("MCQ");
    expect(paper.sections[1]?.questions[0]?.type).toBe("Long Answer");
    expect(paper.answerKey).toHaveLength(2);
  });
});
