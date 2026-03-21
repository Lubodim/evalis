import type { StudentSubmissionReview } from "../../types/student";

type ReviewPanelProps = {
  review?: StudentSubmissionReview;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Няма данни";
  }

  return new Date(value).toLocaleString("bg-BG");
}

function formatStatus(value: string | undefined) {
  switch (value) {
    case "DRAFT":
      return "Чернова";
    case "SUBMITTED":
      return "Предадено";
    case "GRADED":
      return "Проверено";
    default:
      return value ?? "Няма данни";
  }
}

function formatReviewMode(value: string | undefined) {
  switch (value) {
    case "NONE":
      return "Без преглед";
    case "SCORE_ONLY":
      return "Само резултат";
    case "ANSWERS_NO_EXPLANATIONS":
      return "Отговори без обяснения";
    case "ANSWERS_WITH_EXPLANATIONS":
      return "Отговори с обяснения";
    default:
      return value ?? "Няма данни";
  }
}

export function ReviewPanel({ review }: ReviewPanelProps) {
  if (!review) {
    return (
      <section className="card">
        <p className="eyebrow">Преглед</p>
        <h2>Резултати и преглед</h2>
        <p>Няма налични данни за преглед.</p>
      </section>
    );
  }

  const hasScore = review.result !== null;
  const hasAnswers = review.answers.length > 0;
  const isRestricted = !hasScore && !hasAnswers;

  return (
    <section className="card">
      <p className="eyebrow">Преглед</p>
      <h2>Резултати и преглед</h2>
      <p>Статус на предаването: {formatStatus(review.status)}</p>
      <p>Оценяване: {review.assessment.title ?? "Няма заглавие"}</p>
      <p>Режим на преглед: {formatReviewMode(review.assessment.reviewMode)}</p>
      <p>Достъпно от: {formatDate(review.assessment.reviewAvailableAt ?? null)}</p>

      {hasScore ? (
        <section className="card">
          <p className="eyebrow">Резултат</p>
          <h3>Обобщение</h3>
          <p>Общо точки: {review.result?.totalScore ?? "Няма данни"}</p>
          <p>Максимум точки: {review.result?.maxScore ?? "Няма данни"}</p>
          <p>Процент: {review.result?.percentage ?? "Няма данни"}</p>
          <p>Публикувано на: {formatDate(review.result?.publishedAt ?? null)}</p>
        </section>
      ) : null}

      {hasAnswers
        ? review.answers.map((answer) => (
            <article key={answer.id} className="card">
              <p className="eyebrow">Преглед на въпрос</p>
              <h3>{answer.question?.prompt ?? `Въпрос ${answer.questionId}`}</h3>
              <p>Твоят отговор: {answer.answerText ?? answer.selectedOption ?? "Няма данни"}</p>
              <p>Присъдени точки: {answer.pointsAwarded ?? "Няма данни"}</p>
              <p>Обновено на: {formatDate(answer.updatedAt)}</p>
              {answer.teacherFeedback ? <p>Обратна връзка: {answer.teacherFeedback}</p> : null}
            </article>
          ))
        : null}

      {isRestricted ? <p>Подробният преглед за това предаване все още не е достъпен.</p> : null}
    </section>
  );
}