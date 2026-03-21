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
    return "Not available";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
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
        <p className="eyebrow">Device</p>
        <h2>Device state</h2>
        <p>Device state is unavailable because there is no exam session for this assessment.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="card">
        <p className="eyebrow">Device</p>
        <h2>Device state</h2>
        <p>Loading device state...</p>
      </section>
    );
  }

  const hasDevice = Boolean(deviceState?.device);
  const canRegisterDevice = deviceState !== null && deviceState.device === null;

  return (
    <section className="card">
      <p className="eyebrow">Device</p>
      <h2>Device state</h2>
      <p>Exam session ID: {renderValue(examSessionId)}</p>
      <p>Has device: {renderValue(hasDevice)}</p>
      <p>Device status: {renderValue(deviceState?.device?.status ?? null)}</p>
      <p>Device code: {renderValue(deviceState?.device?.deviceCode ?? null)}</p>
      {canRegisterDevice ? (
        <button type="button" disabled={pending} onClick={onRegister}>
          {pending ? "Registering..." : "Register device"}
        </button>
      ) : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
    </section>
  );
}
