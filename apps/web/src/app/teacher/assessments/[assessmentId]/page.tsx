import { TeacherExamSessionControl } from "../../../../components/teacher/TeacherExamSessionControl";

const DEFAULT_TEACHER_ID = "cmn0n00et0002uquoq5xo2q09";

function resolveTeacherId() {
  return process.env.NEXT_PUBLIC_TEACHER_ID ?? process.env.EVALIS_TEACHER_ID ?? DEFAULT_TEACHER_ID;
}

type TeacherAssessmentPageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function TeacherAssessmentPage({ params }: TeacherAssessmentPageProps) {
  const { assessmentId } = await params;
  const teacherId = resolveTeacherId();

  return (
    <main className="page">
      <div style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "680px" }}>
        <section className="card">
          <p className="eyebrow">Teacher</p>
          <h1>Assessment {assessmentId}</h1>
          <p>Use this page to control the exam session lifecycle for a single assessment.</p>
        </section>
        <TeacherExamSessionControl assessmentId={assessmentId} teacherId={teacherId} />
      </div>
    </main>
  );
}