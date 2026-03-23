"use client";

import { useState, useTransition } from "react";
import {
  createTeacherExamSession,
  endTeacherExamSession,
  getTeacherExamSession,
  startTeacherExamSession
} from "../../lib/api/teacher";
import type { TeacherExamSessionDetail, TeacherExamSessionStatus } from "../../types/teacher";

type TeacherExamSessionControlProps = {
  assessmentId: string;
  teacherId: string;
};

type PendingAction = "create" | "refresh" | "start" | "end" | null;

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

export function TeacherExamSessionControl({
  assessmentId,
  teacherId
}: TeacherExamSessionControlProps) {
  const [examSession, setExamSession] = useState<TeacherExamSessionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const canCreate = examSession === null;
  const canStart = examSession?.status === "WAITING";
  const canEnd = examSession?.status === "WAITING" || examSession?.status === "ACTIVE";

  async function refreshSession(examSessionId: string) {
    setPendingAction("refresh");
    const nextSession = await getTeacherExamSession(examSessionId, teacherId);
    setExamSession(nextSession);
  }

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

  return (
    <section className="card">
      <p className="eyebrow">Teacher</p>
      <h2>Exam Session Control</h2>
      <p>This page gives you a minimal way to create, start, and end one exam session for this assessment.</p>
      <p>Assessment ID: {assessmentId}</p>
      <p>Teacher ID: {teacherId}</p>

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
      ) : (
        <p>No exam session has been created from this page yet.</p>
      )}

      {errorMessage ? <p>Error: {errorMessage}</p> : null}
    </section>
  );
}