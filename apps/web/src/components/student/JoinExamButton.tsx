type JoinExamButtonProps = {
  disabled?: boolean;
  pending?: boolean;
  errorMessage?: string | null;
  onClick?: () => void;
};

export function JoinExamButton({
  disabled = true,
  pending = false,
  errorMessage = null,
  onClick
}: JoinExamButtonProps) {
  return (
    <section className="card">
      <p className="eyebrow">Join Exam</p>
      <h2>Join exam</h2>
      <p>Use this action to join a waiting exam session before device approval and submission steps.</p>
      <button type="button" disabled={disabled || pending} onClick={onClick}>
        {pending ? "Joining..." : "Join exam"}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </section>
  );
}
