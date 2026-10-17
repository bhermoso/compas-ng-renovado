import { describe, it, expect } from "vitest";
import {
  validateActionPlanUnaddressedNeeds,
  type ActionPlanDraft,
} from "../src/application/action-plan/ActionPlanEngine";
import type { UnaddressedNeed } from "../src/domain/health-plan";

const validNeed: UnaddressedNeed = {
  id: "n-salud-mental",
  title: "Salud mental en jóvenes",
  justification: "Prioridad reconocida pero fuera del alcance de este ciclo de planificación.",
};

describe("unaddressedNeeds en ActionPlanDraft — captura y validación (G-PLS-7)", () => {
  it("el campo es opcional: un draft sin unaddressedNeeds sigue siendo válido", () => {
    const draft = {} as Partial<ActionPlanDraft>;
    expect(draft.unaddressedNeeds).toBeUndefined();
  });

  it("el campo acepta una lista de necesidades no priorizadas", () => {
    const draft: Pick<ActionPlanDraft, "unaddressedNeeds"> = {
      unaddressedNeeds: [validNeed],
    };
    expect(draft.unaddressedNeeds).toHaveLength(1);
    expect(draft.unaddressedNeeds![0].id).toBe("n-salud-mental");
    expect(draft.unaddressedNeeds![0].title).toBe("Salud mental en jóvenes");
    expect(draft.unaddressedNeeds![0].justification).toBeTruthy();
  });

  it("validación pasa con lista vacía (ninguna necesidad quedó fuera)", () => {
    expect(validateActionPlanUnaddressedNeeds([])).toHaveLength(0);
  });

  it("validación pasa con necesidades completas", () => {
    const errors = validateActionPlanUnaddressedNeeds([validNeed]);
    expect(errors).toHaveLength(0);
  });

  it("validación pasa con múltiples necesidades válidas", () => {
    const second: UnaddressedNeed = {
      id: "n-adicciones",
      title: "Consumo de sustancias en población adulta",
      justification: "Requiere coordinación intersectorial no disponible en este ciclo.",
    };
    const errors = validateActionPlanUnaddressedNeeds([validNeed, second]);
    expect(errors).toHaveLength(0);
  });

  it("validación rechaza necesidad sin justificación", () => {
    const errors = validateActionPlanUnaddressedNeeds([{ ...validNeed, justification: "  " }]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("justificación");
  });

  it("validación rechaza necesidad sin título", () => {
    const errors = validateActionPlanUnaddressedNeeds([{ ...validNeed, title: "" }]);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.includes("título"))).toBe(true);
  });

  it("validación rechaza necesidad sin id", () => {
    const errors = validateActionPlanUnaddressedNeeds([{ ...validNeed, id: "  " }]);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.includes("identificador"))).toBe(true);
  });

  it("reporta todos los errores de todas las necesidades inválidas", () => {
    const empty: UnaddressedNeed = { id: "", title: "", justification: "" };
    const errors = validateActionPlanUnaddressedNeeds([empty]);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("un sourceAreaId opcional no afecta la validación", () => {
    const withArea: UnaddressedNeed = {
      ...validNeed,
      sourceAreaId: "area-salud-mental-001",
    };
    expect(validateActionPlanUnaddressedNeeds([withArea])).toHaveLength(0);
  });
});
