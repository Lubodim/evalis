"use client";

import { useEffect, useState, useTransition } from "react";
import {
  approveTeacherExamParticipant,
  approveTeacherExamParticipantDevice,
  createTeacherExamSession,
  endTeacherExamSession,
  getCurrentTeacherExamSession,
  getTeacherExamSession,
  getTeacherExamSessionDevices,
  startTeacherExamSession
} from "../../lib/api/teacher";
import type {
  TeacherExamSessionDetail,
  TeacherExamSessionDevicesDetail,
  TeacherExamSessionDeviceStatus,
  TeacherExamSessionParticipantStatus,
  TeacherExamSessionStatus
} from "../../types/teacher";

type TeacherExamSessionControlProps = {
  assessmentId: string;
  teacherId: string;
  studentProfileId: string;
};

type PendingAction =
  | "create"
  | "refresh"
  | "start"
  | "end"
  | "approveParticipant"
  | "approveDevice"
  | null;

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("bg-BG");
}

function formatStatus(value: TeacherExamSessionStatus) {
  switch (value) {
    case "WAITING":
      return "WAITING";
    case "ACTIVE":
      return "ACTIVE";
    case "ENDED":
      return "ENDED";
    default:
      return value;
  }
}

function formatParticipantStatus(value: TeacherExamSessionParticipantStatus) {
  switch (value) {
    case "JOINED":
      return "JOINED";
    case "APPROVED":
      return "APPROVED";
    default:
      return value;
  }
}

function formatDeviceStatus(value: TeacherExamSessionDeviceStatus) {
  switch (value) {
    case "PENDING":
      return "PENDING";
    case "APPROVED":
      return "APPROVED";
    default:
      return value;
  }
}

function buildStorageKey(assessmentId: string, teacherId: string) {
  return `evalis:teacher-exam-session:${teacherId}:${assessmentId}`;
}

export function TeacherExamSessionControl({
  assessmentId,
  teacherId,
  studentProfileId
}: TeacherExamSessionControlProps) {
  const [examSession, setExamSession] = useState<TeacherExamSessionDetail | null>(null);
  const [devicesState, setDevicesState] = useState<TeacherExamSessionDevicesDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceErrorMessage, setDeviceErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const storageKey = buildStorageKey(assessmentId, teacherId);
  const canCreate = examSession === null && !isRestoring;
  const canStart = examSession?.status === "WAITING";
  const canEnd = examSession?.status === "WAITING" || examSession?.status === "ACTIVE";
  const participant =
    examSession?.participants.find(
      (sessionParticipant) => sessionParticipant.studentProfileId === studentProfileId
    ) ?? null;
  const canApproveParticipant = participant !== null && participant.status !== "APPROVED";
  const deviceParticipant =
    devicesState?.participants.find(
      (sessionParticipant) => sessionParticipant.studentProfileId === studentProfileId
    ) ?? null;
  const device = deviceParticipant?.device ?? null;
  const canApproveDevice =
    examSession?.status === "WAITING" && device !== null && device.status !== "APPROVED";

  function clearStoredSessionId() {
    window.localStorage.removeItem(storageKey);
  }

  function syncStoredSessionId(nextSession: TeacherExamSessionDetail | null) {
    if (!nextSession || nextSession.status === "ENDED") {
      clearStoredSessionId();
      return;
    }

    window.localStorage.setItem(storageKey, nextSession.id);
  }

  async function loadDevices(examSessionId: string) {
    try {
      setDeviceErrorMessage(null);
      setIsDeviceLoading(true);
      const nextDevicesState = await getTeacherExamSessionDevices(examSessionId, teacherId);
      setDevicesState(nextDevicesState);
    } catch (error) {
      setDevicesState(null);
      setDeviceErrorMessage(
        error instanceof Error ? error.message : "The device state could not be loaded."
      );
    } finally {
      setIsDeviceLoading(false);
    }
  }

  async function applySession(nextSession: TeacherExamSessionDetail | null) {
    setExamSession(nextSession);
    syncStoredSessionId(nextSession);

    if (!nextSession) {
      setDevicesState(null);
      return;
    }

    await loadDevices(nextSession.id);
  }

  async function refreshSession(examSessionId: string) {
    setPendingAction("refresh");
    const nextSession = await getTeacherExamSession(examSessionId, teacherId);
    await applySession(nextSession);
  }

  useEffect(() => {
    const storedExamSessionId = window.localStorage.getItem(storageKey);

    void (async () => {
      try {
        const currentSession = await getCurrentTeacherExamSession(assessmentId, teacherId);

        if (currentSession) {
          await applySession(currentSession);
          return;
        }

        clearStoredSessionId();
        setExamSession(null);
        setDevicesState(null);
      } catch (currentError) {
        if (!storedExamSessionId) {
          setExamSession(null);
          setDevicesState(null);
          setErrorMessage(
            currentError instanceof Error
              ? currentError.message
              : "The current exam session could not be loaded."
          );
          return;
        }

        try {
          const restoredSession = await getTeacherExamSession(storedExamSessionId, teacherId);
          await applySession(restoredSession);
        } catch (storedError) {
          clearStoredSessionId();
          setExamSession(null);
          setDevicesState(null);
          setErrorMessage(
            storedError instanceof Error
              ? storedError.message
              : "The current exam session could not be restored."
          );
        }
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [assessmentId, storageKey, teacherId]);

  function runAction(action: Exclude<PendingAction, "refresh" | null>, handler: () => Promise<string>) {
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          setPendingAction(action);
          const examSessionId = await handler();
          await refreshSession(examSessionId);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "The exam session action could not be completed."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function handleCreate() {
    runAction("create", async () => {
      const createdSession = await createTeacherExamSession(assessmentId, teacherId);
      return createdSession.id;
    });
  }

  function handleStart() {
    if (!examSession) {
      return;
    }

    runAction("start", async () => {
      await startTeacherExamSession(examSession.id, teacherId);
      return examSession.id;
    });
  }

  function handleEnd() {
    if (!examSession) {
      return;
    }

    runAction("end", async () => {
      await endTeacherExamSession(examSession.id, teacherId);
      return examSession.id;
    });
  }

  function handleApproveParticipant() {
    if (!examSession) {
      return;
    }

    runAction("approveParticipant", async () => {
      await approveTeacherExamParticipant(examSession.id, studentProfileId, teacherId);
      return examSession.id;
    });
  }

  function handleApproveDevice() {
    if (!examSession) {
      return;
    }

    setDeviceErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          setPendingAction("approveDevice");
          const nextDevicesState = await approveTeacherExamParticipantDevice(
            examSession.id,
            studentProfileId,
            teacherId
          );
          setDevicesState(nextDevicesState);
        } catch (error) {
          setDeviceErrorMessage(
            error instanceof Error ? error.message : "The device could not be approved."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  return (
    <section className="card">
      <p className="eyebrow">Teacher</p>
      <h2>Exam Session Control</h2>
      <p>This page gives you a minimal way to create, start, end, and approve one seeded participant for this assessment.</p>
      <p>Assessment ID: {assessmentId}</p>
      <p>Teacher ID: {teacherId}</p>

      {isRestoring ? <p>Restoring current exam session...</p> : null}

      {canCreate ? (
        <button type="button" disabled={isPending} onClick={handleCreate}>
          {pendingAction === "create" || pendingAction === "refresh"
            ? "Creating session..."
            : "Create exam session"}
        </button>
      ) : null}

      {examSession ? (
        <>
          <p>Exam session ID: {examSession.id}</p>
          <p>Status: {formatStatus(examSession.status)}</p>
          <p>Starts at: {formatDate(examSession.startsAt)}</p>
          <p>Ended at: {formatDate(examSession.endedAt)}</p>

          {canStart ? (
            <button type="button" disabled={isPending} onClick={handleStart}>
              {pendingAction === "start" || pendingAction === "refresh" ? "Starting..." : "Start session"}
            </button>
          ) : null}

          {canEnd ? (
            <button type="button" disabled={isPending} onClick={handleEnd}>
              {pendingAction === "end" || pendingAction === "refresh" ? "Ending..." : "End session"}
            </button>
          ) : null}
        </>
      ) : null}

      {!isRestoring && !examSession ? <p>No open exam session was found for this assessment.</p> : null}

      <section className="card">
        <p className="eyebrow">Participant</p>
        <h3>Seeded student approval</h3>
        <p>Student profile ID: {studentProfileId}</p>

        {!examSession ? <p>Participant approval is unavailable until an exam session exists.</p> : null}

        {examSession && !participant ? (
          <p>This student has not joined the current exam session yet.</p>
        ) : null}

        {participant ? (
          <>
            <p>Participant status: {formatParticipantStatus(participant.status)}</p>
            <p>Joined at: {formatDate(participant.joinedAt)}</p>
            <p>Approved at: {formatDate(participant.approvedAt)}</p>

            {canApproveParticipant ? (
              <button type="button" disabled={isPending} onClick={handleApproveParticipant}>
                {pendingAction === "approveParticipant" || pendingAction === "refresh"
                  ? "Approving participant..."
                  : "Approve participant"}
              </button>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="card">
        <p className="eyebrow">Device</p>
        <h3>Seeded student device</h3>
        <p>Student profile ID: {studentProfileId}</p>

        {!examSession ? <p>Device approval is unavailable until an exam session exists.</p> : null}

        {examSession && isDeviceLoading ? <p>Loading device state...</p> : null}

        {examSession && !isDeviceLoading && !deviceParticipant ? (
          <p>This student does not have device data for the current exam session yet.</p>
        ) : null}

        {deviceParticipant ? (
          <>
            <p>Has device: {device ? "Yes" : "No"}</p>
            <p>Participant status: {formatParticipantStatus(deviceParticipant.status)}</p>
            <p>Participant joined at: {formatDate(deviceParticipant.joinedAt)}</p>
            <p>Participant approved at: {formatDate(deviceParticipant.approvedAt)}</p>
            <p>Device status: {device ? formatDeviceStatus(device.status) : "Not available"}</p>
            <p>Device code: {device?.deviceCode ?? "Not available"}</p>
            <p>Device joined at: {formatDate(device?.joinedAt ?? null)}</p>
            <p>Device approved at: {formatDate(device?.approvedAt ?? null)}</p>

            {canApproveDevice ? (
              <button type="button" disabled={isPending} onClick={handleApproveDevice}>
                {pendingAction === "approveDevice" ? "Approving device..." : "Approve device"}
              </button>
            ) : null}
          </>
        ) : null}

        {deviceErrorMessage ? <p>Error: {deviceErrorMessage}</p> : null}
      </section>

      {errorMessage ? <p>Error: {errorMessage}</p> : null}
    </section>
  );
}