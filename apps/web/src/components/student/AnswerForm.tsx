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

function formatSubmissionStatus(value: StudentSubmissionDetail["status"]) {
  switch (value) {
    case "DRAFT":
      return "Чернова";
    case "SUBMITTED":
      return "Предадено";
    case "GRADED":
      return "Проверено";
    default:
      return value;
  }
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
      <section className="card workspace-section-card">
        <p className="eyebrow">Отговори</p>
        <h2>Работно съдържание</h2>
        <p>Данните за предаването не са налични.</p>
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
      setErrorMessage("Липсва студентска идентификация за изпращане на отговорите.");
      return;
    }

    if (!isEditable) {
      setErrorMessage("Това предаване вече не може да се редактира.");
      return;
    }

    const payloadAnswers = supportedQuestions.map((question) => ({
      questionId: question.id,
      answerText: (answers[question.id] ?? "").trim()
    }));

    const emptyAnswer = payloadAnswers.find((answer) => !answer.answerText);

    if (emptyAnswer) {
      setErrorMessage("Моля, попълни всички поддържани отговори преди изпращане.");
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
      setErrorMessage(
        error instanceof Error ? `Грешка: ${error.message}` : "Неуспешно изпращане на отговорите."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card workspace-section-card">
      <div className="workspace-header-row">
        <div>
          <p className="eyebrow">Отговори</p>
          <h2>Работно съдържание</h2>
        </div>
        <span className="status-pill">{formatSubmissionStatus(currentSubmission.status)}</span>
      </div>

      <p className="workspace-intro">
        Попълни въпросите по-долу и предай отговорите си, когато си готов. Неподдържаните типове се
        показват само за преглед.
      </p>

      <form onSubmit={handleSubmit} className="workspace-form">
        {questions.length === 0 ? (
          <div className="workspace-note">
            <p>Все още няма налични въпроси за това предаване.</p>
          </div>
        ) : null}

        {supportedQuestions.map((question) => (
          <article key={question.id} className="workspace-question-card">
            <div className="workspace-question-header">
              <p className="eyebrow">Въпрос {question.orderIndex}</p>
              <span className="question-points">{question.maxPoints} т.</span>
            </div>
            <h3>{question.prompt}</h3>
            <p className="question-type">Тип: {question.type}</p>
            <label className="workspace-field">
              <span>Твоят отговор</span>
              <textarea
                rows={4}
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
          <article key={question.id} className="workspace-question-card">
            <div className="workspace-question-header">
              <p className="eyebrow">Въпрос {question.orderIndex}</p>
              <span className="question-points">{question.maxPoints} т.</span>
            </div>
            <h3>{question.prompt}</h3>
            <p className="question-type">Тип: {question.type}</p>
            <div className="workspace-note">
              <p>Този тип въпрос все още не се редактира от интерфейса.</p>
            </div>
          </article>
        ))}

        {!isEditable ? (
          <div className="workspace-note">
            <p>
              Това предаване е със статус „{formatSubmissionStatus(currentSubmission.status)}“ и е само за
              преглед.
            </p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="workspace-note workspace-note-error">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {supportedQuestions.length > 0 && isEditable ? (
          <div className="workspace-actions">
            <button type="submit" disabled={isPending}>
              {isPending ? "Изпращане..." : "Предай отговорите"}
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}