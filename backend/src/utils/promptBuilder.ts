import type { AssignmentDocument } from "../models/Assignment";
import { sortQuestionTypes } from "./questionTypes";

const truncate = (value: string | null | undefined, maxLength: number) => {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

export const buildGenerationPrompt = (assignment: AssignmentDocument) => {
  const orderedQuestionTypes = sortQuestionTypes(
    assignment.questionTypes.map((questionType) => ({
      type: questionType.type,
      count: questionType.count,
      marks: questionType.marks
    }))
  );

  const requirements = orderedQuestionTypes
    .map(
      (questionType) =>
        `- ${questionType.count} ${questionType.type} questions worth ${questionType.marks} marks each`
    )
    .join("\n");

  const additionalInstructions = assignment.additionalInstructions.trim()
    ? assignment.additionalInstructions.trim()
    : "Follow the relevant curriculum and include age-appropriate phrasing.";

  const sourceMaterial = truncate(assignment.sourceText, 6000);

  return `
You are an expert teacher. Generate a question paper for:
Subject: ${assignment.subject}
Grade: ${assignment.gradeLevel}
Topic: ${additionalInstructions}
Requirements:
${requirements}
- Difficulty: ${assignment.difficulty}
- Group into sections (Section A = MCQ, Section B = Short Answer, Section C = Long Answer)

${sourceMaterial ? `Reference material excerpt:\n${sourceMaterial}\n` : ""}
Return ONLY valid JSON in this exact format:
{
  "sections": [{
    "title": "string",
    "instruction": "string",
    "questions": [{
      "id": "string",
      "text": "string",
      "type": "MCQ | Short Answer | Long Answer",
      "difficulty": "easy | medium | hard",
      "marks": 1,
      "options": ["string"] // only for MCQ
    }]
  }],
  "answerKey": [{
    "questionId": "string",
    "answer": "string"
  }]
}
`.trim();
};
