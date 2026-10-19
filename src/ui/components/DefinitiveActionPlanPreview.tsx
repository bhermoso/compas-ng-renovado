import { PlanDocumentActions } from "./PlanDocumentActions";
import { useMemo, useRef, useState } from "react";
import type { ActionPlanCatalogModule } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import {
  buildDefinitiveActionPlanProjection,
  pendingPreparationDecisionCount,
  resolvedPlanDecisionText,
  type DefinitiveActionPlanModuleProjection,
} from "../../domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { buildActionPlanTraceability } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import type { PlanPreparationDraft } from "../../domain/action-plan-catalog/PlanPreparationDraft";
import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import { compareActionPlanNotation, thematicBlockNameFor } from "../../domain/action-plan-catalog/PlanPreparationDraft";
import type { ActionPlanTraceabilityLink } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import { validateActionPlanUnaddressedNeeds } from "../../application/action-plan/ActionPlanEngine";
import type { UnaddressedNeed } from "../../domain/health-plan";

/** Abre la ficha del indicador (y los desplegables que la contienen) y la muestra. */
function openIndicatorFicha(indicatorCode: string) {
  const target = document.getElementById(`ficha-${indicatorCode}`);
  if (!target) return;
  for (let node: HTMLElement | null = target; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fichaStatusLabel(status: ActionPlanTraceabilityLink["indicatorFichaStatus"]): string {
  if (status === "missing") return "ficha pendiente";
  if (status === "draft") return "ficha abierta sin actuaciones";
  return "ficha con actuaciones vinculadas";
}

function UnaddressedNeedsEditor({
  active,
  onDraftChange,
}: {
  active: DefinitiveActionPlanModuleProjection[];
  onDraftChange: (draft: PlanPreparationDraft) => void;
}) {
  const targetItem = active.find((item) => item.draft);
  const currentNeeds = targetItem?.draft?.unaddressedNeeds;

  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newJustification, setNewJustification] = useState("");
  const [message, setMessage] = useState("");

  if (!targetItem?.draft) return null;
  const draft = targetItem.draft;

  function handleNoneLeft() {
    onDraftChange({ ...draft, unaddressedNeeds: [] });
    setMessage("Registrado: ninguna necesidad quedó fuera del Plan de Acción.");
  }

  function handleAddNeed() {
    const need: UnaddressedNeed = {
      id: newId.trim(),
      title: newTitle.trim(),
      justification: newJustification.trim(),
    };
    const errors = validateActionPlanUnaddressedNeeds([need]);
    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }
    const needs = [
      ...(currentNeeds ?? []).filter((n) => n.id !== need.id),
      need,
    ];
    onDraftChange({ ...draft, unaddressedNeeds: needs });
    setNewId("");
    setNewTitle("");
    setNewJustification("");
    setMessage("Necesidad registrada.");
  }

  function handleRemoveNeed(id: string) {
    onDraftChange({
      ...draft,
      unaddressedNeeds: (currentNeeds ?? []).filter((n) => n.id !== id),
    });
  }

  const noneLeft = currentNeeds !== undefined && currentNeeds.length === 0;

  return (
    <section
      className="card"
      aria-label="Necesidades no priorizadas (G-PLS-7)"
      style={{ marginTop: "1.5rem" }}
    >
      <h3 style={{ marginTop: 0 }}>Necesidades no priorizadas · G-PLS-7</h3>
      <p className="panel-note">
        El PLS debe documentar qué necesidades identificadas en el diagnóstico
        no han sido seleccionadas en este ciclo, con su justificación. Si todas
        las necesidades quedaron incluidas, usa el botón correspondiente.
      </p>

      {noneLeft ? (
        <p style={{ fontWeight: 600, color: "var(--texto-principal)" }}>
          Registrado: ninguna necesidad identificada quedó fuera del Plan de Acción.
        </p>
      ) : currentNeeds && currentNeeds.length > 0 ? (
        <ul style={{ padding: 0, listStyle: "none", margin: "0 0 0.75rem" }}>
          {currentNeeds.map((need) => (
            <li
              key={need.id}
              style={{
                borderBottom: "1px solid var(--borde)",
                padding: "0.5rem 0",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{need.title}</strong>
                {need.sourceAreaId && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--texto-secundario)" }}>
                    ({need.sourceAreaId})
                  </span>
                )}
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem", color: "var(--texto-secundario)" }}>
                  {need.justification}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveNeed(need.id)}
                style={{ fontSize: "0.8rem", flexShrink: 0 }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : currentNeeds === undefined ? (
        <p className="panel-note">
          Pendiente de documentar. Usa el formulario o declara que todas están incluidas.
        </p>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button type="button" onClick={handleNoneLeft}>
          Ninguna necesidad quedó fuera
        </button>
      </div>

      <fieldset style={{ border: "1px solid var(--borde)", borderRadius: "4px", padding: "0.75rem" }}>
        <legend style={{ fontWeight: 600, fontSize: "0.875rem", padding: "0 0.25rem" }}>
          Añadir necesidad no priorizada
        </legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.875rem" }}>
            Identificador único
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="p.ej. n-salud-mental"
              style={{ padding: "0.35rem 0.5rem", border: "1px solid var(--borde)", borderRadius: "4px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.875rem" }}>
            Título de la necesidad
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Necesidad identificada en el diagnóstico"
              style={{ padding: "0.35rem 0.5rem", border: "1px solid var(--borde)", borderRadius: "4px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.875rem" }}>
            Justificación de la no priorización
            <textarea
              value={newJustification}
              onChange={(e) => setNewJustification(e.target.value)}
              placeholder="Por qué no se aborda en este ciclo"
              rows={2}
              style={{ padding: "0.35rem 0.5rem", border: "1px solid var(--borde)", borderRadius: "4px", resize: "vertical" }}
            />
          </label>
          <button type="button" onClick={handleAddNeed} style={{ alignSelf: "flex-start" }}>
            Añadir necesidad
          </button>
        </div>
      </fieldset>

      {message && (
        <p role="status" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          {message}
        </p>
      )}
    </section>
  );
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function groupTraceabilityByBlock(links: ActionPlanTraceabilityLink[]): Array<{
  code: string;
  name: string;
  links: ActionPlanTraceabilityLink[];
}> {
  const byBlock = new Map<string, { code: string; name: string; links: ActionPlanTraceabilityLink[] }>();
  for (const link of links) {
    const current = byBlock.get(link.thematicBlockCode) ?? {
      code: link.thematicBlockCode,
      name: link.thematicBlock,
      links: [],
    };
    current.links.push(link);
    byBlock.set(link.thematicBlockCode, current);
  }
  return Array.from(byBlock.values());
}

export function DefinitiveActionPlanPreview({municipalityId, modules, drafts, worksheets = [], validatedActionPlans, onValidatePlan, onDraftChange}: {
  validatedActionPlans?: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument[];
  onValidatePlan?: (document: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument) => boolean;
  onDraftChange?: (draft: PlanPreparationDraft) => void;
  municipalityId: string;
  modules: ActionPlanCatalogModule[];
  drafts?: PlanPreparationDraft[];
  worksheets?: IndicatorWorksheet[];
}) {
  const municipalityName = municipalityId === "granada-zaidin" ? "El Zaidín" : municipalityId;
  const active = useMemo(() => buildDefinitiveActionPlanProjection(municipalityId, modules, drafts), [municipalityId, modules, drafts]);
  const traceability = useMemo(() => buildActionPlanTraceability(municipalityId, active, worksheets), [municipalityId, active, worksheets]);

  const pending = active.reduce((total, item) => total + pendingPreparationDecisionCount(item.module, item.draft), 0);
  const selectedObjectives = active.reduce((total, item) => total + item.rows.length, 0);
  const selectedIndicators = active.reduce((total, item) => total + item.rows.filter(row => row.indicatorIncluded).length, 0);
  const linkedActionCards = traceability.reduce((total, link) => total + link.actionCards.length, 0);
  const linkedActivities = traceability.reduce((total, link) => total + link.actionCards.reduce((sum, action) => sum + action.activities.length, 0), 0);
  const generationSignature = JSON.stringify(active.map(({ module, draft, rows }) => ({
    moduleId: module.id,
    version: module.version,
    updatedAt: draft?.updatedAt,
    rows: rows.map(row => ({
      objective: row.specific.code,
      objectiveText: resolvedPlanDecisionText(row.objectiveDecision, row.specific.title),
      indicator: row.specific.indicator.code,
      indicatorIncluded: row.indicatorIncluded,
      indicatorText: resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title),
    })),
  })));
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasSelectableContent = selectedObjectives > 0 || selectedIndicators > 0;
  const generated = hasSelectableContent && generatedSignature === generationSignature;

  function generatePlan() {
    setGeneratedSignature(generationSignature);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function printGeneratedPlan() {
    if (!generated) generatePlan();
    window.setTimeout(() => window.print(), 0);
  }

  return <section className="workspace-panel pcm-definitive-plan" aria-label={`Plan de Acción resultante · ${municipalityName}`}>
    <PlanDocumentActions key={municipalityId} municipalityId={municipalityId} active={active} versions={validatedActionPlans} worksheets={worksheets} onValidate={onValidatePlan}/>
    {onDraftChange && active.some((item) => item.draft) && (
      <UnaddressedNeedsEditor active={active} onDraftChange={onDraftChange} />
    )}
    <div className="pcm-module__header">
      <div>
        <p className="eyebrow">Vista consolidada del borrador territorial</p>
        <h2>Plan de Acción resultante · {municipalityName}</h2>
      </div>
      <span className="status-pill">{pending === 0 && active.length > 0 ? "Listo para versión definitiva" : `${pending} pendientes`}</span>
    </div>
    <p className="panel-note">Esta vista utiliza únicamente los elementos marcados como <strong>Incluir</strong> o <strong>Modificar</strong>. Los modificados conservan su redacción territorial; los excluidos no se incorporan.</p>
    {active.length === 0 ? <p>No hay todavía líneas con decisiones territoriales. Selecciona o modifica elementos para construir el Plan de Acción.</p> : <>
      <p><strong>{selectedObjectives}</strong> objetivos específicos seleccionados · <strong>{selectedIndicators}</strong> indicadores seleccionados.</p>
      <section className="pcm-traceability-map" aria-label="Mapa de vínculos del Plan de Acción">
        <div className="pcm-module__header">
          <div>
            <p className="eyebrow">Mapa de vínculos</p>
            <h3>Árbol operativo de objetivos, indicadores y actividades</h3>
          </div>
          <span className="status-pill">{linkedActionCards} fichas · {linkedActivities} actividades</span>
        </div>
        <p className="panel-note">Cada rama conserva la cadena línea estratégica → bloque → objetivo → indicador → ficha → actuación → actividades y entregas. Si falta una pieza, se declara como pendiente.</p>
        <div className="pcm-operational-tree" aria-label="Árbol operativo de actividades vinculadas a objetivos e indicadores">
          {active.map(({ module, moduleDecision }) => {
            const moduleLinks = traceability.filter((link) => link.moduleId === module.id);
            if (moduleLinks.length === 0) return null;
            return <article className="pcm-tree-module" key={module.id}>
              <div className="pcm-tree-module__header">
                <div>
                  <p className="eyebrow">Línea estratégica</p>
                  <h4>{module.title}</h4>
                </div>
                <span className="status-pill">{countLabel(moduleLinks.length, "indicador", "indicadores")}</span>
              </div>
              <p className="pcm-tree-strategic"><strong>Objetivo estratégico:</strong> {resolvedPlanDecisionText(moduleDecision, module.strategicObjective)}</p>
              {groupTraceabilityByBlock(moduleLinks).map((block) => (
                <details className="pcm-tree-block" key={block.code} open>
                  <summary>
                    <span>{block.name}</span>
                    <small>{block.links.length} indicador{block.links.length === 1 ? "" : "es"}</small>
                  </summary>
                  <div className="pcm-tree-branches">
                    {block.links.map((link) => (
                      <article className="pcm-tree-branch" key={link.indicatorWorksheetKey}>
                        <div className="pcm-tree-node pcm-tree-node--objective">
                          <span className="pcm-tree-node__label">Objetivo específico</span>
                          <p><strong>{link.objectiveCode}</strong> · {link.objectiveTitle}</p>
                        </div>
                        <div className="pcm-tree-node pcm-tree-node--indicator">
                          <span className="pcm-tree-node__label">Indicador de seguimiento</span>
                          <p><strong>{link.indicatorCode}</strong> · {link.indicatorTitle}</p>
                        </div>
                        <div className={`pcm-tree-node pcm-tree-node--ficha pcm-tree-node--${link.indicatorFichaStatus}`}>
                          <span className="pcm-tree-node__label">Ficha del indicador</span>
                          <p>{fichaStatusLabel(link.indicatorFichaStatus)} · {countLabel(link.actionCards.length, "actuación", "actuaciones")} · {countLabel(link.consolidationCount, "consolidación", "consolidaciones")}</p>
                        </div>
                        {link.actionCards.length === 0 ? (
                          <p className="pcm-tree-empty">Sin actuaciones vinculadas todavía.</p>
                        ) : (
                          <div className="pcm-tree-actions">
                            {link.actionCards.map((action) => (
                              <article className="pcm-tree-action" key={action.id}>
                                <span className="pcm-tree-node__label">Actuación → actividades → entregas</span>
                                <h5>{action.name}</h5>
                                <dl>
                                  <div><dt>Responsable</dt><dd>{action.owner}</dd></div>
                                  <div><dt>Calendario</dt><dd>{action.schedule}</dd></div>
                                  <div><dt>Datos que entrega</dt><dd>{action.requestedData}</dd></div>
                                </dl>
                                {action.activities.length > 0 ? (
                                  <ul className="pcm-tree-activities">
                                    {action.activities.map((activity) => (
                                      <li key={activity.id}>
                                        <strong>{activity.name}</strong>
                                        <span>{activity.status} · {activity.schedule} · evidencia: {activity.evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="pcm-tree-empty">Actividad concreta pendiente.</p>
                                )}
                                <p className="pcm-tree-deliveries">{countLabel(action.deliveryCount, "entrega registrada", "entregas registradas")}.</p>
                                {action.missingFields.length > 0 && (
                                  <p className="pcm-tree-empty">Falta completar: {action.missingFields.join(", ")}.</p>
                                )}
                              </article>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </article>;
          })}
        </div>
        <div className="pcm-traceability-grid">
          {traceability.map((link) => <article key={link.indicatorWorksheetKey} className={`pcm-traceability-card pcm-traceability-card--${link.indicatorFichaStatus}`}>
            <h4>{link.indicatorCode} · {link.indicatorTitle}</h4>
            <p className="pcm-source">{link.moduleTitle} · {link.thematicBlock} · {link.objectiveCode}</p>
            <p><strong>Objetivo:</strong> {link.objectiveTitle}</p>
            <p><strong>Ficha del indicador:</strong> {fichaStatusLabel(link.indicatorFichaStatus)}</p>
            <p><strong>Actuaciones:</strong> {link.actionCards.length} · <strong>Actividades:</strong> {link.actionCards.reduce((total, action) => total + action.activities.length, 0)} · <strong>Entregas:</strong> {link.actionCards.reduce((total, action) => total + action.deliveryCount, 0)} · <strong>Consolidaciones:</strong> {link.consolidationCount}</p>
            {link.actionCards.length > 0 && <ul>
              {link.actionCards.map((action) => <li key={action.id}>
                <strong>{action.name}</strong> · Responsable: {action.owner}; calendario: {action.schedule}; recursos: {action.resources}.
              </li>)}
            </ul>}
            {link.pendingSummary.length > 0 ? <p className="panel-note">Pendiente: {link.pendingSummary.join("; ")}</p> : <p className="panel-note">Fichas registradas sin campos obligatorios pendientes.</p>}
          </article>)}
        </div>
      </section>
      {pending > 0 && <div className="phase-blocked-notice"><strong>Versión todavía no cerrable</strong><p>Quedan {pending} elementos pendientes dentro de las líneas que ya estás trabajando. Puedes ver el resultado actual, pero conviene resolverlos antes de declarar el Plan definitivo.</p></div>}
      <div className="backup-panel__actions pcm-generation-actions">
        <button type="button" disabled={!hasSelectableContent} onClick={generatePlan}>Generar Plan de Acción</button>
        <button type="button" disabled={!hasSelectableContent} onClick={printGeneratedPlan}>Imprimir / guardar como PDF</button>

      </div>
      {!hasSelectableContent ? (
        <p className="panel-note">Selecciona o modifica al menos un objetivo específico o indicador para generar el Plan de Acción.</p>
      ) : !generated ? (
        <div className="pcm-generation-prompt">
          <strong>Selección preparada</strong>
          <p>Pulsa “Generar Plan de Acción” para componer la versión de trabajo con los objetivos e indicadores incluidos.</p>
        </div>
      ) : (
        <div className="pcm-generated-plan" ref={resultRef} aria-live="polite">
          <p role="status">Plan generado con la selección actual.</p>
          {active.map(({module, moduleDecision, rows}) => rows.length > 0 && <article key={module.id} className="pcm-module">
            <h3>{module.title}</h3>
            <p><strong>Objetivo estratégico:</strong> {resolvedPlanDecisionText(moduleDecision, module.strategicObjective)} {moduleDecision?.status === "modified" && <span className="status-pill">Modificado</span>}</p>
            {module.generalObjectives.map(general => {
              const group = rows
                .filter(row => row.general.code === general.code)
                .sort((left, right) => compareActionPlanNotation(left.specific.displayCode ?? left.specific.code, right.specific.displayCode ?? right.specific.code));
              if (!group.length) return null;
              const generalText = resolvedPlanDecisionText(group[0].generalDecision, general.title);
              return <section key={general.code} className="pcm-plan-block">
                <h4>Bloque temático · {thematicBlockNameFor(general.code) ?? general.code}</h4>
                <p className="panel-note"><strong>Objetivo del bloque:</strong> {generalText}</p>
                <ol className="pcm-generated-objectives">
                  {group.map(row => {
                    const objectiveText = resolvedPlanDecisionText(row.objectiveDecision, row.specific.title);
                    const indicatorText = resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title);
                    return <li key={`${row.specific.code}-${row.specific.indicator.code}`} className="pcm-specific">
                      <p><strong>Objetivo específico · {row.specific.displayCode ?? row.specific.code}</strong> · {objectiveText} {row.objectiveDecision?.status === "modified" && <span className="status-pill">Modificado</span>}</p>
                      {row.indicatorIncluded ? <p className="pcm-preview-indicator"><strong>Indicador · {row.specific.indicator.code}</strong> · {indicatorText} {row.indicatorDecision?.status === "modified" && <span className="status-pill">Modificado</span>}</p> : <p className="panel-note">Indicador todavía no seleccionado para este objetivo.</p>}
                      {row.indicatorIncluded && (() => {
                        const link = traceability.find((item) => item.indicatorCode === row.specific.indicator.code);
                        return link ? <p className="panel-note pcm-preview-ficha">
                          Ficha del indicador: {fichaStatusLabel(link.indicatorFichaStatus)} · {countLabel(link.actionCards.length, "actuación", "actuaciones")}.{" "}
                          <button type="button" className="pcm-preview-ficha__open" onClick={() => openIndicatorFicha(row.specific.indicator.code)}>Abrir ficha</button>
                        </p> : null;
                      })()}
                    </li>;
                  })}
                </ol>
              </section>;
            })}
          </article>)}
        </div>
      )}
    </>}
  </section>;
}
