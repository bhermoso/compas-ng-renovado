import { describe, it, expect } from "vitest";
import { assessProfileValidation, profileCanFeedDownstream } from "../src/domain/quality/ProfileValidationCriterion";

describe("criterio de calidad «Perfil validado»", () => {
  it("se cumple con validado o aprobado vigente", () => {
    expect(assessProfileValidation("validated", false)).toMatchObject({ level: "validated", met: true });
    expect(assessProfileValidation("approved", false)).toMatchObject({ level: "approved", met: true });
  });
  it("no se cumple, pero no bloquea, si el Perfil no está validado", () => {
    for (const s of ["generated", "review", undefined] as const) {
      expect(assessProfileValidation(s, false)).toMatchObject({ level: "not-validated", met: false });
      expect(profileCanFeedDownstream(s)).toBe(true);
    }
  });
  it("declara la validación desactualizada si las fuentes cambiaron", () => {
    expect(assessProfileValidation("validated", true)).toMatchObject({ level: "validated-stale", met: false });
    expect(profileCanFeedDownstream("validated")).toBe(true);
  });
  it("un Perfil sustituido o archivado no alimenta productos posteriores", () => {
    for (const s of ["superseded", "archived"] as const) {
      expect(assessProfileValidation(s, false).level).toBe("retired");
      expect(profileCanFeedDownstream(s)).toBe(false);
    }
  });
});
