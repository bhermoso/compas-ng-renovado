/**
 * Conservación de descargas en el expediente. Cada instantánea es inmutable. Al
 * guardar una nueva sustituye a las anteriores (copia única, CONTRACT-TERRITORIAL-STATISTICS §9);
 * el usuario puede eliminar cualquiera desde el Archivo del expediente.
 */
import type { TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const str = (x: unknown): x is string => typeof x === "string";

export function isTerritorialStatisticsSnapshot(x: unknown, municipalityId: string): x is TerritorialStatisticsSnapshot {
  if (!isObj(x) || x.schema !== "compas-territorial-statistics/v1" || x.municipalityId !== municipalityId) return false;
  if (![x.id, x.municipalityName, x.ineCode, x.retrievedAt, x.catalogVersion].every(str) || !/^\d{5}$/.test(x.ineCode as string)) return false;
  if (!Number.isFinite(Date.parse(x.retrievedAt as string))) return false;
  if (!Array.isArray(x.sources) || !Array.isArray(x.observations) || !Array.isArray(x.failures)) return false;
  const ids = new Set((x.sources as unknown[]).map(s => (isObj(s) ? s.id : undefined)));
  return (x.observations as unknown[]).every(o => isObj(o) && str(o.indicatorId) && str(o.territoryCode) && str(o.literal) && str(o.period) &&
    (o.value === null || (typeof o.value === "number" && Number.isFinite(o.value))) && ids.has(o.sourceId));
}

export function latestSnapshot(list: TerritorialStatisticsSnapshot[] | undefined): TerritorialStatisticsSnapshot | undefined {
  return [...(list ?? [])].sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt)).at(-1);
}
