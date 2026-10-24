/**
 * Propuestas de conclusión y orientación del Perfil y su resolución.
 *
 * Contrato: CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY v1.5, Art. 16 ter e
 * I-LHPM-15/16. El sistema propone; el equipo técnico elige o descarta. Ninguna
 * propuesta nace elegida. Este módulo no genera propuestas: resuelve las que le
 * llegan con las decisiones registradas y comprueba las condiciones de
 * elegibilidad.
 */

import type { ProposalDecision } from "../../domain/repository";
import type { RecommendationKind, StatementType } from "../../domain/statements/statementTypes";

export type ProposalKind = "conclusion" | "orientation";

/** Grado de sustento de la relación en que se apoya (Art. 8 bis). */
export type SustentoGrade = 1 | 2 | 3;

export interface Proposal {
  /** Identificador estable: la misma propuesta debe conservarlo entre generaciones. */
  id: string;
  kind: ProposalKind;
  text: string;
  /** Tipo de afirmación (Art. 8); ausente = sin clasificar. */
  tipo?: StatementType;
  /** Tipo de recomendación del Perfil (Art. 8 quater); solo en propuestas de tipo recomendación. Ausente en las anteriores a v2.0. */
  recomendacion?: RecommendationKind;
  /** Etiqueta de lectura (p. ej. «C1»); ausente = el identificador. */
  label?: string;
  /** Quién propone: el sistema (por defecto) o el equipo técnico (Art. 16 ter 1 bis). */
  origin?: "sistema" | "equipo";
  /** Salvedades declaradas por quien propone. */
  cautelas?: string;
  /** Laguna: el dato que la cerraría (Art. 16 quater, apartado 4). */
  datoQueLaCierra?: string;
  /** Laguna: ids de las propuestas de conclusión que condiciona. */
  condiciona?: string[];
  derivedFrom: {
    /** Átomos de evidencia o ids de lectura de los que deriva. */
    evidence: string[];
    /** Conclusiones de las que deriva una orientación (Art. 8, tipo Orientación técnica). */
    conclusionIds?: string[];
    /** Grado de sustento de la relación; ausente cuando la propuesta no se apoya en una. */
    sustento?: SustentoGrade;
    /** Relación de la tabla en que se apoya (Art. 8 ter 2). */
    relationId?: string;
  };
}

export type ProposalState = "pendiente" | "elegida" | "descartada";

export interface ResolvedProposal {
  proposal: Proposal;
  state: ProposalState;
  decision?: ProposalDecision;
  /** Texto que entra en el Perfil: el ajustado por el equipo o el propuesto. */
  finalText: string;
}

export interface ProposalResolution {
  elegidas: ResolvedProposal[];
  descartadas: ResolvedProposal[];
  pendientes: ResolvedProposal[];
  /** Decisiones sobre propuestas que el sistema ya no genera: se conservan, no se aplican. */
  decisionesHuerfanas: ProposalDecision[];
}

/** Id estable a partir de partes legibles, sin depender del orden de generación. */
export function stableProposalId(kind: ProposalKind, ...parts: string[]): string {
  const slug = (x: string) =>
    x
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return [kind, ...parts.map(slug)].join(":");
}

// Responsable, plazo, recurso o indicador de ejecución: pertenecen al Plan de Acción.
const OPERATIONAL_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "responsable", pattern: /\b(responsable|a cargo de|corresponde a la concejal[ií]a)\b/i },
  { id: "plazo", pattern: /\b(en un plazo|antes de(l)? (\d{4}|fin de)|en \d+ (días|semanas|meses|años)|durante el (primer|segundo) (trimestre|semestre))\b/i },
  { id: "recurso", pattern: /\b(presupuesto|dotación económica|financiación de|euros|€)\b/i },
  { id: "indicador-ejecucion", pattern: /\bindicadores? de (ejecución|seguimiento|cumplimiento)\b/i },
  // Art. 8 quater: la recomendación del Perfil no prioriza ni asigna línea estratégica.
  { id: "prioridad", pattern: /\b(prioridad (alta|máxima|absoluta|uno)|se prioriza|priorizar (la|el|los|las)|máxima prioridad)\b/i },
  { id: "linea-estrategica", pattern: /\b(línea estratégica|eje estratégico|objetivo estratégico)\b/i },
];

/** Marcas de actuación operativa en el texto de una orientación (vacío = OK). */
export function checkOrientationText(text: string): string[] {
  return OPERATIONAL_PATTERNS.filter((r) => r.pattern.test(text)).map((r) => r.id);
}

/** Problemas que impiden registrar la decisión; vacío = admisible. */
export function validateDecision(
  proposal: Proposal,
  decision: Pick<ProposalDecision, "decision" | "decidedBy" | "textoAjustado">
): string[] {
  const problems: string[] = [];
  if (decision.decidedBy.trim() === "") problems.push("Falta la autoría de la decisión.");
  if (decision.decision === "elegida" && proposal.kind === "orientation") {
    const s = proposal.derivedFrom.sustento;
    // Conocer y Contrastar no exigen relación; Abordar y las anteriores a v2.0 sí (Art. 8 quater).
    const exigeGrado = proposal.recomendacion === undefined || proposal.recomendacion === "abordar";
    if (exigeGrado && (s === undefined || s === 3)) {
      problems.push(
        "Una recomendación de tipo «Abordar» solo puede apoyarse en relaciones de grado 1 o 2 (Art. 8 bis, 8 quater)."
      );
    }
    const text = decision.textoAjustado ?? proposal.text;
    for (const id of checkOrientationText(text)) {
      problems.push(`La recomendación excede al Perfil (${id}); corresponde al Grupo Motor o al Plan de Acción.`);
    }
  }
  return problems;
}

/** Aplica las decisiones: la más reciente de cada propuesta manda; nada se elige por omisión. */
export function resolveProposals(
  proposals: ReadonlyArray<Proposal>,
  decisions: ReadonlyArray<ProposalDecision> = []
): ProposalResolution {
  const latest = new Map<string, ProposalDecision>();
  for (const d of decisions) {
    const prev = latest.get(d.proposalId);
    if (prev === undefined || d.decidedAt >= prev.decidedAt) latest.set(d.proposalId, d);
  }
  const known = new Set(proposals.map((p) => p.id));
  const out: ProposalResolution = {
    elegidas: [],
    descartadas: [],
    pendientes: [],
    decisionesHuerfanas: decisions.filter((d) => !known.has(d.proposalId)),
  };
  for (const proposal of proposals) {
    const d = latest.get(proposal.id);
    const state: ProposalState = d === undefined ? "pendiente" : d.decision;
    const resolved: ResolvedProposal = {
      proposal,
      state,
      ...(d !== undefined ? { decision: d } : {}),
      finalText: d?.textoAjustado ?? proposal.text,
    };
    if (state === "elegida") out.elegidas.push(resolved);
    else if (state === "descartada") out.descartadas.push(resolved);
    else out.pendientes.push(resolved);
  }
  return out;
}

/** La versión institucional exige que no quede ninguna propuesta sin resolver (Art. 16 ter, 4). */
export function isReadyForInstitutionalVersion(resolution: ProposalResolution): boolean {
  return resolution.pendientes.length === 0;
}
