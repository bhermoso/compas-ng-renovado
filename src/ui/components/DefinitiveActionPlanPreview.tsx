import { PlanDocumentActions } from "./PlanDocumentActions";
import { openIndicatorFicha } from "./openIndicatorFicha";
import { useMemo, useState } from "react";
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
import { describeProfilePlanLink, profilePlanLinkKey, profilePlanOptions, type ProfilePlanLink } from "../../application/action-plan/profilePlanLinks";
import { ProfilePlanTracePanel, type ProfilePlanLinkInput, type ProfilePlanTraceContext } from "./ProfilePlanTracePanel";

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
    // Identificador interno estable, derivado del título; no se pide a quien registra.
    const base = newTitle.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "necesidad";
    let id = `necesidad-${base}`;
    for (let n = 2; (currentNeeds ?? []).some((item) => item.id === id); n += 1) id = `necesidad-${base}-${n}`;
    const need: UnaddressedNeed = {
      id,
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
      className="card pcm-unaddressed-needs"
      aria-label="Necesidades no priorizadas (G-PLS-7)"
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

      {/* El formulario se pliega: el estado de G-PLS-7 queda visible arriba. */}
      <details className="pcm-unaddressed-form">
      <summary>Documentar necesidades no priorizadas</summary>
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
      </details>

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

export function DefinitiveActionPlanPreview({municipalityId, municipalityName: visibleName, modules, drafts, worksheets = [], validatedActionPlans, onValidatePlan, onDeletePlanVersion, onDraftChange, profileTrace, onOpenIndicatorFicha}: {
  /** Muestra la ficha del indicador, que está en otra sección del Plan. */
  onOpenIndicatorFicha?: (indicatorCode: string) => void;
  validatedActionPlans?: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument[];
  onValidatePlan?: (document: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument) => boolean;
  onDeletePlanVersion?: (document: import("../../domain/action-plan-catalog/PlanDocument").PlanDocument) => Promise<boolean>;
  onDraftChange?: (draft: PlanPreparationDraft) => void;
  municipalityId: string;
  municipalityName?: string;
  modules: ActionPlanCatalogModule[];
  drafts?: PlanPreparationDraft[];
  worksheets?: IndicatorWorksheet[];
  profileTrace?: ProfilePlanTraceContext;
}) {
  const municipalityName = visibleName ?? municipalityId;
  const active = useMemo(() => buildDefinitiveActionPlanProjection(municipalityId, modules, drafts), [municipalityId, modules, drafts]);
  const traceability = useMemo(() => buildActionPlanTraceability(municipalityId, active, worksheets), [municipalityId, active, worksheets]);
  const sources = profileTrace && profilePlanOptions(profileTrace.workspace, profileTrace.lectura, traceability);
  const links = profileTrace?.workspace.profilePlanLinks ?? [];
  const linked = sources ? links.flatMap(link => {
    const detail = describeProfilePlanLink(sources, link);
    return detail ? [detail] : [];
  }) : [];

  async function saveLink(input: ProfilePlanLinkInput) {
    if (!sources?.profile || !sources.selection || !profileTrace?.onChange || !profileTrace.authorName.trim()) {
      throw new Error("Recupera el Perfil y la prioridad del expediente antes de guardar el vínculo.");
    }
    const link: ProfilePlanLink = {
      ...input, profileId: sources.profile.id, selectionId: sources.selection.id,
      recordedBy: profileTrace.authorName, recordedAt: new Date().toISOString(),
    };
    if (!describeProfilePlanLink(sources, link)) throw new Error("El Perfil, la prioridad o el indicador han cambiado. Revisa el vínculo.");
    const otherLinks = links.filter(item => profilePlanLinkKey(item) !== profilePlanLinkKey(link));
    if (link.baselineResultId && linked.some(item =>
      profilePlanLinkKey(item) !== profilePlanLinkKey(link) && item.worksheetKey === link.worksheetKey &&
      item.baselineResultId && item.baselineResultId !== link.baselineResultId)) {
      throw new Error("El indicador ya tiene otra línea de base vinculada. Revisa sus vínculos antes de cambiarla.");
    }
    await profileTrace.onChange([...otherLinks, link]);
  }

  const incompatibleDrafts = drafts?.filter(draft => draft.municipalityId === municipalityId && modules.some(module => module.id === draft.moduleId && module.version !== draft.version)) ?? [];
  const pending = active.reduce((total, item) => total + pendingPreparationDecisionCount(item.module, item.draft), 0);
  // Líneas adoptadas que todavía no tienen ningún objetivo incorporado.
  const idleModules = modules.filter(module => !active.some(item => item.module.id === module.id && item.rows.length > 0));
  const selectedObjectives = active.reduce((total, item) => total + item.rows.length, 0);
  const selectedIndicators = active.reduce((total, item) => total + item.rows.filter(row => row.indicatorIncluded).length, 0);
  const linkedActionCards = traceability.reduce((total, link) => total + link.actionCards.length, 0);
  const linkedActivities = traceability.reduce((total, link) => total + link.actionCards.reduce((sum, action) => sum + action.activities.length, 0), 0);
  const hasSelectableContent = selectedObjectives > 0 || selectedIndicators > 0;

  return <section className="workspace-panel pcm-definitive-plan" aria-label={`Plan de Acción resultante · ${municipalityName}`}>
    {incompatibleDrafts.length > 0 && <p role="alert">Hay borradores con una versión pendiente de compatibilidad. Se conservan y no se incorporan a esta proyección ni a su exportación.</p>}
    <PlanDocumentActions key={`documento-${municipalityId}`} municipalityId={municipalityId} active={active} versions={validatedActionPlans} worksheets={worksheets} profilePlanLinks={linked} onValidate={onValidatePlan} onDeleteVersion={onDeletePlanVersion}/>
    {sources && <ProfilePlanTracePanel key={`perfil-${municipalityId}`} options={sources} links={links}
      onSave={profileTrace?.onChange ? saveLink : undefined}
      onRemove={profileTrace?.onChange && (link => profileTrace.onChange!(links.filter(item => profilePlanLinkKey(item) !== profilePlanLinkKey(link))))} />}
    {onDraftChange && active.some((item) => item.draft) && (
      <UnaddressedNeedsEditor active={active} onDraftChange={onDraftChange} />
    )}
    <div className="pcm-module__header">
      <div>
        <p className="eyebrow">Vista consolidada del borrador territorial</p>
        <h2>Plan de Acción resultante · {municipalityName}</h2>
      </div>
      <span className="status-pill">{modules.length === 0 ? "Sin líneas adoptadas" : pending === 0 && idleModules.length === 0 ? "Listo para versión definitiva" : pending > 0 ? `${pending} pendientes` : `${idleModules.length === 1 ? "1 línea adoptada" : `${idleModules.length} líneas adoptadas`} sin trabajar`}</span>
    </div>
    {modules.length > 0 && idleModules.length > 0 && <p className="phase-blocked-notice" role="status">
      Línea{idleModules.length === 1 ? "" : "s"} adoptada{idleModules.length === 1 ? "" : "s"} por el Grupo Motor sin objetivos incorporados todavía: {idleModules.map(m => m.title).join(" · ")}. Se trabaja{idleModules.length === 1 ? "" : "n"} en «Líneas e indicadores».
    </p>}
    <p className="panel-note">Esta vista utiliza únicamente los elementos marcados como <strong>Incluir</strong> o <strong>Modificar</strong>. Los modificados conservan su redacción territorial; los excluidos no se incorporan.</p>
    {modules.length === 0 ? <p>El Plan resultante reúne las líneas que adopta el Grupo Motor. No hay ninguna línea adoptada en una decisión vigente.</p>
    : active.length === 0 ? <p>No hay todavía líneas con decisiones territoriales. Selecciona o modifica elementos para construir el Plan de Acción.</p> : <>
      <p><strong>{selectedObjectives}</strong> objetivos específicos seleccionados · <strong>{selectedIndicators}</strong> indicadores seleccionados.</p>
      <details className="pcm-traceability-map" aria-label="Mapa de vínculos del Plan de Acción">
        <summary className="pcm-module__header pcm-fold-summary">
          <span>
            <span className="eyebrow">Mapa de vínculos</span>
            <strong>Árbol operativo de objetivos, indicadores y actividades</strong>
          </span>
          <span className="status-pill">{linkedActionCards} fichas · {linkedActivities} actividades</span>
        </summary>
        <p className="panel-note">Cada rama conserva la cadena línea estratégica → bloque → objetivo → indicador → ficha → actuación → actividades y entregas. Si falta una pieza, se declara como pendiente.</p>
        <p className="panel-note">Las fichas de actuación se muestran aquí como fuente de datos del indicador. El resultado de cada indicador no se atribuye a actuaciones concretas, y la gestión de las actuaciones y de las agendas anuales se hace en la vista Agenda, separada del Plan de Acción.</p>
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
                <details className="pcm-tree-block" key={block.code}>
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
                          <p><strong>{link.indicatorDisplayCode ?? link.indicatorCode}</strong> · {link.indicatorTitle}</p>
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
            <h4>{link.indicatorDisplayCode ?? link.indicatorCode} · {link.indicatorTitle}</h4>
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
      </details>
      {pending > 0 && <div className="phase-blocked-notice"><strong>Versión todavía no cerrable</strong><p>Quedan {pending} elementos pendientes dentro de las líneas que ya estás trabajando. Puedes ver el resultado actual, pero conviene resolverlos antes de declarar el Plan definitivo.</p></div>}
      {!hasSelectableContent ? (
        <p className="panel-note">Incluye o modifica al menos un objetivo específico o indicador para componer el Plan de Acción.</p>
      ) : (
        <div className="pcm-generated-plan">
          <p className="panel-note">Plan de Acción con la selección actual. Para obtener el documento, usa las descargas en Word o PDF de arriba.</p>
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
                {thematicBlockNameFor(general.code, module) && <h4>Bloque temático · {thematicBlockNameFor(general.code, module)}</h4>}
                {(!group[0].generalDecision || group[0].generalDecision.status === "pending") && <p className="panel-note">Bloque pendiente de revisión.</p>}
                <p className="panel-note"><strong>Objetivo general · {general.displayCode ?? general.code}:</strong> {generalText}</p>
                <ol className="pcm-generated-objectives">
                  {group.map(row => {
                    const objectiveText = resolvedPlanDecisionText(row.objectiveDecision, row.specific.title);
                    const indicatorText = resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title);
                    return <li key={`${row.specific.code}-${row.specific.indicator.code}`} className="pcm-specific">
                      <p><strong>Objetivo específico · {row.specific.displayCode ?? row.specific.code}</strong> · {objectiveText} {row.objectiveDecision?.status === "modified" && <span className="status-pill">Modificado</span>}</p>
                      {row.indicatorIncluded ? <p className="pcm-preview-indicator"><strong>Indicador · {row.specific.indicator.displayCode ?? row.specific.indicator.code}</strong> · {indicatorText} {row.indicatorDecision?.status === "modified" && <span className="status-pill">Modificado</span>}</p> : <p className="panel-note">Indicador todavía no seleccionado para este objetivo.</p>}
                      {row.indicatorIncluded && (() => {
                        const link = traceability.find((item) => item.indicatorCode === row.specific.indicator.code);
                        return link ? <p className="panel-note pcm-preview-ficha">
                          Ficha del indicador: {fichaStatusLabel(link.indicatorFichaStatus)} · {countLabel(link.actionCards.length, "actuación", "actuaciones")}.{" "}
                          <button type="button" className="pcm-preview-ficha__open" onClick={() => (onOpenIndicatorFicha ?? openIndicatorFicha)(row.specific.indicator.code)}>Abrir ficha</button>
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
