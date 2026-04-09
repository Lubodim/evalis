"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTeacherClassOperations,
  getTeacherStudentOperations
} from "../../lib/api/teacher";
import type {
  TeacherClassOperationsDetail,
  TeacherClassOperationsStudentSummary,
  TeacherClassSubmissionSummary,
  TeacherOperationsAssessmentSummary,
  TeacherStudentOperationsDetail,
  TeacherSubmissionStatus
} from "../../types/teacher";

type TeacherClassOperationsSectionProps = {
  classId: string;
  teacherId: string;
};

type AssessmentMatrixCounts = {
  assessmentId: string;
  notStarted: number;
  draft: number;
  submitted: number;
  graded: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("bg-BG");
}

function formatSubmissionStatus(value: TeacherSubmissionStatus) {
  switch (value) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "GRADED":
      return "Graded";
    default:
      return value;
  }
}

function formatStudentLabel(student: TeacherClassOperationsStudentSummary) {
  const parts = [student.user.firstName, student.user.lastName].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (student.studentNumber) {
    return `Student ${student.studentNumber}`;
  }

  return student.user.email || student.studentProfileId;
}

function formatAssessmentType(value: TeacherOperationsAssessmentSummary["type"]) {
  switch (value) {
    case "QUIZ":
      return "QUIZ";
    case "ASSIGNMENT":
      return "ASSIGNMENT";
    case "TEST":
      return "TEST";
    default:
      return value;
  }
}

function formatResultSummary(
  result:
    | TeacherClassOperationsDetail["submissionSummaries"][number]["latestResult"]
    | TeacherStudentOperationsDetail["submissionSummaries"][number]["latestResult"]
) {
  if (!result) {
    return "Not finalized";
  }

  if (result.percentage === null) {
    return `${result.totalScore}/${result.maxScore}`;
  }

  return `${result.totalScore}/${result.maxScore} (${result.percentage}%)`;
}

function buildMatrixKey(studentProfileId: string, assessmentId: string) {
  return `${studentProfileId}:${assessmentId}`;
}

function formatMatrixCellStatus(summary: TeacherClassSubmissionSummary | null) {
  if (!summary) {
    return "Not started";
  }

  return formatSubmissionStatus(summary.latestSubmissionStatus);
}

function getMatrixCellColors(summary: TeacherClassSubmissionSummary | null) {
  if (!summary) {
    return {
      background: "#f6f7fb",
      border: "#d9e2f0",
      color: "#52607a"
    };
  }

  switch (summary.latestSubmissionStatus) {
    case "DRAFT":
      return {
        background: "#fff9e8",
        border: "#f0ddb2",
        color: "#8a5d00"
      };
    case "SUBMITTED":
      return {
        background: "#eaf3ff",
        border: "#bfd5f8",
        color: "#2444ac"
      };
    case "GRADED":
      return {
        background: "#eaf8ef",
        border: "#b8dec4",
        color: "#21663a"
      };
    default:
      return {
        background: "#f6f7fb",
        border: "#d9e2f0",
        color: "#52607a"
      };
  }
}

export function TeacherClassOperationsSection({
  classId,
  teacherId
}: TeacherClassOperationsSectionProps) {
  const [classOperations, setClassOperations] = useState<TeacherClassOperationsDetail | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentOperationsCache, setStudentOperationsCache] = useState<
    Record<string, TeacherStudentOperationsDetail>
  >({});
  const [isClassLoading, setIsClassLoading] = useState(true);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const studentCardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setSelectedStudentId(null);
    setStudentOperationsCache({});
    setStudentError(null);
    setPendingStudentId(null);

    void (async () => {
      try {
        setClassError(null);
        setIsClassLoading(true);
        const nextOperations = await getTeacherClassOperations(classId, teacherId);
        setClassOperations(nextOperations);
      } catch (error) {
        setClassOperations(null);
        setClassError(error instanceof Error ? error.message : "The class operations could not be loaded.");
      } finally {
        setIsClassLoading(false);
      }
    })();
  }, [classId, teacherId]);

  function scrollToStudentCard(studentProfileId: string) {
    studentCardRefs.current[studentProfileId]?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function openStudentOperations(studentProfileId: string) {
    const cachedStudentOperations = studentOperationsCache[studentProfileId] ?? null;

    setSelectedStudentId(studentProfileId);
    setStudentError(null);
    scrollToStudentCard(studentProfileId);

    if (cachedStudentOperations) {
      setIsStudentLoading(false);
      setPendingStudentId(null);
      return;
    }

    setPendingStudentId(studentProfileId);
    setIsStudentLoading(true);

    try {
      const nextStudentOperations = await getTeacherStudentOperations(
        classId,
        studentProfileId,
        teacherId
      );
      setStudentOperationsCache((currentCache) => ({
        ...currentCache,
        [studentProfileId]: nextStudentOperations
      }));
      scrollToStudentCard(studentProfileId);
    } catch (error) {
      setStudentError(
        error instanceof Error ? error.message : "The student operations could not be loaded."
      );
    } finally {
      setIsStudentLoading(false);
      setPendingStudentId(null);
    }
  }

  async function handleStudentListAction(studentProfileId: string) {
    if (selectedStudentId === studentProfileId && !isStudentLoading) {
      setSelectedStudentId(null);
      setStudentError(null);
      setPendingStudentId(null);
      return;
    }

    await openStudentOperations(studentProfileId);
  }

  const selectedStudentOperations =
    selectedStudentId !== null ? studentOperationsCache[selectedStudentId] ?? null : null;

  const matrixLookup = useMemo(() => {
    const lookup = new Map<string, TeacherClassSubmissionSummary>();

    for (const summary of classOperations?.submissionSummaries ?? []) {
      lookup.set(buildMatrixKey(summary.studentProfileId, summary.assessmentId), summary);
    }

    return lookup;
  }, [classOperations]);

  const assessmentMatrixCounts = useMemo<AssessmentMatrixCounts[]>(() => {
    if (!classOperations) {
      return [];
    }

    return classOperations.assessments.map((assessment) => {
      let notStarted = 0;
      let draft = 0;
      let submitted = 0;
      let graded = 0;

      for (const student of classOperations.students) {
        const summary = matrixLookup.get(
          buildMatrixKey(student.studentProfileId, assessment.assessmentId)
        );

        if (!summary) {
          notStarted += 1;
          continue;
        }

        switch (summary.latestSubmissionStatus) {
          case "DRAFT":
            draft += 1;
            break;
          case "SUBMITTED":
            submitted += 1;
            break;
          case "GRADED":
            graded += 1;
            break;
          default:
            notStarted += 1;
            break;
        }
      }

      return {
        assessmentId: assessment.assessmentId,
        notStarted,
        draft,
        submitted,
        graded
      };
    });
  }, [classOperations, matrixLookup]);

  return (
    <section className="card" style={{ maxWidth: "none" }}>
      <p className="eyebrow">Teacher</p>
      <h2>Class Operations</h2>
      <p>Review the class roster, your assessments for this class, and open one student at a time for operational detail.</p>

      {isClassLoading ? <p style={{ marginTop: "16px" }}>Loading class operations...</p> : null}
      {classError ? <p style={{ marginTop: "16px" }}>Error: {classError}</p> : null}

      {classOperations ? (
        <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
          <section
            style={{
              display: "grid",
              gap: "8px",
              border: "1px solid #d9e2f0",
              borderRadius: "14px",
              padding: "18px",
              background: "#f9fbff"
            }}
          >
            <h3>{classOperations.class.name}</h3>
            <p>Display label: {classOperations.class.displayLabel ?? "Not available"}</p>
            <p>Subject: {classOperations.class.subject}</p>
            <p>School year: {classOperations.class.schoolYear}</p>
            <p>Status: {classOperations.class.isActive ? "Active" : "Inactive"}</p>
            <p>Students: {classOperations.students.length}</p>
            <p>Assessments: {classOperations.assessments.length}</p>
          </section>

          <section style={{ display: "grid", gap: "12px" }}>
            <h3>Assessment Matrix</h3>
            <p>Each cell is derived from the current class operations payload. Missing activity is shown as Not started.</p>

            {classOperations.students.length === 0 || classOperations.assessments.length === 0 ? (
              <p>The matrix becomes available when both students and teacher-owned assessments exist for this class.</p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #d9e2f0",
                  borderRadius: "14px",
                  background: "#ffffff"
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                  <thead>
                    <tr style={{ background: "#f5f8ff" }}>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #d9e2f0" }}>
                        Student
                      </th>
                      {classOperations.assessments.map((assessment) => {
                        const counts =
                          assessmentMatrixCounts.find(
                            (item) => item.assessmentId === assessment.assessmentId
                          ) ?? null;

                        return (
                          <th
                            key={assessment.assessmentId}
                            style={{
                              textAlign: "left",
                              verticalAlign: "top",
                              padding: "12px",
                              borderBottom: "1px solid #d9e2f0",
                              minWidth: "180px"
                            }}
                          >
                            <div style={{ display: "grid", gap: "6px" }}>
                              <strong>{assessment.title}</strong>
                              <span>{formatAssessmentType(assessment.type)}</span>
                              <span>Due: {formatDate(assessment.dueAt)}</span>
                              {counts ? (
                                <span>
                                  N: {counts.notStarted} | D: {counts.draft} | S: {counts.submitted} | G: {counts.graded}
                                </span>
                              ) : null}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {classOperations.students.map((student) => {
                      const isSelected = selectedStudentId === student.studentProfileId;
                      const isPending = pendingStudentId === student.studentProfileId;

                      return (
                        <tr
                          key={student.studentProfileId}
                          style={{
                            background: isSelected ? "#eef4ff" : "#ffffff",
                            boxShadow: isSelected ? "inset 4px 0 0 #2444ac" : "none"
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e6edf8",
                              verticalAlign: "top"
                            }}
                          >
                            <div style={{ display: "grid", gap: "6px" }}>
                              <strong>{formatStudentLabel(student)}</strong>
                              <span>{student.displayIdentifier ?? "Not available"}</span>
                              {isSelected ? (
                                <span
                                  style={{
                                    width: "fit-content",
                                    padding: "4px 8px",
                                    borderRadius: "999px",
                                    background: "#dce8ff",
                                    color: "#2444ac",
                                    fontSize: "0.85rem",
                                    fontWeight: 600
                                  }}
                                >
                                  {isPending ? "Opening selected student..." : "Student is open"}
                                </span>
                              ) : null}
                              <span
                                style={{
                                  width: "fit-content",
                                  padding: "4px 8px",
                                  borderRadius: "999px",
                                  background: isSelected ? "#dce8ff" : "#eef2f8",
                                  color: isSelected ? "#2444ac" : "#52607a",
                                  fontSize: "0.85rem",
                                  fontWeight: 600
                                }}
                              >
                                {isPending
                                  ? "Opening from Students list..."
                                  : isSelected
                                    ? "Active"
                                    : "Open from Students list"}
                              </span>
                            </div>
                          </td>
                          {classOperations.assessments.map((assessment) => {
                            const summary =
                              matrixLookup.get(
                                buildMatrixKey(student.studentProfileId, assessment.assessmentId)
                              ) ?? null;
                            const colors = getMatrixCellColors(summary);

                            return (
                              <td
                                key={`${student.studentProfileId}:${assessment.assessmentId}`}
                                style={{
                                  padding: "12px",
                                  borderBottom: "1px solid #e6edf8",
                                  verticalAlign: "top"
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gap: "6px",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "12px",
                                    padding: "10px",
                                    background: colors.background,
                                    color: colors.color,
                                    minHeight: "92px"
                                  }}
                                >
                                  <strong>{formatMatrixCellStatus(summary)}</strong>
                                  {summary ? (
                                    <>
                                      <span>Attempts: {summary.submissionCount}</span>
                                      <span>Updated: {formatDate(summary.latestUpdatedAt)}</span>
                                    </>
                                  ) : (
                                    <span>No activity</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={{ display: "grid", gap: "12px" }}>
            <h3>Assessments</h3>

            {classOperations.assessments.length === 0 ? (
              <p>No teacher-owned assessments are available for this class yet.</p>
            ) : (
              classOperations.assessments.map((assessment) => (
                <article
                  key={assessment.assessmentId}
                  style={{
                    display: "grid",
                    gap: "8px",
                    border: "1px solid #d9e2f0",
                    borderRadius: "14px",
                    padding: "18px",
                    background: "#f9fbff"
                  }}
                >
                  <strong>{assessment.title}</strong>
                  <p>Type: {formatAssessmentType(assessment.type)}</p>
                  <p>Points: {assessment.totalPoints}</p>
                  <p>Published at: {formatDate(assessment.publishedAt)}</p>
                  <p>Due at: {formatDate(assessment.dueAt)}</p>
                  <p>Review mode: {assessment.reviewMode}</p>
                  <p>Review available at: {formatDate(assessment.reviewAvailableAt)}</p>
                  <Link
                    href={`/teacher/assessments/${assessment.assessmentId}`}
                    style={{ width: "fit-content", color: "#2444ac", fontWeight: 600 }}
                  >
                    Open assessment
                  </Link>
                </article>
              ))
            )}
          </section>

          <section style={{ display: "grid", gap: "12px" }}>
            <h3>Students</h3>

            {classOperations.students.length === 0 ? (
              <p>No enrolled students are available for this class.</p>
            ) : (
              classOperations.students.map((student) => {
                const isSelected = selectedStudentId === student.studentProfileId;
                const isPending = pendingStudentId === student.studentProfileId;

                return (
                  <article
                    key={student.studentProfileId}
                    ref={(element) => {
                      studentCardRefs.current[student.studentProfileId] = element;
                    }}
                    style={{
                      display: "grid",
                      gap: "10px",
                      border: isSelected ? "1px solid #9db9f5" : "1px solid #d9e2f0",
                      borderRadius: "14px",
                      padding: "18px",
                      background: isSelected ? "#eef4ff" : "#f9fbff",
                      boxShadow: isSelected ? "inset 4px 0 0 #2444ac" : "none"
                    }}
                  >
                    <strong>{formatStudentLabel(student)}</strong>
                    <p>Student number: {student.studentNumber ?? "Not available"}</p>
                    <p>Display identifier: {student.displayIdentifier ?? "Not available"}</p>
                    <p>Enrolled at: {formatDate(student.enrolledAt)}</p>
                    {isSelected ? (
                      <p style={{ color: "#2444ac", fontWeight: 600 }}>
                        {isPending ? "Opening selected student..." : "Student is open"}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        void handleStudentListAction(student.studentProfileId);
                      }}
                    >
                      {isPending ? "Opening..." : isSelected ? "Close" : "Open"}
                    </button>

                    {isSelected ? (
                      <section
                        style={{
                          display: "grid",
                          gap: "20px",
                          marginTop: "8px",
                          borderTop: "1px solid #d9e2f0",
                          paddingTop: "18px"
                        }}
                      >
                        <div>
                          <p className="eyebrow">Teacher</p>
                          <h4>Student Operations</h4>
                        </div>

                        {isStudentLoading ? <p>Loading student operations...</p> : null}
                        {!isStudentLoading && selectedStudentOperations ? (
                          <p style={{ color: "#2444ac", fontWeight: 600 }}>
                            Showing {formatStudentLabel(selectedStudentOperations.student)}.
                          </p>
                        ) : null}
                        {studentError ? <p>Error: {studentError}</p> : null}

                        {selectedStudentOperations ? (
                          <>
                            <section
                              style={{
                                display: "grid",
                                gap: "8px",
                                border: "1px solid #d9e2f0",
                                borderRadius: "14px",
                                padding: "18px",
                                background: "#f9fbff"
                              }}
                            >
                              <strong>{formatStudentLabel(selectedStudentOperations.student)}</strong>
                              <p>
                                Student number: {selectedStudentOperations.student.studentNumber ?? "Not available"}
                              </p>
                              <p>
                                Student number in class: {selectedStudentOperations.student.studentNumberInClass ?? "Not available"}
                              </p>
                              <p>
                                Display identifier: {selectedStudentOperations.student.displayIdentifier ?? "Not available"}
                              </p>
                              <p>Enrolled at: {formatDate(selectedStudentOperations.student.enrolledAt)}</p>
                            </section>

                            <section style={{ display: "grid", gap: "12px" }}>
                              <h4>Assessment overview</h4>

                              {selectedStudentOperations.assessments.length === 0 ? (
                                <p>No teacher-owned assessments are available for this student in this class yet.</p>
                              ) : (
                                selectedStudentOperations.assessments.map((assessment) => {
                                  const summary =
                                    selectedStudentOperations.submissionSummaries.find(
                                      (item) => item.assessmentId === assessment.assessmentId
                                    ) ?? null;

                                  return (
                                    <article
                                      key={assessment.assessmentId}
                                      style={{
                                        display: "grid",
                                        gap: "8px",
                                        border: "1px solid #d9e2f0",
                                        borderRadius: "14px",
                                        padding: "18px",
                                        background: "#f9fbff"
                                      }}
                                    >
                                      <strong>{assessment.title}</strong>
                                      <p>Type: {formatAssessmentType(assessment.type)}</p>
                                      <p>Published at: {formatDate(assessment.publishedAt)}</p>
                                      <p>Due at: {formatDate(assessment.dueAt)}</p>
                                      <p>Review mode: {assessment.reviewMode}</p>
                                      <p>Review available at: {formatDate(assessment.reviewAvailableAt)}</p>

                                      {summary ? (
                                        <>
                                          <p>Status: {formatSubmissionStatus(summary.latestSubmissionStatus)}</p>
                                          <p>Submission count: {summary.submissionCount}</p>
                                          <p>Latest submitted at: {formatDate(summary.latestSubmittedAt)}</p>
                                          <p>Latest updated at: {formatDate(summary.latestUpdatedAt)}</p>
                                          <p>Latest result: {formatResultSummary(summary.latestResult)}</p>
                                        </>
                                      ) : (
                                        <p>No submission activity yet.</p>
                                      )}
                                    </article>
                                  );
                                })
                              )}
                            </section>

                            <section style={{ display: "grid", gap: "12px" }}>
                              <h4>Submission summaries</h4>

                              {selectedStudentOperations.submissionSummaries.length === 0 ? (
                                <p>No submission activity is available for this student yet.</p>
                              ) : (
                                selectedStudentOperations.submissionSummaries.map((summary) => (
                                  <article
                                    key={summary.assessmentId}
                                    style={{
                                      display: "grid",
                                      gap: "8px",
                                      border: "1px solid #d9e2f0",
                                      borderRadius: "14px",
                                      padding: "18px",
                                      background: "#f9fbff"
                                    }}
                                  >
                                    <strong>Assessment {summary.assessmentId}</strong>
                                    <p>Status: {formatSubmissionStatus(summary.latestSubmissionStatus)}</p>
                                    <p>Submission count: {summary.submissionCount}</p>
                                    <p>Latest submitted at: {formatDate(summary.latestSubmittedAt)}</p>
                                    <p>Latest updated at: {formatDate(summary.latestUpdatedAt)}</p>
                                    <p>Latest result: {formatResultSummary(summary.latestResult)}</p>
                                  </article>
                                ))
                              )}
                            </section>
                          </>
                        ) : null}
                      </section>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
