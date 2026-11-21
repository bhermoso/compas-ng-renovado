import { ACTION_PLAN_CATALOG } from '../../domain/action-plan-catalog';
import { municipalActionPlanModule } from '../../domain/action-plan-catalog/MunicipalActionPlanModule';
import {DefinitiveActionPlanPreview} from './DefinitiveActionPlanPreview';
import {LegacyActionPlanCatalogPanel,type LegacyActionPlanCatalogPanelProps} from './LegacyActionPlanCatalogPanel';

export function ActionPlanCatalogPanel(props:LegacyActionPlanCatalogPanelProps){
 const modules=ACTION_PLAN_CATALOG.map(original => municipalActionPlanModule(props.municipalityId, original));
 const drafts=props.drafts;
 return <div className="action-plan-workspace">
  {props.section !== 'lineas' && <DefinitiveActionPlanPreview municipalityId={props.municipalityId} municipalityName={props.municipalityName} modules={modules} drafts={drafts} worksheets={props.worksheets} validatedActionPlans={props.validatedActionPlans} onValidatePlan={props.onValidatePlan} onDeletePlanVersion={props.onDeletePlanVersion} onDraftChange={props.onDraftChange}/>}
  {props.section !== 'resultante' && <LegacyActionPlanCatalogPanel {...props} drafts={drafts}/>}
 </div>;
}
