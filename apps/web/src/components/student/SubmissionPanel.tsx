import type { StudentExamContext, StudentSubmissionSummary } from "../../types/student";

export type StudentAssessmentCtaMode =
  | "join_waiting"
  | "pending_prep"
  | "locked_current_attempt"
  | "work_active"
  | "historical"
  | "empty";

type StudentAssessmentCtaDecisionInput = {
  examContext?: StudentExamContext;
  latestSubmission?: StudentSubmissionSummary | null;
  activeSessionStartsAt?: string | null;
};

type SubmissionPanelProps = {
  assessmentId?: string;
  mode: StudentAssessmentCtaMode;
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

function isFinishedCurrentAttempt(
  submission: StudentSubmissionSummary | null | undefined,
  activeSessionStartsAt: string | null | undefined
) {
  if (!submission || submission.status === "DRAFT") {
    return false;
  }

  if (!activeSessionStartsAt || !submission.submittedAt) {
    return true;
  }

  return new Date(submission.submittedAt).getTime() >= new Date(activeSessionStartsAt).getTime();
}

export function getStudentAssessmentCtaDecision({
  examContext,
  latestSubmission = null,
  activeSessionStartsAt = null
}: StudentAssessmentCtaDecisionInput): { mode: StudentAssessmentCtaMode } {
  const hasOpenExamSession = examContext?.hasExamSession === true;
  const examSessionId = examContext?.examSessionId ?? null;
  const isWaitingSession = examContext?.examSessionStatus === "WAITING";
  const isActiveSession = examContext?.examSessionStatus === "ACTIVE";
  const isNotJoined = examContext?.participantStatus == null;
  const hasActiveApprovedSession =
    hasOpenExamSession &&
    isActiveSession &&
    examContext?.participantStatus === "APPROVED" &&
    examContext?.deviceStatus === "APPROVED";
  const hasHistoricalFinishedSubmission = latestSubmission !== null && latestSubmission.status !== "DRAFT";

  if (hasOpenExamSession && isWaitingSession && examSessionId !== null && isNotJoined) {
    return { mode: "join_waiting" };
  }

  if (hasOpenExamSession && isActiveSession && !hasActiveApprovedSession) {
    return { mode: "pending_prep" };
  }

  if (hasActiveApprovedSession && isFinishedCurrentAttempt(latestSubmission, activeSessionStartsAt)) {
    return { mode: "locked_current_attempt" };
  }

  if (hasActiveApprovedSession) {
    return { mode: "work_active" };
  }

  if (hasHistoricalFinishedSubmission) {
    return { mode: "historical" };
  }

  if (!hasOpenExamSession && !latestSubmission) {
    return { mode: "empty" };
  }

  return { mode: "pending_prep" };
}

export function SubmissionPanel({
  assessmentId,
  mode,
  pending = false,
  errorMessage = null,
  onOpenSubmission,
  onOpenLatestSubmission,
  examContext,
  latestSubmission = null
}: SubmissionPanelProps) {
  const hasOpenExamSession = Boolean(examContext?.hasExamSession);
  const isActiveSession = examContext?.examSessionStatus === "ACTIVE";

  if (mode === "work_active") {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Текуща работа</h2>
        <p>Можеш да отвориш текущото предаване и да продължиш работата си по време на активната сесия.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        <p>Статус на изпитната сесия: {formatExamStatus(examContext?.examSessionStatus)}</p>
        {latestSubmission ? <p>Текущ работен статус: {formatSubmissionStatus(latestSubmission.status)}</p> : null}
        <button type="button" disabled={pending} onClick={onOpenSubmission}>
          {pending ? "Отваряне..." : "Отвори текущото предаване"}
        </button>
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  if (mode === "locked_current_attempt" || mode === "historical") {
    return (
      <section className="card">
        <p className="eyebrow">Предаване</p>
        <h2>Последно предаване</h2>
        <p>Последното ти предаване вече е изпратено и не може да бъде отваряно отново за редакция.</p>
        {assessmentId ? <p>Оценяване ID: {assessmentId}</p> : null}
        <p>Последен статус: {formatSubmissionStatus(latestSubmission?.status)}</p>
        <p>Предадено на: {formatDate(latestSubmission?.submittedAt)}</p>
        {mode === "locked_current_attempt" ? (
          <p>Текущият активен опит вече е приключен и не може да бъде отворен повторно за работа.</p>
        ) : hasOpenExamSession ? (
          <p>Има отворена изпитна сесия, но за това предаване не се отваря нов работен опит.</p>
        ) : null}
        <button type="button" disabled={pending} onClick={onOpenLatestSubmission}>
          {pending ? "Проверка на прегледа..." : "Отвори последното предаване"}
        </button>
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

  if (mode === "empty") {
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
          <p>Текущ работен статус: {formatSubmissionStatus(latestSubmission.status)}</p>
        ) : null}
        {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
      </section>
    );
  }

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