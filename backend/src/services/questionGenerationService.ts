import type { AssignmentDocument } from "../models/Assignment";
import type { Env } from "../config/env";
import { requestQuestionPaperFromClaude } from "./claudeService";
import { generateLocalQuestionPaper } from "./localGenerationService";
import { buildGenerationPrompt } from "../utils/promptBuilder";
import { normalizeAiQuestionPaper } from "../utils/aiResponse";

export const generateQuestionPaperForAssignment = async ({
  assignment,
  env,
  onProgress
}: {
  assignment: AssignmentDocument;
  env: Env;
  onProgress?: (progress: number, message: string) => Promise<void> | void;
}) => {
  await onProgress?.(25, "Generating questions with Claude...");

  try {
    const prompt = buildGenerationPrompt(assignment);
    const claudeResponse = await requestQuestionPaperFromClaude({
      apiKey: env.CLAUDE_API_KEY,
      model: env.CLAUDE_MODEL,
      prompt
    });

    await onProgress?.(70, "Structuring sections and answer keys...");

    return normalizeAiQuestionPaper(assignment, claudeResponse, env.SCHOOL_NAME);
  } catch (_error) {
    await onProgress?.(70, "Finalizing the paper with a resilient local generator...");
    return generateLocalQuestionPaper(assignment, env.SCHOOL_NAME);
  }
};
