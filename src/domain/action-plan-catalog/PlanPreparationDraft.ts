import { HEALTHY_AGING_MODULE, type ActionPlanCatalogModule } from "./ActionPlanCatalog";
import type { PLSEvaluationFramework, UnaddressedNeed } from "../health-plan";
export const ZAIDIN_FINAL_ACTION_PLAN_VERSION = "zaidin-plan-accion-final-2026-09-25";
/** Alias conservado para compatibilidad con expedientes y consumidores anteriores. */
export const ZAIDIN_PROPOSAL_VERSION = ZAIDIN_FINAL_ACTION_PLAN_VERSION;

export function cleanObsoleteActionPlanProgramLabels(text: string): string {
 const obsoleteProgramLabel = /\s*\([^)]*(?:MANY AGES|MAY AGES|ONE LIFE|ZAID[IÍ]N SENIOR FEST)[^)]*\)\.?/giu;
 if (!obsoleteProgramLabel.test(text)) return text;
 return text
  .replace(/\s*\([^)]*(?:MANY AGES|MAY AGES|ONE LIFE|ZAID[IÍ]N SENIOR FEST)[^)]*\)\.?/giu, ".")
  .replace(/\s+\./g, ".")
  .replace(/\.{2,}/g, ".")
  .trim();
}

export function cleanActionPlanProposalText(text: string): string {
 return cleanObsoleteActionPlanProgramLabels(text)
  .replace(/\s{2,}/g, " ")
  .trim();
}

export const plainProposalText = (text: string) => cleanActionPlanProposalText(text.replaceAll("**", ""));
export const proposalStrategicText = "**Favorecer** el **envejecimiento saludable** de las personas mayores del Zaidín mediante la **reducción del edadismo**, la **prevención y el abordaje de la soledad no deseada**, el **mantenimiento de la autonomía** y el **fortalecimiento de la participación comunitaria**.";
export const proposalObjectiveTexts: Record<string, string> = {
  "ENV-OE5.1": "Reducir las actitudes edadistas entre las personas participantes en intervenciones comunitarias.",
  "ENV-OE5.2": "Incrementar la visibilidad de las personas mayores como personas capaces, diversas y socialmente activas en las iniciativas comunitarias.",
  "ENV-OE2.1": "Aumentar la detección de situaciones de soledad o riesgo de soledad entre las personas mayores contactadas por los recursos y agentes participantes.",
  "ENV-OE2.2": "Reducir la soledad percibida entre las personas mayores incorporadas a una intervención por situación de soledad.",
  "ENV-OE3.1": "Mejorar los contactos sociales de las personas mayores.",
  "ENV-OE3.2": "Mejorar el apoyo social percibido por las personas mayores.",
  "ENV-OE6.1": "Aumentar la capacidad de las personas agentes del distrito Zaidín para identificar y canalizar situaciones de soledad o riesgo de aislamiento social.",
  "ENV-OE6.2": "Incrementar el aprovechamiento de los activos comunitarios en actuaciones orientadas a favorecer relaciones sociales y prevenir la soledad.",
  "ENV-OE7.2": "Mejorar la continuidad entre la detección comunitaria, la valoración y la respuesta ante situaciones de soledad o aislamiento.",
  "ENV-OE1.1": "Mantener y fortalecer la autonomía de las personas mayores que participan en actuaciones de promoción de la salud.",
  "ENV-OE1.2": "Mejorar el bienestar emocional de las personas mayores que participan en actuaciones de promoción de la salud.",
  "ENV-OE9.1": "Mejorar las competencias digitales funcionales de las personas mayores con dificultades para utilizar servicios digitales.",
  "ENV-OE9.2": "Aumentar la autonomía de las personas mayores para realizar gestiones digitales esenciales.",
  "ENV-OE4.1": "Aumentar la participación de las personas mayores en actividades comunitarias significativas para ellas.",
  "ENV-OE4.2": "Incrementar el protagonismo y la influencia de la población mayor del distrito.",
  "ENV-OE8.1": "Reducir las barreras de accesibilidad identificadas como prioritarias en los espacios y equipamientos comunitarios.",
  "ENV-OE8.2": "Mejorar la accesibilidad a los recursos y actividades comunitarias que se dirigen a las personas mayores del distrito Zaidín.",
  "ENV-OE7.1": "Consolidar la participación estable de los recursos sanitarios, sociales, municipales y comunitarios en la coordinación de la línea de envejecimiento saludable."
};
export const proposalBlocks = [
  {code:"ENV-OG1",name:"Edadismo",text:"Reducir las actitudes edadistas entre las personas participantes y promover una imagen social positiva de las personas mayores.",objectives:["ENV-OE5.1","ENV-OE5.2"]},
  {code:"ENV-OG2",name:"Soledad no deseada",text:"Prevenir y reducir la soledad no deseada y el aislamiento social, fortaleciendo las relaciones, el apoyo social y la respuesta comunitaria.",objectives:["ENV-OE2.1","ENV-OE2.2","ENV-OE3.1","ENV-OE3.2","ENV-OE6.1","ENV-OE6.2","ENV-OE7.2"]},
  {code:"ENV-OG3",name:"Autonomía",text:"Preservar y fortalecer la autonomía de las personas mayores para decidir y desarrollar su vida cotidiana, sus relaciones y su participación en la comunidad, contando con los apoyos que necesiten, y promover su bienestar emocional.",objectives:["ENV-OE1.1","ENV-OE1.2","ENV-OE9.1","ENV-OE9.2"]},
  {code:"ENV-OG4",name:"Participación",text:"Incrementar la participación significativa y el protagonismo de las personas mayores en la comunidad, reduciendo las barreras de accesibilidad a los recursos, servicios y actividades comunitarias y la brecha digital, y fortaleciendo la coordinación comunitaria.",objectives:["ENV-OE4.1","ENV-OE4.2","ENV-OE8.1","ENV-OE8.2","ENV-OE7.1"]}
];

export function thematicBlockNameFor(code: string): string | undefined {
 return proposalBlocks.find(block => block.code === code.replace(/^ZAGRA-/, ""))?.name;
}

export function compareActionPlanNotation(left: string, right: string): number {
 const leftNumbers = [...left.matchAll(/\d+/g)].map(match => Number(match[0]));
 const rightNumbers = [...right.matchAll(/\d+/g)].map(match => Number(match[0]));
 const width = Math.max(leftNumbers.length, rightNumbers.length);
 for (let index = 0; index < width; index += 1) {
  const diff = (leftNumbers[index] ?? -1) - (rightNumbers[index] ?? -1);
  if (diff !== 0) return diff;
 }
 const typeOrder = (code: string) => code.includes("-OG") ? 0 : code.includes("-OE") ? 1 : code.includes("-I") ? 2 : 3;
 const typeDiff = typeOrder(left) - typeOrder(right);
 return typeDiff !== 0 ? typeDiff : left.localeCompare(right, "es");
}

export const ZAIDIN_AGING_PROPOSAL: ActionPlanCatalogModule = {
 ...HEALTHY_AGING_MODULE, version: ZAIDIN_PROPOSAL_VERSION,
 sourceLabel: "Redacción final del Plan de Acción del Distrito Zaidín", sourceDate: "2026-09-25",
 strategicObjective: plainProposalText(proposalStrategicText),
 generalObjectives: proposalBlocks.map((block, blockIndex) => ({code: block.code, title: plainProposalText(block.text),
 specificObjectives: block.objectives.map((code, objectiveIndex) => {
 const original = HEALTHY_AGING_MODULE.generalObjectives.flatMap(g => g.specificObjectives).find(o => o.code === code);
 if (!original) throw new Error(`Objetivo original ausente: ${code}`);
 return {...original, displayCode: `OE${blockIndex + 1}.${objectiveIndex + 1} (${code})`, title: plainProposalText(proposalObjectiveTexts[code])};
 })}))
};

export function createZaidinFinalActionPlanDraft(
 previous?: PlanPreparationDraft,
 updatedAt = new Date().toISOString()
): PlanPreparationDraft {
 const decisions: Record<string, PlanPreparationDecision> = {
  [ZAIDIN_AGING_PROPOSAL.id]: {status:"included",sourceText:ZAIDIN_AGING_PROPOSAL.strategicObjective},
 };
 for (const general of ZAIDIN_AGING_PROPOSAL.generalObjectives) {
  decisions[general.code] = {status:"included",sourceText:general.title};
  for (const specific of general.specificObjectives) {
   decisions[specific.code] = {status:"included",sourceText:specific.title};
   decisions[specific.indicator.code] = {status:"included",sourceText:specific.indicator.title};
  }
 }
 return {
  municipalityId: "granada-zaidin",
  moduleId: ZAIDIN_AGING_PROPOSAL.id,
  version: ZAIDIN_AGING_PROPOSAL.version,
  updatedAt,
  decisions,
  unaddressedNeeds: previous?.unaddressedNeeds,
  evaluationFramework: previous?.evaluationFramework,
 };
}

export interface PlanPreparationDecision {
 status: "pending" | "included" | "excluded" | "modified";
 /** Territorial text persisted as current wording for this municipality workspace. */
 text?: string;
 sourceText: string;
}
export interface PlanPreparationDraft {
 municipalityId: string;
 moduleId: string;
 version: string;
 updatedAt: string;
 decisions: Record<string, PlanPreparationDecision>;
 /** Necesidades diagnosticadas que quedan fuera de este ciclo y su justificación. Gate G-PLS-7. */
 unaddressedNeeds?: UnaddressedNeed[];
 /** Marco mínimo que hará evaluable el futuro PLS. Gate G-PLS-10. */
 evaluationFramework?: PLSEvaluationFramework;
}

export const ALL_DIAGNOSTIC_NEEDS_ADDRESSED: UnaddressedNeed = {
 id: "all-diagnostic-needs-addressed",
 title: "Sin necesidades diagnosticadas fuera del Plan de Acción",
 justification: "Todas las necesidades identificadas para este ciclo han quedado incorporadas al Plan de Acción.",
};

export function normaliseUnaddressedNeedsForPlan(needs: UnaddressedNeed[] | undefined): UnaddressedNeed[] | undefined {
 if (needs === undefined) return undefined;
 if (needs.length === 0) return [{ ...ALL_DIAGNOSTIC_NEEDS_ADDRESSED }];
 const clean = needs
  .map((need) => ({
   ...need,
   id: need.id.trim(),
   title: cleanActionPlanProposalText(need.title),
   sourceAreaId: need.sourceAreaId?.trim(),
   justification: cleanActionPlanProposalText(need.justification),
  }))
  .filter((need) => need.id && need.title && need.justification);
 return clean;
}

export function normaliseEvaluationFramework(framework: PLSEvaluationFramework | undefined): PLSEvaluationFramework | undefined {
 if (!framework) return undefined;
 const evaluationQuestions = framework.evaluationQuestions
  .map(cleanActionPlanProposalText)
  .filter(Boolean);
 const evaluationMoments = framework.evaluationMoments
  .map(cleanActionPlanProposalText)
  .filter(Boolean);
 const evaluationResponsible = cleanActionPlanProposalText(framework.evaluationResponsible);
 const baselineNote = cleanActionPlanProposalText(framework.baselineNote);
 if (!evaluationQuestions.length && !evaluationMoments.length && !evaluationResponsible && !baselineNote) return undefined;
 return { evaluationQuestions, evaluationMoments, evaluationResponsible, baselineNote };
}

export function hasCompleteEvaluationFramework(framework: PLSEvaluationFramework | undefined): boolean {
 const clean = normaliseEvaluationFramework(framework);
 return !!clean &&
  clean.evaluationQuestions.length > 0 &&
  clean.evaluationMoments.length > 0 &&
  clean.evaluationResponsible.length > 0 &&
  clean.baselineNote.length > 0;
}

export type PlanPreparationReviewStatus = "accepted" | "rejected" | "reformulated";
export interface PlanPreparationReviewDecision {
 status: PlanPreparationReviewStatus;
 sourceText: string;
 proposedText?: string;
 /** Required when the administrator reformulates the territorial proposal. */
 consolidatedText?: string;
 reviewedAt: string;
}
export interface PlanPreparationReview {
 municipalityId: string;
 moduleId: string;
 sourceVersion: string;
 /** Server version of the territorial draft reviewed by the administrator. */
 sourceDraftVersion: number;
 updatedAt: string;
 decisions: Record<string, PlanPreparationReviewDecision>;
}

export function proposedTextFor(decision: PlanPreparationDecision | undefined, sourceText: string): string {
 return cleanActionPlanProposalText(decision?.status === "modified" && decision.text?.trim() ? decision.text.trim() : sourceText);
}
export function consolidatedTextFor(sourceText: string, proposal: PlanPreparationDecision | undefined, review: PlanPreparationReviewDecision | undefined): string {
 if (!review) return cleanActionPlanProposalText(sourceText);
 if (review.status === "accepted") return proposedTextFor(proposal, sourceText);
 if (review.status === "reformulated" && review.consolidatedText?.trim()) return cleanActionPlanProposalText(review.consolidatedText.trim());
 return cleanActionPlanProposalText(sourceText);
}
export function excludedByAncestor(draft: PlanPreparationDraft | undefined, ancestors: string[]): boolean {
 return ancestors.some(id => draft?.decisions[id]?.status === "excluded");
}
