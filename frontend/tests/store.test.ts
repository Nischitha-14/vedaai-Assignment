import { beforeEach, describe, expect, it } from "vitest";
import { getDefaultAssignmentFormValues } from "@/lib/validation";
import { useAssignmentStore } from "@/stores/assignment-store";

describe("useAssignmentStore", () => {
  beforeEach(() => {
    useAssignmentStore.setState({
      currentAssignment: getDefaultAssignmentFormValues(),
      assignments: [],
      currentPaper: null,
      jobStatus: {
        progress: 0,
        message: "Waiting for generation to begin.",
        status: "idle"
      }
    });
  });

  it("updates the current assignment draft", () => {
    useAssignmentStore.getState().setFormData({
      title: "Physics Quiz",
      subject: "Physics"
    });

    const state = useAssignmentStore.getState();

    expect(state.currentAssignment.title).toBe("Physics Quiz");
    expect(state.currentAssignment.subject).toBe("Physics");
  });

  it("updates job status and current paper", () => {
    useAssignmentStore.getState().updateJobStatus({
      progress: 70,
      message: "Structuring sections...",
      status: "processing"
    });
    useAssignmentStore.getState().setPaper({
      assignmentId: "assignment-1",
      schoolName: "VedaAI Public School",
      subject: "Physics",
      class: "Class 10",
      maxMarks: 20,
      duration: "45 minutes",
      sections: [],
      answerKey: []
    });

    const state = useAssignmentStore.getState();

    expect(state.jobStatus.progress).toBe(70);
    expect(state.currentPaper?.subject).toBe("Physics");
  });
});
