"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createOrGetStudentDevice,
  createOrReuseSubmission,
  getAssessmentExamContext,
  getStudentAssessments,
  getStudentDevice,
  getStudentSubmissionReview,
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
import {
  getStudentAssessmentCtaDecision,
  SubmissionPanel
} from "./SubmissionPanel";

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
  const [latestSubmissionState, setLatestSubmissionState] = useState<StudentSubmissionSummary | null>(
    latestSubmission
  );
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<StudentExamDeviceState | null>(null);
  const [deviceErrorMessage, setDeviceErrorMessage] = useState<string | null>(null);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(Boolean(initialContext.examSessionId));
  const [isJoinPending, startJoinTransition] = useTransition();
  const [isDevicePending, startDeviceTransition] = useTransition();
  const [isSubmissionPending, startSubmissionTransition] = useTransition();

  useEffect(() => {
    setLatestSubmissionState(latestSubmission);
  }, [latestSubmission]);

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

  const ctaDecision = getStudentAssessmentCtaDecision({
    examContext,
    latestSubmission: latestSubmissionState,
    activeSessionStartsAt: deviceState?.startsAt ?? null
  });

  async function refreshLatestSubmissionState() {
    const assessments = await getStudentAssessments(studentId);
    const currentAssessment = assessments.find((assessment) => assessment.id === assessmentId) ?? null;
    const nextLatestSubmission = currentAssessment?.submissions?.[0] ?? null;
    setLatestSubmissionState(nextLatestSubmission);
    return nextLatestSubmission;
  }

  async function openHistoricalSubmission(submission: StudentSubmissionSummary) {
    if (submission.status === "DRAFT") {
      router.push(`/student/submissions/${submission.id}`);
      return;
    }

    const review = await getStudentSubmissionReview(submission.id, studentId);
    const hasVisibleReview = review.result !== null || review.answers.length > 0;

    if (hasVisibleReview) {
      router.push(`/student/submissions/${submission.id}/review`);
      return;
    }

    setSubmissionErrorMessage("Прегледът за последното предаване все още не е достъпен.");
  }

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
          const freshLatestSubmission = await refreshLatestSubmissionState();
          const freshDecision = getStudentAssessmentCtaDecision({
            examContext,
            latestSubmission: freshLatestSubmission,
            activeSessionStartsAt: deviceState?.startsAt ?? null
          });

          if (
            (freshDecision.mode === "historical" || freshDecision.mode === "locked_current_attempt") &&
            freshLatestSubmission
          ) {
            await openHistoricalSubmission(freshLatestSubmission);
            return;
          }

          if (freshDecision.mode !== "work_active") {
            setSubmissionErrorMessage("Предаването не може да бъде отворено в текущото състояние.");
            return;
          }

          const submission = await createOrReuseSubmission(assessmentId, studentId);

          if (submission.status !== "DRAFT") {
            await openHistoricalSubmission({
              id: submission.id,
              status: submission.status,
              submittedAt: submission.submittedAt,
              createdAt: submission.createdAt,
              updatedAt: submission.updatedAt
            });
            return;
          }

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
    const submission = latestSubmissionState;

    if (!submission) {
      return;
    }

    setSubmissionErrorMessage(null);

    startSubmissionTransition(() => {
      void (async () => {
        try {
          await openHistoricalSubmission(submission);
        } catch (error) {
          setSubmissionErrorMessage(
            error instanceof Error ? error.message : "Прегледът на последното предаване не може да бъде отворен."
          );
        }
      })();
    });
  }

  return (
    <>
      <ExamContextPanel context={examContext} />
      {ctaDecision.mode === "join_waiting" ? (
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
        mode={ctaDecision.mode}
        examContext={examContext}
        latestSubmission={latestSubmissionState}
        pending={isSubmissionPending}
        errorMessage={submissionErrorMessage}
        onOpenSubmission={handleOpenSubmission}
        onOpenLatestSubmission={handleOpenLatestSubmission}
      />
    </>
  );
}