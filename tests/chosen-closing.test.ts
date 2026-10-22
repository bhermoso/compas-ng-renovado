import { describe, expect, it } from "vitest";
import {
  authoredToProposals,
  buildChosenClosing,
  type Proposal,
} from "../src/application/proposals";
import type { AuthoredProposal, ProposalDecision } from "../src/domain/repository";

const authored: AuthoredProposal[] = [
  { id: "C1", kind: "conclusion", tipo: "interpretacion", text: "Texto C1.", evidence: ["Informe, pág. 30"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
  { id: "C2", kind: "conclusion", tipo: "laguna", text: "Texto C2.", evidence: ["F16 §4"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
  { id: "O1", kind: "orientation", tipo: "orientacion", text: "Valorar X.", evidence: ["C1"], conclusionIds: ["C1"], sustento: 1, cautelas: "Condicionada.", authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
];
const proposals: Proposal[] = authoredToProposals(authored);
const d = (id: string, decision: "elegida" | "descartada", extra: Partial<ProposalDecision> = {}): ProposalDecision => ({
  proposalId: id, decision, decidedBy: "Blas", decidedAt: "2026-10-23T09:00:00Z", ...extra,
});

describe("cierre elegido (Art. 16 ter 3 y 8)", () => {
  it("sin ninguna elegida no hay cierre: la clave no existe", () => {
    expect(buildChosenClosing(proposals, [])).toBeUndefined();
    expect(buildChosenClosing(proposals, undefined)).toBeUndefined();
    expect(buildChosenClosing(proposals, [d(proposals[0]!.id, "descartada")])).toBeUndefined();
  });

  it("solo entra lo elegido; las descartadas y las pendientes no", () => {
    const r = buildChosenClosing(proposals, [d(proposals[0]!.id, "elegida"), d(proposals[1]!.id, "descartada")])!;
    expect(r.conclusions.map((c) => c.etiqueta)).toEqual(["C1"]);
    expect(r.orientations).toEqual([]);
  });

  it("usa el texto ajustado, conserva autoría y fecha, y la orientación remite a la etiqueta de su conclusión", () => {
    const r = buildChosenClosing(proposals, [
      d(proposals[0]!.id, "elegida", { textoAjustado: "C1 ajustada." }),
      d(proposals[2]!.id, "elegida"),
    ])!;
    expect(r.conclusions[0]).toMatchObject({ texto: "C1 ajustada.", elegidaPor: "Blas", elegidaEl: "2026-10-23" });
    expect(r.orientations[0]).toMatchObject({ etiqueta: "O1", derivaDe: ["C1"], sustento: 1, cautelas: "Condicionada." });
  });

  it("la decisión más reciente manda", () => {
    const id = proposals[0]!.id;
    const r = buildChosenClosing(proposals, [
      d(id, "elegida", { decidedAt: "2026-10-23T09:00:00Z" }),
      d(id, "descartada", { decidedAt: "2026-10-24T09:00:00Z" }),
    ]);
    expect(r).toBeUndefined();
  });
});
