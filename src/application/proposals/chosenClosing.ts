/**
 * Cierre elegido del Perfil: conclusiones y orientaciones que el equipo técnico
 * ha elegido (CONTRACT-LHPM v1.7, Art. 16 ter 3 y 8). Entra en el modelo canónico,
 * de modo que pantalla, visor, DOCX y PDF muestran el mismo texto (Art. 17 bis).
 * La clave no existe mientras no haya ninguna propuesta elegida.
 */

import type { ProposalDecision } from "../../domain/repository";
import { RECOMMENDATION_LABEL, type RecommendationKind, type StatementType } from "../../domain/statements/statementTypes";
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
  /** Laguna: el dato que la cerraría; ausente = no declarado. */
  datoQueLaCierra?: string;
  /** Laguna: etiquetas de las conclusiones que condiciona. */
  condiciona?: string[];
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
    ...(r.proposal.datoQueLaCierra !== undefined ? { datoQueLaCierra: r.proposal.datoQueLaCierra } : {}),
    ...(r.proposal.condiciona !== undefined && r.proposal.condiciona.length > 0
      ? { condiciona: r.proposal.condiciona.map((id) => labelOf.get(id) ?? id) }
      : {}),
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

/**
 * Conclusiones del cuerpo (hecho, interpretación, hipótesis) y lagunas
 * (Art. 16 quater, apartados 2 y 4). Las lagunas no se presentan como conclusiones.
 */
export function splitChosenConclusions(cc: CanonicalChosenClosing): {
  cuerpo: ChosenItem[];
  lagunas: ChosenItem[];
} {
  return {
    cuerpo: cc.conclusions.filter((c) => c.tipo !== "laguna"),
    lagunas: cc.conclusions.filter((c) => c.tipo === "laguna"),
  };
}

/** Líneas de una laguna en «Lo que no sabemos», idénticas en pantalla y documento (Art. 17 bis). */
export function unknownLines(l: ChosenItem): string[] {
  const label = visibleLabel(l);
  return [
    `${label !== null ? `${label} · ` : ""}${l.texto}`,
    [
      l.condiciona !== undefined && l.condiciona.length > 0 ? `Condiciona: ${l.condiciona.join(", ")}.` : "",
      `Dato que la cerraría: ${l.datoQueLaCierra !== undefined ? l.datoQueLaCierra.replace(/[.\s]+$/, "") + "." : "no declarado."}`,
    ]
      .filter((x) => x !== "")
      .join(" "),
    `Evidencia: ${l.evidencia.join("; ")}.`,
  ];
}

/** Etiqueta visible: solo las que redacta el equipo (C1, O2…); las del sistema son identificadores internos. */
export function visibleLabel(item: ChosenItem): string | null {
  return /^[A-ZÁÉÍÓÚÑ]{1,3}\d{1,3}$/.test(item.etiqueta) ? item.etiqueta : null;
}

const TIPO_LABEL: Partial<Record<StatementType, string>> = {
  hecho: "Hecho",
  interpretacion: "Interpretación",
  hipotesis: "Hipótesis",
};

const MAX_VISIBLE_EVIDENCE = 3;

function evidenceLine(evidencia: string[]): string {
  const shown = evidencia.slice(0, MAX_VISIBLE_EVIDENCE).map((e) => e.replace(/[.\s]+$/, ""));
  const more = evidencia.length - shown.length;
  return `Evidencia: ${shown.join("; ")}${more > 0 ? `; y ${more} más` : ""}.`;
}

/**
 * Líneas de una conclusión en el bloque de campos fijos (Art. 16 quater, apartado 2),
 * idénticas en pantalla y documento: etiqueta y tipo con el enunciado, hasta tres
 * evidencias, sustento, límite principal y recomendaciones a las que lleva.
 */
export function conclusionLines(c: ChosenItem, orientations: ReadonlyArray<ChosenItem>): string[] {
  const label = visibleLabel(c);
  const tipo = c.tipo !== undefined ? TIPO_LABEL[c.tipo] : undefined;
  const head = [label, tipo ?? "Sin clasificar"].filter((x): x is string => x !== null).join(" · ");
  const llevaA =
    label === null
      ? []
      : orientations
          .filter((o) => (o.derivaDe ?? []).includes(label))
          .map((o) => visibleLabel(o) ?? o.texto);
  return [
    `${head}. ${c.texto}`,
    evidenceLine(c.evidencia),
    c.sustento !== undefined
      ? `Sustento: grado ${c.sustento}${c.relacion !== undefined ? ` (relación ${c.relacion})` : ""}.`
      : "Sustento: sin relación declarada.",
    ...(c.cautelas !== undefined ? [`Límite principal: ${c.cautelas.replace(/[.\s]+$/, "")}.`] : []),
    ...(llevaA.length > 0 ? [`Lleva a: ${llevaA.join(", ")}.`] : []),
  ];
}

/** Líneas de una recomendación del Perfil (Art. 8 quater), idénticas en pantalla y documento. */
export function recommendationLines(o: ChosenItem): string[] {
  const label = visibleLabel(o);
  return [
    `${label !== null ? `${label} · ` : ""}${o.recomendacion !== undefined ? `${RECOMMENDATION_LABEL[o.recomendacion]}. ` : ""}${o.texto}`,
    [
      o.derivaDe !== undefined && o.derivaDe.length > 0 ? `Deriva de: ${o.derivaDe.join(", ")}.` : "",
      o.sustento !== undefined ? `Sustento: grado ${o.sustento}${o.relacion !== undefined ? ` (relación ${o.relacion})` : ""}.` : "",
      o.cautelas !== undefined ? `Salvedades: ${o.cautelas.replace(/[.\s]+$/, "")}.` : "",
    ]
      .filter((x) => x !== "")
      .join(" "),
    evidenceLine(o.evidencia),
  ].filter((x) => x !== "");
}
