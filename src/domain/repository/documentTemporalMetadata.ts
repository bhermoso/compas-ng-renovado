/**
 * Temporalidad documental declarada: no inferir vigencia ni ciclo por antigüedad.
 * Modelo aditivo para el distribuidor universal; sin migraciones automáticas.
 */
export type TemporalPrecision = "day" | "month" | "year" | "unknown";
export type DocumentValidity = "valid" | "superseded" | "repealed" | "expired" | "unknown" | "not-applicable";
export type TemporalScope = "current" | "historical" | "mixed" | "undetermined";

export interface TemporalDate {
  /** ISO 8601 a la precisión expresada; ejemplos: 2026, 2026-05, 2026-05-12. */
  value?: string;
  precision: TemporalPrecision;
}

export interface ObservedPeriod {
  from?: TemporalDate;
  to?: TemporalDate;
  /** Cuando no es posible normalizar un período, conservar su expresión original. */
  literal?: string;
}

export interface TemporalSuggestion {
  field: string;
  value: string;
  source: "filename" | "metadata" | "extracted-text" | "human";
  location?: string;
  confidence?: number;
}

export interface TemporalDeclaration {
  /** UID o identidad del agente técnico que confirma el dato. */
  declaredBy: string;
  declaredAt: string;
  reason?: string;
  referenceDate: string;
}

export interface DocumentTemporalMetadata {
  documentDate?: TemporalDate;
  observedPeriod?: ObservedPeriod;
  sourceCollectedAt?: TemporalDate;
  ingestedAt?: string;
  validity?: DocumentValidity;
  diagnosticCycleId?: string;
  temporalScope?: TemporalScope;
  suggestions?: TemporalSuggestion[];
  declaration?: TemporalDeclaration;
  supersedes?: string[];
}

/** No etiqueta automáticamente un documento: sin declaración sigue indeterminado. */
export function declaredTemporalScope(
  metadata: DocumentTemporalMetadata | undefined
): TemporalScope {
  return metadata?.declaration ? (metadata.temporalScope ?? "undetermined") : "undetermined";
}

export function requiresTemporalReview(metadata: DocumentTemporalMetadata | undefined): boolean {
  return !metadata?.declaration || declaredTemporalScope(metadata) === "undetermined";
}
