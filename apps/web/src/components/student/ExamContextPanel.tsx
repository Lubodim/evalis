import type { StudentExamContext } from "../../types/student";

type ExamContextPanelProps = {
  context?: StudentExamContext;
};

function renderValue(value: string | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "Няма данни";
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Не";
  }

  switch (value) {
    case "WAITING":
      return "Очаква начало";
    case "ACTIVE":
      return "Активна";
    case "JOINED":
      return "Присъединен";
    case "APPROVED":
      return "Одобрен";
    case "PENDING":
      return "Чака одобрение";
    default:
      return value;
  }
}

export function ExamContextPanel({ context }: ExamContextPanelProps) {
  if (!context) {
    return (
      <section className="card">
        <p className="eyebrow">Изпитна сесия</p>
        <h2>Състояние на сесията</h2>
        <p>Информацията за изпитната сесия все още не е заредена.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="eyebrow">Изпитна сесия</p>
      <h2>Състояние на сесията</h2>
      <p>Оценяване ID: {context.assessmentId}</p>
      <p>Има отворена сесия: {renderValue(context.hasExamSession)}</p>
      <p>Сесия ID: {renderValue(context.examSessionId)}</p>
      <p>Статус на сесията: {renderValue(context.examSessionStatus)}</p>
      <p>Статус на участието: {renderValue(context.participantStatus)}</p>
      <p>Има устройство: {renderValue(context.hasDevice)}</p>
      <p>Статус на устройството: {renderValue(context.deviceStatus)}</p>
    </section>
  );
}