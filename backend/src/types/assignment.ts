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

export interface AssignmentData {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  difficulty: Difficulty;
  totalQuestions: number;
  fileUrl?: string;
  filePath?: string;
  sourceText?: string;
  status: AssignmentStatus;
  result?: QuestionPaper;
  lastError?: string;
}

export interface AssignmentEntity extends AssignmentData {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
