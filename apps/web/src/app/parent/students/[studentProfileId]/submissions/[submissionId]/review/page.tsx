import { getParentSubmissionReview } from "../../../../../../../lib/api/parent";
import type { ParentSubmissionReview } from "../../../../../../../types/parent";

const DEFAULT_PARENT_ID = "cmn0n00fd0005uquo85ohbtzc";

function resolveParentId() {
  return process.env.NEXT_PUBLIC_PARENT_ID ?? process.env.EVALIS_PARENT_ID ?? DEFAULT_PARENT_ID;
}

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

type ParentSubmissionReviewPageProps = {
  params: Promise<{
    studentProfileId: string;
    submissionId: string;
  }>;
};

function ParentReviewContent({ review }: { review: ParentSubmissionReview }) {
  const hasScore = review.result !== null;
  const hasAnswers = review.answers.length > 0;
  const isRestricted = !hasScore && !hasAnswers;

  return (
    <section className="card">
      <p className="eyebrow">Родител</p>
      <h2>Преглед на предаване</h2>
      <p>Статус на предаването: {formatStatus(review.status)}</p>
      <p>Оценяване: {review.assessment.title ?? "Няма заглавие"}</p>
      <p>Предадено на: {formatDate(review.submittedAt)}</p>
      <p>Режим на преглед: {review.assessment.reviewMode ?? "Няма данни"}</p>

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
              <p>Отговор на ученика: {answer.answerText ?? answer.selectedOption ?? "Няма данни"}</p>
              <p>Присъдени точки: {answer.pointsAwarded ?? "Няма данни"}</p>
              <p>Обновено на: {formatDate(answer.updatedAt)}</p>
              {answer.teacherFeedback ? <p>Обратна връзка от учителя: {answer.teacherFeedback}</p> : null}
            </article>
          ))
        : null}

      {isRestricted ? <p>Прегледът за това предаване все още не е достъпен.</p> : null}
    </section>
  );
}

export default async function ParentSubmissionReviewPage({
  params
}: ParentSubmissionReviewPageProps) {
  const { studentProfileId, submissionId } = await params;
  const parentId = resolveParentId();

  try {
    const review = await getParentSubmissionReview(studentProfileId, submissionId, parentId);

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Родител</p>
          <h1>Преглед на предаване {submissionId}</h1>
          <p>Тук виждате само информацията, която е разрешена за родителски преглед.</p>
        </section>
        <ParentReviewContent review={review} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Страницата не успя да зареди прегледа за това предаване.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Родител</p>
          <h1>Преглед на предаване {submissionId}</h1>
          <p>Страницата не успя да зареди прегледа за това предаване.</p>
          <p>{message}</p>
        </section>
      </main>
    );
  }
}