/**
 * Estadística territorial descargada de fuentes oficiales (CONTRACT-TERRITORIAL-STATISTICS).
 *
 * Una descarga es una instantánea inmutable: conserva el valor tal como lo publica
 * la fuente, su procedencia completa y la fecha de consulta. No es evidencia del
 * Perfil vigente ni lo modifica; alimenta el paquete para la próxima revisión.
 * Todo el registro es JSON seguro para viajar en el expediente compartido.
 */

export type TerritorialLevel =
  | "municipio"
  | "distrito-censal"
  | "seccion"
  | "provincia"
  | "andalucia"
  | "espana"
  | "celda-250m";

export type TerritorialProvider = "INE" | "IECA";

/** Procedencia de una tabla o consulta concreta. */
export interface TerritorialSource {
  id: string;
  provider: TerritorialProvider;
  /** Operación estadística o producto (p. ej. «Atlas de Distribución de Renta de los Hogares»). */
  product: string;
  /** Identificador de tabla INE, consulta BADEA o capa WFS. */
  table: string;
  title: string;
  /** Dirección de la petición que devolvió los datos. */
  url: string;
  /** Notas originales de la fuente, si las publica. */
  notes?: string;
}

export interface TerritorialObservation {
  indicatorId: string;
  /** Denominación literal de la serie o medida en la fuente. */
  label: string;
  territoryCode: string;
  territoryName: string;
  level: TerritorialLevel;
  period: string;
  /** Valor numérico publicado; null si la fuente no lo publica o lo protege. */
  value: number | null;
  /** Representación publicada por la fuente, o el valor en formato es-ES. */
  literal: string;
  unit: string;
  sourceId: string;
  /** Código de serie de la fuente (INE), si existe. */
  seriesCode?: string;
  /** Dato protegido por secreto estadístico según la fuente. */
  secret?: boolean;
  /**
   * Valor calculado por COMPÁS a partir de valores publicados. Se declara siempre;
   * nunca se presenta como dato de la fuente.
   */
  derived?: { method: string; inputs: Array<{ label: string; value: number }> };
}

export interface TerritorialGridLayer {
  year: string;
  sourceId: string;
  cellCount: number;
  /** FeatureCollection GeoJSON serializada (EPSG:4326), tal como la devuelve el servicio. */
  geojson: string;
  /** Sumas declaradas de las celdas sin secreto, con el número de celdas protegidas. */
  totals: Array<{ field: string; label: string; sum: number; secretCells: number }>;
}

export interface TerritorialRetrievalFailure {
  scope: string;
  message: string;
}

export interface TerritorialStatisticsSnapshot {
  schema: "compas-territorial-statistics/v1";
  id: string;
  municipalityId: string;
  municipalityName: string;
  ineCode: string;
  retrievedAt: string;
  retrievedBy?: string;
  catalogVersion: string;
  sources: TerritorialSource[];
  observations: TerritorialObservation[];
  grid?: TerritorialGridLayer;
  failures: TerritorialRetrievalFailure[];
}
