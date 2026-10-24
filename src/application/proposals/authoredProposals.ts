/**
 * Propuestas redactadas por el equipo técnico (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis).
 * Se convierten en el mismo tipo `Proposal` que las del sistema y pasan por el
 * mismo menú: ninguna nace elegida y la elección la registra una persona.
 */

import type { AuthoredProposal } from "../../domain/repository";
import { STEP_ALLOWED_TYPES } from "../../domain/statements/statementTypes";
import { sustentoFromRelation } from "../relations";
import type { RelationDeclaration } from "../../domain/repository";
import { checkOrientationText, stableProposalId, type Proposal } from "./proposals";

export function authoredProposalId(a: Pick<AuthoredProposal, "kind" | "id">): string {
  return stableProposalId(a.kind, "equipo", a.id);
}

/** Tipo de afirmación al registrar: la orientación técnica es siempre «orientacion»; en la conclusión lo elige quien redacta. */
export function tipoForAuthored(
  kind: AuthoredProposal["kind"],
  selected: AuthoredProposal["tipo"] | ""
): AuthoredProposal["tipo"] {
  if (kind === "orientation") return "orientacion";
  return selected === "" ? undefined : selected;
}

/** Problemas que impiden registrar la propuesta; vacío = admisible. */
export function validateAuthoredProposal(
  a: Omit<AuthoredProposal, "authoredAt">,
  existing: ReadonlyArray<AuthoredProposal> = [],
  relations?: ReadonlyArray<RelationDeclaration>
): string[] {
  const problems: string[] = [];
  if (a.id.trim() === "") problems.push("Falta el identificador de la propuesta.");
  if (a.text.trim() === "") problems.push("Falta el texto de la propuesta.");
  if (a.authoredBy.trim() === "") problems.push("Falta la autoría.");
  if (a.evidence.filter((e) => e.trim() !== "").length === 0) {
    problems.push("Toda propuesta cita al menos una evidencia (documento y localización).");
  }
  if (a.tipo === undefined) {
    problems.push("Falta el tipo de afirmación (Art. 8).");
  } else if (!STEP_ALLOWED_TYPES[a.kind === "orientation" ? "orientar" : "concluir"].includes(a.tipo)) {
    problems.push(`El tipo «${a.tipo}» no se admite en ${a.kind === "orientation" ? "una orientación" : "una conclusión"}.`);
  } else if (a.kind === "orientation" && a.tipo !== "orientacion") {
    problems.push("Una recomendación del Perfil es del tipo «orientacion».");
  }
  if (a.kind === "orientation") {
    const concl = a.conclusionIds ?? [];
    if (concl.length === 0) {
      problems.push("Una recomendación deriva de al menos una conclusión.");
    }
    if (a.recomendacion === undefined) {
      problems.push("Falta el tipo de recomendación: Conocer, Contrastar o Abordar (Art. 8 quater).");
    }
    for (const c of concl) {
      if (!existing.some((e) => e.kind === "conclusion" && e.id === c)) {
        problems.push(`La conclusión «${c}» no está registrada.`);
      }
    }
    const derivadas = concl
      .map((c) => existing.find((e) => e.kind === "conclusion" && e.id === c))
      .filter((e): e is AuthoredProposal => e !== undefined);
    if (
      a.recomendacion === "abordar" &&
      derivadas.length > 0 &&
      derivadas.every((e) => e.tipo === "laguna")
    ) {
      problems.push("Sobre una laguna solo caben recomendaciones de tipo Conocer o Contrastar (Arts. 7 ter y 8 quater).");
    }
    if (a.relationId !== undefined) {
      const s = sustentoFromRelation(relations, a.relationId);
      if (!s.ok) problems.push(...s.problems);
      else if (a.sustento !== s.grade) {
        problems.push(`El sustento declarado no coincide con el grado de la relación «${a.relationId}» (${s.grade}).`);
      }
    } else if (a.recomendacion === "abordar" && a.sustento === undefined) {
      problems.push("Una recomendación de tipo Abordar declara el grado de sustento de su relación.");
    }
    if (a.recomendacion === "abordar" && a.sustento === 3) {
      problems.push("Una recomendación de tipo Abordar exige una relación de grado 1 o 2 (Art. 8 quater).");
    }
    for (const id of checkOrientationText(a.text)) {
      problems.push(`La recomendación excede al Perfil (${id}); corresponde al Grupo Motor o al Plan de Acción.`);
    }
  }
  return problems;
}

export function authoredToProposals(list: ReadonlyArray<AuthoredProposal>): Proposal[] {
  return list.map((a) => ({
    id: authoredProposalId(a),
    kind: a.kind,
    text: a.text,
    origin: "equipo" as const,
    label: a.id,
    ...(a.tipo !== undefined ? { tipo: a.tipo } : {}),
    ...(a.recomendacion !== undefined ? { recomendacion: a.recomendacion } : {}),
    ...(a.cautelas !== undefined && a.cautelas.trim() !== "" ? { cautelas: a.cautelas } : {}),
    derivedFrom: {
      evidence: a.evidence,
      ...(a.conclusionIds !== undefined
        ? { conclusionIds: a.conclusionIds.map((c) => authoredProposalId({ kind: "conclusion", id: c })) }
        : {}),
      ...(a.sustento !== undefined ? { sustento: a.sustento } : {}),
      ...(a.relationId !== undefined ? { relationId: a.relationId } : {}),
    },
  }));
}
