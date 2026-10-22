import { describe, expect, it } from "vitest";
import {
  buildChosenClosing,
  buildRelationProposals,
  checkOrientationText,
  draftOrientationFromRelation,
} from "../src/application/proposals";
import { auditProposalStatements } from "../src/application/statements/statements";
import type { ProposalDecision, RelationDeclaration } from "../src/domain/repository";

const rel = (o: Partial<RelationDeclaration> = {}): RelationDeclaration => ({
  id: "R1", version: 1,
  determinant: { label: "Envejecimiento", evidence: ["BADEA 51744"] },
  problem: { label: "Mortalidad por causas crónicas", evidence: ["BADEA 40249"] },
  grade: 1, basis: "Ambos extremos constan en datos locales.", status: "validada",
  declaredBy: "Blas", declaredAt: "2026-10-22T00:00:00Z", ...o,
});

describe("reglas de generación desde la tabla de relaciones (Art. 8 ter 3)", () => {
  it("una relación validada de grado 1 genera una conclusión de tipo hecho, con su evidencia", () => {
    const { proposals, skipped } = buildRelationProposals([rel()]);
    expect(skipped).toEqual([]);
    expect(proposals).toHaveLength(1);
    const c = proposals[0]!;
    expect(c.kind).toBe("conclusion");
    expect(c.tipo).toBe("hecho");
    expect(c.origin).toBe("sistema");
    expect(c.derivedFrom).toEqual({ evidence: ["BADEA 51744", "BADEA 40249"], sustento: 1, relationId: "R1" });
    expect(c.text).toContain("declara, por Blas el 2026-10-22");
  });

  it("ninguna regla genera interpretaciones, hipótesis ni orientaciones (autoría humana, Art. 8)", () => {
    const { proposals } = buildRelationProposals([rel(), rel({ id: "R2" })]);
    expect(proposals.every((p) => p.kind === "conclusion" && p.tipo === "hecho")).toBe(true);
  });

  it("grado 2: la conclusión rotula la fuente como externa y no local", () => {
    const r = rel({ id: "R2", grade: 2, determinant: { label: "A", evidence: [] }, problem: { label: "B", evidence: [] },
      source: { title: "EAS", year: "2023", scale: "Andalucía" }, basis: "Fuente externa." });
    const { proposals } = buildRelationProposals([r]);
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.text).toContain("no local");
    expect(proposals[0]!.derivedFrom.sustento).toBe(2);
  });

  it("grado 3 o sin validar no genera nada y declara el motivo", () => {
    const { proposals, skipped } = buildRelationProposals([
      rel({ id: "R3", grade: 3, basis: "Plausible." }),
      rel({ id: "R4", status: "propuesta" }),
    ]);
    expect(proposals).toEqual([]);
    expect(skipped.map((s) => s.relationId)).toEqual(["R3", "R4"]);
    expect(skipped[0]!.reasons.join(" ")).toMatch(/grado 3/);
    expect(skipped[1]!.reasons.join(" ")).toMatch(/validada/);
  });

  it("solo cuenta la última versión; el id incluye la versión, así que la decisión antigua queda huérfana", () => {
    const v1 = buildRelationProposals([rel()]).proposals;
    const v2 = buildRelationProposals([rel(), rel({ version: 2, basis: "Reformulada." })]).proposals;
    expect(v2).toHaveLength(1);
    expect(v2[0]!.id).not.toBe(v1[0]!.id);
  });

  it("la propuesta generada es una afirmación válida y nace pendiente", () => {
    const { proposals } = buildRelationProposals([rel()]);
    expect(auditProposalStatements(proposals)).toEqual([]);
    expect(buildChosenClosing(proposals, [])).toBeUndefined();
    const d: ProposalDecision[] = [{ proposalId: proposals[0]!.id, decision: "elegida", decidedBy: "Blas", decidedAt: "2026-10-23T00:00:00Z" }];
    expect(buildChosenClosing(proposals, d)!.conclusions).toHaveLength(1);
  });

  it("el borrador de orientación solo existe para relaciones validadas de grado 1 o 2 y no es una propuesta", () => {
    const d = draftOrientationFromRelation([rel()], "R1")!;
    expect(d.text).toContain("decisión posterior");
    expect(d.evidence).toEqual(["BADEA 51744", "BADEA 40249"]);
    expect(checkOrientationText(d.text)).toEqual([]);
    expect(draftOrientationFromRelation([rel({ grade: 3 })], "R1")).toBeNull();
    expect(draftOrientationFromRelation([rel({ status: "propuesta" })], "R1")).toBeNull();
    expect(draftOrientationFromRelation([rel()], "R9")).toBeNull();
  });
});
