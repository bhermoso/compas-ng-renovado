/**
 * Propuestas redactadas por el equipo técnico (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis).
 * Se convierten en el mismo tipo `Proposal` que las del sistema y pasan por el
 * mismo menú: ninguna nace elegida y la elección la registra una persona.
 */

import type { AuthoredProposal } from "../../domain/repository";
import { STEP_ALLOWED_TYPES } from "../../domain/statements/statementTypes";
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
  existing: ReadonlyArray<AuthoredProposal> = []
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
    problems.push("Una orientación técnica es del tipo «orientacion».");
  }
  if (a.kind === "orientation") {
    const concl = a.conclusionIds ?? [];
    if (concl.length === 0) {
      problems.push("Una orientación deriva de al menos una conclusión.");
    }
    for (const c of concl) {
      if (!existing.some((e) => e.kind === "conclusion" && e.id === c)) {
        problems.push(`La conclusión «${c}» no está registrada.`);
      }
    }
    if (a.sustento === undefined) problems.push("Una orientación declara el grado de sustento de su relación.");
    for (const id of checkOrientationText(a.text)) {
      problems.push(`La orientación fija una actuación operativa (${id}); corresponde al Plan de Acción.`);
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
    ...(a.tipo !== undefined ? { tipo: a.tipo } : {}),
    ...(a.cautelas !== undefined && a.cautelas.trim() !== "" ? { cautelas: a.cautelas } : {}),
    derivedFrom: {
      evidence: a.evidence,
      ...(a.conclusionIds !== undefined
        ? { conclusionIds: a.conclusionIds.map((c) => authoredProposalId({ kind: "conclusion", id: c })) }
        : {}),
      ...(a.sustento !== undefined ? { sustento: a.sustento } : {}),
    },
  }));
}
