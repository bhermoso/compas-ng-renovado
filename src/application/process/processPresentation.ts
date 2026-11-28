import type { MunicipalityWorkspace } from "../../domain/workspace";
import type { ExternalHealthProfile, ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";
import { milestoneKindLabel, sortMilestones, type ProcessMilestoneKind } from "../../domain/process/ProcessMilestone";
import { isStoredProcessPresentation, type ProcessPresentationPage } from "../../domain/process/ProcessPresentationPackage";
import { activeExternalProfile } from "../health-profile/selectExternalProfile";
import { chosenProposals, pendingProposals } from "../health-profile/profileChoices";
import type { SampleQualityAssessment } from "../../domain/sam";
import { assessSample, parseAgeBandLabel } from "../sam/assessSample";
import { ageBandsForMunicipality } from "../sam/ageBandsForMunicipality";
import { getSingleAgePopulation } from "../sam/populationReferenceRegistry";
import { analyzeIBSEYouth, type IBSEYouthAnalysis } from "../ibse/analyzeIBSEYouth";

/**
 * Presentación del proceso local de salud. Solo reproduce lo que ya está en el
 * expediente: hitos registrados, resultados, conclusiones y recomendaciones
 * elegidas del Perfil vigente y agregados del estudio IBSE. No redacta, no
 * interpreta y no colorea valores como favorables o desfavorables.
 */

export interface Figure {
  id: string;
  title: string;
  /** Valor tal como lo publica la fuente. */
  value: string;
  unit: string;
  period: string;
  source: string;
  numeric?: number;
  comparisons: Array<{ label: string; value: number }>;
}

export interface TimelineItem { date: string; kindLabel: string; title: string; kind: ProcessMilestoneKind | "validacion"; }

export type Slide =
  | { type: "cover"; municipality: string; province?: string; profileTitle?: string; validatedAt?: string; inReview?: boolean }
  | { type: "timeline"; items: TimelineItem[]; page?: number; pages?: number }
  | { type: "figures"; eyebrow: string; title: string; figures: Figure[]; source: string }
  | { type: "comparison"; eyebrow: string; title: string; rows: Figure[]; source: string }
  | { type: "pairs"; eyebrow: string; title: string; rows: Array<{ title: string; women: Figure; men: Figure }>; source: string }
  | { type: "sections"; eyebrow: string; title: string; unit: string; period: string; bars: Array<{ section: string; value: number; label: string }>; source: string }
  | { type: "ibse"; n: number; nValid: number; factors: Array<{ label: string; value: number }>; strata: Array<{ label: string; nValid: number; mean: number }>; highlights: Figure[]; source: string }
  | { type: "sample"; cells: Array<{ ageBand: string; male: number; female: number }>; assigned: number; source: string }
  | { type: "tripyramid"; assessment: SampleQualityAssessment; focusBands: string[]; source: string }
  | { type: "youth-coverage"; analysis: IBSEYouthAnalysis }
  | { type: "youth-ibse"; analysis: IBSEYouthAnalysis }
  | { type: "youth-factors"; analysis: IBSEYouthAnalysis }
  | { type: "conclusions"; items: Array<{ id: string; headline: string }>; total: number; profileTitle: string }
  | { type: "recommendations"; items: Array<{ id: string; name: string; kind: string }>; profileTitle: string }
  | { type: "documentary-page"; page: ProcessPresentationPage }
  | { type: "closing"; municipality: string; goToPrioritization?: boolean; pendingChoices?: number };

/** «1.508,96» → 1508.96; «+16,4» → 16.4. Sin número legible, undefined. */
export function parseSpanishNumber(value: string): number | undefined {
  const cleaned = value.trim().replace(/\s/g, "").replace(/^\+/, "").replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return undefined;
  return Number(cleaned);
}

function figure(r: ProfileResult): Figure {
  return {
    id: r.id, title: r.title, value: r.value, unit: r.unit, period: r.period, source: r.source,
    numeric: r.chartValue ?? parseSpanishNumber(r.value),
    comparisons: r.comparisons ?? (r.comparison ? [r.comparison] : []),
  };
}

/** Primera frase de una conclusión, sin su identificador. */
export function conclusionHeadline(finding: string): { id: string; headline: string } {
  const match = /^(C\d+)\.\s*/.exec(finding.trim());
  const id = match?.[1] ?? "";
  const rest = finding.trim().slice(match?.[0].length ?? 0);
  const sentence = /^(.*?[.])(?=\s+[A-ZÁÉÍÓÚÑ¿]|\s*$)/.exec(rest);
  return { id, headline: (sentence?.[1] ?? rest).trim() };
}

/** «R1. Bienestar emocional. Tratar…» → nombre «Bienestar emocional»; tipo del fundamento. */
export function recommendationLabel(area: { id: string; title: string; rationale: string }): { id: string; name: string; kind: string } {
  const withoutId = area.title.replace(/^R\d+\.\s*/, "");
  const name = /^(.*?)\.(\s|$)/.exec(withoutId)?.[1] ?? withoutId;
  return { id: area.id, name: name.trim(), kind: area.rationale.split(" · ")[0].trim() };
}

const MUNICIPAL_KEYS = ["under18Pct2024", "age65plusPct2025", "bornAbroadPct2025", "higherEducationPct2024", "incomePerson2024", "below60MedianPct2024", "unemployedPctActive2024", "singleHouseholdPct2024"];

function municipalComparisons(results: ProfileResult[]): Figure[] {
  const rows: Figure[] = [];
  for (const key of MUNICIPAL_KEYS) {
    const r = results.find((x) => new RegExp(`-territorial-\\d+-${key}$`).test(x.id) && !/secci[oó]n/i.test(x.scale ?? ""));
    if (r && (r.comparisons?.length ?? 0) > 0) rows.push(figure(r));
  }
  return rows;
}

function genderPairs(results: ProfileResult[]): Array<{ title: string; women: Figure; men: Figure }> {
  const pairs: Array<{ title: string; women: Figure; men: Figure }> = [];
  for (const w of results.filter((r) => r.id.endsWith("-mujeres"))) {
    const m = results.find((r) => r.id === w.id.replace(/-mujeres$/, "-hombres"));
    if (!m || m.unit !== w.unit || m.period !== w.period) continue;
    const title = w.title.replace(/\s*\(mujeres\)\s*$/i, "").replace(/^Mujeres con /, "Con ");
    pairs.push({ title, women: figure(w), men: figure(m) });
  }
  return pairs;
}

function sectionSeries(results: ProfileResult[]) {
  const groups = new Map<string, ProfileResult[]>();
  for (const r of results) {
    const m = /^ts-(?:ieca|adrh)-seccion-(.+)-(\d{10})$/.exec(r.id);
    if (!m) continue;
    groups.set(m[1], [...(groups.get(m[1]) ?? []), r]);
  }
  const preferred = ["tasa-desempleo", "indice-soledad"];
  const keys = [...preferred.filter((k) => groups.has(k)), ...[...groups.keys()].filter((k) => !preferred.includes(k))].slice(0, 2);
  return keys.map((key) => {
    const rows = groups.get(key)!;
    const bars = rows.flatMap((r) => {
      const value = r.chartValue ?? parseSpanishNumber(r.value);
      const section = /(\d{5})$/.exec(r.id)?.[1] ?? r.id;
      return value === undefined ? [] : [{ section, value, label: r.value }];
    });
    return { title: rows[0].title, unit: rows[0].unit, period: rows[0].period, source: rows[0].source, bars };
  }).filter((s) => s.bars.length > 1);
}

/** Pasos internos de una diapositiva: cada pulsación revela una capa antes de avanzar. */
export function slideSteps(slide: Slide): number {
  if (slide.type === "tripyramid") return 4;
  if (slide.type === "youth-coverage") return 2;
  return 1;
}

/** Bandas quinquenales que se solapan con la franja joven analizada. */
function bandsOverlapping(labels: string[], minAge: number, maxAge: number): string[] {
  return labels.filter((l) => {
    const b = parseAgeBandLabel(l);
    return b !== null && b.min <= maxAge && b.max >= minAge;
  });
}

function addChosenProposals(slides: Slide[], profile: ExternalHealthProfile) {
  const chosen = chosenProposals(profile);
  const conclusions = profile.findings.map(conclusionHeadline).filter(c => chosen.has(c.id));
  // Reparto equilibrado, como mucho cuatro por diapositiva: 9 → 3 + 3 + 3.
  const pages = Math.ceil(conclusions.length / 4);
  const perPage = Math.ceil(conclusions.length / Math.max(1, pages));
  for (let i = 0; i < conclusions.length; i += perPage) {
    slides.push({ type: "conclusions", items: conclusions.slice(i, i + perPage), total: conclusions.length, profileTitle: profile.title });
  }
  const recommendations = profile.areas.filter(a => chosen.has(a.id)).map(recommendationLabel);
  if (recommendations.length > 0) slides.push({ type: "recommendations", items: recommendations, profileTitle: profile.title });
}

export const MAX_TIMELINE_ITEMS = 6;

export function buildProcessPresentation(workspace: MunicipalityWorkspace, options: { ibseCsvText?: string; surveyYear?: number } = {}): Slide[] {
  const identity = workspace.municipality.identity;
  const profile: ExternalHealthProfile | undefined = activeExternalProfile(workspace);
  const stored = workspace.processPresentation;
  const custom = profile && isStoredProcessPresentation(stored) && stored.municipalityId === identity.id &&
    stored.profileId === profile.id ? stored : undefined;
  const slides: Slide[] = [{
    type: "cover", municipality: identity.name, province: identity.province,
    profileTitle: profile?.title, validatedAt: profile?.status === "validated" ? profile.validatedAt : undefined,
    ...(custom && profile?.status === "review" ? { inReview: true } : {}),
  }];

  const items: TimelineItem[] = sortMilestones(workspace.processMilestones ?? []).map((m) => ({
    date: m.date, kind: m.kind, kindLabel: milestoneKindLabel(m.kind), title: m.title,
  }));
  if (profile?.status === "validated" && profile.validatedAt) {
    items.push({ date: profile.validatedAt.slice(0, 10), kind: "validacion", kindLabel: "Perfil de Salud Local", title: "Validación técnica del Perfil" });
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  // Como mucho seis hitos por diapositiva, repartidos por igual (15 → 5 + 5 + 5).
  const timelinePages = Math.ceil(items.length / MAX_TIMELINE_ITEMS);
  const perTimelinePage = Math.ceil(items.length / Math.max(1, timelinePages));
  for (let i = 0, page = 1; i < items.length; i += perTimelinePage, page++) {
    slides.push({ type: "timeline", items: items.slice(i, i + perTimelinePage), ...(timelinePages > 1 ? { page, pages: timelinePages } : {}) });
  }

  if (custom && profile) {
    slides.push(...custom.pages.map(page => ({ type: "documentary-page" as const, page })));
    addChosenProposals(slides, profile);
    slides.push({ type: "closing", municipality: identity.name, goToPrioritization: true, pendingChoices: pendingProposals(profile).length });
    return slides;
  }

  if (profile) {
    const profileSource = profile.title;
    const municipal = (r: ProfileResult) => !/secci[oó]n/i.test(r.scale ?? "");
    const health = profile.results.filter((r) => municipal(r) && ["Morbilidad crónica", "Mortalidad", "Prevención"].includes(r.topic ?? ""));
    if (health.length > 0) slides.push({ type: "figures", eyebrow: "Informe de Salud", title: "Resultados epidemiológicos", figures: health.map(figure), source: `${health[0].source} · ${profileSource}` });

    const ibse = workspace.ibseStudy;
    const wellbeing = profile.results.filter((r) => r.topic === "Bienestar socioemocional" && r.unit === "%").map(figure);
    if (ibse) {
      const a = ibse.aggregates;
      const strata: Array<{ label: string; nValid: number; mean: number }> = [];
      if (ibse.strataCounts?.under16?.means) strata.push({ label: "Menores de 16", nValid: ibse.strataCounts.under16.nValid, mean: ibse.strataCounts.under16.means.meanTotal });
      if (ibse.strataCounts?.plus16?.means) strata.push({ label: "16 o más", nValid: ibse.strataCounts.plus16.nValid, mean: ibse.strataCounts.plus16.means.meanTotal });
      slides.push({
        type: "ibse", n: a.n, nValid: a.nValid,
        factors: [
          { label: "Vínculo", value: a.meanFactorVinculo },
          { label: "Persona", value: a.meanFactorPersona },
          { label: "Situación", value: a.meanFactorSituacion },
          { label: "Control", value: a.meanFactorControl },
          { label: "IBSE total", value: a.meanTotal },
        ],
        strata, highlights: wellbeing, source: `Monitor de bienestar socioemocional · ${ibse.sourceFileName}`,
      });
      const observedCells = ibse.ageSexObserved?.cells ?? [];
      const cells = observedCells.filter((c) => c.male + c.female > 0);
      const youthPopulation = getSingleAgePopulation(identity.id);
      const youthAges = youthPopulation ? Object.keys(youthPopulation.counts).map(Number) : [];
      const youth = youthPopulation && options.ibseCsvText
        ? (() => {
          const ages = observedAgesFrom(options.ibseCsvText!, youthAges);
          return ages.length ? analyzeIBSEYouth({
            csvText: options.ibseCsvText!, municipalityId: identity.id, ageBands: ageBandsForMunicipality(identity.id),
            population: youthPopulation, minAge: Math.min(...ages), maxAge: Math.max(...youthAges), surveyYear: options.surveyYear,
          }) : undefined;
        })()
        : undefined;
      const first = cells[0] ? parseAgeBandLabel(cells[0].ageBand) : null;
      const last = observedCells.length ? parseAgeBandLabel(observedCells[observedCells.length - 1].ageBand) : null;
      const sam = first && last
        ? assessSample({ instrumentId: "ibse", municipalityId: identity.id, observedCells, ageRange: { min: first.min, max: last.max } })
        : undefined;
      if (sam?.status === "evaluable" && sam.assessment.composition) {
        const labels = (sam.assessment.populationReference.ageSexMatrix ?? []).map((m) => m.ageBand);
        slides.push({
          type: "tripyramid", assessment: sam.assessment,
          focusBands: youth ? bandsOverlapping(labels, youth.minAge, youth.maxAge) : [],
          source: `${sam.assessment.populationReference.source} · Monitor de bienestar socioemocional · ${ibse.sourceFileName}`,
        });
      } else if (cells.length > 1) {
        slides.push({ type: "sample", cells, assigned: ibse.ageSexObserved!.assignedCount, source: `Monitor de bienestar socioemocional · ${ibse.sourceFileName}` });
      }
      if (youth) {
        slides.push({ type: "youth-coverage", analysis: youth }, { type: "youth-ibse", analysis: youth }, { type: "youth-factors", analysis: youth });
      }
    }

    const comparison = municipalComparisons(profile.results);
    if (comparison.length > 0) slides.push({ type: "comparison", eyebrow: "Perfil de Salud Local", title: "El municipio frente a su provincia y Andalucía", rows: comparison, source: `INE e IECA · ${profileSource}` });
    const pairs = genderPairs(profile.results);
    if (pairs.length > 0) slides.push({ type: "pairs", eyebrow: "Perfil de Salud Local", title: "Mujeres y hombres", rows: pairs, source: `INE e IECA · ${profileSource}` });
    for (const s of sectionSeries(profile.results)) {
      slides.push({ type: "sections", eyebrow: "Perfil de Salud Local · secciones censales", title: s.title, unit: s.unit, period: s.period, bars: s.bars, source: `${s.source} · ${profileSource}` });
    }

    addChosenProposals(slides, profile);
  }

  slides.push({ type: "closing", municipality: identity.name });
  return slides;
}

/** Edades de la franja con población registrada que tienen alguna respuesta en el CSV. */
function observedAgesFrom(csvText: string, ages: number[]): number[] {
  const lines = csvText.split(/\r?\n/);
  const idx = lines[0]?.split(",").indexOf("edad") ?? -1;
  if (idx === -1) return [];
  const seen = new Set<number>();
  for (const line of lines.slice(1)) {
    const age = parseInt(line.split(",")[idx] ?? "", 10);
    if (ages.includes(age)) seen.add(age);
  }
  return [...seen].sort((a, b) => a - b);
}
