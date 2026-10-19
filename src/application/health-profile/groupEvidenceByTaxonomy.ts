import type { EvidenceAtom } from "../../domain/evidence/EvidenceAtom";
import {
  EVIDENCE_GROUPING_DIMENSIONS,
  type EvidenceGroupingDimension,
} from "../../domain/evidence-grouping/EvidenceGroupingTaxonomy";

export interface EvidenceGroup {
  readonly dimension: EvidenceGroupingDimension;
  readonly atoms: readonly EvidenceAtom[];
}

export interface EvidenceGrouping {
  /** Una entrada por dimensión, en el orden fijo de la taxonomía. No expresa relevancia. */
  readonly groups: readonly EvidenceGroup[];
  /** Átomos cuyo tipo no corresponde a ninguna dimensión (p. ej. activos). Se declaran, no se fuerzan. */
  readonly unassigned: readonly EvidenceAtom[];
}

/**
 * Clasifica átomos por dimensión según su tipo. Función pura: no ordena por
 * relevancia, no puntúa, no aplica umbrales y no modifica los átomos.
 */
export function groupEvidenceByTaxonomy(atoms: readonly EvidenceAtom[]): EvidenceGrouping {
  const groups = EVIDENCE_GROUPING_DIMENSIONS.map((dimension) => ({
    dimension,
    atoms: atoms.filter((a) => dimension.atomKinds.includes(a.kind)),
  }));
  const assigned = new Set(EVIDENCE_GROUPING_DIMENSIONS.flatMap((d) => d.atomKinds));
  return { groups, unassigned: atoms.filter((a) => !assigned.has(a.kind)) };
}
