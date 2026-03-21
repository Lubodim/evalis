import Link from "next/link";
import type { StudentAssessmentListItem } from "../../types/student";

type AssessmentCardProps = {
  assessment: StudentAssessmentListItem;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Няма срок";
  }

  return new Date(value).toLocaleDateString("bg-BG");
}

function formatAssessmentType(value: StudentAssessmentListItem["type"]) {
  switch (value) {
    case "QUIZ":
      return "Куиз";
    case "ASSIGNMENT":
      return "Задание";
    case "TEST":
      return "Тест";
    default:
      return value;
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
      return "Няма предаване";
  }
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const latestSubmission = assessment.submissions?.[0] ?? null;
  const teacherName = assessment.teacher
    ? `${assessment.teacher.firstName} ${assessment.teacher.lastName}`
    : "Няма данни за преподавател";

  return (
    <article className="card">
      <p className="eyebrow">{formatAssessmentType(assessment.type)}</p>
      <h2>
        <Link href={`/student/assessments/${assessment.id}`}>{assessment.title}</Link>
      </h2>
      <p>{assessment.description ?? "Няма описание."}</p>
      <p>Клас: {assessment.schoolClass.name}</p>
      <p>Преподавател: {teacherName}</p>
      <p>Краен срок: {formatDate(assessment.dueAt)}</p>
      <p>Точки: {assessment.totalPoints}</p>
      <p>Предаване: {formatSubmissionStatus(latestSubmission?.status)}</p>
    </article>
  );
}