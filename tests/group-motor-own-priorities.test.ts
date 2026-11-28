import { describe, expect, it } from "vitest";
import { createDeliberativePrioritySelection, doesDeliberativePrioritySelectionMatchLectura } from "../src/domain/deliberative-prioritisation";
import { getEligibleActionPlanModules } from "../src/domain/action-plan-catalog";
import type { ThematicPrioritisation } from "../src/domain/thematic-prioritisation";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { LECTURA_COMPLEJA } from "./strategic-scenario-fixtures";

const SIN_RECOMENDACIONES: LecturaEstrategicaLocal = { ...LECTURA_COMPLEJA, escenarios: [], hasTranslatableContent: false };
const CIUDADANA = { selectedTopicIds: ["bienestar-emocional", "actividad-fisica"], updatedAt: "2026-10-01T00:00:00.000Z" } as unknown as ThematicPrioritisation;
const base = { deliberationRationale: "Decisión de la sesión del 28/10/2026.", citizenInfluenceStatement: "Se apoya en la priorización ciudadana.", decidedBy: "Grupo Motor de Zagra", now: "2026-11-28T10:00:00.000Z" };

describe("prioridades propias del Grupo Motor (excepción a I-LHPM-23, 28/11/2026)", () => {
  it("se registran sin recomendaciones del Perfil y llevan su línea al Plan de Acción", () => {
    const result = createDeliberativePrioritySelection({
      ...base, lectura: SIN_RECOMENDACIONES, citizenPrioritisation: CIUDADANA, selectedScenarioIds: [],
      ownPriorities: [
        { title: "Bienestar emocional y salud mental", origin: "citizen-prioritisation", citizenTopicIds: ["bienestar-emocional"], catalogModuleIds: ["bem-2027-2030"], rationale: "Primera temática ciudadana." },
        { title: "Envejecimiento saludable", origin: "group-motor-deliberation", citizenTopicIds: ["ignorado"], catalogModuleIds: ["env-2027-2030"], rationale: "Población envejecida." },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selection.ownPriorities?.map((o) => [o.id, o.origin, o.citizenTopicIds])).toEqual([
      ["propia-1", "citizen-prioritisation", ["bienestar-emocional"]],
      ["propia-2", "group-motor-deliberation", []],
    ]);
    expect(doesDeliberativePrioritySelectionMatchLectura(result.selection, SIN_RECOMENDACIONES)).toBe(true);
    const eligible = getEligibleActionPlanModules(SIN_RECOMENDACIONES, result.selection);
    expect(eligible.find((e) => e.module.id === "bem-2027-2030")?.sourceScenarioIds).toEqual(["propia-1"]);
  });

  it("exige título, motivación y, si es ciudadana, temáticas registradas", () => {
    const result = createDeliberativePrioritySelection({
      ...base, lectura: SIN_RECOMENDACIONES, citizenPrioritisation: CIUDADANA, selectedScenarioIds: [],
      ownPriorities: [
        { title: "", origin: "group-motor-deliberation", citizenTopicIds: [], catalogModuleIds: [], rationale: "" },
        { title: "Sueño", origin: "citizen-prioritisation", citizenTopicIds: ["sueno"], catalogModuleIds: [], rationale: "x" },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.startsWith("G-DPS-8"))).toBe(true);
    expect(result.violations.some((v) => v.startsWith("G-DPS-9"))).toBe(true);
  });

  it("sin recomendaciones ni prioridades propias no hay decisión", () => {
    const result = createDeliberativePrioritySelection({ ...base, lectura: SIN_RECOMENDACIONES, selectedScenarioIds: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.startsWith("G-DPS-1"))).toBe(true);
  });
});
