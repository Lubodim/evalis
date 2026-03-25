"use client";

import { useEffect, useState } from "react";
import {
  finalizeTeacherSubmission,
  getTeacherAssessmentSubmissions,
  getTeacherSubmission,
  gradeTeacherSubmission
} from "../../lib/api/teacher";
import type {
  TeacherAssessmentSubmissionListItem,
  TeacherGradeSubmissionAnswerInput,
  TeacherSubmissionAnswerDetail,
  TeacherSubmissionDetail,
  TeacherSubmissionQuestion,
  TeacherSubmissionStatus
} from "../../types/teacher";

type TeacherAssessmentSubmissionsSectionProps = {
  assessmentId: string;
  teacherId: string;
};

type GradeDraft = Record<
  string,
  {
    pointsAwarded: string;
    teacherFeedback: string;
  }
>;

type GradeFieldErrors = Record<string, string | null>;

type PendingAction = "grade" | "finalize" | null;

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("bg-BG");
}

function formatSubmissionStatus(value: TeacherSubmissionStatus) {
  switch (value) {
    case "DRAFT":
      return "DRAFT";
    case "SUBMITTED":
      return "SUBMITTED";
    case "GRADED":
      return "GRADED";
    default:
      return value;
  }
}

function formatStudentLabel(submission: TeacherAssessmentSubmissionListItem | TeacherSubmissionDetail) {
  const parts = [submission.studentProfile.user.firstName, submission.studentProfile.user.lastName].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (submission.studentProfile.studentNumber) {
    return `Student ${submission.studentProfile.studentNumber}`;
  }

  return submission.studentProfile.user.email ?? submission.studentProfile.id;
}

function formatResultSummary(result: TeacherAssessmentSubmissionListItem["result"]) {
  if (!result) {
    return "Not finalized";
  }

  if (result.percentage === null) {
    return `${result.totalScore}/${result.maxScore}`;
  }

  return `${result.totalScore}/${result.maxScore} (${result.percentage}%)`;
}

function findAnswer(
  answers: TeacherSubmissionAnswerDetail[],
  question: TeacherSubmissionQuestion
): TeacherSubmissionAnswerDetail | undefined {
  return answers.find((answer) => answer.questionId === question.id);
}

function buildGradeDraft(submission: TeacherSubmissionDetail): GradeDraft {
  return submission.assessment.questions.reduce<GradeDraft>((draft, question) => {
    const answer = findAnswer(submission.answers, question);

    draft[question.id] = {
      pointsAwarded:
        answer?.pointsAwarded !== null && answer?.pointsAwarded !== undefined
          ? String(answer.pointsAwarded)
          : "",
      teacherFeedback: answer?.teacherFeedback ?? ""
    };

    return draft;
  }, {});
}

function formatAnswerValue(answer: TeacherSubmissionAnswerDetail | undefined) {
  if (!answer) {
    return "No submitted answer.";
  }

  if (answer.answerText) {
    return answer.answerText;
  }

  if (answer.selectedOption) {
    return answer.selectedOption;
  }

  return "No submitted answer.";
}

function validatePoints(question: TeacherSubmissionQuestion, rawValue: string) {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  const pointsAwarded = Number(trimmedValue);

  if (!Number.isFinite(pointsAwarded)) {
    return "Enter a valid number.";
  }

  if (!Number.isInteger(pointsAwarded)) {
    return "Points must be a whole number.";
  }

  if (pointsAwarded < 0) {
    return "Points cannot be negative.";
  }

  if (pointsAwarded > question.maxPoints) {
    return `Points cannot exceed ${question.maxPoints}.`;
  }

  return null;
}

export function TeacherAssessmentSubmissionsSection({
  assessmentId,
  teacherId
}: TeacherAssessmentSubmissionsSectionProps) {
  const [submissions, setSubmissions] = useState<TeacherAssessmentSubmissionListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherSubmissionDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [gradeDraft, setGradeDraft] = useState<GradeDraft>({});
  const [gradeFieldErrors, setGradeFieldErrors] = useState<GradeFieldErrors>({});

  async function loadSubmissions(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsListLoading(true);
    }

    try {
      setListError(null);
      const nextSubmissions = await getTeacherAssessmentSubmissions(assessmentId, teacherId);
      setSubmissions(nextSubmissions);
    } catch (error) {
      setSubmissions([]);
      setListError(error instanceof Error ? error.message : "The submissions list could not be loaded.");
    } finally {
      if (!options?.silent) {
        setIsListLoading(false);
      }
    }
  }

  async function loadSubmissionDetail(submissionId: string) {
    setSelectedSubmissionId(submissionId);
    setIsDetailLoading(true);

    try {
      setDetailError(null);
      setActionError(null);
      const nextSubmission = await getTeacherSubmission(submissionId, teacherId);
      setSelectedSubmission(nextSubmission);
      setGradeDraft(buildGradeDraft(nextSubmission));
      setGradeFieldErrors({});
    } catch (error) {
      setSelectedSubmission(null);
      setGradeDraft({});
      setGradeFieldErrors({});
      setDetailError(error instanceof Error ? error.message : "The submission detail could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  useEffect(() => {
    setSelectedSubmissionId(null);
    setSelectedSubmission(null);
    setDetailError(null);
    setActionError(null);
    setGradeDraft({});
    setGradeFieldErrors({});
    void loadSubmissions();
  }, [assessmentId, teacherId]);

  function updateGradeDraft(questionId: string, field: "pointsAwarded" | "teacherFeedback", value: string) {
    setActionError(null);

    setGradeDraft((currentDraft) => ({
      ...currentDraft,
      [questionId]: {
        pointsAwarded: currentDraft[questionId]?.pointsAwarded ?? "",
        teacherFeedback: currentDraft[questionId]?.teacherFeedback ?? "",
        [field]: value
      }
    }));

    if (field === "pointsAwarded") {
      const question = selectedSubmission?.assessment.questions.find((currentQuestion) => currentQuestion.id === questionId);
      const nextError = question ? validatePoints(question, value) : null;

      setGradeFieldErrors((currentErrors) => ({
        ...currentErrors,
        [questionId]: nextError
      }));
    }
  }

  async function refreshAfterMutation(submissionId: string) {
    await Promise.all([loadSubmissions({ silent: true }), loadSubmissionDetail(submissionId)]);
  }

  async function handleGrade() {
    if (!selectedSubmission || pendingAction) {
      return;
    }

    const answers: TeacherGradeSubmissionAnswerInput[] = [];
    const nextFieldErrors: GradeFieldErrors = {};

    for (const question of selectedSubmission.assessment.questions) {
      const nextDraft = gradeDraft[question.id];
      const rawPoints = nextDraft?.pointsAwarded ?? "";
      const pointsError = validatePoints(question, rawPoints);

      if (pointsError) {
        nextFieldErrors[question.id] = pointsError;
        continue;
      }

      const trimmedPoints = rawPoints.trim();

      if (!trimmedPoints) {
        continue;
      }

      answers.push({
        questionId: question.id,
        pointsAwarded: Number(trimmedPoints),
        teacherFeedback: nextDraft?.teacherFeedback?.trim() ? nextDraft.teacherFeedback.trim() : null
      });
    }

    setGradeFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setActionError("Fix the highlighted grading values before saving.");
      return;
    }

    if (answers.length === 0) {
      setActionError("Enter at least one score before saving grading.");
      return;
    }

    try {
      setPendingAction("grade");
      setActionError(null);
      await gradeTeacherSubmission(selectedSubmission.id, teacherId, { answers });
      await refreshAfterMutation(selectedSubmission.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The grading could not be saved.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleFinalize() {
    if (!selectedSubmission || pendingAction) {
      return;
    }

    if (Object.values(gradeFieldErrors).some(Boolean)) {
      setActionError("Fix the highlighted grading values before finalizing.");
      return;
    }

    try {
      setPendingAction("finalize");
      setActionError(null);
      await finalizeTeacherSubmission(selectedSubmission.id, teacherId);
      await refreshAfterMutation(selectedSubmission.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The submission could not be finalized.");
    } finally {
      setPendingAction(null);
    }
  }

  const canGrade = selectedSubmission?.status === "SUBMITTED";
  const canFinalize = selectedSubmission?.status === "SUBMITTED";

  return (
    <section className="card" style={{ maxWidth: "none" }}>
      <p className="eyebrow">Teacher</p>
      <h2>Submissions</h2>
      <p>Review the submitted work for this assessment, add points and feedback, and finalize grading when you are ready.</p>

      <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
        {isListLoading ? <p>Loading submissions...</p> : null}
        {listError ? <p>Error: {listError}</p> : null}

        {!isListLoading && !listError && submissions.length === 0 ? (
          <p>No submitted work is available for this assessment yet.</p>
        ) : null}

        {!isListLoading && !listError
          ? submissions.map((submission) => {
              const isSelected = selectedSubmissionId === submission.id;

              return (
                <article
                  key={submission.id}
                  style={{
                    display: "grid",
                    gap: "10px",
                    border: "1px solid #d9e2f0",
                    borderRadius: "14px",
                    padding: "18px",
                    background: isSelected ? "#eef4ff" : "#f9fbff"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <strong>{formatStudentLabel(submission)}</strong>
                    <span className="status-pill">{formatSubmissionStatus(submission.status)}</span>
                  </div>
                  <p>Submission ID: {submission.id}</p>
                  <p>Submitted at: {formatDate(submission.submittedAt)}</p>
                  <p>Saved answers: {submission._count.answers}</p>
                  <p>Result: {formatResultSummary(submission.result)}</p>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        void loadSubmissionDetail(submission.id);
                      }}
                      disabled={isDetailLoading && isSelected}
                    >
                      {isDetailLoading && isSelected ? "Opening..." : "Open submission"}
                    </button>
                  </div>
                </article>
              );
            })
          : null}
      </div>

      {selectedSubmissionId ? (
        <section className="card" style={{ maxWidth: "none", marginTop: "20px", padding: "24px" }}>
          <p className="eyebrow">Teacher</p>
          <h3>Submission detail</h3>

          {isDetailLoading ? <p style={{ marginTop: "16px" }}>Loading submission detail...</p> : null}
          {detailError ? <p style={{ marginTop: "16px" }}>Error: {detailError}</p> : null}

          {selectedSubmission ? (
            <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
              <div style={{ display: "grid", gap: "8px" }}>
                <p>Submission ID: {selectedSubmission.id}</p>
                <p>Student: {formatStudentLabel(selectedSubmission)}</p>
                <p>Status: {formatSubmissionStatus(selectedSubmission.status)}</p>
                <p>Assessment: {selectedSubmission.assessment.title ?? selectedSubmission.assessment.id}</p>
                <p>Submitted at: {formatDate(selectedSubmission.submittedAt)}</p>
                <p>
                  Result: {selectedSubmission.result ? formatResultSummary(selectedSubmission.result) : "Not finalized"}
                </p>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {selectedSubmission.assessment.questions.map((question) => {
                  const answer = findAnswer(selectedSubmission.answers, question);
                  const nextDraft = gradeDraft[question.id] ?? { pointsAwarded: "", teacherFeedback: "" };
                  const fieldError = gradeFieldErrors[question.id];

                  return (
                    <article
                      key={question.id}
                      style={{
                        display: "grid",
                        gap: "12px",
                        border: fieldError ? "1px solid #f4c5c5" : "1px solid #d9e2f0",
                        borderRadius: "14px",
                        padding: "18px",
                        background: fieldError ? "#fff7f7" : "#f9fbff"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <strong>
                          Question {question.orderIndex + 1}: {question.prompt}
                        </strong>
                        <span>{question.maxPoints} pts</span>
                      </div>
                      <p>Type: {question.type}</p>
                      <p>Answer: {formatAnswerValue(answer)}</p>

                      {canGrade ? (
                        <>
                          <label style={{ display: "grid", gap: "8px" }}>
                            <span>Points awarded</span>
                            <input
                              type="number"
                              min="0"
                              max={String(question.maxPoints)}
                              step="1"
                              value={nextDraft.pointsAwarded}
                              disabled={pendingAction !== null}
                              onChange={(event) => updateGradeDraft(question.id, "pointsAwarded", event.target.value)}
                            />
                          </label>

                          {fieldError ? <p style={{ color: "#9d1f1f" }}>{fieldError}</p> : null}

                          <label style={{ display: "grid", gap: "8px" }}>
                            <span>Teacher feedback</span>
                            <textarea
                              value={nextDraft.teacherFeedback}
                              disabled={pendingAction !== null}
                              onChange={(event) => updateGradeDraft(question.id, "teacherFeedback", event.target.value)}
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <p>
                            Awarded points: {answer?.pointsAwarded ?? "Not graded"}
                            {answer?.pointsAwarded !== null && answer?.pointsAwarded !== undefined
                              ? ` / ${question.maxPoints}`
                              : ""}
                          </p>
                          <p>Teacher feedback: {answer?.teacherFeedback?.trim() ? answer.teacherFeedback : "No feedback saved."}</p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>

              {selectedSubmission.status === "GRADED" ? (
                <p>This submission is already finalized and is now read-only.</p>
              ) : null}

              {actionError ? <p>Error: {actionError}</p> : null}

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button type="button" disabled={!canGrade || pendingAction !== null} onClick={() => void handleGrade()}>
                  {pendingAction === "grade" ? "Saving grading..." : "Save grading"}
                </button>
                <button
                  type="button"
                  disabled={!canFinalize || pendingAction !== null}
                  onClick={() => void handleFinalize()}
                >
                  {pendingAction === "finalize" ? "Finalizing..." : "Finalize review"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}