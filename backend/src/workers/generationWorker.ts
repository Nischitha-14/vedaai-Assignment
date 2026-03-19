import { Worker, type ConnectionOptions } from "bullmq";
import type IORedis from "ioredis";
import type { Server } from "socket.io";
import { AssignmentModel } from "../models/Assignment";
import { getAssignmentPaperCacheKey } from "../config/redis";
import { getAssignmentRoomName } from "../lib/socket";
import { QUESTION_GENERATION_QUEUE } from "../queues/questionGenerationQueue";
import { generateQuestionPaperForAssignment } from "../services/questionGenerationService";
import type { Env } from "../config/env";

export const createGenerationWorker = ({
  connection,
  cacheRedis,
  io,
  env
}: {
  connection: ConnectionOptions;
  cacheRedis: IORedis;
  io: Server;
  env: Env;
}) =>
  new Worker(
    QUESTION_GENERATION_QUEUE,
    async (job) => {
      const assignmentId = String(job.data.assignmentId);
      const roomName = getAssignmentRoomName(assignmentId);

      const emitProgress = async (progress: number, message: string) => {
        await job.updateProgress(progress);
        io.to(roomName).emit("job:progress", {
          assignmentId,
          progress,
          message,
          status: "processing"
        });
      };

      const assignment = await AssignmentModel.findById(assignmentId);

      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} was not found.`);
      }

      try {
        assignment.status = "processing";
        assignment.lastError = undefined;
        await assignment.save();

        await emitProgress(10, "Preparing assignment context...");

        const paper = await generateQuestionPaperForAssignment({
          assignment,
          env,
          onProgress: emitProgress
        });

        await emitProgress(90, "Saving the generated question paper...");

        assignment.result = paper;
        assignment.status = "completed";
        await assignment.save();

        await cacheRedis.del(getAssignmentPaperCacheKey(assignmentId));

        await emitProgress(100, "Question paper ready.");
        io.to(roomName).emit("job:completed", {
          assignmentId,
          result: paper,
          status: "completed"
        });

        return paper;
      } catch (error) {
        assignment.status = "failed";
        assignment.lastError =
          error instanceof Error ? error.message : "Question generation failed.";
        await assignment.save();

        io.to(roomName).emit("job:failed", {
          assignmentId,
          status: "failed",
          message: assignment.lastError
        });

        throw error;
      }
    },
    {
      connection,
      concurrency: 2
    }
  );
