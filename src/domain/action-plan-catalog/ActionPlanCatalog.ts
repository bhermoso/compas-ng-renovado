import type { DeliberativePrioritySelection } from "../deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../strategic-scenario";

export type CatalogDecisionStatus = "pending" | "accepted" | "adapted" | "rejected";

export interface CatalogIndicatorTemplate {
  code: string;
  /** Visible notation; code remains the persistent identifier. */
  displayCode?: string;
  title: string;
  unit: "%" | "Nº";
  suggestedSource: string;
  direction: "ascending" | "descending";
  periodicity: "Anual";
  operationalDefinition: string;
  calculationMethod: string;
  disaggregation: string;
  baseline: string;
  target: string;
  dataOwner: string;
  qualityCriterion: string;
  limitation: string;
}

export interface CatalogSpecificObjectiveTemplate {
  code: string;
  /** Código editorial mostrado en el Plan territorial; el código canónico se conserva en `code`. */
  displayCode?: string;
  title: string;
  indicator: CatalogIndicatorTemplate;
}

export interface CatalogGeneralObjectiveTemplate {
  code: string;
  displayCode?: string;
  /** Editorial label scoped to this module version, never inferred from a reused code. */
  thematicBlockName?: string;
  title: string;
  specificObjectives: readonly CatalogSpecificObjectiveTemplate[];
}

export interface ActionPlanCatalogModule {
  id: string;
  version: string;
  title: string;
  strategicObjective: string;
  strategicObjectiveDisplayCode?: string;
  sourceLabel: string;
  sourceDate: string;
  generalObjectives: readonly CatalogGeneralObjectiveTemplate[];
  cautions: readonly string[];
}

export interface CatalogElementDecision {
  elementId: string;
  status: CatalogDecisionStatus;
  adaptedText?: string;
}

export interface MunicipalActionPlanModuleReview {
  id: string;
  municipalityId: string;
  moduleId: string;
  moduleVersion: string;
  sourceLecturaId: string;
  sourcePrioritySelectionId: string;
  sourceScenarioIds: string[];
  decisions: CatalogElementDecision[];
  reviewedBy: string;
  reviewedAt: string;
  requiresHumanValidation: true;
}

export interface EligibleActionPlanModule {
  module: ActionPlanCatalogModule;
  sourceScenarioIds: string[];
}

const sharedCautions = [
  "La arquitectura es una propuesta común y no se incorpora al Plan de Acción sin revisión expresa del Grupo Motor.",
  "Las definiciones operacionales, numeradores, denominadores y fuentes deben cerrarse antes de la primera medición.",
  "La línea base, la meta y la entidad responsable del dato deben acordarse en el municipio.",
  "El sistema no genera actuaciones, responsables, plazos, recursos ni presupuestos.",
] as const;

function indicator(
  code: string,
  title: string,
  source: string,
  unit: "%" | "Nº" = "%",
  direction: "ascending" | "descending" = "ascending"
): CatalogIndicatorTemplate {
  return {
    code,
    title,
    unit,
    suggestedSource: source,
    direction,
    periodicity: "Anual",
    operationalDefinition: "Pendiente de cierre operativo antes de la primera medición. Deben fijarse la población o unidad elegible, el criterio de cumplimiento, el periodo de observación y el instrumento o registro utilizado.",
    calculationMethod: unit === "%"
      ? "Porcentaje = (nº de personas/unidades que cumplen el criterio definido / nº total de personas/unidades elegibles con dato válido) × 100. Numerador y denominador concretos pendientes de cierre."
      : "Recuento de unidades únicas que cumplen el criterio definido durante el periodo evaluado. Criterio concreto pendiente de cierre.",
    disaggregation: "Sexo y grupo de edad cuando el indicador se refiera a personas y la fuente lo permita; otras variables cuando sean pertinentes y justificadas.",
    baseline: "Por establecer mediante el primer corte consolidado con la definición operacional cerrada.",
    target: "Por acordar tras disponer de línea base y horizonte temporal del Plan.",
    dataOwner: "Pendiente de asignación formal a la entidad o recurso que custodie la fuente primaria.",
    qualityCriterion: "Evitar dobles recuentos; documentar numerador y denominador; mantener estable la definición; registrar datos faltantes y cambios de fuente.",
    limitation: "Evalúa el objetivo específico definido y no debe interpretarse aisladamente como medida global de la línea estratégica.",
  };
}

function oe(code: string, title: string, ind: CatalogIndicatorTemplate): CatalogSpecificObjectiveTemplate {
  return { code, title, indicator: ind };
}

function og(code: string, title: string, ...specificObjectives: CatalogSpecificObjectiveTemplate[]): CatalogGeneralObjectiveTemplate {
  return { code, title, specificObjectives };
}

const ENV_SOURCE = "Registro específico de la intervención/Plan";
const ADI_FAMILY = "Evaluación pre/post de competencias familiares";
const ADI_LEISURE = "Registros de ocio saludable";
const ADI_PERCEPTION = "Cuestionario pre/post de percepción/normalización";
const ADI_CONTROL = "Registros de control/inspección";
const ADI_ACCESS = "Registros de detección, derivación y acceso";
const ADI_COORDINATION = "Memoria técnica y registros de coordinación";

export const HEALTHY_AGING_MODULE: ActionPlanCatalogModule = {
  id: "env-2027-2030",
  version: "3.1",
  title: "Envejecimiento saludable",
  strategicObjective: "Favorecer un envejecimiento saludable, promoviendo la autonomía, el bienestar, las relaciones sociales significativas, la participación y el reconocimiento social de las personas mayores, y fortaleciendo la capacidad comunitaria para prevenir y abordar situaciones de soledad y aislamiento social.",
  sourceLabel: "I Plan Local de Salud del Distrito Zaidín 2027–2030 · arquitectura y fichas técnicas",
  sourceDate: "2026-08-26",
  cautions: sharedCautions,
  generalObjectives: [
    og("ENV-OG1", "Preservar la autonomía y el bienestar de las personas mayores",
      oe("ENV-OE1.1", "Mantener la autonomía funcional de las personas mayores con riesgo de deterioro que participan en intervenciones preventivas.", indicator("ENV-I1.1", "% de participantes que mantienen o mejoran su nivel de autonomía funcional entre la valoración inicial y la de seguimiento.", ENV_SOURCE)),
      oe("ENV-OE1.2", "Mejorar el bienestar emocional de las personas mayores participantes en intervenciones específicamente dirigidas a este fin.", indicator("ENV-I1.2", "% de participantes que mejoran su situación de bienestar emocional entre la valoración inicial y la de seguimiento, de acuerdo con el instrumento establecido.", ENV_SOURCE))),
    og("ENV-OG2", "Prevenir y reducir la soledad no deseada",
      oe("ENV-OE2.1", "Aumentar la detección de situaciones de soledad o riesgo de soledad entre las personas mayores contactadas por los recursos y agentes participantes.", indicator("ENV-I2.1", "% de personas mayores susceptibles de valoración a las que se aplica el procedimiento acordado de detección de soledad. Referencia: CEL Tool/UCLA-3.", "CEL Tool/UCLA-3")),
      oe("ENV-OE2.2", "Reducir la soledad percibida entre las personas mayores incorporadas a una intervención por situación de soledad.", indicator("ENV-I2.2", "% de participantes que reducen su nivel de soledad entre la valoración inicial y el seguimiento. Referencia: De Jong Gierveld.", "De Jong Gierveld"))),
    og("ENV-OG3", "Fortalecer las relaciones sociales y el apoyo social",
      oe("ENV-OE3.1", "Mejorar la red social de las personas mayores identificadas con riesgo de aislamiento social.", indicator("ENV-I3.1", "% de participantes con riesgo inicial de aislamiento social que mejoran su puntuación en LSNS-6 en el seguimiento.", "LSNS-6")),
      oe("ENV-OE3.2", "Mejorar el apoyo social percibido por las personas mayores identificadas con apoyo insuficiente.", indicator("ENV-I3.2", "% de participantes con apoyo social insuficiente que mejoran su puntuación en Duke-UNC-11 durante el seguimiento.", "Duke-UNC-11"))),
    og("ENV-OG4", "Incrementar la vinculación y participación comunitaria de las personas mayores",
      oe("ENV-OE4.1", "Aumentar la participación de las personas mayores en actividades comunitarias significativas para ellas.", indicator("ENV-I4.1", "% de participantes que incorporan o recuperan al menos una actividad comunitaria significativa identificada en su proceso de intervención.", ENV_SOURCE)),
      oe("ENV-OE4.2", "Incrementar el protagonismo de las personas mayores como agentes activos de la comunidad.", indicator("ENV-I4.2", "% de participantes que desempeñan un papel activo de organización, dinamización, voluntariado, formación, representación o apoyo mutuo en alguna iniciativa comunitaria.", ENV_SOURCE))),
    og("ENV-OG5", "Reducir el edadismo y promover una imagen social positiva de las personas mayores",
      oe("ENV-OE5.1", "Reducir las actitudes edadistas entre las personas participantes en intervenciones comunitarias específicamente dirigidas a este fin.", indicator("ENV-I5.1", "% de participantes que reducen su nivel de actitudes edadistas entre la evaluación inicial y final.", ENV_SOURCE)),
      oe("ENV-OE5.2", "Incrementar la visibilidad de las personas mayores como personas capaces, diversas y socialmente activas en las iniciativas comunitarias.", indicator("ENV-I5.2", "% de iniciativas de sensibilización sobre envejecimiento incluidas en el Plan que incorporan participación directa de personas mayores en su diseño o desarrollo.", ENV_SOURCE))),
    og("ENV-OG6", "Fortalecer la capacidad comunitaria para prevenir y abordar la soledad y el aislamiento social",
      oe("ENV-OE6.1", "Aumentar la capacidad de los agentes comunitarios para identificar y canalizar situaciones de soledad o riesgo de aislamiento social.", indicator("ENV-I6.1", "Nº de agentes comunitarios activos que han detectado, orientado o derivado al menos una situación conforme al procedimiento establecido durante el periodo evaluado.", "Registro de agentes/activos comunitarios", "Nº")),
      oe("ENV-OE6.2", "Incrementar la implicación de los activos comunitarios en actuaciones orientadas a favorecer relaciones sociales y prevenir la soledad.", indicator("ENV-I6.2", "Nº de activos comunitarios que participan de forma efectiva en al menos una actuación de la estrategia comunitaria durante el periodo evaluado.", "Registro de agentes/activos comunitarios", "Nº"))),
    og("ENV-OG7", "Consolidar una respuesta comunitaria coordinada para el envejecimiento saludable",
      oe("ENV-OE7.1", "Consolidar la participación estable de los recursos sanitarios, sociales, municipales y comunitarios en la coordinación de la línea de envejecimiento saludable.", indicator("ENV-I7.1", "% de entidades y servicios comprometidos con la línea que cumplen el criterio establecido de participación regular en su estructura de coordinación.", "Actas y registro de coordinación/derivaciones")),
      oe("ENV-OE7.2", "Mejorar la continuidad entre la detección comunitaria, la valoración y la respuesta ante situaciones de soledad o aislamiento.", indicator("ENV-I7.2", "% de situaciones derivadas a la red en las que consta valoración y respuesta del recurso receptor dentro del plazo establecido.", "Actas y registro de coordinación/derivaciones"))),
    og("ENV-OG8", "Mejorar la accesibilidad de los entornos y recursos comunitarios para favorecer la autonomía y participación de las personas mayores",
      oe("ENV-OE8.1", "Reducir las barreras de accesibilidad identificadas como prioritarias en los espacios y equipamientos comunitarios.", indicator("ENV-I8.1", "% de barreras de accesibilidad priorizadas que han sido eliminadas o corregidas durante el periodo evaluado.", "Inventario/revisión de accesibilidad")),
      oe("ENV-OE8.2", "Mejorar la accesibilidad de los recursos y actividades comunitarias dirigidos o abiertos a las personas mayores.", indicator("ENV-I8.2", "% de recursos y actividades evaluados que cumplen los criterios de accesibilidad previamente establecidos.", "Inventario/revisión de accesibilidad"))),
    og("ENV-OG9", "Reducir las barreras digitales que limitan la autonomía y participación de las personas mayores",
      oe("ENV-OE9.1", "Mejorar las competencias digitales funcionales de las personas mayores con dificultades para utilizar servicios digitales.", indicator("ENV-I9.1", "% de participantes que mejoran su nivel de competencia en una prueba práctica de tareas digitales previamente definida.", "Prueba práctica/registro formativo")),
      oe("ENV-OE9.2", "Aumentar la autonomía de las personas mayores para realizar gestiones digitales esenciales.", indicator("ENV-I9.2", "% de participantes que, al finalizar la intervención, realizan autónomamente las gestiones digitales esenciales establecidas.", "Prueba práctica/registro formativo"))),
  ],
};

export const ADDICTIONS_MODULE: ActionPlanCatalogModule = {
  id: "adi-2027-2030",
  version: "3.1",
  title: "Prevención y abordaje de las adicciones",
  strategicObjective: "Reducir los factores de riesgo y las consecuencias asociadas a las adicciones, reforzando los factores de protección y la respuesta comunitaria.",
  sourceLabel: "I Plan Local de Salud del Distrito Zaidín 2027–2030 · arquitectura y fichas técnicas",
  sourceDate: "2026-08-26",
  cautions: sharedCautions,
  generalObjectives: [
    og("ADI-OG1", "Reforzar la capacidad preventiva de las familias",
      oe("ADI-OE1.1", "Mejorar las competencias de madres, padres y personas cuidadoras para prevenir conductas adictivas en menores.", indicator("ADI-I1.1", "% de participantes que mejoran sus competencias preventivas entre la evaluación inicial y final.", ADI_FAMILY)),
      oe("ADI-OE1.2", "Mejorar la capacidad de las familias para identificar precozmente situaciones de riesgo relacionadas con adicciones.", indicator("ADI-I1.2", "% de participantes que identifican correctamente las situaciones de riesgo definidas en la evaluación final.", ADI_FAMILY))),
    og("ADI-OG2", "Incrementar las alternativas protectoras de ocio",
      oe("ADI-OE2.1", "Aumentar la participación regular de adolescentes y jóvenes en alternativas de ocio saludable.", indicator("ADI-I2.1", "% de participantes que mantienen la frecuencia mínima establecida de participación en alternativas de ocio saludable.", ADI_LEISURE)),
      oe("ADI-OE2.2", "Aumentar la participación juvenil en el diseño y organización de alternativas de ocio saludable.", indicator("ADI-I2.2", "% de iniciativas de ocio en cuya planificación o desarrollo participan activamente adolescentes o jóvenes.", ADI_LEISURE))),
    og("ADI-OG3", "Reducir la normalización social de las adicciones y aumentar la percepción de riesgo",
      oe("ADI-OE3.1", "Aumentar la percepción de riesgo asociada a los consumos y conductas adictivas priorizados.", indicator("ADI-I3.1", "% de participantes que aumentan su percepción de riesgo entre la evaluación inicial y final.", ADI_PERCEPTION)),
      oe("ADI-OE3.2", "Reducir la aceptación o normalización social de los consumos y conductas adictivas priorizados.", indicator("ADI-I3.2", "% de participantes que reducen su nivel de aceptación o normalización entre la evaluación inicial y final.", ADI_PERCEPTION))),
    og("ADI-OG4", "Reducir la accesibilidad de menores a sustancias y actividades adictivas reguladas",
      oe("ADI-OE4.1", "Reducir el acceso de menores a alcohol, tabaco, nicotina y vapeadores en los ámbitos sometidos a control preventivo.", indicator("ADI-I4.1", "% de controles realizados en los que se detecta incumplimiento de la normativa de acceso o venta a menores.", ADI_CONTROL, "%", "descending")),
      oe("ADI-OE4.2", "Reducir el acceso de menores al juego con dinero en los ámbitos sometidos a control preventivo.", indicator("ADI-I4.2", "% de controles realizados en los que se detecta incumplimiento de las restricciones de acceso de menores al juego.", ADI_CONTROL, "%", "descending"))),
    og("ADI-OG5", "Mejorar la detección, orientación y vinculación con los recursos ante problemas de adicción",
      oe("ADI-OE5.1", "Aumentar la detección precoz de personas con consumos o conductas adictivas de riesgo en los recursos participantes.", indicator("ADI-I5.1", "% de población diana atendida a la que se aplica el procedimiento de detección establecido.", ADI_ACCESS)),
      oe("ADI-OE5.2", "Aumentar el acceso efectivo al recurso adecuado de las personas que requieren intervención.", indicator("ADI-I5.2", "% de personas derivadas de las que consta primer contacto o atención en el recurso receptor.", ADI_ACCESS))),
    og("ADI-OG6", "Fortalecer la calidad y coordinación de la prevención comunitaria",
      oe("ADI-OE6.1", "Aumentar la utilización de intervenciones preventivas con fundamento técnico o evidencia documentada.", indicator("ADI-I6.1", "% de intervenciones preventivas del Plan que cumplen los criterios técnicos previamente establecidos.", ADI_COORDINATION)),
      oe("ADI-OE6.2", "Aumentar la ejecución coordinada de intervenciones preventivas entre los agentes y entidades.", indicator("ADI-I6.2", "% de intervenciones preventivas del Plan desarrolladas conjuntamente por dos o más agentes o entidades.", ADI_COORDINATION))),
  ],
};

export const ACTION_PLAN_CATALOG = [HEALTHY_AGING_MODULE, ADDICTIONS_MODULE] as const;

export function getEligibleActionPlanModules(
  lectura: LecturaEstrategicaLocal,
  selection: DeliberativePrioritySelection
): EligibleActionPlanModule[] {
  if (selection.sourceLecturaId !== lectura.id) return [];
  const selectedIds = new Set(selection.selectedScenarioIds);
  const links = selection.catalogModuleLinks ?? [];
  return ACTION_PLAN_CATALOG.flatMap((module) => {
    const sourceScenarioIds = links
      .filter((link) => link.moduleId === module.id && selectedIds.has(link.scenarioId))
      .map((link) => link.scenarioId);
    return sourceScenarioIds.length > 0 ? [{ module, sourceScenarioIds }] : [];
  });
}

export function getCatalogElementIds(module: ActionPlanCatalogModule): string[] {
  return [
    module.id,
    ...module.generalObjectives.flatMap((general) => [
      general.code,
      ...general.specificObjectives.flatMap((specific) => [specific.code, specific.indicator.code]),
    ]),
  ];
}

export function createPendingModuleReview(
  municipalityId: string,
  eligible: EligibleActionPlanModule,
  lectura: LecturaEstrategicaLocal,
  selection: DeliberativePrioritySelection
): MunicipalActionPlanModuleReview {
  return {
    id: `module-review-${municipalityId}-${eligible.module.id}-${eligible.module.version}`,
    municipalityId,
    moduleId: eligible.module.id,
    moduleVersion: eligible.module.version,
    sourceLecturaId: lectura.id,
    sourcePrioritySelectionId: selection.id,
    sourceScenarioIds: [...eligible.sourceScenarioIds],
    decisions: getCatalogElementIds(eligible.module).map((elementId) => ({ elementId, status: "pending" })),
    reviewedBy: "",
    reviewedAt: "",
    requiresHumanValidation: true,
  };
}

export function validateModuleReview(
  review: MunicipalActionPlanModuleReview,
  module: ActionPlanCatalogModule
): readonly string[] {
  const validIds = new Set(getCatalogElementIds(module));
  const decisionIds = review.decisions.map((decision) => decision.elementId);
  const violations: string[] = [];
  if (decisionIds.length !== validIds.size || new Set(decisionIds).size !== validIds.size || decisionIds.some((id) => !validIds.has(id))) {
    violations.push("G-PCM-1: la revisión no cubre exactamente los elementos de la versión del módulo");
  }
  if (review.decisions.some((decision) => decision.status === "adapted" && !decision.adaptedText?.trim())) {
    violations.push("G-PCM-2: todo elemento adaptado debe conservar una redacción municipal explícita");
  }
  if (review.reviewedBy.trim().length === 0) {
    violations.push("G-PCM-3: debe identificarse al equipo o Grupo Motor que registra la revisión");
  }
  if (review.reviewedAt.trim().length === 0) {
    violations.push("G-PCM-4: la revisión debe conservar la fecha en que se registra");
  }
  return violations;
}

export function isModuleReviewStale(
  review: MunicipalActionPlanModuleReview,
  eligible: EligibleActionPlanModule,
  lectura: LecturaEstrategicaLocal,
  selection: DeliberativePrioritySelection
): boolean {
  return review.moduleId !== eligible.module.id ||
    review.moduleVersion !== eligible.module.version ||
    review.sourceLecturaId !== lectura.id ||
    review.sourcePrioritySelectionId !== selection.id ||
    review.sourceScenarioIds.length !== eligible.sourceScenarioIds.length ||
    review.sourceScenarioIds.some((id, index) => id !== eligible.sourceScenarioIds[index]);
}
