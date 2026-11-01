import type {
  DocumentKind,
  MunicipalDocument,
  MunicipalDocumentRepository,
  TemporalScope,
} from "../../domain/repository";

/**
 * Sala de control del Diagnóstico territorial: lectura factual del expediente.
 * Cuenta registros y declaraciones; no evalúa suficiencia metodológica, no
 * deduce vigencia por antigüedad y nunca usa la fecha de carga como fecha del
 * documento (contrato temporal, §3 de DIAGNOSTICO-TERRITORIAL-CONTROL-UNIVERSAL).
 */

export const STUDY_DOCUMENT_TAGS = [
  "ibse", "duke-eas", "predimed-eas", "sf12-eas", "sueno-eas", "cage-eas", "auditc",
  "ipaq-eas", "ghq12", "phq9", "psqi", "fagerstrom", "sbq",
] as const;

export type DiagnosisModuleId =
  | "health-report"
  | "studies"
  | "assets"
  | "frameworks"
  | "other-sources"
  | "evidence";

export type DiagnosisModuleState = "ok" | "partial" | "empty";

export interface DiagnosisModuleSummary {
  id: DiagnosisModuleId;
  label: string;
  count: number;
  /** Texto breve con la cifra en contexto (p. ej. «3 de 13»). */
  value: string;
  state: DiagnosisModuleState;
  detail: string;
}

export type DiagnosisOverallState = "ready" | "partial" | "empty";

export interface DiagnosisTimelineEntry {
  documentId: string;
  title: string;
  kind: DocumentKind;
  /** Fecha o período declarados; ausente si no consta (no se rellena con fechas técnicas). */
  dateLabel?: string;
  /** Clave de orden: AAAA[-MM[-DD]] declarada; ausente si no consta. */
  sortKey?: string;
  scope: TemporalScope;
  /** Origen de la clasificación temporal: declaración ampliada, ciclo heredado o ninguna. */
  scopeSource: "declaration" | "cycle" | "none";
}

export interface DiagnosisControlSummary {
  overall: DiagnosisOverallState;
  metrics: {
    activeDocuments: number;
    studiesLoaded: number;
    totalStudies: number;
    assets: number;
    evidence: number;
    withoutTemporalDeclaration: number;
    pendingValidation: number;
  };
  modules: DiagnosisModuleSummary[];
  timeline: DiagnosisTimelineEntry[];
  scopeCounts: Record<TemporalScope, number>;
}

export interface DiagnosisControlInput {
  repository: MunicipalDocumentRepository;
  evidenceCount: number;
  healthReportLoaded: boolean;
  /** Un elemento por instrumento del catálogo; true si el estudio está cargado. */
  studiesLoaded: readonly boolean[];
  /** Evidencias derivadas de estudios complementarios (IBSE incluido). */
  studyEvidenceCount: number;
  assetCount: number;
}

function isActive(document: MunicipalDocument): boolean {
  return document.status !== "archived" && document.status !== "rejected";
}

function isStudyDocument(document: MunicipalDocument): boolean {
  return (
    document.kind === "complementary-study" ||
    (document.kind === "redcap-export" && document.tags.some((tag) => (STUDY_DOCUMENT_TAGS as readonly string[]).includes(tag)))
  );
}

/** Alcance temporal declarado: la declaración ampliada prevalece sobre el ciclo heredado. */
export function declaredScopeOf(document: MunicipalDocument): { scope: TemporalScope; source: DiagnosisTimelineEntry["scopeSource"] } {
  if (document.temporal?.declaration) {
    return { scope: document.temporal.temporalScope ?? "undetermined", source: "declaration" };
  }
  if (document.cycle) return { scope: document.cycle.status, source: "cycle" };
  return { scope: "undetermined", source: "none" };
}

function timelineDate(document: MunicipalDocument): { dateLabel?: string; sortKey?: string } {
  const declared = document.temporal?.documentDate?.value;
  const period = document.temporal?.observedPeriod?.literal;
  if (declared) return { dateLabel: period ? `${declared} · período ${period}` : declared, sortKey: declared };
  if (period) {
    const year = /\d{4}/.exec(period)?.[0];
    return { dateLabel: `Período ${period}`, ...(year ? { sortKey: year } : {}) };
  }
  if (document.cycle?.referenceYear !== undefined) {
    const year = String(document.cycle.referenceYear);
    return { dateLabel: `Año de referencia ${year}`, sortKey: year };
  }
  return {};
}

export function buildDiagnosisControlSummary(input: DiagnosisControlInput): DiagnosisControlSummary {
  const active = input.repository.documents.filter(isActive);
  const studiesLoaded = input.studiesLoaded.filter(Boolean).length;
  const totalStudies = input.studiesLoaded.length;
  const frameworks = active.filter((d) => d.kind === "strategic-framework").length;
  const otherSources = active.filter(
    (d) =>
      d.kind !== "health-report" &&
      d.kind !== "community-asset" &&
      d.kind !== "localiza-salud" &&
      d.kind !== "strategic-framework" &&
      !isStudyDocument(d)
  ).length;

  const timeline = active
    .map((document): DiagnosisTimelineEntry => {
      const { scope, source } = declaredScopeOf(document);
      return { documentId: document.id, title: document.title, kind: document.kind, ...timelineDate(document), scope, scopeSource: source };
    })
    .sort((a, b) => {
      if (a.sortKey && b.sortKey) return b.sortKey.localeCompare(a.sortKey) || a.title.localeCompare(b.title, "es");
      if (a.sortKey) return -1;
      if (b.sortKey) return 1;
      return a.title.localeCompare(b.title, "es");
    });

  const scopeCounts: Record<TemporalScope, number> = { current: 0, historical: 0, mixed: 0, undetermined: 0 };
  for (const entry of timeline) scopeCounts[entry.scope] += 1;

  const overall: DiagnosisOverallState =
    input.healthReportLoaded && input.evidenceCount > 0 ? "ready"
    : input.healthReportLoaded || input.evidenceCount > 0 || input.repository.documents.length > 0 ? "partial"
    : "empty";

  const modules: DiagnosisModuleSummary[] = [
    {
      id: "health-report",
      label: "Informe de Salud",
      count: input.healthReportLoaded ? 1 : 0,
      value: input.healthReportLoaded ? "Incorporado" : "Sin incorporar",
      state: input.healthReportLoaded ? "ok" : "empty",
      detail: input.healthReportLoaded ? "Fuente primaria del diagnóstico." : "Fuente primaria pendiente de incorporar.",
    },
    {
      id: "studies",
      label: "Estudios complementarios",
      count: studiesLoaded,
      value: `${studiesLoaded} de ${totalStudies}`,
      state: studiesLoaded === 0 ? "empty" : studiesLoaded === totalStudies ? "ok" : "partial",
      detail: studiesLoaded ? `${input.studyEvidenceCount} evidencias derivadas.` : "Ningún instrumento cargado.",
    },
    {
      id: "assets",
      label: "Activos para la salud",
      count: input.assetCount,
      value: String(input.assetCount),
      state: input.assetCount > 0 ? "ok" : "empty",
      detail: input.assetCount > 0 ? "Activos identificados en el territorio." : "Sin activos registrados.",
    },
    {
      id: "frameworks",
      label: "Marcos estratégicos y normativos",
      count: frameworks,
      value: String(frameworks),
      state: frameworks > 0 ? "ok" : "empty",
      detail: "Contexto para la planificación; no son datos poblacionales.",
    },
    {
      id: "other-sources",
      label: "Otras fuentes documentales",
      count: otherSources,
      value: String(otherSources),
      state: otherSources > 0 ? "ok" : "empty",
      detail: "Documentación territorial, material cualitativo y otras fuentes.",
    },
    {
      id: "evidence",
      label: "Evidencias registradas",
      count: input.evidenceCount,
      value: String(input.evidenceCount),
      state: input.evidenceCount > 0 ? "ok" : "empty",
      detail: "Unidades trazables disponibles para el análisis. Contarlas no acredita suficiencia.",
    },
  ];

  return {
    overall,
    metrics: {
      activeDocuments: active.length,
      studiesLoaded,
      totalStudies,
      assets: input.assetCount,
      evidence: input.evidenceCount,
      withoutTemporalDeclaration: scopeCounts.undetermined,
      pendingValidation: active.filter((d) => d.status !== "validated").length,
    },
    modules,
    timeline,
    scopeCounts,
  };
}
