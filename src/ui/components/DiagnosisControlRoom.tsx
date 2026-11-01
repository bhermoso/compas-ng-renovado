import { useState, type ReactNode } from "react";
import type { DocumentKind, TemporalScope } from "../../domain/repository";
import type {
  DiagnosisControlSummary,
  DiagnosisModuleId,
  DiagnosisOverallState,
} from "../../application/diagnosis/diagnosisControlSummary";

const OVERALL_MESSAGE: Record<DiagnosisOverallState, string> = {
  ready: "Diagnóstico con Informe de Salud y evidencia disponible para revisar el Perfil de Salud Local.",
  partial: "Diagnóstico en elaboración. Faltan fuentes por incorporar o declarar.",
  empty: "Diagnóstico vacío. Empieza por el Informe de Salud del ámbito territorial.",
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
  "health-report": "Informe de Salud",
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
  return (
    <section className="workspace-panel diagnosis-control" aria-labelledby="diagnosis-control-title">
      <div className="gradient-bar" aria-hidden="true" />
      <div className="diagnosis-control__head">
        <div>
          <p className="eyebrow">01 · Diagnóstico territorial · Sala de control</p>
          <h2 id="diagnosis-control-title" className="diagnosis-control__municipality">{municipalityName}</h2>
          <p className={`diagnosis-control__state diagnosis-control__state--${summary.overall}`}>{OVERALL_MESSAGE[summary.overall]}</p>
        </div>
      </div>

      <dl className="diagnosis-control__metrics" aria-label="Resumen factual del expediente">
        <div><dt>Documentos activos</dt><dd>{metrics.activeDocuments}</dd></div>
        <div><dt>Estudios</dt><dd>{metrics.studiesLoaded}/{metrics.totalStudies}</dd></div>
        <div><dt>Activos</dt><dd>{metrics.assets}</dd></div>
        <div><dt>Evidencias</dt><dd>{metrics.evidence}</dd></div>
        <div className={metrics.withoutTemporalDeclaration ? "diagnosis-control__metric--attention" : undefined}><dt>Sin alcance temporal declarado</dt><dd>{metrics.withoutTemporalDeclaration}</dd></div>
        <div className={metrics.pendingValidation ? "diagnosis-control__metric--attention" : undefined}><dt>Pendientes de validación</dt><dd>{metrics.pendingValidation}</dd></div>
      </dl>
      <p className="panel-note">Las cifras cuentan registros y declaraciones del expediente; no certifican calidad, vigencia ni suficiencia metodológica.</p>

      <h3 className="diagnosis-control__subtitle">Módulos del diagnóstico</h3>
      <ul className="diagnosis-matrix" aria-label="Módulos del diagnóstico">
        {summary.modules.map((module) => (
          <li key={module.id} className={`diagnosis-matrix__card diagnosis-matrix__card--${module.state}`}>
            <div className="diagnosis-matrix__top">
              <span className="diagnosis-matrix__label">{module.label}</span>
              <span className={`diagnosis-matrix__pill diagnosis-matrix__pill--${module.state}`}>{STATE_LABEL[module.state]}</span>
            </div>
            <strong className="diagnosis-matrix__value">{module.value}</strong>
            <p className="diagnosis-matrix__detail">{module.detail}</p>
            {onOpenModule && (
              <button type="button" className="diagnosis-matrix__open" onClick={() => onOpenModule(module.id)} aria-label={`Ver detalle: ${module.label}`}>
                Ver detalle
              </button>
            )}
          </li>
        ))}
      </ul>

      <DiagnosisTimeline summary={summary} kindLabels={kindLabels} />
    </section>
  );
}

function DiagnosisTimeline({ summary, kindLabels }: { summary: DiagnosisControlSummary; kindLabels: ReadonlyArray<{ value: DocumentKind; label: string }> }) {
  const [filter, setFilter] = useState<TemporalScope | "all">("all");
  const entries = filter === "all" ? summary.timeline : summary.timeline.filter((entry) => entry.scope === filter);
  const labelOf = (kind: DocumentKind) => kindLabels.find((entry) => entry.value === kind)?.label ?? FALLBACK_KIND_LABELS[kind] ?? kind;
  return (
    <div className="diagnosis-timeline">
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
              <span className="diagnosis-timeline__title">{entry.title}</span>
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
