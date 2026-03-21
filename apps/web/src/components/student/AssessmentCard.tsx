import Link from "next/link";
import type { StudentAssessmentListItem } from "../../types/student";

type AssessmentCardProps = {
  assessment: StudentAssessmentListItem;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const latestSubmission = assessment.submissions?.[0] ?? null;
  const teacherName = assessment.teacher
    ? `${assessment.teacher.firstName} ${assessment.teacher.lastName}`
    : "Teacher not available";

  return (
    <article className="card">
      <p className="eyebrow">{assessment.type}</p>
      <h2>
        <Link href={`/student/assessments/${assessment.id}`}>{assessment.title}</Link>
      </h2>
      <p>{assessment.description ?? "No description provided yet."}</p>
      <p>Class: {assessment.schoolClass.name}</p>
      <p>Teacher: {teacherName}</p>
      <p>Due: {formatDate(assessment.dueAt)}</p>
      <p>Total points: {assessment.totalPoints}</p>
      <p>Submission: {latestSubmission?.status ?? "Not started"}</p>
    </article>
  );
}
