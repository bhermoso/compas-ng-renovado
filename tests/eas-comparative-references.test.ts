import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildEASComparativeReferences,
  EAS_COMPARATIVE_REFERENCE_CAUTION,
  ANDALUSIA_EAS_REFERENCE_CONTRACT,
} from "../src/application/eas-references";
import { parseDUKECSV } from "../src/application/duke";

const fixture = (name: string): string =>
  readFileSync(resolve(process.cwd(), "fixtures", name), "utf-8");

const buildReferences = () =>
  buildEASComparativeReferences({
    dukeGranadaCSV: fixture("duke-eas-granada.csv"),
    dukeAndaluciaCSV: fixture("duke-eas-andalucia.csv"),
    predimedGranadaCSV: fixture("predimed-eas-granada.csv"),
    predimedAndaluciaCSV: fixture("predimed-eas-andalucia.csv"),
    sf12GranadaCSV: fixture("sf12-eas-granada.csv"),
    sf12AndaluciaCSV: fixture("sf12-eas-andalucia.csv"),
    suenoGranadaCSV: fixture("sueno-eas-granada.csv"),
    suenoAndaluciaCSV: fixture("sueno-eas-andalucia.csv"),
    cageGranadaCSV: fixture("cage-eas-granada.csv"),
    cageAndaluciaCSV: fixture("cage-eas-andalucia.csv"),
    ipaqGranadaCSV: fixture("ipaq-eas-granada.csv"),
    ipaqAndaluciaCSV: fixture("ipaq-eas-andalucia.csv"),
  });

describe("EAS comparative references", () => {
  it("builds comparative references without creating local evidence atoms", () => {
    const refs = buildReferences();

    expect(refs).toHaveLength(11);
    expect(refs.map((r) => r.id)).toEqual([
      "duke-global-mean",
      "duke-global-low",
      "predimed-mean",
      "predimed-high",
      "sf12-pcs-mean",
      "sf12-mcs-mean",
      "sueno-insuficiente",
      "sueno-no-descansa",
      "cage-risk",
      "ipaq-high",
      "ipaq-inactive",
    ]);

    for (const ref of refs) {
      expect(ref.granada.territorialScope).toBe("granada-provincia-proxy");
      expect(ref.andalucia.territorialScope).toBe("andalucia-reference");
      expect(ref.granada.sourceLabel).toContain("granada");
      expect(ref.andalucia.sourceLabel).toContain("andalucia");
      expect(ref.method).toContain("microdatos EAS");
      expect(ref.caution).toBe(EAS_COMPARATIVE_REFERENCE_CAUTION);
      expect(ref.caution).toContain("no debe redactarse como dato del municipio o del distrito");
    }
  });

  it("keeps Granada/province proxy separate from Andalucía reference", () => {
    const refs = buildReferences();

    const predimed = refs.find((r) => r.id === "predimed-mean");
    expect(predimed).toBeDefined();
    expect(predimed?.granada.value).toBe(7.6);
    expect(predimed?.andalucia.value).toBe(6.5);
    expect(predimed?.deltaGranadaMinusAndalucia).toBe(1.1);

    const ipaqInactive = refs.find((r) => r.id === "ipaq-inactive");
    expect(ipaqInactive).toBeDefined();
    expect(ipaqInactive?.granada.value).toBe(34.2);
    expect(ipaqInactive?.andalucia.value).toBe(36.6);
    expect(ipaqInactive?.direction).toBe("lower-than-andalucia");
  });

  it("documents the main provenance distinction", () => {
    const refs = buildReferences();

    expect(refs.every((r) => r.granada.sourceLabel.endsWith("-granada.csv"))).toBe(true);
    expect(refs.every((r) => r.andalucia.sourceLabel.endsWith("-andalucia.csv"))).toBe(true);
    expect(refs.every((r) => r.granada.nValid > 0)).toBe(true);
    expect(refs.every((r) => r.andalucia.nValid > 0)).toBe(true);
  });

  it("el contrato del Perfil coincide con los valores calculados desde los fixtures", () => {
    // Sincronización sin doble fuente de verdad: cada valor del contrato
    // compartido (el que consume complementaryIndicatorReferences) se
    // contrasta contra el cálculo real desde el fixture autonómico. Si un
    // fixture cambia, este test obliga a actualizar el contrato.
    const refs = buildReferences();

    expect(ANDALUSIA_EAS_REFERENCE_CONTRACT).toHaveLength(11);

    for (const entry of ANDALUSIA_EAS_REFERENCE_CONTRACT) {
      if (entry.easReferenceId === undefined) continue;
      const ref = refs.find((r) => r.id === entry.easReferenceId);
      expect(ref, `referencia EAS ${entry.easReferenceId}`).toBeDefined();
      expect(
        ref!.andalucia.value,
        `${entry.perfilIndicatorId} ← ${entry.easReferenceId}`
      ).toBe(entry.value);
    }

    // DUKE confidencial/afectivo: la capa comparativa no publica estos
    // agregados; el contrato los deriva directamente del mismo fixture con
    // el parser canónico. Se contrastan aquí contra ese cálculo.
    const dukeAndalucia = parseDUKECSV(fixture("duke-eas-andalucia.csv")).aggregates;
    const confidencial = ANDALUSIA_EAS_REFERENCE_CONTRACT.find(
      (e) => e.perfilIndicatorId === "duke-apoyo-confidencial"
    );
    const afectivo = ANDALUSIA_EAS_REFERENCE_CONTRACT.find(
      (e) => e.perfilIndicatorId === "duke-apoyo-afectivo"
    );
    expect(dukeAndalucia.meanConfidential).toBe(confidencial!.value);
    expect(dukeAndalucia.meanAffective).toBe(afectivo!.value);
  });
});
