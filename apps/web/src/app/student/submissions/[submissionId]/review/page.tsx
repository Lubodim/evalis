import { ReviewPanel } from "../../../../../components/student/ReviewPanel";
import { getStudentSubmissionReview } from "../../../../../lib/api/student";

const DEFAULT_STUDENT_ID = "cmn0n00f20004uquot7fm6fbz";

function resolveStudentId() {
  return process.env.NEXT_PUBLIC_STUDENT_ID ?? process.env.EVALIS_STUDENT_ID ?? DEFAULT_STUDENT_ID;
}

type StudentSubmissionReviewPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentSubmissionReviewPage({
  params
}: StudentSubmissionReviewPageProps) {
  const { submissionId } = await params;
  const studentId = resolveStudentId();

  try {
    const review = await getStudentSubmissionReview(submissionId, studentId);

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Review</p>
          <h1>Review for submission {submissionId}</h1>
          <p>This page shows only the review data returned by the backend.</p>
        </section>
        <ReviewPanel review={review} />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load review.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Review</p>
          <h1>Review for submission {submissionId}</h1>
          <p>The frontend could not load the review for this submission.</p>
          <p>{message}</p>
        </section>
        <ReviewPanel />
      </main>
    );
  }
}
