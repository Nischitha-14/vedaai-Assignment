import { Queue, type ConnectionOptions } from "bullmq";

export const QUESTION_GENERATION_QUEUE = "question-generation";

export const createQuestionGenerationQueue = (connection: ConnectionOptions) =>
  new Queue(QUESTION_GENERATION_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });
