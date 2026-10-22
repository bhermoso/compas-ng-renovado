/**
 * Propuestas de conclusión derivadas de «Lectura por tema».
 *
 * Cada unidad de lectura (y cada laguna declarada) genera una propuesta de
 * conclusión con el texto que la propia lectura ya expresa. El identificador
 * incluye el patrón de cruce: si la evidencia cambia, la propuesta es otra y la
 * decisión anterior queda huérfana en lugar de aplicarse a un texto distinto.
 * Este módulo no genera orientaciones: requieren una relación con sustento
 * declarado (CONTRACT-LHPM v1.5, Art. 8 bis) que aún no existe como tabla.
 */

import type { CanonicalReadingUnits } from "../localiza-assets";
import { stableProposalId, type Proposal } from "./proposals";

export function buildReadingUnitProposals(
  lectura: CanonicalReadingUnits | undefined
): Proposal[] {
  if (lectura === undefined) return [];
  const proposals: Proposal[] = lectura.units.map((u) => ({
    id: stableProposalId("conclusion", "lectura-por-tema", u.topicId, u.crossing),
    kind: "conclusion" as const,
    tipo: "hecho" as const,
    text: `${u.label}. ${u.crossingStatement}`,
    derivedFrom: { evidence: [`lectura-por-tema:${u.topicId}`] },
  }));
  for (const gap of lectura.gaps) {
    proposals.push({
      id: stableProposalId("conclusion", "laguna", gap),
      kind: "conclusion",
      tipo: "laguna",
      text: gap,
      derivedFrom: { evidence: ["lectura-por-tema:lagunas"] },
    });
  }
  return proposals;
}
