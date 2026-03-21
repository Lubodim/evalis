import type { StudentExamContext } from "../../types/student";

type ExamContextPanelProps = {
  context?: StudentExamContext;
};

function renderValue(value: string | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

export function ExamContextPanel({ context }: ExamContextPanelProps) {
  if (!context) {
    return (
      <section className="card">
        <p className="eyebrow">Exam Context</p>
        <h2>Exam session state</h2>
        <p>Exam context is not loaded yet.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="eyebrow">Exam Context</p>
      <h2>Exam session state</h2>
      <p>Assessment ID: {context.assessmentId}</p>
      <p>Has open exam session: {renderValue(context.hasExamSession)}</p>
      <p>Exam session ID: {renderValue(context.examSessionId)}</p>
      <p>Exam session status: {renderValue(context.examSessionStatus)}</p>
      <p>Participant status: {renderValue(context.participantStatus)}</p>
      <p>Has device: {renderValue(context.hasDevice)}</p>
      <p>Device status: {renderValue(context.deviceStatus)}</p>
    </section>
  );
}
