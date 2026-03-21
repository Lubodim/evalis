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
      <section className="card">
        <p className="eyebrow">Отговори</p>
        <h2>Съдържание на предаването</h2>
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
    <section className="card">
      <p className="eyebrow">Отговори</p>
      <h2>Съдържание на предаването</h2>
      <p>
        Тук можеш да попълниш кратките текстови въпроси. Неподдържаните типове засега се показват само за преглед.
      </p>
      <form onSubmit={handleSubmit}>
        {questions.length === 0 ? <p>Все още няма налични въпроси за това предаване.</p> : null}
        {supportedQuestions.map((question) => (
          <article key={question.id} className="card">
            <p className="eyebrow">Въпрос {question.orderIndex}</p>
            <h3>{question.prompt}</h3>
            <p>Тип: {question.type}</p>
            <p>Максимум точки: {question.maxPoints}</p>
            <label>
              <span>Твоят отговор</span>
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
            <p className="eyebrow">Въпрос {question.orderIndex}</p>
            <h3>{question.prompt}</h3>
            <p>Тип: {question.type}</p>
            <p>Този тип въпрос все още не се редактира от интерфейса.</p>
          </article>
        ))}
        {!isEditable ? (
          <p>Това предаване е със статус „{formatSubmissionStatus(currentSubmission.status)}“ и не може да се редактира.</p>
        ) : null}
        {supportedQuestions.length > 0 && isEditable ? (
          <button type="submit" disabled={isPending}>
            {isPending ? "Изпращане..." : "Предай отговорите"}
          </button>
        ) : null}
        {errorMessage ? <p>{errorMessage}</p> : null}
      </form>
    </section>
  );
}