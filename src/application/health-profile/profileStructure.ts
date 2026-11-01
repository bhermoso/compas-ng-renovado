/**
 * Estructura de un Perfil de Salud Local elaborado fuera de COMPÁS, reconocida
 * en su texto extraído (PDF, DOCX, TXT o Markdown).
 *
 * Es una lectura literal: identifica apartados, párrafos, conclusiones (C1…),
 * recomendaciones (R1…, con su tipo cuando el documento lo declara),
 * referencias y cifras citadas en el resumen, sin reescribir, resumir ni
 * inferir contenido. Si el documento no sigue la estructura RELAS, devuelve lo
 * que pueda reconocer y el resto queda como texto.
 */

export type ProfileRecommendationType = "Conocer" | "Contrastar" | "Abordar";

export interface ProfileSection {
  id: string;
  title: string;
  level: 1 | 2;
  paragraphs: string[];
}

export interface ProfileConclusion {
  id: string;
  title: string;
  body: string[];
  leadsTo?: string;
}

export interface ProfileRecommendation {
  id: string;
  type?: ProfileRecommendationType;
  text: string;
  derivesFrom?: string;
}

export interface ProfileKeyFigure {
  value: string;
  unit: string;
  sentence: string;
  citation?: string;
}

export interface ProfileStructure {
  sections: ProfileSection[];
  summary: string[];
  conclusions: ProfileConclusion[];
  recommendations: ProfileRecommendation[];
  references: string[];
  keyFigures: ProfileKeyFigure[];
  pages?: number;
}

const TYPES: ProfileRecommendationType[] = ["Conocer", "Contrastar", "Abordar"];
const TERMINAL = /[.:;!?»)\]]$/;

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "apartado";

/** «C O N O C E R» → «CONOCER». */
const unspace = (s: string) => (/^(?:[A-ZÁÉÍÓÚÑ] ){2,}[A-ZÁÉÍÓÚÑ]\b/.test(s) ? s.replace(/^((?:[A-ZÁÉÍÓÚÑ] )+[A-ZÁÉÍÓÚÑ])/, (m) => m.replace(/ /g, "")) : s);

function headingOf(block: string): { title: string; level: 1 | 2 } | null {
  const line = block.replace(/\s+/g, " ").trim();
  if (line.length > 80 || /[.,;:]$/.test(line)) return null;
  if (/^(Resumen|Anexos|Portada y créditos|Referencias|Índice)$/i.test(line)) return { title: line, level: 1 };
  const numbered = /^(\d{1,2})\.?\s+([A-ZÁÉÍÓÚÑ¿][^.]{2,76})$/.exec(line);
  if (numbered && !/^\d+\.º/.test(line) && !/\d{4}/.test(numbered[2])) return { title: `${numbered[1]}. ${numbered[2].trim()}`, level: 1 };
  const annex = /^([A-K])\.\s+([A-ZÁÉÍÓÚÑ][^.]{2,76})$/.exec(line);
  if (annex) return { title: `${annex[1]}. ${annex[2].trim()}`, level: 2 };
  return null;
}

/** Bloques del texto, sin marcas de página, números de página ni cabeceras repetidas. */
function blocksOf(text: string): { blocks: string[]; fromPdf: boolean; pages?: number } {
  const pageMarks = text.match(/\[Página \d+\]/g);
  const raw = text.replace(/\r/g, "").split(/\n\s*\n|\n(?=\[Página \d+\])/).map((b) => b.replace(/\s+$/g, "").replace(/^\s+/g, "")).filter(Boolean);
  // Un número suelto es número de página solo si cierra una página del PDF.
  const cleaned = raw
    .filter((b, i) => !(pageMarks && /^\d{1,3}$/.test(b) && (i === raw.length - 1 || /^\[Página \d+\]/.test(raw[i + 1] ?? ""))))
    .map((b) => b.replace(/^\[Página \d+\]\s*/, ""))
    .filter(Boolean);
  const counts = new Map<string, number>();
  for (const b of cleaned) if (b.length < 120) counts.set(b, (counts.get(b) ?? 0) + 1);
  const repeated = new Set([...counts].filter(([b, n]) => n >= 3 && !/^(C|R)\d+$/.test(b) && !/^Deriva de/.test(b) && !headingOf(b)).map(([b]) => b));
  return { blocks: cleaned.filter((b) => !repeated.has(b)), fromPdf: !!pageMarks, pages: pageMarks?.length };
}

const startsStructure = (b: string) => /^(C|R)\d+\b/.test(b) || /^Tipo\s{2,}Recomendaci/.test(b) || /^(Deriva de|Lleva a)\b/.test(b) || /^[•·\-–]\s/.test(b) || !!headingOf(b) || TYPES.some((t) => unspace(b).toUpperCase().startsWith(t.toUpperCase()));

/** Recompone párrafos partidos por la maquetación del PDF. */
function reflow(blocks: string[]): string[] {
  const lengths = blocks.map((b) => b.length).sort((a, b) => a - b);
  const typical = lengths[Math.floor(lengths.length * 0.9)] ?? 80;
  const out: string[] = [];
  let prevLen = 0;
  for (const b of blocks) {
    const last = out[out.length - 1];
    const endsRow = last !== undefined && (/\s{2,}C\d+(?:,\s*C\d+)*$/.test(last) || /^Tipo\s{2,}Recomendaci/.test(last));
    const join = last !== undefined && !endsRow && !startsStructure(b) && !headingOf(last) && !(TERMINAL.test(last.trimEnd()) && prevLen < typical * 0.85);
    if (join) out[out.length - 1] = last.endsWith("-") ? last.slice(0, -1) + b : `${last} ${b}`;
    else out.push(b);
    prevLen = b.length;
  }
  return out.map((p) => p.replace(/[ \t]{2,}/g, (m) => (m.length >= 3 ? "   " : " ")).trim());
}

function splitTitle(paragraph: string): { title: string; rest: string } {
  const triple = paragraph.indexOf("   ");
  if (triple > 10 && triple < 260) return { title: paragraph.slice(0, triple).trim(), rest: paragraph.slice(triple).trim() };
  const m = /^(.{12,260}?[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿«])/.exec(paragraph);
  return m ? { title: m[1].trim(), rest: paragraph.slice(m[0].length).trim() } : { title: paragraph.trim(), rest: "" };
}

const clean = (s: string) => s.replace(/\s{2,}/g, " ").trim();

function parseConclusions(paragraphs: string[]): ProfileConclusion[] {
  const out: ProfileConclusion[] = [];
  for (const p of paragraphs) {
    const head = /^C(\d+)[.\s]\s*(.*)$/s.exec(p);
    if (head && head[2].length > 8) {
      const { title, rest } = splitTitle(head[2]);
      out.push({ id: `C${head[1]}`, title: clean(title), body: rest ? [clean(rest)] : [] });
      continue;
    }
    const current = out[out.length - 1];
    if (!current) continue;
    const leads = /^Lleva a\s+(.+?)(?:\s*·.*)?\.?$/.exec(p) ?? /\bLleva a\s+(R\d+(?:(?:,\s*| y )R\d+)*)\.?\s*$/.exec(p);
    if (leads) {
      current.leadsTo = leads[1].replace(/\.$/, "").trim();
      const before = p.slice(0, p.indexOf(leads[0])).trim();
      if (before && !/^Tipo:/.test(before)) current.body.push(clean(before));
      continue;
    }
    if (/^Tipo:\s/.test(p)) continue;
    current.body.push(clean(p));
  }
  return out;
}

function parseRecommendations(paragraphs: string[]): ProfileRecommendation[] {
  const out: ProfileRecommendation[] = [];
  let group: ProfileRecommendationType | undefined;
  let current: ProfileRecommendation | undefined;
  for (const raw of paragraphs) {
    const p = unspace(raw);
    if (/^Tipo\s+Recomendaci/i.test(p)) continue;
    const groupHead = TYPES.find((t) => p.toUpperCase().startsWith(t.toUpperCase()) && (p.length === t.length || /\s{2,}|\s[A-ZÁÉÍÓÚ]/.test(p.slice(t.length, t.length + 3))));
    if (groupHead && !/^R\d/.test(p)) { group = groupHead; current = undefined; continue; }
    // El tipo solo cuenta como columna (seguido de dos o más espacios): «Contrastar con…» es texto.
    const item = /^R(\d+)\b\s*(?:(Conocer|Contrastar|Abordar)(?=\s{2,}|$)\s*)?(.*)$/s.exec(p);
    if (item) {
      const trailing = /^(.*?)\s{2,}(C\d+(?:,\s*C\d+)*)$/.exec(item[3].trim());
      current = {
        id: `R${item[1]}`,
        type: (item[2] as ProfileRecommendationType | undefined) ?? group,
        text: clean(trailing ? trailing[1] : item[3]),
        ...(trailing ? { derivesFrom: trailing[2] } : {}),
      };
      out.push(current);
      continue;
    }
    if (!current) continue;
    const derives = /^(?:Deriva de\s+)?(C\d+(?:(?:,\s*| y )C\d+)*)\.?$/.exec(p.trim());
    if (derives) { current.derivesFrom = derives[1]; current = undefined; continue; }
    const inlineDerives = /^(.*?)\s+(C\d+(?:,\s*C\d+)*)$/.exec(p.trim());
    if (inlineDerives && inlineDerives[1] && !current.derivesFrom) { current.text = clean(`${current.text} ${inlineDerives[1]}`); current.derivesFrom = inlineDerives[2]; current = undefined; continue; }
    current.text = clean(`${current.text} ${p}`);
  }
  return out.filter((r) => r.text.length > 5);
}

const FIGURE = /(?<![\d[,])(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s?(%|euros?|€|habitantes|personas|vecinas y vecinos|hogares|años|km²|metros)?/g;

const UNIT_PRIORITY: Record<string, number> = { "%": 5, "€": 4, euros: 4, euro: 4, habitantes: 3, personas: 3, "vecinas y vecinos": 3, hogares: 3, "km²": 2, metros: 2, años: 1, "": 0 };

/** Una cifra por frase del resumen, la más informativa (porcentaje > euros > recuento > años). */
export function keyFiguresFrom(summary: string[], max = 6): ProfileKeyFigure[] {
  const out: ProfileKeyFigure[] = [];
  const seen = new Set<string>();
  for (const paragraph of summary) {
    for (const sentence of paragraph.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿«])/)) {
      const withoutCitations = sentence.replace(/\[[^\]]*\]/g, (m) => " ".repeat(m.length));
      FIGURE.lastIndex = 0;
      let best: { value: string; unit: string; rank: number } | undefined;
      let match: RegExpExecArray | null;
      while ((match = FIGURE.exec(withoutCitations))) {
        const [, value, unit = ""] = match;
        if (!unit && (/^(19|20)\d{2}$/.test(value) || Number(value.replace(/\./g, "").replace(",", ".")) < 10)) continue;
        const rank = UNIT_PRIORITY[unit] ?? 0;
        if (!best || rank > best.rank) best = { value, unit, rank };
      }
      if (!best || seen.has(`${best.value}${best.unit}`)) continue;
      seen.add(`${best.value}${best.unit}`);
      const citation = sentence.match(/\[[^\]]+\]/g)?.join(" ");
      out.push({ value: best.value, unit: best.unit, sentence: sentence.trim(), ...(citation ? { citation } : {}) });
      if (out.length >= max) return out;
    }
  }
  return out;
}

const TILE_VALUE = /^(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s?(%|€)?$/;
const CITATION_ONLY = /^(\[[^\]]+\]\s*)+$/;

/**
 * Cifras destacadas maquetadas como fichas en el resumen (valor, rótulo y
 * cita en párrafos sucesivos). Devuelve las fichas y el resumen sin ellas.
 */
function extractTiles(summary: string[]): { tiles: ProfileKeyFigure[]; prose: string[] } {
  const tiles: ProfileKeyFigure[] = [];
  const prose: string[] = [];
  for (let i = 0; i < summary.length; i++) {
    const value = TILE_VALUE.exec(summary[i].trim());
    const label = summary[i + 1];
    if (value && label && label.length < 120 && !TILE_VALUE.test(label.trim())) {
      let sentence = label.trim();
      let citation: string | undefined;
      const inline = sentence.match(/\s*((?:\[[^\]]+\]\s*)+)$/);
      if (inline) { citation = inline[1].trim(); sentence = sentence.slice(0, inline.index).trim(); }
      let skip = 1;
      if (!citation && summary[i + 2] && CITATION_ONLY.test(summary[i + 2].trim())) { citation = summary[i + 2].trim(); skip = 2; }
      tiles.push({ value: value[1], unit: value[2] ?? "", sentence, ...(citation ? { citation } : {}) });
      i += skip;
      continue;
    }
    // Ficha en una sola línea (PDF): «843 habitantes en 2025 [1]».
    const oneLine = /^(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s?(%|€)?\s+([^.]{3,100}?)\s*((?:\[[^\]]+\]\s*)*)$/.exec(summary[i].trim());
    if (oneLine && summary[i].length < 130) {
      tiles.push({ value: oneLine[1], unit: oneLine[2] ?? "", sentence: oneLine[3].trim(), ...(oneLine[4].trim() ? { citation: oneLine[4].trim() } : {}) });
      continue;
    }
    prose.push(summary[i]);
  }
  return { tiles, prose };
}

export function parseProfileStructure(text: string): ProfileStructure {
  const { blocks, fromPdf, pages } = blocksOf(text);
  const paragraphs = fromPdf ? reflow(blocks) : blocks.map((b) => b.replace(/\s+/g, " ").trim());
  const sections: ProfileSection[] = [];
  const used = new Set<string>();
  let current: ProfileSection = { id: "inicio", title: "Inicio", level: 1, paragraphs: [] };
  for (const p of paragraphs) {
    const h = headingOf(p);
    if (h) {
      if (current.paragraphs.length || current.id !== "inicio") sections.push(current);
      let id = slug(h.title);
      while (used.has(id)) id = `${id}-2`;
      used.add(id);
      current = { id, title: h.title, level: h.level, paragraphs: [] };
    } else {
      current.paragraphs.push(p);
    }
  }
  sections.push(current);

  const find = (re: RegExp) => sections.find((s) => re.test(s.title));
  const { tiles, prose: summary } = extractTiles(find(/^resumen$/i)?.paragraphs ?? []);
  const conclusionsSection = find(/conclusiones/i);
  const recommendationsSection = find(/recomendaciones/i);
  const referencesSection = find(/referencias/i);
  return {
    sections: sections.filter((s) => s.paragraphs.length || s.level === 1),
    summary,
    conclusions: conclusionsSection ? parseConclusions(conclusionsSection.paragraphs) : [],
    recommendations: recommendationsSection ? parseRecommendations(recommendationsSection.paragraphs) : [],
    references: (referencesSection?.paragraphs ?? []).map((r) => r.replace(/^\d+\.\s*/, "").trim()).filter(Boolean),
    keyFigures: tiles.length >= 3 ? tiles.slice(0, 6) : keyFiguresFrom(summary),
    ...(pages ? { pages } : {}),
  };
}

export interface PrefillableProfileContent {
  title: string;
  summary: string;
  text: string;
  findings: string[];
  areas: Array<{ id: string; title: string; rationale: string }>;
}

/**
 * Completa, con lo reconocido en el texto, los campos que el archivo cargado
 * deja vacíos (resumen, conclusiones, recomendaciones y título). No sustituye
 * nada que ya venga informado, por ejemplo desde un paquete JSON. Devuelve
 * también qué se ha reconocido, para avisar antes de guardar.
 */
export function prefillFromStructure<T extends PrefillableProfileContent>(content: T): { content: T; recognized: { conclusions: number; recommendations: number; summary: boolean } } {
  if (!content.text.trim()) return { content, recognized: { conclusions: 0, recommendations: 0, summary: false } };
  const s = parseProfileStructure(content.text);
  const next = { ...content };
  // Título: la primera línea del documento que lo declara, antes de recomponer párrafos.
  const declaredTitle = content.text.slice(0, 2000).split(/\n/).map((l) => l.replace(/^\[Página \d+\]\s*/, "").trim()).find((l) => /^Perfil de Salud Local\b.{0,90}$/i.test(l) && !/[.:]$/.test(l));
  if (declaredTitle) next.title = declaredTitle;
  if ("period" in next && typeof (next as { period?: unknown }).period === "string" && !(next as { period: string }).period.trim()) {
    const version = /Versi[oó]n\s+\d+(?:\.\d+)*[^\n.]{0,60}/.exec(content.text.slice(0, 3000));
    if (version) (next as { period: string }).period = version[0].replace(/\s+/g, " ").replace(/[·,\s]+$/, "").trim();
  }
  const fillSummary = !content.summary.trim() && s.summary.length > 0;
  if (fillSummary) next.summary = s.summary.join("\n\n");
  const fillFindings = content.findings.filter(Boolean).length === 0 && s.conclusions.length > 0;
  if (fillFindings) next.findings = s.conclusions.map((c) => `${c.id}. ${c.title}`);
  const fillAreas = content.areas.length === 0 && s.recommendations.length > 0;
  if (fillAreas) {
    next.areas = s.recommendations.map((r) => ({
      id: r.id,
      title: `${r.id}. ${r.text}`,
      rationale: [r.type, r.derivesFrom ? `Deriva de ${r.derivesFrom}` : ""].filter(Boolean).join(" · "),
    }));
  }
  return {
    content: next,
    recognized: { conclusions: fillFindings ? s.conclusions.length : 0, recommendations: fillAreas ? s.recommendations.length : 0, summary: fillSummary },
  };
}
