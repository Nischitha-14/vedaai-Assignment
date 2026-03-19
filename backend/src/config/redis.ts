import IORedis from "ioredis";
import type { ConnectionOptions } from "bullmq";

export const createRedisConnection = (redisUrl: string) =>
  new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

export const getBullMqConnectionOptions = (redisUrl: string): ConnectionOptions => {
  const parsedUrl = new URL(redisUrl);
  const dbPath = parsedUrl.pathname.replace("/", "");

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 6379),
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    db: dbPath ? Number(dbPath) : undefined,
    maxRetriesPerRequest: null
  };
};

export const getAssignmentPaperCacheKey = (assignmentId: string) =>
  `assignment:${assignmentId}:paper`;
