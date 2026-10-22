import { describe, expect, it } from "vitest";
import {
  currentRelations,
  sustentoFromRelation,
  validateRelationDeclaration,
} from "../src/application/relations";
import { validateAuthoredProposal } from "../src/application/proposals";
import {
  addRelationDeclaration,
  type MunicipalDocumentRepository,
  type RelationDeclaration,
} from "../src/domain/repository";

const base = { municipalityId: "m", documents: [], createdAt: "x", updatedAt: "x" } as unknown as MunicipalDocumentRepository;
const draft = (over: Partial<Omit<RelationDeclaration, "version" | "declaredAt">> = {}) => ({
  id: "R1",
  determinant: { label: "Envejecimiento", evidence: ["BADEA 2022"] },
  problem: { label: "Patología de edades altas", evidence: ["Informe, pág. 34"] },
  grade: 1 as const,
  basis: "Ambos extremos constan en evidencia local.",
  status: "validada" as const,
  declaredBy: "Blas",
  ...over,
});

describe("tabla de relaciones (Arts. 8 bis y 8 ter 2)", () => {
  it("grado 1 exige evidencia local de ambos extremos", () => {
    expect(validateRelationDeclaration(draft())).toEqual([]);
    expect(validateRelationDeclaration(draft({ problem: { label: "p", evidence: [] } })).join()).toContain("grado 1");
  });

  it("grado 2 exige fuente externa con título, año y escala", () => {
    expect(validateRelationDeclaration(draft({ grade: 2 })).join()).toContain("grado 2");
    expect(
      validateRelationDeclaration(
        draft({ grade: 2, source: { title: "Estudio X", year: "2019", scale: "España" } })
      )
    ).toEqual([]);
  });

  it("cada cambio es una versión nueva y la última es la vigente; las anteriores se conservan", () => {
    const r1 = addRelationDeclaration(base, draft({ status: "propuesta" }));
    const r2 = addRelationDeclaration(r1, draft({ status: "validada" }));
    expect(r2.relationDeclarations).toHaveLength(2);
    expect(r2.relationDeclarations!.map((r) => r.version)).toEqual([1, 2]);
    const cur = currentRelations(r2.relationDeclarations);
    expect(cur).toHaveLength(1);
    expect(cur[0]).toMatchObject({ version: 2, status: "validada" });
  });

  it("una orientación solo se apoya en una relación validada de grado 1 o 2", () => {
    const h = (over: Partial<Omit<RelationDeclaration, "version" | "declaredAt">>) =>
      addRelationDeclaration(base, draft(over)).relationDeclarations;
    expect(sustentoFromRelation(h({}), "R1")).toEqual({ ok: true, grade: 1 });
    expect(sustentoFromRelation(h({ status: "propuesta" }), "R1")).toMatchObject({ ok: false });
    expect(sustentoFromRelation(h({ grade: 3 }), "R1")).toMatchObject({ ok: false });
    expect(sustentoFromRelation(h({}), "R9")).toMatchObject({ ok: false });
  });

  it("el sustento de una orientación sale de la relación y debe coincidir", () => {
    const rels = addRelationDeclaration(base, draft()).relationDeclarations;
    const c1 = { id: "C1", kind: "conclusion" as const, tipo: "interpretacion" as const, text: "t", evidence: ["e"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" };
    const o = { id: "O1", kind: "orientation" as const, tipo: "orientacion" as const, text: "Valorar X.", evidence: ["C1"], conclusionIds: ["C1"], relationId: "R1", sustento: 1 as const, authoredBy: "A" };
    expect(validateAuthoredProposal(o, [c1], rels)).toEqual([]);
    expect(validateAuthoredProposal({ ...o, sustento: undefined }, [c1], rels).join()).toContain("no coincide");
    expect(validateAuthoredProposal(o, [c1], undefined).join()).toContain("no consta en la tabla");
  });
});
