import type { StudentExamContext } from "../../types/student";

type SubmissionPanelProps = {
  assessmentId?: string;
  pending?: boolean;
  errorMessage?: string | null;
  onOpenSubmission?: () => void;
  examContext?: StudentExamContext;
};

function formatExamStatus(value: string | null | undefined) {
  switch (value) {
    case "WAITING":
      return "Очаква начало";
    case "ACTIVE":
      return "Активна";
    default:
      return "Няма данни";
  }
}

export function SubmissionPanel({
  assessmentId,
  pending = false,
  errorMessage = null,
  onOpenSubmission,
  examContext
}: SubmissionPanelProps) {
  return (
    <section className="card">
      <p className="eyebrow">Предаване</p>
      <h2>Начало на работа</h2>
      <p>С този бутон можеш да започнеш ново предаване или да продължиш вече започнато.</p>
      {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
      {examContext?.hasExamSession ? (
        <p>Статус на изпитната сесия: {formatExamStatus(examContext.examSessionStatus)}</p>
      ) : null}
      <button type="button" disabled={pending} onClick={onOpenSubmission}>
        {pending ? "Отваряне..." : "Започни или продължи"}
      </button>
      {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
    </section>
  );
}