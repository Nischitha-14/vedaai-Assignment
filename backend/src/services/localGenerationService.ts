import { randomUUID } from "crypto";
import type { AssignmentDocument } from "../models/Assignment";
import type {
  AnswerKeyEntry,
  QuestionPaper,
  QuestionPaperQuestion,
  QuestionTypeConfig,
  QuestionTypeName
} from "../types/assignment";
import {
  calculateTotalMarks,
  getSectionInstruction,
  getSectionTitle,
  resolveQuestionDifficulty,
  sortQuestionTypes
} from "../utils/questionTypes";

const STOP_WORDS = new Set([
  "about",
  "after",
  "before",
  "class",
  "could",
  "should",
  "would",
  "their",
  "there",
  "these",
  "those",
  "while",
  "where",
  "topic",
  "grade",
  "subject",
  "teacher",
  "students",
  "using",
  "include",
  "please",
  "create"
]);

const getFocusTopics = (assignment: AssignmentDocument) => {
  const source = `${assignment.additionalInstructions} ${assignment.sourceText || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");

  const tokens = source
    .split(/\s+/)
    .filter((token) => token.length > 4 && !STOP_WORDS.has(token));

  return [...new Set(tokens)].slice(0, 6);
};

const getTopic = (topics: string[], index: number, fallback: string) =>
  topics[index % topics.length] || fallback;

const buildMcqQuestion = (
  assignment: AssignmentDocument,
  marks: number,
  index: number,
  topic: string
): { question: QuestionPaperQuestion; answer: AnswerKeyEntry } => {
  const options = [
    `The core idea behind ${topic} in ${assignment.subject}`,
    `An unrelated concept from another unit`,
    `A partially correct statement with a missing condition`,
    `A common misconception about ${topic}`
  ];

  const id = randomUUID();

  return {
    question: {
      id,
      text: `Q${index + 1}. Which option best explains ${topic} for a ${assignment.gradeLevel} ${assignment.subject} learner?`,
      type: "MCQ",
      difficulty: resolveQuestionDifficulty(assignment.difficulty, index),
      marks,
      options
    },
    answer: {
      questionId: id,
      answer: options[0]
    }
  };
};

const buildConstructedResponseQuestion = (
  assignment: AssignmentDocument,
  type: QuestionTypeName,
  marks: number,
  index: number,
  topic: string
): { question: QuestionPaperQuestion; answer: AnswerKeyEntry } => {
  const id = randomUUID();
  const isShort = type === "Short Answer";
  const directive = isShort ? "Explain briefly" : "Analyze in detail";
  const extension = isShort
    ? "Write 3-4 precise sentences and include one example."
    : "Structure the answer with a definition, key points, and one real-world application.";
  const answer = isShort
    ? `${topic} should be explained clearly with the main concept, one supporting fact, and one example from ${assignment.subject}.`
    : `A strong answer should define ${topic}, describe its major principles, connect it to ${assignment.subject}, and conclude with a real-world example or application.`;

  return {
    question: {
      id,
      text: `Q${index + 1}. ${directive} the role of ${topic} in ${assignment.subject}. ${extension}`,
      type,
      difficulty: resolveQuestionDifficulty(assignment.difficulty, index),
      marks
    },
    answer: {
      questionId: id,
      answer
    }
  };
};

const buildQuestionsForType = (
  assignment: AssignmentDocument,
  questionType: QuestionTypeConfig,
  topics: string[]
) => {
  const questions: QuestionPaperQuestion[] = [];
  const answerKey: AnswerKeyEntry[] = [];

  for (let index = 0; index < questionType.count; index += 1) {
    const topic = getTopic(topics, index, assignment.subject.toLowerCase());
    const generated =
      questionType.type === "MCQ"
        ? buildMcqQuestion(assignment, questionType.marks, index, topic)
        : buildConstructedResponseQuestion(
            assignment,
            questionType.type,
            questionType.marks,
            index,
            topic
          );

    questions.push(generated.question);
    answerKey.push(generated.answer);
  }

  return {
    title: getSectionTitle(questionType.type),
    instruction: getSectionInstruction(questionType.type),
    questions,
    answerKey
  };
};

export const generateLocalQuestionPaper = (
  assignment: AssignmentDocument,
  schoolName: string
): QuestionPaper => {
  const topics = getFocusTopics(assignment);
  const orderedQuestionTypes = sortQuestionTypes(
    assignment.questionTypes.map((questionType) => ({
      type: questionType.type,
      count: questionType.count,
      marks: questionType.marks
    }))
  );

  const sectionBundles = orderedQuestionTypes.map((questionType) =>
    buildQuestionsForType(assignment, questionType, topics)
  );

  const totalMarks = calculateTotalMarks(orderedQuestionTypes);

  return {
    assignmentId: String(assignment._id),
    schoolName,
    subject: assignment.subject,
    class: assignment.gradeLevel,
    maxMarks: totalMarks,
    duration: `${Math.max(45, Math.ceil(totalMarks * 1.8))} minutes`,
    sections: sectionBundles.map((bundle) => ({
      title: bundle.title,
      instruction: bundle.instruction,
      questions: bundle.questions
    })),
    answerKey: sectionBundles.flatMap((bundle) => bundle.answerKey)
  };
};
