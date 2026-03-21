import type { ReactNode } from "react";

type AssessmentListProps = {
  children?: ReactNode;
  description?: string;
};

export function AssessmentList({
  children,
  description = "Your assigned assessments will appear here."
}: AssessmentListProps) {
  return (
    <section className="card">
      <p className="eyebrow">Student Assessments</p>
      <h1>Assigned assessments</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}
