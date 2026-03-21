import { AnswerForm } from "../../../../components/student/AnswerForm";
import { getStudentSubmission } from "../../../../lib/api/student";

const DEFAULT_STUDENT_ID = "cmn0n00f20004uquot7fm6fbz";

function resolveStudentId() {
  return process.env.NEXT_PUBLIC_STUDENT_ID ?? process.env.EVALIS_STUDENT_ID ?? DEFAULT_STUDENT_ID;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not submitted yet";
  }

  return new Date(value).toLocaleString();
}

type StudentSubmissionPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentSubmissionPage({ params }: StudentSubmissionPageProps) {
  const { submissionId } = await params;
  const studentId = resolveStudentId();

  try {
    const submission = await getStudentSubmission(submissionId, studentId);

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Submission</p>
          <h1>{submission.assessment.title ?? `Submission ${submission.id}`}</h1>
          <p>Submission ID: {submission.id}</p>
          <p>Status: {submission.status}</p>
          <p>Submitted at: {formatDate(submission.submittedAt)}</p>
          <p>Assessment title: {submission.assessment.title ?? "Not available"}</p>
          <p>Assessment type: {submission.assessment.type}</p>
          <p>Class: {submission.assessment.schoolClass.name}</p>
        </section>
        <AnswerForm submission={submission} studentId={studentId} />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submission.";

    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">Student Submission</p>
          <h1>Submission {submissionId}</h1>
          <p>The frontend could not load this submission.</p>
          <p>{message}</p>
        </section>
        <AnswerForm />
      </main>
    );
  }
}
