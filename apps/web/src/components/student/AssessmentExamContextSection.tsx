"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createOrGetStudentDevice,
  createOrReuseSubmission,
  getAssessmentExamContext,
  getStudentDevice,
  joinExamSession
} from "../../lib/api/student";
import type {
  StudentExamContext,
  StudentExamDeviceState,
  StudentSubmissionSummary
} from "../../types/student";
import { DevicePanel } from "./DevicePanel";
import { ExamContextPanel } from "./ExamContextPanel";
import { JoinExamButton } from "./JoinExamButton";
import { SubmissionPanel } from "./SubmissionPanel";

type AssessmentExamContextSectionProps = {
  assessmentId: string;
  studentId: string;
  initialContext: StudentExamContext;
  latestSubmission?: StudentSubmissionSummary | null;
};

export function AssessmentExamContextSection({
  assessmentId,
  studentId,
  initialContext,
  latestSubmission = null
}: AssessmentExamContextSectionProps) {
  const router = useRouter();
  const [examContext, setExamContext] = useState(initialContext);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<StudentExamDeviceState | null>(null);
  const [deviceErrorMessage, setDeviceErrorMessage] = useState<string | null>(null);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(Boolean(initialContext.examSessionId));
  const [isJoinPending, startJoinTransition] = useTransition();
  const [isDevicePending, startDeviceTransition] = useTransition();
  const [isSubmissionPending, startSubmissionTransition] = useTransition();

  const shouldShowJoinButton =
    examContext.hasExamSession &&
    examContext.examSessionStatus === "WAITING" &&
    examContext.participantStatus === null &&
    examContext.examSessionId !== null;

  useEffect(() => {
    async function loadDeviceState(examSessionId: string) {
      try {
        setDeviceErrorMessage(null);
        setIsDeviceLoading(true);
        const nextDeviceState = await getStudentDevice(examSessionId, studentId);
        setDeviceState(nextDeviceState);
      } catch (error) {
        setDeviceState(null);
        setDeviceErrorMessage(
          error instanceof Error ? error.message : "Данните за устройството не могат да бъдат заредени."
        );
      } finally {
        setIsDeviceLoading(false);
      }
    }

    if (!examContext.examSessionId) {
      setDeviceState(null);
      setDeviceErrorMessage(null);
      setIsDeviceLoading(false);
      return;
    }

    void loadDeviceState(examContext.examSessionId);
  }, [examContext.examSessionId, examContext.participantStatus, studentId]);

  function handleJoin() {
    const examSessionId = examContext.examSessionId;

    if (!examSessionId) {
      return;
    }

    setJoinErrorMessage(null);

    startJoinTransition(() => {
      void (async () => {
        try {
          await joinExamSession(examSessionId, studentId);
          const refreshedContext = await getAssessmentExamContext(assessmentId, studentId);
          setExamContext(refreshedContext);
        } catch (error) {
          setJoinErrorMessage(
            error instanceof Error ? error.message : "Неуспешно присъединяване към изпитната сесия."
          );
        }
      })();
    });
  }

  function handleRegisterDevice() {
    const examSessionId = examContext.examSessionId;

    if (!examSessionId) {
      return;
    }

    setDeviceErrorMessage(null);

    startDeviceTransition(() => {
      void (async () => {
        try {
          const nextDeviceState = await createOrGetStudentDevice(examSessionId, studentId);
          setDeviceState(nextDeviceState);
          const refreshedContext = await getAssessmentExamContext(assessmentId, studentId);
          setExamContext(refreshedContext);
        } catch (error) {
          setDeviceErrorMessage(
            error instanceof Error ? error.message : "Неуспешно регистриране на устройство."
          );
        }
      })();
    });
  }

  function handleOpenSubmission() {
    setSubmissionErrorMessage(null);

    startSubmissionTransition(() => {
      void (async () => {
        try {
          const submission = await createOrReuseSubmission(assessmentId, studentId);
          router.push(`/student/submissions/${submission.id}`);
        } catch (error) {
          setSubmissionErrorMessage(
            error instanceof Error ? error.message : "Предаването не може да бъде отворено."
          );
        }
      })();
    });
  }

  function handleOpenLatestSubmission() {
    if (!latestSubmission) {
      return;
    }

    router.push(`/student/submissions/${latestSubmission.id}`);
  }

  return (
    <>
      <ExamContextPanel context={examContext} />
      {shouldShowJoinButton ? (
        <JoinExamButton onClick={handleJoin} pending={isJoinPending} errorMessage={joinErrorMessage} />
      ) : null}
      <DevicePanel
        examSessionId={examContext.examSessionId}
        deviceState={deviceState}
        loading={isDeviceLoading}
        pending={isDevicePending}
        errorMessage={deviceErrorMessage}
        onRegister={handleRegisterDevice}
      />
      <SubmissionPanel
        assessmentId={assessmentId}
        examContext={examContext}
        latestSubmission={latestSubmission}
        pending={isSubmissionPending}
        errorMessage={submissionErrorMessage}
        onOpenSubmission={handleOpenSubmission}
        onOpenLatestSubmission={handleOpenLatestSubmission}
      />
    </>
  );
}