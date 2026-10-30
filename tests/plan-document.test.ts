import { describe,it,expect } from "vitest";
import { Packer } from "docx";
import { ZAIDIN_AGING_PROPOSAL as module, thematicBlockNameFor, type PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import {
  validatePlanDocument,
  latestValidatedPlan,
  buildPlanDocument,
  validatePlanDocumentForLocalHealthPlan,
} from "../src/domain/action-plan-catalog/PlanDocument";
import { createIndicatorWorksheet } from "../src/domain/action-plan-catalog/IndicatorWorksheet";
import { buildPlanWord,buildPlanPdf,planDocumentParagraphs,planActionParagraphs,planActuationParagraphs } from "../src/application/action-plan/exportPlanDocument";
function fixture(){
 const draft:PlanPreparationDraft={municipalityId:"granada-zaidin",moduleId:module.id,version:module.version,updatedAt:"2026-09-16",decisions:{}};
 const put=(id:string,text:string)=>{draft.decisions[id]={status:"included",sourceText:text};};
 put(module.id,module.strategicObjective);
 for(const g of module.generalObjectives){put(g.code,g.title);for(const s of g.specificObjectives){put(s.code,s.title);put(s.indicator.code,s.indicator.title);}}
 return draft;
}
describe("Versiones documentales del Plan",()=>{
 it("agrupa todos los objetivos bajo un único encabezado por bloque",()=>{
  const draft=fixture();
  const doc=buildPlanDocument(draft.municipalityId,buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]),"2026-09-17");
  expect(doc.paragraphs.filter(p=>p.heading).slice(1).map(p=>p.text.split(" · ")[1])).toEqual(module.generalObjectives.map(g=>thematicBlockNameFor(g.code, module)));
  for(const general of module.generalObjectives){
   const blockName=thematicBlockNameFor(general.code, module);
   expect(doc.paragraphs.filter(p=>p.heading&&p.text==="Bloque temático · "+blockName)).toHaveLength(1);
   const heading=doc.paragraphs.findIndex(p=>p.heading&&p.text==="Bloque temático · "+blockName);
   const next=doc.paragraphs.findIndex((p,i)=>i>heading&&!!p.heading);
   const group=doc.paragraphs.slice(heading,next<0?undefined:next);
   for(const objective of general.specificObjectives) expect(group.some(p=>p.text.includes(objective.displayCode ?? objective.code))).toBe(true);
  }
 });
 it("congela las redacciones, no incorpora cambios posteriores y aísla ámbitos",()=>{
  const draft=fixture();const id=module.generalObjectives[0].specificObjectives[0].code;
  draft.decisions[id]={...draft.decisions[id],status:"modified",text:"Redacción validada vigente"};
  const active=buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]);
  const saved=validatePlanDocument(draft.municipalityId,active,"Equipo técnico","2026-09-16T10:00:00Z");
  draft.decisions[id].text="Cambio posterior sin validar";
  expect(JSON.stringify(saved)).toContain("Redacción validada vigente");
  expect(JSON.stringify(saved)).not.toContain("Cambio posterior sin validar");
  expect(latestValidatedPlan([saved],"atarfe")).toBeUndefined();
  const restored=JSON.parse(JSON.stringify(saved));
  expect(latestValidatedPlan([restored],draft.municipalityId)).toEqual(saved);
 });
 it("rechaza pendientes y nunca convierte un borrador en validado por exportarlo",()=>{
  const draft=fixture();draft.decisions[module.id].status="pending";
  const active=buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]);
  expect(()=>validatePlanDocument(draft.municipalityId,active,"Equipo","2026-09-16")).toThrow();
  expect(buildPlanDocument(draft.municipalityId,active,"2026-09-16").status).toBe("draft");
 });
 it("excluye objetivos descartados y elige la última validación",()=>{
  const draft=fixture();const objective=module.generalObjectives[0].specificObjectives[0];
  draft.decisions[objective.code].status="excluded";
  const doc=validatePlanDocument(draft.municipalityId,buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]),"Equipo","2026-09-16");
  expect(doc.paragraphs.some(p=>p.text.includes(objective.displayCode ?? objective.code))).toBe(false);
  expect(doc.paragraphs.some(p=>p.text.startsWith("Indicador · "+objective.indicator.code+" ·"))).toBe(false);
  const later={...doc,generatedAt:"2026-09-17"};
  expect(latestValidatedPlan([later,doc],draft.municipalityId)).toBe(later);
 });
 it("genera archivos Word y PDF desde la misma versión",async()=>{
  const draft=fixture();const doc=validatePlanDocument(draft.municipalityId,buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]),"Equipo","2026-09-16");
  const word=await Packer.toBuffer(buildPlanWord(doc));
  expect(word.subarray(0,2).toString()).toBe("PK");
  const pdf=buildPlanPdf(doc);
  expect(pdf.output()).toContain("%PDF");
 expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
 expect(planDocumentParagraphs(doc).map(p=>p.text)).toContain("Versión validada técnicamente");
 });
 it("declara gates pendientes para alimentar el futuro PLS si faltan necesidades no priorizadas o evaluación",()=>{
  const draft=fixture();
  const doc=validatePlanDocument(draft.municipalityId,buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]),"Equipo","2026-09-16");
  expect(validatePlanDocumentForLocalHealthPlan(doc).map(v=>v.gate)).toEqual(["G-PLS-7","G-PLS-10"]);
 });
 it("conserva necesidades no priorizadas y marco de evaluación en la versión validada",()=>{
  const draft=fixture();
  draft.unaddressedNeeds=[];
  draft.evaluationFramework={
   evaluationQuestions:["¿Se han reducido las barreras priorizadas por las personas mayores?"],
   evaluationMoments:["Revisión anual","Final del período"],
   evaluationResponsible:"Equipo técnico municipal de salud",
   baselineNote:"Los indicadores incluidos conservan el tiempo cero definido en sus fichas.",
  };
  const doc=validatePlanDocument(
   draft.municipalityId,
   buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]),
   "Equipo",
   "2026-09-16"
  );
  expect(doc.unaddressedNeeds?.[0].id).toBe("all-diagnostic-needs-addressed");
  expect(doc.evaluationFramework?.evaluationQuestions).toEqual([
   "¿Se han reducido las barreras priorizadas por las personas mayores?",
  ]);
  expect(validatePlanDocumentForLocalHealthPlan(doc)).toEqual([]);
  const texts=planDocumentParagraphs(doc).map(p=>p.text);
  expect(texts).toContain("Necesidades diagnosticadas no priorizadas");
  expect(texts).toContain("Marco de evaluación");
  expect(texts.join("\n")).toContain("Equipo técnico municipal de salud");
 });
 it("congela el mapa de vínculos con fichas, actuaciones y actividades",()=>{
  const draft=fixture();
  const first=module.generalObjectives[0].specificObjectives[0];
  const sheet=createIndicatorWorksheet({
   municipalityId:draft.municipalityId,moduleId:module.id,moduleVersion:module.version,line:module.title,
   generalObjective:module.generalObjectives[0].code,objective:first.code,indicatorCode:first.indicator.code,
   indicator:first.indicator.title,unit:first.indicator.unit,source:module.sourceLabel,
  });
  sheet.actions=[{id:"a1",values:{
   name:"Actuación conectada",owner:"Centro de salud",contribution:"Ejecuta sesiones vinculadas al objetivo.",
   schedule:"Primer semestre",resources:"Sala y equipo técnico",requestedData:"Participantes y sesiones",source:"Registro de actividad",
  },activities:[{id:"act-1",values:{name:"Taller inicial",status:"planificado"}}],returns:[{id:"r1",values:{period:"2027"}}]}];
  sheet.consolidations=[{id:"c1",status:"pending",values:{period:"2027"}}];
  const active=buildDefinitiveActionPlanProjection(draft.municipalityId,[module],[draft]);
  const doc=validatePlanDocument(draft.municipalityId,active,"Equipo","2026-09-16",{worksheets:[sheet]});
  expect(doc.traceabilityLinks?.find(link=>link.indicatorCode===first.indicator.code)?.actionCards[0].activities[0].name).toBe("Taller inicial");
  sheet.actions[0].values.name="Cambio posterior sin validar";
  expect(JSON.stringify(doc)).toContain("Actuación conectada");
  expect(JSON.stringify(doc)).not.toContain("Cambio posterior sin validar");
  const texts=planDocumentParagraphs(doc).map(p=>p.text).join("\n");
  expect(texts).toContain("Mapa de vínculos del Plan de Acción");
  expect(texts).toContain("Actuación conectada");
  expect(texts).toContain("Taller inicial");
  // El Plan de Acción no incluye actuaciones; estas viven en su propia sección.
  const action=planActionParagraphs(doc).map(p=>p.text).join("\n");
  expect(action).not.toContain("Actuación conectada");
  expect(action).not.toContain("Taller inicial");
  const actuations=planActuationParagraphs(doc).map(p=>p.text).join("\n");
  expect(actuations).toContain("Actuaciones y agenda de implementación");
  expect(actuations).toContain("Actuación conectada");
  expect(actuations).toContain("Taller inicial");
 });
});
