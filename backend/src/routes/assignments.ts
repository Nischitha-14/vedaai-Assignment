import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../lib/asyncHandler";
import { createAssignmentsController } from "../controllers/assignmentsController";
import type IORedis from "ioredis";
import type { Env } from "../config/env";
import type { GenerationDispatcher } from "../types/generation";

export const createAssignmentsRouter = ({
  env,
  generationDispatcher,
  cacheRedis
}: {
  env: Env;
  generationDispatcher: GenerationDispatcher;
  cacheRedis: IORedis;
}) => {
  const maxUploadSizeBytes =
    env.BACKEND_RUNTIME_MODE === "serverless" ? 4 * 1024 * 1024 : 5 * 1024 * 1024;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxUploadSizeBytes
    },
    fileFilter: (_req, file, callback) => {
      const allowedMimeTypes = ["application/pdf", "text/plain"];
      const allowedExtension = [".pdf", ".txt"].some((extension) =>
        file.originalname.toLowerCase().endsWith(extension)
      );

      if (allowedMimeTypes.includes(file.mimetype) || allowedExtension) {
        return callback(null, true);
      }

      return callback(new Error("Only PDF and TXT files are allowed."));
    }
  });

  const router = Router();
  const controller = createAssignmentsController({
    env,
    generationDispatcher,
    cacheRedis
  });

  router.post("/", upload.single("file"), asyncHandler(controller.createAssignment));
  router.get("/", asyncHandler(controller.listAssignments));
  router.get("/:id", asyncHandler(controller.getAssignment));
  router.get("/:id/paper", asyncHandler(controller.getQuestionPaper));
  router.get("/:id/paper/pdf", asyncHandler(controller.downloadQuestionPaperPdf));
  router.post("/:id/regenerate", asyncHandler(controller.regenerateAssignment));

  return router;
};
