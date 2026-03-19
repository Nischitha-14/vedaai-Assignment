import { randomUUID } from "crypto";
import { z } from "zod";
import type { AssignmentDocument } from "../models/Assignment";
import type {
  AnswerKeyEntry,
  QuestionPaper,
  QuestionPaperQuestion,
  QuestionTypeConfig
} from "../types/assignment";
import {
  calculateTotalMarks,
  getSectionInstruction,
  getSectionTitle,
  normalizeQuestionTypeLabel,
  resolveQuestionDifficulty,
  sortQuestionTypes
} from "./questionTypes";

const aiQuestionSchema = z.object({
  id: z.string().trim().optional(),
  text: z.string().trim().min(1),
  type: z.string().trim().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.coerce.number().int().positive(),
  options: z.array(z.string().trim().min(1)).optional()
});

const aiSectionSchema = z.object({
  title: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
  questions: z.array(aiQuestionSchema).min(1)
});

const aiQuestionPaperSchema = z.object({
  sections: z.array(aiSectionSchema).min(1),
  answerKey: z.array(
    z.object({
      questionId: z.string().trim().min(1),
      answer: z.string().trim().min(1)
    })
  )
});

const extractJsonPayload = (rawResponse: string) => {
  const stripped = rawResponse
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Claude response did not include a valid JSON object.");
  }

  return stripped.slice(firstBrace, lastBrace + 1);
};

const buildAnswerKeyMap = (answerKey: AnswerKeyEntry[]) =>
  new Map(answerKey.map((entry) => [entry.questionId, entry.answer]));

const normalizeQuestion = (
  assignment: AssignmentDocument,
  questionType: QuestionTypeConfig,
  question: z.infer<typeof aiQuestionSchema>,
  index: number
): QuestionPaperQuestion => {
  const type = normalizeQuestionTypeLabel(question.type);

  return {
    id: question.id?.trim() || randomUUID(),
    text: question.text.trim(),
    type,
    difficulty: question.difficulty || resolveQuestionDifficulty(assignment.difficulty, index),
    marks: questionType.marks,
    options: type === "MCQ" ? question.options?.slice(0, 4) : undefined
  };
};

const getDuration = (totalMarks: number) => `${Math.max(45, Math.ceil(totalMarks * 1.8))} minutes`;

export const normalizeAiQuestionPaper = (
  assignment: AssignmentDocument,
  rawResponse: string,
  schoolName: string
): QuestionPaper => {
  const parsed = aiQuestionPaperSchema.parse(JSON.parse(extractJsonPayload(rawResponse)));
  const answerKeyMap = buildAnswerKeyMap(parsed.answerKey);
  const flattenedQuestions = parsed.sections.flatMap((section) => section.questions);
  const orderedQuestionTypes = sortQuestionTypes(
    assignment.questionTypes.map((questionType) => ({
      type: questionType.type,
      count: questionType.count,
      marks: questionType.marks
    }))
  );

  const sections = orderedQuestionTypes.map((questionType) => {
    const matchingQuestions = flattenedQuestions.filter(
      (question) => normalizeQuestionTypeLabel(question.type) === questionType.type
    );

    if (matchingQuestions.length < questionType.count) {
      throw new Error(
        `Claude response did not generate enough ${questionType.type} questions.`
      );
    }

    const questions = matchingQuestions
      .slice(0, questionType.count)
      .map((question, index) => normalizeQuestion(assignment, questionType, question, index));

    return {
      title: getSectionTitle(questionType.type),
      instruction: getSectionInstruction(questionType.type),
      questions
    };
  });

  const answerKey = sections.flatMap((section) =>
    section.questions.map((question) => ({
      questionId: question.id,
      answer:
        answerKeyMap.get(question.id) ||
        (question.type === "MCQ" ? question.options?.[0] || "Option A" : "See model answer.")
    }))
  );

  const totalMarks = calculateTotalMarks(orderedQuestionTypes);

  return {
    assignmentId: String(assignment._id),
    schoolName,
    subject: assignment.subject,
    class: assignment.gradeLevel,
    maxMarks: totalMarks,
    duration: getDuration(totalMarks),
    sections,
    answerKey
  };
};
