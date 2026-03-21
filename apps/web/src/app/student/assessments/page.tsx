import { AssessmentCard } from "../../../components/student/AssessmentCard";
import { AssessmentList } from "../../../components/student/AssessmentList";
import { getStudentAssessments } from "../../../lib/api/student";

const DEFAULT_STUDENT_ID = "cmmxwfmg60004uq0w0iv5likd";

function resolveStudentId() {
  return process.env.NEXT_PUBLIC_STUDENT_ID ?? process.env.EVALIS_STUDENT_ID ?? DEFAULT_STUDENT_ID;
}

export default async function StudentAssessmentsPage() {
  try {
    const assessments = await getStudentAssessments(resolveStudentId());

    return (
      <main className="page">
        <AssessmentList>
          {assessments.length === 0 ? (
            <p>Все още няма възложени оценявания.</p>
          ) : (
            assessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))
          )}
        </AssessmentList>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "В момента списъкът с оценявания не може да бъде зареден.";

    return (
      <main className="page">
        <AssessmentList description="Тук ще виждаш възложените ти оценявания и текущото им състояние.">
          <p>{message}</p>
        </AssessmentList>
      </main>
    );
  }
}