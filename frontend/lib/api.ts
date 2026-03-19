import type { Assignment, QuestionPaper } from "@/types/assignment";
import type { CreateAssignmentFormValues } from "./validation";
import { buildQuestionTypes } from "./validation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const parseResponse = async <T>(response: Response) => {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(errorBody?.message || "Request failed.", response.status);
  }

  return (await response.json()) as T;
};

export const createAssignment = async (values: CreateAssignmentFormValues) => {
  const formData = new FormData();

  formData.append("title", values.title);
  formData.append("subject", values.subject);
  formData.append("gradeLevel", values.gradeLevel);
  formData.append("dueDate", values.dueDate);
  formData.append("additionalInstructions", values.additionalInstructions);
  formData.append("difficulty", values.difficulty);
  formData.append("questionTypes", JSON.stringify(buildQuestionTypes(values)));

  if (values.file) {
    formData.append("file", values.file);
  }

  const response = await fetch(`${apiUrl}/api/assignments`, {
    method: "POST",
    body: formData
  });

  return parseResponse<{ assignmentId: string }>(response);
};

export const listAssignments = async () => {
  const response = await fetch(`${apiUrl}/api/assignments`, {
    cache: "no-store"
  });

  return parseResponse<Assignment[]>(response);
};

export const getAssignment = async (assignmentId: string) => {
  const response = await fetch(`${apiUrl}/api/assignments/${assignmentId}`, {
    cache: "no-store"
  });

  return parseResponse<Assignment>(response);
};

export const getQuestionPaper = async (assignmentId: string) => {
  const response = await fetch(`${apiUrl}/api/assignments/${assignmentId}/paper`, {
    cache: "no-store"
  });

  return parseResponse<QuestionPaper>(response);
};

export const regenerateAssignment = async (assignmentId: string) => {
  const response = await fetch(`${apiUrl}/api/assignments/${assignmentId}/regenerate`, {
    method: "POST"
  });

  return parseResponse<{ assignmentId: string; status: string }>(response);
};

export const getQuestionPaperPdfUrl = (assignmentId: string) =>
  `${apiUrl}/api/assignments/${assignmentId}/paper/pdf`;
