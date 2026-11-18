/**
 * Operaciones sobre el texto de un Perfil (CONTRACT-PROFILE-UPDATER §6 y §7).
 *
 * Capa 2 · conclusiones vinculadas: las cifras enlazadas a un indicador se
 * refrescan con cada descarga; si una condición que sostiene una conclusión deja
 * de cumplirse, la conclusión y las recomendaciones que se apoyan en ella se
 * marcan para revisar. COMPÁS no reescribe el razonamiento.
 *
 * Capa 3 · paquete de texto: operaciones declaradas (sustituir una sección,
 * añadir o sustituir una conclusión, fijar el fundamento de una recomendación,
 * añadir referencias, fijar vínculos y condiciones) redactadas fuera de COMPÁS
 * y aplicadas aquí a cada expediente.
 */
import type { ExternalHealthProfile, ProfileBinding, ProfileCondition, ProfileReviewFlag, ProfileValueRef } from "../../domain/health-profile/ExternalHealthProfile";
import type { TerritorialObservation, TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";

// ── Párrafos ────────────────────────────────────────────────────────────────

const LECTURA = /^Una lectura de conjunto$/i;
/** Rótulos que cierran una sección: apartados numerados, páginas de datos, lectura, conclusiones, referencias y anexos. */
const isHeading = (p: string) => {
  const t = p.trim();
  return /^\d{1,2}\.\s+\S/.test(t) || /^Anexo [A-Z]\./.test(t) || /^Referencias$/i.test(t) || LECTURA.test(t) ||
    /^(Contexto y población|Ejes de desigualdad|Condiciones de vida|Servicios|Salud y bienestar|Quién vive aquí|Panel de salud|Desigualdad)$/i.test(t) || /^[A-ZÁÉÍÓÚÑ][^.\n]{1,40} en datos$/.test(t);
};
const isConclusion = (p: string, id?: string) => (id ? p.trim().startsWith(`${id}. `) : /^C\d+\.\s/.test(p.trim()));

/** Índices [inicio, fin) del cuerpo de una sección encabezada por `heading` (la primera que aparece). */
function sectionRange(paras: string[], heading: string): [number, number] | undefined {
  const at = paras.findIndex(p => p.trim() === heading.trim());
  if (at < 0) return undefined;
  let end = at + 1;
  while (end < paras.length && !isHeading(paras[end]) && !(LECTURA.test(heading) && isConclusion(paras[end]))) end++;
  return [at + 1, end];
}

/** Párrafo que contiene el destino: una conclusión («C14») o la lectura de conjunto («LECTURA»). */
function targetIndices(paras: string[], target: string): number[] {
  if (target === "LECTURA") { const r = sectionRange(paras, "Una lectura de conjunto"); return r ? Array.from({ length: r[1] - r[0] }, (_, i) => r[0] + i) : []; }
  const i = paras.findIndex(p => isConclusion(p, target));
  return i < 0 ? [] : [i];
}

// ── Capa 2: vínculos y condiciones ──────────────────────────────────────────

function observationFor(s: TerritorialStatisticsSnapshot, ref: ProfileValueRef): TerritorialObservation | undefined {
  return s.observations.find(o => o.indicatorId === ref.indicatorId && o.level === ref.level && (!ref.territoryCode || o.territoryCode === ref.territoryCode));
}
const valueText = (o: TerritorialObservation) => o.literal.replace(/\s*%$/, "");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Sustituye la n-ésima aparición de `literal` como número completo (sin tocar cifras más largas). */
function replaceNth(text: string, literal: string, next: string, n: number): string | undefined {
  const re = new RegExp(`(?<![\\d.,])${escape(literal)}(?![\\d]|[.,]\\d)`, "g");
  let i = 0;
  let done = false;
  const out = text.replace(re, m => { i++; if (i === n) { done = true; return next; } return m; });
  return done ? out : undefined;
}

export interface BindingRefresh { text: string; bindings: ProfileBinding[]; changes: string[]; flags: ProfileReviewFlag[] }

export function refreshBindings(text: string, bindings: ProfileBinding[], snapshot: TerritorialStatisticsSnapshot): BindingRefresh {
  const paras = text.split("\n\n");
  const out: ProfileBinding[] = [];
  const changes: string[] = [];
  const flags: ProfileReviewFlag[] = [];
  for (const b of bindings) {
    const o = observationFor(snapshot, b.ref);
    if (!o || (b.field === "value" && o.value === null)) { flags.push({ target: b.target, reason: `La descarga no trae ${b.ref.indicatorId} (${b.ref.level}); la cifra ${b.literal} queda sin actualizar.` }); out.push(b); continue; }
    const next = b.field === "value" ? valueText(o) : o.period;
    if (next === b.literal) { out.push(b); continue; }
    const idx = targetIndices(paras, b.target);
    let replaced = false;
    for (const i of idx) {
      const r = replaceNth(paras[i], b.literal, next, b.occurrence ?? 1);
      if (r !== undefined) { paras[i] = r; replaced = true; break; }
    }
    if (replaced) { changes.push(`${b.target}: ${b.literal} → ${next} (${b.ref.indicatorId}, ${b.field === "value" ? "valor" : "año"}).`); out.push({ ...b, literal: next }); }
    else { flags.push({ target: b.target, reason: `No se encuentra «${b.literal}» en ${b.target}; el texto cambió desde que se enlazó la cifra.` }); out.push(b); }
  }
  return { text: paras.join("\n\n"), bindings: out, changes, flags };
}

export function evaluateConditions(conditions: ProfileCondition[], snapshot: TerritorialStatisticsSnapshot): ProfileReviewFlag[] {
  const flags: ProfileReviewFlag[] = [];
  for (const c of conditions) {
    const l = observationFor(snapshot, c.left)?.value;
    const r = "value" in c.right ? c.right.value : observationFor(snapshot, c.right)?.value;
    if (l === undefined || l === null || r === undefined || r === null) { flags.push({ target: c.target, reason: `No se puede comprobar que ${c.statement}: falta un valor en la descarga.` }); continue; }
    const ok = c.op === "<" ? l < r : c.op === ">" ? l > r : c.op === "<=" ? l <= r : l >= r;
    if (!ok) flags.push({ target: c.target, reason: `Ya no se cumple que ${c.statement} (${l} frente a ${r}).` });
  }
  return flags;
}

/** Recomendaciones cuyo «Fundamento:» cita alguna de las conclusiones marcadas. */
export function dependentRecommendations(text: string, conclusionIds: string[]): ProfileReviewFlag[] {
  if (!conclusionIds.length) return [];
  const paras = text.split("\n\n");
  const flags: ProfileReviewFlag[] = [];
  let current: string | undefined;
  for (const p of paras) {
    const r = /^(R\d+)\.\s/.exec(p.trim());
    if (r) { current = r[1]; continue; }
    const f = /^Fundamento:\s*(.+)$/.exec(p.trim());
    if (f && current) {
      const cited = f[1].split(/[,\s.]+/).filter(x => /^C\d+$/.test(x));
      const hit = cited.filter(c => conclusionIds.includes(c));
      if (hit.length) flags.push({ target: current, reason: `Se apoya en ${hit.join(", ")}, marcada para revisar.` });
      current = undefined;
    }
  }
  return flags;
}

// ── Capa 3: paquete de texto ────────────────────────────────────────────────

export type TextOperation =
  | { op: "replace-section"; heading: string; paragraphs: string[] }
  | { op: "upsert-conclusion"; id: string; text: string }
  | { op: "set-fundamento"; recommendation: string; conclusions: string[] }
  | { op: "replace-paragraph"; startsWith: string; text: string }
  | { op: "add-references"; references: string[] }
  | { op: "set-links"; bindings: ProfileBinding[]; conditions: ProfileCondition[] };

export interface TextPackageEntry {
  municipalityId: string;
  /** Título de la revisión sobre la que se redactó. Si la vigente es otra, no se aplica. */
  baseTitle: string;
  operations: TextOperation[];
}
export interface ProfileTextPackage {
  schema: "compas-profile-text-package/v1";
  createdAt: string;
  author: string;
  note: string;
  entries: TextPackageEntry[];
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const strs = (x: unknown): x is string[] => Array.isArray(x) && x.every(v => typeof v === "string");

export function parseTextPackage(raw: unknown): ProfileTextPackage {
  if (!isObj(raw) || raw.schema !== "compas-profile-text-package/v1" || !Array.isArray(raw.entries)) throw new Error("El archivo no es un paquete de texto de Perfil (compas-profile-text-package/v1).");
  for (const e of raw.entries) {
    if (!isObj(e) || typeof e.municipalityId !== "string" || typeof e.baseTitle !== "string" || !Array.isArray(e.operations)) throw new Error("Una entrada del paquete no tiene municipio, revisión de partida u operaciones.");
    for (const o of e.operations) {
      if (!isObj(o)) throw new Error("Operación no válida.");
      const ok = (o.op === "replace-section" && typeof o.heading === "string" && strs(o.paragraphs)) ||
        (o.op === "upsert-conclusion" && typeof o.id === "string" && /^C\d+$/.test(o.id) && typeof o.text === "string" && o.text.startsWith(`${o.id}. `)) ||
        (o.op === "set-fundamento" && typeof o.recommendation === "string" && /^R\d+$/.test(o.recommendation) && strs(o.conclusions)) ||
        (o.op === "replace-paragraph" && typeof o.startsWith === "string" && o.startsWith.length >= 8 && typeof o.text === "string") ||
        (o.op === "add-references" && strs(o.references)) ||
        (o.op === "set-links" && Array.isArray(o.bindings) && Array.isArray(o.conditions));
      if (!ok) throw new Error(`Operación no válida en ${e.municipalityId}: ${JSON.stringify(o).slice(0, 120)}`);
    }
  }
  return raw as unknown as ProfileTextPackage;
}

export interface TextPackageResult { text: string; bindings?: ProfileBinding[]; conditions?: ProfileCondition[]; changes: string[]; problems: string[] }

export function applyTextPackage(base: Pick<ExternalHealthProfile, "text" | "bindings" | "conditions">, entry: TextPackageEntry): TextPackageResult {
  let paras = base.text.split("\n\n");
  const changes: string[] = [];
  const problems: string[] = [];
  let bindings = base.bindings;
  let conditions = base.conditions;
  for (const o of entry.operations) {
    if (o.op === "replace-section") {
      const r = sectionRange(paras, o.heading);
      if (!r) { problems.push(`No existe la sección «${o.heading}».`); continue; }
      paras = [...paras.slice(0, r[0]), ...o.paragraphs, ...paras.slice(r[1])];
      changes.push(`Sección «${o.heading}» sustituida.`);
    } else if (o.op === "upsert-conclusion") {
      const i = paras.findIndex(p => isConclusion(p, o.id));
      if (i >= 0) { paras[i] = o.text; changes.push(`${o.id} sustituida.`); continue; }
      let last = -1;
      paras.forEach((p, k) => { if (isConclusion(p)) last = k; });
      if (last < 0) { problems.push(`No hay conclusiones donde añadir ${o.id}.`); continue; }
      paras.splice(last + 1, 0, o.text);
      changes.push(`${o.id} añadida.`);
    } else if (o.op === "set-fundamento") {
      const r = paras.findIndex(p => p.trim().startsWith(`${o.recommendation}. `));
      const f = r < 0 ? -1 : paras.findIndex((p, k) => k > r && /^Fundamento:/.test(p.trim()));
      if (f < 0) { problems.push(`No se encuentra el fundamento de ${o.recommendation}.`); continue; }
      paras[f] = `Fundamento: ${o.conclusions.join(", ")}.`;
      changes.push(`Fundamento de ${o.recommendation}: ${o.conclusions.join(", ")}.`);
    } else if (o.op === "replace-paragraph") {
      const hits = paras.map((p, k) => (p.trim().startsWith(o.startsWith) ? k : -1)).filter(k => k >= 0);
      if (hits.length !== 1) { problems.push(`«${o.startsWith.slice(0, 40)}…» aparece ${hits.length} veces; no se sustituye.`); continue; }
      paras[hits[0]] = o.text;
      changes.push(`Párrafo «${o.startsWith.slice(0, 40)}…» sustituido.`);
    } else if (o.op === "add-references") {
      const at = paras.findIndex(p => /^Referencias$/i.test(p.trim()));
      if (at < 0) { problems.push("No hay apartado «Referencias»."); continue; }
      const tag = (p: string) => /^([A-Z]+\d+|\d+)\./.exec(p.trim())?.[1];
      const has = new Set(paras.map(tag).filter(Boolean));
      const add = o.references.filter(r => !has.has(tag(r)));
      let end = at + 1;
      while (end < paras.length && !/^Anexo [A-Z]\./.test(paras[end].trim())) end++;
      paras.splice(end, 0, ...add);
      if (add.length) changes.push(`${add.length} referencias añadidas.`);
    } else {
      bindings = o.bindings; conditions = o.conditions;
      changes.push(`${o.bindings.length} cifras enlazadas y ${o.conditions.length} condiciones fijadas.`);
    }
  }
  return { text: paras.join("\n\n"), bindings, conditions, changes, problems };
}

// ── Campos derivados del texto ──────────────────────────────────────────────

/**
 * Resumen, conclusiones y recomendaciones del paquete se derivan del texto:
 * el resumen es la lectura de conjunto, las conclusiones son los párrafos
 * «Cn.» y las recomendaciones, los bloques «Rn.» con su tipo y su fundamento.
 * Si el texto cambia y estos campos no, el paquete describe otra revisión.
 * Se conserva la forma del título de las recomendaciones del Perfil de partida
 * (con o sin el rótulo de la recomendación).
 */
export interface DerivedProfileFields { summary?: string; findings: string[]; areas: Array<{ id: string; title: string; rationale: string }> }

export function deriveProfileFields(text: string, baseAreas: Array<{ id: string; title: string }> = []): DerivedProfileFields {
  const paras = text.split("\n\n").map(p => p.trim());
  const findings = paras.filter(p => /^C\d+\.\s/.test(p));
  const r = sectionRange(paras, "Una lectura de conjunto");
  const summary = r && r[1] > r[0] ? paras.slice(r[0], r[1]).join("\n\n") : undefined;
  const withHeading = !baseAreas.length || baseAreas.some(a => { const h = paras.find(p => p.startsWith(`${a.id}. `)); return !!h && a.title.startsWith(`${h}. `); });
  const areas: DerivedProfileFields["areas"] = [];
  paras.forEach((p, i) => {
    const m = /^(R\d+)\.\s+(.+)$/.exec(p);
    if (!m || !paras[i + 2]?.startsWith("Fundamento:")) return;
    const t = /^(Conocer|Contrastar|Abordar)\.\s+([\s\S]+)$/.exec(paras[i + 1] ?? "");
    if (!t) return;
    const fundamento = paras[i + 2].slice("Fundamento:".length).trim().replace(/\.$/, "");
    areas.push({ id: m[1], title: withHeading ? `${m[1]}. ${m[2]}. ${t[2]}` : `${m[1]}. ${t[2]}`, rationale: `${t[1]} · Deriva de ${fundamento}` });
  });
  return { ...(summary ? { summary } : {}), findings, areas };
}
