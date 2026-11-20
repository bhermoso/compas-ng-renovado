import "./DiagnosisCompact.css";
import { useState, type ReactNode } from "react";
import { DocumentCollectionReference, DocumentReference } from "./Documentation";
import type { DocumentKind, TemporalScope } from "../../domain/repository";
import type {
  DiagnosisControlSummary,
  DiagnosisModuleId,
  DiagnosisOverallState,
} from "../../application/diagnosis/diagnosisControlSummary";

const OVERALL_MESSAGE: Record<DiagnosisOverallState, string> = {
  ready: "Informe sobre la situación de salud incorporado y evidencias disponibles para revisar el Perfil de Salud Local.",
  partial: "Diagnóstico en elaboración. Faltan fuentes por incorporar o declarar.",
  empty: "Diagnóstico vacío. Empieza por el Informe sobre la situación de salud del municipio.",
};

const STATE_LABEL = { ok: "Disponible", partial: "Parcial", empty: "Sin datos" } as const;

const SCOPE_FILTERS: Array<{ value: TemporalScope | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "current", label: "Actual" },
  { value: "historical", label: "Histórico" },
  { value: "mixed", label: "Mixto" },
  { value: "undetermined", label: "Sin declarar" },
];

/** Nombres de respaldo para tipos que no figuran en el selector de carga. */
const FALLBACK_KIND_LABELS: Record<DocumentKind, string> = {
  "health-report": "Informe sobre la situación de salud",
  "complementary-study": "Estudio complementario",
  "eas-variable": "Variable EAS",
  "cmi-indicator": "Indicador CMI",
  "community-asset": "Activo comunitario",
  "localiza-salud": "Localiza Salud",
  "strategic-framework": "Marco estratégico y normativo",
  "redcap-export": "Exportación REDCap",
  "territorial-documentation": "Documentación territorial",
  "qualitative-material": "Material cualitativo",
  "longitudinal-evidence": "Evidencia longitudinal",
  other: "Otra fuente",
};

const SCOPE_LABEL: Record<TemporalScope, string> = {
  current: "Actual",
  historical: "Histórico",
  mixed: "Mixto",
  undetermined: "Sin declarar",
};

interface DiagnosisControlRoomProps {
  municipalityName: string;
  summary: DiagnosisControlSummary;
  kindLabels?: ReadonlyArray<{ value: DocumentKind; label: string }>;
  /** Abre el detalle del módulo en la parte inferior de la pestaña. */
  onOpenModule?: (id: DiagnosisModuleId) => void;
}

/** Cabecera, resumen factual y matriz de módulos del Diagnóstico territorial. */
export function DiagnosisControlRoom({ municipalityName, summary, kindLabels = [], onOpenModule }: DiagnosisControlRoomProps) {
  const { metrics } = summary;
  const [timelineFilter, setTimelineFilter] = useState<TemporalScope | "all">("all");
  const allDocumentKinds = Object.keys(FALLBACK_KIND_LABELS) as DocumentKind[];
  const openTimelineWithoutScope = () => {
    setTimelineFilter("undetermined");
    const timeline = document.getElementById("diagnosis-timeline-details") as HTMLDetailsElement | null;
    if (timeline) timeline.open = true;
    timeline?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const metricValue = (value: number | string, label: string, target: "documents" | "studies" | "assets" | "evidence" | "temporal") => {
    if (target === "documents") return <DocumentCollectionReference kinds={allDocumentKinds} className="diagnosis-control__metric-link" >{value}<span aria-hidden="true"> ↗</span><span className="sr-only"> · Consultar documentación: {label}</span></DocumentCollectionReference>;
    if (target === "temporal") return <button type="button" className="diagnosis-control__metric-link" onClick={openTimelineWithoutScope}>{value}<span aria-hidden="true"> ↘</span><span className="sr-only"> · Filtrar la cronología por documentos sin alcance temporal</span></button>;
    if (!onOpenModule) return <span>{value}</span>;
    return <button type="button" className="diagnosis-control__metric-link" onClick={() => onOpenModule(target === "studies" ? "studies" : target === "assets" ? "assets" : "evidence")}>{value}<span aria-hidden="true"> ↘</span><span className="sr-only"> · Abrir detalle de {label}</span></button>;
  };
  return (
    <section className="workspace-panel diagnosis-control" aria-labelledby="diagnosis-control-title">
      <div className="diagnosis-control__head">
        <div>
          <p className="eyebrow">01 · Diagnóstico territorial</p>
          <h2 id="diagnosis-control-title" className="diagnosis-control__municipality">{municipalityName}</h2>
          <p className={`diagnosis-control__state diagnosis-control__state--${summary.overall}`}>{OVERALL_MESSAGE[summary.overall]}</p>
        </div>
      </div>

      <dl className="diagnosis-control__metrics" aria-label="Resumen navegable del expediente">
        <div><dt>Documentos activos</dt><dd>{metricValue(metrics.activeDocuments, "documentos", "documents")}</dd></div>
        <div><dt>Estudios</dt><dd>{metricValue(`${metrics.studiesLoaded}/${metrics.totalStudies}`, "estudios", "studies")}</dd></div>
        {metrics.validatedAssets !== undefined
          ? <div><dt>Activos validados</dt><dd>{metricValue(`${metrics.validatedAssets} de ${metrics.assets}`, "activos validados", "assets")}</dd></div>
          : <div><dt>Recursos de activos</dt><dd>{metricValue(metrics.assets, "recursos de activos", "assets")}</dd></div>}
        <div><dt>Evidencias</dt><dd>{metricValue(metrics.evidence, "evidencias", "evidence")}</dd></div>
        <div className={metrics.withoutTemporalDeclaration ? "diagnosis-control__metric--attention" : undefined}><dt>Sin alcance temporal</dt><dd>{metricValue(metrics.withoutTemporalDeclaration, "sin alcance temporal", "temporal")}</dd></div>
        <div className={metrics.pendingValidation ? "diagnosis-control__metric--attention" : undefined}><dt>Pendientes de validación</dt><dd>{metricValue(metrics.pendingValidation, "pendientes de validación", "documents")}</dd></div>
      </dl>
      <p className="panel-note">Las cifras cuentan registros y declaraciones del expediente; no certifican calidad, vigencia ni suficiencia metodológica.</p>

      <nav aria-label="Áreas del diagnóstico territorial" className="diagnosis-area-navigation">
        <h3 className="diagnosis-control__subtitle">Áreas de trabajo</h3>
        <div className="diagnosis-area-navigation__grid">
          <button type="button" onClick={() => onOpenModule?.("studies")} disabled={!onOpenModule}>
            <strong>01 · Estudios complementarios</strong>
            <span>IBSE, SAM, resultados y referencias</span>
          </button>
          <button type="button" onClick={() => onOpenModule?.("health-report")} disabled={!onOpenModule}>
            <strong>02 · Informe sobre la situación de salud</strong>
            <span>Informe sobre la situación de salud de {municipalityName}</span>
          </button>
          <button type="button" onClick={() => onOpenModule?.("assets")} disabled={!onOpenModule}>
            <strong>03 · Localiza Salud</strong>
            <span>Localiza Salud de {municipalityName} · inventario y validación</span>
          </button>
          <button type="button" onClick={() => onOpenModule?.("evidence")} disabled={!onOpenModule}>
            <strong>04 · Evidencias del diagnóstico</strong>
            <span>Hallazgos trazables por fuente</span>
          </button>
        </div>
      </nav>
      <details className="diagnosis-control__module-audit">
        <summary>Estado detallado de módulos y fuentes</summary>
        <ul className="diagnosis-matrix" aria-label="Módulos del diagnóstico">
        {summary.modules.map((module) => (
          <li key={module.id} className={`diagnosis-matrix__card diagnosis-matrix__card--${module.state}`}>
            {(() => {
              const kinds: DocumentKind[] | undefined =
                module.id === "health-report" ? ["health-report"] :
                module.id === "assets" ? ["community-asset", "localiza-salud"] :
                module.id === "frameworks" ? ["strategic-framework"] : undefined;
              const contents = <>
                <span className="diagnosis-matrix__top">
                  <span className="diagnosis-matrix__label">{module.label}</span>
                  <span className={`diagnosis-matrix__pill diagnosis-matrix__pill--${module.state}`}>{STATE_LABEL[module.state]}</span>
                </span>
                <strong className="diagnosis-matrix__value">{module.value}</strong>
                <span className="diagnosis-matrix__detail">{module.detail}</span>
                <span className="diagnosis-matrix__open">{kinds ? "Consultar documentos" : "Ver detalle"}</span>
              </>;
              return kinds
                ? <DocumentCollectionReference kinds={kinds} className="diagnosis-matrix__card-action">{contents}</DocumentCollectionReference>
                : onOpenModule
                  ? <button type="button" className="diagnosis-matrix__card-action" onClick={() => onOpenModule(module.id)} aria-label={`Ver detalle: ${module.label}`}>{contents}</button>
                  : contents;
            })()}
          </li>
        ))}
        </ul>
      </details>

      <details className="diagnosis-control__timeline-details" id="diagnosis-timeline-details">
        <summary>Consultar cronología de fuentes · {summary.timeline.length} registros</summary>
        <DiagnosisTimeline summary={summary} kindLabels={kindLabels} filter={timelineFilter} setFilter={setTimelineFilter} />
      </details>
    </section>
  );
}

function DiagnosisTimeline({ summary, kindLabels, filter, setFilter }: { summary: DiagnosisControlSummary; kindLabels: ReadonlyArray<{ value: DocumentKind; label: string }>; filter: TemporalScope | "all"; setFilter: (next: TemporalScope | "all") => void }) {
  const entries = filter === "all" ? summary.timeline : summary.timeline.filter((entry) => entry.scope === filter);
  const labelOf = (kind: DocumentKind) => kindLabels.find((entry) => entry.value === kind)?.label ?? FALLBACK_KIND_LABELS[kind] ?? kind;
  return (
    <div className="diagnosis-timeline" id="diagnosis-timeline">
      <h3 className="diagnosis-control__subtitle">Línea temporal de las fuentes</h3>
      <div className="diagnosis-timeline__filters" role="group" aria-label="Filtrar por alcance temporal">
        {SCOPE_FILTERS.map((option) => {
          const count = option.value === "all" ? summary.timeline.length : summary.scopeCounts[option.value];
          return (
            <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
              {option.label} <span>{count}</span>
            </button>
          );
        })}
      </div>
      {entries.length === 0 ? (
        <p className="panel-note">{summary.timeline.length === 0 ? "No constan documentos en el repositorio." : "Ninguna fuente con este alcance temporal."}</p>
      ) : (
        <ol className="diagnosis-timeline__list">
          {entries.map((entry) => (
            <li key={entry.documentId} className={`diagnosis-timeline__item diagnosis-timeline__item--${entry.scope}`}>
              <span className="diagnosis-timeline__date">{entry.dateLabel ?? "Fecha no declarada"}</span>
              <span className="diagnosis-timeline__title"><DocumentReference documentId={entry.documentId}>{entry.title}</DocumentReference></span>
              <span className="diagnosis-timeline__meta">{labelOf(entry.kind)} · {SCOPE_LABEL[entry.scope]}{entry.scopeSource === "cycle" ? " (ciclo declarado)" : ""}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="panel-note">El alcance procede siempre de una declaración humana; la fecha de carga no se usa como fecha del documento.</p>
    </div>
  );
}

/** Sección plegable de detalle: conserva los paneles existentes sin alterarlos. */
export function DiagnosisModuleSection({
  id,
  title,
  description,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details id={id} className="diagnosis-module" open={open} onToggle={(event) => {
      const next = event.currentTarget.open;
      if (next !== open) onToggle(next);
    }}>
      <summary className="diagnosis-module__summary">
        <span className="diagnosis-module__title">{title}</span>
        {description && <span className="diagnosis-module__description">{description}</span>}
      </summary>
      <div className="diagnosis-module__body">{children}</div>
    </details>
  );
}
