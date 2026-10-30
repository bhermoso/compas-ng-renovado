import {isValidElement, type ReactNode} from 'react';
import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {HEALTHY_AGING_MODULE as original, ADDICTIONS_MODULE} from '../src/domain/action-plan-catalog/ActionPlanCatalog';
import {ZAGRA_AGING_PROPOSAL as module, prepareMunicipalActionPlanDraft, municipalActionPlanModule} from '../src/domain/action-plan-catalog/MunicipalActionPlanModule';
import {type PlanPreparationDraft, type PlanPreparationReview, thematicBlockNameFor} from '../src/domain/action-plan-catalog/PlanPreparationDraft';
import {buildDefinitiveActionPlanProjection as project} from '../src/domain/action-plan-catalog/DefinitiveActionPlanProjection';
import {buildPlanDocument, validatePlanDocument} from '../src/domain/action-plan-catalog/PlanDocument';
import {PlanPreparationPanel} from '../src/ui/components/PlanPreparationPanel';
import {LocalHealthPlanOutline} from '../src/ui/components/LocalHealthPlanOutline';
import {PlanDocumentActions} from '../src/ui/components/PlanDocumentActions';
import {buildActionPlanTraceability} from '../src/domain/action-plan-catalog/ActionPlanTraceability';
import {createIndicatorWorksheet} from '../src/domain/action-plan-catalog/IndicatorWorksheet';
import {createCompleteMunicipalityWorkspace} from '../src/application/workspace';
import {regroupZagraActionPlan} from '../src/application/workspace/regroupZagraActionPlan';

function legacy(): PlanPreparationDraft {
 return {municipalityId:'zagra',moduleId:original.id,version:original.version,updatedAt:'2026-10-01',decisions:{
  [original.id]:{status:'included',sourceText:original.strategicObjective},
  'ENV-OG1':{status:'excluded',sourceText:original.generalObjectives[0].title},
  'ENV-OE1.1':{status:'modified',sourceText:'Fuente anterior',text:'Redacción municipal propia'},
  'ENV-OE5.1':{status:'included',sourceText:'Edadismo'},
 }};
}
function fullDraft(): PlanPreparationDraft {
 const draft:PlanPreparationDraft={municipalityId:'zagra',moduleId:module.id,version:module.version,updatedAt:'2026-10-30',decisions:{}};
 const put=(id:string,sourceText:string)=>{draft.decisions[id]={status:'included',sourceText};};
 put(module.id,module.strategicObjective);
 for(const g of module.generalObjectives){put(g.code,g.title);for(const s of g.specificObjectives){put(s.code,s.title);put(s.indicator.code,s.indicator.title);}}
 return draft;
}
type Control={children?:ReactNode;'aria-label'?:string;onChange?:(e:{target:{value:string}})=>void;onClick?:()=>void};
function find(node:ReactNode,label:string):Control|undefined {
 if(Array.isArray(node)){for(const child of node){const result=find(child,label);if(result)return result;}}
 else if(isValidElement<Control>(node)){if(node.props['aria-label']===label)return node.props;return find(node.props.children,label);}
}

describe('Compatibilidad territorial y conservación de decisiones',()=>{
 it('archiva íntegro antes de migrar y mantiene decisiones pendientes tras guardar y recargar',()=>{
  const old=legacy();const before=JSON.stringify(old);
  const migrated=prepareMunicipalActionPlanDraft('zagra',module,old,'2026-10-30')!;
  expect(migrated.migration?.draft).toEqual(old);
  expect(JSON.stringify(old)).toBe(before);
  expect(migrated.decisions['ENV-OE1.1']).toMatchObject({status:'excluded',excludedDecision:{status:'modified',text:'Redacción municipal propia'}});
  expect(module.generalObjectives.map(g=>migrated.decisions[g.code].status)).toEqual(['pending','pending','pending','pending']);
  const restored=JSON.parse(JSON.stringify(migrated));
  expect(prepareMunicipalActionPlanDraft('zagra',module,restored)).toBe(restored);
  const active=project('zagra',[module],[restored]);
  expect(()=>validatePlanDocument('zagra',active,'Equipo','2026-10-30')).toThrow(/pendientes/);
  expect(buildPlanDocument('zagra',active,'2026-10-30').paragraphs.some(p=>p.text==='Bloque pendiente de revisión.')).toBe(true);
 });
 it.each(['unknown','3.1'])('no interpreta ni permite editar una referencia incompatible: %s',version=>{
  const draft={...fullDraft(),version};const before=JSON.stringify(draft);
  expect(project('zagra',[module],[draft])).toEqual([]);
  let changes=0;
  const html=renderToStaticMarkup(<PlanPreparationPanel municipalityId="zagra" module={module} draft={draft} onChange={()=>changes++} renderWorksheet={()=>null}/>);
  expect(html).toContain('compatibilidad');expect(html).not.toContain('<select');expect(changes).toBe(0);
  expect(JSON.stringify(draft)).toBe(before);
 });
 it('rechaza versiones desconocidas y expedientes cruzados sin tocar el original',()=>{
  const draft={...legacy(),version:'unknown'};
  expect(()=>prepareMunicipalActionPlanDraft('zagra',module,draft)).toThrow(/compatibilidad/);
  expect(()=>prepareMunicipalActionPlanDraft('loja',original,legacy())).toThrow(/municipio/);
  const workspace=createCompleteMunicipalityWorkspace({id:'zagra',name:'Zagra'});
  workspace.planPreparationDrafts=[draft];expect(regroupZagraActionPlan(workspace)).toBe(workspace);
 });
 it('reincorporar un objetivo recupera su adaptación y conserva el original archivado',()=>{
  let draft=prepareMunicipalActionPlanDraft('zagra',module,legacy())!;
  const render=()=>PlanPreparationPanel({municipalityId:'zagra',module,draft,onChange:next=>{draft=next;},renderWorksheet:()=>null});
  find(render(),'Estado del Plan ENV-OE3.1')!.onChange!({target:{value:'included'}});
  expect(draft.decisions['ENV-OE1.1']).toMatchObject({status:'modified',text:'Redacción municipal propia'});
  expect(draft.migration?.draft).toEqual(legacy());
  draft=JSON.parse(JSON.stringify(draft));
  expect(project('zagra',[module],[draft])[0].rows.find(r=>r.specific.code==='ENV-OE1.1')?.objectiveDecision?.text).toBe('Redacción municipal propia');
 });
 it('excluir y reincorporar el módulo completo conserva adaptaciones, fichas y actuaciones',()=>{
  let draft=fullDraft();draft.decisions['ENV-OE1.1']={status:'modified',sourceText:'Fuente',text:'Texto territorial'};
  const render=()=>PlanPreparationPanel({municipalityId:'zagra',module,draft,onChange:next=>{draft=next;},renderWorksheet:()=>null});
  // Bulk controls expose their group, then the two actual button handlers.
  const group=find(render(),`Incorporación de propuestas de ${module.title}`)!;
  const buttons=(group.children as ReactNode[]).filter(n=>isValidElement(n)&&n.type==='button');
  (buttons[1] as React.ReactElement<Control>).props.onClick!();
  expect(project('zagra',[module],[draft])[0].rows).toHaveLength(0);
  const nextGroup=find(render(),`Incorporación de propuestas de ${module.title}`)!;
  const nextButtons=(nextGroup.children as ReactNode[]).filter(n=>isValidElement(n)&&n.type==='button');
  (nextButtons[0] as React.ReactElement<Control>).props.onClick!();
  expect(draft.decisions['ENV-OE1.1']).toMatchObject({status:'modified',text:'Texto territorial'});
  const sheet=createIndicatorWorksheet({municipalityId:'zagra',moduleId:module.id,moduleVersion:'3.1',line:'Anterior',generalObjective:'ENV-OG1',objective:'ENV-OE1.1',indicatorCode:'ENV-I1.1',indicator:'Original',unit:'%',source:'Fuente'});
  sheet.actions=[{id:'a1',values:{name:'Actuación local'},returns:[]}];
  const before=JSON.stringify(sheet);
  const links=buildActionPlanTraceability('zagra',project('zagra',[module],[draft]),[sheet]);
  expect(links.find(l=>l.indicatorCode==='ENV-I1.1')?.actionCards[0].name).toBe('Actuación local');
  expect(JSON.stringify(sheet)).toBe(before);
 });
 it('esbozo y exportación comparten el orden editorial completo y la identidad municipal',()=>{
  const draft=fullDraft();const p=project('zagra',[module],[draft]);
  const doc=buildPlanDocument('zagra',p,'2026-10-30');
  const html=renderToStaticMarkup(<LocalHealthPlanOutline municipalityId="zagra" municipalityName="Zagra" province="Granada" pslStatus="review" pslCompiled drafts={[draft]}/>);
  const expected=module.generalObjectives.flatMap(g=>g.specificObjectives.map(s=>s.displayCode!));
  expect(p[0].rows.map(r=>r.specific.displayCode)).toEqual(expected);
  expect(doc.paragraphs.filter(p=>p.text.startsWith('Objetivo específico')).map(p=>p.text.split(' · ')[1])).toEqual(expected);
  const positions=expected.map(code=>html.indexOf(code));expect(positions.every(p=>p>=0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a,b)=>a-b));
  expect(html).toContain('Plan Local de Salud de Zagra');expect(html).not.toContain('Distrito Zagra');
 });
 it('Loja y otras líneas conservan el significado original de sus códigos',()=>{
  const loja=municipalActionPlanModule('loja',original);expect(loja).toBe(original);
  expect(municipalActionPlanModule('zagra',ADDICTIONS_MODULE)).toBe(ADDICTIONS_MODULE);
  expect(thematicBlockNameFor('ENV-OG1',loja)).toBeUndefined();
  const draft={...fullDraft(),municipalityId:'loja',version:original.version};
  draft.decisions['ENV-OG1']={status:'included',sourceText:original.generalObjectives[0].title};
  const doc=buildPlanDocument('loja',project('loja',[loja],[draft]),'2026-10-30');
  expect(doc.paragraphs.some(p=>p.text==='Bloque temático · Edadismo')).toBe(false);
  expect(doc.paragraphs.some(p=>p.text.includes('Preservar la autonomía'))).toBe(true);
 });
 it('ofrece descargas separadas sin modificar la versión validada anterior',()=>{
  const p=project('zagra',[module],[fullDraft()]);const saved={...buildPlanDocument('zagra',p,'2026-10-01'),status:'validated' as const,validatedBy:'Equipo',paragraphs:[{text:'Plan anterior de nueve grupos'}]};
  const before=JSON.stringify(saved);
  const html=renderToStaticMarkup(<PlanDocumentActions municipalityId="zagra" active={p} versions={[saved]}/>);
  expect(html).toContain('Descargar borrador actual · PDF');expect(html).toContain('Descargar última versión validada · PDF');
  expect(html).toContain('2026-10-01');expect(JSON.stringify(saved)).toBe(before);
  expect(buildPlanDocument('zagra',p,'2026-10-30').moduleVersions).toEqual([{moduleId:module.id,version:module.version}]);
 });
 it('recupera borradores ya reagrupados solo desde el archivo conocido y respeta ediciones posteriores',()=>{
  const workspace=createCompleteMunicipalityWorkspace({id:'zagra',name:'Zagra'});
  const old=legacy();const current=prepareMunicipalActionPlanDraft('zagra',module,old)!;
  delete current.migration;delete current.decisions['ENV-OE1.1'].excludedDecision;
  workspace.planPreparationDrafts=[current];
  workspace.planPreparationDraftHistory=[{replacedAt:'2026-10-28',replacementVersion:module.version,draft:old}];
  const repaired=regroupZagraActionPlan(workspace,'2026-10-30');
  expect(repaired.planPreparationDrafts![0].decisions['ENV-OE1.1'].excludedDecision?.text).toBe('Redacción municipal propia');
  expect(repaired.planPreparationDraftHistory).toEqual(workspace.planPreparationDraftHistory);
  expect(regroupZagraActionPlan(repaired)).toBe(repaired);
  current.decisions['ENV-OE1.1'].text='Edición posterior';
  const later=regroupZagraActionPlan(workspace);
  expect(later.planPreparationDrafts![0].decisions['ENV-OE1.1']).toMatchObject({text:'Edición posterior'});
  expect(later.planPreparationDrafts![0].decisions['ENV-OE1.1'].excludedDecision).toBeUndefined();
 });
 it('una nueva revisión administrativa no reactiva las decisiones de una versión anterior',()=>{
  const review:PlanPreparationReview={municipalityId:'zagra',moduleId:module.id,sourceVersion:original.version,sourceDraftVersion:7,updatedAt:'2026-10-01',decisions:{
   'ENV-OE1.1':{status:'accepted',sourceText:'Texto anterior',reviewedAt:'2026-10-01'},
   'ENV-OE5.1':{status:'accepted',sourceText:'Texto anterior',reviewedAt:'2026-10-01'},
  }};
  let next:PlanPreparationReview|undefined;
  const tree=PlanPreparationPanel({municipalityId:'zagra',module,draft:fullDraft(),onChange:()=>{},renderWorksheet:()=>null,canReview:true,canEditProposal:false,review,reviewIsCurrent:false,onReviewChange:r=>{next=r;}});
  find(tree,'Revisión administrativa ENV-OE3.1')!.onChange!({target:{value:'reformulated'}});
  expect(Object.keys(next!.decisions)).toEqual(['ENV-OE1.1']);
  expect(review.decisions['ENV-OE5.1'].status).toBe('accepted');
 });
 it('la exportación rechaza una proyección incompatible construida manualmente',()=>{
  const p=project('zagra',[module],[fullDraft()]);p[0].draft!.version='unknown';
  expect(()=>buildPlanDocument('zagra',p,'2026-10-30')).toThrow(/compatibilidad/);
 });
});
