import { AnswerForm } from "../../../../components/student/AnswerForm";
import { SubmissionPanel } from "../../../../components/student/SubmissionPanel";

type StudentSubmissionPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentSubmissionPage({ params }: StudentSubmissionPageProps) {
  const { submissionId } = await params;

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Student Submission</p>
        <h1>Submission {submissionId}</h1>
        <p>TODO: load the student submission detail and wire answer submission when frontend logic is added.</p>
      </section>
      <SubmissionPanel />
      <AnswerForm />
    </main>
  );
}
