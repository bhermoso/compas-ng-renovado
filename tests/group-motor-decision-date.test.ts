import { describe, expect, it } from "vitest";
import { createDeliberativePrioritySelection } from "../src/domain/deliberative-prioritisation";
import type { ThematicPrioritisation } from "../src/domain/thematic-prioritisation";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { LECTURA_COMPLEJA } from "./strategic-scenario-fixtures";

const LECTURA: LecturaEstrategicaLocal = { ...LECTURA_COMPLEJA, escenarios: [], hasTranslatableContent: false };
const CIUDADANA = { selectedTopicIds: ["bienestar-emocional"], updatedAt: "2026-10-01T00:00:00.000Z" } as unknown as ThematicPrioritisation;
const input = {
  lectura: LECTURA, citizenPrioritisation: CIUDADANA, selectedScenarioIds: [],
  ownPriorities: [{ title: "Bienestar emocional y salud mental", origin: "citizen-prioritisation" as const, citizenTopicIds: ["bienestar-emocional"], catalogModuleIds: ["bem-2027-2030"], rationale: "x" }],
  deliberationRationale: "x", citizenInfluenceStatement: "x", decidedBy: "Grupo Motor", now: "2026-11-28T10:00:00.000Z",
};

describe("fecha de la decisión del Grupo Motor", () => {
  it("registra la fecha en que se decidió, no la del registro", () => {
    const result = createDeliberativePrioritySelection({ ...input, decisionDate: "2026-10-28" });
    expect(result.ok && result.selection.decidedAt).toBe("2026-10-28T12:00:00.000Z");
  });

  it("sin fecha, conserva la del registro", () => {
    const result = createDeliberativePrioritySelection(input);
    expect(result.ok && result.selection.decidedAt).toBe("2026-11-28T10:00:00.000Z");
  });

  it("rechaza fechas futuras o inválidas", () => {
    for (const decisionDate of ["2026-12-01", "2026-02-30", "28/10/2026"]) {
      const result = createDeliberativePrioritySelection({ ...input, decisionDate });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.violations.some((v) => v.startsWith("G-DPS-10"))).toBe(true);
    }
  });
});
