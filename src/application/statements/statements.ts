/**
 * La afirmación como unidad del Perfil (CONTRACT-LHPM v1.7, Art. 8 ter, I-LHPM-17).
 * Este módulo no genera afirmaciones: las describe y comprueba. Las propuestas del
 * menú son su primer caso.
 */

import {
  HUMAN_AUTHORSHIP_TYPES,
  STEP_ALLOWED_TYPES,
  type ReadingStep,
  type RecommendationKind,
  type StatementType,
} from "../../domain/statements/statementTypes";
import { checkOrientationText, type Proposal } from "../proposals";

export interface Statement {
  id: string;
  tipo: StatementType;
  paso: ReadingStep;
  texto: string;
  /** Evidencia con localización. */
  evidencia: string[];
  origen: "compilada" | "equipo";
  /** Afirmaciones de las que deriva (ids). */
  derivaDe: string[];
  sustento?: 1 | 2 | 3;
  /** Tipo de recomendación del Perfil (Art. 8 quater), solo si `tipo` es «orientacion». */
  recomendacion?: RecommendationKind;
  /** Requiere elección del equipo técnico (conclusiones y orientaciones, Art. 16 ter). */
  requiereEleccion: boolean;
}

/** Problemas que impiden admitir la afirmación; vacío = admisible. */
export function validateStatement(s: Statement): string[] {
  const problems: string[] = [];
  if (!STEP_ALLOWED_TYPES[s.paso].includes(s.tipo)) {
    problems.push(`El tipo «${s.tipo}» no se admite en el paso «${s.paso}» (Art. 8 ter).`);
  }
  const conEvidencia = s.evidencia.filter((e) => e.trim() !== "").length > 0;
  const remite = (s.tipo === "cautela" || s.tipo === "laguna") && s.derivaDe.length > 0;
  if (!conEvidencia && !remite) {
    problems.push("Falta evidencia con localización (I-LHPM-17).");
  }
  if (HUMAN_AUTHORSHIP_TYPES.includes(s.tipo) && s.origen !== "equipo") {
    problems.push(`El tipo «${s.tipo}» exige autoría humana y no puede ser compilado (Art. 8).`);
  }
  if (s.tipo === "orientacion") {
    // Conocer y Contrastar no exigen relación; Abordar y las anteriores a v2.0 sí (Art. 8 quater).
    const exigeGrado = s.recomendacion === undefined || s.recomendacion === "abordar";
    if (exigeGrado && (s.sustento === undefined || s.sustento === 3)) {
      problems.push("Una recomendación de tipo «Abordar» solo se apoya en relaciones de grado 1 o 2 (Art. 8 bis, 8 quater).");
    }
    if (s.derivaDe.length === 0) problems.push("Una recomendación deriva de al menos una conclusión.");
    for (const id of checkOrientationText(s.texto)) {
      problems.push(`La recomendación excede al Perfil (${id}); corresponde al Grupo Motor o al Plan de Acción.`);
    }
  }
  return problems;
}

/** Afirmación que corresponde a una propuesta del menú. Sin tipo declarado no hay afirmación admisible. */
export function statementFromProposal(p: Proposal): Statement | { id: string; problems: string[] } {
  if (p.tipo === undefined) {
    return { id: p.id, problems: ["La propuesta no declara su tipo de afirmación (Art. 8)."] };
  }
  return {
    id: p.id,
    tipo: p.tipo,
    paso: p.kind === "orientation" ? "orientar" : "concluir",
    texto: p.text,
    evidencia: p.derivedFrom.evidence,
    origen: p.origin === "equipo" ? "equipo" : "compilada",
    derivaDe: p.derivedFrom.conclusionIds ?? [],
    ...(p.derivedFrom.sustento !== undefined ? { sustento: p.derivedFrom.sustento } : {}),
    ...(p.recomendacion !== undefined ? { recomendacion: p.recomendacion } : {}),
    requiereEleccion: true,
  };
}

export interface StatementAudit {
  id: string;
  problems: string[];
}

/** Revisa todas las propuestas como afirmaciones; devuelve solo las que tienen problemas. */
export function auditProposalStatements(proposals: ReadonlyArray<Proposal>): StatementAudit[] {
  const out: StatementAudit[] = [];
  for (const p of proposals) {
    const s = statementFromProposal(p);
    const problems = "problems" in s ? s.problems : validateStatement(s);
    if (problems.length > 0) out.push({ id: p.id, problems });
  }
  return out;
}
