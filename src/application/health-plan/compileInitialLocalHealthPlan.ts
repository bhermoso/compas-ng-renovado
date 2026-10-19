import type { MunicipalityWorkspace } from "../../domain/workspace";
import { latestValidatedPlan } from "../../domain/action-plan-catalog/PlanDocument";
import { traceabilityHasLinkedActionFichas } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import { computePSLHash } from "../health-profile-compiler/LocalHealthProfileCompiler";
import { readSealedCanonicalDocument } from "../psl-c-canonical";
import { buildPSLCDocumentModel, type PSLCDocumentModel, type PSLCDocumentSection } from "../psl-c-export";
import { assessProfileValidation, type ProfileValidationCriterion } from "../../domain/quality/ProfileValidationCriterion";
import { planActionParagraphs, planActuationParagraphs } from "../action-plan/exportPlanDocument";

export type InitialPlanCompilation =
 | { ok: true; document: PSLCDocumentModel; profileValidation: ProfileValidationCriterion }
 | { ok: false; issues: string[] };

function actionImplementationParagraphs(plan: NonNullable<ReturnType<typeof latestValidatedPlan>>): string[] {
 const links = plan.traceabilityLinks ?? [];
 if (!traceabilityHasLinkedActionFichas(links)) {
  return [
   "Pendiente de incorporar y validar las fichas de actuaciones, su vinculación con objetivos e indicadores, responsables, calendario, recursos y agenda anual."
  ];
 }
 const actionCount = links.reduce((total, link) => total + link.actionCards.length, 0);
 const activityCount = links.reduce((total, link) => total + link.actionCards.reduce((sum, action) => sum + action.activities.length, 0), 0);
 const paragraphs = [
  `La versión validada del Plan de Acción incorpora ${actionCount} fichas de actuación vinculadas a indicadores y ${activityCount} actividades, hitos o productos verificables.`,
 ];
 for (const link of links.filter((item) => item.actionCards.length > 0)) {
  paragraphs.push(`${link.objectiveCode} → ${link.indicatorCode}: ${link.actionCards.map((action) => action.name).join("; ")}.`);
  const pending = link.pendingSummary.filter((item) => !item.includes("ficha de indicador pendiente"));
  if (pending.length) paragraphs.push(`Pendiente de cierre en ${link.indicatorCode}: ${pending.join("; ")}.`);
 }
 const missing = links.filter((link) => link.actionCards.length === 0).map((link) => link.indicatorCode);
 if (missing.length) paragraphs.push(`Indicadores todavía sin ficha de actuación vinculada: ${missing.join(", ")}.`);
 paragraphs.push("Estas fichas documentan el estado de preparación; no sustituyen la aprobación institucional ni la agenda anual validada.");
 return paragraphs;
}

/** Initial working document only. Never changes or approves the source snapshots. */
export function compileInitialLocalHealthPlan(
 workspace: MunicipalityWorkspace,
 pslIsStale: boolean,
 generatedAt = new Date().toISOString()
): InitialPlanCompilation {
 const municipalityId = workspace.municipality.identity.id;
 const psl = workspace.validatedPSL;
 const issues: string[] = [];
 // La validación del Perfil no es requisito: se informa como criterio de calidad.
 const ownPsl = psl && psl.municipalityId === municipalityId ? psl : undefined;
 const profileValidation = assessProfileValidation(ownPsl?.status, ownPsl ? pslIsStale : false);
 // Approval may follow compilation without changing the validated diagnostic content.
 const hashes = psl ? [computePSLHash(psl), ...(psl.status === "approved" ? [computePSLHash({...psl, status: "validated"})] : [])] : [];
 const profile = (workspace.compiledProfiles ?? [])
  .filter(p => p.municipalityId === municipalityId && p.sourcePSLId === psl?.id
   && p.sourcePSLVersion === psl?.version && p.sourcePSLEvidenceStoreVersion === psl?.evidenceStoreVersion
   && hashes.includes(p.sourceHash))
  .reduce<(NonNullable<MunicipalityWorkspace["compiledProfiles"]>)[number] | undefined>(
   (latest, p) => !latest || p.compiledAt >= latest.compiledAt ? p : latest, undefined);
 if (profile && (!profile.canonicalDocument || !readSealedCanonicalDocument(profile.canonicalDocument))) {
  issues.push("Vuelve a compilar el Perfil para incorporar su documento completo y sellado.");
 }
 const plan = latestValidatedPlan(workspace.validatedActionPlans ?? [], municipalityId);
 if (!plan?.paragraphs.length) issues.push("Valida y guarda la versión actual del Plan de Acción.");
 if (issues.length || !plan) return {ok: false, issues};

 const profileModel = profile ? buildPSLCDocumentModel(profile) : undefined;
 const actionSections: PSLCDocumentSection[] = [];
 for (const paragraph of planActionParagraphs(plan)) {
  if (paragraph.heading || !actionSections.length) {
   actionSections.push({title: paragraph.heading ? paragraph.text : "Versión del Plan de Acción", level: 2, paragraphs: paragraph.heading ? [] : [paragraph.text]});
  } else actionSections[actionSections.length - 1].paragraphs.push(paragraph.text);
 }
 const priorities = profile?.priorizacion.tematicasSeleccionadasLabels ?? [];
 const name = workspace.municipality.identity.name;
 const sections: PSLCDocumentSection[] = [
  {title: "1. Identidad y alcance", level: 1, paragraphs: [
   "Compilación inicial del Plan Local de Salud de " + name + ".",
   "Documento de trabajo para revisión por el grupo. Integra el Perfil compilado vigente, si existe, y la última versión validada del Plan de Acción.",
   "Criterio de calidad «Perfil validado»: " + (profileValidation.met ? "cumplido" : "no cumplido") + ". " + profileValidation.detail + (profile ? "" : " El Perfil no está compilado en esta versión."),
   "Las fichas de actuaciones, responsables, calendario, recursos y aprobación institucional se incorporarán en una fase posterior."
  ]},
  {title: "2. Perfil de Salud Local", level: 1, paragraphs: profileModel ? profileModel.portada : ["Perfil de Salud Local no compilado en esta versión. Esta sección se completará cuando el Perfil esté compilado."]},
  ...(profileModel ? profileModel.sections : []),
  {title: "3. Prioridades recogidas en el Perfil", level: 1, paragraphs: [
   ...(priorities.length ? priorities : ["No constan prioridades seleccionadas en esta versión del Perfil; pendiente de incorporar."]),
   ...(profile?.priorizacion.deliberacionNota ? [profile.priorizacion.deliberacionNota] : [])
  ]},
  {title: "4. Plan de Acción validado", level: 1, paragraphs: []},
  ...actionSections,
  {title: "5. Actuaciones y agenda de implementación", level: 1, paragraphs: [
   ...actionImplementationParagraphs(plan),
   ...planActuationParagraphs(plan, { heading: false }).map((paragraph) => paragraph.text)
  ]},
  {title: "6. Seguimiento, evaluación y aprobación", level: 1, paragraphs: [
   plan.evaluationFramework
    ? "El marco de evaluación disponible se recoge en el Plan de Acción. Queda pendiente completar su aplicación a las actuaciones y a la agenda."
    : "Pendiente de definir el marco de seguimiento y evaluación.",
   ...(!plan.unaddressedNeeds?.length ? ["Pendiente de documentar las necesidades no priorizadas o declarar que todas están incluidas."] : []),
   "Pendiente de cierre y aprobación institucional. Esta compilación no acredita la aprobación del Plan Local de Salud."
  ]},
  {title: "7. Versiones utilizadas", level: 1, paragraphs: [
   "Fecha de compilación inicial: " + generatedAt,
   profile ? "Perfil: " + profile.artifactVersion + " · " + profile.id + " · compilado: " + profile.compiledAt : "Perfil: sin compilar en esta versión.",
   ...(profile ? ["Huella del Perfil: " + profile.sourceHash] : []),
   "Criterio de calidad «Perfil validado»: " + profileValidation.label + ".",
   "Plan de Acción: " + plan.generatedAt + " · validación técnica: " + (plan.validatedBy ?? "no registrada"),
   "Los cambios posteriores sin validar no se incorporan. Para actualizar el documento, valida las nuevas versiones y genera otra compilación."
  ]}
 ];
 return {ok: true, profileValidation, document: JSON.parse(JSON.stringify({
  title: "Plan Local de Salud de " + name,
  subtitle: "BORRADOR · Compilación inicial",
  portada: [
   "Generado el " + generatedAt.slice(0, 10) + ".",
   "Pendiente de completar actuaciones y aprobación institucional.",
   (profile ? "Perfil " + profile.artifactVersion : "Perfil sin compilar") + " · " + profileValidation.label + " · Plan de Acción validado el " + plan.generatedAt.slice(0, 10)
  ],
  sections,
  fileName: "plan-local-salud-" + municipalityId.replace(/[^a-z0-9-]/gi, "-") + "-borrador-" + generatedAt.slice(0,10) + ".docx"
 })) as PSLCDocumentModel};
}
