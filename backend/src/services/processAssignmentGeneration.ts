import type IORedis from "ioredis";
import { AssignmentModel } from "../models/Assignment";
import { getAssignmentPaperCacheKey } from "../config/redis";
import { generateQuestionPaperForAssignment } from "./questionGenerationService";
import type { Env } from "../config/env";
import type { QuestionPaper } from "../types/assignment";

type GenerationHooks = {
  onProgress?: (payload: {
    assignmentId: string;
    progress: number;
    message: string;
    status: "processing";
  }) => Promise<void> | void;
  onCompleted?: (payload: {
    assignmentId: string;
    result: QuestionPaper;
    status: "completed";
  }) => Promise<void> | void;
  onFailed?: (payload: {
    assignmentId: string;
    status: "failed";
    message: string;
  }) => Promise<void> | void;
};

export const processAssignmentGeneration = async ({
  assignmentId,
  cacheRedis,
  env,
  hooks
}: {
  assignmentId: string;
  cacheRedis: IORedis;
  env: Env;
  hooks?: GenerationHooks;
}) => {
  const assignment = await AssignmentModel.findById(assignmentId);

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} was not found.`);
  }

  const updateProgress = async (progress: number, message: string) => {
    assignment.status = "processing";
    assignment.jobProgress = progress;
    assignment.jobMessage = message;
    assignment.lastError = undefined;
    await assignment.save();

    await hooks?.onProgress?.({
      assignmentId,
      progress,
      message,
      status: "processing"
    });
  };

  try {
    await updateProgress(10, "Preparing assignment context...");

    const paper = await generateQuestionPaperForAssignment({
      assignment,
      env,
      onProgress: updateProgress
    });

    assignment.result = paper;
    assignment.status = "completed";
    assignment.jobProgress = 100;
    assignment.jobMessage = "Question paper ready.";
    assignment.lastError = undefined;
    await assignment.save();

    await cacheRedis.del(getAssignmentPaperCacheKey(assignmentId));

    await hooks?.onCompleted?.({
      assignmentId,
      result: paper,
      status: "completed"
    });

    return paper;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question generation failed.";

    assignment.status = "failed";
    assignment.lastError = message;
    assignment.jobProgress = Math.max(assignment.jobProgress || 0, 20);
    assignment.jobMessage = message;
    await assignment.save();

    await hooks?.onFailed?.({
      assignmentId,
      status: "failed",
      message
    });

    throw error;
  }
};
