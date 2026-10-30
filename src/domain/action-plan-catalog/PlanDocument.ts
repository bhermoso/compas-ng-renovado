import type { DefinitiveActionPlanModuleProjection } from "./DefinitiveActionPlanProjection";
import { pendingPreparationDecisionCount, resolvedPlanDecisionText } from "./DefinitiveActionPlanProjection";
import type { PLSEvaluationFramework, UnaddressedNeed } from "../health-plan";
import {
 compareActionPlanNotation,
 hasCompleteEvaluationFramework,
 normaliseEvaluationFramework,
 normaliseUnaddressedNeedsForPlan,
 thematicBlockNameFor,
} from "./PlanPreparationDraft";
import { buildActionPlanTraceability, type ActionPlanTraceabilityLink } from "./ActionPlanTraceability";
import type { IndicatorWorksheet } from "./IndicatorWorksheet";

export interface PlanDocumentOptions {
 unaddressedNeeds?: UnaddressedNeed[];
 evaluationFramework?: PLSEvaluationFramework;
 worksheets?: IndicatorWorksheet[];
}

export interface PlanDocument {
 schemaVersion: 1;
 municipalityId: string;
 generatedAt: string;
 status: "draft" | "validated";
 validatedBy?: string;
 moduleVersions?: {moduleId: string; version: string}[];
 unaddressedNeeds?: UnaddressedNeed[];
 evaluationFramework?: PLSEvaluationFramework;
 traceabilityLinks?: ActionPlanTraceabilityLink[];
 paragraphs: { text: string; heading?: boolean }[];
}

export type PlanDocumentPLSReadinessGate = "G-PLS-7" | "G-PLS-10";
export interface PlanDocumentPLSReadinessViolation {
 gate: PlanDocumentPLSReadinessGate;
 message: string;
}

function optionsFromDrafts(active: DefinitiveActionPlanModuleProjection[]): PlanDocumentOptions {
 const drafts = active.map((item) => item.draft).filter(Boolean);
 return {
  unaddressedNeeds: drafts.find((draft) => draft?.unaddressedNeeds !== undefined)?.unaddressedNeeds,
  evaluationFramework: drafts.find((draft) => draft?.evaluationFramework !== undefined)?.evaluationFramework,
 };
}

export function buildPlanDocument(
 municipalityId: string,
 active: DefinitiveActionPlanModuleProjection[],
 generatedAt: string,
 options: PlanDocumentOptions = {}
): PlanDocument {
 if (active.some(({module, draft}) => draft && (draft.municipalityId !== municipalityId || draft.moduleId !== module.id || draft.version !== module.version))) {
  throw new Error("La referencia del borrador ha cambiado. Revisa su compatibilidad antes de exportar.");
 }
 const paragraphs: PlanDocument["paragraphs"] = [];
 for (const { module, moduleDecision, rows } of active) {
  if (!rows.length) continue;
  paragraphs.push(
   {text:module.title,heading:true},
   {text:"Objetivo estratégico: "+resolvedPlanDecisionText(moduleDecision,module.strategicObjective)}
  );
  const groups = new Map<string, typeof rows>();
  for (const row of rows) groups.set(row.general.code, [...(groups.get(row.general.code) ?? []), row]);
  for (const general of module.generalObjectives) {
   const group = groups.get(general.code);
   if (!group) continue;
   const first = group[0];
   const blockName = thematicBlockNameFor(first.general.code, module) ?? first.general.code;
   paragraphs.push(
    {text:"Bloque temático · "+blockName,heading:true},
    {text:"Objetivo general · "+(first.general.displayCode ?? first.general.code)+" · "+resolvedPlanDecisionText(first.generalDecision,first.general.title)},
    ...(!first.generalDecision || first.generalDecision.status === "pending" ? [{text:"Bloque pendiente de revisión."}] : [])
   );
   const orderedGroup = [...group].sort((left, right) =>
    compareActionPlanNotation(left.specific.displayCode ?? left.specific.code, right.specific.displayCode ?? right.specific.code)
   );
   for (const row of orderedGroup) {
    paragraphs.push({text:"Objetivo específico · "+(row.specific.displayCode ?? row.specific.code)+" · "+resolvedPlanDecisionText(row.objectiveDecision,row.specific.title)});
    paragraphs.push({text:row.indicatorIncluded ? "Indicador · "+(row.specific.indicator.displayCode ?? row.specific.indicator.code)+" · "+resolvedPlanDecisionText(row.indicatorDecision,row.specific.indicator.title) : "Indicador no incorporado."});
   }
  }
 }
 const draftOptions = optionsFromDrafts(active);
 const unaddressedNeeds = normaliseUnaddressedNeedsForPlan(options.unaddressedNeeds ?? draftOptions.unaddressedNeeds);
 const evaluationFramework = normaliseEvaluationFramework(options.evaluationFramework ?? draftOptions.evaluationFramework);
 const traceabilityLinks = buildActionPlanTraceability(municipalityId, active, options.worksheets);
 return {
  schemaVersion: 1,
  municipalityId,
  generatedAt,
  status: "draft",
  moduleVersions: active.map(({module}) => ({moduleId: module.id, version: module.version})),
  ...(unaddressedNeeds !== undefined ? { unaddressedNeeds } : {}),
  ...(evaluationFramework !== undefined ? { evaluationFramework } : {}),
  ...(traceabilityLinks.length > 0 ? { traceabilityLinks } : {}),
  paragraphs,
 };
}
export function validatePlanDocument(
 municipalityId: string,
 active: DefinitiveActionPlanModuleProjection[],
 name: string,
 date: string,
 options: PlanDocumentOptions = {}
): PlanDocument {
 if (!name.trim()) throw new Error("Indica quién realiza la validación técnica.");
 if (active.some(x=>pendingPreparationDecisionCount(x.module,x.draft)>0)) throw new Error("Resuelve los elementos pendientes antes de validar.");
 for (const {module,draft} of active) {
  if (draft && draft.version !== module.version) throw new Error("La referencia del borrador ha cambiado. Revisa su versión antes de validar.");
  if (Object.values(draft?.decisions??{}).some(d=>d.status==="modified"&&!d.text?.trim())) throw new Error("Completa las redacciones modificadas vacías.");
 }
 const doc = buildPlanDocument(municipalityId,active,date,options);
 if (!doc.paragraphs.length) throw new Error("Incluye objetivos antes de validar.");
 return {...doc,status:"validated",validatedBy:name.trim()};
}
export function latestValidatedPlan(documents: PlanDocument[], municipalityId: string): PlanDocument | undefined {
 return documents.filter(d=>d.schemaVersion===1&&d.municipalityId===municipalityId&&d.status==="validated")
  .reduce<PlanDocument|undefined>((latest,d)=>!latest||d.generatedAt>=latest.generatedAt?d:latest,undefined);
}
export function validatePlanDocumentForLocalHealthPlan(plan: PlanDocument): PlanDocumentPLSReadinessViolation[] {
 const violations: PlanDocumentPLSReadinessViolation[] = [];
 if (!plan.unaddressedNeeds?.length || plan.unaddressedNeeds.some((need) => !need.justification.trim())) {
  violations.push({
   gate: "G-PLS-7",
   message: "Documenta las necesidades diagnosticadas no priorizadas o declara expresamente que todas han quedado incluidas.",
  });
 }
 if (!hasCompleteEvaluationFramework(plan.evaluationFramework)) {
  violations.push({
   gate: "G-PLS-10",
   message: "Define preguntas, momentos, responsable y nota de línea base para el marco de evaluación del PLS.",
  });
 }
 return violations;
}
