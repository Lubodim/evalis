import type { ReactNode } from "react";

type AssessmentListProps = {
  children?: ReactNode;
  description?: string;
};

export function AssessmentList({
  children,
  description = "Тук ще виждаш възложените ти оценявания."
}: AssessmentListProps) {
  return (
    <section className="card">
      <p className="eyebrow">Оценявания</p>
      <h1>Моите оценявания</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}