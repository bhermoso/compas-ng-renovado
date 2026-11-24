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
  // «Anexos» y los anexos rotulados «A. …» cierran el apartado 7 igual que «Anexo A.».
  return /^\d{1,2}\.\s+\S/.test(t) || /^Anexo [A-Z]\./.test(t) || /^Anexos$/i.test(t) || /^[A-H]\.\s+[A-ZÁÉÍÓÚ]/.test(t) || /^Referencias$/i.test(t) || LECTURA.test(t) ||
    /^(Contexto y población|Ejes de desigualdad|Condiciones de vida|Servicios|Salud y bienestar|Quién vive aquí|Panel de salud|Desigualdad)$/i.test(t) || /^[A-ZÁÉÍÓÚÑ][^.\n]{1,40} en datos$/.test(t);
};
const isConclusion = (p: string, id?: string) => {
  const match = /^(C\d+)\.\s/.exec(p.trim())?.[1];
  return match !== undefined && (id === undefined || match === id);
};
const recommendationId = (p: string) => /^(R\d+)\.\s/.exec(p.trim())?.[1];
const isFundamento = (p: string) => /^Fundamento:/.test(p.trim());

/** Índices [inicio, fin) del cuerpo de una sección identificada por un rótulo único. */
function sectionRange(paras: string[], heading: string): [number, number] | undefined {
  const matches = (p: string) => LECTURA.test(heading.trim()) ? LECTURA.test(p.trim()) : p.trim() === heading.trim();
  const at = paras.findIndex(matches);
  if (at < 0 || at !== paras.findLastIndex(matches)) return undefined;
  const numbered = /^\d{1,2}\.\s+\S/.test(heading.trim());
  let end = at + 1;
  while (end < paras.length) {
    const paragraph = paras[end];
    if (isHeading(paragraph) && !(numbered && LECTURA.test(paragraph.trim()))) break;
    if (LECTURA.test(heading.trim()) && isConclusion(paragraph)) break;
    end++;
  }
  return [at + 1, end];
}

/** Párrafo que contiene el destino: una conclusión («C14») o la lectura de conjunto («LECTURA»). */
function targetIndices(paras: string[], target: string): number[] {
  if (target === "LECTURA") { const r = sectionRange(paras, "Una lectura de conjunto"); return r ? Array.from({ length: r[1] - r[0] }, (_, i) => r[0] + i) : []; }
  const i = paras.findIndex(p => isConclusion(p, target));
  return i < 0 || i !== paras.findLastIndex(p => isConclusion(p, target)) ? [] : [i];
}

function recommendationFundamentos(paras: string[], start: number): number[] {
  const fundamentos: number[] = [];
  for (let index = start + 1; index < paras.length; index++) {
    const paragraph = paras[index];
    if (recommendationId(paragraph) || isHeading(paragraph) || isConclusion(paragraph)) break;
    if (isFundamento(paragraph)) fundamentos.push(index);
  }
  return fundamentos;
}

// ── Capa 2: vínculos y condiciones ──────────────────────────────────────────

function observationFor(s: TerritorialStatisticsSnapshot, ref: ProfileValueRef): TerritorialObservation | undefined {
  const code = ref.territoryCode || (ref.level === "municipio" ? s.ineCode : undefined);
  const observations = s.observations.filter(o =>
    o.indicatorId === ref.indicatorId && o.level === ref.level && (!code || o.territoryCode === code)
  );
  return observations.length === 1 ? observations[0] : undefined;
}
const valueText = (o: TerritorialObservation) => o.literal.replace(/\s*%$/, "");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type ReviewCheck = NonNullable<ProfileReviewFlag["check"]>;
const valueRefKey = (ref: ProfileValueRef) => [ref.indicatorId, ref.level, ref.territoryCode || null];
export const bindingReviewCheck = (binding: ProfileBinding): ReviewCheck => ({
  kind: "binding",
  key: JSON.stringify([binding.target, valueRefKey(binding.ref), binding.field, binding.occurrence ?? null]),
});
export const conditionReviewCheck = (condition: ProfileCondition): ReviewCheck => ({
  kind: "condition",
  key: JSON.stringify([condition.target, valueRefKey(condition.left), condition.op,
    "value" in condition.right ? condition.right.value : valueRefKey(condition.right)]),
});

interface BindingEdit {
  bindingIndex: number;
  start: number;
  end: number;
  value: string;
}

function literalLocations(paras: string[], binding: ProfileBinding) {
  const re = new RegExp(`(?<![\\p{L}\\d.,+−-])${escape(binding.literal)}(?![\\p{L}\\d]|[.,]\\d)`, "gu");
  return targetIndices(paras, binding.target).flatMap(paragraph =>
    [...paras[paragraph].matchAll(re)].map(match => ({ paragraph, start: match.index, end: match.index + match[0].length }))
  );
}

export interface BindingRefresh { text: string; bindings: ProfileBinding[]; changes: string[]; flags: ProfileReviewFlag[] }

export function refreshBindings(text: string, bindings: ProfileBinding[], snapshot: TerritorialStatisticsSnapshot): BindingRefresh {
  const paras = text.split("\n\n");
  const out = [...bindings];
  const changes: string[] = [];
  const flags: ProfileReviewFlag[] = [];
  const byParagraph = new Map<number, BindingEdit[]>();
  const flag = (binding: ProfileBinding, reason: string) => flags.push({
    target: binding.target, reason, check: bindingReviewCheck(binding),
  });
  for (const [bindingIndex, b] of bindings.entries()) {
    const locations = literalLocations(paras, b);
    const location = b.occurrence === undefined
      ? (locations.length === 1 ? locations[0] : undefined)
      : locations[b.occurrence - 1];
    if (!location) {
      flag(b, locations.length
        ? `La aparición enlazada de «${b.literal}» en ${b.target} no está identificada de forma inequívoca.`
        : `No se encuentra «${b.literal}» en ${b.target}; revisa el vínculo con el texto.`);
      continue;
    }
    const o = observationFor(snapshot, b.ref);
    if (!o || o.value === null || (b.field === "period" && !o.period.trim())) {
      flag(b, `La descarga no trae un valor publicado e inequívoco para ${b.ref.indicatorId} (${b.ref.level}); se conserva ${b.literal}.`);
      continue;
    }
    const edits = byParagraph.get(location.paragraph) ?? [];
    edits.push({ bindingIndex, start: location.start, end: location.end, value: b.field === "value" ? valueText(o) : o.period });
    byParagraph.set(location.paragraph, edits);
  }
  for (const [paragraph, edits] of byParagraph) {
    // Resolver todos los destinos sobre el texto de partida. Una cifra recién
    // escrita no puede convertirse en el destino de otro vínculo de la misma pasada.
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      const binding = bindings[edit.bindingIndex];
      if (edits.some(other => other !== edit && other.start < edit.end && edit.start < other.end)) {
        flag(binding, `Varios vínculos apuntan a la cifra «${binding.literal}» en ${binding.target}.`);
        continue;
      }
      if (edit.value === binding.literal) continue;
      const before = paras[paragraph];
      paras[paragraph] = before.slice(0, edit.start) + edit.value + before.slice(edit.end);
      out[edit.bindingIndex] = { ...binding, literal: edit.value };
      changes.push(`${binding.target}: ${binding.literal} → ${edit.value} (${binding.ref.indicatorId}, ${binding.field === "value" ? "valor" : "año"}).`);
    }
  }
  return { text: paras.join("\n\n"), bindings: out, changes, flags };
}

export function evaluateConditions(conditions: ProfileCondition[], snapshot: TerritorialStatisticsSnapshot): ProfileReviewFlag[] {
  const flags: ProfileReviewFlag[] = [];
  for (const c of conditions) {
    const l = observationFor(snapshot, c.left)?.value;
    const r = "value" in c.right ? c.right.value : observationFor(snapshot, c.right)?.value;
    const check = conditionReviewCheck(c);
    if (l === undefined || l === null || r === undefined || r === null) { flags.push({ target: c.target, reason: `No se puede comprobar que ${c.statement}: falta un valor inequívoco en la descarga.`, check }); continue; }
    const ok = c.op === "<" ? l < r : c.op === ">" ? l > r : c.op === "<=" ? l <= r : l >= r;
    if (!ok) flags.push({ target: c.target, reason: `Ya no se cumple que ${c.statement} (${l} frente a ${r}).`, check });
  }
  return flags;
}

/** Recomendaciones cuyo «Fundamento:» cita alguna de las conclusiones marcadas. */
export function dependentRecommendations(text: string, conclusionIds: string[]): ProfileReviewFlag[] {
  if (!conclusionIds.length) return [];
  const paras = text.split("\n\n");
  const flags: ProfileReviewFlag[] = [];
  for (const [index, paragraph] of paras.entries()) {
    const target = recommendationId(paragraph);
    if (!target) continue;
    const cited = recommendationFundamentos(paras, index).flatMap(i => paras[i].trim().match(/\bC\d+\b/g) ?? []);
    const hit = [...new Set(cited.filter(id => conclusionIds.includes(id)))];
    if (hit.length) flags.push({ target, reason: `Se apoya en ${hit.join(", ")}, marcada para revisar.`, check: { kind: "recommendation", key: target } });
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
const isReviewTarget = (x: unknown) => typeof x === "string" && /^(LECTURA|C\d+)$/.test(x);
const isValueRef = (x: unknown): x is ProfileValueRef =>
  isObj(x) && typeof x.indicatorId === "string" && x.indicatorId.trim() !== "" &&
  typeof x.level === "string" && ["municipio", "seccion", "provincia", "andalucia", "espana"].includes(x.level) &&
  (x.territoryCode === undefined || (typeof x.territoryCode === "string" && x.territoryCode.trim() !== ""));
const validBindings = (x: unknown) => Array.isArray(x) && x.every(b =>
  isObj(b) && isReviewTarget(b.target) && isValueRef(b.ref) && (b.field === "value" || b.field === "period") &&
  typeof b.literal === "string" && b.literal.trim() !== "" &&
  (b.occurrence === undefined || (typeof b.occurrence === "number" && Number.isSafeInteger(b.occurrence) && b.occurrence > 0))
);
const validConditions = (x: unknown) => Array.isArray(x) && x.every(c =>
  isObj(c) && isReviewTarget(c.target) && typeof c.statement === "string" && c.statement.trim() !== "" &&
  isValueRef(c.left) && typeof c.op === "string" && ["<", ">", "<=", ">="].includes(c.op) &&
  (isValueRef(c.right) || (isObj(c.right) && typeof c.right.value === "number" && Number.isFinite(c.right.value)))
);

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
        (o.op === "set-links" && validBindings(o.bindings) && validConditions(o.conditions));
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
      if (!r) { problems.push(`No se encuentra una sección única «${o.heading}».`); continue; }
      paras = [...paras.slice(0, r[0]), ...o.paragraphs, ...paras.slice(r[1])];
      changes.push(`Sección «${o.heading}» sustituida.`);
    } else if (o.op === "upsert-conclusion") {
      const i = paras.findIndex(p => isConclusion(p, o.id));
      if (i >= 0 && i !== paras.findLastIndex(p => isConclusion(p, o.id))) {
        problems.push(`La conclusión ${o.id} aparece más de una vez.`);
        continue;
      }
      if (i >= 0) { paras[i] = o.text; changes.push(`${o.id} sustituida.`); continue; }
      let last = -1;
      paras.forEach((p, k) => { if (isConclusion(p)) last = k; });
      if (last < 0) { problems.push(`No hay conclusiones donde añadir ${o.id}.`); continue; }
      paras.splice(last + 1, 0, o.text);
      changes.push(`${o.id} añadida.`);
    } else if (o.op === "set-fundamento") {
      const matches = (p: string) => recommendationId(p) === o.recommendation;
      const start = paras.findIndex(matches);
      const fundamentos = start >= 0 && start === paras.findLastIndex(matches)
        ? recommendationFundamentos(paras, start)
        : [];
      if (fundamentos.length !== 1) {
        problems.push(`No se encuentra un fundamento único en ${o.recommendation}.`);
        continue;
      }
      paras[fundamentos[0]] = `Fundamento: ${o.conclusions.join(", ")}.`;
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
  if (problems.length) return { ...base, changes: [], problems };
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
export interface DerivedProfileFields {
  summary?: string;
  findings?: string[];
  areas?: ExternalHealthProfile["areas"];
}

export function deriveProfileFields(text: string, baseAreas: Array<{ id: string; title: string }> = []): DerivedProfileFields {
  const paras = text.split("\n\n").map(p => p.trim());
  const findings = paras.filter(p => /^C\d+\.\s/.test(p));
  const r = sectionRange(paras, "Una lectura de conjunto");
  const summary = r ? paras.slice(r[0], r[1]).join("\n\n") : undefined;
  const withHeading = !baseAreas.length || baseAreas.some(a => { const h = paras.find(p => p.startsWith(`${a.id}. `)); return !!h && a.title.startsWith(`${h}. `); });
  const areas: ExternalHealthProfile["areas"] = [];
  paras.forEach((p, i) => {
    const m = /^(R\d+)\.\s+(.+)$/.exec(p);
    if (!m || !paras[i + 2]?.startsWith("Fundamento:")) return;
    const t = /^(Conocer|Contrastar|Abordar)\.\s+([\s\S]+)$/.exec(paras[i + 1] ?? "");
    if (!t) return;
    const fundamento = paras[i + 2].slice("Fundamento:".length).trim().replace(/\.$/, "");
    areas.push({ id: m[1], title: withHeading ? `${m[1]}. ${m[2]}. ${t[2]}` : `${m[1]}. ${t[2]}`, rationale: `${t[1]} · Deriva de ${fundamento}` });
  });
  // Un apartado identificado puede estar vacío. Si el texto es de un formato
  // antiguo y no ofrece ese apartado, el llamador conserva los campos aportados.
  const hasConclusions = findings.length > 0 || paras.some(p => /^\d{1,2}\.\s+Conclusiones\b/i.test(p));
  const hasRecommendations = areas.length > 0 || paras.some(p => /^\d{1,2}\.\s+Recomendaciones\b/i.test(p));
  return { summary, findings: hasConclusions ? findings : undefined, areas: hasRecommendations ? areas : undefined };
}
