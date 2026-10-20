import type { ReactNode } from "react";
import type { ActionPlanCatalogModule, CatalogGeneralObjectiveTemplate, CatalogSpecificObjectiveTemplate } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import type { PLSEvaluationFramework, UnaddressedNeed } from "../../domain/health-plan";
import {
  cleanActionPlanProposalText,
  cleanObsoleteActionPlanProgramLabels,
  consolidatedTextFor,
  excludedByAncestor,
  plainProposalText,
  proposalBlocks,
  proposalObjectiveTexts,
  proposalStrategicText,
  proposedTextFor,
  ZAIDIN_PROPOSAL_VERSION,
  ZAIDIN_FINAL_ACTION_PLAN_VERSION,
  type PlanPreparationDecision,
  type PlanPreparationDraft,
  type PlanPreparationReview,
  type PlanPreparationReviewDecision,
  type PlanPreparationReviewStatus,
} from "../../domain/action-plan-catalog/PlanPreparationDraft";

export function ProposalText({text}: {text: string}) {
  return <>{text.split(/(\*\*.*?\*\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2,-2)}</strong> : part)}</>;
}

export function PlanPreparationPanel({module, municipalityId, draft, onChange, review, onReviewChange, canEditProposal=true, canReview=false, reviewIsCurrent=true, renderWorksheet, persistenceMessage}: {
 persistenceMessage?: string;
 module: ActionPlanCatalogModule;
 municipalityId: string;
 draft?: PlanPreparationDraft;
 onChange: (draft: PlanPreparationDraft) => void;
 review?: PlanPreparationReview;
 onReviewChange?: (review: PlanPreparationReview) => void;
 canEditProposal?: boolean;
 canReview?: boolean;
 reviewIsCurrent?: boolean;
 renderWorksheet: (module: ActionPlanCatalogModule, general: CatalogGeneralObjectiveTemplate, specific: CatalogSpecificObjectiveTemplate) => ReactNode;
}) {
 const revised = module.version === ZAIDIN_PROPOSAL_VERSION;
 const finalApprovedText = module.version === ZAIDIN_FINAL_ACTION_PLAN_VERSION;
 const directTerritorialEdit = canEditProposal && !canReview;
 const emphasized = (text: string) => cleanActionPlanProposalText([proposalStrategicText, ...Object.values(proposalObjectiveTexts), ...proposalBlocks.map(b => b.text)].find(candidate => plainProposalText(candidate) === cleanActionPlanProposalText(text)) ?? text);
 const territorialText = (id: string, text: string) => draft?.decisions[id]?.status === "modified" ? cleanActionPlanProposalText(draft.decisions[id].text ?? text) : emphasized(text);
 const consolidatedText = (id: string, text: string) => consolidatedTextFor(text, draft?.decisions[id], reviewIsCurrent ? review?.decisions[id] : undefined);
 const sourceTextById = new Map<string, string>([[module.id, cleanActionPlanProposalText(module.strategicObjective)]]);
 for (const general of module.generalObjectives) {
  sourceTextById.set(general.code, cleanActionPlanProposalText(general.title));
  for (const specific of general.specificObjectives) {
   sourceTextById.set(specific.code, cleanActionPlanProposalText(specific.title));
   sourceTextById.set(specific.indicator.code, cleanActionPlanProposalText(specific.indicator.title));
  }
 }

 function emitDraftPatch(patch: Partial<Pick<PlanPreparationDraft, "unaddressedNeeds" | "evaluationFramework">>) {
  onChange({
   municipalityId,
   moduleId: module.id,
   version: module.version,
   updatedAt: new Date().toISOString(),
   decisions: {...draft?.decisions},
   unaddressedNeeds: draft?.unaddressedNeeds,
   evaluationFramework: draft?.evaluationFramework,
   ...patch,
  });
 }

 function parseUnaddressedNeeds(value: string): UnaddressedNeed[] | undefined {
  const lines = value.split(/\r?\n/g).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return undefined;
  return lines.map((line, index) => {
   const [title, ...rest] = line.split(/\s+[—-]\s+|:\s+/);
   return {
    id: `unaddressed-${index + 1}`,
    title: cleanActionPlanProposalText(title),
    justification: cleanActionPlanProposalText(rest.join(" — ")),
   };
  });
 }

 function formatUnaddressedNeeds(needs: UnaddressedNeed[] | undefined): string {
  return (needs ?? []).map(need => `${need.title} — ${need.justification}`).join("\n");
 }

 function updateEvaluationFramework(patch: Partial<PLSEvaluationFramework>) {
  const previous = draft?.evaluationFramework;
  const next: PLSEvaluationFramework = {
   evaluationQuestions: previous?.evaluationQuestions ?? [],
   evaluationMoments: previous?.evaluationMoments ?? [],
   evaluationResponsible: previous?.evaluationResponsible ?? "",
   baselineNote: previous?.baselineNote ?? "",
   ...patch,
  };
  const empty = next.evaluationQuestions.length === 0 &&
   next.evaluationMoments.length === 0 &&
   !next.evaluationResponsible.trim() &&
   !next.baselineNote.trim();
  emitDraftPatch({evaluationFramework: empty ? undefined : next});
 }

 function updateDraftDecision(id: string, source: string, status: PlanPreparationDecision["status"], textOverride?: string, ancestors: string[] = []) {
  const decisions = {...draft?.decisions};
  const cleanSource = cleanActionPlanProposalText(source);
  if (status === "included" || status === "modified") {
   for (const ancestorId of ancestors) {
    const previousAncestor = decisions[ancestorId];
    if (previousAncestor?.status === "included" || previousAncestor?.status === "modified" || previousAncestor?.status === "excluded") continue;
    decisions[ancestorId] = {
     status: "included",
     sourceText: sourceTextById.get(ancestorId) ?? previousAncestor?.sourceText ?? ancestorId,
    };
   }
  }
  const previous = decisions[id];
  const text = status === "modified"
   ? (textOverride ?? previous?.text ?? cleanSource)
   : previous?.text;
  const cleanText = text !== undefined ? cleanObsoleteActionPlanProgramLabels(text) : undefined;
  const next: PlanPreparationDecision = {
   status,
   sourceText: cleanSource,
   ...(cleanText !== undefined ? {text: cleanText} : {}),
  };
  onChange({
   municipalityId,
   moduleId: module.id,
   version: module.version,
   updatedAt: new Date().toISOString(),
   decisions: {...decisions, [id]: next},
   unaddressedNeeds: draft?.unaddressedNeeds,
   evaluationFramework: draft?.evaluationFramework,
  });
 }

 function updateReview(id: string, source: string, patch: Partial<PlanPreparationReviewDecision>) {
  if (!canReview || !onReviewChange) return;
  const proposal = proposedTextFor(draft?.decisions[id], source);
  const previous = review?.decisions[id];
  const next: PlanPreparationReviewDecision = {
   status: patch.status ?? previous?.status ?? "reformulated",
   sourceText: source,
   proposedText: draft?.decisions[id]?.status === "modified" ? proposal : undefined,
   consolidatedText: patch.consolidatedText ?? previous?.consolidatedText,
   reviewedAt: new Date().toISOString(),
  };
  onReviewChange({
   municipalityId,
   moduleId: module.id,
   sourceVersion: module.version,
   sourceDraftVersion: review?.sourceDraftVersion ?? 0,
   updatedAt: new Date().toISOString(),
   decisions: {...review?.decisions, [id]: next},
  });
 }

 function reviewControl(id: string, source: string) {
  if (!canReview) return null;
  const proposal = draft?.decisions[id];
  const hasTerritorialProposal = proposal?.status === "modified";
  const reviewed = reviewIsCurrent ? review?.decisions[id] : undefined;
  const status = reviewed?.status ?? "";
  const effective = consolidatedTextFor(source, proposal, reviewed);
  const sourceDiffersFromCurrent = effective !== source;
  return <fieldset className="pcm-admin-review">
   <legend>Edición administrativa · {id}</legend>
   {!reviewIsCurrent && review && <p role="alert">La revisión guardada corresponde a una versión anterior. Debe revisarse de nuevo antes de consolidar.</p>}
   <p><strong>Texto vigente consolidado:</strong> {effective}</p>
   {sourceDiffersFromCurrent && <details className="pcm-trace"><summary>Ver texto fuente anterior</summary><p>{source}</p></details>}
   {hasTerritorialProposal && <p><strong>Redacción territorial:</strong> {proposedTextFor(proposal, source)}</p>}
   <label>Acción administrativa
    <select aria-label={`Revisión administrativa ${id}`} value={status} onChange={e => {
     const value=e.target.value as PlanPreparationReviewStatus | "";
     if (!value) return;
     updateReview(id, source, {status:value, consolidatedText:value === "reformulated" ? (reviewed?.consolidatedText ?? (hasTerritorialProposal ? proposedTextFor(proposal, source) : effective)) : undefined});
    }}>
     <option value="">Sin cambio administrativo</option>
     {hasTerritorialProposal && <option value="accepted">Aceptar redacción territorial</option>}
     {hasTerritorialProposal && <option value="rejected">Rechazar redacción y mantener texto vigente</option>}
     <option value="reformulated">Modificar texto directamente</option>
    </select>
   </label>
   {status === "reformulated" && <label>Nueva redacción administrativa
    <textarea aria-label={`Nueva redacción administrativa ${id}`} rows={3} value={reviewed?.consolidatedText ?? effective} onChange={e=>updateReview(id,source,{status:"reformulated",consolidatedText:e.target.value})}/>
   </label>}
  </fieldset>;
 }

 function control(id: string, source: string, ancestors: string[], alwaysShowEditor = false) {
  const cleanSource = cleanActionPlanProposalText(source);
  const decision = draft?.decisions[id];
  const excluded = excludedByAncestor(draft, ancestors);
  const stale = decision && cleanActionPlanProposalText(decision.sourceText) !== cleanActionPlanProposalText(source);
  const statusLabel = directTerritorialEdit ? `Estado del Plan · ${id}` : `Selección de borrador · ${id}`;
  const statusAriaLabel = directTerritorialEdit ? `Estado del Plan ${id}` : `Selección de borrador ${id}`;
  const textLabel = alwaysShowEditor
   ? `Redacción del objetivo general · ${id}`
   : directTerritorialEdit ? `Redacción vigente · ${id}` : `Nueva redacción · ${id}`;
  // Preserve authored text exactly except for legacy campaign labels that are no longer part of the plan.
  const textareaText = cleanObsoleteActionPlanProgramLabels(decision?.text ?? cleanActionPlanProposalText(source));
  return <div className="pcm-decision">
   {alwaysShowEditor && <p className="panel-note"><strong>Propuesta inicial de objetivo general:</strong> {cleanSource}</p>}
   <label><span>{statusLabel}</span><select disabled={!canEditProposal} aria-label={statusAriaLabel} value={decision?.status ?? "pending"} onChange={e => updateDraftDecision(id, source, e.target.value as PlanPreparationDecision["status"], undefined, ancestors)}><option value="pending">{directTerritorialEdit ? "Sin incorporar" : "Pendiente"}</option><option value="included">Incluir</option><option value="excluded">Excluir</option><option value="modified">Modificar</option></select></label>
   {(decision?.status === "modified" || alwaysShowEditor) && canEditProposal && <label>{textLabel}<textarea aria-label={textLabel} value={textareaText} rows={3} onChange={e => updateDraftDecision(id, source, "modified", e.target.value, ancestors)}/><span className="pcm-save-row"><button type="button" onClick={() => updateDraftDecision(id, source, "modified", textareaText, ancestors)} aria-label={`Guardar redacción vigente · ${id}`}>Guardar redacción</button>{alwaysShowEditor && textareaText !== cleanSource && <button type="button" onClick={() => updateDraftDecision(id, source, "modified", cleanSource, ancestors)} aria-label={`Usar propuesta inicial · ${id}`}>Usar propuesta inicial</button>}{decision?.status === "modified" && <span className="pcm-save-confirmation" role="status">Guardado en el expediente local</span>}</span>{!textareaText.trim() && <p role="alert">Completa la redacción.</p>}<span className="panel-note">{alwaysShowEditor && decision?.status !== "modified" ? "Propuesta inicial del objetivo general. Edítala o pulsa Guardar redacción para incorporarla al expediente." : directTerritorialEdit ? "La nueva redacción pasa a ser el texto vigente de este territorio y se guarda directamente en su expediente." : "La redacción queda registrada en el expediente."}</span></label>}
   {decision?.status === "modified" && !canEditProposal && <p className="panel-note"><strong>Redacción territorial:</strong> {proposedTextFor(decision, source)}</p>}
   {excluded && <p className="panel-note">Fuera del Plan porque un elemento superior está excluido. Se conservan la elección individual, la ficha y las actuaciones.</p>}
   {stale && <p role="status">La referencia de partida ha cambiado. Se conserva la redacción territorial anterior para que pueda revisarse.</p>}
   {reviewControl(id, source)}
  </div>;
 }

 const specificCount = module.generalObjectives.reduce((sum, general) => sum + general.specificObjectives.length, 0);
 return <article className="workspace-panel pcm-preparation">
  <details className="pcm-line-fold">
  <summary className="pcm-line-fold__summary">
   <span className="eyebrow">Línea estratégica</span>
   <strong>{module.title}</strong>
   <small>{module.generalObjectives.length} objetivos generales · {specificCount} objetivos específicos e indicadores</small>
  </summary>
  <header className="pcm-editorial-header">
   <p className="eyebrow">{directTerritorialEdit ? "Plan de Acción · edición territorial directa" : "Preparación del Plan · borrador editable"}</p>
   <h2>{module.title}</h2>
   <p className="pcm-provenance">{module.sourceLabel}<br /><span>Versión de referencia · {module.sourceDate}</span></p>
  </header>
  <details className="pcm-guidance-fold"><summary>Cómo revisar y editar</summary>
  <aside className="pcm-guidance" aria-label="Cómo revisar la propuesta">
   <p><strong>{directTerritorialEdit ? "Edición directa del territorio" : canReview ? "Edición y revisión administrativa" : "Cómo revisar el Plan"}</strong></p>
   {directTerritorialEdit ? <><p>Selecciona, excluye o modifica objetivos e indicadores. Cuando modificas una redacción, <strong>ese texto pasa a ser el vigente para este territorio</strong>; no queda pendiente de una revisión administrativa posterior.</p><p>La eventual aprobación del Grupo Motor es una fase distinta y posterior.</p></> : canReview ? <><p>Puedes modificar directamente cualquier objetivo o indicador y guardar la nueva redacción como texto consolidado.</p><p>La consolidación administrativa <strong>no constituye aprobación del Grupo Motor</strong>.</p></> : <><p>Selecciona y modifica los elementos del Plan.</p><p>Estas elecciones <strong>no constituyen aprobación del Grupo Motor</strong>.</p></>}
  </aside>
  </details>
  <section className="pcm-strategic" aria-label="Objetivo estratégico vigente">
   <h3>{directTerritorialEdit ? "Objetivo estratégico vigente" : "Objetivo estratégico propuesto"}</h3>
   <p><ProposalText text={canReview ? consolidatedText(module.id, revised ? plainProposalText(proposalStrategicText) : module.strategicObjective) : territorialText(module.id, revised ? proposalStrategicText : module.strategicObjective)}/></p>
  </section>
  {control(module.id, module.strategicObjective, [])}
  {module.generalObjectives.map(general => {
   const block = proposalBlocks.find(b => b.code === general.code);
   const sourceGeneral = general.title;
   const visibleGeneral = canReview ? consolidatedText(general.code, sourceGeneral) : territorialText(general.code, (revised ? block?.text : undefined) ?? sourceGeneral);
   return <details className="pcm-general" key={general.code}>
    <summary>{(revised ? block?.name : undefined) ?? `${general.code} · ${visibleGeneral}`}</summary>
    <p><strong>Objetivo general:</strong> <ProposalText text={visibleGeneral}/></p>
    {control(general.code, sourceGeneral, [module.id], !finalApprovedText)}
    {general.specificObjectives.map(specific => {
     const indicator = specific.indicator;
     const sourceSpecific = specific.title;
     const sourceIndicator = indicator.title;
     const visibleSpecific = canReview ? consolidatedText(specific.code, sourceSpecific) : territorialText(specific.code, revised ? proposalObjectiveTexts[specific.code] : sourceSpecific);
     const visibleIndicator = canReview ? consolidatedText(indicator.code, sourceIndicator) : territorialText(indicator.code, sourceIndicator);
     const draftModule = {...module, strategicObjective: plainProposalText(canReview ? consolidatedText(module.id,module.strategicObjective) : territorialText(module.id,module.strategicObjective))};
     const draftGeneral = {...general, title: plainProposalText(visibleGeneral)};
     const draftSpecific = {...specific, title: plainProposalText(visibleSpecific), indicator: {...indicator, title: plainProposalText(visibleIndicator)}};
     return <section className="pcm-specific" key={specific.code}>
      <h3>Objetivo específico · {specific.displayCode ?? specific.code}</h3><p><ProposalText text={visibleSpecific}/></p>
      {control(specific.code, sourceSpecific, [module.id, general.code])}
      <details className="pcm-sheet" id={`ficha-${indicator.code}`}><summary>Indicador y ficha · {indicator.code}</summary>
       <p>{visibleIndicator}</p>
       <p className="panel-note">Indicador vigente del territorio. Su ficha técnica puede seguir desarrollándose sin alterar el texto fuente histórico.</p>
       {control(indicator.code, sourceIndicator, [module.id, general.code, specific.code])}
       <dl><dt>Definición operacional de referencia</dt><dd>{indicator.operationalDefinition}</dd><dt>Método de referencia</dt><dd>{indicator.calculationMethod}</dd><dt>Fuente propuesta</dt><dd>{indicator.suggestedSource}</dd></dl>
       {renderWorksheet(draftModule, draftGeneral, draftSpecific)}
      </details>
     </section>;
    })}
   </details>;
  })}
  <details className="pcm-fold-block"><summary><strong>Cierre para el Plan Local de Salud</strong> <small>necesidades no priorizadas y marco de evaluación</small></summary>
  <section className="pcm-pls-readiness" aria-label="Cierre para el Plan Local de Salud">
   <h3>Cierre para el Plan Local de Salud</h3>
   <label><input type="checkbox" checked={draft?.unaddressedNeeds?.length === 0} disabled={!canEditProposal} onChange={e => emitDraftPatch({unaddressedNeeds: e.target.checked ? [] : undefined})}/> Todas las necesidades diagnosticadas quedan incorporadas al Plan de Acción</label>
   <label>Necesidades diagnosticadas no priorizadas<textarea aria-label="Necesidades diagnosticadas no priorizadas" rows={4} disabled={!canEditProposal || draft?.unaddressedNeeds?.length === 0} value={formatUnaddressedNeeds(draft?.unaddressedNeeds)} placeholder="Necesidad identificada — Justificación de no priorización" onChange={e => emitDraftPatch({unaddressedNeeds: parseUnaddressedNeeds(e.target.value)})}/></label>
   <fieldset className="pcm-admin-review">
    <legend>Marco de evaluación</legend>
    <label>Preguntas de evaluación<textarea aria-label="Preguntas de evaluación" rows={3} disabled={!canEditProposal} value={(draft?.evaluationFramework?.evaluationQuestions ?? []).join("\n")} onChange={e => updateEvaluationFramework({evaluationQuestions: e.target.value.split(/\r?\n/g).map(cleanActionPlanProposalText).filter(Boolean)})}/></label>
    <label>Momentos de medición<textarea aria-label="Momentos de medición" rows={2} disabled={!canEditProposal} value={(draft?.evaluationFramework?.evaluationMoments ?? []).join("\n")} onChange={e => updateEvaluationFramework({evaluationMoments: e.target.value.split(/\r?\n/g).map(cleanActionPlanProposalText).filter(Boolean)})}/></label>
    <label>Responsable de evaluación<input aria-label="Responsable de evaluación" disabled={!canEditProposal} value={draft?.evaluationFramework?.evaluationResponsible ?? ""} onChange={e => updateEvaluationFramework({evaluationResponsible: e.target.value})}/></label>
    <label>Nota sobre línea base<textarea aria-label="Nota sobre línea base" rows={2} disabled={!canEditProposal} value={draft?.evaluationFramework?.baselineNote ?? ""} onChange={e => updateEvaluationFramework({baselineNote: e.target.value})}/></label>
   </fieldset>
  </section>
  </details>
  <p role="status">{persistenceMessage ?? (directTerritorialEdit ? (draft ? "Cambios consolidados en el expediente de este territorio." : "Sin cambios territoriales guardados. Las modificaciones se guardan directamente en este expediente.") : (draft ? "Borrador guardado en este navegador. Para cambiar de equipo, conserva y traslada el expediente." : "Sin elecciones guardadas. Los cambios se guardan en este navegador."))}</p>
 </details>
 </article>;
}
