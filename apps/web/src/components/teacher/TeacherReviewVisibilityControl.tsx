"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getTeacherAssessmentReviewSettings,
  updateTeacherAssessmentReviewSettings
} from "../../lib/api/teacher";
import type {
  TeacherAssessmentReviewMode,
  TeacherAssessmentReviewSettings
} from "../../types/teacher";

type TeacherReviewVisibilityControlProps = {
  assessmentId: string;
  teacherId: string;
};

function isUnlocked(reviewMode: TeacherAssessmentReviewMode) {
  return reviewMode === "ANSWERS_WITH_EXPLANATIONS";
}

export function TeacherReviewVisibilityControl({
  assessmentId,
  teacherId
}: TeacherReviewVisibilityControlProps) {
  const [settings, setSettings] = useState<TeacherAssessmentReviewSettings | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        setErrorMessage(null);
        setIsLoading(true);
        const nextSettings = await getTeacherAssessmentReviewSettings(assessmentId, teacherId);
        setSettings(nextSettings);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Настройката за преглед не можа да бъде заредена."
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [assessmentId, teacherId]);

  function handleChange(nextReviewMode: TeacherAssessmentReviewMode) {
    if (!settings || settings.reviewMode === nextReviewMode) {
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const nextSettings = await updateTeacherAssessmentReviewSettings(
            assessmentId,
            teacherId,
            nextReviewMode
          );
          setSettings(nextSettings);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Настройката за преглед не можа да бъде запазена."
          );
        }
      })();
    });
  }

  const unlocked = settings ? isUnlocked(settings.reviewMode) : false;

  return (
    <section className="card" style={{ maxWidth: "none" }}>
      <p className="eyebrow">Преглед</p>
      <h2>Достъп за ученика</h2>
      <p>Управлявай дали ученикът вижда прегледа на провереното предаване.</p>

      {isLoading ? <p style={{ marginTop: "16px" }}>Зареждане на настройката...</p> : null}
      {errorMessage ? <p style={{ marginTop: "16px" }}>Грешка: {errorMessage}</p> : null}

      {settings ? (
        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              gap: "8px",
              padding: "6px",
              borderRadius: "999px",
              background: "#eef3fb",
              border: "1px solid #d9e2f0",
              width: "fit-content"
            }}
          >
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleChange("NONE")}
              style={{
                background: unlocked ? "transparent" : "#4064d7",
                color: unlocked ? "#2444ac" : "#ffffff"
              }}
            >
              {isPending && !unlocked ? "Запазване..." : "Заключено за преглед"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleChange("ANSWERS_WITH_EXPLANATIONS")}
              style={{
                background: unlocked ? "#4064d7" : "transparent",
                color: unlocked ? "#ffffff" : "#2444ac"
              }}
            >
              {isPending && unlocked ? "Запазване..." : "Отключено за преглед"}
            </button>
          </div>
          <p>
            Текущ режим: {unlocked ? "Отключено за преглед" : "Заключено за преглед"}
          </p>
        </div>
      ) : null}
    </section>
  );
}