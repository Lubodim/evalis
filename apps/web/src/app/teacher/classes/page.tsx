import Link from "next/link";
import { getTeacherClasses } from "../../../lib/api/teacher";

const DEFAULT_TEACHER_ID = "cmn0n00et0002uquoq5xo2q09";

function resolveTeacherId() {
  return process.env.NEXT_PUBLIC_TEACHER_ID ?? process.env.EVALIS_TEACHER_ID ?? DEFAULT_TEACHER_ID;
}

export default async function TeacherClassesPage() {
  const teacherId = resolveTeacherId();

  try {
    const classes = await getTeacherClasses(teacherId);

    return (
      <main className="page">
        <div style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "960px" }}>
          <section className="card" style={{ maxWidth: "none" }}>
            <p className="eyebrow">Teacher</p>
            <h1>Your Classes</h1>
            <p>Open one of your visible classes to review class operations, assessments, and student activity.</p>
          </section>

          {classes.length === 0 ? (
            <section className="card" style={{ maxWidth: "none" }}>
              <p>No visible classes are available yet.</p>
            </section>
          ) : (
            classes.map((schoolClass) => (
              <section
                key={schoolClass.id}
                className="card"
                style={{
                  maxWidth: "none",
                  display: "grid",
                  gap: "8px"
                }}
              >
                <p className="eyebrow">Teacher</p>
                <h2>{schoolClass.name}</h2>
                <p>Display label: {schoolClass.displayLabel ?? "Not available"}</p>
                <p>Subject: {schoolClass.subject}</p>
                <p>School year: {schoolClass.schoolYear}</p>
                <p>Status: {schoolClass.isActive ? "Active" : "Inactive"}</p>
                <p>Students: {schoolClass._count.enrollments}</p>
                <p>Assessments: {schoolClass._count.assessments}</p>
                <div>
                  <Link href={`/teacher/classes/${schoolClass.id}`}>Open class operations</Link>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The teacher classes list could not be loaded.";

    return (
      <main className="page">
        <div style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "960px" }}>
          <section className="card" style={{ maxWidth: "none" }}>
            <p className="eyebrow">Teacher</p>
            <h1>Your Classes</h1>
            <p>The teacher classes list could not be loaded.</p>
            <p>{message}</p>
          </section>
        </div>
      </main>
    );
  }
}
