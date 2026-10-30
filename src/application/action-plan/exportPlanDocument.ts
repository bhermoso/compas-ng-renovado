import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import type { PlanDocument } from "../../domain/action-plan-catalog/PlanDocument";
type PlanParagraph = { text: string; heading?: boolean };

const fichaStatusText = (status: string) =>
 status === "missing" ? "pendiente" : status === "draft" ? "abierta" : "registrada";

/** Plan de Acción: líneas, objetivos, indicadores y su medición. No incluye actuaciones. */
export function planActionParagraphs(plan: PlanDocument): PlanParagraph[] {
 const paragraphs: PlanParagraph[] = [
  {text:"Plan de Acción",heading:true},
  {text:"Ámbito: "+(plan.municipalityId==="granada-zaidin"?"Granada-Zaidín":plan.municipalityId)},
  {text:plan.status==="validated"?"Versión validada técnicamente":"BORRADOR — sin validar"},
  {text:"Fecha de versión: "+plan.generatedAt},
  ...(plan.validatedBy?[{text:"Validación técnica: "+plan.validatedBy}]:[]),
  {text:"La validación técnica no constituye aprobación institucional del Plan."},
  ...plan.paragraphs
 ];
 if (plan.unaddressedNeeds?.length) {
  paragraphs.push(
   { text: "Necesidades diagnosticadas no priorizadas", heading: true },
   ...plan.unaddressedNeeds.map((need) => ({
    text: `${need.title}: ${need.justification}`,
   }))
  );
 }
 if (plan.evaluationFramework) {
  paragraphs.push(
   { text: "Marco de evaluación", heading: true },
   { text: "Preguntas de evaluación: " + (plan.evaluationFramework.evaluationQuestions.join("; ") || "pendientes") },
   { text: "Momentos de medición: " + (plan.evaluationFramework.evaluationMoments.join("; ") || "pendientes") },
   { text: "Responsable de evaluación: " + (plan.evaluationFramework.evaluationResponsible || "pendiente") },
   { text: "Línea base: " + (plan.evaluationFramework.baselineNote || "pendiente") }
  );
 }
 if (plan.traceabilityLinks?.length) {
  paragraphs.push({ text: "Mapa de vínculos del Plan de Acción", heading: true });
  for (const link of plan.traceabilityLinks) {
   paragraphs.push({
    text: [
     `${link.moduleTitle} → ${link.thematicBlock} → ${link.objectiveCode} → ${link.indicatorDisplayCode ?? link.indicatorCode}`,
     `Indicador del Plan de Acción: ${link.indicatorTitle}`,
     `Ficha del indicador: ${fichaStatusText(link.indicatorFichaStatus)}.`,
    ].join("\n"),
   });
  }
 }
 return paragraphs;
}

/**
 * Actuaciones y agenda de implementación: instrumento de ejecución, separado del Plan
 * de Acción (CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT §3.1 bis). Las fichas de actuación se
 * conservan aquí como fuente de datos de cada indicador. Devuelve vacío si no hay vínculos.
 */
export function planActuationParagraphs(plan: PlanDocument, options: { heading?: boolean } = {}): PlanParagraph[] {
 const links = plan.traceabilityLinks ?? [];
 if (!links.length) return [];
 const paragraphs: PlanParagraph[] = [];
 if (options.heading !== false) paragraphs.push({ text: "Actuaciones y agenda de implementación", heading: true });
 paragraphs.push({ text: "Las actuaciones son el instrumento de ejecución y no forman parte del Plan de Acción. Alimentan el resultado de cada indicador, que se consolida por indicador y no se atribuye a actuaciones concretas." });
 for (const link of links) {
  paragraphs.push({
   text: [
    `${link.objectiveCode} → ${link.indicatorDisplayCode ?? link.indicatorCode}: ${link.indicatorTitle}`,
    `Ficha del indicador: ${fichaStatusText(link.indicatorFichaStatus)}. Actuaciones: ${link.actionCards.length}. Actividades: ${link.actionCards.reduce((total, action) => total + action.activities.length, 0)}. Entregas: ${link.actionCards.reduce((total, action) => total + action.deliveryCount, 0)}. Consolidaciones: ${link.consolidationCount}.`,
    link.pendingSummary.length ? `Pendiente: ${link.pendingSummary.join("; ")}` : "Sin campos obligatorios pendientes en las fichas registradas.",
   ].join("\n"),
  });
  for (const action of link.actionCards) {
   paragraphs.push({
    text: [
     `Ficha de actuación: ${action.name}`,
     `Responsable: ${action.owner}. Calendario: ${action.schedule}. Recursos: ${action.resources}.`,
     `Contribución: ${action.contribution}`,
     `Datos/fuentes: ${action.requestedData} · ${action.source}`,
     `Actividades: ${action.activities.length ? action.activities.map((activity) => `${activity.name} (${activity.status})`).join("; ") : "pendientes"}`,
    ].join("\n"),
   });
  }
 }
 return paragraphs;
}

/** Documento completo para Word y PDF: primero el Plan de Acción, después las actuaciones como parte separada. */
export function planDocumentParagraphs(plan: PlanDocument): PlanParagraph[] {
 return [...planActionParagraphs(plan), ...planActuationParagraphs(plan)];
}
export function buildPlanWord(plan: PlanDocument) {
 return new Document({creator:"COMPÁS NG",title:"Plan de Acción",styles:{default:{document:{run:{font:"Arial",size:22},paragraph:{spacing:{after:140}}}}},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1247,bottom:1247,left:1247,right:1247}}},children:planDocumentParagraphs(plan).map((p,i)=>new Paragraph({
 heading:i===0?HeadingLevel.TITLE:p.heading?HeadingLevel.HEADING_1:undefined,
 keepNext:!!p.heading,children:p.text.split("\n").map((t,j)=>new TextRun({text:t,break:j?1:0,color:"000000"}))
 }))}]});
}
export function buildPlanPdf(plan: PlanDocument) {
 const pdf=new jsPDF({unit:"mm",format:"a4"}); let y=22;
 const paragraphs=planDocumentParagraphs(plan);
 for (const p of paragraphs) {
  const size=p.heading?13:11; const lineHeight=p.heading?6.5:5.5;
  pdf.setFont("helvetica",p.heading?"bold":"normal");pdf.setFontSize(size);
  const lines=pdf.splitTextToSize(p.text.replace(/≥/g,">=").replace(/≤/g,"<=").replace(/≈/g,"~"),166) as string[];
  // Keep the entire heading and the beginning of its content on one page.
  const requiredHeight = lineHeight*lines.length + (p.heading ? 14 : 0);
  if (requiredHeight<=252&&y+requiredHeight>274){pdf.addPage();y=22;}
  for (const line of lines) {
   if(y+lineHeight>274){pdf.addPage();y=22;}
   pdf.text(line,22,y);y+=lineHeight;
  } y+=3;
 }
 const count=pdf.getNumberOfPages();
 for(let i=1;i<=count;i++){pdf.setPage(i);pdf.setFont("helvetica","normal");pdf.setFontSize(9);pdf.text("COMPÁS NG · "+i+" / "+count,22,286);}
 return pdf;
}
export async function downloadPlanDocument(plan:PlanDocument,format:"docx"|"pdf"){
 const blob=format==="docx"?await Packer.toBlob(buildPlanWord(plan)):buildPlanPdf(plan).output("blob");
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
 a.download="Plan-Accion-"+plan.municipalityId.replace(/[^a-z0-9-]/gi,"-")+"-"+plan.status+"-"+plan.generatedAt.slice(0,10)+"."+format;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
