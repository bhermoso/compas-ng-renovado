import {isValidElement,type ReactNode} from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Packer} from 'docx';
import mammoth from 'mammoth';
import {HEALTHY_AGING_MODULE,ADDICTIONS_MODULE} from '../src/domain/action-plan-catalog/ActionPlanCatalog';
import {ZAIDIN_AGING_PROPOSAL,type PlanPreparationDraft} from '../src/domain/action-plan-catalog/PlanPreparationDraft';
import {ZAGRA_AGING_PROPOSAL,municipalActionPlanModule} from '../src/domain/action-plan-catalog/MunicipalActionPlanModule';
import {actionPlanElementCode} from '../src/domain/action-plan-catalog/ActionPlanNotation';
import {buildDefinitiveActionPlanProjection as project} from '../src/domain/action-plan-catalog/DefinitiveActionPlanProjection';
import {buildPlanDocument} from '../src/domain/action-plan-catalog/PlanDocument';
import {planActionParagraphs} from '../src/application/action-plan/exportPlanDocument';
import {buildActionPlanTraceability} from '../src/domain/action-plan-catalog/ActionPlanTraceability';
import {worksheetKey,worksheetNotationContext,worksheetContextChanged,createIndicatorWorksheet} from '../src/domain/action-plan-catalog/IndicatorWorksheet';
import {buildIndicatorWorksheetDocument} from '../src/application/action-plan/exportIndicatorWorksheet';
import {PlanPreparationPanel} from '../src/ui/components/PlanPreparationPanel';
import {PlanningInstrumentCatalog} from '../src/ui/components/PlanningInstrumentCatalog';
import {LocalHealthPlanOutline} from '../src/ui/components/LocalHealthPlanOutline';

// Explicit correspondence, independent from the catalog builder.
const correspondence=[['5.1','1.1'],['5.2','1.2'],['2.1','2.1'],['2.2','2.2'],['3.1','2.3'],['3.2','2.4'],['6.1','2.5'],['6.2','2.6'],['7.2','2.7'],['1.1','3.1'],['1.2','3.2'],['9.1','3.3'],['9.2','3.4'],['4.1','4.1'],['4.2','4.2'],['8.1','4.3'],['8.2','4.4'],['7.1','4.5']];
function includedDraft(municipalityId:string,module=ZAGRA_AGING_PROPOSAL):PlanPreparationDraft{
 const decisions:PlanPreparationDraft['decisions']={};
 const put=(id:string,sourceText:string)=>{decisions[id]={status:'included',sourceText};};
 put(module.id,module.strategicObjective);
 for(const general of module.generalObjectives){put(general.code,general.title);for(const specific of general.specificObjectives){put(specific.code,specific.title);put(specific.indicator.code,specific.indicator.title);}}
 return {municipalityId,moduleId:module.id,version:module.version,updatedAt:'2026-10-30',decisions};
}
type Control={children?:ReactNode;'aria-label'?:string;onChange?:(event:{target:{value:string}})=>void};
function control(node:ReactNode,label:string):Control|undefined{
 if(Array.isArray(node)){for(const child of node){const found=control(child,label);if(found)return found;}}
 else if(isValidElement<Control>(node)){if(node.props['aria-label']===label)return node.props;return control(node.props.children,label);}
}

describe('Notación jerárquica de los cuatro bloques de envejecimiento saludable',()=>{
 it.each([['zagra',ZAGRA_AGING_PROPOSAL],['granada-zaidin',ZAIDIN_AGING_PROPOSAL]] as const)('aplica las 18 correspondencias exactas en %s sin cambiar identificadores',(_id,module)=>{
  const objectives=module.generalObjectives.flatMap(g=>g.specificObjectives);
  expect(module.generalObjectives.map(g=>actionPlanElementCode(module,g.code))).toEqual(['ENV-OG1','ENV-OG2','ENV-OG3','ENV-OG4']);
  expect(actionPlanElementCode(module,module.id)).toBe('ENV-OEST');
  for(const [oldCode,newCode] of correspondence){
   const objective=objectives.find(s=>s.code===`ENV-OE${oldCode}`)!;
   expect(objective.displayCode).toBe(`ENV-OE${newCode}`);
   expect(objective.indicator.code).toBe(`ENV-I${oldCode}`);
   expect(objective.indicator.displayCode).toBe(`ENV-I${newCode}`);
  }
  expect(new Set(objectives.map(s=>s.displayCode)).size).toBe(18);
  expect(new Set(objectives.map(s=>s.indicator.displayCode)).size).toBe(18);
 });
 it('seleccionar el código visible de Edadismo actualiza su identificador original, sin confundirlo con Autonomía',()=>{
  const module=ZAGRA_AGING_PROPOSAL;let draft:PlanPreparationDraft|undefined;
  const tree=PlanPreparationPanel({module,municipalityId:'zagra',draft,onChange:next=>{draft=next;},renderWorksheet:()=>null});
  control(tree,'Estado del Plan ENV-OE1.1')!.onChange!({target:{value:'modified'}});
  expect(draft!.decisions['ENV-OE5.1'].status).toBe('modified');
  expect(draft!.decisions['ENV-OE1.1']).toBeUndefined();
  expect(draft!.decisions['ZAGRA-ENV-OG1'].status).toBe('included');
 });
 it('pantalla, esbozo y documento muestran objetivos e indicadores con la misma numeración',()=>{
  const module=ZAGRA_AGING_PROPOSAL;const draft=includedDraft('zagra');
  const projection=project('zagra',[module],[draft]);const doc=buildPlanDocument('zagra',projection,'2026-10-30');
  const texts=planActionParagraphs(doc).map(p=>p.text).join('\n');
  const editor=renderToStaticMarkup(<PlanPreparationPanel module={module} municipalityId="zagra" draft={draft} onChange={()=>{}} renderWorksheet={()=>null}/>);
  const outline=renderToStaticMarkup(<LocalHealthPlanOutline municipalityId="zagra" municipalityName="Zagra" province="Granada" pslStatus="review" pslCompiled drafts={[draft]}/>);
  for(const [,newCode] of correspondence){for(const text of [editor,outline,texts]){expect(text).toContain(`ENV-OE${newCode}`);expect(text).toContain(`ENV-I${newCode}`);}}
  expect(texts).toContain('Objetivo general · ENV-OG3');
  expect(texts).not.toContain('ENV-OE5.1');expect(texts).not.toContain('ENV-I5.1');
  expect(editor).not.toContain('OE1.1 (ENV-');
 });
 it('las fichas y actuaciones siguen enlazadas por el indicador original',()=>{
  const module=ZAGRA_AGING_PROPOSAL;const draft=includedDraft('zagra');
  const context={municipalityId:'zagra',moduleId:module.id,moduleVersion:module.version,line:module.title,generalObjective:'ZAGRA-ENV-OG1 · Edadismo',objective:'ENV-OE5.1 · Redacción guardada',indicatorCode:'ENV-I5.1',indicator:'Indicador guardado',unit:'%',source:'Fuente'};
  const sheet=createIndicatorWorksheet(context);sheet.actions=[{id:'accion-local',values:{name:'Intervención guardada'},returns:[]}];
  const before=JSON.stringify(sheet);const links=buildActionPlanTraceability('zagra',project('zagra',[module],[draft]),[sheet]);
  const link=links.find(l=>l.indicatorCode==='ENV-I5.1')!;
  expect(link.indicatorDisplayCode).toBe('ENV-I1.1');expect(link.objectiveCode).toBe('ENV-OE1.1');expect(link.objectiveId).toBe('ENV-OE5.1');
  expect(link.indicatorWorksheetKey).toBe(worksheetKey(context));expect(link.actionCards[0].id).toBe('accion-local');expect(JSON.stringify(sheet)).toBe(before);
 });
 it('Word de una ficha actualiza solo las etiquetas; conserva texto, ceros y el original',async()=>{
  const context={municipalityId:'zagra',moduleId:ZAGRA_AGING_PROPOSAL.id,moduleVersion:ZAGRA_AGING_PROPOSAL.version,line:'Envejecimiento saludable',generalObjective:'ZAGRA-ENV-OG3 · Autonomía guardada',objective:'OE3.1 (ENV-OE1.1) · Texto municipal guardado',indicatorCode:'ENV-I1.1',indicator:'Indicador guardado',unit:'%',source:'Fuente'};
  const sheet=createIndicatorWorksheet(context);sheet.values.baseline='0';
  const before=JSON.stringify(sheet);
  const current={...context,generalObjective:'ENV-OG3 · Autonomía guardada',objective:'ENV-OE3.1 · Texto municipal guardado',indicatorDisplayCode:'ENV-I3.1'};
  const display=worksheetNotationContext(context,current);
  expect(worksheetKey(display)).toBe(worksheetKey(context));expect(worksheetContextChanged(sheet,current)).toBe(false);
  expect(worksheetContextChanged(sheet,{...current,indicator:'Otra definición'})).toBe(true);
  const buffer=await Packer.toBuffer(buildIndicatorWorksheetDocument({...sheet,context:display},'Pendiente de revisión',false));
  const {value}=await mammoth.extractRawText({buffer});
  expect(value).toContain('ENV-OE3.1 · Texto municipal guardado');expect(value).toContain('ENV-I3.1 · Indicador guardado');expect(value).not.toContain('ENV-I1.1');expect(value).toContain('\n0\n');expect(JSON.stringify(sheet)).toBe(before);
  expect(worksheetNotationContext({...context,moduleVersion:'3.1'},current).moduleVersion).toBe('3.1');
 });
 it('los instrumentos muestran códigos nuevos pero conservan el filtro de Edadismo',()=>{
  const html=renderToStaticMarkup(<PlanningInstrumentCatalog indicatorCode="ENV-I5.1" indicatorDisplayCode="ENV-I1.1" notationModule={ZAGRA_AGING_PROPOSAL}/>);
  expect(html).toContain('recogida · ENV-I1.1');expect(html).toContain('ENV-OE1.1');expect(html).not.toContain('ENV-OE5.1');
 });
 it('un documento validado anterior conserva su numeración impresa',()=>{
  const prior=buildPlanDocument('zagra',project('zagra',[HEALTHY_AGING_MODULE],[includedDraft('zagra',HEALTHY_AGING_MODULE)]),'2026-10-01');
  prior.status='validated';prior.validatedBy='Equipo';const before=JSON.stringify(prior);
  buildPlanDocument('zagra',project('zagra',[ZAGRA_AGING_PROPOSAL],[includedDraft('zagra')]),'2026-10-30');
  expect(JSON.stringify(prior)).toBe(before);
  expect(planActionParagraphs(prior).some(p=>p.text.startsWith('Indicador · ENV-I5.1'))).toBe(true);
 });
 it('Loja, el catálogo original y otras líneas conservan su notación',()=>{
  expect(municipalActionPlanModule('loja',HEALTHY_AGING_MODULE)).toBe(HEALTHY_AGING_MODULE);
  expect(actionPlanElementCode(HEALTHY_AGING_MODULE,'ENV-OE5.1')).toBe('ENV-OE5.1');
  expect(actionPlanElementCode(ADDICTIONS_MODULE,'ADI-OE1.1')).toBe('ADI-OE1.1');
  expect(HEALTHY_AGING_MODULE.generalObjectives.flatMap(g=>g.specificObjectives).every(s=>!s.displayCode&&!s.indicator.displayCode)).toBe(true);
 });
});
