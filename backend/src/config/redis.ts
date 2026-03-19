import IORedis from "ioredis";
import type { ConnectionOptions } from "bullmq";
import type { Env } from "./env";
import type { CacheStore } from "../types/cache";

export const createRedisConnection = (redisUrl: string) =>
  new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

export const createRedisCacheStore = (redisUrl: string): CacheStore => {
  const client = createRedisConnection(redisUrl);

  return {
    get: async (key) => client.get(key),
    set: async (key, value, ttlSeconds) => {
      if (ttlSeconds) {
        await client.set(key, value, "EX", ttlSeconds);
        return;
      }

      await client.set(key, value);
    },
    del: async (key) => client.del(key),
    ping: async () => {
      await client.ping();
    },
    quit: async () => {
      await client.quit();
    }
  };
};

const normalizeUpstashBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const executeUpstashCommand = async <T>({
  baseUrl,
  token,
  command
}: {
  baseUrl: string;
  token: string;
  command: Array<string | number>;
}) => {
  const response = await fetch(normalizeUpstashBaseUrl(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    result?: T;
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result ?? null;
};

export const createUpstashRestCache = ({
  url,
  token
}: {
  url: string;
  token: string;
}): CacheStore => ({
  get: async (key) => {
    const result = await executeUpstashCommand<string>({
      baseUrl: url,
      token,
      command: ["GET", key]
    });

    return result;
  },
  set: async (key, value, ttlSeconds) => {
    const command: Array<string | number> = ["SET", key, value];

    if (ttlSeconds) {
      command.push("EX", ttlSeconds);
    }

    await executeUpstashCommand({
      baseUrl: url,
      token,
      command
    });
  },
  del: async (key) => {
    const result = await executeUpstashCommand<number>({
      baseUrl: url,
      token,
      command: ["DEL", key]
    });

    return Number(result || 0);
  },
  ping: async () => {
    await executeUpstashCommand({
      baseUrl: url,
      token,
      command: ["PING"]
    });
  },
  quit: async () => {}
});

export const createCacheStore = (env: Env): CacheStore => {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createUpstashRestCache({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN
    });
  }

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required when Upstash REST credentials are not provided.");
  }

  return createRedisCacheStore(env.REDIS_URL);
};

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
