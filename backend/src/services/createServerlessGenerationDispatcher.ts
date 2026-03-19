import { waitUntil } from "@vercel/functions";
import type IORedis from "ioredis";
import type { Env } from "../config/env";
import { processAssignmentGeneration } from "./processAssignmentGeneration";
import type { GenerationDispatcher } from "../types/generation";

export const createServerlessGenerationDispatcher = ({
  cacheRedis,
  env
}: {
  cacheRedis: IORedis;
  env: Env;
}): GenerationDispatcher => ({
  enqueueGeneration: async (assignmentId: string) => {
    waitUntil(
      processAssignmentGeneration({
        assignmentId,
        cacheRedis,
        env
      })
    );
  }
});
