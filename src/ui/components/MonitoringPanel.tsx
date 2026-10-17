import { useState } from "react";
import type { MonitoringDraft, MonitoringStatus } from "../../application/monitoring";
import { validatePLSEvaluationFramework } from "../../application/monitoring/MonitoringEngine";
import type { PLSEvaluationFramework } from "../../domain/health-plan";

const STATUS_LABEL: Record<MonitoringStatus, string> = {
  "pending-validation": "Pendiente de validación",
  "planned":            "Planificado",
  "in-progress":        "En ejecución",
  "completed":          "Completado",
};

function EvaluationFrameworkEditor({
  initial,
  onSave,
}: {
  initial?: PLSEvaluationFramework;
  onSave: (framework: PLSEvaluationFramework) => void;
}) {
  const [responsible, setResponsible] = useState(initial?.evaluationResponsible ?? "");
  const [questionsRaw, setQuestionsRaw] = useState(
    (initial?.evaluationQuestions ?? []).join("\n")
  );
  const [momentsRaw, setMomentsRaw] = useState(
    (initial?.evaluationMoments ?? []).join("\n")
  );
  const [baselineNote, setBaselineNote] = useState(initial?.baselineNote ?? "");
  const [message, setMessage] = useState("");

  const current: PLSEvaluationFramework = {
    evaluationResponsible: responsible.trim(),
    evaluationQuestions: questionsRaw.split("\n").map((q) => q.trim()).filter(Boolean),
    evaluationMoments: momentsRaw.split("\n").map((m) => m.trim()).filter(Boolean),
    baselineNote: baselineNote.trim(),
  };
  const errors = validatePLSEvaluationFramework(current);

  function handleSave() {
    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }
    onSave(current);
    setMessage("Marco de evaluación guardado.");
  }

  return (
    <section
      className="card"
      aria-label="Marco de evaluación del PLS (G-PLS-10)"
      style={{ marginTop: "1.5rem" }}
    >
      <h3 style={{ marginTop: 0 }}>Marco de evaluación · G-PLS-10</h3>
      <p className="panel-note">
        El equipo técnico define las preguntas de evaluación, los momentos de
        medición y la persona responsable. Sin responsable nominal ni preguntas,
        el PLS no podrá ser evaluado (PM-8).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Responsable de evaluación (persona nominada)
            <span style={{ color: "var(--rojo)", marginLeft: "0.25rem" }}>*</span>
          </span>
          <input
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Nombre y cargo de la persona responsable"
            style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--borde)", borderRadius: "4px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Preguntas de evaluación (una por línea)
            <span style={{ color: "var(--rojo)", marginLeft: "0.25rem" }}>*</span>
          </span>
          <textarea
            value={questionsRaw}
            onChange={(e) => setQuestionsRaw(e.target.value)}
            placeholder="¿Se alcanzaron los objetivos planteados?"
            rows={4}
            style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--borde)", borderRadius: "4px", resize: "vertical" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Momentos de evaluación (uno por línea, opcional)
          </span>
          <textarea
            value={momentsRaw}
            onChange={(e) => setMomentsRaw(e.target.value)}
            placeholder="Año 2 del plan&#10;Cierre del período"
            rows={2}
            style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--borde)", borderRadius: "4px", resize: "vertical" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Nota sobre línea base (opcional)
          </span>
          <textarea
            value={baselineNote}
            onChange={(e) => setBaselineNote(e.target.value)}
            placeholder="Fuente del dato inicial y condiciones de medición"
            rows={2}
            style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--borde)", borderRadius: "4px", resize: "vertical" }}
          />
        </label>
      </div>
      {errors.length > 0 && (
        <ul
          role="alert"
          style={{
            margin: "0.75rem 0 0",
            padding: "0.5rem 1rem",
            background: "var(--fondo-secundario)",
            border: "1px solid var(--borde)",
            borderRadius: "4px",
            fontSize: "0.875rem",
            color: "var(--texto-principal)",
          }}
        >
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <div style={{ marginTop: "0.75rem" }}>
        <button type="button" onClick={handleSave}>
          Guardar marco de evaluación
        </button>
      </div>
      {message && <p role="status" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>{message}</p>}
    </section>
  );
}

interface MonitoringPanelProps {
  monitoring: MonitoringDraft;
  isEmpty?: boolean;
  isBlocked?: boolean;
  onSaveEvaluationFramework?: (framework: PLSEvaluationFramework) => void;
}

export function MonitoringPanel({
  monitoring,
  isEmpty = false,
  isBlocked = false,
  onSaveEvaluationFramework,
}: MonitoringPanelProps) {
  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h2>{monitoring.title}</h2>
        </div>
        <p className="panel-note">
          Registro inicial de actuaciones. No refleja ejecución real hasta
          que exista agenda validada.
        </p>
      </div>

      {isBlocked ? (
        <div className="phase-blocked-notice">
          <strong>Seguimiento no disponible</strong>
          <p>Para activar esta fase se requiere:</p>
          <ul>
            <li>Plan de Acción elaborado y revisado.</li>
            <li>Agenda anual acordada institucionalmente.</li>
          </ul>
          <p className="phase-blocked-notice__note">
            El seguimiento solo tiene sentido cuando existen actuaciones planificadas y
            compromisos institucionales establecidos. No se generan registros sin una
            agenda validada previa.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="pipeline-empty-notice">
          <strong>Sin evidencia documental</strong>
          Este seguimiento ha sido generado sobre un repositorio sin evidencia.
          Los ítems mostrados no reflejan actuaciones en ejecución ni compromisos reales.
          Incorpora documentos al repositorio para activar el seguimiento basado en el Plan de Acción.
        </div>
      ) : (
        <>
          <div className="document-list">
            {monitoring.trackedItems.map((item) => (
              <article className="document-row" key={item.id}>
                <div>
                  <p className="document-kind">{STATUS_LABEL[item.status] ?? item.status}</p>
                  <h3>{item.title}</h3>
                  <ul>
                    {item.requiredFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                  {item.notes.length > 0 && (
                    <ul className="monitoring-notes">
                      {item.notes.map((note) => (
                        <li key={note} className="monitoring-note">{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="status-pill">pendiente</span>
              </article>
            ))}
          </div>

          {monitoring.cautions.length > 0 && (
            <article className="card">
              <h3>Cautelas del seguimiento</h3>
              <ul>
                {monitoring.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </article>
          )}
        </>
      )}

      {onSaveEvaluationFramework && (
        <EvaluationFrameworkEditor
          initial={monitoring.evaluationFramework}
          onSave={onSaveEvaluationFramework}
        />
      )}
    </section>
  );
}
