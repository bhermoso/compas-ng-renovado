import { useState } from "react";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import type { ThematicPrioritisation } from "../../domain/thematic-prioritisation";
import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";
import { OWN_PRIORITY_ORIGIN_LABELS, type DeliberativePrioritySelection, type GroupMotorOwnPriority } from "../../domain/deliberative-prioritisation";

type OwnPriorityDraft = Omit<GroupMotorOwnPriority, "id">;
const EMPTY_OWN: OwnPriorityDraft = { title: "", origin: "group-motor-deliberation", citizenTopicIds: [], catalogModuleIds: [], rationale: "" };
import { ACTION_PLAN_CATALOG } from "../../domain/action-plan-catalog";

interface DeliberativePrioritySelectionPanelProps {
  lectura: LecturaEstrategicaLocal;
  citizenPrioritisation?: ThematicPrioritisation;
  selection?: DeliberativePrioritySelection;
  isStale: boolean;
  onSave: (input: {
    selectedScenarioIds: string[];
    catalogModuleLinks: Array<{ scenarioId: string; moduleId: string }>;
    ownPriorities: OwnPriorityDraft[];
    deliberationRationale: string;
    citizenInfluenceStatement: string;
    decidedBy: string;
    decisionDate: string;
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
  const [ownPriorities, setOwnPriorities] = useState<OwnPriorityDraft[]>(
    (selection?.ownPriorities ?? []).map(({ id: _id, ...rest }) => rest)
  );
  const [rationale, setRationale] = useState(selection?.deliberationRationale ?? "");
  const [citizenInfluence, setCitizenInfluence] = useState(selection?.citizenInfluenceStatement ?? "");
  const [decidedBy, setDecidedBy] = useState(selection?.decidedBy ?? "");
  const [decisionDate, setDecisionDate] = useState(
    selection?.decidedAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
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

  function updateOwn(index: number, patch: Partial<OwnPriorityDraft>) {
    setOwnPriorities((current) => current.map((own, i) => (i === index ? { ...own, ...patch } : own)));
  }

  function toggleIn(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setViolations(onSave({
      selectedScenarioIds: selectedIds,
      catalogModuleLinks,
      ownPriorities,
      deliberationRationale: rationale,
      citizenInfluenceStatement: citizenInfluence,
      decidedBy,
      decisionDate,
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
          <legend>Recomendaciones del Perfil vigente</legend>
          {lectura.escenarios.length === 0 && (
            <p className="empty-state">
              El Perfil vigente no tiene recomendaciones elegidas por el equipo técnico. El Grupo Motor puede
              registrar igualmente sus prioridades propias.
            </p>
          )}
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

        <fieldset className="deliberative-selection__own">
          <legend>Prioridades propias del Grupo Motor (no proceden del Perfil)</legend>
          <p className="panel-note">
            Prioridades que el Grupo Motor adopta por priorización ciudadana o por su propia deliberación, sin una
            recomendación del Perfil que las respalde. Se registran con su origen y su motivación.
          </p>
          {ownPriorities.map((own, index) => (
            <div key={index} className="deliberative-selection__own-item">
              <label>
                <span className="deliberative-selection__label">Prioridad</span>
                <input value={own.title} onChange={(event) => updateOwn(index, { title: event.target.value })} />
              </label>
              <div className="deliberative-selection__own-origin" role="radiogroup" aria-label="Origen de la prioridad">
                {(Object.keys(OWN_PRIORITY_ORIGIN_LABELS) as OwnPriorityDraft["origin"][]).map((origin) => (
                  <label key={origin}>
                    <input
                      type="radio"
                      name={`own-origin-${index}`}
                      checked={own.origin === origin}
                      onChange={() => updateOwn(index, { origin, citizenTopicIds: origin === "citizen-prioritisation" ? own.citizenTopicIds : [] })}
                    />
                    <span>{OWN_PRIORITY_ORIGIN_LABELS[origin]}</span>
                  </label>
                ))}
              </div>
              {own.origin === "citizen-prioritisation" && (
                <fieldset className="deliberative-selection__catalog-links">
                  <legend>Temáticas de la priorización ciudadana en las que se apoya</legend>
                  {citizenTopicIds.length === 0 && <p className="empty-state">No consta una priorización ciudadana registrada.</p>}
                  {citizenTopicIds.map((id) => (
                    <label key={id}>
                      <input type="checkbox" checked={own.citizenTopicIds.includes(id)} onChange={() => updateOwn(index, { citizenTopicIds: toggleIn(own.citizenTopicIds, id) })} />
                      <span>{THEMATIC_TOPICS.find((topic) => topic.id === id)?.label ?? id}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <fieldset className="deliberative-selection__catalog-links">
                <legend>Líneas del catálogo que la desarrollan</legend>
                {ACTION_PLAN_CATALOG.map((module) => (
                  <label key={module.id}>
                    <input type="checkbox" checked={own.catalogModuleIds.includes(module.id)} onChange={() => updateOwn(index, { catalogModuleIds: toggleIn(own.catalogModuleIds, module.id) })} />
                    <span>{module.title}</span>
                  </label>
                ))}
              </fieldset>
              <label>
                <span className="deliberative-selection__label">Motivación de esta prioridad</span>
                <textarea rows={3} value={own.rationale} onChange={(event) => updateOwn(index, { rationale: event.target.value })} />
              </label>
              <button type="button" className="deliberative-selection__own-remove" onClick={() => setOwnPriorities((current) => current.filter((_, i) => i !== index))}>
                Quitar esta prioridad
              </button>
            </div>
          ))}
          <button type="button" className="deliberative-selection__own-add" onClick={() => setOwnPriorities((current) => [...current, { ...EMPTY_OWN }])}>
            Añadir prioridad propia
          </button>
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
          <span className="deliberative-selection__label">Motivación de la decisión en su conjunto</span>
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
        <label>
          <span className="deliberative-selection__label">Fecha de la decisión</span>
          <input
            type="date"
            value={decisionDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDecisionDate(event.target.value)}
          />
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
