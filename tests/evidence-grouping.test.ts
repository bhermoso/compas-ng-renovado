import { describe, expect, it } from "vitest";
import { createEvidenceAtom, type EvidenceAtomKind } from "../src/domain/evidence/EvidenceAtom";
import {
  EVIDENCE_GROUPING_DIMENSIONS,
  EVIDENCE_GROUPING_FRAMEWORK_LABEL,
} from "../src/domain/evidence-grouping/EvidenceGroupingTaxonomy";
import { groupEvidenceByTaxonomy } from "../src/application/health-profile/groupEvidenceByTaxonomy";

const atom = (id: string, kind: EvidenceAtomKind) =>
  createEvidenceAtom({ id, municipalityId: "m", kind, title: id, content: "c", provenance: { origin: "other", extractedAt: "2026-01-01" } });

describe("taxonomía de agrupación de evidencia", () => {
  it("tiene ocho dimensiones y ningún campo de peso, umbral o puntuación", () => {
    expect(EVIDENCE_GROUPING_DIMENSIONS).toHaveLength(8);
    for (const d of EVIDENCE_GROUPING_DIMENSIONS) {
      expect(Object.keys(d).join(" ")).not.toMatch(/peso|weight|score|umbral|threshold|rank/i);
    }
  });
  it("declara sin equivalente solo el Cuadro de Mando Integral", () => {
    expect(EVIDENCE_GROUPING_DIMENSIONS.filter((d) => d.withoutNgEquivalent).map((d) => d.id)).toEqual(["tendencias-cuadro-de-mando"]);
  });
  it("ningún tipo de átomo pertenece a dos dimensiones", () => {
    const kinds = EVIDENCE_GROUPING_DIMENSIONS.flatMap((d) => d.atomKinds);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
  it("se rotula como marco propio de COMPÁS", () => {
    expect(EVIDENCE_GROUPING_FRAMEWORK_LABEL).toBe("Marco propio de COMPÁS");
  });
});

describe("groupEvidenceByTaxonomy", () => {
  const atoms = [atom("a", "indicator"), atom("b", "asset"), atom("c", "participation"), atom("d", "indicator"), atom("e", "other")];
  const out = groupEvidenceByTaxonomy(atoms);
  it("agrupa por tipo y conserva el orden de entrada dentro del grupo", () => {
    const g = (id: string) => out.groups.find((x) => x.dimension.id === id)!;
    expect(g("epidemiologia-territorial").atoms.map((a) => a.id)).toEqual(["a", "d"]);
    expect(g("participacion-ciudadana").atoms.map((a) => a.id)).toEqual(["c"]);
    expect(g("tendencias-cuadro-de-mando").atoms).toEqual([]);
  });
  it("declara sin asignar los átomos sin dimensión, como los activos", () => {
    expect(out.unassigned.map((a) => a.id)).toEqual(["b", "e"]);
  });
  it("no pierde ni duplica átomos", () => {
    const n = out.groups.reduce((s, g) => s + g.atoms.length, 0) + out.unassigned.length;
    expect(n).toBe(atoms.length);
  });
  it("no modifica los átomos", () => {
    const copy = JSON.stringify(atoms);
    groupEvidenceByTaxonomy(atoms);
    expect(JSON.stringify(atoms)).toBe(copy);
  });
  it("sin átomos devuelve las ocho dimensiones vacías", () => {
    const empty = groupEvidenceByTaxonomy([]);
    expect(empty.groups).toHaveLength(8);
    expect(empty.unassigned).toEqual([]);
  });
});
