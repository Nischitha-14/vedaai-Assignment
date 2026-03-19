import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AssignmentModel } from "../models/Assignment";
import { calculateTotalQuestions } from "../utils/questionTypes";
import { parseCreateAssignmentPayload } from "../validation/assignment";
import { getAssignmentPaperCacheKey } from "../config/redis";
import { persistUploadedFile } from "../services/fileService";
import { generateQuestionPaperPdf } from "../services/pdfService";
import type { Queue } from "bullmq";
import type IORedis from "ioredis";
import type { QuestionPaper } from "../types/assignment";

const getAssignmentOrThrow = async (assignmentId: string) => {
  const assignment = await AssignmentModel.findById(assignmentId);

  if (!assignment) {
    const error = new Error("Assignment not found.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  return assignment;
};

const getAssignmentIdFromRequest = (request: Request) =>
  Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;

export const createAssignmentsController = ({
  queue,
  cacheRedis
}: {
  queue: Queue;
  cacheRedis: IORedis;
}) => ({
  createAssignment: async (req: Request, res: Response) => {
    try {
      const payload = parseCreateAssignmentPayload(req.body as Record<string, unknown>);
      const uploadedFile = req.file ? await persistUploadedFile(req.file) : undefined;

      const assignment = await AssignmentModel.create({
        ...payload,
        totalQuestions: calculateTotalQuestions(payload.questionTypes),
        fileUrl: uploadedFile?.fileUrl,
        filePath: uploadedFile?.filePath,
        sourceText: uploadedFile?.sourceText,
        status: "pending"
      });

      await queue.add("generate-paper", {
        assignmentId: String(assignment._id)
      });

      return res.status(201).json({
        assignmentId: String(assignment._id)
      });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof ZodError) {
        return res.status(400).json({
          message: error instanceof ZodError ? error.issues[0]?.message : error.message
        });
      }

      throw error;
    }
  },

  listAssignments: async (_req: Request, res: Response) => {
    const assignments = await AssignmentModel.find().sort({ createdAt: -1 });

    return res.json(assignments);
  },

  getAssignment: async (req: Request, res: Response) => {
    const assignment = await getAssignmentOrThrow(getAssignmentIdFromRequest(req));
    return res.json(assignment);
  },

  getQuestionPaper: async (req: Request, res: Response) => {
    const assignmentId = getAssignmentIdFromRequest(req);
    const cacheKey = getAssignmentPaperCacheKey(assignmentId);
    const cachedPaper = await cacheRedis.get(cacheKey);

    if (cachedPaper) {
      return res.json(JSON.parse(cachedPaper));
    }

    const assignment = await getAssignmentOrThrow(assignmentId);

    if (!assignment.result || assignment.status !== "completed") {
      return res.status(404).json({
        message: "Question paper is not available yet."
      });
    }

    const paper = assignment.toJSON().result as QuestionPaper;

    await cacheRedis.set(cacheKey, JSON.stringify(paper), "EX", 60 * 60);

    return res.json(paper);
  },

  downloadQuestionPaperPdf: async (req: Request, res: Response) => {
    const assignment = await getAssignmentOrThrow(getAssignmentIdFromRequest(req));

    if (!assignment.result || assignment.status !== "completed") {
      return res.status(404).json({
        message: "Question paper is not available yet."
      });
    }

    const paper = assignment.toJSON().result as QuestionPaper;

    const buffer = await generateQuestionPaperPdf({
      assignmentTitle: assignment.title,
      paper
    });

    const fileName = assignment.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || "question-paper"}.pdf"`
    );

    return res.send(buffer);
  },

  regenerateAssignment: async (req: Request, res: Response) => {
    const assignmentId = getAssignmentIdFromRequest(req);
    const assignment = await getAssignmentOrThrow(assignmentId);

    assignment.status = "pending";
    assignment.lastError = undefined;
    assignment.set("result", undefined);
    await assignment.save();
    await cacheRedis.del(getAssignmentPaperCacheKey(assignmentId));

    await queue.add("generate-paper", {
      assignmentId: String(assignment._id)
    });

    return res.status(202).json({
      assignmentId: String(assignment._id),
      status: assignment.status
    });
  }
});
