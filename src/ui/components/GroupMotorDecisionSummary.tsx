import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import { OWN_PRIORITY_ORIGIN_LABELS, type DeliberativePrioritySelection } from "../../domain/deliberative-prioritisation";
import { ACTION_PLAN_CATALOG } from "../../domain/action-plan-catalog";
import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";

/**
 * Lectura de la decisión vigente del Grupo Motor: recomendaciones del Perfil
 * adoptadas, prioridades propias (no proceden del Perfil) y líneas del Plan.
 * Solo muestra lo registrado; no interpreta ni completa.
 */
export function GroupMotorDecisionSummary({ selection, lectura, isStale, registerHint }: {
  selection?: DeliberativePrioritySelection;
  lectura?: LecturaEstrategicaLocal;
  isStale: boolean;
  /** Texto que indica dónde se registra o modifica la decisión. */
  registerHint?: string;
}) {
  if (!selection) {
    return (
      <section className="workspace-panel priority-decision">
        <p className="eyebrow">Decisión del Grupo Motor</p>
        <p className="empty-state">El Grupo Motor no ha registrado todavía su decisión.{registerHint ? ` ${registerHint}` : ""}</p>
      </section>
    );
  }
  const moduleTitle = (id: string) => ACTION_PLAN_CATALOG.find((m) => m.id === id)?.title ?? id;
  const adopted = selection.selectedScenarioIds.map((id) => {
    const scenario = lectura?.escenarios.find((s) => s.id === id);
    const lines = (selection.catalogModuleLinks ?? []).filter((l) => l.scenarioId === id).map((l) => moduleTitle(l.moduleId));
    return { id, title: scenario?.tema ?? id, lines };
  });
  const lines = [...new Set([
    ...(selection.catalogModuleLinks ?? []).map((l) => l.moduleId),
    ...(selection.ownPriorities ?? []).flatMap((o) => o.catalogModuleIds),
  ])].map(moduleTitle);

  return (
    <section className="workspace-panel priority-decision">
      <p className="eyebrow">Decisión del Grupo Motor</p>
      <h2>Prioridades adoptadas</h2>
      <p className="panel-note">
        Adoptada por {selection.decidedBy} el {new Date(selection.decidedAt).toLocaleDateString("es-ES")}.
        {registerHint ? ` ${registerHint}` : ""}
      </p>
      {isStale && (
        <div className="phase-blocked-notice">
          <strong>Decisión pendiente de renovación</strong>
          <p>El Perfil vigente, sus recomendaciones elegidas o la priorización ciudadana han cambiado desde que se registró.</p>
        </div>
      )}
      {lines.length > 0 && <p><strong>Líneas del Plan de Acción:</strong> {lines.join(" · ")}</p>}
      {adopted.length > 0 && (
        <div>
          <p className="deliberative-selection__label">Recomendaciones del Perfil adoptadas</p>
          <ul>{adopted.map((a) => <li key={a.id}>{a.title}{a.lines.length ? ` → ${a.lines.join(", ")}` : ""}</li>)}</ul>
        </div>
      )}
      {(selection.ownPriorities?.length ?? 0) > 0 && (
        <div>
          <p className="deliberative-selection__label">Prioridades propias del Grupo Motor</p>
          <ul>
            {selection.ownPriorities!.map((own) => (
              <li key={own.id}>
                <strong>{own.title}</strong>
                <span className="deliberative-selection__own-badge">No procede del Perfil · {OWN_PRIORITY_ORIGIN_LABELS[own.origin]}</span>
                {own.citizenTopicIds.length > 0 && <> · temáticas: {own.citizenTopicIds.map((id) => THEMATIC_TOPICS.find((t) => t.id === id)?.label ?? id).join(", ")}</>}
                {own.catalogModuleIds.length > 0 && <> → {own.catalogModuleIds.map(moduleTitle).join(", ")}</>}
                <br />{own.rationale}
              </li>
            ))}
          </ul>
        </div>
      )}
      <details>
        <summary>Motivación e influencia ciudadana</summary>
        <p>{selection.deliberationRationale}</p>
        <p>{selection.citizenInfluenceStatement}</p>
      </details>
    </section>
  );
}
