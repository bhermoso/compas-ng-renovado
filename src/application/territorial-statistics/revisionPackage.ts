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

/** Rótulo de cada bloque del marco: coincide con el tema y la página de datos (Art. 17 ter). */
export const DOMAIN_LABEL: Record<IndicatorDomain, string> = {
  "contexto-poblacion": "Contexto y población",
  "ejes-desigualdad": "Ejes de desigualdad",
  "condiciones-vida": "Condiciones de vida",
  servicios: "Servicios",
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
  return snapshot.observations.find(o =>
    o.indicatorId === indicatorId && o.level === "municipio" && o.territoryCode === snapshot.ineCode
  );
}

/** Resultados municipales con sus comparadores publicados, listos para el paquete. */
export function revisionResults(snapshot: TerritorialStatisticsSnapshot, catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): ProfileResult[] {
  return catalog.flatMap(ficha => {
    const local = municipalObservation(snapshot, ficha.id);
    return local ? [{ ...resultFrom(snapshot, ficha, local, territorialResultId(ficha.id)), scale: "Municipal" }] : [];
  });
}

// ── Cobertura frente al Perfil vigente ───────────────────────────────────────

export type CoverageStatus = "ausente" | "actualizable" | "al-dia" | "revisar-valor" | "otro-periodo" | "otra-medida" | "sin-dato" | "ambiguo";

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

const normalizeScope = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
const NON_MUNICIPAL_SCOPE = /\b(?:provincia(?:l)?|comarca(?:l)?|distrito|distrital|barrio|zona basica|ambito supramunicipal|andalucia|espana|autonomic[oa]|nacional|seccion(?:es)?|celda(?:s)?)\b/;
const NON_MUNICIPAL_TITLE = /\b(?:provincia(?:l)?|comarca(?:l)?|distrital|autonomic[oa]|nacional|seccion censal)\b|\b(?:distrito|barrio|zona basica)\s+|(?:^|[(:·–-])\s*(?:andalucia|espana)\b/;
const MUNICIPAL_SCOPE = /^(?:(?:ambito|escala|nivel)\s+)?(?:municipal|municipio)\b/;

function comparableScope(result: ProfileResult, ineCode: string): { section?: string } | undefined {
  const scope = normalizeScope(result.scale ?? "");
  const title = normalizeScope(result.title);
  const section = sectionCodeOf(result, ineCode);
  if (section) {
    // Un código de otro municipio o una escala declarada incompatible
    // no se reinterpretan como una sección de este expediente.
    const declaredSection = !scope || /\bseccion(?:es)?\b/.test(scope) || scope === section;
    return section.startsWith(ineCode) && declaredSection ? { section } : undefined;
  }
  if (NON_MUNICIPAL_SCOPE.test(scope) || NON_MUNICIPAL_TITLE.test(title)) return undefined;
  // Compatibilidad con las antiguas entregas locales que omitían la escala.
  if (!scope || MUNICIPAL_SCOPE.test(scope)) return {};
  return undefined;
}

const territorialResultId = (indicatorId: string, section?: string) =>
  `ts-${indicatorId}${section ? `-${section}` : ""}`;

/** Resultados compatibles por indicador y ámbito. Un identificador territorial prima sobre el nombre. */
function profileMatches(ficha: IndicatorFicha, results: ProfileResult[], ineCode: string) {
  const re = new RegExp(ficha.profileMatch, "i");
  return results.flatMap(result => {
    const scope = comparableScope(result, ineCode);
    if (!scope) return [];
    const canonicalId = territorialResultId(ficha.id, scope.section);
    const identified = result.id === canonicalId || result.id.startsWith(`${canonicalId}:`);
    // Las filas procedentes de otro indicador conocido no se vuelven a emparejar por título.
    if (!identified && (result.id.startsWith("ts-") || !re.test(result.title))) return [];
    return [{ result, section: scope.section, identified }];
  });
}

function preferredProfileMatches(matches: ReturnType<typeof profileMatches>, section?: string) {
  const scoped = matches.filter(match => match.section === section);
  const identified = scoped.filter(match => match.identified);
  return identified.length ? identified : scoped;
}

/** Estado de un valor descargado frente al resultado del Perfil en la misma escala. */
function compareWithProfile(ficha: IndicatorFicha, local: TerritorialObservation, found: ProfileResult): Exclude<CoverageStatus, "ausente" | "ambiguo"> {
  if (local.value === null) return "sin-dato";
  if ((ficha.unit === "%") !== /%/.test(`${found.unit} ${found.value}`)) return "otra-medida";
  const py = yearOf(found.period), dy = yearOf(local.period);
  if (py && dy > py) return "actualizable";
  if (py && py > dy) return "otro-periodo";
  const p = parseEs(found.value);
  if (!p) return "revisar-valor";
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
    const matches = profileMatches(ficha, profile?.results ?? [], snapshot.ineCode);
    const municipal = preferredProfileMatches(matches);
    const sectionObservations = snapshot.observations.filter(o =>
      o.indicatorId === ficha.id && o.level === "seccion" && o.territoryCode.startsWith(snapshot.ineCode));
    const sections = matches.flatMap(match => match.section ? [match.section] : []);
    const section = municipal.length ? undefined
      : sectionObservations.find(o => sections.includes(o.territoryCode))?.territoryCode ?? sections[0];
    const candidates = section ? preferredProfileMatches(matches, section) : municipal;
    const found = candidates.length === 1 ? candidates[0].result : undefined;
    const local = section ? sectionObservations.find(o => o.territoryCode === section)
      : municipalObservation(snapshot, ficha.id) ?? (municipal.length ? undefined : sectionObservations[0]);
    const row: CoverageRow = { indicatorId: ficha.id, title: ficha.title, domain: ficha.domain, status: "sin-dato" };
    if (local) row.downloaded = { literal: local.level === "municipio" || section ? local.literal : "Por sección censal", period: local.period, territory: local.level === "seccion" ? `sección ${local.territoryCode}` : local.territoryName };
    if (found) row.inProfile = { title: found.title, value: found.value, unit: found.unit, period: found.period, scale: found.scale };
    if (candidates.length > 1) return { ...row, status: "ambiguo" };
    if (!local) return row;
    row.status = found ? compareWithProfile(ficha, local, found) : local.value === null ? "sin-dato" : "ausente";
    return row;
  });
}

// ── Revisión del Perfil con los datos descargados ───────────────────────────

/** Página de datos a la que va cada bloque del marco (Art. 17 ter, v2.5.0). */
export const REVISION_TOPIC: Record<IndicatorDomain, string> = DOMAIN_LABEL;

/** Indicadores que se llevan al Perfil también por sección censal (página de desigualdad). */
export const SECTION_REVISION_INDICATORS = [
  "adrh-renta-neta-persona", "adrh-bajo-60-mediana", "adrh-gini", "censo-estudios-superiores",
  "censo-extranjera", "ieca-seccion-tasa-desempleo", "ieca-seccion-indice-soledad", "ieca-seccion-pension-mediana",
  "ieca-seccion-alquiler-colectiva",
];

export interface RevisionChange {
  kind: "añadido" | "actualizado" | "conservado" | "por revisar";
  indicatorId: string;
  title: string;
  scale: string;
  value: string;
  period: string;
  issue?: "ambiguo";
  /** Valor del Perfil vigente que se sustituye o se conserva. */
  previous?: { title: string; value: string; period: string; reason: CoverageStatus };
}

const withoutPercent = (literal: string, unit: string) => (unit === "%" ? literal.replace(/\s*%$/, "") : literal);

function resultFrom(snapshot: TerritorialStatisticsSnapshot, ficha: IndicatorFicha, o: TerritorialObservation, id: string): ProfileResult {
  const comparisons = o.level === "municipio" ? COMPARATOR_ORDER.flatMap(level => {
    const c = snapshot.observations.find(x => x.indicatorId === ficha.id && x.level === level && x.period === o.period);
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
    caution: cautions.join(" "), topic: section ? "Ejes de desigualdad" : REVISION_TOPIC[ficha.domain],
    scale: section ? `Sección censal ${o.territoryCode}` : "Municipio", temporalContext: "current",
    ...(o.value !== null ? { chartValue: o.value } : {}), ...(comparisons.length ? { comparisons } : {}),
  };
}

/**
 * Las secciones de un mismo indicador comparten rótulo y página. Una revisión anterior
 * pudo sustituir una sola sección con el rótulo del catálogo y dejarla fuera de su
 * fila; se alinea con el rótulo y la página que tiene la mayoría de sus secciones.
 */
function alignSectionLabels(ficha: IndicatorFicha, ids: string[], next: ProfileResult[], changes: RevisionChange[]) {
  const items = ids.map(id => next.findIndex(r => r.id === id)).filter(i => i >= 0);
  if (items.length < 2) return;
  const count = new Map<string, number>();
  for (const i of items) { const k = JSON.stringify([next[i].title, next[i].topic ?? ""]); count.set(k, (count.get(k) ?? 0) + 1); }
  const [best, n] = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  if (n * 2 <= items.length) return; // sin mayoría clara no se decide
  const [title, topic] = JSON.parse(best) as [string, string];
  for (const i of items) {
    const r = next[i];
    if (r.title === title && (r.topic ?? "") === topic) continue;
    next[i] = { ...r, title, topic: topic || undefined };
    changes.push({ kind: "actualizado", indicatorId: ficha.id, title: ficha.title, scale: r.scale ?? "", value: r.value, period: r.period, previous: { title: r.title, value: r.value, period: r.period, reason: "al-dia" } });
  }
}

/**
 * Resultados de una nueva revisión: los del Perfil vigente más los descargados.
 * Un indicador ausente se añade; uno con dato más reciente o con valor distinto
 * al publicado se sustituye conservando su identificador (y sus vínculos con las
 * conclusiones); en los demás casos se conserva el del Perfil. No toca el texto.
 */
export function mergeTerritorialResults(snapshot: TerritorialStatisticsSnapshot, results: ProfileResult[], catalog: IndicatorFicha[] = TERRITORIAL_INDICATORS): { results: ProfileResult[]; changes: RevisionChange[] } {
  const next = [...results];
  const usedIds = new Set(results.map(result => result.id));
  const changes: RevisionChange[] = [];
  const sectionCount = new Set(snapshot.observations
    .filter(o => o.level === "seccion" && o.territoryCode.startsWith(snapshot.ineCode))
    .map(o => o.territoryCode)).size;
  for (const ficha of catalog) {
    const obs = snapshot.observations.filter(o => o.indicatorId === ficha.id &&
      ((o.level === "municipio" && o.territoryCode === snapshot.ineCode) ||
        (o.level === "seccion" && o.territoryCode.startsWith(snapshot.ineCode) &&
          sectionCount > 1 && SECTION_REVISION_INDICATORS.includes(ficha.id))));
    const matches = profileMatches(ficha, results, snapshot.ineCode);
    for (const o of obs) {
      const section = o.level === "seccion" ? o.territoryCode : undefined;
      const canonicalId = territorialResultId(ficha.id, section);
      const candidates = preferredProfileMatches(matches, section);
      const scale = o.level === "municipio" ? "Municipio" : `Sección censal ${o.territoryCode}`;
      if (candidates.length > 1) {
        changes.push({ kind: "por revisar", indicatorId: ficha.id, title: ficha.title, scale, value: o.literal, period: o.period, issue: "ambiguo" });
        continue;
      }
      const found = candidates[0]?.result;
      if (!found) {
        // Una ficha antigua con un ID reservado y otra escala queda intacta.
        let id = canonicalId;
        for (let suffix = 2; usedIds.has(id); suffix++) id = `${canonicalId}:${suffix}`;
        usedIds.add(id);
        next.push(resultFrom(snapshot, ficha, o, id));
        changes.push({ kind: "añadido", indicatorId: ficha.id, title: ficha.title, scale, value: o.literal, period: o.period });
        continue;
      }
      const status = compareWithProfile(ficha, o, found);
      const previous = { title: found.title, value: found.value, period: found.period, reason: status };
      if (status === "actualizable" || status === "revisar-valor") {
        const replacement = resultFrom(snapshot, ficha, o, found.id);
        // Se sustituye el dato, no el rótulo ni la página: así el resultado sigue en la misma
        // fila que las demás secciones del indicador (matriz por sección).
        replacement.title = found.title; replacement.topic = found.topic ?? replacement.topic; replacement.scale = found.scale ?? replacement.scale;
        if (found.supportsConclusions) replacement.supportsConclusions = found.supportsConclusions;
        replacement.caution = `${replacement.caution} Sustituye en esta revisión el valor ${found.value} (${found.period || "periodo no declarado"}) del Perfil anterior.`.trim();
        next[next.findIndex(r => r.id === found.id)] = replacement;
        changes.push({ kind: "actualizado", indicatorId: ficha.id, title: ficha.title, scale, value: o.literal, period: o.period, previous });
      } else {
        changes.push({ kind: "conservado", indicatorId: ficha.id, title: ficha.title, scale, value: found.value, period: found.period, previous });
      }
    }
    // Solo se alinea la sección que no tiene otro resultado del mismo indicador: la que dejó un
    // hueco en su fila. Las filas propias del Perfil (mínimo y máximo entre secciones, por ejemplo)
    // repiten una sección que ya está en la fila y se conservan.
    const perSection = new Map<string, number>();
    for (const m of matches) if (m.section) perSection.set(m.section, (perSection.get(m.section) ?? 0) + 1);
    alignSectionLabels(ficha, matches.filter(m => m.section && perSection.get(m.section) === 1).map(m => m.result.id), next, changes);
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
