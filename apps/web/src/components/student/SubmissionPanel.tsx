import type { StudentExamContext, StudentSubmissionSummary } from "../../types/student";

type SubmissionPanelProps = {
  assessmentId?: string;
  pending?: boolean;
  errorMessage?: string | null;
  onOpenSubmission?: () => void;
  onOpenLatestSubmission?: () => void;
  examContext?: StudentExamContext;
  latestSubmission?: StudentSubmissionSummary | null;
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

function formatSubmissionStatus(value: string | null | undefined) {
  switch (value) {
    case "DRAFT":
      return "Чернова";
    case "SUBMITTED":
      return "Предадено";
    case "GRADED":
      return "Проверено";
    default:
      return "Няма данни";
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Няма данни";
  }

  return new Date(value).toLocaleString("bg-BG");
}

export function SubmissionPanel({
  assessmentId,
  pending = false,
  errorMessage = null,
  onOpenSubmission,
  onOpenLatestSubmission,
  examContext,
  latestSubmission = null
}: SubmissionPanelProps) {
  const hasOpenExamSession = Boolean(examContext?.hasExamSession);
  const isActiveSession = examContext?.examSessionStatus === "ACTIVE";
  const canOpenCurrentSubmission =
    examContext?.hasExamSession === true &&
    examContext.examSessionStatus === "ACTIVE" &&
    examContext.participantStatus === "APPROVED" &&
    examContext.deviceStatus === "APPROVED";

  if (!hasOpenExamSession && latestSubmission) {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Предишно предаване</h2>
        <p>За това оценяване вече има предишно предаване и в момента няма активна изпитна сесия.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        <p>Последен статус: {formatSubmissionStatus(latestSubmission.status)}</p>
        <p>Предадено на: {formatDate(latestSubmission.submittedAt)}</p>
        <button type="button" onClick={onOpenLatestSubmission}>
          Отвори последното предаване
        </button>
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  if (!hasOpenExamSession && !latestSubmission) {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Няма активна сесия</h2>
        <p>В момента няма активна изпитна сесия за това оценяване.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  if (!isActiveSession) {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Подготовка за предаване</h2>
        <p>Има отворена изпитна сесия, но предаването ще бъде достъпно за работа след стартиране на сесията.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        {examContext?.hasExamSession ? (
          <p>Статус на изпитната сесия: {formatExamStatus(examContext.examSessionStatus)}</p>
        ) : null}
        {latestSubmission ? (
          <p>Има и предишно предаване със статус: {formatSubmissionStatus(latestSubmission.status)}</p>
        ) : null}
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  if (!canOpenCurrentSubmission) {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Изчаква одобрение</h2>
        <p>Изпитната сесия е активна, но трябва първо да приключиш стъпките по одобрение, преди да работиш по предаването.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        <p>Статус на изпитната сесия: {formatExamStatus(examContext?.examSessionStatus)}</p>
        <p>Статус на участието: {examContext?.participantStatus ?? "Няма данни"}</p>
        <p>Статус на устройството: {examContext?.deviceStatus ?? "Няма данни"}</p>
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  return (
    <section className="card">
      <p className="eyebrow">Предаване</p>
      <h2>Текуща работа</h2>
      <p>Можеш да отвориш текущото предаване и да продължиш работата си по време на активната сесия.</p>
      {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
      <p>Статус на изпитната сесия: {formatExamStatus(examContext?.examSessionStatus)}</p>
      {latestSubmission ? <p>Последен статус: {formatSubmissionStatus(latestSubmission.status)}</p> : null}
      <button type="button" disabled={pending} onClick={onOpenSubmission}>
        {pending ? "Отваряне..." : "Отвори текущото предаване"}
      </button>
      {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
    </section>
  );
}