import { describe, expect, it } from "vitest";
import {
  auditProposalStatements,
  statementFromProposal,
  validateStatement,
  type Statement,
} from "../src/application/statements";
import {
  authoredToProposals,
  buildReadingUnitProposals,
  resolveProposals,
  stableProposalId,
  validateAuthoredProposal,
  type Proposal,
} from "../src/application/proposals";
import type { AuthoredProposal } from "../src/domain/repository";

const ok: Statement = {
  id: "s1",
  tipo: "hecho",
  paso: "describir",
  texto: "El índice de envejecimiento es 218,28 (BADEA, 2022).",
  evidencia: ["BADEA 2022, índice de envejecimiento"],
  origen: "compilada",
  derivaDe: [],
  requiereEleccion: false,
};

describe("afirmación (I-LHPM-17, Art. 8 ter)", () => {
  it("prueba 1: toda afirmación tiene tipo admisible en su paso y evidencia", () => {
    expect(validateStatement(ok)).toEqual([]);
    expect(validateStatement({ ...ok, evidencia: [] }).join()).toContain("Falta evidencia");
    expect(validateStatement({ ...ok, tipo: "orientacion" }).join()).toContain("no se admite en el paso «describir»");
    // la cautela y la laguna pueden limitarse a remitir a otra afirmación
    expect(validateStatement({ ...ok, tipo: "laguna", evidencia: [], derivaDe: ["s0"] })).toEqual([]);
    expect(validateStatement({ ...ok, tipo: "laguna", evidencia: [], derivaDe: [] }).join()).toContain("Falta evidencia");
  });

  it("las interpretaciones y las hipótesis no pueden ser compiladas", () => {
    const s: Statement = { ...ok, tipo: "interpretacion", paso: "inferir", origen: "compilada" };
    expect(validateStatement(s).join()).toContain("exige autoría humana");
    expect(validateStatement({ ...s, origen: "equipo" })).toEqual([]);
  });

  it("prueba 2: ninguna orientación se apoya en grado 3 ni fija actuación operativa", () => {
    const o: Statement = {
      ...ok, tipo: "orientacion", paso: "orientar", origen: "equipo", derivaDe: ["c1"], sustento: 1,
      texto: "Valorar la conexión.", requiereEleccion: true,
    };
    expect(validateStatement(o)).toEqual([]);
    expect(validateStatement({ ...o, sustento: 3 }).join()).toContain("grado 1 o 2");
    expect(validateStatement({ ...o, sustento: undefined }).join()).toContain("grado 1 o 2");
    expect(validateStatement({ ...o, texto: "Asignar un presupuesto de 3.000 euros." }).join()).toContain("recurso");
    expect(validateStatement({ ...o, derivaDe: [] }).join()).toContain("al menos una conclusión");
  });

  it("una propuesta sin tipo no es una afirmación admisible", () => {
    const p: Proposal = { id: "x", kind: "conclusion", text: "t", derivedFrom: { evidence: ["e"] } };
    const s = statementFromProposal(p);
    expect("problems" in s && s.problems[0]).toContain("no declara su tipo");
    expect(auditProposalStatements([p])).toHaveLength(1);
  });

  it("las propuestas del equipo con tipo y las del sistema pasan la auditoría", () => {
    const authored: AuthoredProposal[] = [
      { id: "C1", kind: "conclusion", tipo: "interpretacion", text: "t", evidence: ["Informe, pág. 30"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
      { id: "C2", kind: "conclusion", tipo: "laguna", text: "t", evidence: ["F16 §4"], authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
      { id: "O1", kind: "orientation", tipo: "orientacion", text: "Valorar X.", evidence: ["C1"], conclusionIds: ["C1"], sustento: 1, authoredBy: "A", authoredAt: "2026-10-22T00:00:00Z" },
    ];
    expect(auditProposalStatements(authoredToProposals(authored))).toEqual([]);
    // un registro anterior a v1.7, sin tipo, queda señalado
    const old = authored.map(({ tipo: _t, ...rest }) => rest as AuthoredProposal);
    expect(auditProposalStatements(authoredToProposals(old)).map((a) => a.id)).toEqual(["conclusion:equipo:c1", "conclusion:equipo:c2", "orientation:equipo:o1"]);
  });

  it("registrar una propuesta nueva exige tipo", () => {
    const base = { id: "C9", kind: "conclusion" as const, text: "t", evidence: ["e"], authoredBy: "A" };
    expect(validateAuthoredProposal(base).join()).toContain("Falta el tipo de afirmación");
    expect(validateAuthoredProposal({ ...base, tipo: "interpretacion" })).toEqual([]);
    expect(validateAuthoredProposal({ ...base, tipo: "orientacion" }).join()).toContain("no se admite en una conclusión");
  });

  it("prueba 7: si cambia la evidencia, la decisión queda huérfana y no se aplica", () => {
    const antes: Proposal = { id: stableProposalId("conclusion", "lectura-por-tema", "alimentacion", "voz-sin-activo-registrado"), kind: "conclusion", tipo: "hecho", text: "a", derivedFrom: { evidence: ["e"] } };
    const despues: Proposal = { ...antes, id: stableProposalId("conclusion", "lectura-por-tema", "alimentacion", "voz-y-activo-registrado"), text: "b" };
    const decision = { proposalId: antes.id, decision: "elegida" as const, decidedBy: "A", decidedAt: "2026-10-22T00:00:00Z" };
    const r = resolveProposals([despues], [decision]);
    expect(r.elegidas).toHaveLength(0);
    expect(r.pendientes).toHaveLength(1);
    expect(r.decisionesHuerfanas).toEqual([decision]);
  });

  it("las propuestas del sistema salen clasificadas y pasan la auditoría", () => {
    const lectura = {
      title: "t",
      intro: "i",
      units: [
        { topicId: "alimentacion", label: "Alimentación", crossing: "voz-sin-activo-registrado", crossingStatement: "La priorización lo señala y no hay activo registrado." },
      ],
      gaps: ["Sin estudio de priorización."],
    } as unknown as Parameters<typeof buildReadingUnitProposals>[0];
    const ps = buildReadingUnitProposals(lectura);
    expect(ps.map((p) => p.tipo)).toEqual(["hecho", "laguna"]);
    expect(auditProposalStatements(ps)).toEqual([]);
  });
});
