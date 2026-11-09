import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseIBSECSV } from "../src/application/ibse";
import { IBSE_REDCAP_SCALE_CONVERSION_CAUTION } from "../src/application/ibse/IBSECSVParser";

const testDir = dirname(fileURLToPath(import.meta.url));
const provincial = readFileSync(
  resolve(testDir, "../fixtures/ibse-granada-provincia.csv"),
  "utf8"
);
const municipal = readFileSync(resolve(testDir, "../fixtures/ibse-atarfe.csv"), "utf8");
const parsed = parseIBSECSV(provincial);

describe("IBSE Granada provincial fixture", () => {
  it("uses columns that the municipal IBSE fixture also carries", () => {
    const municipalColumns = municipal.split(/\r?\n/, 1)[0].split(",");
    for (const column of provincial.split(/\r?\n/, 1)[0].split(",")) {
      expect(municipalColumns).toContain(column);
    }
  });

  it("contains all Granada interviews from the 2023 EAS wave", () => {
    expect(parsed.aggregates.n).toBe(891);
    expect(parsed.aggregates.nValid).toBe(814);
  });

  it("produces the expected COMPAS IBSE aggregates", () => {
    expect(parsed.aggregates).toEqual({
      n: 891,
      nValid: 814,
      // Escala común 0–100: conversión exacta de las fórmulas de REDCap (2026-11-09).
      meanTotal: 78.4,
      meanFactorVinculo: 86.1,
      meanFactorSituacion: 79.2,
      meanFactorControl: 70.2,
      meanFactorPersona: 78.3,
    });
  });

  it("does not produce parser warnings", () => {
    expect(parsed.warnings).toEqual([]);
    expect(parsed.methodologicalCautions).toEqual([
      IBSE_REDCAP_SCALE_CONVERSION_CAUTION,
      "Los resultados son medias de la muestra disponible, no estimaciones poblacionales.",
      "No se ha aplicado ponderación demográfica: cada respuesta válida contribuye por igual a las medias.",
      "El archivo no contiene ambas columnas de edad y sexo; no permite calcular pesos individuales por edad y sexo.",
    ]);
  });
});
