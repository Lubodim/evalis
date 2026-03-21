import { AnswerForm } from "../../../../components/student/AnswerForm";
import { AssessmentExamContextSection } from "../../../../components/student/AssessmentExamContextSection";
import { SubmissionPanel } from "../../../../components/student/SubmissionPanel";
import { getAssessmentExamContext } from "../../../../lib/api/student";

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
    const examContext = await getAssessmentExamContext(assessmentId, studentId);

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Assessment</p>
          <h1>Assessment {assessmentId}</h1>
          <p>This page currently shows the backend exam context for this assessment.</p>
        </section>
        <AssessmentExamContextSection
          assessmentId={assessmentId}
          studentId={studentId}
          initialContext={examContext}
        />
        <SubmissionPanel />
        <AnswerForm />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load exam context.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Assessment</p>
          <h1>Assessment {assessmentId}</h1>
          <p>The frontend could not load the exam context for this assessment.</p>
          <p>{message}</p>
        </section>
        <SubmissionPanel />
        <AnswerForm />
      </main>
    );
  }
}
