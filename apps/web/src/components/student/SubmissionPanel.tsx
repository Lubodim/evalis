import type { StudentSubmissionDetail } from "../../types/student";

type SubmissionPanelProps = {
  submission?: StudentSubmissionDetail;
};

export function SubmissionPanel({ submission }: SubmissionPanelProps) {
  return (
    <section className="card">
      <p className="eyebrow">Submission</p>
      <h2>Submission state placeholder</h2>
      <p>TODO: render submission metadata, question list, and answer state using backend data.</p>
      <p>Current placeholder state: {submission ? submission.status : "not loaded"}</p>
    </section>
  );
}
