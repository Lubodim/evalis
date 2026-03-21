import { AssessmentList } from "../../../components/student/AssessmentList";

export default function StudentAssessmentsLoading() {
  return (
    <main className="page">
      <AssessmentList description="Зареждане на списъка с оценявания.">
        <p>Моля, изчакай...</p>
      </AssessmentList>
    </main>
  );
}