import type { ExternalHealthProfile, ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";

/**
 * Organiza el contenido de un perfil externo para el dashboard de la pestaña 2.
 * No calcula, no infiere ni reordena por importancia: solo agrupa lo aportado
 * en el perfil (resultados por tema, recomendaciones por tipo) y elige como
 * cifras destacadas los primeros resultados vigentes con valor numérico, en el
 * orden en que el perfil los entrega.
 */

export interface DashboardTopic {
  topic: string;
  results: ProfileResult[];
  /** Escala común por unidad dentro del tema, para que las barras sean comparables. */
  scaleByUnit: Record<string, number>;
}

export type RecommendationType = "Conocer" | "Contrastar" | "Abordar";

export interface DashboardRecommendation {
  id: string;
  text: string;
  derivesFrom?: string;
}

export interface DashboardRecommendationGroup {
  type: RecommendationType | "Otras";
  items: DashboardRecommendation[];
}

const RECOMMENDATION_TYPES: RecommendationType[] = ["Conocer", "Contrastar", "Abordar"];

export function headlineResults(results: ProfileResult[], max = 6): ProfileResult[] {
  return results.filter((r) => r.chartValue !== undefined && r.temporalContext !== "historical").slice(0, max);
}

export function groupResultsByTopic(results: ProfileResult[]): DashboardTopic[] {
  const order: string[] = [];
  const byTopic = new Map<string, ProfileResult[]>();
  for (const result of results) {
    const topic = result.topic?.trim() || "Otros resultados";
    if (!byTopic.has(topic)) { byTopic.set(topic, []); order.push(topic); }
    byTopic.get(topic)!.push(result);
  }
  return order.map((topic) => {
    const list = byTopic.get(topic)!;
    const scaleByUnit: Record<string, number> = {};
    for (const r of list) {
      if (r.chartValue === undefined) continue;
      const max = Math.max(r.chartValue, r.comparison?.value ?? 0);
      scaleByUnit[r.unit] = Math.max(scaleByUnit[r.unit] ?? 0, max);
    }
    return { topic, results: list, scaleByUnit };
  });
}

/**
 * Lee el tipo de recomendación cuando el perfil lo declara al inicio de la
 * justificación («Conocer · Deriva de C2»); en otro caso, la deja en «Otras».
 */
export function groupRecommendations(areas: ExternalHealthProfile["areas"]): DashboardRecommendationGroup[] {
  const groups = new Map<DashboardRecommendationGroup["type"], DashboardRecommendation[]>();
  for (const area of areas) {
    const [head, ...rest] = area.rationale.split("·").map((part) => part.trim());
    const type = RECOMMENDATION_TYPES.find((t) => t.toLowerCase() === head?.toLowerCase());
    const derives = (type ? rest.join(" · ") : area.rationale).replace(/^deriva de\s*/i, "").trim();
    const key = type ?? "Otras";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ id: area.id, text: area.title, ...(derives ? { derivesFrom: derives } : {}) });
  }
  const ordered: DashboardRecommendationGroup["type"][] = [...RECOMMENDATION_TYPES, "Otras"];
  return ordered.filter((t) => groups.has(t)).map((type) => ({ type, items: groups.get(type)! }));
}

export interface DataPageResults {
  whoLivesHere: ProfileResult[];
  inequality: ProfileResult[];
  healthPanel: ProfileResult[];
}

const norm = (s: string | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/**
 * Reparte los resultados entre las páginas de datos (Art. 17 ter) según el
 * tema que declara el perfil: «Quién vive aquí», «Desigualdad» y, el resto,
 * el panel de salud, en el orden en que el perfil los entrega.
 */
export function splitDataPageResults(results: ProfileResult[]): DataPageResults {
  const out: DataPageResults = { whoLivesHere: [], inequality: [], healthPanel: [] };
  for (const r of results) {
    const topic = norm(r.topic);
    if (topic === "quien vive aqui") out.whoLivesHere.push(r);
    else if (topic === "desigualdad") out.inequality.push(r);
    else out.healthPanel.push(r);
  }
  return out;
}

export type Comparator = { label: string; value: number };

/** Ámbitos de comparación de un resultado: la lista explícita o, en su defecto, la comparación única. */
export function comparatorsOf(result: ProfileResult): Comparator[] {
  if (result.comparisons?.length) return result.comparisons;
  return result.comparison ? [result.comparison] : [];
}

const GEO_ORDER = [/distrito/i, /provincia|granada/i, /andaluc/i, /espa[ñn]a/i];

/**
 * Ámbitos geográficos que aparecen como comparadores, en orden Distrito,
 * provincia, Andalucía y España. Los que empiezan por el nombre del municipio
 * («Loja, 2010») son el propio municipio en otro momento, no un ámbito.
 */
export function geographicComparators(results: ProfileResult[], municipalityName: string): string[] {
  const own = norm(municipalityName);
  const labels: string[] = [];
  for (const r of results) for (const c of comparatorsOf(r)) {
    if (norm(c.label).startsWith(own) || labels.includes(c.label)) continue;
    labels.push(c.label);
  }
  const rank = (l: string) => { const i = GEO_ORDER.findIndex((re) => re.test(l)); return i < 0 ? GEO_ORDER.length : i; };
  return labels.map((l, i) => ({ l, i })).sort((a, b) => rank(a.l) - rank(b.l) || a.i - b.i).map((x) => x.l);
}

export interface SectionMetric {
  title: string;
  unit: string;
  rows: Array<{ section: string; value: number; display: string }>;
  references: Comparator[];
}

/** Indicadores por sección censal (ámbito «Sección censal …»), agrupados por indicador en el orden del perfil. */
export function sectionMetrics(results: ProfileResult[]): SectionMetric[] {
  const out: SectionMetric[] = [];
  for (const r of results) {
    if (!/^secci[oó]n/i.test(r.scale ?? "") || r.chartValue === undefined) continue;
    let metric = out.find((m) => m.title === r.title);
    if (!metric) { metric = { title: r.title, unit: r.unit, rows: [], references: comparatorsOf(r) }; out.push(metric); }
    metric.rows.push({ section: (r.scale ?? "").replace(/^secci[oó]n( censal)?\s*/i, "").trim(), value: r.chartValue, display: r.value });
  }
  return out;
}

/** Formato literal del perfil para valores de comparación (coma decimal, punto de millar). */
export function formatComparisonValue(value: number): string {
  // Punto de millar también en cifras de cuatro dígitos (2.718,19), como en los perfiles.
  const [int, frac] = Math.abs(value).toFixed(2).replace(/\.?0+$/, "").split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 ? "-" : ""}${grouped}${frac ? `,${frac}` : ""}`;
}
