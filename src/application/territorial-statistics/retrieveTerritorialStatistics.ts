/**
 * Descarga secuencial de los indicadores del catálogo para un municipio
 * (CONTRACT-TERRITORIAL-STATISTICS §5). Cada fuente se consulta una vez; un fallo
 * se registra y no interrumpe las demás. El resultado es una instantánea nueva:
 * nunca modifica otra anterior ni el Perfil vigente.
 */
import type {
  TerritorialGridLayer, TerritorialLevel, TerritorialObservation, TerritorialRetrievalFailure,
  TerritorialSource, TerritorialStatisticsSnapshot,
} from "../../domain/territorial-statistics/TerritorialStatistics";
import {
  BADEA_BASE, IECA_GRID, INE_BASE, INE_TABLES, TERRITORIAL_CATALOG_VERSION, TERRITORIAL_INDICATORS,
  provinceOf, type AndalusianProvince, type BadeaSource, type IndicatorFicha, type IneTableKey,
} from "./catalog";
import {
  badeaUrl, gridTotals, gridUrl, ineRowsForMunicipality, ineTableUrl, literalEs, parseBadea, parseIneSeries,
  type BadeaRow, type FetchJson, type GridFeatureCollection, type IneRow,
} from "./sources";

export interface RetrieveOptions {
  municipalityId: string;
  municipalityName: string;
  ineCode: string;
  retrievedBy?: string;
  fetchJson: FetchJson;
  onProgress?: (message: string, done: number, total: number) => void;
  indicators?: IndicatorFicha[];
  includeGrid?: boolean;
  now?: () => Date;
  newId?: () => string;
}

const INE_COMPARATOR_FILTERS: Array<{ level: TerritorialLevel; variable: number; code: (province: string) => string }> = [
  { level: "provincia", variable: 115, code: p => p },
  { level: "andalucia", variable: 70, code: () => "01" },
  { level: "espana", variable: 349, code: () => "00" },
];

/**
 * Clave de una denominación INE independiente del orden de sus partes: la misma
 * serie aparece como «Total. Total. Todas las edades. Dato base.» en el municipio y
 * como «Total. Total. Dato base. Todas las edades.» en la sección.
 */
export function seriesKey(series: string): string {
  return series.split(/\.\s*/).map(p => p.trim()).filter(Boolean).sort().join("|");
}

export function seriesMatches(row: IneRow, series: string): boolean {
  return seriesKey(row.suffix) === seriesKey(series);
}

export async function retrieveTerritorialStatistics(opts: RetrieveOptions): Promise<TerritorialStatisticsSnapshot> {
  const { ineCode, fetchJson } = opts;
  if (!/^\d{5}$/.test(ineCode)) throw new Error("El código INE del municipio debe tener cinco cifras.");
  const province = provinceOf(ineCode);
  if (!province) throw new Error("El código INE no corresponde a una provincia andaluza.");
  const indicators = opts.indicators ?? TERRITORIAL_INDICATORS;
  const now = opts.now ?? (() => new Date());
  const sources: TerritorialSource[] = [];
  const observations: TerritorialObservation[] = [];
  const failures: TerritorialRetrievalFailure[] = [];

  const ineTables = [...new Set(indicators.flatMap(i => i.source.kind === "badea" ? [] : [i.source.table]))] as IneTableKey[];
  const badeaIds = [...new Set(indicators.flatMap(i => i.source.kind === "badea" ? [i.source.consulta] : []))];
  const steps: Array<{ label: string; run: () => Promise<void> }> = [];

  // Valores territoriales de las tablas nacionales de comparación.
  const valueIds = new Map<number, Array<{ Id: number; Codigo: string }>>();
  const resolveValue = async (variable: number, code: string): Promise<number | undefined> => {
    if (!valueIds.has(variable)) {
      const v = await fetchJson(`${INE_BASE}VALORES_VARIABLE/${variable}`);
      valueIds.set(variable, Array.isArray(v) ? (v as Array<{ Id: number; Codigo: string }>) : []);
    }
    return valueIds.get(variable)!.find(x => x.Codigo === code)?.Id;
  };

  for (const key of ineTables) {
    const spec = INE_TABLES[key];
    steps.push({
      label: `INE · ${spec.title}`,
      run: async () => {
        const table = spec.byProvince[province];
        const url = ineTableUrl(INE_BASE, table);
        const sourceId = `ine-${table}`;
        sources.push({ id: sourceId, provider: "INE", product: spec.product, table: String(table), title: spec.title, url });
        const rows = ineRowsForMunicipality(parseIneSeries(await fetchJson(url)), ineCode, province);
        if (!rows.some(r => r.level === "municipio")) failures.push({ scope: `INE ${table}`, message: "La tabla no publica el municipio." });
        const tagged = rows.map(r => ({ row: r, sourceId }));
        if (spec.comparatorTable) {
          for (const { level, variable, code } of INE_COMPARATOR_FILTERS) {
            if (!spec.comparatorLevels.includes(level)) continue;
            const id = await resolveValue(variable, code(province));
            if (id === undefined) { failures.push({ scope: `INE ${spec.comparatorTable}`, message: `Sin identificador de ${level}.` }); continue; }
            const cUrl = ineTableUrl(INE_BASE, spec.comparatorTable, `${variable}:${id}`);
            const cId = `ine-${spec.comparatorTable}`;
            if (!sources.some(s => s.id === cId)) sources.push({ id: cId, provider: "INE", product: spec.product, table: String(spec.comparatorTable), title: `${spec.title} (ámbitos superiores)`, url: cUrl.replace(/&tv=.*$/, "") });
            const cRows = parseIneSeries(await fetchJson(cUrl)).filter(r => r.level === level);
            tagged.push(...cRows.map(row => ({ row, sourceId: cId })));
          }
        }
        for (const ficha of indicators) {
          if (ficha.source.kind === "badea" || ficha.source.table !== key) continue;
          observations.push(...ineObservations(ficha, tagged));
        }
      },
    });
  }

  for (const consulta of badeaIds) {
    steps.push({
      label: `IECA · consulta ${consulta}`,
      run: async () => {
        const url = badeaUrl(BADEA_BASE, consulta);
        const parsed = parseBadea(await fetchJson(url), ineCode, province);
        const sourceId = `badea-${consulta}`;
        sources.push({ id: sourceId, provider: "IECA", product: parsed.activity || "BADEA", table: String(consulta), title: parsed.title, url, notes: parsed.notes });
        if (!parsed.rows.some(r => r.level === "municipio" || r.level === "seccion")) failures.push({ scope: `BADEA ${consulta}`, message: "La consulta no publica el municipio ni sus secciones." });
        for (const ficha of indicators) {
          if (ficha.source.kind !== "badea" || ficha.source.consulta !== consulta) continue;
          observations.push(...badeaObservations(ficha, ficha.source, parsed.rows, parsed.measures, sourceId));
        }
      },
    });
  }

  let grid: TerritorialGridLayer | undefined;
  if (opts.includeGrid !== false) {
    steps.push({
      label: "IECA · malla de 250 m",
      run: async () => {
        const url = gridUrl(IECA_GRID.endpoint, IECA_GRID.typeName, ineCode);
        const fc = (await fetchJson(url)) as GridFeatureCollection;
        if (!fc || !Array.isArray(fc.features)) throw new Error("Respuesta de la malla no válida.");
        const sourceId = `ieca-grid-${IECA_GRID.year}`;
        sources.push({ id: sourceId, provider: "IECA", product: "Distribución espacial de la población", table: IECA_GRID.typeName, title: IECA_GRID.title, url, notes: "Valor -1: secreto estadístico (celda no sumada)." });
        grid = { year: IECA_GRID.year, sourceId, cellCount: fc.features.length, geojson: JSON.stringify(fc), totals: gridTotals(fc, IECA_GRID.totals) };
      },
    });
  }

  let done = 0;
  for (const step of steps) {
    opts.onProgress?.(step.label, done, steps.length);
    try { await step.run(); }
    catch (error) { failures.push({ scope: step.label, message: error instanceof Error ? error.message : String(error) }); }
    done++;
  }
  opts.onProgress?.("Descarga terminada", done, steps.length);

  return {
    schema: "compas-territorial-statistics/v1",
    id: opts.newId ? opts.newId() : crypto.randomUUID(),
    municipalityId: opts.municipalityId,
    municipalityName: opts.municipalityName,
    ineCode,
    retrievedAt: now().toISOString(),
    retrievedBy: opts.retrievedBy,
    catalogVersion: TERRITORIAL_CATALOG_VERSION,
    sources,
    observations,
    grid,
    failures,
  };
}

function allowed(ficha: IndicatorFicha, level: TerritorialLevel | undefined): level is TerritorialLevel {
  return !!level && (ficha.scales.includes(level) || ficha.comparators.includes(level));
}

export function ineObservations(ficha: IndicatorFicha, tagged: Array<{ row: IneRow; sourceId: string }>): TerritorialObservation[] {
  const src = ficha.source;
  if (src.kind === "badea") return [];
  const out: TerritorialObservation[] = [];
  if (src.kind === "ine") {
    for (const { row, sourceId } of tagged) {
      if (!allowed(ficha, row.level) || !seriesMatches(row, src.series)) continue;
      out.push({
        indicatorId: ficha.id, label: row.suffix, territoryCode: row.territoryCode, territoryName: row.territoryName, level: row.level,
        period: row.period, value: row.value, literal: row.secret ? "Secreto estadístico" : row.value === null ? "No publicado" : literalEs(row.value),
        unit: ficha.unit, sourceId, seriesCode: row.seriesCode, ...(row.secret ? { secret: true } : {}),
      });
    }
    return out;
  }
  // Porcentaje derivado de dos recuentos publicados.
  const byTerritory = new Map<string, { num?: IneRow; den?: IneRow; sourceId: string }>();
  for (const { row, sourceId } of tagged) {
    if (!allowed(ficha, row.level)) continue;
    const isNum = seriesMatches(row, src.numerator);
    const isDen = seriesMatches(row, src.denominator);
    if (!isNum && !isDen) continue;
    const entry = byTerritory.get(row.territoryCode) ?? { sourceId };
    if (isNum) entry.num = row; else entry.den = row;
    byTerritory.set(row.territoryCode, entry);
  }
  for (const { num, den, sourceId } of byTerritory.values()) {
    if (!num || !den || !num.level) continue;
    const ok = num.value !== null && den.value !== null && den.value > 0;
    const value = ok ? Math.round((num.value! / den.value!) * 1000) / 10 : null;
    out.push({
      indicatorId: ficha.id, label: ficha.title, territoryCode: num.territoryCode, territoryName: num.territoryName, level: num.level,
      period: num.period, value, literal: value === null ? (num.secret || den.secret ? "Secreto estadístico" : "No calculable") : literalEs(value),
      unit: "%", sourceId,
      ...(num.secret || den.secret ? { secret: true } : {}),
      derived: {
        method: "Cociente entre dos recuentos publicados por la fuente, multiplicado por 100 y redondeado a un decimal.",
        inputs: [{ label: num.suffix, value: num.value ?? NaN }, { label: den.suffix, value: den.value ?? NaN }].filter(i => Number.isFinite(i.value)),
      },
    });
  }
  return out;
}

export function badeaObservations(ficha: IndicatorFicha, src: BadeaSource, rows: BadeaRow[], measures: string[], sourceId: string): TerritorialObservation[] {
  const matches = (row: BadeaRow, extra: Record<number, string> = {}) =>
    Object.entries({ ...src.filters, ...extra }).every(([pos, cod]) => row.dims[Number(pos) - 1]?.cod === cod);
  const selected = rows.filter(r => allowed(ficha, r.level) && matches(r));
  const latest = selected.reduce((p, r) => (r.period > p ? r.period : p), "");
  const current = selected.filter(r => r.period === latest);
  const municipal = current.find(r => r.level === "municipio");
  const extra: Record<number, string> = {};
  for (const pos of src.matchDimensions ?? []) if (municipal) extra[pos] = municipal.dims[pos - 1]?.cod ?? "";
  const label = measures[src.measure] ?? ficha.title;
  const out: TerritorialObservation[] = [];
  for (const r of current) {
    if (r.level !== "municipio" && r.level !== "seccion") {
      if (!municipal || !matches(r, extra)) continue;
    }
    const v = r.values[src.measure];
    if (!v) continue;
    const qualifier = (src.matchDimensions ?? []).map(pos => r.dims[pos - 1]?.des).filter(Boolean).join(", ");
    out.push({
      indicatorId: ficha.id, label: qualifier && r.level !== "municipio" ? `${label} (${qualifier})` : label,
      territoryCode: r.territoryCode, territoryName: r.territoryName, level: r.level!, period: r.period,
      value: v.value, literal: v.literal, unit: ficha.unit, sourceId, ...(v.secret ? { secret: true } : {}),
    });
  }
  return out;
}

const normalizeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s*\(.*\)\s*$/, "").replace(/[^a-z0-9]+/g, " ").trim();

export const PROVINCE_CODES: Record<string, AndalusianProvince> = {
  almeria: "04", cadiz: "11", cordoba: "14", granada: "18", huelva: "21", jaen: "23", malaga: "29", sevilla: "41",
};

/**
 * Busca el código INE de un municipio andaluz por su nombre, entre los municipios
 * que publica la tabla de renta del ADRH de su provincia (o de las ocho, si la
 * provincia no consta). Solo devuelve coincidencias exactas, sin tildes ni
 * mayúsculas; el usuario confirma el código antes de descargar.
 */
export async function findAndalusianIneCodes(name: string, province: string | undefined, fetchJson: FetchJson): Promise<Array<{ code: string; name: string }>> {
  const target = normalizeName(name);
  const p = province ? PROVINCE_CODES[normalizeName(province)] : undefined;
  const provinces = p ? [p] : (Object.keys(INE_TABLES["adrh-renta"].byProvince) as AndalusianProvince[]);
  const out: Array<{ code: string; name: string }> = [];
  for (const prov of provinces) {
    const table = INE_TABLES["adrh-renta"].byProvince[prov];
    const groups = await fetchJson(`${INE_BASE}GRUPOS_TABLA/${table}`);
    if (!Array.isArray(groups)) continue;
    for (const g of groups as Array<{ Id: number }>) {
      const values = await fetchJson(`${INE_BASE}VALORES_GRUPOSTABLA/${table}/${g.Id}`);
      if (!Array.isArray(values)) continue;
      for (const v of values as Array<{ FK_Variable?: number; Codigo?: string; Nombre?: string }>) {
        if (v.FK_Variable !== 19 || !v.Codigo || !v.Nombre || !/^\d{5}$/.test(v.Codigo)) continue;
        const n = normalizeName(v.Nombre);
        // El INE publica algunos nombres con artículo pospuesto: «Zubia, La».
        const swapped = v.Nombre.includes(",") ? normalizeName(v.Nombre.split(",").map(x => x.trim()).reverse().join(" ")) : n;
        if (n === target || swapped === target) out.push({ code: v.Codigo, name: v.Nombre });
      }
    }
  }
  return out;
}
