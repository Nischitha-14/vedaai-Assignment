import { DifficultyBadge } from "@/components/assignments/difficulty-badge";
import type { QuestionPaper } from "@/types/assignment";

const alphabet = ["A", "B", "C", "D", "E", "F"];

export const QuestionPaperView = ({
  assignmentTitle,
  paper
}: {
  assignmentTitle: string;
  paper: QuestionPaper;
}) => {
  let runningQuestionNumber = 1;
  const questionNumberMap = new Map<string, number>();

  const numberedSections = paper.sections.map((section) => {
    const numberedQuestions = section.questions.map((question) => {
      const questionNumber = runningQuestionNumber;
      questionNumberMap.set(question.id, questionNumber);
      runningQuestionNumber += 1;

      return {
        ...question,
        questionNumber
      };
    });

    return {
      ...section,
      questions: numberedQuestions
    };
  });

  return (
    <div className="space-y-6">
      <section className="paper-surface overflow-hidden rounded-[38px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="relative overflow-hidden rounded-[30px] border border-[#ecd9b8] bg-gradient-to-r from-white via-[#fffaf1] to-[#ffe7bb] px-6 py-7 text-center">
          <div className="absolute -right-10 top-4 h-28 w-28 rounded-full border border-white/60" />
          <div className="absolute left-6 top-6 h-6 w-6 rounded-full bg-white/80" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{assignmentTitle}</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">{paper.schoolName}</h1>
          <p className="mt-3 text-sm text-slate-600">
            Subject: {paper.subject} | Class: {paper.class} | Max Marks: {paper.maxMarks} | Duration:{" "}
            {paper.duration}
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-[28px] border border-[#ecd9b8] bg-white/70 p-5 text-sm text-slate-700 sm:grid-cols-3">
          <div>Name: ____________________</div>
          <div>Roll No: ____________________</div>
          <div>Section: ____________________</div>
        </div>

        <div className="mt-8 space-y-10">
          {numberedSections.map((section) => (
            <section key={section.title}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Assessment section
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[0.12em] text-slate-950">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{section.instruction}</p>
                </div>
              </div>

              <div className="space-y-5">
                {section.questions.map((question) => (
                  <article
                    key={question.id}
                    className="rounded-[30px] border border-[#ecd9b8] bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-3xl">
                        <p className="text-base font-medium leading-7 text-slate-950">
                          Q{question.questionNumber}. {question.text}
                        </p>
                        {question.options?.length ? (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {question.options.map((option, index) => (
                              <div
                                key={`${question.id}-${option}`}
                                className="rounded-[22px] border border-[#f1e6d4] bg-[#fff9ef] px-4 py-3 text-sm text-slate-700"
                              >
                                {alphabet[index]}. {option}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <DifficultyBadge difficulty={question.difficulty} />
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          {question.marks} Marks
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="glass-surface rounded-[36px] p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Teacher view</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Answer Key</h2>
          </div>
          <p className="text-sm text-slate-500">Each answer is linked to the paper order for quick checking.</p>
        </div>

        <div className="mt-6 grid gap-3">
          {paper.answerKey.map((answer) => (
            <div
              key={answer.questionId}
              className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4 text-sm text-slate-700"
            >
              <span className="font-semibold text-slate-950">
                Q{questionNumberMap.get(answer.questionId) || answer.questionId}:
              </span>{" "}
              {answer.answer}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
