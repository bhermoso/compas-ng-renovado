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

/** Formato literal del perfil para valores de comparación (coma decimal, punto de millar). */
export function formatComparisonValue(value: number): string {
  return value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
