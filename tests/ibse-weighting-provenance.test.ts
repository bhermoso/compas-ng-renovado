import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseIBSECSV } from "../src/application/ibse/IBSECSVParser";
import { ibseStudyToEvidenceAtoms } from "../src/application/ibse";
import { createIBSEStudy } from "../src/domain/ibse";

const csv = readFileSync("fixtures/ibse-atarfe.csv", "utf8");

describe("IBSE weighting provenance before methodological approval", () => {
  it("declares the absence of demographic adjustment in the available Atarfe export", () => {
    const parsed = parseIBSECSV(csv);
    expect(parsed.aggregates.n).toBe(909);
    expect(parsed.aggregates.nValid).toBe(811);
    expect(parsed.aggregates.meanTotal).toBe(63.2);
    expect(parsed.ageSexObserved).toBeUndefined();
    expect(parsed.methodologicalCautions.join(" ")).toContain("No se ha aplicado ponderación demográfica");
    expect(parsed.methodologicalCautions.join(" ")).toContain("no permite calcular pesos individuales");
  });

  it.each(["atarfe", "18022", "loja", "zagra"])("keeps sample means and limitations in all six atoms for %s", (municipalityId) => {
    const parsed = parseIBSECSV(csv);
    const study = createIBSEStudy({
      municipalityId,
      sourceFileName: "ibse-atarfe.csv",
      aggregates: parsed.aggregates,
      methodologicalCautions: parsed.methodologicalCautions,
    });
    const atoms = ibseStudyToEvidenceAtoms(study);
    expect(atoms).toHaveLength(6);
    for (const atom of atoms) {
      expect(atom.methodology?.limitations?.join(" ")).toContain("No se ha aplicado ponderación demográfica");
      expect(atom.methodology?.requiresHumanValidation).toBe(true);
    }
    expect(study.aggregates).toEqual(parsed.aggregates);
  });

  it("does not confuse available demographics with an applied weighting scheme", () => {
    const parsed = parseIBSECSV([
      "ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete,edad,sexo",
      "10,10,10,10,10,2,18,1",
      "90,90,90,90,90,2,65,2",
    ].join("\n"), { ageBands: [{ label: "15-99", min: 15, max: 99 }] });
    expect(parsed.aggregates.meanTotal).toBe(50);
    expect(parsed.ageSexObserved?.assignedCount).toBe(2);
    expect(parsed.methodologicalCautions.join(" ")).toContain("No se ha aplicado ponderación demográfica");
    expect(parsed.methodologicalCautions.join(" ")).not.toContain("no permite calcular pesos individuales");
  });
});
