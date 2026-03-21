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
      <p className="eyebrow">Присъединяване</p>
      <h2>Присъедини се към сесията</h2>
      <p>Ако сесията изчаква начало, можеш да се присъединиш преди стъпките за устройство и предаване.</p>
      <button type="button" disabled={disabled || pending} onClick={onClick}>
        {pending ? "Присъединяване..." : "Присъедини се"}
      </button>
      {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
    </section>
  );
}