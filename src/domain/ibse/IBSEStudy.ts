import type { MunicipalityId } from "../municipality";
import type { IBSEAggregates } from "./IBSEAggregates";
import type { IBSEAdjustment } from "./IBSEAdjustment";

/**
 * Discriminador del universo etario de la MUESTRA municipal importada.
 *
 * El instrumento IBSE fue diseñado para población escolar, pero las muestras
 * municipales reales no siempre lo son: un mismo monitor puede recoger menores
 * de 16 y personas de 16 o más. El discriminador hace explícito qué contiene la
 * muestra, para no atribuir a "población escolar" lo que es una muestra mixta.
 *
 *   - "under-16": muestra exclusivamente de menores de 16 años.
 *   - "16-plus":  muestra exclusivamente de personas de 16 o más años. Comparte
 *                 el universo poblacional de referencia con la EAS (adultos ≥16),
 *                 NO sus datos ni su muestra.
 *   - "mixed":    muestra con ambos grupos (menores de 16 y 16 o más).
 *   - "unknown":  sin información de estrato (dato legacy o export sin edad).
 */
export type IBSESampleScope = "under-16" | "16-plus" | "mixed" | "unknown";

/**
 * Recuentos por estrato etario, SOLO cuando el export los aporta realmente.
 * Nunca se derivan ni se inventan: su ausencia significa "no disponible" y
 * bloquea cualquier dictamen SAM por estrato.
 */
export interface IBSEStratumCount {
  n: number;
  nValid: number;
}

export interface IBSEStrataCounts {
  under16?: IBSEStratumCount;
  plus16?: IBSEStratumCount;
}

/**
 * Distribución observada edad×sexo, solo cuando el export aporta las columnas
 * `sexo` y `edad`. Nunca se deriva ni se imputa: su ausencia significa "no disponible".
 */
export interface IBSEAgeSexObserved {
  cells: Array<{ ageBand: string; male: number; female: number }>;
  assignedCount: number;
  unassignableCount: number;
}

export interface IBSEStudy {
  demographicAdjustment?: IBSEAdjustment;
  id: string;
  municipalityId: MunicipalityId;
  sourceFileName: string;
  aggregates: IBSEAggregates;
  /** Universo etario de la muestra. Los datos legacy se cargan como "unknown". */
  sampleScope: IBSESampleScope;
  /** Recuentos por estrato, solo si el export los aporta. */
  strataCounts?: IBSEStrataCounts;
  /** Distribución observada edad×sexo, si el export la aporta. */
  ageSexObserved?: IBSEAgeSexObserved;
  methodologicalCautions: string[];
  exportedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIBSEStudyInput {
  demographicAdjustment?: IBSEAdjustment;
  municipalityId: MunicipalityId;
  sourceFileName: string;
  aggregates: IBSEAggregates;
  /** Universo etario de la muestra. Por defecto "unknown" (compatibilidad legacy). */
  sampleScope?: IBSESampleScope;
  strataCounts?: IBSEStrataCounts;
  ageSexObserved?: IBSEAgeSexObserved;
  methodologicalCautions: string[];
  exportedAt?: string;
}

export function createIBSEStudy(input: CreateIBSEStudyInput): IBSEStudy {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    municipalityId: input.municipalityId,
    sourceFileName: input.sourceFileName,
    aggregates: input.aggregates,
    demographicAdjustment: input.demographicAdjustment,
    // Sin discriminador explícito, el estudio NO afirma ser escolar: "unknown".
    sampleScope: input.sampleScope ?? "unknown",
    strataCounts: input.strataCounts,
    ageSexObserved: input.ageSexObserved,
    methodologicalCautions: input.methodologicalCautions,
    exportedAt: input.exportedAt,
    createdAt: now,
    updatedAt: now,
  };
}
