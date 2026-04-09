import { TeacherClassOperationsSection } from "../../../../components/teacher/TeacherClassOperationsSection";

const DEFAULT_TEACHER_ID = "cmn0n00et0002uquoq5xo2q09";
const DEFAULT_TEACHER_2_ID = "cmnasdocd0003uqiglqas1jur";

function resolveTeacherId(classId: string) {
  if (classId === "seed-school-class-teacher-2") {
    return (
      process.env.NEXT_PUBLIC_TEACHER_2_ID ??
      process.env.EVALIS_TEACHER_2_ID ??
      DEFAULT_TEACHER_2_ID
    );
  }

  return process.env.NEXT_PUBLIC_TEACHER_ID ?? process.env.EVALIS_TEACHER_ID ?? DEFAULT_TEACHER_ID;
}

type TeacherClassPageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function TeacherClassPage({ params }: TeacherClassPageProps) {
  const { classId } = await params;
  const teacherId = resolveTeacherId(classId);

  return (
    <main className="page">
      <div style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "960px" }}>
        <section className="card" style={{ maxWidth: "none" }}>
          <p className="eyebrow">Teacher</p>
          <h1>Class {classId}</h1>
          <p>Use this page to review class operations, inspect the roster, and open one student at a time for operational detail.</p>
        </section>
        <TeacherClassOperationsSection classId={classId} teacherId={teacherId} />
      </div>
    </main>
  );
}
