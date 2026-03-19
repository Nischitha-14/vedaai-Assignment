import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { connectToDatabase, disconnectFromDatabase } from "./config/database";
import { createRedisConnection, getBullMqConnectionOptions } from "./config/redis";
import { createQuestionGenerationQueue } from "./queues/questionGenerationQueue";
import { createGenerationWorker } from "./workers/generationWorker";
import { ensureUploadDirectory } from "./services/fileService";
import { getAssignmentRoomName } from "./lib/socket";

const bootstrap = async () => {
  const env = getEnv();

  await connectToDatabase(env.MONGODB_URI);

  const cacheRedis = createRedisConnection(env.REDIS_URL);
  const queueConnection = getBullMqConnectionOptions(env.REDIS_URL);
  const workerConnection = getBullMqConnectionOptions(env.REDIS_URL);

  await Promise.all([
    cacheRedis.ping(),
    ensureUploadDirectory()
  ]);

  const queue = createQuestionGenerationQueue(queueConnection);
  const generationDispatcher = {
    enqueueGeneration: async (assignmentId: string) => {
      await queue.add("generate-paper", {
        assignmentId
      });
    }
  };
  const app = createApp({
    env,
    generationDispatcher,
    cacheRedis
  });
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("assignment:join", (assignmentId: string) => {
      socket.join(getAssignmentRoomName(assignmentId));
    });

    socket.on("assignment:leave", (assignmentId: string) => {
      socket.leave(getAssignmentRoomName(assignmentId));
    });
  });

  const worker = createGenerationWorker({
    connection: workerConnection,
    cacheRedis,
    io,
    env
  });

  httpServer.listen(env.PORT, () => {
    console.log(`VedaAI backend listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    await worker.close();
    await queue.close();
    await cacheRedis.quit();
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    await disconnectFromDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
};

void bootstrap().catch((error) => {
  console.error("Failed to start VedaAI backend", error);
  process.exit(1);
});
