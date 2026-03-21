import type { StudentSubmissionReview } from "../../types/student";

type ReviewPanelProps = {
  review?: StudentSubmissionReview;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
}

export function ReviewPanel({ review }: ReviewPanelProps) {
  if (!review) {
    return (
      <section className="card">
        <p className="eyebrow">Review</p>
        <h2>Review</h2>
        <p>Review data is not available yet.</p>
      </section>
    );
  }

  const hasScore = review.result !== null;
  const hasAnswers = review.answers.length > 0;
  const isRestricted = !hasScore && !hasAnswers;

  return (
    <section className="card">
      <p className="eyebrow">Review</p>
      <h2>Review details</h2>
      <p>Submission status: {review.status}</p>
      <p>Assessment: {review.assessment.title ?? "Not available"}</p>
      <p>Review mode: {review.assessment.reviewMode ?? "Not available"}</p>
      <p>Review available at: {formatDate(review.assessment.reviewAvailableAt ?? null)}</p>

      {hasScore ? (
        <section className="card">
          <p className="eyebrow">Score</p>
          <h3>Result summary</h3>
          <p>Total score: {review.result?.totalScore ?? "Not available"}</p>
          <p>Max score: {review.result?.maxScore ?? "Not available"}</p>
          <p>Percentage: {review.result?.percentage ?? "Not available"}</p>
          <p>Published at: {formatDate(review.result?.publishedAt ?? null)}</p>
        </section>
      ) : null}

      {hasAnswers ? (
        review.answers.map((answer) => (
          <article key={answer.id} className="card">
            <p className="eyebrow">Question Review</p>
            <h3>{answer.question?.prompt ?? `Question ${answer.questionId}`}</h3>
            <p>Your answer: {answer.answerText ?? answer.selectedOption ?? "Not available"}</p>
            <p>Points awarded: {answer.pointsAwarded ?? "Not available"}</p>
            <p>Updated at: {formatDate(answer.updatedAt)}</p>
            {answer.teacherFeedback ? <p>Teacher feedback: {answer.teacherFeedback}</p> : null}
          </article>
        ))
      ) : null}

      {isRestricted ? (
        <p>Review details are not available for this submission right now.</p>
      ) : null}
    </section>
  );
}
