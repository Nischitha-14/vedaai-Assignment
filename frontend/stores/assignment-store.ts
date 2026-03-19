"use client";

import { create } from "zustand";
import { getDefaultAssignmentFormValues, type CreateAssignmentFormValues } from "@/lib/validation";
import type { Assignment, JobStatusState, QuestionPaper } from "@/types/assignment";

interface AssignmentStoreState {
  currentAssignment: CreateAssignmentFormValues;
  assignments: Assignment[];
  currentPaper: QuestionPaper | null;
  jobStatus: JobStatusState;
  setFormData: (formData: Partial<CreateAssignmentFormValues>) => void;
  resetFormData: () => void;
  setAssignments: (assignments: Assignment[]) => void;
  setPaper: (paper: QuestionPaper | null) => void;
  updateJobStatus: (status: Partial<JobStatusState>) => void;
  resetJobStatus: () => void;
}

const defaultJobStatus: JobStatusState = {
  progress: 0,
  message: "Waiting for generation to begin.",
  status: "idle"
};

export const useAssignmentStore = create<AssignmentStoreState>((set) => ({
  currentAssignment: getDefaultAssignmentFormValues(),
  assignments: [],
  currentPaper: null,
  jobStatus: defaultJobStatus,
  setFormData: (formData) =>
    set((state) => ({
      currentAssignment: {
        ...state.currentAssignment,
        ...formData
      }
    })),
  resetFormData: () =>
    set({
      currentAssignment: getDefaultAssignmentFormValues()
    }),
  setAssignments: (assignments) =>
    set({
      assignments
    }),
  setPaper: (paper) =>
    set({
      currentPaper: paper
    }),
  updateJobStatus: (status) =>
    set((state) => ({
      jobStatus: {
        ...state.jobStatus,
        ...status
      }
    })),
  resetJobStatus: () =>
    set({
      jobStatus: defaultJobStatus
    })
}));
