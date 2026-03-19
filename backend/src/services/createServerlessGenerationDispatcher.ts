import { waitUntil } from "@vercel/functions";
import type { Env } from "../config/env";
import { processAssignmentGeneration } from "./processAssignmentGeneration";
import type { GenerationDispatcher } from "../types/generation";
import type { CacheStore } from "../types/cache";

export const createServerlessGenerationDispatcher = ({
  cacheRedis,
  env
}: {
  cacheRedis: CacheStore;
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
