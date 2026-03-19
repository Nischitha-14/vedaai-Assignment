"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Binary,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  NotebookPen,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { createAssignment } from "@/lib/api";
import {
  buildQuestionTypes,
  createAssignmentFormSchema,
  getDefaultAssignmentFormValues,
  getDifficultyLabel,
  tomorrowDate,
  type CreateAssignmentFormValues
} from "@/lib/validation";
import { useAssignmentStore } from "@/stores/assignment-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "basic",
    title: "Basic Info",
    description: "Title, subject, class, due date, and instructions."
  },
  {
    id: "config",
    title: "Question Config",
    description: "Question types, marks, difficulty, and supporting file."
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Confirm the paper blueprint before generation."
  }
] as const;

const questionTypeCards = [
  {
    key: "mcq" as const,
    label: "MCQ",
    description: "Fast objective checks with answer options.",
    icon: Binary,
    surfaceClass: "from-[#fff7e6] to-white"
  },
  {
    key: "shortAnswer" as const,
    label: "Short Answer",
    description: "Brief explanation-based responses.",
    icon: NotebookPen,
    surfaceClass: "from-[#fff0df] to-white"
  },
  {
    key: "longAnswer" as const,
    label: "Long Answer",
    description: "Extended analytical questions.",
    icon: ScrollText,
    surfaceClass: "from-[#f9f2e7] to-white"
  }
];

export const CreateAssignmentWizard = () => {
  const router = useRouter();
  const draft = useAssignmentStore((state) => state.currentAssignment);
  const setFormData = useAssignmentStore((state) => state.setFormData);
  const resetFormData = useAssignmentStore((state) => state.resetFormData);
  const resetJobStatus = useAssignmentStore((state) => state.resetJobStatus);
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(createAssignmentFormSchema),
    mode: "onTouched",
    defaultValues: draft || getDefaultAssignmentFormValues()
  });

  const values = watch();
  const enabledQuestionTypes = useMemo(() => buildQuestionTypes(values), [values]);

  const syncDraft = (partialValues: Partial<CreateAssignmentFormValues>) => {
    setFormData(partialValues);
  };

  const goToNextStep = async () => {
    const fieldsByStep: Array<Array<keyof CreateAssignmentFormValues | "questionConfigs">> = [
      ["title", "subject", "gradeLevel", "dueDate", "additionalInstructions"],
      ["questionConfigs", "difficulty", "file"],
      []
    ];

    const isValid = await trigger(fieldsByStep[currentStep] as never);

    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  };

  const onSubmit = async (formValues: CreateAssignmentFormValues) => {
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      syncDraft(formValues);
      resetJobStatus();
      const response = await createAssignment(formValues);
      resetFormData();
      router.push(`/assignments/${response.assignmentId}/progress`);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to create assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter grid gap-6 xl:grid-cols-[1.32fr_0.82fr]">
      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 shadow-[0_28px_90px_rgba(15,23,42,0.1)]">
        <div className="relative overflow-hidden border-b border-[#f2e6d2] bg-gradient-to-br from-white via-[#fff8ec] to-[#ffdca8] p-6 sm:p-7">
          <div className="absolute -right-14 top-6 h-40 w-40 rounded-full border border-white/50" />
          <div className="absolute right-12 top-14 h-14 w-14 rounded-full bg-white/50 backdrop-blur" />
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-brand-dark" />
              Multi-step assignment creator
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-slate-950 sm:text-4xl">Create Assignment</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Configure the teaching context, define the question mix, and generate a print-ready paper.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "rounded-[24px] border px-4 py-3 backdrop-blur",
                  index === currentStep
                    ? "border-brand/40 bg-white/85 shadow-lg shadow-brand/10"
                    : index < currentStep
                      ? "border-emerald-200 bg-emerald-50/90"
                      : "border-white/70 bg-white/55"
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-[#fffcf7] p-5 sm:p-6">
          {currentStep === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Assignment Title</span>
                <input
                  {...register("title")}
                  onChange={(event) => {
                    register("title").onChange(event);
                    syncDraft({ title: event.target.value });
                  }}
                  placeholder="Quiz on Electricity"
                  className="w-full rounded-[24px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                />
                {errors.title ? <p className="text-sm text-red-600">{errors.title.message}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Subject</span>
                <input
                  {...register("subject")}
                  onChange={(event) => {
                    register("subject").onChange(event);
                    syncDraft({ subject: event.target.value });
                  }}
                  placeholder="Physics"
                  className="w-full rounded-[24px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                />
                {errors.subject ? <p className="text-sm text-red-600">{errors.subject.message}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Grade / Class</span>
                <input
                  {...register("gradeLevel")}
                  onChange={(event) => {
                    register("gradeLevel").onChange(event);
                    syncDraft({ gradeLevel: event.target.value });
                  }}
                  placeholder="Class 10"
                  className="w-full rounded-[24px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                />
                {errors.gradeLevel ? (
                  <p className="text-sm text-red-600">{errors.gradeLevel.message}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Due Date</span>
                <input
                  {...register("dueDate")}
                  min={tomorrowDate}
                  type="date"
                  onChange={(event) => {
                    register("dueDate").onChange(event);
                    syncDraft({ dueDate: event.target.value });
                  }}
                  className="w-full rounded-[24px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                />
                {errors.dueDate ? <p className="text-sm text-red-600">{errors.dueDate.message}</p> : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Additional Instructions</span>
                <textarea
                  {...register("additionalInstructions")}
                  onChange={(event) => {
                    register("additionalInstructions").onChange(event);
                    syncDraft({ additionalInstructions: event.target.value });
                  }}
                  rows={5}
                  placeholder="Focus on numerical reasoning, circuit diagrams, and real-world applications."
                  className="w-full rounded-[28px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                />
                {errors.additionalInstructions ? (
                  <p className="text-sm text-red-600">{errors.additionalInstructions.message}</p>
                ) : null}
              </label>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                {questionTypeCards.map((card) => {
                  const enabledPath = `questionConfigs.${card.key}.enabled` as const;
                  const countPath = `questionConfigs.${card.key}.count` as const;
                  const marksPath = `questionConfigs.${card.key}.marks` as const;
                  const isEnabled = values.questionConfigs[card.key].enabled;

                  return (
                    <div
                      key={card.key}
                      className={cn(
                        "overflow-hidden rounded-[30px] border bg-gradient-to-br p-5 transition",
                        isEnabled
                          ? `border-brand/40 ${card.surfaceClass} shadow-[0_18px_40px_rgba(245,166,35,0.08)]`
                          : "border-[#efe2ca] from-[#fffdf8] to-white"
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <card.icon className="h-5 w-5 text-brand-dark" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{card.label}</h3>
                            <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                          </div>
                        </div>
                        <div>
                          <Controller
                            control={control}
                            name={enabledPath}
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange(!field.value);
                                  syncDraft({
                                    questionConfigs: {
                                      ...values.questionConfigs,
                                      [card.key]: {
                                        ...values.questionConfigs[card.key],
                                        enabled: !field.value
                                      }
                                    }
                                  });
                                }}
                                className={cn(
                                  "inline-flex h-11 w-24 items-center rounded-full px-1 transition",
                                  field.value ? "justify-end bg-slate-950" : "justify-start bg-slate-200"
                                )}
                              >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900">
                                  {field.value ? "On" : "Off"}
                                </span>
                              </button>
                            )}
                          />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Number of Questions</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            disabled={!isEnabled}
                            {...register(countPath, { valueAsNumber: true })}
                            onChange={(event) => {
                              register(countPath, { valueAsNumber: true }).onChange(event);
                              syncDraft({
                                questionConfigs: {
                                  ...values.questionConfigs,
                                  [card.key]: {
                                    ...values.questionConfigs[card.key],
                                    count: Number(event.target.value)
                                  }
                                }
                              });
                            }}
                            className="w-full rounded-[22px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition disabled:bg-slate-100 focus:border-brand"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Marks Per Question</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            disabled={!isEnabled}
                            {...register(marksPath, { valueAsNumber: true })}
                            onChange={(event) => {
                              register(marksPath, { valueAsNumber: true }).onChange(event);
                              syncDraft({
                                questionConfigs: {
                                  ...values.questionConfigs,
                                  [card.key]: {
                                    ...values.questionConfigs[card.key],
                                    marks: Number(event.target.value)
                                  }
                                }
                              });
                            }}
                            className="w-full rounded-[22px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition disabled:bg-slate-100 focus:border-brand"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.questionConfigs ? (
                <p className="text-sm text-red-600">{errors.questionConfigs.message as string}</p>
              ) : null}

              <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Overall Difficulty</span>
                  <select
                    {...register("difficulty")}
                    onChange={(event) => {
                      register("difficulty").onChange(event);
                      syncDraft({
                        difficulty: event.target.value as CreateAssignmentFormValues["difficulty"]
                      });
                    }}
                    className="w-full rounded-[24px] border border-[#efe2ca] bg-white px-4 py-3 outline-none transition focus:border-brand"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Upload Reference File</span>
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[30px] border border-dashed border-[#e8cfaa] bg-white px-6 py-8 text-center transition hover:border-brand">
                    <UploadCloud className="h-7 w-7 text-brand-dark" />
                    <span className="mt-3 text-sm font-semibold text-slate-900">
                      Upload a PDF or TXT file
                    </span>
                    <span className="mt-1 text-xs text-slate-500">Maximum file size: 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,application/pdf,text/plain"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setValue("file", file, { shouldValidate: true });
                        syncDraft({ file });
                      }}
                    />
                    {values.file ? (
                      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff7ea] px-3 py-2 text-xs font-semibold text-slate-700">
                        <FileText className="h-4 w-4" />
                        {values.file.name}
                      </span>
                    ) : null}
                  </label>
                  {errors.file ? <p className="text-sm text-red-600">{errors.file.message}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[30px] border border-[#efe2ca] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Assignment details
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Title:</span> {values.title}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Subject:</span> {values.subject}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Grade:</span> {values.gradeLevel}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Due date:</span> {values.dueDate}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Difficulty:</span>{" "}
                      {getDifficultyLabel(values.difficulty)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#efe2ca] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Question plan
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    {enabledQuestionTypes.map((questionType) => (
                      <p key={questionType.type}>
                        <span className="font-semibold text-slate-900">{questionType.type}:</span>{" "}
                        {questionType.count} questions x {questionType.marks} marks
                      </p>
                    ))}
                    {values.file ? (
                      <p>
                        <span className="font-semibold text-slate-900">Reference file:</span>{" "}
                        {values.file.name}
                      </p>
                    ) : (
                      <p>
                        <span className="font-semibold text-slate-900">Reference file:</span> None
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-brand/30 bg-gradient-to-r from-[#fff7e8] to-white p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-dark" />
                  <div>
                    <p className="font-semibold text-slate-900">Ready to generate</p>
                    <p className="mt-1 text-sm text-slate-600">
                      VedaAI will create sectioned questions, answer keys, live progress updates, and a downloadable PDF from this configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {submissionError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submissionError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-[#efe2ca] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="gap-2 rounded-full"
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="secondary" className="gap-2 rounded-full" onClick={() => void goToNextStep()}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" className="gap-2 rounded-full" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Submit Assignment"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <div className="dark-glass rounded-[34px] p-6 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Live summary</p>
          <h2 className="mt-4 text-2xl font-semibold">{values.title || "Untitled assignment"}</h2>
          <p className="mt-2 text-sm text-white/70">
            {values.subject || "Subject"} / {values.gradeLevel || "Class"}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Due date</p>
              <p className="mt-2 text-sm font-semibold text-white/90">{values.dueDate}</p>
            </div>
            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Difficulty</p>
              <p className="mt-2 text-sm font-semibold text-white/90">
                {getDifficultyLabel(values.difficulty)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Question mix</p>
              <p className="mt-2 text-sm font-semibold text-white/90">{enabledQuestionTypes.length} enabled</p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] bg-white/10 p-4 text-sm leading-6 text-white/70">
            {values.additionalInstructions || "Additional instructions will appear here once added."}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff5e2]">
              <SlidersHorizontal className="h-5 w-5 text-brand-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Step guidance</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{steps[currentStep].description}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] bg-[#fff9f0] p-4 text-sm text-slate-600">
            {currentStep === 0
              ? "Start with the teaching context and learning objective."
              : currentStep === 1
                ? "Tune the paper mix so the assessment feels balanced and intentional."
                : "Review the blueprint before you trigger generation."}
          </div>
        </div>
      </aside>
    </div>
  );
};
