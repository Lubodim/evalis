import type { StudentSubmissionDetail } from "../../types/student";

type AnswerFormProps = {
  submission?: StudentSubmissionDetail;
};

export function AnswerForm({ submission }: AnswerFormProps) {
  return (
    <section className="card">
      <p className="eyebrow">Answer Form</p>
      <h2>Answer entry placeholder</h2>
      <p>
        TODO: wire question inputs and POST /student/submissions/:submissionId/answers. This action also finalizes the
        student submission in the current backend.
      </p>
      <p>Questions available: {submission?.assessment.questions?.length ?? 0}</p>
    </section>
  );
}
