import { useState } from "react";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import type { ThematicPrioritisation } from "../../domain/thematic-prioritisation";
import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";
import type { DeliberativePrioritySelection } from "../../domain/deliberative-prioritisation";
import { ACTION_PLAN_CATALOG } from "../../domain/action-plan-catalog";

interface DeliberativePrioritySelectionPanelProps {
  lectura: LecturaEstrategicaLocal;
  citizenPrioritisation?: ThematicPrioritisation;
  selection?: DeliberativePrioritySelection;
  isStale: boolean;
  onSave: (input: {
    selectedScenarioIds: string[];
    catalogModuleLinks: Array<{ scenarioId: string; moduleId: string }>;
    deliberationRationale: string;
    citizenInfluenceStatement: string;
    decidedBy: string;
  }) => readonly string[];
}

export function DeliberativePrioritySelectionPanel({
  lectura,
  citizenPrioritisation,
  selection,
  isStale,
  onSave,
}: DeliberativePrioritySelectionPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selection?.selectedScenarioIds ?? []);
  const [catalogModuleLinks, setCatalogModuleLinks] = useState(selection?.catalogModuleLinks ?? []);
  const [rationale, setRationale] = useState(selection?.deliberationRationale ?? "");
  const [citizenInfluence, setCitizenInfluence] = useState(selection?.citizenInfluenceStatement ?? "");
  const [decidedBy, setDecidedBy] = useState(selection?.decidedBy ?? "");
  const [violations, setViolations] = useState<readonly string[]>([]);

  function toggleScenario(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        setCatalogModuleLinks((links) => links.filter((link) => link.scenarioId !== id));
        return current.filter((candidateId) => candidateId !== id);
      }
      return [...current, id];
    });
  }

  function toggleCatalogModule(scenarioId: string, moduleId: string) {
    setCatalogModuleLinks((current) => {
      const exists = current.some((link) => link.scenarioId === scenarioId && link.moduleId === moduleId);
      return exists
        ? current.filter((link) => link.scenarioId !== scenarioId || link.moduleId !== moduleId)
        : [...current, { scenarioId, moduleId }];
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setViolations(onSave({
      selectedScenarioIds: selectedIds,
      catalogModuleLinks,
      deliberationRationale: rationale,
      citizenInfluenceStatement: citizenInfluence,
      decidedBy,
    }));
  }

  const citizenTopicIds = citizenPrioritisation?.selectedTopicIds ?? [];

  return (
    <section className="workspace-panel deliberative-selection">
      <p className="eyebrow">Compuerta deliberativa · Grupo Motor</p>
      <h2>Selección de prioridades</h2>
      <p className="panel-note">
        La lectura estratégica aporta candidaturas y la participación ciudadana aporta conocimiento independiente.
        COMPÁS no cruza ni selecciona automáticamente: el Grupo Motor decide, motiva y deja
        constancia de cómo influyó la ciudadanía.
      </p>

      {selection != null && !isStale && (
        <p className="deliberative-selection__status">
          Selección vigente adoptada por {selection.decidedBy} el{" "}
          {new Date(selection.decidedAt).toLocaleDateString("es-ES")}.
        </p>
      )}
      {isStale && (
        <div className="phase-blocked-notice">
          <strong>Selección pendiente de renovación</strong>
          <p>El PSL, la Lectura Estratégica o la priorización ciudadana han cambiado.</p>
        </div>
      )}

      <form className="deliberative-selection__form" onSubmit={submit}>
        <fieldset>
          <legend>Candidaturas de la lectura estratégica</legend>
          {lectura.escenarios.map((scenario) => {
            const selected = selectedIds.includes(scenario.id);
            return (
              <div key={scenario.id} className="deliberative-selection__candidate-block">
                <label className="deliberative-selection__candidate">
                  <input type="checkbox" checked={selected} onChange={() => toggleScenario(scenario.id)} />
                  <span>{scenario.tema}</span>
                </label>
                {selected && (
                  <fieldset className="deliberative-selection__catalog-links">
                    <legend>Relacionar esta prioridad con líneas disponibles del catálogo</legend>
                    {ACTION_PLAN_CATALOG.map((module) => (
                      <label key={module.id}>
                        <input
                          type="checkbox"
                          checked={catalogModuleLinks.some((link) => link.scenarioId === scenario.id && link.moduleId === module.id)}
                          onChange={() => toggleCatalogModule(scenario.id, module.id)}
                        />
                        <span>{module.title}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            );
          })}
        </fieldset>

        <div>
          <p className="deliberative-selection__label">Priorización ciudadana disponible</p>
          {citizenTopicIds.length > 0 ? (
            <div className="tp-chips">
              {citizenTopicIds.map((id) => (
                <span key={id} className="tp-chip">
                  {THEMATIC_TOPICS.find((topic) => topic.id === id)?.label ?? id}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-state">No consta todavía una priorización ciudadana.</p>
          )}
        </div>

        <label>
          <span className="deliberative-selection__label">Motivación de la selección</span>
          <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} rows={4} />
        </label>
        <label>
          <span className="deliberative-selection__label">Influencia del conocimiento ciudadano</span>
          <textarea
            value={citizenInfluence}
            onChange={(event) => setCitizenInfluence(event.target.value)}
            rows={4}
            placeholder="Documenta su influencia o, si no existe aportación disponible, deja constancia expresa."
          />
        </label>
        <label>
          <span className="deliberative-selection__label">Grupo Motor que adopta la decisión</span>
          <input value={decidedBy} onChange={(event) => setDecidedBy(event.target.value)} />
        </label>

        {violations.length > 0 && (
          <ul className="deliberative-selection__violations">
            {violations.map((violation) => <li key={violation}>{violation}</li>)}
          </ul>
        )}
        <button type="submit" className="tp-panel__open-btn">
          {selection == null || isStale ? "Registrar selección del Grupo Motor" : "Actualizar selección"}
        </button>
      </form>
    </section>
  );
}
