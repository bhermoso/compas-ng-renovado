import "./DiagnosisCompact.css";
import { InstitutionalLogoBand } from "./InstitutionalLogoBand";
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
  onOpenWorkspace?: () => void;
}

/** Cabecera, resumen factual y matriz de módulos del Diagnóstico territorial. */
export function DiagnosisControlRoom({ municipalityName, summary, kindLabels = [], onOpenModule, onOpenWorkspace }: DiagnosisControlRoomProps) {
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
      <header className="diagnosis-cover">
        <div className="diagnosis-cover__eyebrow">Marco RELAS · Planificación Local de Salud · Andalucía</div>
        <div className="diagnosis-cover__identity">
          <div className="diagnosis-cover__brand">
            <h2 id="diagnosis-control-title" className="diagnosis-cover__title">Diagnóstico territorial</h2>
            <div className="diagnosis-cover__rule" aria-hidden="true" />
            <p className="diagnosis-cover__municipality">{municipalityName}</p>
            <p className="diagnosis-cover__state">{OVERALL_MESSAGE[summary.overall]}</p>
          </div>
          <div className="diagnosis-cover__logos">
            <InstitutionalLogoBand variant="cover" ids={["consejeria", "distrito-sanitario", "relas", "violencia-genero", "rasselh"]} />
          </div>
        </div>
      </header>

      <nav aria-label="Documentación del diagnóstico territorial" className="diagnosis-area-navigation">
        <h3 className="diagnosis-control__subtitle">Documentación COMPÁS–RELAS</h3>
        <div className="diagnosis-area-navigation__grid">
          <button type="button" onClick={() => onOpenModule?.("health-report")} disabled={!onOpenModule}>
            <strong>01 · Informe sobre la situación de salud de {municipalityName}</strong>
            <span>{summary.modules.find(m => m.id === "health-report")?.value ?? "Sin incorporar"} · consultar el informe y sus versiones</span>
          </button>
          <button type="button" onClick={() => onOpenModule?.("studies")} disabled={!onOpenModule}>
            <strong>02 · Estudios complementarios</strong>
            <span>IBSE y demás instrumentos · {metrics.studiesLoaded} de {metrics.totalStudies} incorporados</span>
          </button>
          <button type="button" onClick={() => onOpenModule?.("assets")} disabled={!onOpenModule}>
            <strong>03 · Localiza Salud de {municipalityName}</strong>
            <span>{metrics.assets} recursos registrados · {metrics.activeLocalizaDocuments} fichas vigentes</span>
          </button>
          <button type="button" onClick={onOpenWorkspace} disabled={!onOpenWorkspace}>
            <strong>04 · Gestionar documentación</strong>
            <span>Consultar, incorporar, reemplazar o retirar versiones con confirmación</span>
          </button>
        </div>
      </nav>
      {metrics.activeLocalizaDocuments > 1 && <p className="diagnosis-control__localiza-warning" role="status">
        Localiza Salud: {metrics.activeLocalizaDocuments} fichas activas. Revisar para mantener un único inventario vigente; no se ha retirado ninguna.
      </p>}
      <p className="diagnosis-control__footnote">El detalle de los estudios y los registros técnicos se despliega solo al seleccionar un área.</p>
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
