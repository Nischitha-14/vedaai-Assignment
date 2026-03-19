export type AssignmentStatus = "pending" | "processing" | "completed" | "failed";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export type QuestionTypeName = "MCQ" | "Short Answer" | "Long Answer";

export type QuestionDifficulty = Exclude<Difficulty, "mixed">;

export interface QuestionTypeConfig {
  type: QuestionTypeName;
  count: number;
  marks: number;
}

export interface QuestionPaperQuestion {
  id: string;
  text: string;
  type: QuestionTypeName;
  difficulty: QuestionDifficulty;
  marks: number;
  options?: string[];
}

export interface QuestionPaperSection {
  title: string;
  instruction: string;
  questions: QuestionPaperQuestion[];
}

export interface AnswerKeyEntry {
  questionId: string;
  answer: string;
}

export interface QuestionPaper {
  assignmentId: string;
  schoolName: string;
  subject: string;
  class: string;
  maxMarks: number;
  duration: string;
  sections: QuestionPaperSection[];
  answerKey: AnswerKeyEntry[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  difficulty: Difficulty;
  totalQuestions: number;
  fileUrl?: string;
  status: AssignmentStatus;
  result?: QuestionPaper;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatusState {
  progress: number;
  message: string;
  status: "idle" | AssignmentStatus;
}
