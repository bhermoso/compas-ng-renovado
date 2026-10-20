import { ACTION_PLAN_CATALOG } from '../../domain/action-plan-catalog';
import { ZAIDIN_AGING_PROPOSAL, createZaidinFinalActionPlanDraft } from '../../domain/action-plan-catalog/PlanPreparationDraft';
import {DefinitiveActionPlanPreview} from './DefinitiveActionPlanPreview';
import {LegacyActionPlanCatalogPanel,type LegacyActionPlanCatalogPanelProps} from './LegacyActionPlanCatalogPanel';

export function ActionPlanCatalogPanel(props:LegacyActionPlanCatalogPanelProps){
 const modules=ACTION_PLAN_CATALOG.map(original => props.municipalityId === 'granada-zaidin' && original.id === ZAIDIN_AGING_PROPOSAL.id ? ZAIDIN_AGING_PROPOSAL : original);
 const previous=props.drafts?.find(draft => draft.municipalityId === props.municipalityId && draft.moduleId === ZAIDIN_AGING_PROPOSAL.id);
 const current=props.drafts?.find(draft => draft.municipalityId === props.municipalityId && draft.moduleId === ZAIDIN_AGING_PROPOSAL.id && draft.version === ZAIDIN_AGING_PROPOSAL.version);
 const drafts=props.municipalityId === 'granada-zaidin' && !current
  ? [...(props.drafts ?? []).filter(draft => draft.moduleId !== ZAIDIN_AGING_PROPOSAL.id), createZaidinFinalActionPlanDraft(previous)]
  : props.drafts;
 return <div className="action-plan-workspace">
  {props.section !== 'lineas' && <DefinitiveActionPlanPreview municipalityId={props.municipalityId} modules={modules} drafts={drafts} worksheets={props.worksheets} validatedActionPlans={props.validatedActionPlans} onValidatePlan={props.onValidatePlan} onDraftChange={props.onDraftChange}/>}
  {props.section !== 'resultante' && <LegacyActionPlanCatalogPanel {...props} drafts={drafts}/>}
 </div>;
}
