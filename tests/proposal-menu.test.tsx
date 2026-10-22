import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildReadingUnitProposals, resolveProposals } from "../src/application/proposals";
import { ProposalMenuPanel } from "../src/ui/components/ProposalMenuPanel";
import type { CanonicalReadingUnits } from "../src/application/localiza-assets";

const lectura: CanonicalReadingUnits = {
  title: "Lectura por tema",
  intro: "x",
  units: [
    { topicId: "bienestar-emocional", label: "Bienestar emocional", crossing: "voz-sin-activo-registrado", lines: [], crossingStatement: "La ciudadanía lo señaló y no hay activo." },
    { topicId: "alimentacion", label: "Alimentación", crossing: "voz-y-activo-registrado", lines: [], crossingStatement: "La ciudadanía lo señaló y hay activo." },
  ],
  gaps: ["Temas sin fuente en el expediente: Accidentes."],
};

describe("menú de propuestas desde «Lectura por tema»", () => {
  it("genera una propuesta por unidad y por laguna, todas pendientes", () => {
    const p = buildReadingUnitProposals(lectura);
    expect(p).toHaveLength(3);
    expect(p.every((x) => x.kind === "conclusion")).toBe(true);
    expect(resolveProposals(p).pendientes).toHaveLength(3);
  });

  it("el id cambia con el patrón de cruce: una decisión previa no se aplica a otra evidencia", () => {
    const antes = buildReadingUnitProposals(lectura)[0];
    const despues = buildReadingUnitProposals({
      ...lectura,
      units: [{ ...lectura.units[0], crossing: "voz-y-activo-registrado" }, lectura.units[1]],
    })[0];
    expect(antes.id).not.toBe(despues.id);
    const r = resolveProposals([despues], [
      { proposalId: antes.id, decision: "elegida", decidedBy: "X", decidedAt: "2026-10-22T00:00:00Z" },
    ]);
    expect(r.pendientes).toHaveLength(1);
    expect(r.decisionesHuerfanas).toHaveLength(1);
  });

  it("sin lectura por tema no hay propuestas ni panel", () => {
    expect(buildReadingUnitProposals(undefined)).toEqual([]);
    expect(renderToStaticMarkup(createElement(ProposalMenuPanel, { proposals: [], decisions: [], onDecide: () => {} }))).toBe("");
  });

  it("el panel muestra el estado y no elige nada por defecto", () => {
    const proposals = buildReadingUnitProposals(lectura);
    const html = renderToStaticMarkup(
      createElement(ProposalMenuPanel, {
        proposals,
        decisions: [{ proposalId: proposals[0].id, decision: "descartada", decidedBy: "Blas", decidedAt: "2026-10-22T01:00:00Z", motivo: "No la sostiene" }],
        onDecide: () => {},
      })
    );
    expect(html).toContain("0 elegidas");
    expect(html).toContain("1 descartadas");
    expect(html).toContain("2 pendientes");
    expect(html).toContain("Descartada por Blas");
  });
});
