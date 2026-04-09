"use client";

import { useEffect, useState } from "react";
import {
  getTeacherClassOperations,
  getTeacherStudentOperations
} from "../../lib/api/teacher";
import type {
  TeacherClassOperationsDetail,
  TeacherClassOperationsStudentSummary,
  TeacherOperationsAssessmentSummary,
  TeacherStudentOperationsDetail,
  TeacherSubmissionStatus
} from "../../types/teacher";

type TeacherClassOperationsSectionProps = {
  classId: string;
  teacherId: string;
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
      return "DRAFT";
    case "SUBMITTED":
      return "SUBMITTED";
    case "GRADED":
      return "GRADED";
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

export function TeacherClassOperationsSection({
  classId,
  teacherId
}: TeacherClassOperationsSectionProps) {
  const [classOperations, setClassOperations] = useState<TeacherClassOperationsDetail | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentOperations, setStudentOperations] = useState<TeacherStudentOperationsDetail | null>(null);
  const [isClassLoading, setIsClassLoading] = useState(true);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStudentId(null);
    setStudentOperations(null);
    setStudentError(null);

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

  async function handleSelectStudent(studentProfileId: string) {
    setSelectedStudentId(studentProfileId);
    setIsStudentLoading(true);

    try {
      setStudentError(null);
      const nextStudentOperations = await getTeacherStudentOperations(
        classId,
        studentProfileId,
        teacherId
      );
      setStudentOperations(nextStudentOperations);
    } catch (error) {
      setStudentOperations(null);
      setStudentError(
        error instanceof Error ? error.message : "The student operations could not be loaded."
      );
    } finally {
      setIsStudentLoading(false);
    }
  }

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

                return (
                  <article
                    key={student.studentProfileId}
                    style={{
                      display: "grid",
                      gap: "10px",
                      border: "1px solid #d9e2f0",
                      borderRadius: "14px",
                      padding: "18px",
                      background: isSelected ? "#eef4ff" : "#f9fbff"
                    }}
                  >
                    <strong>{formatStudentLabel(student)}</strong>
                    <p>Student number: {student.studentNumber ?? "Not available"}</p>
                    <p>Display identifier: {student.displayIdentifier ?? "Not available"}</p>
                    <p>Enrolled at: {formatDate(student.enrolledAt)}</p>
                    <button
                      type="button"
                      disabled={isStudentLoading && isSelected}
                      onClick={() => {
                        void handleSelectStudent(student.studentProfileId);
                      }}
                    >
                      {isStudentLoading && isSelected ? "Opening..." : "Open student operations"}
                    </button>
                  </article>
                );
              })
            )}
          </section>

          <section className="card" style={{ maxWidth: "none", padding: "24px" }}>
            <p className="eyebrow">Teacher</p>
            <h3>Student Operations</h3>

            {!selectedStudentId ? <p>Select a student to load the per-student operations view.</p> : null}
            {isStudentLoading ? <p>Loading student operations...</p> : null}
            {studentError ? <p>Error: {studentError}</p> : null}

            {studentOperations ? (
              <div style={{ display: "grid", gap: "20px", marginTop: "16px" }}>
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
                  <strong>{formatStudentLabel(studentOperations.student)}</strong>
                  <p>Student number: {studentOperations.student.studentNumber ?? "Not available"}</p>
                  <p>
                    Student number in class: {studentOperations.student.studentNumberInClass ?? "Not available"}
                  </p>
                  <p>Display identifier: {studentOperations.student.displayIdentifier ?? "Not available"}</p>
                  <p>Enrolled at: {formatDate(studentOperations.student.enrolledAt)}</p>
                </section>

                <section style={{ display: "grid", gap: "12px" }}>
                  <h4>Assessment overview</h4>

                  {studentOperations.assessments.length === 0 ? (
                    <p>No teacher-owned assessments are available for this student in this class yet.</p>
                  ) : (
                    studentOperations.assessments.map((assessment) => {
                      const summary =
                        studentOperations.submissionSummaries.find(
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

                  {studentOperations.submissionSummaries.length === 0 ? (
                    <p>No submission activity is available for this student yet.</p>
                  ) : (
                    studentOperations.submissionSummaries.map((summary) => (
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
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
