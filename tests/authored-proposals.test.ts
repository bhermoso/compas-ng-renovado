import { describe, expect, it } from "vitest";
import {
  authoredProposalId,
  authoredToProposals,
  resolveProposals,
  validateAuthoredProposal,
  validateDecision,
} from "../src/application/proposals";
import {
  addAuthoredProposal,
  removeAuthoredProposal,
  type AuthoredProposal,
  type MunicipalDocumentRepository,
} from "../src/domain/repository";

const C1: AuthoredProposal = {
  id: "C1",
  kind: "conclusion",
  tipo: "interpretacion",
  text: "Texto de conclusión.",
  evidence: ["Informe, pág. 12"],
  authoredBy: "Equipo",
  authoredAt: "2026-10-22T08:00:00.000Z",
};
const base = { municipalityId: "m", documents: [], createdAt: "x", updatedAt: "x" } as unknown as MunicipalDocumentRepository;

describe("propuestas del equipo técnico", () => {
  it("exige evidencia citada", () => {
    expect(validateAuthoredProposal({ ...C1, evidence: [" "] })).toContain(
      "Toda propuesta cita al menos una evidencia (documento y localización)."
    );
    expect(validateAuthoredProposal(C1)).toEqual([]);
  });

  it("una orientación exige conclusión registrada, sustento y ninguna actuación operativa", () => {
    const o = { id: "O1", kind: "orientation" as const, tipo: "orientacion" as const, text: "Valorar X.", evidence: ["F17"], authoredBy: "Equipo", conclusionIds: ["C1"], sustento: 1 as const };
    expect(validateAuthoredProposal(o, [C1])).toEqual([]);
    expect(validateAuthoredProposal(o, [])).toContain("La conclusión «C1» no está registrada.");
    expect(validateAuthoredProposal({ ...o, sustento: undefined }, [C1])).toContain(
      "Una orientación declara el grado de sustento de su relación."
    );
    expect(validateAuthoredProposal({ ...o, text: "Con presupuesto de 3000 euros." }, [C1]).join()).toContain("recurso");
  });

  it("no nacen elegidas y la de grado 3 no se puede elegir", () => {
    const [c, o] = authoredToProposals([
      C1,
      { ...C1, id: "O1", kind: "orientation", tipo: "orientacion", conclusionIds: ["C1"], sustento: 3 },
    ]);
    expect(c!.origin).toBe("equipo");
    expect(o!.derivedFrom.conclusionIds).toEqual([authoredProposalId({ kind: "conclusion", id: "C1" })]);
    expect(resolveProposals([c!, o!]).pendientes).toHaveLength(2);
    expect(validateDecision(o!, { decision: "elegida", decidedBy: "A" }).join()).toContain("grado 1 o 2");
  });

  it("registrar y retirar conserva el resto; mismo id sustituye", () => {
    const r1 = addAuthoredProposal(base, C1);
    const r2 = addAuthoredProposal(r1, { ...C1, text: "Nueva redacción." });
    expect(r2.authoredProposals).toHaveLength(1);
    expect(r2.authoredProposals![0]!.text).toBe("Nueva redacción.");
    expect(removeAuthoredProposal(r2, "C1").authoredProposals).toBeUndefined();
  });
});
