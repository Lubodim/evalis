import { AnswerForm } from "../../../../components/student/AnswerForm";
import { getStudentSubmission } from "../../../../lib/api/student";

const DEFAULT_STUDENT_ID = "cmn0n00f20004uquot7fm6fbz";

function resolveStudentId() {
  return process.env.NEXT_PUBLIC_STUDENT_ID ?? process.env.EVALIS_STUDENT_ID ?? DEFAULT_STUDENT_ID;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Все още не е предадено";
  }

  return new Date(value).toLocaleString("bg-BG");
}

function formatStatus(value: string) {
  switch (value) {
    case "DRAFT":
      return "Чернова";
    case "SUBMITTED":
      return "Предадено";
    case "GRADED":
      return "Проверено";
    default:
      return value;
  }
}

function formatAssessmentType(value: string) {
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

type StudentSubmissionPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentSubmissionPage({ params }: StudentSubmissionPageProps) {
  const { submissionId } = await params;
  const studentId = resolveStudentId();

  try {
    const submission = await getStudentSubmission(submissionId, studentId);

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Предаване</p>
          <h1>{submission.assessment.title ?? `Предаване ${submission.id}`}</h1>
          <p>Предаване ID: {submission.id}</p>
          <p>Статус: {formatStatus(submission.status)}</p>
          <p>Предадено на: {formatDate(submission.submittedAt)}</p>
          <p>Оценяване: {submission.assessment.title ?? "Няма заглавие"}</p>
          <p>Тип: {formatAssessmentType(submission.assessment.type)}</p>
          <p>Клас: {submission.assessment.schoolClass.name}</p>
        </section>
        <AnswerForm submission={submission} studentId={studentId} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Страницата не успя да зареди това предаване.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Предаване</p>
          <h1>Предаване {submissionId}</h1>
          <p>Страницата не успя да зареди това предаване.</p>
          <p>{message}</p>
        </section>
        <AnswerForm />
      </main>
    );
  }
}