/**
 * Reglas de generación desde la tabla de relaciones (CONTRACT-LHPM v1.7.2, Art. 8 ter 3).
 *
 * Una relación genera una conclusión de tipo «hecho» (consta en la tabla, con su grado,
 * su autoría y su evidencia) solo si está validada por una persona, es de grado 1 o 2 y
 * conserva la evidencia que la sostiene. Una relación de grado 3 o sin validar no genera
 * nada y se devuelve en `skipped` con su motivo. La conclusión nace pendiente: la elige o
 * la descarta el equipo técnico (Art. 16 ter). El identificador incluye la versión de la
 * relación: si cambia, la propuesta es otra y la decisión anterior queda huérfana.
 *
 * Las interpretaciones, las hipótesis y las orientaciones exigen autoría humana (Art. 8):
 * ninguna regla las genera. Para la orientación solo se ofrece un borrador que la persona
 * adopta, edita o ignora en el formulario de redacción.
 */

import type { RelationDeclaration } from "../../domain/repository";
import { currentRelations, sustentoFromRelation, validateRelationDeclaration } from "../relations";
import { stableProposalId, type Proposal } from "./proposals";

export interface SkippedRelation {
  relationId: string;
  reasons: string[];
}

export function relationConclusionId(r: Pick<RelationDeclaration, "id" | "version">): string {
  return stableProposalId("conclusion", "relacion", r.id, `v${r.version}`);
}

export function buildRelationProposals(
  history: ReadonlyArray<RelationDeclaration> | undefined
): { proposals: Proposal[]; skipped: SkippedRelation[] } {
  const proposals: Proposal[] = [];
  const skipped: SkippedRelation[] = [];
  for (const r of currentRelations(history)) {
    const reasons: string[] = [];
    if (r.status !== "validada") reasons.push("No está validada por una persona del equipo técnico.");
    if (r.grade === 3) reasons.push("Es de grado 3: no genera conclusión (Art. 8 ter 3).");
    const { version: _v, declaredAt: _d, ...declaration } = r;
    reasons.push(...validateRelationDeclaration(declaration));
    if (reasons.length > 0) {
      skipped.push({ relationId: r.id, reasons });
      continue;
    }
    const grade = r.grade as 1 | 2;
    const basisLine =
      grade === 1
        ? `Con evidencia local en ambos extremos. ${r.basis}`
        : `Apoyada en una fuente externa, no local: ${r.source!.title} (${r.source!.year}, ${r.source!.scale}). ${r.basis}`;
    const evidence = [
      ...r.determinant.evidence,
      ...r.problem.evidence,
      ...(r.source !== undefined ? [`fuente-externa:${r.source.title} (${r.source.year}, ${r.source.scale})`] : []),
    ].filter((e) => e.trim() !== "");
    proposals.push({
      id: relationConclusionId(r),
      kind: "conclusion",
      tipo: "hecho",
      origin: "sistema",
      label: `${r.id} · relación declarada`,
      text: `La tabla de relaciones declara, por ${r.declaredBy} el ${r.declaredAt.slice(0, 10)}, una relación entre «${r.determinant.label}» y «${r.problem.label}» (grado ${grade}, relación ${r.id}, versión ${r.version}). ${basisLine}`,
      ...(r.missing !== undefined && r.missing.trim() !== "" ? { cautelas: r.missing } : {}),
      derivedFrom: { evidence, sustento: grade, relationId: r.id },
    });
  }
  return { proposals, skipped };
}

/**
 * Borrador de orientación para una relación validada de grado 1 o 2, o null si la relación
 * no puede sostenerla. Es un texto de partida para el formulario de redacción: no entra en
 * el menú ni en el Perfil hasta que una persona lo redacta como suyo (Art. 8).
 */
export function draftOrientationFromRelation(
  history: ReadonlyArray<RelationDeclaration> | undefined,
  relationId: string
): { text: string; evidence: string[] } | null {
  if (!sustentoFromRelation(history, relationId).ok) return null;
  const r = currentRelations(history).find((x) => x.id === relationId);
  if (r === undefined) return null;
  return {
    text: `El Plan de Acción puede abordar «${r.problem.label}» a través de «${r.determinant.label}». Las actuaciones y las prioridades quedan como decisión posterior.`,
    evidence: [...r.determinant.evidence, ...r.problem.evidence].filter((e) => e.trim() !== ""),
  };
}
