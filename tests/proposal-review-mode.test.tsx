import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { authoredToProposals } from "../src/application/proposals";
import { ProposalReviewMode } from "../src/ui/components/ProposalReviewMode";
import type { AuthoredProposal, ProposalDecision } from "../src/domain/repository";

const authored: AuthoredProposal[] = [
  { id: "C1", kind: "conclusion", tipo: "interpretacion", text: "Texto C1.", evidence: ["Informe, pág. 30"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
  { id: "C2", kind: "conclusion", tipo: "laguna", text: "Texto C2.", evidence: ["F16 §4"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
];
const proposals = authoredToProposals(authored);
const decisions: ProposalDecision[] = [
  { proposalId: proposals[0]!.id, decision: "elegida", decidedBy: "B", decidedAt: "2026-10-23T00:00:00Z" },
];
const noop = () => undefined;
const render = (initiallyOpen: boolean) =>
  renderToStaticMarkup(
    createElement(ProposalReviewMode, {
      proposals, authored, decisions, onDecide: noop, onAdd: noop, onRemove: noop, initiallyOpen,
    })
  );

describe("modo de revisión (Art. 16 ter 8)", () => {
  it("cerrado: muestra el estado y el conmutador, sin los controles de elegir", () => {
    const html = render(false);
    expect(html).toContain("1 elegidas · 0 descartadas · 1 pendientes");
    expect(html).toContain("Abrir el modo de revisión");
    expect(html).not.toContain("Persona que decide");
    expect(html).not.toContain("Elegir</button>");
  });

  it("abierto: aparecen el menú y el panel de redacción", () => {
    const html = render(true);
    expect(html).toContain("Cerrar el modo de revisión");
    expect(html).toContain("Persona que decide");
    expect(html).toContain("Cierre interpretativo del equipo técnico");
  });
});
