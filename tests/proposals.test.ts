import { describe, expect, it } from "vitest";
import {
  checkOrientationText,
  isReadyForInstitutionalVersion,
  resolveProposals,
  stableProposalId,
  validateDecision,
  type Proposal,
} from "../src/application/proposals";
import {
  addProposalDecision,
  type MunicipalDocumentRepository,
} from "../src/domain/repository";

const concl: Proposal = {
  id: stableProposalId("conclusion", "Bienestar emocional", "voz sin activo"),
  kind: "conclusion",
  text: "La ciudadanía señaló bienestar emocional y no hay activo registrado.",
  derivedFrom: { evidence: ["a1"] },
};
const orient = (s?: 1 | 2 | 3): Proposal => ({
  id: "orientation:x",
  kind: "orientation",
  text: "Explorar la conexión entre soledad no deseada y los activos de participación.",
  derivedFrom: { evidence: ["a1"], conclusionIds: [concl.id], ...(s ? { sustento: s } : {}) },
});
const dec = (proposalId: string, decision: "elegida" | "descartada", decidedAt: string, extra = {}) => ({
  proposalId, decision, decidedBy: "Equipo técnico", decidedAt, ...extra,
});

describe("propuestas del Perfil (menú elegible)", () => {
  it("ninguna propuesta nace elegida", () => {
    const r = resolveProposals([concl, orient(1)]);
    expect(r.pendientes).toHaveLength(2);
    expect(r.elegidas).toHaveLength(0);
    expect(isReadyForInstitutionalVersion(r)).toBe(false);
  });

  it("la decisión más reciente manda y el texto ajustado sustituye al propuesto", () => {
    const r = resolveProposals([concl], [
      dec(concl.id, "descartada", "2026-10-21T10:00:00Z", { motivo: "No la sostiene el Informe" }),
      dec(concl.id, "elegida", "2026-10-21T11:00:00Z", { textoAjustado: "Texto ajustado." }),
    ]);
    expect(r.elegidas[0].finalText).toBe("Texto ajustado.");
    expect(r.descartadas).toHaveLength(0);
    expect(isReadyForInstitutionalVersion(r)).toBe(true);
  });

  it("las descartadas se conservan aparte y no entran en lo elegido", () => {
    const r = resolveProposals([concl], [dec(concl.id, "descartada", "2026-10-21T10:00:00Z")]);
    expect(r.descartadas).toHaveLength(1);
    expect(r.elegidas).toHaveLength(0);
  });

  it("las decisiones sobre propuestas que ya no existen quedan como huérfanas", () => {
    const r = resolveProposals([concl], [dec("conclusion:otra", "elegida", "2026-10-21T10:00:00Z")]);
    expect(r.decisionesHuerfanas).toHaveLength(1);
    expect(r.pendientes).toHaveLength(1);
  });

  it("una orientación sin grado 1 o 2 no puede elegirse", () => {
    for (const s of [undefined, 3] as const) {
      expect(validateDecision(orient(s), { decision: "elegida", decidedBy: "X" }).join(" ")).toContain("grado 1 o 2");
    }
    expect(validateDecision(orient(2), { decision: "elegida", decidedBy: "X" })).toEqual([]);
    expect(validateDecision(orient(3), { decision: "descartada", decidedBy: "X" })).toEqual([]);
  });

  it("una orientación no puede fijar responsable, plazo, recurso ni indicador de ejecución", () => {
    expect(checkOrientationText("La concejalía será la responsable en un plazo de 6 meses")).toEqual(["responsable", "plazo"]);
    expect(checkOrientationText("Con un presupuesto de 5000 euros")).toContain("recurso");
    expect(checkOrientationText("Definir indicadores de seguimiento")).toContain("indicador-ejecucion");
    expect(checkOrientationText("Explorar la conexión con los activos")).toEqual([]);
    const p = validateDecision(orient(1), { decision: "elegida", decidedBy: "X", textoAjustado: "Debe hacerse en 3 meses" });
    expect(p.join(" ")).toContain("plazo");
  });

  it("falta la autoría: no se admite", () => {
    expect(validateDecision(concl, { decision: "elegida", decidedBy: " " })).toHaveLength(1);
  });

  it("los ids son estables y no dependen de acentos ni mayúsculas", () => {
    expect(stableProposalId("conclusion", "Alimentación saludable")).toBe("conclusion:alimentacion-saludable");
  });

  it("el repositorio acumula decisiones sin perder las anteriores", () => {
    const base: MunicipalDocumentRepository = { municipalityId: "zagra", documents: [], createdAt: "x", updatedAt: "x" };
    const r = addProposalDecision(addProposalDecision(base, dec("a", "descartada", "t1")), dec("a", "elegida", "t2"));
    expect(r.proposalDecisions).toHaveLength(2);
  });
});
