import type { StudentSubmissionDetail } from "../../types/student";

type ReviewPanelProps = {
  review?: StudentSubmissionDetail;
};

export function ReviewPanel({ review }: ReviewPanelProps) {
  return (
    <section className="card">
      <p className="eyebrow">Review</p>
      <h2>Review visibility placeholder</h2>
      <p>TODO: render only the backend-provided review payload without inventing extra student rules.</p>
      <p>Current placeholder state: {review ? review.status : "not loaded"}</p>
    </section>
  );
}
