import cors from "cors";
import express from "express";
import path from "path";
import { ZodError } from "zod";
import { createAssignmentsRouter } from "./routes/assignments";
import type { Env } from "./config/env";
import type { Queue } from "bullmq";
import type IORedis from "ioredis";

export const createApp = ({
  env,
  queue,
  cacheRedis
}: {
  env: Env;
  queue: Queue;
  cacheRedis: IORedis;
}) => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: false
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok"
    });
  });

  app.use(
    "/api/assignments",
    createAssignmentsRouter({
      queue,
      cacheRedis
    })
  );

  app.use(
    (
      error: Error & {
        code?: string;
        status?: number;
      },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Validation failed."
        });
      }

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Uploaded file must be 5MB or smaller."
        });
      }

      return res.status(error.status || 500).json({
        message: error.message || "Unexpected server error."
      });
    }
  );

  return app;
};
