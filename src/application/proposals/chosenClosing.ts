/**
 * Cierre elegido del Perfil: conclusiones y orientaciones que el equipo técnico
 * ha elegido (CONTRACT-LHPM v1.7, Art. 16 ter 3 y 8). Entra en el modelo canónico,
 * de modo que pantalla, visor, DOCX y PDF muestran el mismo texto (Art. 17 bis).
 * La clave no existe mientras no haya ninguna propuesta elegida.
 */

import type { ProposalDecision } from "../../domain/repository";
import type { RecommendationKind, StatementType } from "../../domain/statements/statementTypes";
import { resolveProposals, type Proposal, type SustentoGrade } from "./proposals";

export interface ChosenItem {
  /** Etiqueta de lectura (p. ej. «C1»); la del sistema es su identificador. */
  etiqueta: string;
  tipo?: StatementType;
  /** Recomendación del Perfil: tipo (Art. 8 quater); ausente en las anteriores a v2.0. */
  recomendacion?: RecommendationKind;
  /** Texto final: el ajustado por el equipo o el propuesto. */
  texto: string;
  evidencia: string[];
  sustento?: SustentoGrade;
  /** Relación de la tabla en que se apoya. */
  relacion?: string;
  cautelas?: string;
  /** Orientación: etiquetas de las conclusiones de las que deriva. */
  derivaDe?: string[];
  /** Autoría y fecha de la elección. */
  elegidaPor: string;
  elegidaEl: string;
}

export interface CanonicalChosenClosing {
  conclusions: ChosenItem[];
  orientations: ChosenItem[];
}

export function buildChosenClosing(
  proposals: ReadonlyArray<Proposal>,
  decisions: ReadonlyArray<ProposalDecision> | undefined
): CanonicalChosenClosing | undefined {
  const { elegidas } = resolveProposals(proposals, decisions ?? []);
  if (elegidas.length === 0) return undefined;
  const labelOf = new Map(proposals.map((p) => [p.id, p.label ?? p.id]));
  const toItem = (r: (typeof elegidas)[number]): ChosenItem => ({
    etiqueta: r.proposal.label ?? r.proposal.id,
    ...(r.proposal.tipo !== undefined ? { tipo: r.proposal.tipo } : {}),
    ...(r.proposal.recomendacion !== undefined ? { recomendacion: r.proposal.recomendacion } : {}),
    texto: r.finalText,
    evidencia: r.proposal.derivedFrom.evidence,
    ...(r.proposal.derivedFrom.sustento !== undefined ? { sustento: r.proposal.derivedFrom.sustento } : {}),
    ...(r.proposal.derivedFrom.relationId !== undefined ? { relacion: r.proposal.derivedFrom.relationId } : {}),
    ...(r.proposal.cautelas !== undefined ? { cautelas: r.proposal.cautelas } : {}),
    ...(r.proposal.derivedFrom.conclusionIds !== undefined
      ? { derivaDe: r.proposal.derivedFrom.conclusionIds.map((id) => labelOf.get(id) ?? id) }
      : {}),
    elegidaPor: r.decision?.decidedBy ?? "",
    elegidaEl: r.decision?.decidedAt.slice(0, 10) ?? "",
  });
  return {
    conclusions: elegidas.filter((r) => r.proposal.kind === "conclusion").map(toItem),
    orientations: elegidas.filter((r) => r.proposal.kind === "orientation").map(toItem),
  };
}
