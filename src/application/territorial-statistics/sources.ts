/**
 * Lectura de las respuestas del INE (wstempus), del IECA (BADEA) y de la malla
 * de 250 m del IECA (WFS). Funciones puras: reciben la respuesta ya descargada y
 * devuelven filas normalizadas. No redondean ni corrigen valores publicados.
 */
import type { TerritorialLevel } from "../../domain/territorial-statistics/TerritorialStatistics";

export type FetchJson = (url: string) => Promise<unknown>;

// ── Formato de valores ──────────────────────────────────────────────────────

/**
 * Representa un número publicado en formato es-ES sin alterar sus decimales:
 * coma decimal y punto de millares a partir de cinco cifras (12924; 134.567).
 * Implementación propia para que el resultado no dependa del motor de Intl.
 */
export function literalEs(value: number): string {
  const [int, dec] = String(Math.abs(value)).split(".");
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : int;
  return `${value < 0 ? "-" : ""}${grouped}${dec ? `,${dec}` : ""}`;
}

/** Repara textos que llegan con doble codificación (UTF-8 leído como Latin-1). */
export function repairText(text: string): string {
  if (!/[ÃÂ]/.test(text)) return text;
  try {
    const bytes = Uint8Array.from(Array.from(text, ch => ch.charCodeAt(0) & 0xff));
    const fixed = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return fixed;
  } catch {
    return text;
  }
}

// ── INE ─────────────────────────────────────────────────────────────────────

export interface IneSeriesRaw {
  COD?: string;
  Nombre: string;
  T3_Unidad?: string;
  MetaData?: Array<{ Id: number; T3_Variable?: string; Nombre: string; Codigo: string }>;
  Data?: Array<{ Anyo?: number; Valor?: number | null; Secreto?: boolean }>;
}

export interface IneRow {
  seriesCode?: string;
  name: string;
  /** Denominación de la serie sin el nombre del territorio. */
  suffix: string;
  territoryCode: string;
  territoryName: string;
  level: TerritorialLevel | undefined;
  period: string;
  value: number | null;
  secret: boolean;
}

function ineLevel(variable: string | undefined, code: string): TerritorialLevel | undefined {
  const v = (variable ?? "").toLowerCase();
  if (/secci/.test(v) || /^\d{10}$/.test(code)) return "seccion";
  if (/distrit/.test(v) || /^\d{7}$/.test(code)) return "distrito-censal";
  if (/municip/.test(v) || /^\d{5}$/.test(code)) return "municipio";
  if (/provinc/.test(v)) return "provincia";
  if (/comunidad|autón|ccaa/.test(v)) return code === "01" ? "andalucia" : undefined;
  if (/nacional/.test(v) || code === "00") return "espana";
  return undefined;
}

/** Quita el primer segmento («Territorio. ») del nombre de una serie INE. */
export function ineSuffix(name: string): string {
  const trimmed = name.trim();
  const i = trimmed.indexOf(". ");
  return i < 0 ? trimmed : trimmed.slice(i + 2).trim();
}

export function parseIneSeries(raw: unknown): IneRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: IneRow[] = [];
  for (const s of raw as IneSeriesRaw[]) {
    // El territorio es la variable territorial; otras variables también pueden tener
    // códigos numéricos (p. ej. «Países: 000»).
    const meta = s.MetaData ?? [];
    const terr = meta.find(m => /municip|secci|distrit|provinc|comunidad|nacional/i.test(m.T3_Variable ?? "") && /^\d+$/.test(m.Codigo ?? ""))
      ?? meta.find(m => typeof m.Codigo === "string" && /^\d+$/.test(m.Codigo));
    const point = (s.Data ?? [])[(s.Data ?? []).length - 1];
    if (!terr || !point) continue;
    const secret = point.Secreto === true;
    const value = secret || point.Valor === null || point.Valor === undefined ? null : Number(point.Valor);
    rows.push({
      seriesCode: s.COD,
      name: s.Nombre.trim(),
      suffix: ineSuffix(s.Nombre),
      territoryCode: terr.Codigo,
      territoryName: terr.Nombre,
      level: ineLevel(terr.T3_Variable, terr.Codigo),
      period: point.Anyo !== undefined ? String(point.Anyo) : "",
      value: value !== null && Number.isFinite(value) ? value : null,
      secret,
    });
  }
  return rows;
}

/** Filas del municipio, sus distritos y secciones, y de la propia provincia. */
export function ineRowsForMunicipality(rows: IneRow[], ineCode: string, province: string): IneRow[] {
  return rows.filter(r =>
    (r.level === "municipio" && r.territoryCode === ineCode) ||
    ((r.level === "distrito-censal" || r.level === "seccion") && r.territoryCode.startsWith(ineCode)) ||
    (r.level === "provincia" && r.territoryCode === province));
}

export function ineTableUrl(base: string, table: number, filter?: string): string {
  return `${base}DATOS_TABLA/${table}?nult=1&tip=AM${filter ? `&tv=${filter}` : ""}`;
}

// ── IECA · BADEA ────────────────────────────────────────────────────────────

interface BadeaCell { cod?: string[]; des?: string; val?: string | null; format?: string | null }
export interface BadeaConsulta {
  metainfo?: { id?: number; title?: string; activity?: string; source?: string; notes?: string; periodicity?: string };
  measures?: Array<{ des: string }>;
  data?: BadeaCell[][];
}

export interface BadeaRow {
  territoryCode: string;
  territoryName: string;
  level: TerritorialLevel | undefined;
  /** Códigos completos de cada dimensión (1 = primera tras el territorio), unidos por «.». */
  dims: Array<{ cod: string; des: string }>;
  period: string;
  values: Array<{ value: number | null; literal: string; secret: boolean }>;
}

function badeaLevel(code: string, ineCode: string, province: string): TerritorialLevel | undefined {
  if (code === ineCode) return "municipio";
  if (/^\d{10}$/.test(code) && code.startsWith(ineCode)) return "seccion";
  if (code === province || code === `P1_${province}`) return "provincia";
  if (code === "C01" || code === "P2_C01") return "andalucia";
  return undefined;
}

export function parseBadea(raw: unknown, ineCode: string, province: string): { rows: BadeaRow[]; measures: string[]; title: string; notes?: string; activity?: string; source?: string } {
  const c = (raw ?? {}) as BadeaConsulta;
  const measures = (c.measures ?? []).map(m => repairText(m.des));
  const rows: BadeaRow[] = [];
  for (const row of c.data ?? []) {
    const nDims = row.length - measures.length;
    if (nDims < 1) continue;
    const territoryCodes = row[0].cod ?? [];
    const code = territoryCodes[territoryCodes.length - 1] ?? "";
    const level = badeaLevel(code, ineCode, province);
    if (!level) continue;
    const dims = row.slice(1, nDims).map(d => ({ cod: (d.cod ?? []).join("."), des: repairText(d.des ?? "") }));
    const periodDim = dims.find(d => /^\d{4}$/.test(d.cod));
    const values = row.slice(nDims).map(v => {
      const literal = (v.format ?? v.val ?? "").toString().trim();
      // El valor publicado es la representación de la fuente («15,7%»); `val` puede
      // llevar decimales de cálculo que la fuente no publica (15.70077473).
      const shown = /\d/.test(literal) ? Number(literal.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) : NaN;
      const n = Number.isFinite(shown) ? shown : v.val === null || v.val === undefined || v.val === "" ? NaN : Number(v.val);
      const secret = literal === "-" || literal === "(-)";
      return { value: Number.isFinite(n) && !secret ? n : null, literal: secret ? "Secreto estadístico" : literal, secret };
    });
    rows.push({ territoryCode: code, territoryName: repairText(row[0].des ?? code), level, dims, period: periodDim?.cod ?? "", values });
  }
  const meta = c.metainfo ?? {};
  return { rows, measures, title: repairText(meta.title ?? ""), notes: meta.notes ? stripHtml(repairText(meta.notes)) : undefined, activity: meta.activity, source: meta.source };
}

export function stripHtml(s: string): string {
  const named: Record<string, string> = { aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", uuml: "ü", nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"' };
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&([a-zA-Z]+);/g, (m, n: string) => named[n] ?? m).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

export function badeaUrl(base: string, consulta: number): string {
  return `${base}consulta/${consulta}`;
}

// ── IECA · malla de 250 m ───────────────────────────────────────────────────

export interface GridFeatureCollection { type: "FeatureCollection"; features: Array<{ type: "Feature"; properties: Record<string, unknown>; geometry: unknown }> }

export function gridUrl(endpoint: string, typeName: string, ineCode: string): string {
  return `${endpoint}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${typeName}&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=cmun='${ineCode}'`;
}

/** Suma un campo sobre las celdas; un valor negativo es secreto estadístico y no se suma. */
export function gridTotals(fc: GridFeatureCollection, fields: ReadonlyArray<{ field: string; label: string }>) {
  return fields.map(({ field, label }) => {
    let sum = 0;
    let secretCells = 0;
    for (const f of fc.features) {
      const v = Number(f.properties[field]);
      if (!Number.isFinite(v)) continue;
      if (v < 0) secretCells++;
      else sum += v;
    }
    return { field, label, sum, secretCells };
  });
}
