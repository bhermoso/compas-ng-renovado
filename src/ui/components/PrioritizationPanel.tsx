import type { PrioritizationResult } from "../../application/prioritization";
import type { LocalHealthProfileStatus } from "../../domain/health-profile";

interface PrioritizationPanelProps {
  prioritization: PrioritizationResult;
  pslStatus: LocalHealthProfileStatus;
  pslIsStale: boolean;
  hasInsufficientEvidence?: boolean;
  /** Referencia exacta de la versión externa que alimenta esta proyección. */
  externalSource?: { id: string; title: string; status: "review" | "validated"; limitations: string[] };
}

export function PrioritizationPanel({
  prioritization,
  pslStatus,
  pslIsStale,
  hasInsufficientEvidence = false,
  externalSource,
}: PrioritizationPanelProps) {
  const needsValidationWarning = pslStatus !== "validated" && pslStatus !== "approved" || pslIsStale;

  // Excluir la candidatura metodológica "ampliar base de evidencia" —
  // es una condición previa, no una prioridad territorial.
  const candidates = prioritization.candidatePriorities.filter(
    (p) => p.sourceAreaId !== "oit-expand-evidence-base"
  );

  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Priorización técnica</p>
          <h2>Propuestas del Perfil para examinar en la deliberación</h2>
        </div>
        <p className="panel-note">
          Las recomendaciones del Perfil se muestran aquí como asuntos para examinar,
          no como áreas priorizadas. Solo el Grupo Motor puede seleccionar y justificar
          prioridades mediante su proceso de deliberación.
        </p>
      </div>

      {hasInsufficientEvidence ? (
        <div className="phase-blocked-notice">
          <strong>Base documental insuficiente para deliberación</strong>
          <p className="phase-blocked-notice__note">
            La priorización territorial requiere una base de evidencia suficiente.
            Incorpora el Informe de Salud y los estudios complementarios al repositorio
            antes de iniciar el proceso deliberativo.
          </p>
        </div>
      ) : (
        <>
          {externalSource && (
            <p className="panel-note">
              Documento de procedencia: «{externalSource.title}» · ID de revisión {externalSource.id}
              {" "}· {externalSource.status === "validated" ? "Validado técnicamente" : "En revisión técnica"}.
              Las propuestas siguientes conservan el identificador de recomendación del Perfil.
              No equivalen a prioridades adoptadas.
            </p>
          )}
          {needsValidationWarning && (
            <div className="prio-psl-warning">
              <span className="prio-psl-warning__icon" aria-hidden="true">⚠</span>
              <p className="prio-psl-warning__text">
                {pslIsStale
                  ? "La evidencia del municipio ha cambiado desde que se validó el Perfil de Salud Local. Estas áreas candidatas se basan en un perfil que puede no reflejar el diagnóstico actual."
                  : "El Perfil de Salud Local que alimenta estas propuestas no consta validado técnicamente. Son recomendaciones documentales para revisión, no prioridades aprobadas. Consulta la versión vigente en «Perfil de Salud Local» antes de avanzar hacia la priorización formal."}
              </p>
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="empty-state">
              Sin áreas candidatas. Incorpora documentación territorial para generar
              candidaturas técnicas de priorización.
            </p>
          ) : (
            <div className="document-list">
              {candidates.map((priority) => (
                <article className="document-row" key={priority.id}>
                  <div>
                    <p className="document-kind">{externalSource ? "Recomendación del Perfil · pendiente de deliberación" : "Área candidata para deliberación"}</p>
                    <h3>{priority.title}</h3>
                    <p>{externalSource
                      ? "El Perfil formula esta recomendación. Su posible conversión en prioridad requiere decisión y fundamento del Grupo Motor."
                      : priority.rationale}</p>
                    <p className="panel-note">
                      {externalSource
                        ? "Vínculos con evidencias del expediente: no estructurados en esta proyección. Consulte el fundamento de la recomendación en el Perfil; no significa ausencia de evidencias."
                        : priority.relatedEvidenceIds.length > 0
                          ? `Vínculos documentados con evidencias: ${priority.relatedEvidenceIds.length}`
                          : "Vínculos con evidencias: no documentados en esta proyección; no significa ausencia de evidencias."}
                    </p>
                    <ul>
                      {priority.cautions.map((caution) => (
                        <li key={caution}>{caution}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="status-pill">Pendiente de deliberación</span>
                </article>
              ))}
            </div>
          )}

          {externalSource && externalSource.limitations.length > 0 && (
            <details className="card">
              <summary>Limitaciones generales de la versión del Perfil ({externalSource.limitations.length})</summary>
              <p className="panel-note">Son limitaciones del documento en su conjunto, no evidencia ni cautelas específicas de cada recomendación.</p>
              <ul>{externalSource.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </details>
          )}
          <article className="card">
            <h3>Criterios de revisión deliberativa</h3>
            <ul>
              {prioritization.criteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </article>

          <article className="card">
            <h3>Cautelas</h3>
            <ul>
              {prioritization.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </article>
        </>
      )}
    </section>
  );
}
