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
          <p className="eyebrow">Преглед</p>
          <h1>Преглед на предаване {submissionId}</h1>
          <p>Тук виждаш само информацията, която е разрешена за показване по това предаване.</p>
        </section>
        <ReviewPanel review={review} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Страницата не успя да зареди прегледа за това предаване.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Преглед</p>
          <h1>Преглед на предаване {submissionId}</h1>
          <p>Страницата не успя да зареди прегледа за това предаване.</p>
          <p>{message}</p>
        </section>
        <ReviewPanel />
      </main>
    );
  }
}