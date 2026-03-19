import type {
  Difficulty,
  QuestionDifficulty,
  QuestionTypeConfig,
  QuestionTypeName
} from "../types/assignment";

const QUESTION_TYPE_ORDER: QuestionTypeName[] = ["MCQ", "Short Answer", "Long Answer"];

const typeAliasMap = new Map<string, QuestionTypeName>([
  ["mcq", "MCQ"],
  ["multiple choice", "MCQ"],
  ["multiple choice question", "MCQ"],
  ["multiple-choice", "MCQ"],
  ["multiple-choice question", "MCQ"],
  ["short answer", "Short Answer"],
  ["short-answer", "Short Answer"],
  ["short", "Short Answer"],
  ["long answer", "Long Answer"],
  ["long-answer", "Long Answer"],
  ["long", "Long Answer"]
]);

export const normalizeQuestionTypeLabel = (value: string): QuestionTypeName => {
  const normalized = value.trim().toLowerCase();
  const resolved = typeAliasMap.get(normalized);

  if (!resolved) {
    throw new Error(`Unsupported question type: ${value}`);
  }

  return resolved;
};

export const sortQuestionTypes = (questionTypes: QuestionTypeConfig[]) =>
  [...questionTypes].sort(
    (left, right) =>
      QUESTION_TYPE_ORDER.indexOf(left.type) - QUESTION_TYPE_ORDER.indexOf(right.type)
  );

export const getSectionTitle = (questionType: QuestionTypeName) => {
  if (questionType === "MCQ") {
    return "Section A";
  }

  if (questionType === "Short Answer") {
    return "Section B";
  }

  return "Section C";
};

export const getSectionInstruction = (questionType: QuestionTypeName) => {
  if (questionType === "MCQ") {
    return "Attempt all multiple-choice questions. Select the most appropriate answer.";
  }

  if (questionType === "Short Answer") {
    return "Answer all questions in concise, well-structured responses.";
  }

  return "Answer all questions with clear reasoning, steps, and examples where relevant.";
};

export const calculateTotalQuestions = (questionTypes: QuestionTypeConfig[]) =>
  questionTypes.reduce((total, item) => total + item.count, 0);

export const calculateTotalMarks = (questionTypes: QuestionTypeConfig[]) =>
  questionTypes.reduce((total, item) => total + item.count * item.marks, 0);

export const resolveQuestionDifficulty = (
  difficulty: Difficulty,
  index: number
): QuestionDifficulty => {
  if (difficulty === "mixed") {
    const rotation: QuestionDifficulty[] = ["easy", "medium", "hard"];
    return rotation[index % rotation.length];
  }

  return difficulty;
};
