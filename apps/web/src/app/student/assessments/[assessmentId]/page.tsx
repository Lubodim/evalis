import { AssessmentExamContextSection } from "../../../../components/student/AssessmentExamContextSection";
import { getAssessmentExamContext, getStudentAssessments } from "../../../../lib/api/student";

const DEFAULT_STUDENT_ID = "cmmxwfmg60004uq0w0iv5likd";

function resolveStudentId() {
  return process.env.NEXT_PUBLIC_STUDENT_ID ?? process.env.EVALIS_STUDENT_ID ?? DEFAULT_STUDENT_ID;
}

type StudentAssessmentDetailPageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function StudentAssessmentDetailPage({
  params
}: StudentAssessmentDetailPageProps) {
  const { assessmentId } = await params;
  const studentId = resolveStudentId();

  try {
    const [examContext, assessments] = await Promise.all([
      getAssessmentExamContext(assessmentId, studentId),
      getStudentAssessments(studentId)
    ]);
    const currentAssessment = assessments.find((assessment) => assessment.id === assessmentId) ?? null;
    const latestSubmission = currentAssessment?.submissions?.[0] ?? null;

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Оценяване</p>
          <h1>Оценяване {assessmentId}</h1>
          <p>Тук виждаш текущата изпитна сесия и състоянието на участието си за това оценяване.</p>
        </section>
        <AssessmentExamContextSection
          assessmentId={assessmentId}
          studentId={studentId}
          initialContext={examContext}
          latestSubmission={latestSubmission}
        />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Страницата не успя да зареди изпитния контекст за това оценяване.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Оценяване</p>
          <h1>Оценяване {assessmentId}</h1>
          <p>Страницата не успя да зареди информацията за това оценяване.</p>
          <p>{message}</p>
        </section>
      </main>
    );
  }
}