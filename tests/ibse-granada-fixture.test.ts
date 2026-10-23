import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseIBSECSV } from "../src/application/ibse";

const testDir = dirname(fileURLToPath(import.meta.url));
const provincial = readFileSync(
  resolve(testDir, "../fixtures/ibse-granada-provincia.csv"),
  "utf8"
);
const municipal = readFileSync(resolve(testDir, "../fixtures/ibse-atarfe.csv"), "utf8");
const parsed = parseIBSECSV(provincial);

describe("IBSE Granada provincial fixture", () => {
  it("uses the same parser columns as the municipal IBSE fixture", () => {
    expect(provincial.split(/\r?\n/, 1)[0]).toBe(municipal.split(/\r?\n/, 1)[0]);
  });

  it("contains all Granada interviews from the 2023 EAS wave", () => {
    expect(parsed.aggregates.n).toBe(891);
    expect(parsed.aggregates.nValid).toBe(814);
  });

  it("produces the expected COMPAS IBSE aggregates", () => {
    expect(parsed.aggregates).toEqual({
      n: 891,
      nValid: 814,
      meanTotal: 76.2,
      meanFactorVinculo: 64.6,
      meanFactorSituacion: 84.4,
      meanFactorControl: 77.7,
      meanFactorPersona: 78.3,
    });
  });

  it("does not produce parser warnings", () => {
    expect(parsed.warnings).toEqual([]);
    expect(parsed.methodologicalCautions).toEqual([
      "Los resultados son medias de la muestra disponible, no estimaciones poblacionales.",
      "No se ha aplicado ponderación demográfica: cada respuesta válida contribuye por igual a las medias.",
      "El archivo no contiene ambas columnas de edad y sexo; no permite calcular pesos individuales por edad y sexo.",
    ]);
  });
});
