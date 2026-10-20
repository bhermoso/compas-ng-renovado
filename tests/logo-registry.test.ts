import { describe, it, expect } from "vitest";
import {
  LOGO_REGISTRY,
  getAllLogos,
  getPublishableLogos,
} from "../src/domain/branding/logoRegistry";

describe("logoRegistry", () => {
  it("contiene exactamente 5 entradas", () => {
    expect(LOGO_REGISTRY).toHaveLength(5);
  });

  it("todos los IDs son únicos", () => {
    const ids = LOGO_REGISTRY.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("los cinco logos de la caja del histórico están confirmados por el autor", () => {
    expect(getPublishableLogos()).toHaveLength(5);
  });

  it("getAllLogos devuelve los 5 logos", () => {
    expect(getAllLogos()).toHaveLength(5);
  });

  it("cada entrada tiene los campos obligatorios con valor no vacío", () => {
    for (const logo of LOGO_REGISTRY) {
      expect(logo.id, `${logo.id}.id`).toBeTruthy();
      expect(logo.label, `${logo.id}.label`).toBeTruthy();
      expect(logo.owner, `${logo.id}.owner`).toBeTruthy();
      expect(logo.kind, `${logo.id}.kind`).toMatch(/^(institutional|territorial|program|compas)$/);
      expect(logo.file, `${logo.id}.file`).toBeTruthy();
      expect(logo.source, `${logo.id}.source`).toBeTruthy();
      expect(Array.isArray(logo.usageScope), `${logo.id}.usageScope`).toBe(true);
      expect(logo.usageScope.length, `${logo.id}.usageScope`).toBeGreaterThan(0);
      expect(logo.authorization, `${logo.id}.authorization`).toBe("CONFIRMADA");
    }
  });

  it("el orden sigue gobierno → territorio → programas", () => {
    const kinds = LOGO_REGISTRY.map((l) => l.kind);
    const institutionalIdx = kinds.indexOf("institutional");
    const territorialIdx = kinds.indexOf("territorial");
    const firstProgramIdx = kinds.indexOf("program");
    expect(institutionalIdx).toBeLessThan(territorialIdx);
    expect(territorialIdx).toBeLessThan(firstProgramIdx);
  });
});
