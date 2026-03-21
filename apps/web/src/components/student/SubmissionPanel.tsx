import type { StudentExamContext } from "../../types/student";

type SubmissionPanelProps = {
  assessmentId?: string;
  pending?: boolean;
  errorMessage?: string | null;
  onOpenSubmission?: () => void;
  examContext?: StudentExamContext;
};

export function SubmissionPanel({
  assessmentId,
  pending = false,
  errorMessage = null,
  onOpenSubmission,
  examContext
}: SubmissionPanelProps) {
  return (
    <section className="card">
      <p className="eyebrow">Submission</p>
      <h2>Submission action</h2>
      <p>Use the existing backend submission flow to create or continue your submission for this assessment.</p>
      {assessmentId ? <p>Assessment ID: {assessmentId}</p> : null}
      {examContext?.hasExamSession ? (
        <p>Current exam session status: {examContext.examSessionStatus ?? "Not available"}</p>
      ) : null}
      <button type="button" disabled={pending} onClick={onOpenSubmission}>
        {pending ? "Opening submission..." : "Start or continue submission"}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </section>
  );
}
