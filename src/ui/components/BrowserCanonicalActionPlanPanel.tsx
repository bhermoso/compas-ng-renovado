import { ACTION_PLAN_CATALOG } from '../../domain/action-plan-catalog';
import { municipalActionPlanModule } from '../../domain/action-plan-catalog/MunicipalActionPlanModule';
import {DefinitiveActionPlanPreview} from './DefinitiveActionPlanPreview';
import {GroupMotorPlanNotice,LegacyActionPlanCatalogPanel,type LegacyActionPlanCatalogPanelProps} from './LegacyActionPlanCatalogPanel';

export function ActionPlanCatalogPanel(props:LegacyActionPlanCatalogPanelProps){
 // El Plan resultante solo reúne las líneas que adopta la decisión vigente del Grupo Motor.
 const adopted=new Set(props.eligibleModules.map(item=>item.module.id));
 const modules=ACTION_PLAN_CATALOG.filter(original=>adopted.has(original.id)).map(original => municipalActionPlanModule(props.municipalityId, original));
 const drafts=props.drafts;
 return <div className="action-plan-workspace">
  {props.section === 'resultante' && <GroupMotorPlanNotice groupMotor={props.groupMotor} adoptedTitles={modules.map(m=>m.title)}/>}
  {props.section !== 'lineas' && <DefinitiveActionPlanPreview municipalityId={props.municipalityId} municipalityName={props.municipalityName} modules={modules} drafts={drafts} worksheets={props.worksheets} validatedActionPlans={props.validatedActionPlans} onValidatePlan={props.onValidatePlan} onDeletePlanVersion={props.onDeletePlanVersion} onDraftChange={props.onDraftChange} profileTrace={props.profileTrace} onOpenIndicatorFicha={props.onOpenIndicatorFicha}/>}
  {props.section !== 'resultante' && <LegacyActionPlanCatalogPanel {...props} drafts={drafts}/>}
 </div>;
}
