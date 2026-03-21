import { ReviewPanel } from "../../../../../components/student/ReviewPanel";

type StudentSubmissionReviewPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentSubmissionReviewPage({
  params
}: StudentSubmissionReviewPageProps) {
  const { submissionId } = await params;

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Student Review</p>
        <h1>Review for submission {submissionId}</h1>
        <p>TODO: load the filtered backend review payload and render only the returned visibility data.</p>
      </section>
      <ReviewPanel />
    </main>
  );
}
