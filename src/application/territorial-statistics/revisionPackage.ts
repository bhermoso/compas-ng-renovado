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
 * Sección censal a la que se refiere un resultado del Perfil: código completo de
 * diez cifras, o distrito y sección («sección 01004»), en la escala o el título.
 */
export function sectionCodeOf(result: Pick<ProfileResult, "title" | "scale">, ineCode: string): string | undefined {
  const text = `${result.scale ?? ""} ${result.title}`;
  const full = text.match(/\b(\d{10})\b/)?.[1];
  if (full) return full;
  const short = text.match(/secci[oó]n(?: censal)?\s*(\d{5})\b/i)?.[1];
  return short ? `${ineCode}${short}` : undefined;
}

/** Resultados del Perfil que corresponden a un indicador: los municipales primero. */
function profileMatches(ficha: IndicatorFicha, results: ProfileResult[], ineCode: string) {
  const re = new RegExp(ficha.profileMatch, "i");
  return results.filter(r => re.test(r.title)).map(r => ({ result: r, section: sectionCodeOf(r, ineCode) }))
    .sort((x, y) => Number(!!x.section) - Number(!!y.section));
}

/** Estado de un valor descargado frente al resultado del Perfil en la misma escala. */
function compareWithProfile(ficha: IndicatorFicha, local: TerritorialObservation, found: ProfileResult): Exclude<CoverageStatus, "ausente" | "sin-dato"> {
  const py = yearOf(found.period), dy = yearOf(local.period);
  if (py && dy > py) return "actualizable";
  if (py && py > dy) return "otro-periodo";
  if ((ficha.unit === "%") !== /%/.test(`${found.unit} ${found.value}`)) return "otra-medida";
  const p = parseEs(found.value);
  if (local.value === null || !p) return "al-dia";
  const d = Math.min(p.decimals, decimalsOf(local.literal));
  const round = (x: number) => Math.round(x * 10 ** d) / 10 ** d;
  return round(p.n) === round(local.value) ? "al-dia" : "revisar-valor";
}

/**
 * Compara cada indicador del catálogo con el resultado del Perfil vigente que lo
 * recoge, en la misma escala: si el Perfil solo da el dato de una sección
 * censal, se compara con esa sección. Dos valores que coinciden al redondearlos
 * a la menor precisión de ambos se consideran iguales.
 */
export function profileCoverage(snapshot: TerritorialStatisticsSnapshot, profile?: Pick<ExternalHealthProfile, "results">, catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): CoverageRow[] {
  return catalog.map(ficha => {
    const match = profileMatches(ficha, profile?.results ?? [], snapshot.ineCode)[0];
    const found = match?.result;
    const section = match?.section;
    const all = snapshot.observations.filter(o => o.indicatorId === ficha.id);
    const local = section ? all.find(o => o.territoryCode === section) : all.find(o => o.level === "municipio") ?? all.find(o => o.level === "seccion");
    const row: CoverageRow = { indicatorId: ficha.id, title: ficha.title, domain: ficha.domain, status: "sin-dato" };
    if (local) row.downloaded = { literal: local.level === "municipio" || section ? local.literal : "Por sección censal", period: local.period, territory: local.level === "seccion" ? `sección ${local.territoryCode}` : local.territoryName };
    if (found) row.inProfile = { title: found.title, value: found.value, unit: found.unit, period: found.period, scale: found.scale };
    if (!local) return row;
    row.status = found ? compareWithProfile(ficha, local, found) : "ausente";
    return row;
  });
}

// ── Revisión del Perfil con los datos descargados ───────────────────────────

/** Página de datos a la que va cada dominio (Art. 17 ter): población a «Quién vive aquí». */
export const REVISION_TOPIC: Record<IndicatorDomain, string> = {
  poblacion: "Quién vive aquí",
  desigualdad: "Desigualdad",
  "determinantes-sociales": "Determinantes sociales",
};

/** Indicadores que se llevan al Perfil también por sección censal (página de desigualdad). */
export const SECTION_REVISION_INDICATORS = [
  "adrh-renta-neta-persona", "adrh-bajo-60-mediana", "adrh-gini", "censo-estudios-superiores",
  "censo-extranjera", "ieca-seccion-tasa-desempleo", "ieca-seccion-indice-soledad", "ieca-seccion-pension-mediana",
];

export interface RevisionChange {
  kind: "añadido" | "actualizado" | "conservado";
  indicatorId: string;
  title: string;
  scale: string;
  value: string;
  period: string;
  /** Valor del Perfil vigente que se sustituye o se conserva. */
  previous?: { title: string; value: string; period: string; reason: CoverageStatus };
}

const withoutPercent = (literal: string, unit: string) => (unit === "%" ? literal.replace(/\s*%$/, "") : literal);

function resultFrom(snapshot: TerritorialStatisticsSnapshot, ficha: IndicatorFicha, o: TerritorialObservation, id: string): ProfileResult {
  const comparisons = o.level === "municipio" ? (["provincia", "andalucia", "espana"] as const).flatMap(level => {
    const c = snapshot.observations.find(x => x.indicatorId === ficha.id && x.level === level);
    return c && c.value !== null ? [{ label: COMPARATOR_LABEL(c), value: c.value }] : [];
  }) : [];
  const { text, locator } = sourceLine(snapshot, o.sourceId);
  const cautions = [...ficha.cautions];
  if (o.derived) cautions.push(`${o.derived.method} Valores publicados: ${o.derived.inputs.map(i => `${i.label} ${i.value}`).join("; ")}.`);
  if (o.secret) cautions.push("Dato protegido por secreto estadístico en la fuente.");
  const section = o.level === "seccion";
  return {
    id, title: section ? ficha.title.replace(/ por sección$/, "") : ficha.title,
    value: withoutPercent(o.literal, ficha.unit), unit: ficha.unit, source: text, page: locator, period: o.period,
    caution: cautions.join(" "), topic: section ? "Desigualdad" : REVISION_TOPIC[ficha.domain],
    scale: section ? `Sección censal ${o.territoryCode}` : "Municipio", temporalContext: "current",
    ...(o.value !== null ? { chartValue: o.value } : {}), ...(comparisons.length ? { comparisons } : {}),
  };
}

/**
 * Resultados de una nueva revisión: los del Perfil vigente más los descargados.
 * Un indicador ausente se añade; uno con dato más reciente o con valor distinto
 * al publicado se sustituye conservando su identificador (y sus vínculos con las
 * conclusiones); en los demás casos se conserva el del Perfil. No toca el texto.
 */
export function mergeTerritorialResults(snapshot: TerritorialStatisticsSnapshot, results: ProfileResult[], catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): { results: ProfileResult[]; changes: RevisionChange[] } {
  const next = [...results];
  const changes: RevisionChange[] = [];
  const sectionCount = new Set(snapshot.observations.filter(o => o.level === "seccion").map(o => o.territoryCode)).size;
  for (const ficha of catalog) {
    const obs = snapshot.observations.filter(o => o.indicatorId === ficha.id &&
      (o.level === "municipio" || (o.level === "seccion" && sectionCount > 1 && SECTION_REVISION_INDICATORS.includes(ficha.id))));
    const matches = profileMatches(ficha, results, snapshot.ineCode);
    for (const o of obs) {
      const found = matches.find(m => (o.level === "municipio" ? !m.section : m.section === o.territoryCode))?.result;
      const scale = o.level === "municipio" ? "Municipio" : `Sección censal ${o.territoryCode}`;
      if (!found) {
        next.push(resultFrom(snapshot, ficha, o, `ts-${ficha.id}${o.level === "seccion" ? `-${o.territoryCode}` : ""}`));
        changes.push({ kind: "añadido", indicatorId: ficha.id, title: ficha.title, scale, value: o.literal, period: o.period });
        continue;
      }
      const status = compareWithProfile(ficha, o, found);
      const previous = { title: found.title, value: found.value, period: found.period, reason: status };
      if (status === "actualizable" || status === "revisar-valor") {
        const replacement = resultFrom(snapshot, ficha, o, found.id);
        if (found.supportsConclusions) replacement.supportsConclusions = found.supportsConclusions;
        replacement.caution = `${replacement.caution} Sustituye en esta revisión el valor ${found.value} (${found.period || "periodo no declarado"}) del Perfil anterior.`.trim();
        next[next.findIndex(r => r.id === found.id)] = replacement;
        changes.push({ kind: "actualizado", indicatorId: ficha.id, title: ficha.title, scale, value: o.literal, period: o.period, previous });
      } else {
        changes.push({ kind: "conservado", indicatorId: ficha.id, title: ficha.title, scale, value: found.value, period: found.period, previous });
      }
    }
  }
  return { results: next, changes };
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
