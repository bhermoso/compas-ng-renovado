/**
 * Paquete para la revisión del Perfil (CONTRACT-TERRITORIAL-STATISTICS §7).
 *
 * Convierte una descarga en resultados con la forma de `compas-profile-package/v1`,
 * una tabla de procedencia, una tabla por sección censal y la cobertura frente al
 * Perfil vigente. No modifica el Perfil: el equipo redactor decide qué incorpora.
 */
import type { ExternalHealthProfile, ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";
import type { TerritorialObservation, TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";
import { TERRITORIAL_INDICATORS, type IndicatorDomain, type IndicatorFicha } from "./catalog";

export const DOMAIN_LABEL: Record<IndicatorDomain, string> = {
  "determinantes-sociales": "Determinantes sociales",
  desigualdad: "Desigualdad",
  poblacion: "Población",
};

const COMPARATOR_ORDER = ["provincia", "andalucia", "espana"] as const;
const COMPARATOR_LABEL = (o: TerritorialObservation) =>
  o.level === "provincia" ? `Provincia de ${o.territoryName}` : o.level === "andalucia" ? "Andalucía" : "España";

function sourceLine(snapshot: TerritorialStatisticsSnapshot, sourceId: string): { text: string; locator: string } {
  const s = snapshot.sources.find(x => x.id === sourceId);
  if (!s) return { text: "Fuente no registrada", locator: "" };
  const kind = s.provider === "INE" ? "tabla" : s.id.startsWith("ieca-grid") ? "capa" : "consulta";
  return { text: `${s.provider} · ${s.product} · ${s.title}`, locator: `${kind} ${s.table} · consultado ${snapshot.retrievedAt.slice(0, 10)}` };
}

export function municipalObservation(snapshot: TerritorialStatisticsSnapshot, indicatorId: string): TerritorialObservation | undefined {
  return snapshot.observations.find(o => o.indicatorId === indicatorId && o.level === "municipio");
}

/** Resultados municipales con sus comparadores publicados, listos para el paquete. */
export function revisionResults(snapshot: TerritorialStatisticsSnapshot, catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): ProfileResult[] {
  const out: ProfileResult[] = [];
  for (const ficha of catalog) {
    const local = municipalObservation(snapshot, ficha.id);
    if (!local) continue;
    const comparisons = COMPARATOR_ORDER.flatMap(level => {
      const c = snapshot.observations.find(o => o.indicatorId === ficha.id && o.level === level);
      return c && c.value !== null ? [{ label: COMPARATOR_LABEL(c), value: c.value }] : [];
    });
    const { text, locator } = sourceLine(snapshot, local.sourceId);
    const cautions = [...ficha.cautions];
    if (local.derived) cautions.push(`${local.derived.method} Valores publicados: ${local.derived.inputs.map(i => `${i.label} ${i.value}`).join("; ")}.`);
    if (local.secret) cautions.push("Dato protegido por secreto estadístico en la fuente.");
    out.push({
      id: `ts-${ficha.id}`,
      title: ficha.title,
      value: ficha.unit === "%" ? local.literal.replace(/\s*%$/, "") : local.literal,
      unit: ficha.unit,
      source: text,
      page: locator,
      period: local.period,
      caution: cautions.join(" "),
      topic: DOMAIN_LABEL[ficha.domain],
      scale: "Municipal",
      temporalContext: "current",
      ...(local.value !== null ? { chartValue: local.value } : {}),
      ...(comparisons.length ? { comparisons } : {}),
    });
  }
  return out;
}

// ── Cobertura frente al Perfil vigente ───────────────────────────────────────

export type CoverageStatus = "ausente" | "actualizable" | "al-dia" | "revisar-valor" | "otro-periodo" | "otra-medida" | "sin-dato";

export interface CoverageRow {
  indicatorId: string;
  title: string;
  domain: IndicatorDomain;
  status: CoverageStatus;
  /** Valor descargado en la misma escala que el resultado del Perfil (municipio o sección). */
  downloaded?: { literal: string; period: string; territory: string };
  inProfile?: { title: string; value: string; unit: string; period: string; scale?: string };
}

function parseEs(value: string): { n: number; decimals: number } | null {
  const m = value.replace(/\s/g, "").match(/-?[\d.]*\d(,\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? { n, decimals: m[1] ? m[1].length - 1 : 0 } : null;
}
const yearOf = (s: string) => Number((s.match(/(19|20)\d{2}(?!.*(19|20)\d{2})/) ?? [""])[0]) || 0;
const decimalsOf = (literal: string) => { const m = literal.match(/,(\d+)/); return m ? m[1].length : 0; };

/**
 * Compara cada indicador del catálogo con el resultado del Perfil vigente que lo
 * recoge, en la misma escala: si el Perfil da el dato de una sección censal, se
 * compara con esa sección. Dos valores que coinciden al redondearlos a la menor
 * precisión de ambos se consideran iguales.
 */
export function profileCoverage(snapshot: TerritorialStatisticsSnapshot, profile?: Pick<ExternalHealthProfile, "results">, catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): CoverageRow[] {
  return catalog.map(ficha => {
    const re = new RegExp(ficha.profileMatch, "i");
    const found = profile?.results.find(r => re.test(r.title));
    const section = found?.scale?.match(/\b(\d{10})\b/)?.[1];
    const all = snapshot.observations.filter(o => o.indicatorId === ficha.id);
    const local = section ? all.find(o => o.territoryCode === section) : all.find(o => o.level === "municipio") ?? all.find(o => o.level === "seccion");
    const row: CoverageRow = { indicatorId: ficha.id, title: ficha.title, domain: ficha.domain, status: "sin-dato" };
    if (local) row.downloaded = { literal: local.level === "municipio" || section ? local.literal : "Por sección censal", period: local.period, territory: local.level === "seccion" ? `sección ${local.territoryCode}` : local.territoryName };
    if (found) row.inProfile = { title: found.title, value: found.value, unit: found.unit, period: found.period, scale: found.scale };
    if (!local) return row;
    if (!found) { row.status = "ausente"; return row; }
    const py = yearOf(found.period), dy = yearOf(local.period);
    if (py && dy > py) { row.status = "actualizable"; return row; }
    if (py && py > dy) { row.status = "otro-periodo"; return row; }
    if ((ficha.unit === "%") !== /%/.test(`${found.unit} ${found.value}`)) { row.status = "otra-medida"; return row; }
    const p = parseEs(found.value);
    if (local.value === null || !p) { row.status = "al-dia"; return row; }
    const d = Math.min(p.decimals, decimalsOf(local.literal));
    const round = (x: number) => Math.round(x * 10 ** d) / 10 ** d;
    row.status = round(p.n) === round(local.value) ? "al-dia" : "revisar-valor";
    return row;
  });
}

// ── Tablas exportables ──────────────────────────────────────────────────────

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map(r => r.map(csvCell).join(";")).join("\r\n") + "\r\n";

/** Todas las observaciones con su procedencia completa. */
export function provenanceCsv(snapshot: TerritorialStatisticsSnapshot): string {
  const head = ["indicador", "denominación en la fuente", "ámbito", "código", "territorio", "periodo", "valor publicado", "unidad", "secreto", "derivado", "proveedor", "tabla o consulta", "título", "serie", "dirección", "consultado"];
  const rows = snapshot.observations.map(o => {
    const s = snapshot.sources.find(x => x.id === o.sourceId);
    return [o.indicatorId, o.label, o.level, o.territoryCode, o.territoryName, o.period, o.literal, o.unit, o.secret ? "sí" : "", o.derived ? o.derived.method : "", s?.provider, s?.table, s?.title, o.seriesCode, s?.url, snapshot.retrievedAt];
  });
  return csv([head, ...rows]);
}

/** Valores por sección censal: una fila por sección, una columna por indicador. */
export function sectionTable(snapshot: TerritorialStatisticsSnapshot, catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS) {
  const sections = [...new Set(snapshot.observations.filter(o => o.level === "seccion").map(o => o.territoryCode))].sort();
  const fichas = catalog.filter(f => snapshot.observations.some(o => o.indicatorId === f.id && o.level === "seccion"));
  const rows = sections.map(code => ({
    code,
    values: fichas.map(f => {
      const o = snapshot.observations.find(x => x.indicatorId === f.id && x.territoryCode === code);
      return o ? { literal: o.literal, period: o.period } : undefined;
    }),
  }));
  return { fichas, rows };
}

export function sectionCsv(snapshot: TerritorialStatisticsSnapshot): string {
  const { fichas, rows } = sectionTable(snapshot);
  const head = ["sección censal", ...fichas.map(f => `${f.title} (${f.unit})`)];
  const periods = ["periodo", ...fichas.map(f => snapshot.observations.find(o => o.indicatorId === f.id && o.level === "seccion")?.period ?? "")];
  return csv([head, periods, ...rows.map(r => [r.code, ...r.values.map(v => v?.literal ?? "")])]);
}

/** Paquete JSON para la próxima revisión, con resultados, procedencia y cobertura. */
export function revisionPackage(snapshot: TerritorialStatisticsSnapshot, profile?: Pick<ExternalHealthProfile, "id" | "title" | "results">) {
  return {
    schema: "compas-territorial-revision-package/v1" as const,
    municipalityId: snapshot.municipalityId,
    municipalityName: snapshot.municipalityName,
    ineCode: snapshot.ineCode,
    snapshotId: snapshot.id,
    retrievedAt: snapshot.retrievedAt,
    catalogVersion: snapshot.catalogVersion,
    againstProfile: profile ? { id: profile.id, title: profile.title } : undefined,
    note: "Material para la próxima revisión del Perfil. No modifica la revisión vigente ni constituye validación.",
    results: revisionResults(snapshot),
    coverage: profileCoverage(snapshot, profile),
    sources: snapshot.sources,
    failures: snapshot.failures,
  };
}
