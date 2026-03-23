import { TeacherExamSessionControl } from "../../../../components/teacher/TeacherExamSessionControl";
import { TeacherAssessmentSubmissionsSection } from "../../../../components/teacher/TeacherAssessmentSubmissionsSection";

const DEFAULT_TEACHER_ID = "cmn0n00et0002uquoq5xo2q09";
const DEFAULT_STUDENT_PROFILE_ID = "cmn0n00f20004uquot7fm6fbz";

function resolveTeacherId() {
  return process.env.NEXT_PUBLIC_TEACHER_ID ?? process.env.EVALIS_TEACHER_ID ?? DEFAULT_TEACHER_ID;
}

function resolveStudentProfileId() {
  return (
    process.env.NEXT_PUBLIC_STUDENT_PROFILE_ID ??
    process.env.NEXT_PUBLIC_STUDENT_ID ??
    DEFAULT_STUDENT_PROFILE_ID
  );
}

type TeacherAssessmentPageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function TeacherAssessmentPage({ params }: TeacherAssessmentPageProps) {
  const { assessmentId } = await params;
  const teacherId = resolveTeacherId();
  const studentProfileId = resolveStudentProfileId();

  return (
    <main className="page">
      <div style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "960px" }}>
        <section className="card" style={{ maxWidth: "none" }}>
          <p className="eyebrow">Teacher</p>
          <h1>Assessment {assessmentId}</h1>
          <p>Use this page to control the exam session lifecycle and review submitted work for a single assessment.</p>
        </section>
        <TeacherExamSessionControl
          assessmentId={assessmentId}
          teacherId={teacherId}
          studentProfileId={studentProfileId}
        />
        <TeacherAssessmentSubmissionsSection assessmentId={assessmentId} teacherId={teacherId} />
      </div>
    </main>
  );
}