/**
 * Propuestas redactadas por el equipo técnico (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis).
 * Se convierten en el mismo tipo `Proposal` que las del sistema y pasan por el
 * mismo menú: ninguna nace elegida y la elección la registra una persona.
 */

import type { AuthoredProposal } from "../../domain/repository";
import { checkOrientationText, stableProposalId, type Proposal } from "./proposals";

export function authoredProposalId(a: Pick<AuthoredProposal, "kind" | "id">): string {
  return stableProposalId(a.kind, "equipo", a.id);
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
