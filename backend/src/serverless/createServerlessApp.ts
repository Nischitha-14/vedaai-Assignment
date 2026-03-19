import "dotenv/config";
import { createApp } from "../app";
import { connectToDatabase } from "../config/database";
import { getEnv } from "../config/env";
import { createCacheStore } from "../config/redis";
import { createServerlessGenerationDispatcher } from "../services/createServerlessGenerationDispatcher";

type ServerlessResources = {
  app: ReturnType<typeof createApp>;
};

declare global {
  var __vedaaiServerlessResources: Promise<ServerlessResources> | undefined;
}

const bootstrapServerlessApp = async (): Promise<ServerlessResources> => {
  process.env.BACKEND_RUNTIME_MODE ??= "serverless";

  const env = getEnv();
  await connectToDatabase(env.MONGODB_URI);

  const cacheRedis = createCacheStore(env);
  await cacheRedis.ping();

  const generationDispatcher = createServerlessGenerationDispatcher({
    cacheRedis,
    env
  });

  const app = createApp({
    env,
    generationDispatcher,
    cacheRedis
  });

  return {
    app
  };
};

export const getServerlessApp = async () => {
  if (!global.__vedaaiServerlessResources) {
    global.__vedaaiServerlessResources = bootstrapServerlessApp();
  }

  return global.__vedaaiServerlessResources;
};
