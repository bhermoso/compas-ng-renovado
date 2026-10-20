import { PlanPreparationPanel } from "./PlanPreparationPanel";
import { ZAIDIN_AGING_PROPOSAL, type PlanPreparationDraft } from "../../domain/action-plan-catalog/PlanPreparationDraft";
import { useState, type ReactNode } from "react";
import { IndicatorWorksheetEditor } from "./IndicatorWorksheetEditor";
import { worksheetKey, type IndicatorWorksheet, type WorksheetContext } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import type { CatalogGeneralObjectiveTemplate, CatalogSpecificObjectiveTemplate } from "../../domain/action-plan-catalog/ActionPlanCatalog";
type RenderWorksheet = (module: ActionPlanCatalogModule, general: CatalogGeneralObjectiveTemplate, specific: CatalogSpecificObjectiveTemplate) => ReactNode;
import type {
  CatalogDecisionStatus,
  CatalogElementDecision,
  EligibleActionPlanModule,
  MunicipalActionPlanModuleReview,
} from "../../domain/action-plan-catalog";
import { createPendingModuleReview, isModuleReviewStale } from "../../domain/action-plan-catalog";
import { ACTION_PLAN_CATALOG, type ActionPlanCatalogModule } from "../../domain/action-plan-catalog";
import type { DeliberativePrioritySelection } from "../../domain/deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";

export interface LegacyActionPlanCatalogPanelProps {
  /** Qué parte del panel se muestra: "lineas" (edición), "resultante" (Plan resultante) o "todo". */
  section?: "lineas" | "resultante" | "todo";
  validatedActionPlans?: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument[];
  onValidatePlan?: (document: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument) => boolean;
  municipalityId: string;
  drafts?: PlanPreparationDraft[];
  onDraftChange?: (draft: PlanPreparationDraft) => void;
  lectura?: LecturaEstrategicaLocal;
  selection?: DeliberativePrioritySelection;
  eligibleModules: EligibleActionPlanModule[];
  reviews: MunicipalActionPlanModuleReview[];
  worksheets: IndicatorWorksheet[];
  onWorksheetChange: (sheet: IndicatorWorksheet) => void;
  onSave: (review: MunicipalActionPlanModuleReview) => readonly string[];
}

const decisionLabels: Record<CatalogDecisionStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptar",
  adapted: "Modificar / adaptar",
  rejected: "Rechazar",
};

function resolvedLegacyActionPlanText(decision: CatalogElementDecision | undefined, originalText: string): string {
  return decision?.status === "adapted" && decision.adaptedText?.trim() ? decision.adaptedText : originalText;
}

function ModuleReview({
  municipalityId,
  lectura,
  selection,
  eligible,
  savedReview,
  onSave,
  renderWorksheet,
}: Omit<LegacyActionPlanCatalogPanelProps, "eligibleModules" | "reviews" | "selection" | "lectura" | "worksheets" | "onWorksheetChange"> & {
  lectura: LecturaEstrategicaLocal;
  selection: DeliberativePrioritySelection;
  eligible: EligibleActionPlanModule;
  savedReview?: MunicipalActionPlanModuleReview;
  renderWorksheet: RenderWorksheet;
}) {
  const savedIsStale = savedReview != null && isModuleReviewStale(savedReview, eligible, lectura, selection);
  const [initial] = useState(() =>
    savedIsStale || savedReview == null
      ? createPendingModuleReview(municipalityId, eligible, lectura, selection)
      : savedReview
  );
  const [decisions, setDecisions] = useState<CatalogElementDecision[]>(initial.decisions);
  const [reviewedBy, setReviewedBy] = useState(initial.reviewedBy);
  const [violations, setViolations] = useState<readonly string[]>([]);
  const byId = new Map(decisions.map((decision) => [decision.elementId, decision]));
  const visibleText = (elementId: string, originalText: string) => resolvedLegacyActionPlanText(byId.get(elementId), originalText);

  function updateDecision(elementId: string, status: CatalogDecisionStatus, adaptedText?: string) {
    setDecisions((current) => current.map((decision) =>
      decision.elementId === elementId
        ? { elementId, status, ...(status === "adapted" ? { adaptedText: adaptedText ?? decision.adaptedText ?? "" } : {}) }
        : decision
    ));
  }

  function setAll(status: "pending" | "accepted" | "rejected") {
    setDecisions((current) => current.map(({ elementId }) => ({ elementId, status })));
  }

  function decisionControl(elementId: string, originalText: string, label = "Decisión del Grupo Motor") {
    const decision = byId.get(elementId) ?? { elementId, status: "pending" as const };
    return (
      <div className="pcm-decision">
        <label>
          <span className="pcm-decision__label">{label}</span>
          <select
            value={decision.status}
            onChange={(event) => {
              const status = event.target.value as CatalogDecisionStatus;
              updateDecision(elementId, status, status === "adapted" ? decision.adaptedText ?? originalText : undefined);
            }}
          >
            {Object.entries(decisionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        {decision.status === "adapted" && (
          <label>
            <span className="pcm-decision__label">Nueva redacción municipal</span>
            <textarea
              rows={3}
              value={decision.adaptedText ?? originalText}
              onChange={(event) => updateDecision(elementId, "adapted", event.target.value)}
            />
          </label>
        )}
      </div>
    );
  }

  function save() {
    const review: MunicipalActionPlanModuleReview = {
      ...initial,
      decisions,
      reviewedBy: reviewedBy.trim(),
      reviewedAt: new Date().toISOString(),
    };
    setViolations(onSave(review));
  }

  const resolved = decisions.filter((decision) => decision.status !== "pending").length;
  return (
    <article className="workspace-panel pcm-module">
      <div className="pcm-module__header">
        <div>
          <p className="eyebrow">Módulo propuesto · versión {eligible.module.version}</p>
          <h2>{eligible.module.title}</h2>
        </div>
        <span className="status-pill">{resolved}/{decisions.length} revisados</span>
      </div>
      <p className="panel-note">{eligible.module.strategicObjective}</p>
      <div className="pcm-line-decision">
        {decisionControl(
          eligible.module.id,
          `${eligible.module.title}\n${eligible.module.strategicObjective}`,
          "Decisión sobre la línea estratégica"
        )}
      </div>
      <p className="pcm-trace">
        Propuesto porque el Grupo Motor seleccionó la prioridad: {eligible.sourceScenarioIds.map((id) => lectura.escenarios.find((scenario) => scenario.id === id)?.tema ?? id).join(", ")}.
      </p>
      <p className="pcm-source">Fuente de la propuesta: {eligible.module.sourceLabel} ({eligible.module.sourceDate}).</p>
      {savedIsStale && (
        <div className="phase-blocked-notice">
          <strong>Revisión anterior obsoleta</strong>
          <p>La selección deliberativa, la lectura estratégica o la versión del módulo han cambiado. Debe registrarse una nueva revisión.</p>
        </div>
      )}
      <div className="pcm-bulk-actions" aria-label="Decisión sobre el módulo completo">
        <span>Aplicar al módulo completo:</span>
        <button type="button" onClick={() => setAll("accepted")}>Aceptar todo</button>
        <button type="button" onClick={() => setAll("rejected")}>Rechazar todo</button>
        <button type="button" onClick={() => setAll("pending")}>Dejar todo pendiente</button>
      </div>

      <div className="pcm-objectives">
        {eligible.module.generalObjectives.map((general) => (
          <details key={general.code} className="pcm-general">
            <summary><span>{general.code}</span> {visibleText(general.code, general.title)}</summary>
            {decisionControl(general.code, general.title)}
            <div className="pcm-specifics">
              {general.specificObjectives.map((specific) => (
                <section key={specific.code} className="pcm-specific">
                  <h3><span>{specific.code}</span> {visibleText(specific.code, specific.title)}</h3>
                  {decisionControl(specific.code, specific.title)}
                  <div className="pcm-indicator">
                    <p><strong>{specific.indicator.code}</strong> {visibleText(specific.indicator.code, specific.indicator.title)}</p>
                    <dl>
                      <div><dt>Fuente propuesta</dt><dd>{specific.indicator.suggestedSource}</dd></div>
                      <div><dt>Unidad</dt><dd>{specific.indicator.unit}</dd></div>
                      <div><dt>Periodicidad</dt><dd>{specific.indicator.periodicity}</dd></div>
                      <div><dt>Sentido</dt><dd>{specific.indicator.direction === "ascending" ? "Ascendente" : "Descendente"}</dd></div>
                    </dl>
                    <details className="pcm-sheet">
                      <summary>Ver ficha técnica propuesta</summary>
                      <dl>
                        <div><dt>Definición operacional</dt><dd>{specific.indicator.operationalDefinition}</dd></div>
                        <div><dt>Método de cálculo</dt><dd>{specific.indicator.calculationMethod}</dd></div>
                        <div><dt>Desagregación</dt><dd>{specific.indicator.disaggregation}</dd></div>
                        <div><dt>Línea base</dt><dd>{specific.indicator.baseline}</dd></div>
                        <div><dt>Meta</dt><dd>{specific.indicator.target}</dd></div>
                        <div><dt>Responsable del dato</dt><dd>{specific.indicator.dataOwner}</dd></div>
                        <div><dt>Criterio de calidad</dt><dd>{specific.indicator.qualityCriterion}</dd></div>
                        <div><dt>Limitación</dt><dd>{specific.indicator.limitation}</dd></div>
                      </dl>
                    </details>
                    {decisionControl(specific.indicator.code, specific.indicator.title)}
                    {renderWorksheet(eligible.module, general, specific)}
                  </div>
                </section>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="pcm-review-footer">
        <label>
          <span className="pcm-decision__label">Equipo o Grupo Motor que registra la revisión</span>
          <input value={reviewedBy} onChange={(event) => setReviewedBy(event.target.value)} />
        </label>
        {violations.length > 0 && <ul className="deliberative-selection__violations">{violations.map((v) => <li key={v}>{v}</li>)}</ul>}
        <button type="button" className="tp-panel__open-btn" onClick={save}>Guardar revisión del módulo</button>
      </div>

      <div className="pcm-cautions">
        <strong>Límites de la propuesta</strong>
        <ul>{eligible.module.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
      </div>
    </article>
  );
}

function AvailableModule({ module, renderWorksheet }: { module: ActionPlanCatalogModule; renderWorksheet: RenderWorksheet }) {
  const specifics = module.generalObjectives.flatMap((general) => general.specificObjectives);
  return (
    <article className="workspace-panel pcm-module pcm-module--available">
      <div className="pcm-module__header">
        <div>
          <p className="eyebrow">Línea disponible · versión {module.version}</p>
          <h2>{module.title}</h2>
        </div>
        <span className="status-pill">Consulta</span>
      </div>
      <p className="panel-note">{module.strategicObjective}</p>
      <p className="pcm-locked-note">
        Puedes examinar su arquitectura. Para aceptar, adaptar o rechazar sus elementos,
        el Grupo Motor debe relacionar expresamente esta línea con una prioridad seleccionada.
      </p>
      <p className="pcm-source">Fuente de la propuesta: {module.sourceLabel} ({module.sourceDate}).</p>
      <p className="pcm-counts">{module.generalObjectives.length} objetivos generales · {specifics.length} objetivos específicos · {specifics.length} indicadores</p>
      <div className="pcm-objectives">
        {module.generalObjectives.map((general) => (
          <details key={general.code} className="pcm-general">
            <summary><span>{general.code}</span> {general.title}</summary>
            <div className="pcm-specifics pcm-specifics--preview">
              {general.specificObjectives.map((specific) => (
                <section key={specific.code} className="pcm-specific">
                  <h3><span>{specific.code}</span> {specific.title}</h3>
                  <p className="pcm-preview-indicator"><strong>{specific.indicator.code}</strong> {specific.indicator.title}</p>
                  <details className="pcm-sheet">
                    <summary>Ver ficha técnica propuesta</summary>
                    <dl>
                      <div><dt>Fuente propuesta</dt><dd>{specific.indicator.suggestedSource}</dd></div>
                      <div><dt>Unidad</dt><dd>{specific.indicator.unit}</dd></div>
                      <div><dt>Periodicidad</dt><dd>{specific.indicator.periodicity}</dd></div>
                      <div><dt>Sentido</dt><dd>{specific.indicator.direction === "ascending" ? "Ascendente" : "Descendente"}</dd></div>
                      <div><dt>Definición operacional</dt><dd>{specific.indicator.operationalDefinition}</dd></div>
                      <div><dt>Método de cálculo</dt><dd>{specific.indicator.calculationMethod}</dd></div>
                      <div><dt>Desagregación</dt><dd>{specific.indicator.disaggregation}</dd></div>
                      <div><dt>Línea base</dt><dd>{specific.indicator.baseline}</dd></div>
                      <div><dt>Meta</dt><dd>{specific.indicator.target}</dd></div>
                      <div><dt>Responsable del dato</dt><dd>{specific.indicator.dataOwner}</dd></div>
                      <div><dt>Criterio de calidad</dt><dd>{specific.indicator.qualityCriterion}</dd></div>
                      <div><dt>Limitación</dt><dd>{specific.indicator.limitation}</dd></div>
                    </dl>
                  </details>
                  {renderWorksheet(module, general, specific)}
                </section>
              ))}
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}

export function LegacyActionPlanCatalogPanel(props: LegacyActionPlanCatalogPanelProps) {
  const worksheetRenderer = (preparation: boolean): RenderWorksheet => (module, general, specific) => {
    const eligible = props.eligibleModules.find((item) => item.module.id === module.id);
    const review = props.reviews.find((item) => item.moduleId === module.id);
    const current = !preparation && review && review.moduleVersion === module.version && eligible && props.lectura && props.selection &&
      !isModuleReviewStale(review, eligible, props.lectura, props.selection);
    const decisions = current ? review.decisions : [];
    const title = (id: string, original: string) => {
      const decision = decisions.find((item) => item.elementId === id);
      return decision?.status === "adapted" && decision.adaptedText?.trim() ? decision.adaptedText : original;
    };
    const ids = [module.id, general.code, specific.code, specific.indicator.code];
    const rejected = ids.some((id) => decisions.find((item) => item.elementId === id)?.status === "rejected");
    const accepted = ids.every((id) => ["accepted", "adapted"].includes(decisions.find((item) => item.elementId === id)?.status ?? "pending"));
    const reviewNotice = preparation ? "Ficha de trabajo vinculada al texto vigente del territorio. Los cambios de objetivos e indicadores se guardan directamente en el expediente."
      : rejected ? "Algún elemento de esta línea u objetivo está rechazado. La ficha se conserva como borrador y no representa un compromiso del Plan."
      : accepted ? "Los elementos cuentan con revisión guardada del Grupo Motor. La definición de medición y las actuaciones de esta ficha requieren sus propios acuerdos."
      : "Propuesta pendiente de revisión vigente del Grupo Motor. Puedes preparar la recogida de datos sin incorporar el objetivo al Plan.";
    const context: WorksheetContext = {
      municipalityId: props.municipalityId, moduleId: module.id, moduleVersion: module.version,
      line: title(module.id, module.title), generalObjective: `${general.code} · ${title(general.code, general.title)}`,
      objective: `${specific.code} · ${title(specific.code, specific.title)}`,
      indicatorCode: specific.indicator.code, indicator: title(specific.indicator.code, specific.indicator.title),
      unit: specific.indicator.unit, source: module.sourceLabel,
    };
    return <IndicatorWorksheetEditor key={worksheetKey(context)} context={context} reviewNotice={reviewNotice}
      sheet={props.worksheets.find((sheet) => worksheetKey(sheet.context) === worksheetKey(context))}
      onChange={props.onWorksheetChange} />;
  };
  const renderWorksheet = worksheetRenderer(false);
  const directTerritorialEdit = Boolean(props.onDraftChange);
  return (
    <div className="pcm-root">
      <section className="workspace-panel pcm-catalog-header">
        <p className="eyebrow">Catálogo RELAS de Plan de Acción</p>
        <h2>Líneas estratégicas disponibles</h2>
        <p className="panel-note">
          {directTerritorialEdit
            ? "Selecciona, excluye o modifica líneas, objetivos e indicadores. Al marcar Modificar, la nueva redacción queda guardada como texto vigente de este expediente territorial; la aprobación del Grupo Motor es una fase institucional distinta."
            : "Prepara tu selección de líneas, objetivos e indicadores en el borrador. La aprobación formal es posterior: la revisión se habilita solo cuando el Grupo Motor relaciona una línea con una prioridad seleccionada. Cada indicador dispone de una ficha cumplimentable con actuaciones y entregas de datos, preparable como borrador."}
        </p>
      </section>
      {props.onDraftChange && ACTION_PLAN_CATALOG.map(original => {
        const module = props.municipalityId === "granada-zaidin" && original.id === ZAIDIN_AGING_PROPOSAL.id ? ZAIDIN_AGING_PROPOSAL : original;
        return <PlanPreparationPanel key={`${props.municipalityId}-${module.id}`} municipalityId={props.municipalityId} module={module}
          draft={props.drafts?.find(d => d.moduleId === module.id && d.municipalityId === props.municipalityId)} onChange={props.onDraftChange!} renderWorksheet={worksheetRenderer(true)}/>;
      })}
      {!directTerritorialEdit && <>
      <details><summary>Revisión formal y catálogo original · versión 3.1</summary>
      <p>Las decisiones anteriores se conservan. La propuesta de cuatro bloques requiere su propia revisión; no hereda la aprobación del catálogo original.</p>
      {ACTION_PLAN_CATALOG.map((module) => {
        const eligible = props.eligibleModules.find((candidate) => candidate.module.id === module.id);
        return eligible != null && props.selection != null && props.lectura != null ? (
          <ModuleReview
            key={`${module.id}-${props.selection.id}`}
            municipalityId={props.municipalityId}
            lectura={props.lectura}
            selection={props.selection}
            onSave={props.onSave}
            renderWorksheet={renderWorksheet}
            eligible={eligible}
            savedReview={props.reviews.find((review) => review.moduleId === module.id)}
          />
        ) : <AvailableModule key={module.id} module={module} renderWorksheet={renderWorksheet} />;
      })}
      </details>
      </>}
    </div>
  );
}
