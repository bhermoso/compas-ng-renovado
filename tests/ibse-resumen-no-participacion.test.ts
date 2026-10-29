/**
 * Saneamiento epistemológico — la síntesis automática IBSE_RESUMEN no es
 * conocimiento cualitativo ni participación (Commit 2, Intervención Perfil único).
 *
 * IBSE_RESUMEN es una síntesis automática derivada de los indicadores IBSE. Se
 * conserva en el EvidenceStore con su trazabilidad, pero:
 *   - queda fuera de `lt1.qualitativeFindings`;
 *   - no genera la candidatura `oit-qualitative-indicators`;
 *   - un hallazgo cualitativo HUMANO real sí cuenta y conserva su candidatura.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEvidenceStore,
  addEvidenceAtom,
  createEvidenceAtom,
  isDerivedSynthesisAtom,
  IBSE_DERIVED_TAG,
  type EvidenceStore,
} from "../src/domain/evidence";
import { generateLT1 } from "../src/application/lt1";
import { generateOIT } from "../src/application/oit";
import { ibseStudyToEvidenceAtoms } from "../src/application/ibse";
import { createIBSEStudy } from "../src/domain/ibse";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const loadSeed = (rel: string) => {
  const path = rel === "compas-ng-workspace-granada-zaidin.json"
    ? resolve(root, "fixtures/workspaces/granada-zaidin-synthetic-test.json")
    : resolve(root, "public/seeds", rel);
  return parseWorkspaceJSON(readFileSync(path, "utf8"))!;
};

function indicatorAtom(id: string): ReturnType<typeof createEvidenceAtom> {
  return createEvidenceAtom({
    id,
    municipalityId: "t",
    kind: "indicator",
    title: `Indicador ${id}`,
    content: "valor",
    provenance: { origin: "ibse", extractedAt: "2026-01-01T00:00:00.000Z" },
    tags: ["ibse", "indicator"],
  });
}

function ibseResumenLikeAtom(): ReturnType<typeof createEvidenceAtom> {
  return createEvidenceAtom({
    id: "ibse:t:resumen",
    municipalityId: "t",
    kind: "qualitative-observation",
    title: "IBSE – Resumen interpretativo estructural (derivado)",
    content: "síntesis automática",
    provenance: { origin: "ibse", extractedAt: "2026-01-01T00:00:00.000Z" },
    tags: ["ibse", "qualitative-observation", "ibse-resumen", IBSE_DERIVED_TAG],
  });
}

function humanQualitativeAtom(): ReturnType<typeof createEvidenceAtom> {
  return createEvidenceAtom({
    id: "part:t:acta",
    municipalityId: "t",
    kind: "participation",
    title: "Acta del Grupo Motor — experiencia vivida",
    content: "testimonio ciudadano",
    provenance: { origin: "citizen-participation", extractedAt: "2026-01-01T00:00:00.000Z" },
    tags: ["participacion", "grupo-motor"],
  });
}

function storeWith(...atoms: ReturnType<typeof createEvidenceAtom>[]): EvidenceStore {
  return atoms.reduce((s, a) => addEvidenceAtom(s, a), createEvidenceStore("t"));
}

describe("predicado isDerivedSynthesisAtom", () => {
  it("marca la síntesis IBSE (tag ibse-derived) y NO un cualitativo humano", () => {
    expect(isDerivedSynthesisAtom(ibseResumenLikeAtom())).toBe(true);
    expect(isDerivedSynthesisAtom(humanQualitativeAtom())).toBe(false);
    expect(isDerivedSynthesisAtom(indicatorAtom("i1"))).toBe(false);
  });

  it("el átomo IBSE_RESUMEN real que produce el pipeline lleva el marcador derivado", () => {
    const study = createIBSEStudy({
      municipalityId: "t",
      sourceFileName: "ibse.csv",
      aggregates: { n: 100, nValid: 90, meanTotal: 63, meanFactorVinculo: 60, meanFactorSituacion: 60, meanFactorControl: 60, meanFactorPersona: 60 },
      methodologicalCautions: [],
    });
    const atoms = ibseStudyToEvidenceAtoms(study);
    const resumen = atoms.find((a) => a.kind === "qualitative-observation")!;
    expect(resumen).toBeDefined();
    expect(isDerivedSynthesisAtom(resumen)).toBe(true);
  });
});

describe("LT1 — la síntesis derivada no cuenta como cualitativo", () => {
  it("IBSE_RESUMEN permanece en el store pero queda fuera de qualitativeFindings", () => {
    const store = storeWith(indicatorAtom("i1"), indicatorAtom("i2"), ibseResumenLikeAtom());
    const lt1 = generateLT1(store);
    // Sigue en el expediente (trazabilidad conservada).
    expect(store.atoms).toHaveLength(3);
    expect(store.atoms.some((a) => a.id === "ibse:t:resumen")).toBe(true);
    expect(lt1.supportingEvidenceIds).toContain("ibse:t:resumen");
    // Pero no es hallazgo cualitativo.
    expect(lt1.qualitativeFindings).toHaveLength(0);
    expect(lt1.indicators).toHaveLength(2);
  });

  it("un cualitativo HUMANO real sí cuenta en qualitativeFindings", () => {
    const store = storeWith(indicatorAtom("i1"), ibseResumenLikeAtom(), humanQualitativeAtom());
    const lt1 = generateLT1(store);
    expect(lt1.qualitativeFindings).toHaveLength(1);
    expect(lt1.qualitativeFindings[0].id).toBe("part:t:acta");
  });
});

describe("OIT — sin candidatura espuria por síntesis derivada", () => {
  it("IBSE_RESUMEN + indicadores NO genera oit-qualitative-indicators ni sustituto", () => {
    const store = storeWith(indicatorAtom("i1"), indicatorAtom("i2"), ibseResumenLikeAtom());
    const oit = generateOIT(generateLT1(store));
    const ids = oit.opportunities.map((o) => o.id);
    expect(ids).not.toContain("oit-qualitative-indicators");
    // No aparece una candidatura técnica sustitutiva: la única oportunidad es el
    // hueco analítico de ampliar evidencia (isAnalyticalGap), no una candidatura.
    const noGap = oit.opportunities.filter((o) => !o.isAnalyticalGap);
    expect(noGap).toHaveLength(0);
  });

  it("un cualitativo HUMANO real sí genera su candidatura oit-qualitative-indicators", () => {
    const store = storeWith(indicatorAtom("i1"), humanQualitativeAtom());
    const oit = generateOIT(generateLT1(store));
    const ids = oit.opportunities.map((o) => o.id);
    expect(ids).toContain("oit-qualitative-indicators");
  });
});

describe("workspaces canónicos — Atarfe y Granada-Zaidín", () => {
  it("Atarfe: 0 hallazgos cualitativos reales, conserva Informe + IBSE + 5 indicadores", () => {
    const ws = loadSeed("compas-ng-workspace-atarfe.json");
    const rt = createMunicipalityRuntime({ workspace: ws });
    // IBSE_RESUMEN sigue en el store.
    expect(ws.evidenceStore.atoms.some((a) => isDerivedSynthesisAtom(a))).toBe(true);
    // Cero cualitativo/participativo real.
    expect(rt.psl.qualitativeFindingCount).toBe(0);
    // Conserva Informe + IBSE + 5 indicadores.
    expect(ws.healthReport).toBeDefined();
    expect(ws.ibseStudy).toBeDefined();
    expect(rt.psl.indicatorCount).toBe(5);
    // No hay candidatura técnica espuria ni sustituto.
    expect(rt.psl.priorizacion.candidaturasTecnicas).toHaveLength(0);
    expect(rt.psl.priorizacion.hasTechnicalCandidatures).toBe(false);
    // Priorización HUMANA persistida intacta (Atarfe no tiene selección ciudadana).
    expect(ws.thematicPrioritisation).toBeUndefined();
    expect(rt.psl.priorizacion.hasParticipatorySelection).toBe(false);
  });

  it("Granada-Zaidín: 0 cualitativos reales, conserva 23 indicadores y 56 activos", () => {
    const ws = loadSeed("compas-ng-workspace-granada-zaidin.json");
    const rt = createMunicipalityRuntime({ workspace: ws });
    expect(rt.psl.qualitativeFindingCount).toBe(0);
    expect(rt.psl.indicatorCount).toBe(23);
    expect(rt.psl.assetCount).toBe(56);
    // El IBSE_RESUMEN sigue presente en el expediente (no se elimina).
    expect(ws.evidenceStore.atoms.some((a) => isDerivedSynthesisAtom(a))).toBe(true);
    // No candidatura técnica espuria ni sustituto.
    expect(rt.psl.priorizacion.candidaturasTecnicas).toHaveLength(0);
  });
});
