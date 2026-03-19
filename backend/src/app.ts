import cors from "cors";
import express from "express";
import path from "path";
import { ZodError } from "zod";
import { createAssignmentsRouter } from "./routes/assignments";
import type { Env } from "./config/env";
import type { GenerationDispatcher } from "./types/generation";
import type { CacheStore } from "./types/cache";

export const createApp = ({
  env,
  generationDispatcher,
  cacheRedis
}: {
  env: Env;
  generationDispatcher: GenerationDispatcher;
  cacheRedis: CacheStore;
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

  if (env.BACKEND_RUNTIME_MODE === "server") {
    app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      runtimeMode: env.BACKEND_RUNTIME_MODE
    });
  });

  app.use(
    "/api/assignments",
    createAssignmentsRouter({
      env,
      generationDispatcher,
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
          message:
            env.BACKEND_RUNTIME_MODE === "serverless"
              ? "Uploaded file must be 4MB or smaller for deployed Vercel requests."
              : "Uploaded file must be 5MB or smaller."
        });
      }

      return res.status(error.status || 500).json({
        message: error.message || "Unexpected server error."
      });
    }
  );

  return app;
};
