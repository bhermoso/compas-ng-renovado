/**
 * Conservación de descargas en el expediente. Las instantáneas son acumulativas e
 * inmutables; solo se retira una por decisión expresa del usuario.
 */
import type { TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";

export const MAX_TERRITORIAL_SNAPSHOTS = 6;

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

/** Añade una descarga; conserva como máximo las seis más recientes. */
export function appendSnapshot(list: TerritorialStatisticsSnapshot[] | undefined, snapshot: TerritorialStatisticsSnapshot): TerritorialStatisticsSnapshot[] {
  const prev = (list ?? []).filter(s => s.id !== snapshot.id);
  return [...prev, snapshot].sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt)).slice(-MAX_TERRITORIAL_SNAPSHOTS);
}

export function latestSnapshot(list: TerritorialStatisticsSnapshot[] | undefined): TerritorialStatisticsSnapshot | undefined {
  return [...(list ?? [])].sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt)).at(-1);
}
