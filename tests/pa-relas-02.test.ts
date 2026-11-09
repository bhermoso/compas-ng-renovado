import { describe, expect, it } from "vitest";
import {
  ACTION_PLAN_CATALOG,
  ADDICTIONS_MODULE,
  HEALTHY_AGING_MODULE,
  createPendingModuleReview,
  getCatalogElementIds,
  getEligibleActionPlanModules,
  isModuleReviewStale,
  validateModuleReview,
} from "../src/domain/action-plan-catalog";
import type { DeliberativePrioritySelection } from "../src/domain/deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { LECTURA_COMPLEJA } from "./strategic-scenario-fixtures";

const agingScenario = { ...LECTURA_COMPLEJA.escenarios[0], id: "scenario-aging", tema: "Envejecimiento saludable" };
const addictionsScenario = { ...LECTURA_COMPLEJA.escenarios[1], id: "scenario-addictions", tema: "Prevención y abordaje de las adicciones" };
const unrelatedScenario = { ...LECTURA_COMPLEJA.escenarios[2], id: "scenario-other", tema: "Actividad física" };
const lectura: LecturaEstrategicaLocal = {
  ...LECTURA_COMPLEJA,
  id: "lectura-pa-relas-02",
  escenarios: [agingScenario, addictionsScenario, unrelatedScenario],
};

function selection(
  selectedScenarioIds: string[],
  catalogModuleLinks: Array<{ scenarioId: string; moduleId: string }> = []
): DeliberativePrioritySelection {
  return {
    id: "selection-pa-relas-02",
    municipalityId: lectura.municipalityId,
    sourceLecturaId: lectura.id,
    sourcePSLId: lectura.sourcePSLId,
    sourcePSLVersion: lectura.sourcePSLVersion,
    candidateScenarioIds: lectura.escenarios.map((scenario) => scenario.id),
    selectedScenarioIds,
    catalogModuleLinks,
    citizenTopicIds: [],
    deliberationRationale: "Selección acordada por el Grupo Motor.",
    citizenInfluenceStatement: "No consta aportación ciudadana específica para esta decisión.",
    decidedBy: "Grupo Motor de prueba",
    decidedByRole: "group-motor",
    decidedAt: "2026-09-04T08:00:00.000Z",
    requiresHumanValidation: true,
  };
}

describe("PA-RELAS-02 — catálogo temático del Plan de Acción", () => {
  it("conserva las 2 líneas documentadas (15 OG, 30 OE, 30 indicadores) y añade la línea de bienestar emocional", () => {
    expect(ACTION_PLAN_CATALOG).toHaveLength(3);
    expect(HEALTHY_AGING_MODULE.generalObjectives).toHaveLength(9);
    expect(ADDICTIONS_MODULE.generalObjectives).toHaveLength(6);
    expect(HEALTHY_AGING_MODULE.generalObjectives.flatMap((goal) => goal.specificObjectives)).toHaveLength(18);
    expect(ADDICTIONS_MODULE.generalObjectives.flatMap((goal) => goal.specificObjectives)).toHaveLength(12);
    expect(new Set([HEALTHY_AGING_MODULE, ADDICTIONS_MODULE].flatMap(getCatalogElementIds)).size).toBe(77);
    expect(new Set(ACTION_PLAN_CATALOG.flatMap(getCatalogElementIds)).size).toBe(77 + 42);
  });

  it("propone solo módulos vinculados expresamente mediante identificadores estables", () => {
    expect(getEligibleActionPlanModules(lectura, selection([agingScenario.id], [
      { scenarioId: agingScenario.id, moduleId: HEALTHY_AGING_MODULE.id },
    ])).map(({ module }) => module.id))
      .toEqual([HEALTHY_AGING_MODULE.id]);
    expect(getEligibleActionPlanModules(lectura, selection([unrelatedScenario.id]))).toEqual([]);
  });

  it("no depende del texto y exige siempre el vínculo humano explícito", () => {
    const renamed: LecturaEstrategicaLocal = {
      ...lectura,
      escenarios: [{ ...agingScenario, id: "renamed", tema: "Autonomía y vida activa de las personas mayores" }],
    };
    const withoutLink = { ...selection(["renamed"]), sourceLecturaId: renamed.id };
    const withLink = {
      ...withoutLink,
      catalogModuleLinks: [{ scenarioId: "renamed", moduleId: HEALTHY_AGING_MODULE.id }],
    };
    expect(getEligibleActionPlanModules(renamed, withoutLink)).toEqual([]);
    expect(getEligibleActionPlanModules(renamed, withLink).map(({ module }) => module.id)).toEqual([HEALTHY_AGING_MODULE.id]);
  });

  it("crea una revisión pendiente sin aceptar automáticamente ningún elemento", () => {
    const selected = selection([addictionsScenario.id], [{ scenarioId: addictionsScenario.id, moduleId: ADDICTIONS_MODULE.id }]);
    const eligible = getEligibleActionPlanModules(lectura, selected)[0];
    const review = createPendingModuleReview(lectura.municipalityId, eligible, lectura, selected);

    expect(review.decisions).toHaveLength(31);
    expect(review.decisions[0]).toEqual({ elementId: ADDICTIONS_MODULE.id, status: "pending" });
    expect(review.decisions.every((decision) => decision.status === "pending")).toBe(true);
    expect(review.requiresHumanValidation).toBe(true);
  });

  it("exige autoría y texto explícito para toda adaptación", () => {
    const selected = selection([agingScenario.id], [{ scenarioId: agingScenario.id, moduleId: HEALTHY_AGING_MODULE.id }]);
    const eligible = getEligibleActionPlanModules(lectura, selected)[0];
    const review = createPendingModuleReview(lectura.municipalityId, eligible, lectura, selected);
    review.decisions[0] = { ...review.decisions[0], status: "adapted", adaptedText: "" };

    expect(validateModuleReview(review, eligible.module)).toEqual(expect.arrayContaining([
      expect.stringContaining("redacción municipal"),
      expect.stringContaining("Grupo Motor"),
    ]));
  });

  it("invalida la revisión cuando cambia la selección deliberativa", () => {
    const selected = selection([agingScenario.id], [{ scenarioId: agingScenario.id, moduleId: HEALTHY_AGING_MODULE.id }]);
    const eligible = getEligibleActionPlanModules(lectura, selected)[0];
    const review = createPendingModuleReview(lectura.municipalityId, eligible, lectura, selected);
    const changedSelection = { ...selected, id: "selection-renewed" };

    expect(isModuleReviewStale(review, eligible, lectura, selected)).toBe(false);
    expect(isModuleReviewStale(review, eligible, lectura, changedSelection)).toBe(true);
  });
});
