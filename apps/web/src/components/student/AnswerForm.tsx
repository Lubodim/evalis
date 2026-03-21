"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitStudentAnswers } from "../../lib/api/student";
import type { StudentSubmissionDetail } from "../../types/student";

type AnswerFormProps = {
  submission?: StudentSubmissionDetail;
  studentId?: string;
};

function buildInitialAnswers(submission: StudentSubmissionDetail) {
  return Object.fromEntries(
    (submission.assessment.questions ?? []).map((question) => {
      const existingAnswer = submission.answers.find((answer) => answer.questionId === question.id);
      return [question.id, existingAnswer?.answerText ?? existingAnswer?.selectedOption ?? ""];
    })
  ) as Record<string, string>;
}

export function AnswerForm({ submission, studentId }: AnswerFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(
    submission ? buildInitialAnswers(submission) : {}
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!submission) {
    return (
      <section className="card">
        <p className="eyebrow">Answers</p>
        <h2>Submission content</h2>
        <p>Submission data is not available yet.</p>
      </section>
    );
  }

  const currentSubmission = submission;
  const questions = currentSubmission.assessment.questions ?? [];
  const supportedQuestions = questions.filter((question) => question.type === "SHORT_TEXT");
  const unsupportedQuestions = questions.filter((question) => question.type !== "SHORT_TEXT");
  const isEditable = currentSubmission.status === "DRAFT";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId) {
      setErrorMessage("Student identity is not available for answer submission.");
      return;
    }

    if (!isEditable) {
      setErrorMessage("This submission is no longer editable.");
      return;
    }

    const payloadAnswers = supportedQuestions.map((question) => ({
      questionId: question.id,
      answerText: (answers[question.id] ?? "").trim()
    }));

    const emptyAnswer = payloadAnswers.find((answer) => !answer.answerText);

    if (emptyAnswer) {
      setErrorMessage("Please complete all supported answers before submitting.");
      return;
    }

    try {
      setIsPending(true);
      setErrorMessage(null);
      await submitStudentAnswers(currentSubmission.id, studentId, {
        answers: payloadAnswers
      });
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit answers.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Answers</p>
      <h2>Submission content</h2>
      <p>
        This form supports the current short-text question flow. Unsupported question types remain read-only until a
        later step.
      </p>
      <form onSubmit={handleSubmit}>
        {questions.length === 0 ? <p>No question details are available for this submission yet.</p> : null}
        {supportedQuestions.map((question) => (
          <article key={question.id} className="card">
            <p className="eyebrow">Question {question.orderIndex}</p>
            <h3>{question.prompt}</h3>
            <p>Type: {question.type}</p>
            <p>Max points: {question.maxPoints}</p>
            <label>
              <span>Your answer</span>
              <input
                type="text"
                value={answers[question.id] ?? ""}
                disabled={!isEditable || isPending}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: nextValue
                  }));
                }}
              />
            </label>
          </article>
        ))}
        {unsupportedQuestions.map((question) => (
          <article key={question.id} className="card">
            <p className="eyebrow">Question {question.orderIndex}</p>
            <h3>{question.prompt}</h3>
            <p>Type: {question.type}</p>
            <p>This question type is not editable in the frontend yet.</p>
          </article>
        ))}
        {!isEditable ? (
          <p>This submission is already {currentSubmission.status.toLowerCase()} and can no longer be edited.</p>
        ) : null}
        {supportedQuestions.length > 0 && isEditable ? (
          <button type="submit" disabled={isPending}>
            {isPending ? "Submitting answers..." : "Submit answers"}
          </button>
        ) : null}
        {errorMessage ? <p>{errorMessage}</p> : null}
      </form>
    </section>
  );
}
