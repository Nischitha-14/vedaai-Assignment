export interface GenerationDispatcher {
  enqueueGeneration: (assignmentId: string) => Promise<void>;
}
