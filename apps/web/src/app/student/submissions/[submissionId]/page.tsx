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
    const questionCount = submission.assessment.questions?.length ?? 0;

    return (
      <main className="page">
        <div className="content-stack">
          <section className="card workspace-header-card">
            <div className="workspace-header-row">
              <div>
                <p className="eyebrow">Предаване</p>
                <h1>{submission.assessment.title ?? `Предаване ${submission.id}`}</h1>
              </div>
              <span className="status-pill">{formatStatus(submission.status)}</span>
            </div>
            <p className="workspace-intro">
              Това е текущото ти работно пространство за оценяването. Попълни наличните въпроси и
              предай отговорите, когато си готов.
            </p>
            <div className="meta-grid">
              <p>
                <strong>Предаване ID:</strong> {submission.id}
              </p>
              <p>
                <strong>Предадено на:</strong> {formatDate(submission.submittedAt)}
              </p>
              <p>
                <strong>Тип:</strong> {formatAssessmentType(submission.assessment.type)}
              </p>
              <p>
                <strong>Клас:</strong> {submission.assessment.schoolClass.name}
              </p>
              <p>
                <strong>Брой въпроси:</strong> {questionCount}
              </p>
              <p>
                <strong>Общо точки:</strong> {submission.assessment.totalPoints}
              </p>
            </div>
          </section>
          <AnswerForm submission={submission} studentId={studentId} />
        </div>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Страницата не успя да зареди това предаване.";

    return (
      <main className="page">
        <div className="content-stack">
          <section className="card workspace-header-card">
            <p className="eyebrow">Предаване</p>
            <h1>Предаване {submissionId}</h1>
            <p className="workspace-intro">Страницата не успя да зареди това предаване.</p>
            <p>{message}</p>
          </section>
          <AnswerForm />
        </div>
      </main>
    );
  }
}