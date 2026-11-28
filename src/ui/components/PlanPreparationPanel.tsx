import { actionPlanElementCode } from "../../domain/action-plan-catalog/ActionPlanNotation";
import type { ReactNode } from "react";
import { getSupportDocument, type SupportDocument } from "../../domain/strategy/SupportDocuments";
import { documentAccessUrl } from "./documentAccessUtils";
import type { ActionPlanCatalogModule, CatalogElementProvenance, CatalogGeneralObjectiveTemplate, CatalogSpecificObjectiveTemplate } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import type { PLSEvaluationFramework } from "../../domain/health-plan";
import { planDecisionWithStatus } from "../../domain/action-plan-catalog/PlanPreparationDraft";
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
  type PlanPreparationDecision,
  type PlanPreparationDraft,
  type PlanPreparationReview,
  type PlanPreparationReviewDecision,
  type PlanPreparationReviewStatus,
} from "../../domain/action-plan-catalog/PlanPreparationDraft";

export function ProposalText({text}: {text: string}) {
  return <>{text.split(/(\*\*.*?\*\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2,-2)}</strong> : part)}</>;
}

const PROVENANCE_LABEL = { literal: "Literal", adaptado: "Adaptado", propio: "Propio de COMPÁS" } as const;
/** Procedencia declarada del elemento del catálogo (fuente y tipo), si la tiene. */
function ElementProvenance({ p }: { p?: CatalogElementProvenance }) {
  if (!p) return null;
  const docs = (p.documents ?? []).map(getSupportDocument).filter((d): d is NonNullable<typeof d> => d !== undefined);
  return <p className="pcm-element-provenance" data-provenance={p.kind}>
    <span>Procedencia · {PROVENANCE_LABEL[p.kind]}</span> {p.source}
    {p.via && <> <em>Tomado del {p.via}.</em></>}
    {docs.length > 0 && <> Documentación: {docs.map((d, i) => <span key={d.id} className="pcm-support-doc">{i > 0 && " · "}<SupportDocumentLink doc={d}/></span>)}</>}
  </p>;
}

/** Enlace al documento de apoyo: el PDF conservado en COMPÁS o su dirección pública. */
export function SupportDocumentLink({ doc }: { doc: SupportDocument }) {
  const href = doc.location.kind === "compas" ? documentAccessUrl(doc.location.path) : doc.location.url;
  if (!href) return <>{doc.shortName}</>;
  return <a href={href} target="_blank" rel="noopener noreferrer" title={`${doc.title} · ${doc.period}`}>{doc.shortName}</a>;
}

const SAVED_STATUS_LABEL: Record<PlanPreparationDecision["status"], string> = {
 pending: "Pendiente", included: "Incluido", modified: "Modificado", excluded: "Excluido",
};

/** Redacción guardada de un borrador que no puede abrirse para editar: se muestra tal cual, en solo lectura. */
function SavedDraftReadOnly({draft}: {draft: PlanPreparationDraft}) {
 const entries = Object.entries(draft.decisions);
 if (!entries.length) return <p className="panel-note">El borrador guardado no contiene decisiones.</p>;
 return <details className="pcm-legacy-draft__saved">
  <summary>Redacción guardada · versión {draft.version} · {draft.updatedAt.slice(0, 10)} · solo lectura</summary>
  <p className="panel-note">Códigos y textos tal como se guardaron. Para volver a editarlo hace falta revisar su compatibilidad con la versión vigente del catálogo.</p>
  <dl>{entries.map(([code, decision]) => <div key={code}>
   <dt>{code} · {SAVED_STATUS_LABEL[decision.status]}</dt>
   <dd>{decision.text ?? decision.sourceText}{decision.text && decision.text !== decision.sourceText && <small> Texto de partida: {decision.sourceText}</small>}</dd>
  </div>)}</dl>
 </details>;
}

export function PlanPreparationPanel({module, municipalityId, municipalityName, draft, onChange, review, onReviewChange, canEditProposal=true, canReview=false, reviewIsCurrent=true, renderWorksheet, persistenceMessage, adoption}: {
 /** Relación de la línea con la decisión del Grupo Motor; sin valor, no se muestra. */
 adoption?: "adopted" | "consultation";
 persistenceMessage?: string;
 /** Nombre visible del ámbito; si falta, se usa su identificador. */
 municipalityName?: string;
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
 if (draft && (draft.municipalityId !== municipalityId || draft.moduleId !== module.id || draft.version !== module.version)) {
  return <section className="pcm-legacy-draft">
   <p role="alert">La versión del borrador requiere revisión de compatibilidad. Se conserva sin modificar y no se puede editar.</p>
   <SavedDraftReadOnly draft={draft} />
  </section>;
 }
 const fourBlocks = module.generalObjectives.length === 4 && module.generalObjectives.every(general => Boolean(general.thematicBlockName));
 const consultation = adoption === "consultation";
 const directTerritorialEdit = (canEditProposal && !canReview) || consultation;
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
   ...draft,
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
  const next = planDecisionWithStatus(previous, cleanSource, status,
   status === "modified" ? (textOverride ?? previous?.text ?? cleanSource) : undefined);
  onChange({
   ...draft,
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
  const previous = reviewIsCurrent ? review?.decisions[id] : undefined;
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
   decisions: {...(reviewIsCurrent ? review?.decisions : {}), [id]: next},
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
   <legend>Edición administrativa · {actionPlanElementCode(module,id)}</legend>
   {!reviewIsCurrent && review && <p role="alert">La revisión guardada corresponde a una versión anterior. Debe revisarse de nuevo antes de consolidar.</p>}
   <p><strong>Texto vigente consolidado:</strong> {effective}</p>
   {sourceDiffersFromCurrent && <details className="pcm-trace"><summary>Ver texto fuente anterior</summary><p>{source}</p></details>}
   {hasTerritorialProposal && <p><strong>Redacción territorial:</strong> {proposedTextFor(proposal, source)}</p>}
   <label>Acción administrativa
    <select aria-label={`Revisión administrativa ${actionPlanElementCode(module,id)}`} value={status} onChange={e => {
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
    <textarea aria-label={`Nueva redacción administrativa ${actionPlanElementCode(module,id)}`} rows={3} value={reviewed?.consolidatedText ?? effective} onChange={e=>updateReview(id,source,{status:"reformulated",consolidatedText:e.target.value})}/>
   </label>}
  </fieldset>;
 }

 function control(id: string, source: string, ancestors: string[], alwaysShowEditor = false) {
  const cleanSource = cleanActionPlanProposalText(source);
  const decision = draft?.decisions[id];
  const excluded = excludedByAncestor(draft, ancestors);
  const stale = decision && cleanActionPlanProposalText(decision.sourceText) !== cleanActionPlanProposalText(source);
  const statusLabel = directTerritorialEdit ? `Estado del Plan · ${actionPlanElementCode(module,id)}` : `Selección de borrador · ${actionPlanElementCode(module,id)}`;
  const statusAriaLabel = directTerritorialEdit ? `Estado del Plan ${actionPlanElementCode(module,id)}` : `Selección de borrador ${actionPlanElementCode(module,id)}`;
  const textLabel = alwaysShowEditor
   ? `Redacción del objetivo general · ${actionPlanElementCode(module,id)}`
   : directTerritorialEdit ? `Redacción vigente · ${actionPlanElementCode(module,id)}` : `Nueva redacción · ${actionPlanElementCode(module,id)}`;
  // Preserve authored text exactly except for legacy campaign labels that are no longer part of the plan.
  const textareaText = cleanObsoleteActionPlanProgramLabels(decision?.text ?? cleanActionPlanProposalText(source));
  return <div className="pcm-decision">
   {alwaysShowEditor && <p className="panel-note"><strong>Propuesta inicial de objetivo general:</strong> {cleanSource}</p>}
   <label><span>{statusLabel}</span><select disabled={!canEditProposal} aria-label={statusAriaLabel} value={decision?.status ?? "pending"} onChange={e => updateDraftDecision(id, source, e.target.value as PlanPreparationDecision["status"], undefined, ancestors)}><option value="pending">{directTerritorialEdit ? "Sin incorporar" : "Pendiente"}</option><option value="included">Incluir</option><option value="excluded">Excluir</option><option value="modified">Modificar</option></select></label>
   {(decision?.status === "modified" || alwaysShowEditor) && canEditProposal && <label>{textLabel}<textarea aria-label={textLabel} value={textareaText} rows={3} onChange={e => updateDraftDecision(id, source, "modified", e.target.value, ancestors)}/>{alwaysShowEditor && textareaText !== cleanSource && <span className="pcm-save-row"><button type="button" onClick={() => updateDraftDecision(id, source, "modified", cleanSource, ancestors)} aria-label={`Usar propuesta inicial · ${actionPlanElementCode(module,id)}`}>Usar propuesta inicial</button></span>}{!textareaText.trim() && <p role="alert">Completa la redacción.</p>}<span className="panel-note">{alwaysShowEditor && decision?.status !== "modified" ? "Propuesta inicial del objetivo general. Si la editas, tu redacción pasa a ser la vigente y se guarda en el expediente al escribir." : directTerritorialEdit ? "La nueva redacción pasa a ser el texto vigente de este territorio y se guarda en su expediente al escribir." : "La redacción queda registrada en el expediente al escribir."}</span></label>}
   {decision?.status === "modified" && !canEditProposal && <p className="panel-note"><strong>Redacción territorial:</strong> {proposedTextFor(decision, source)}</p>}
   {excluded && <p className="panel-note">Fuera del Plan porque un elemento superior está excluido. Se conservan la elección individual, la ficha y las actuaciones.</p>}
   {stale && <p role="status">La referencia de partida ha cambiado. Se conserva la redacción territorial anterior para que pueda revisarse.</p>}
   {reviewControl(id, source)}
  </div>;
 }

 function applyModuleSelection(status: "included" | "excluded") {
  if (!canEditProposal) return;
  const decisions = {...draft?.decisions};
  const select = (id: string, source: string) => {
   // Preserve explicit municipal adaptations when including a complete module.
   const existing = decisions[id];
   if (status === "included" && existing?.status === "modified") return;
   decisions[id] = planDecisionWithStatus(existing, cleanActionPlanProposalText(source), status);
  };
  select(module.id, module.strategicObjective);
  for (const general of module.generalObjectives) {
   select(general.code, general.title);
   for (const specific of general.specificObjectives) {
    select(specific.code, specific.title);
    select(specific.indicator.code, specific.indicator.title);
   }
  }
  onChange({
   ...draft,
   municipalityId,
   moduleId: module.id,
   version: module.version,
   updatedAt: new Date().toISOString(),
   decisions,
   unaddressedNeeds: draft?.unaddressedNeeds,
   evaluationFramework: draft?.evaluationFramework,
  });
 }

 const specificCount = module.generalObjectives.reduce((sum, general) => sum + general.specificObjectives.length, 0);
 return <article className="workspace-panel pcm-preparation">
  <details className="pcm-line-fold">
  <summary className="pcm-line-fold__summary">
   <span className="eyebrow">Línea estratégica</span>
   <strong>{module.title}</strong>
   <small>{module.generalObjectives.length} objetivos generales · {specificCount} objetivos específicos e indicadores</small>
   {adoption && <span className="pcm-line-fold__adoption" data-adoption={adoption}>{consultation ? "Solo consulta" : "Adoptada por el Grupo Motor"}</span>}
  </summary>
  <header className="pcm-editorial-header">
   <p className="eyebrow">{consultation ? "Plan de Acción · solo consulta" : directTerritorialEdit ? "Plan de Acción · edición territorial directa" : "Preparación del Plan · borrador editable"}</p>
   <h2>{module.title}</h2>
   <p className="pcm-provenance">{module.sourceLabel}<br /><span>Versión de referencia · {module.sourceDate}</span></p>
  </header>
  {consultation && <p className="panel-note">El Grupo Motor no ha adoptado esta línea. Puedes consultar sus objetivos, indicadores y fichas; para incorporarla al Plan, el Grupo Motor debe adoptarla en «Priorización».</p>}
  {!consultation && <details className="pcm-guidance-fold"><summary>Cómo revisar y editar</summary>
  <aside className="pcm-guidance" aria-label="Cómo revisar la propuesta">
   <p><strong>{directTerritorialEdit ? "Edición directa del territorio" : canReview ? "Edición y revisión administrativa" : "Cómo revisar el Plan"}</strong></p>
   {directTerritorialEdit ? <><p>Selecciona, excluye o modifica objetivos e indicadores. Cuando modificas una redacción, <strong>ese texto pasa a ser el vigente para este territorio</strong>; no queda pendiente de una revisión administrativa posterior.</p><p>La eventual aprobación del Grupo Motor es una fase distinta y posterior.</p></> : canReview ? <><p>Puedes modificar directamente cualquier objetivo o indicador y guardar la nueva redacción como texto consolidado.</p><p>La consolidación administrativa <strong>no constituye aprobación del Grupo Motor</strong>.</p></> : <><p>Selecciona y modifica los elementos del Plan.</p><p>Estas elecciones <strong>no constituyen aprobación del Grupo Motor</strong>.</p></>}
  </aside>
  </details>}
  <section className="pcm-strategic" aria-label="Objetivo estratégico vigente">
   <h3>{directTerritorialEdit ? "Objetivo estratégico vigente" : "Objetivo estratégico propuesto"}</h3>
   <p><ProposalText text={canReview ? consolidatedText(module.id, module.strategicObjective) : territorialText(module.id, module.strategicObjective)}/></p>
   <ElementProvenance p={module.strategicObjectiveProvenance}/>
  </section>
  {canEditProposal && <div className="pcm-bulk-actions" role="group" aria-label={`Incorporación de propuestas de ${module.title}`}>
   <button type="button" onClick={() => applyModuleSelection("included")}>{directTerritorialEdit ? "Incluir la línea completa en el Plan" : "Incorporar módulo completo al borrador"}</button>
   <button type="button" onClick={() => applyModuleSelection("excluded")}>{directTerritorialEdit ? "Excluir la línea del Plan" : "Excluir módulo del borrador"}</button>
   <p className="panel-note">Las decisiones se guardan en el expediente de {municipalityName ?? municipalityId}. Al incluir la línea completa se respetan las redacciones modificadas. El catálogo es común a todos los expedientes: no trae datos de seguimiento ni acuerdos de ningún territorio, y no aprueba el Plan.</p>
  </div>}
  {control(module.id, module.strategicObjective, [])}
  {module.generalObjectives.map(general => {
   const sourceGeneral = general.title;
   const visibleGeneral = canReview ? consolidatedText(general.code, sourceGeneral) : territorialText(general.code, sourceGeneral);
   return <details className="pcm-general" key={general.code}>
    <summary>{(fourBlocks ? general.thematicBlockName : undefined) ?? `${general.code} · ${visibleGeneral}`}</summary>
    {draft?.decisions[general.code]?.status === "pending" && <p className="panel-note">Bloque pendiente de revisión.</p>}
    <p><strong>Objetivo general · {actionPlanElementCode(module,general.code)}:</strong> <ProposalText text={visibleGeneral}/></p>
    <ElementProvenance p={general.provenance}/>
    {control(general.code, sourceGeneral, [module.id], true)}
    {general.specificObjectives.map(specific => {
     const indicator = specific.indicator;
     const sourceSpecific = specific.title;
     const sourceIndicator = indicator.title;
     const visibleSpecific = canReview ? consolidatedText(specific.code, sourceSpecific) : territorialText(specific.code, sourceSpecific);
     const visibleIndicator = canReview ? consolidatedText(indicator.code, sourceIndicator) : territorialText(indicator.code, sourceIndicator);
     const draftModule = {...module, strategicObjective: plainProposalText(canReview ? consolidatedText(module.id,module.strategicObjective) : territorialText(module.id,module.strategicObjective))};
     const draftGeneral = {...general, title: plainProposalText(visibleGeneral)};
     const draftSpecific = {...specific, title: plainProposalText(visibleSpecific), indicator: {...indicator, title: plainProposalText(visibleIndicator)}};
     return <section className="pcm-specific" key={specific.code}>
      <h3>Objetivo específico · {specific.displayCode ?? specific.code}</h3><p><ProposalText text={visibleSpecific}/></p>
      <ElementProvenance p={specific.provenance}/>
      {control(specific.code, sourceSpecific, [module.id, general.code])}
      <details className="pcm-sheet" id={`ficha-${indicator.code}`}><summary>Indicador y ficha · {actionPlanElementCode(module,indicator.code)}</summary>
       <p>{visibleIndicator}</p>
       <ElementProvenance p={indicator.provenance}/>
       <p className="panel-note">Indicador vigente del territorio. Su ficha técnica puede seguir desarrollándose sin alterar el texto fuente histórico.</p>
       {control(indicator.code, sourceIndicator, [module.id, general.code, specific.code])}
       <dl><dt>Definición operacional de referencia</dt><dd>{indicator.operationalDefinition}</dd><dt>Método de referencia</dt><dd>{indicator.calculationMethod}</dd><dt>Fuente propuesta</dt><dd>{indicator.suggestedSource}</dd></dl>
       {renderWorksheet(draftModule, draftGeneral, draftSpecific)}
      </details>
     </section>;
    })}
   </details>;
  })}
  <details className="pcm-fold-block"><summary><strong>Marco de evaluación de la línea</strong> <small>preguntas, momentos, responsable y línea base</small></summary>
  <section className="pcm-pls-readiness" aria-label="Marco de evaluación de la línea">
   <p className="panel-note">Las necesidades diagnosticadas que no se priorizan se documentan una sola vez, para todo el Plan, en «Plan resultante».</p>
   <fieldset className="pcm-admin-review">
    <legend>Marco de evaluación</legend>
    <label>Preguntas de evaluación<textarea aria-label="Preguntas de evaluación" rows={3} disabled={!canEditProposal} value={(draft?.evaluationFramework?.evaluationQuestions ?? []).join("\n")} onChange={e => updateEvaluationFramework({evaluationQuestions: e.target.value.split(/\r?\n/g).map(cleanActionPlanProposalText).filter(Boolean)})}/></label>
    <label>Momentos de medición<textarea aria-label="Momentos de medición" rows={2} disabled={!canEditProposal} value={(draft?.evaluationFramework?.evaluationMoments ?? []).join("\n")} onChange={e => updateEvaluationFramework({evaluationMoments: e.target.value.split(/\r?\n/g).map(cleanActionPlanProposalText).filter(Boolean)})}/></label>
    <label>Responsable de evaluación<input aria-label="Responsable de evaluación" disabled={!canEditProposal} value={draft?.evaluationFramework?.evaluationResponsible ?? ""} onChange={e => updateEvaluationFramework({evaluationResponsible: e.target.value})}/></label>
    <label>Nota sobre línea base<textarea aria-label="Nota sobre línea base" rows={2} disabled={!canEditProposal} value={draft?.evaluationFramework?.baselineNote ?? ""} onChange={e => updateEvaluationFramework({baselineNote: e.target.value})}/></label>
   </fieldset>
  </section>
  </details>
  <p role="status">{persistenceMessage ?? (consultation ? (draft ? "Hay trabajo guardado en esta línea: se conserva sin cambios." : "Sin trabajo guardado en esta línea.") : directTerritorialEdit ? (draft ? "Cambios consolidados en el expediente de este territorio." : "Sin cambios territoriales guardados. Las modificaciones se guardan directamente en este expediente.") : (draft ? "Borrador guardado en este navegador. Para cambiar de equipo, conserva y traslada el expediente." : "Sin elecciones guardadas. Los cambios se guardan en este navegador."))}</p>
 </details>
 </article>;
}
