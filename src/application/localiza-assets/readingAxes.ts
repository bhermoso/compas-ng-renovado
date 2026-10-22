/**
 * Ejes de lectura declarados (CONTRACT-LHPM v1.7, Art. 4 ter). Un eje es una
 * agrupación de evidencia que declara una persona, no un hallazgo ni una
 * prioridad. Este módulo lee las declaraciones y comprueba que remitan a
 * dimensiones del Informe y a temáticas de Localiza que existen.
 */

import type { ReadingAxisDeclaration } from "../../domain/repository";
import { TAXONOMIA_SANITARIA } from "../health-profile/healthReportSanitaryReading";
import { TOPIC_CORRESPONDENCE } from "./topicCorrespondence";

export const AXIS_TOPIC_PREFIX = "eje:";

export function axisTopicId(axisId: string): string {
  return `${AXIS_TOPIC_PREFIX}${axisId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/** Última versión de cada eje. */
export function currentAxes(history: ReadonlyArray<ReadingAxisDeclaration> = []): ReadingAxisDeclaration[] {
  const latest = new Map<string, ReadingAxisDeclaration>();
  for (const a of history) {
    const prev = latest.get(a.id);
    if (prev === undefined || a.version > prev.version) latest.set(a.id, a);
  }
  return [...latest.values()].sort((a, b) => a.id.localeCompare(b.id, "es"));
}

export const KNOWN_INFORME_DIMENSIONS: readonly string[] = TAXONOMIA_SANITARIA.map((g) => g.dimension);
export const KNOWN_LOCALIZA_TEMATICAS: readonly string[] = TOPIC_CORRESPONDENCE.map((e) => e.localizaTematica);

/** Problemas que impiden registrar la declaración; vacío = admisible. */
export function validateAxisDeclaration(
  a: Omit<ReadingAxisDeclaration, "version" | "declaredAt">
): string[] {
  const problems: string[] = [];
  if (a.id.trim() === "") problems.push("Falta el identificador del eje.");
  if (a.label.trim() === "") problems.push("Falta el nombre del eje.");
  if (a.definition.trim() === "") problems.push("Falta la definición del eje.");
  if (a.declaredBy.trim() === "") problems.push("Falta la autoría.");
  if (a.informeDimensions.length === 0) {
    problems.push("El eje agrupa al menos una dimensión del Informe (Art. 4 ter).");
  }
  for (const d of a.informeDimensions) {
    if (!KNOWN_INFORME_DIMENSIONS.includes(d)) problems.push(`«${d}» no es una dimensión del Informe que la lectura detecte.`);
  }
  for (const t of a.localizaTematicas) {
    if (!KNOWN_LOCALIZA_TEMATICAS.includes(t)) problems.push(`«${t}» no es una temática de Localiza conocida.`);
  }
  return problems;
}
