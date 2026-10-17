import { describe, it, expect } from "vitest";
import {
  validatePLSEvaluationFramework,
  type MonitoringDraft,
} from "../src/application/monitoring/MonitoringEngine";
import type { PLSEvaluationFramework } from "../src/domain/health-plan";

const completeFramework: PLSEvaluationFramework = {
  evaluationQuestions: ["¿Se redujo la soledad no deseada entre las personas mayores del Zaidín?"],
  evaluationMoments: ["Año 2 del plan", "Cierre del período"],
  evaluationResponsible: "Técnica de Salud Pública del Distrito Sanitario Granada-Metropolitano",
  baselineNote: "Línea base: encuesta de soledad no deseada 2026.",
};

describe("PLSEvaluationFramework en MonitoringDraft — tipos y validación (PM-8 / G-PLS-10)", () => {
  it("el campo evaluationFramework es opcional en MonitoringDraft", () => {
    const draft: Partial<MonitoringDraft> = { trackedItems: [], cautions: [] };
    expect(draft.evaluationFramework).toBeUndefined();
  });

  it("MonitoringDraft acepta un marco de evaluación completo", () => {
    const draft: Partial<MonitoringDraft> = {
      evaluationFramework: completeFramework,
    };
    expect(draft.evaluationFramework?.evaluationQuestions).toHaveLength(1);
    expect(draft.evaluationFramework?.evaluationResponsible).toBeTruthy();
  });

  it("validación pasa con responsable nominal y al menos una pregunta", () => {
    const errors = validatePLSEvaluationFramework(completeFramework);
    expect(errors).toHaveLength(0);
  });

  it("validación pasa con una sola pregunta y responsable", () => {
    const minimal: PLSEvaluationFramework = {
      evaluationQuestions: ["¿Mejoró la autonomía?"],
      evaluationMoments: [],
      evaluationResponsible: "Dr. García López",
      baselineNote: "",
    };
    expect(validatePLSEvaluationFramework(minimal)).toHaveLength(0);
  });

  it("validación falla cuando el marco no está definido", () => {
    const errors = validatePLSEvaluationFramework(undefined);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("no está definido");
  });

  it("validación falla cuando falta el responsable (PM-8)", () => {
    const errors = validatePLSEvaluationFramework({
      ...completeFramework,
      evaluationResponsible: "  ",
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("responsable"))).toBe(true);
    expect(errors.some((e) => e.includes("PM-8"))).toBe(true);
  });

  it("validación falla cuando no hay preguntas de evaluación (G-PLS-10)", () => {
    const errors = validatePLSEvaluationFramework({
      ...completeFramework,
      evaluationQuestions: [],
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("pregunta"))).toBe(true);
    expect(errors.some((e) => e.includes("G-PLS-10"))).toBe(true);
  });

  it("validación falla con preguntas solo de espacios en blanco (G-PLS-10)", () => {
    const errors = validatePLSEvaluationFramework({
      ...completeFramework,
      evaluationQuestions: ["  ", "\t"],
    });
    expect(errors.some((e) => e.includes("pregunta"))).toBe(true);
  });

  it("responsable y preguntas ausentes generan ambos errores", () => {
    const errors = validatePLSEvaluationFramework({
      evaluationQuestions: [],
      evaluationMoments: [],
      evaluationResponsible: "",
      baselineNote: "",
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("momentos y nota de línea base no son obligatorios para la validación mínima", () => {
    const withoutOptional: PLSEvaluationFramework = {
      evaluationQuestions: ["¿Se cumplieron los objetivos?"],
      evaluationMoments: [],
      evaluationResponsible: "Técnica responsable",
      baselineNote: "",
    };
    expect(validatePLSEvaluationFramework(withoutOptional)).toHaveLength(0);
  });
});
