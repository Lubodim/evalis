import { AssessmentList } from "../../../components/student/AssessmentList";

export default function StudentAssessmentsLoading() {
  return (
    <main className="page">
      <AssessmentList description="Loading the student assessment list.">
        <p>Loading assessments...</p>
      </AssessmentList>
    </main>
  );
}
