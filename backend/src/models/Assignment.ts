import { Schema, model, type HydratedDocument } from "mongoose";
import type { AssignmentData } from "../types/assignment";

const questionTypeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["MCQ", "Short Answer", "Long Answer"],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    marks: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const questionPaperQuestionSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true
    },
    marks: {
      type: Number,
      required: true
    },
    options: {
      type: [String],
      default: undefined
    }
  },
  { _id: false }
);

const questionPaperSectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    instruction: {
      type: String,
      required: true
    },
    questions: {
      type: [questionPaperQuestionSchema],
      required: true,
      default: []
    }
  },
  { _id: false }
);

const answerKeySchema = new Schema(
  {
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const questionPaperSchema = new Schema(
  {
    assignmentId: {
      type: String,
      required: true
    },
    schoolName: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    class: {
      type: String,
      required: true
    },
    maxMarks: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    sections: {
      type: [questionPaperSectionSchema],
      required: true,
      default: []
    },
    answerKey: {
      type: [answerKeySchema],
      required: true,
      default: []
    }
  },
  { _id: false }
);

const assignmentSchema = new Schema<AssignmentData>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    gradeLevel: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    questionTypes: {
      type: [questionTypeSchema],
      required: true
    },
    additionalInstructions: {
      type: String,
      default: ""
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    fileUrl: {
      type: String,
      default: undefined
    },
    filePath: {
      type: String,
      default: undefined
    },
    sourceText: {
      type: String,
      default: undefined
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    jobProgress: {
      type: Number,
      default: 0
    },
    jobMessage: {
      type: String,
      default: undefined
    },
    result: {
      type: questionPaperSchema,
      default: undefined
    },
    lastError: {
      type: String,
      default: undefined
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        if (ret._id) {
          ret._id = String(ret._id);
        }
        return ret;
      }
    }
  }
);

export type AssignmentDocument = HydratedDocument<AssignmentData>;

export const AssignmentModel = model<AssignmentData>("Assignment", assignmentSchema);
