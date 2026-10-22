/**
 * Tabla de relaciones determinante-problema (CONTRACT-LHPM v1.7, Arts. 8 bis y 8 ter 2).
 * Este módulo no inventa relaciones: lee las que declara el equipo técnico, comprueba
 * que su grado esté sustentado y dice qué grado puede citar una orientación.
 */

import type { RelationDeclaration } from "../../domain/repository";

/** Última versión de cada relación. */
export function currentRelations(history: ReadonlyArray<RelationDeclaration> = []): RelationDeclaration[] {
  const latest = new Map<string, RelationDeclaration>();
  for (const r of history) {
    const prev = latest.get(r.id);
    if (prev === undefined || r.version > prev.version) latest.set(r.id, r);
  }
  return [...latest.values()].sort((a, b) => a.id.localeCompare(b.id, "es", { numeric: true }));
}

/** Problemas que impiden registrar la declaración; vacío = admisible. */
export function validateRelationDeclaration(
  d: Omit<RelationDeclaration, "version" | "declaredAt">
): string[] {
  const problems: string[] = [];
  const has = (xs: string[]) => xs.filter((x) => x.trim() !== "").length > 0;
  if (d.id.trim() === "") problems.push("Falta el identificador de la relación.");
  if (d.declaredBy.trim() === "") problems.push("Falta la autoría.");
  if (d.determinant.label.trim() === "") problems.push("Falta el determinante.");
  if (d.problem.label.trim() === "") problems.push("Falta el problema de salud.");
  if (d.basis.trim() === "") problems.push("Falta la razón del grado.");
  if (d.grade === 1 && !(has(d.determinant.evidence) && has(d.problem.evidence))) {
    problems.push("El grado 1 exige evidencia local de ambos extremos (Art. 8 bis).");
  }
  if (d.grade === 2) {
    const s = d.source;
    if (s === undefined || s.title.trim() === "" || s.year.trim() === "" || s.scale.trim() === "") {
      problems.push("El grado 2 exige una fuente externa verificable, con título, año y escala (Art. 8 bis).");
    }
  }
  return problems;
}

/**
 * Grado que puede citar una orientación que se apoya en la relación `relationId`,
 * o los problemas que lo impiden: la relación debe existir, estar validada y ser
 * de grado 1 o 2.
 */
export function sustentoFromRelation(
  history: ReadonlyArray<RelationDeclaration> | undefined,
  relationId: string
): { ok: true; grade: 1 | 2 } | { ok: false; problems: string[] } {
  const r = currentRelations(history).find((x) => x.id === relationId);
  if (r === undefined) return { ok: false, problems: [`La relación «${relationId}» no consta en la tabla.`] };
  const problems: string[] = [];
  if (r.status !== "validada") problems.push(`La relación «${relationId}» no está validada por una persona del equipo técnico.`);
  if (r.grade === 3) problems.push(`La relación «${relationId}» es de grado 3 y no sostiene una orientación (Art. 8 bis).`);
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, grade: r.grade as 1 | 2 };
}
