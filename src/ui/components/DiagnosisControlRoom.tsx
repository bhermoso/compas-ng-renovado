import { useState, type ReactNode } from "react";
import { DocumentReference } from "./Documentation";
import type { DocumentKind, TemporalScope } from "../../domain/repository";
import type { DiagnosisControlSummary } from "../../application/diagnosis/diagnosisControlSummary";

const SCOPE_FILTERS: Array<{ value: TemporalScope | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "current", label: "Actual" },
  { value: "historical", label: "Histórico" },
  { value: "mixed", label: "Mixto" },
  { value: "undetermined", label: "Sin declarar" },
];

const SCOPE_LABEL: Record<TemporalScope, string> = {
  current: "Actual",
  historical: "Histórico",
  mixed: "Mixto",
  undetermined: "Sin declarar",
};

const KIND_LABEL: Record<DocumentKind, string> = {
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

interface DiagnosisControlRoomProps {
  municipalityName: string;
  province?: string;
  ineCode?: string;
  summary: DiagnosisControlSummary;
}

/** Portada compacta del diagnóstico: identifica el ámbito y reserva el detalle para quien lo despliega. */
export function DiagnosisControlRoom({ municipalityName, province, ineCode, summary }: DiagnosisControlRoomProps) {
  const [timelineFilter, setTimelineFilter] = useState<TemporalScope | "all">("all");
  const periods = [...new Set(summary.timeline.map(entry => entry.observedPeriod).filter((period): period is string => Boolean(period)))];
  const periodLabel = periods.length === 0
    ? "Sin período observado declarado"
    : `${periods.slice(0, 2).join(" · ")}${periods.length > 2 ? ` · +${periods.length - 2} períodos` : ""}`;
  const entries = timelineFilter === "all"
    ? summary.timeline
    : summary.timeline.filter(entry => entry.scope === timelineFilter);
  const { metrics } = summary;

  return (
    <>
      <header className="hp-cover diagnosis-home__head">
        <div className="hp-cover__context">
          <p className="hp-cover__chain">01 · Diagnosticar</p>
        </div>
        <div className="hp-cover__brand">
          <h2 id="diagnosis-home-title">Diagnóstico territorial</h2>
          <hr className="home-cover__rule hp-cover__rule" />
        </div>
        <div className="hp-cover__side diagnosis-home__identity">
          <strong>{municipalityName}</strong>
          {(province || ineCode) && <span>{[province, ineCode && `INE ${ineCode}`].filter(Boolean).join(" · ")}</span>}
          <span>Períodos: {periodLabel}</span>
        </div>
      </header>

      <details className="diagnosis-home__details hp-phase hp-phase--1">
        <summary>
          <strong>Ver estado y cronología</strong>
          <span>{metrics.activeDocuments} documentos activos · {metrics.evidence} evidencias · {metrics.studiesLoaded}/{metrics.totalStudies} instrumentos</span>
        </summary>
        <div className="diagnosis-home__body">
          <dl className="diagnosis-home__metrics" aria-label="Resumen del expediente">
            <div><dt>Documentos activos</dt><dd>{metrics.activeDocuments}</dd></div>
            <div><dt>Instrumentos cargados</dt><dd>{metrics.studiesLoaded} de {metrics.totalStudies}</dd></div>
            <div><dt>Recursos de activos</dt><dd>{metrics.assets}</dd></div>
            {metrics.validatedAssets !== undefined && <div><dt>Activos validados</dt><dd>{metrics.validatedAssets} de {metrics.assets}</dd></div>}
            <div><dt>Evidencias</dt><dd>{metrics.evidence}</dd></div>
            <div><dt>Sin alcance temporal</dt><dd>{metrics.withoutTemporalDeclaration}</dd></div>
            <div><dt>Pendientes de validación</dt><dd>{metrics.pendingValidation}</dd></div>
          </dl>
          <p className="panel-note">Las cifras cuentan registros y declaraciones; no certifican calidad, vigencia ni suficiencia metodológica.</p>

          <div className="diagnosis-home__timeline">
            <h3>Línea temporal de las fuentes</h3>
            <div className="diagnosis-home__filters" role="group" aria-label="Filtrar cronología por alcance temporal">
              {SCOPE_FILTERS.map(option => {
                const count = option.value === "all" ? summary.timeline.length : summary.scopeCounts[option.value];
                return <button key={option.value} type="button" aria-pressed={timelineFilter === option.value} onClick={() => setTimelineFilter(option.value)}>{option.label} <span>{count}</span></button>;
              })}
            </div>
            {entries.length === 0
              ? <p className="panel-note">{summary.timeline.length === 0 ? "No constan documentos en el repositorio." : "Ninguna fuente con este alcance temporal."}</p>
              : <ol className="diagnosis-home__sources">{entries.map(entry => <li key={entry.documentId}>
                  <span className="diagnosis-home__date">{entry.dateLabel ?? "Fecha no declarada"}</span>
                  <DocumentReference documentId={entry.documentId}>{entry.title}</DocumentReference>
                  <span className="diagnosis-home__kind">{KIND_LABEL[entry.kind] ?? entry.kind} · {SCOPE_LABEL[entry.scope]}{entry.scopeSource === "cycle" ? " (ciclo declarado)" : ""}</span>
                </li>)}</ol>}
            <p className="panel-note">El alcance procede de una declaración humana; la fecha de carga no se usa como fecha del documento.</p>
          </div>

          <details className="diagnosis-home__module-status">
            <summary>Estado detallado de fuentes y módulos</summary>
            <ul>{summary.modules.map(module => <li key={module.id}>
              <span>{module.label}</span><strong>{module.value}</strong><small>{module.detail}</small>
            </li>)}</ul>
          </details>
        </div>
      </details>
    </>
  );
}

/** Módulos plegables del expediente; su estado inicial lo controla App. */
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
