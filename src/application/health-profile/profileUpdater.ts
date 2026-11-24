/**
 * Actualizador de perfiles (CONTRACT-PROFILE-UPDATER).
 *
 * Aplica a un expediente un conjunto de cambios declarados y devuelve una nueva
 * revisión «en revisión» de su Perfil vigente, con la lista de cambios. No toca
 * la revisión vigente ni el texto de autoría humana fuera de las páginas de
 * datos compiladas. Es una función pura: la descarga, la persistencia y la
 * validación quedan fuera.
 */
import type { ExternalHealthProfile, ExternalProfileLibrary } from "../../domain/health-profile/ExternalHealthProfile";
import type { TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";
import { latestSnapshot } from "../territorial-statistics/snapshots";
import { mergeTerritorialResults, REVISION_TOPIC } from "../territorial-statistics/revisionPackage";
import { COMPILED_CONTEXT_MARK, compileDataPages } from "../territorial-statistics/compiledDataPages";
import { DATA_PAGE_HEADINGS } from "./profileStructure";
import {
  applyTextPackage, bindingReviewCheck, conditionReviewCheck, dependentRecommendations,
  deriveProfileFields, evaluateConditions, refreshBindings, type ProfileTextPackage,
} from "./profileTextOperations";
import type { ProfileBinding, ProfileCondition, ProfileReviewFlag } from "../../domain/health-profile/ExternalHealthProfile";

export type ProfileUpdateKind = "paginas-datos" | "indicadores" | "rotulos" | "cifras-conclusiones" | "paquete-texto" | "campos-derivados";

export const PROFILE_UPDATE_LABEL: Record<ProfileUpdateKind, string> = {
  rotulos: "Rótulos y temas del modelo de determinantes sociales (contrato 2.5.0)",
  "paginas-datos": "Páginas de datos compiladas desde la última descarga",
  indicadores: "Indicadores de la descarga en los resultados del Perfil",
  "cifras-conclusiones": "Cifras enlazadas de las conclusiones y comprobación de sus condiciones",
  "paquete-texto": "Texto del cuerpo desde un paquete redactado fuera de COMPÁS",
  "campos-derivados": "Resumen, conclusiones y recomendaciones del paquete a partir del texto",
};

export interface ProfileUpdateInput {
  library: ExternalProfileLibrary;
  snapshots?: TerritorialStatisticsSnapshot[];
  kinds: ProfileUpdateKind[];
  /** Paquete de texto (capa 3), necesario si se elige «paquete-texto». */
  textPackage?: ProfileTextPackage;
  author: string;
  now: Date;
  newId: () => string;
}

export interface ProfileUpdateResult {
  base?: ExternalHealthProfile;
  profile?: ExternalHealthProfile;
  changes: string[];
  /** Motivo por el que no se puede actualizar este expediente. */
  blocked?: string;
}

const LEGACY_TOPIC: Record<string, string> = {
  "quien vive aqui": REVISION_TOPIC["contexto-poblacion"],
  desigualdad: REVISION_TOPIC["ejes-desigualdad"],
  "determinantes sociales": REVISION_TOPIC["condiciones-vida"],
};
const norm = (s: string | undefined) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const dmy = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Siguiente número de revisión: sube la versión menor («0.8.2» → «0.9.0»); una
 * corrección que no cambia el texto sube solo la de corrección («0.9.0» → «0.9.1»).
 */
export function nextRevisionNumber(title: string, correction = false): { from?: string; to?: string } {
  const m = /revisión\s+(\d+)\.(\d+)(?:\.(\d+))?/i.exec(title);
  if (!m) return {};
  const from = m[0].replace(/^revisión\s+/i, "");
  return { from, to: correction ? `${m[1]}.${m[2]}.${Number(m[3] ?? 0) + 1}` : `${m[1]}.${Number(m[2]) + 1}.0` };
}

type Page = "cover" | "contexto" | "ejes" | "condiciones" | "servicios" | "salud";
const HEADING: Record<Exclude<Page, "cover">, string> = {
  contexto: "Contexto y población", ejes: "Ejes de desigualdad", condiciones: "Condiciones de vida", servicios: "Servicios", salud: "Salud y bienestar",
};
function pageOf(paragraph: string): Page | undefined {
  const line = paragraph.trim();
  if (/^[A-ZÁÉÍÓÚÑ][^.\n]{1,40} en datos$/.test(line)) return "cover";
  if (DATA_PAGE_HEADINGS.whoLivesHere.test(line)) return "contexto";
  if (DATA_PAGE_HEADINGS.inequality.test(line)) return "ejes";
  if (DATA_PAGE_HEADINGS.livingConditions.test(line)) return "condiciones";
  if (DATA_PAGE_HEADINGS.services.test(line)) return "servicios";
  if (DATA_PAGE_HEADINGS.healthPanel.test(line)) return "salud";
  return undefined;
}

/**
 * Reordena y compila las páginas de datos del texto. Las páginas se buscan solo
 * antes del primer apartado numerado del cuerpo; los anexos no se tocan.
 */
export function rebuildDataPages(text: string, snapshot: TerritorialStatisticsSnapshot | undefined, compile: boolean, renameOnly: boolean) {
  const paras = text.split("\n\n");
  const bodyStart = paras.findIndex(p => /^\d{1,2}\.\s+\S/.test(p.trim()) && !/^\d+\.\s*$/.test(p.trim()));
  const end = bodyStart < 0 ? paras.length : bodyStart;
  const head: string[] = [];
  const pages = new Map<Page, string[]>();
  const order: Page[] = [];
  let current: Page | undefined;
  for (let i = 0; i < end; i++) {
    const p = paras[i];
    const page = pageOf(p);
    if (page) { current = page; if (!pages.has(page)) { pages.set(page, []); order.push(page); } if (page === "cover") pages.get(page)!.push(p); continue; }
    if (current) pages.get(current)!.push(p); else head.push(p);
  }
  const notes: string[] = [];
  if (renameOnly && !compile) {
    // Solo rótulos: se renombran en su sitio, sin reordenar.
    const out = paras.slice(0, end).map(p => { const pg = pageOf(p); return pg && pg !== "cover" ? HEADING[pg] : p; });
    const renamed = paras.slice(0, end).some((p, i) => p !== out[i]);
    if (renamed) notes.push("Rótulos de las páginas de datos adaptados al modelo de determinantes sociales.");
    return { text: [...out, ...paras.slice(end)].join("\n\n"), notes, references: [] as string[] };
  }
  const compiled = snapshot && compile ? compileDataPages(snapshot) : undefined;
  const block = (page: Page): string[] => {
    const own = pages.get(page) ?? [];
    if (!compiled) return own;
    if (page === "contexto") {
      const at = own.findIndex(p => p.startsWith(COMPILED_CONTEXT_MARK));
      const kept = at < 0 ? own : own.slice(0, at);
      return [...kept, ...compiled.contexto];
    }
    if (page === "ejes") { if (own.length) notes.push(`Página «${HEADING.ejes}» compilada desde la descarga del ${snapshot!.retrievedAt.slice(0, 10)}; sustituye a la anterior («Desigualdad»).`); return compiled.ejes; }
    if (page === "condiciones") return compiled.condiciones;
    if (page === "servicios") return compiled.servicios;
    return own;
  };
  const out: string[] = [...head];
  if (pages.has("cover")) out.push(...pages.get("cover")!);
  for (const page of ["contexto", "ejes", "condiciones", "servicios", "salud"] as const) {
    const content = block(page);
    if (!content.length && !pages.has(page)) continue;
    out.push(HEADING[page], ...content);
  }
  if (compiled) notes.push("Páginas «Contexto y población» (bloque de datos), «Ejes de desigualdad», «Condiciones de vida» y «Servicios» compiladas desde la descarga, con tablas y frases descriptivas con su fuente.");
  return { text: [...out, ...paras.slice(end)].join("\n\n"), notes, references: compiled?.references ?? [] };
}

/** Añade al apartado «Referencias» las que falten, sin duplicar etiquetas existentes. */
function addReferences(text: string, refs: string[]): { text: string; added: number } {
  if (!refs.length) return { text, added: 0 };
  const paras = text.split("\n\n");
  const at = paras.findIndex(p => /^Referencias$/i.test(p.trim()));
  if (at < 0) return { text, added: 0 };
  const has = new Set(paras.map(p => /^([TB]\d+)\./.exec(p.trim())?.[1]).filter(Boolean) as string[]);
  const missing = refs.filter(r => !has.has(/^([TB]\d+)\./.exec(r)![1]));
  if (!missing.length) return { text, added: 0 };
  // Tras la última referencia contigua al rótulo.
  let end = at + 1;
  while (end < paras.length && !/^Anexo [A-Z]\./.test(paras[end].trim())) end++;
  paras.splice(end, 0, ...missing);
  return { text: paras.join("\n\n"), added: missing.length };
}

/** Cambia el número de revisión en la portada del texto («Revisión 0.8.2 · 17/11/2026»). */
function bumpCoverRevision(text: string, from: string | undefined, to: string | undefined, date: string) {
  if (!from || !to) return text;
  const re = new RegExp(`Revisión ${from.replace(/\./g, "\\.")} · \\d{2}/\\d{2}/\\d{4}`);
  return text.replace(re, `Revisión ${to} · ${date}`);
}

function appendAuthorship(text: string, line: string): string {
  const paras = text.split("\n\n");
  const at = paras.findIndex(p => /^\d{1,2}\.\s+Autoría/i.test(p.trim()));
  if (at < 0) return text;
  let end = at + 1;
  while (end < paras.length && !/^(\d{1,2}\.\s|Anexo [A-Z]\.|Referencias$)/i.test(paras[end].trim())) end++;
  paras.splice(end, 0, line);
  return paras.join("\n\n");
}

export function buildProfileUpdate(input: ProfileUpdateInput): ProfileUpdateResult {
  const { library, kinds } = input;
  const base = library.profiles.find(p => p.id === library.activeId);
  if (!base) return { changes: [], blocked: "El expediente no tiene Perfil vigente." };
  const pending = library.profiles.filter(p => p.revisionOf === base.id && p.status === "review" && !p.archivedAt);
  const snapshot = latestSnapshot(input.snapshots);
  if ((kinds.includes("paginas-datos") || kinds.includes("indicadores") || kinds.includes("cifras-conclusiones")) && !snapshot) return { base, changes: [], blocked: "El expediente no tiene ninguna descarga de estadística territorial guardada." };
  const changes: string[] = [];
  const indicatorIssues: string[] = [];
  let text = base.text;
  let results = base.results;
  let bindings: ProfileBinding[] | undefined = base.bindings;
  let conditions: ProfileCondition[] | undefined = base.conditions;
  const baseFlags = base.reviewFlags ?? [];
  let flags = baseFlags;
  const date = dmy(input.now);

  if (kinds.includes("paquete-texto")) {
    const entry = input.textPackage?.entries.find(e => e.municipalityId === base.municipalityId);
    if (!entry) return { base, changes: [], blocked: "El paquete de texto no trae operaciones para este expediente." };
    if (entry.baseTitle.trim() !== base.title.trim()) return { base, changes: [], blocked: `El paquete se redactó sobre «${entry.baseTitle}» y la revisión vigente es «${base.title}».` };
    const r = applyTextPackage({ text, bindings, conditions }, entry);
    if (r.problems.length) return { base, changes: r.changes, blocked: `El paquete no se puede aplicar: ${r.problems.join(" ")}` };
    text = r.text; bindings = r.bindings; conditions = r.conditions;
    changes.push(`Paquete de texto (${input.textPackage!.createdAt.slice(0, 10)}): ${r.changes.join(" ")}`);
  }

  if (kinds.includes("paginas-datos") || kinds.includes("rotulos")) {
    const r = rebuildDataPages(text, snapshot, kinds.includes("paginas-datos"), kinds.includes("rotulos"));
    text = r.text;
    changes.push(...r.notes);
    const refs = addReferences(text, r.references);
    text = refs.text;
    if (refs.added) changes.push(`${refs.added} referencias nuevas en «Referencias».`);
  }
  if (kinds.includes("indicadores") && snapshot) {
    const merged = mergeTerritorialResults(snapshot, results);
    results = merged.results;
    const added = merged.changes.filter(c => c.kind === "añadido").length, updated = merged.changes.filter(c => c.kind === "actualizado").length;
    changes.push(`Indicadores: ${added} añadidos y ${updated} actualizados desde la descarga del ${snapshot.retrievedAt.slice(0, 10)}.`);
    for (const issue of merged.changes.filter(c => c.issue === "ambiguo")) {
      indicatorIssues.push(`Revisar «${issue.title}» (${issue.scale}). Hay varias filas compatibles en el Perfil.`);
    }
    changes.push(...indicatorIssues);
  }
  if (kinds.includes("rotulos")) {
    let retopic = 0;
    results = results.map(r => { const t = LEGACY_TOPIC[norm(r.topic)]; if (t && t !== r.topic) { retopic++; return { ...r, topic: t }; } return r; });
    if (retopic) changes.push(`${retopic} indicadores reasignados a las páginas del modelo nuevo.`);
  }
  if (kinds.includes("cifras-conclusiones") && snapshot) {
    const currentFlags: ProfileReviewFlag[] = [];
    const checked = [
      ...(bindings ?? []).map(bindingReviewCheck),
      ...(conditions ?? []).map(conditionReviewCheck),
    ];
    if (bindings?.length) {
      const r = refreshBindings(text, bindings, snapshot);
      text = r.text; bindings = r.bindings; currentFlags.push(...r.flags);
      if (r.changes.length) changes.push(`Cifras de las conclusiones actualizadas: ${r.changes.join(" ")}`);
    }
    if (conditions?.length) currentFlags.push(...evaluateConditions(conditions, snapshot));
    if (checked.length) {
      // Solo retirar una marca si su comprobación declarada se ha ejecutado.
      // Las marcas históricas sin identificador siguen visibles para el equipo.
      const retained = baseFlags.filter(({ check: previous }) => !previous || (
        previous.kind !== "recommendation" &&
        !checked.some(check => check.kind === previous.kind && check.key === previous.key)
      ));
      const marked = [...new Set([...retained, ...currentFlags].map(flag => flag.target).filter(target => /^C\d+$/.test(target)))];
      flags = [...retained, ...currentFlags, ...dependentRecommendations(text, marked)];
      const unique = new Map(flags.map(flag => [JSON.stringify([flag.target, flag.reason, flag.check]), flag]));
      flags = [...unique.values()];
      if (flags.length && !same(flags, baseFlags)) {
        changes.push(`Para revisar: ${[...new Set(flags.map(flag => flag.target))].join(", ")}.`);
      } else if (!flags.length && baseFlags.length) {
        changes.push("Las comprobaciones repetidas resolvieron las marcas de revisión.");
      }
    }
  }
  // Resumen, conclusiones y recomendaciones del paquete siguen al texto (CONTRACT-PROFILE-UPDATER §8).
  let derived: { summary: string; findings: string[]; areas: ExternalHealthProfile["areas"] } = { summary: base.summary, findings: base.findings, areas: base.areas };
  if (text !== base.text || kinds.includes("campos-derivados")) {
    const d = deriveProfileFields(text, base.areas);
    const original = text === base.text ? d : deriveProfileFields(base.text, base.areas);
    const next = {
      summary: d.summary ?? (original.summary === undefined ? base.summary : ""),
      findings: d.findings ?? (original.findings === undefined ? base.findings : []),
      areas: d.areas ?? (original.areas === undefined ? base.areas : []),
    };
    const touched = [!same(next.summary, base.summary) ? "resumen (lectura de conjunto)" : "", !same(next.findings, base.findings) ? `conclusiones (${next.findings.length})` : "", !same(next.areas, base.areas) ? `recomendaciones (${next.areas.length})` : ""].filter(Boolean);
    if (touched.length) { derived = next; changes.push(`Campos del paquete derivados del texto: ${touched.join(", ")}.`); }
  }
  // Las notas de revisiones anteriores nombraban el PDF por número de revisión, que no es el de los
  // archivos adjuntos cuando la revisión de partida también salió del actualizador. Se nombran los archivos.
  const attachmentNames = base.attachmentIds.map(id => library.attachments.find(a => a.id === id)?.name).filter((n): n is string => !!n);
  const filesSentence = attachmentNames.length ? `Los archivos originales adjuntos (${attachmentNames.join(", ")}) no contienen estos cambios.` : "Esta revisión no tiene archivos originales adjuntos.";
  const OLD_PDF_SENTENCE = /El PDF original adjunto corresponde a la revisión [\d.]+ y no contiene estos cambios\./;
  const limitations = base.limitations.filter(Boolean).map(l => OLD_PDF_SENTENCE.test(l) ? l.replace(OLD_PDF_SENTENCE, filesSentence) : l);
  const limitationsFixed = limitations.some((l, i) => l !== base.limitations.filter(Boolean)[i]);
  if (limitationsFixed && kinds.includes("campos-derivados")) changes.push("Notas de limitaciones: los archivos originales adjuntos se nombran por su nombre.");
  const derivedChanged = derived.summary !== base.summary || derived.findings !== base.findings || derived.areas !== base.areas || (limitationsFixed && kinds.includes("campos-derivados"));
  const linksChanged = !same(bindings, base.bindings) || !same(conditions, base.conditions);
  const resultsChanged = !same(results, base.results);
  const flagsChanged = !same(flags, baseFlags);
  if (text === base.text && !resultsChanged && !linksChanged && !flagsChanged && !derivedChanged) {
    return { base, changes: indicatorIssues, blocked: "Los cambios elegidos no modifican este Perfil." };
  }

  const { from, to } = nextRevisionNumber(base.title, text === base.text && !resultsChanged && !linksChanged);
  const title = to ? base.title.replace(/revisión\s+\d+\.\d+(?:\.\d+)?\s*·\s*\d{2}\/\d{2}\/\d{4}/i, `revisión ${to} · ${date}`) : `${base.title} · actualización ${date}`;
  text = bumpCoverRevision(text, from, to, date);
  text = appendAuthorship(text, `Revisión ${to ?? "actualizada"}, ${date}, generada con el Actualizador de perfiles de COMPÁS a partir de la revisión ${from ?? "anterior"}: ${changes.join(" ")} El resto del texto no cambia. Pendiente de revisión técnica.`);
  const usesStatistics = kinds.some(k => k === "paginas-datos" || k === "indicadores" || k === "cifras-conclusiones");
  const note = (snapshot && usesStatistics
    ? `Revisión ${to ?? ""} generada por el Actualizador de perfiles el ${date} con la estadística territorial descargada el ${snapshot.retrievedAt.slice(0, 10)}. ${filesSentence}`
    : `Revisión ${to ?? ""} generada por el Actualizador de perfiles el ${date}. ${filesSentence}`).replace(/\s+/g, " ");
  if (pending.length) changes.push(`Atención: ya hay ${pending.length} revisión en curso sobre la vigente; esta se añade aparte.`);
  const profile: ExternalHealthProfile = {
    ...structuredClone(base),
    id: input.newId(),
    revisionOf: base.id,
    createdAt: input.now.toISOString(),
    status: "review",
    validatedBy: undefined, validatedAt: undefined, archivedAt: undefined, archivedBy: undefined,
    // La revisión nueva se presenta como menú sin elegir (CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY §7.1).
    choices: undefined,
    title,
    period: base.period.replace(/Revisión\s+\d+\.\d+(?:\.\d+)?\s*·\s*\d{2}\/\d{2}\/\d{4}/i, `Revisión ${to ?? ""} · ${date}`),
    text,
    results,
    summary: derived.summary,
    findings: derived.findings,
    areas: derived.areas,
    limitations: [...limitations, note],
    ...(bindings ? { bindings } : {}),
    ...(conditions ? { conditions } : {}),
    reviewFlags: flags,
  };
  return { base, profile, changes };
}
