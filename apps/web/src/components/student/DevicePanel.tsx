import type { StudentExamDeviceState } from "../../types/student";

type DevicePanelProps = {
  examSessionId?: string | null;
  deviceState?: StudentExamDeviceState | null;
  loading?: boolean;
  pending?: boolean;
  errorMessage?: string | null;
  onRegister?: () => void;
};

function renderValue(value: string | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "Няма данни";
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Не";
  }

  switch (value) {
    case "PENDING":
      return "Чака одобрение";
    case "APPROVED":
      return "Одобрено";
    default:
      return value;
  }
}

export function DevicePanel({
  examSessionId = null,
  deviceState = null,
  loading = false,
  pending = false,
  errorMessage = null,
  onRegister
}: DevicePanelProps) {
  if (!examSessionId) {
    return (
      <section className="card">
        <p className="eyebrow">Устройство</p>
        <h2>Състояние на устройството</h2>
        <p>Няма налична изпитна сесия, затова няма и данни за устройство.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="card">
        <p className="eyebrow">Устройство</p>
        <h2>Състояние на устройството</h2>
        <p>Зареждане на данните за устройството...</p>
      </section>
    );
  }

  const hasDevice = Boolean(deviceState?.device);
  const canRegisterDevice = deviceState !== null && deviceState.device === null;

  return (
    <section className="card">
      <p className="eyebrow">Устройство</p>
      <h2>Състояние на устройството</h2>
      <p>Сесия ID: {renderValue(examSessionId)}</p>
      <p>Има устройство: {renderValue(hasDevice)}</p>
      <p>Статус: {renderValue(deviceState?.device?.status ?? null)}</p>
      <p>Код на устройството: {renderValue(deviceState?.device?.deviceCode ?? null)}</p>
      {canRegisterDevice ? (
        <button type="button" disabled={pending} onClick={onRegister}>
          {pending ? "Регистриране..." : "Регистрирай устройство"}
        </button>
      ) : null}
      {errorMessage ? <p>Грешка: {errorMessage}</p> : null}
    </section>
  );
}