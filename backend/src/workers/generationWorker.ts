import { Worker, type ConnectionOptions } from "bullmq";
import type IORedis from "ioredis";
import type { Server } from "socket.io";
import { getAssignmentRoomName } from "../lib/socket";
import { QUESTION_GENERATION_QUEUE } from "../queues/questionGenerationQueue";
import type { Env } from "../config/env";
import { processAssignmentGeneration } from "../services/processAssignmentGeneration";

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

      return processAssignmentGeneration({
        assignmentId,
        cacheRedis,
        env,
        hooks: {
          onProgress: async (payload) => {
            await job.updateProgress(payload.progress);
            io.to(roomName).emit("job:progress", payload);
          },
          onCompleted: async (payload) => {
            await job.updateProgress(100);
            io.to(roomName).emit("job:completed", payload);
          },
          onFailed: async (payload) => {
            io.to(roomName).emit("job:failed", payload);
          }
        }
      });
    },
    {
      connection,
      concurrency: 2
    }
  );
