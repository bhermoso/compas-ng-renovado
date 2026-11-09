import { describe, expect, it } from "vitest";
import {
  interpretTerritorialMetric,
  loadGranadaTerritorialReferences,
} from "../src/application/complementary-studies";

describe("referencias territoriales de Estudios Complementarios", () => {
  it("calcula Granada con los parsers canónicos", async () => {
    const references = await loadGranadaTerritorialReferences();

    // Escala común 0–100 (conversión exacta de las fórmulas de REDCap, 2026-11-09).
    expect(references.ibse.meanTotal).toBe(78.4);
    expect(references.duke.meanGlobal).toBe(49.2);
    expect(references.predimed.meanScore).toBe(7.6);
    expect(references.sf12.meanPCS).toBeCloseTo(49.552, 3);
    expect(references.sf12.meanMCS).toBeCloseTo(51.139, 3);
    expect(references.sueno.pctInsufficientSleep).toBe(32.8);
    expect(references.cage.pctRisk).toBe(0.6);
    expect(references.ipaq.pctHigh).toBe(15.7);
  });

  it("interpreta la dirección favorable mediante reglas explícitas", () => {
    expect(interpretTerritorialMetric({
      label: "Apoyo social",
      municipalityValue: 51,
      granadaValue: 49.2,
      andaluciaValue: null,
      unit: "/55",
      direction: "higher-is-favourable",
      tolerance: 0.1,
    })).toContain("más favorable que la referencia de Granada");

    expect(interpretTerritorialMetric({
      label: "Riesgo de consumo",
      municipalityValue: 5,
      granadaValue: 0.6,
      andaluciaValue: null,
      unit: " %",
      direction: "lower-is-favourable",
      tolerance: 0.1,
    })).toContain("menos favorable que la referencia de Granada");
  });
});
