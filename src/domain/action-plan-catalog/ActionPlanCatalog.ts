import type { DeliberativePrioritySelection } from "../deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../strategic-scenario";

export type CatalogDecisionStatus = "pending" | "accepted" | "adapted" | "rejected";

/**
 * Procedencia de un elemento del catálogo. «literal»: reproduce un objetivo o
 * indicador oficial; «adaptado»: parte de un objetivo o programa concreto con
 * redacción de COMPÁS; «propio»: redacción de COMPÁS sin texto oficial equivalente.
 */
export interface CatalogElementProvenance {
  kind: "literal" | "adaptado" | "propio";
  source: string;
}

export interface CatalogIndicatorTemplate {
  code: string;
  /** Visible notation; code remains the persistent identifier. */
  displayCode?: string;
  title: string;
  unit: "%" | "Nº" | "Puntos";
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
  provenance?: CatalogElementProvenance;
}

export interface CatalogSpecificObjectiveTemplate {
  code: string;
  /** Código editorial mostrado en el Plan territorial; el código canónico se conserva en `code`. */
  displayCode?: string;
  title: string;
  indicator: CatalogIndicatorTemplate;
  provenance?: CatalogElementProvenance;
}

export interface CatalogGeneralObjectiveTemplate {
  code: string;
  displayCode?: string;
  /** Editorial label scoped to this module version, never inferred from a reused code. */
  thematicBlockName?: string;
  title: string;
  specificObjectives: readonly CatalogSpecificObjectiveTemplate[];
  provenance?: CatalogElementProvenance;
}

export interface ActionPlanCatalogModule {
  id: string;
  version: string;
  title: string;
  strategicObjective: string;
  strategicObjectiveDisplayCode?: string;
  strategicObjectiveProvenance?: CatalogElementProvenance;
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
  unit: "%" | "Nº" | "Puntos" = "%",
  direction: "ascending" | "descending" = "ascending",
  overrides: Partial<Omit<CatalogIndicatorTemplate, "code" | "title" | "unit" | "suggestedSource" | "direction">> = {}
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
    ...overrides,
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


const BEM_IBSE = "Monitor municipal de bienestar socioemocional (IBSE, Bericat 2014), escala común 0–100";
const BEM_EAS = "Encuesta Andaluza de Salud (referencia no local) o estudio municipal con el mismo instrumento";
const BEM_EDU = "Registro del Plan con los centros educativos";
const BEM_FAMILY = "Evaluación pre/post de competencias familiares";
const BEM_ASSETS = "Localiza Salud y registro de activos del Plan";
const BEM_LINK = "Registro de orientación y derivación del Plan";
const BEM_TRAINING = "Registro formativo del Plan";
const BEM_ATTITUDES = "Cuestionario pre/post de actitudes";

const IBSE_POPULATION_INDICATOR = {
  operationalDefinition:
    "Media de la puntuación del Índice de Bienestar Socioemocional (IBSE) de las personas participantes en el monitor municipal. Cada pregunta se lleva a una escala 0–100 en la que más es mejor; cada factor es la media de sus dos preguntas y el índice, la media de los cuatro factores.",
  calculationMethod:
    "Suma de las puntuaciones IBSE de los registros válidos (ocho preguntas contestadas) / nº de registros válidos. Se informa también la media reponderada por edad y sexo con el padrón, separada de la observada.",
  disaggregation: "Estrato de edad, analizado por separado: menores de 16 y 16 o más; dentro de cada estrato, sexo y grupos de edad (13–15, 16–24, 25–44, 45–64 y 65 o más); factores Vínculo, Situación, Control y Persona.",
  baseline: "Primer monitor municipal con el instrumento, la escala común y el procedimiento de recogida que se mantendrán en las mediciones siguientes.",
  qualityCriterion: "Mismo instrumento, escala y procedimiento en cada medición; declarar modo de respuesta, periodo y composición de la muestra (SAM).",
  limitation: "Con muestra voluntaria no estima la media de la población. Solo es comparable con mediciones que usen el mismo procedimiento; no con encuestas de otro modo de administración sin declararlo.",
} as const;

const BEM_EMOTIONAL_WELLBEING_BASE: ActionPlanCatalogModule = {
  id: "bem-2027-2030",
  version: "0.2",
  title: "Bienestar emocional y salud mental",
  strategicObjective: "Mejorar el bienestar emocional de la población y prevenir los problemas de salud mental, fortaleciendo los factores que lo protegen —vínculos, competencias personales, participación, entornos y activos comunitarios— y reduciendo las diferencias de bienestar entre grupos de población.",
  sourceLabel: "Propuesta COMPÁS a partir del I Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029 (líneas 1, 2 y 5), la Estrategia de Promoción de una Vida Saludable en Andalucía (objetivos 1.4, 1.6 y 1.7), la Estrategia de Salud Mental del SNS 2022–2026 (líneas 2, 3 y 8) y el Monitor de bienestar socioemocional de Atarfe 2026. Cada objetivo e indicador declara su procedencia (literal, adaptada o propia)",
  sourceDate: "2026-11-10",
  cautions: [
    "Línea en construcción (versión 0.2): propuesta para revisión técnica y deliberación del Grupo Motor; no es un módulo validado.",
    "La línea se orienta a la promoción del bienestar emocional y a la prevención desde el ámbito local. La atención clínica es competencia del Sistema Sanitario Público de Andalucía; el Plan local coordina y no la sustituye.",
    "Los indicadores de bienestar de población solo son comparables entre mediciones con el mismo instrumento, escala y procedimiento de recogida.",
    ...sharedCautions,
  ],
  generalObjectives: [
    og("BEM-OG1", "Mejorar el bienestar socioemocional de la población y reducir sus desigualdades",
      oe("BEM-OE1.1", "Aumentar el bienestar socioemocional de la población del municipio.", indicator("BEM-I1.1", "Puntuación media del IBSE (0–100) en el monitor municipal.", BEM_IBSE, "Puntos", "ascending", IBSE_POPULATION_INDICATOR)),
      oe("BEM-OE1.2", "Reducir las diferencias de bienestar socioemocional entre mujeres y hombres y entre grupos de edad.", indicator("BEM-I1.2", "Diferencia, en puntos, entre la media del IBSE de mujeres y hombres y entre el grupo de edad con media más alta y el de media más baja.", BEM_IBSE, "Puntos", "descending", { ...IBSE_POPULATION_INDICATOR, operationalDefinition: "Valor absoluto de la diferencia entre medias IBSE (0–100) de mujeres y hombres, y entre el grupo de edad de media más alta y el de media más baja, con los mismos grupos en cada medición.", calculationMethod: "|media mujeres − media hombres|; |media del grupo de edad más alta − media del grupo más baja|. Se informan por separado." })),
      oe("BEM-OE1.3", "Aumentar la proporción de población que se siente tranquila y relajada.", indicator("BEM-I1.3", "% de participantes en el monitor que se sintieron tranquilos/as y relajados/as buena parte del tiempo o casi siempre durante la última semana.", BEM_IBSE, "%", "ascending", { ...IBSE_POPULATION_INDICATOR, operationalDefinition: "Respuestas 3 («buena parte del tiempo») o 4 («todo o casi todo el tiempo») a la pregunta «tranquilo/a y relajado/a» del IBSE.", calculationMethod: "(nº de registros válidos con respuesta 3 o 4 / nº de registros válidos) × 100." }))),
    og("BEM-OG2", "Fortalecer los vínculos y prevenir la soledad no deseada",
      oe("BEM-OE2.1", "Reducir la proporción de población que se siente sola con frecuencia.", indicator("BEM-I2.1", "% de participantes en el monitor que se sintieron solos/as buena parte del tiempo o casi siempre durante la última semana.", BEM_IBSE, "%", "descending", { ...IBSE_POPULATION_INDICATOR, operationalDefinition: "Respuestas 3 o 4 a la pregunta «solo/a» del IBSE.", calculationMethod: "(nº de registros válidos con respuesta 3 o 4 / nº de registros válidos) × 100." })),
      oe("BEM-OE2.2", "Mejorar el apoyo social percibido de las personas con apoyo bajo.", indicator("BEM-I2.2", "% de población adulta que percibe como bajo su apoyo social y afectivo (Duke-UNC-11).", BEM_EAS, "%", "descending"))),
    og("BEM-OG3", "Desarrollar competencias para el bienestar emocional a lo largo de la vida",
      oe("BEM-OE3.1", "Desarrollar las competencias socioemocionales de la infancia y la adolescencia en los centros educativos.", indicator("BEM-I3.1", "% de centros educativos del municipio que desarrollan un programa de educación emocional con fundamento técnico documentado.", BEM_EDU)),
      oe("BEM-OE3.2", "Mejorar las competencias de las familias para cuidar el bienestar emocional de hijas e hijos.", indicator("BEM-I3.2", "% de participantes que mejoran sus competencias entre la evaluación inicial y la final.", BEM_FAMILY)),
      oe("BEM-OE3.3", "Reducir el tiempo de pantallas que desplaza la relación con familiares y amistades en la infancia y la adolescencia.", indicator("BEM-I3.3", "% de población de 8 a 15 años que usa más de dos horas al día aparatos electrónicos.", BEM_EAS, "%", "descending"))),
    og("BEM-OG4", "Reforzar los entornos y los activos comunitarios que sostienen el bienestar emocional",
      oe("BEM-OE4.1", "Aumentar los activos para la salud validados que se relacionan con el bienestar emocional.", indicator("BEM-I4.1", "Nº de activos para la salud del municipio validados en Localiza Salud con la temática «Bienestar emocional».", BEM_ASSETS, "Nº")),
      oe("BEM-OE4.2", "Aumentar la recomendación de activos comunitarios desde los servicios sanitarios, sociales y educativos.", indicator("BEM-I4.2", "Nº de recomendaciones de activos comunitarios registradas por los servicios participantes.", BEM_LINK, "Nº")),
      oe("BEM-OE4.3", "Ampliar la oferta comunitaria para los grupos de población que el Perfil identifica sin recursos registrados.", indicator("BEM-I4.3", "Nº de activos validados dirigidos a los grupos de población sin recursos registrados en el Perfil de Salud Local.", BEM_ASSETS, "Nº"))),
    og("BEM-OG5", "Mejorar la detección temprana del malestar emocional y la continuidad entre comunidad y servicios",
      oe("BEM-OE5.1", "Aumentar la capacidad de los agentes comunitarios para reconocer el malestar emocional y orientar hacia el recurso adecuado.", indicator("BEM-I5.1", "% de agentes comunitarios formados que aplican el procedimiento de orientación acordado durante el periodo evaluado.", BEM_TRAINING)),
      oe("BEM-OE5.2", "Aumentar el acceso a las intervenciones grupales de atención primaria de las personas orientadas desde la comunidad.", indicator("BEM-I5.2", "% de personas orientadas desde la comunidad a las intervenciones grupales de atención primaria de las que consta su incorporación al grupo.", BEM_LINK))),
    og("BEM-OG6", "Prevenir la conducta suicida desde la comunidad",
      oe("BEM-OE6.1", "Aumentar el número de personas de la comunidad capacitadas para identificar señales de riesgo y orientar.", indicator("BEM-I6.1", "Nº de personas capacitadas como agentes comunitarios de prevención de la conducta suicida.", BEM_TRAINING, "Nº")),
      oe("BEM-OE6.2", "Aumentar la difusión de los recursos de ayuda ante la conducta suicida en los espacios comunitarios.", indicator("BEM-I6.2", "% de espacios y equipamientos comunitarios del Plan que muestran información de la línea 024 y de los recursos locales de ayuda.", BEM_ASSETS))),
    og("BEM-OG7", "Reducir el estigma y favorecer la participación de las personas con problemas de salud mental",
      oe("BEM-OE7.1", "Reducir las actitudes estigmatizantes hacia los problemas de salud mental en las personas participantes en acciones de sensibilización.", indicator("BEM-I7.1", "% de participantes que reducen sus actitudes estigmatizantes entre la evaluación inicial y la final.", BEM_ATTITUDES)),
      oe("BEM-OE7.2", "Aumentar la participación de personas con experiencia propia en salud mental en las iniciativas comunitarias del Plan.", indicator("BEM-I7.2", "% de iniciativas comunitarias del Plan en cuyo diseño o desarrollo participan personas con experiencia propia en salud mental.", BEM_LINK))),
  ],
};

// Procedencia de cada elemento de la línea, contrastada con los textos fuente el 10/11/2026.
// PESMA-A: I Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029.
// EPVSA: Estrategia de Promoción de una Vida Saludable en Andalucía (líneas e indicadores, 02/04/2024).
// SNS: Estrategia de Salud Mental del Sistema Nacional de Salud 2022–2026.
const lit = (source: string): CatalogElementProvenance => ({ kind: "literal", source });
const ada = (source: string): CatalogElementProvenance => ({ kind: "adaptado", source });
const pro = (source: string): CatalogElementProvenance => ({ kind: "propio", source });
export const BEM_PROVENANCE: Readonly<Record<string, CatalogElementProvenance>> = {
  "bem-2027-2030": ada("PESMA-A, OE01 «Aumentar el bienestar emocional de la población andaluza»; SNS, objetivos 2.1 y 2.2. La enumeración de factores protectores es de COMPÁS."),
  "BEM-OG1": ada("PESMA-A, OE01; EPVSA, OE 1.4 «Incrementar la percepción de calidad de vida y de bienestar emocional». La reducción de desigualdades es añadido de COMPÁS."),
  "BEM-OE1.1": ada("PESMA-A, OE01; EPVSA, OE 1.4."),
  "BEM-I1.1": pro("Monitor municipal de bienestar socioemocional (IBSE, Bericat 2014). La EPVSA mide el OE 1.4 con SF-12, Kidscreen y felicidad declarada, no con el IBSE."),
  "BEM-OE1.2": pro("Hallazgos del Perfil de Salud Local de Atarfe (C3 y C4); sin objetivo equivalente en las estrategias de referencia."),
  "BEM-I1.2": pro("Monitor municipal de bienestar socioemocional (IBSE)."),
  "BEM-OE1.3": pro("Hallazgo del Monitor de Atarfe 2026: Control (energía y tranquilidad) es el factor más bajo."),
  "BEM-I1.3": pro("Pregunta «tranquilo/a y relajado/a» del IBSE."),
  "BEM-OG2": ada("EPVSA, indicador 1.4.5 (apoyo social y afectivo); SNS, objetivo 2.2.4 («capital social»). La EPVSA no nombra la soledad no deseada."),
  "BEM-OE2.1": pro("Hallazgo del Perfil de Salud Local de Atarfe (C5)."),
  "BEM-I2.1": pro("Pregunta «solo/a» del IBSE."),
  "BEM-OE2.2": ada("EPVSA, OE 1.4, indicador de impacto 1.4.5: «Disminución del porcentaje de población adulta que considera bajo su apoyo social y afectivo»."),
  "BEM-I2.2": lit("EPVSA, indicador 1.4.5: «Porcentaje de población adulta que percibe como bajo su apoyo social y afectivo» (Encuesta Andaluza de Salud, Duke-UNC-11)."),
  "BEM-OG3": ada("PESMA-A, programa P.01.02 de promoción del bienestar emocional en los ámbitos familiar y escolar; SNS, objetivo 2.2.6 (programas en centros escolares)."),
  "BEM-OE3.1": ada("PESMA-A, programa P.01.02 (educación emocional; programa GEA en centros)."),
  "BEM-I3.1": ada("PESMA-A, P.01.02, indicador «Número de centros escolares en los que se implanta el Programa de Gestión Emocional para Adolescentes (GEA)»; COMPÁS lo expresa como porcentaje y lo abre a cualquier programa con fundamento técnico."),
  "BEM-OE3.2": ada("PESMA-A, programas P.01.02 (colaboración de las familias) y P.02.01 (grupos de familias)."),
  "BEM-I3.2": pro("Evaluación antes y después; sin indicador equivalente en las fuentes."),
  "BEM-OE3.3": ada("EPVSA, OE 1.6: «Disminuir el tiempo dedicado al uso de aparatos electrónicos, en detrimento del tiempo dedicado a familiares y amistades»; COMPÁS lo limita a la infancia y la adolescencia, como su indicador."),
  "BEM-I3.3": lit("EPVSA, indicador 1.6.3: «Porcentaje de población infantil de entre 8-15 años que usa más de dos horas al día aparatos electrónicos» (Encuesta Andaluza de Salud)."),
  "BEM-OG4": ada("EPVSA, OE 1.7 y programa P04 de identificación y dinamización de activos para la salud; PESMA-A, P.09.02 («activos de la comunidad»)."),
  "BEM-OE4.1": ada("EPVSA, programa P04."),
  "BEM-I4.1": ada("EPVSA, P04: «Número acumulativo de activos registrados y validados en el mapa de activos para la salud de Andalucía»; COMPÁS lo limita a la temática de bienestar emocional."),
  "BEM-OE4.2": ada("EPVSA, OE 1.7: «Incrementar las recomendaciones a la ciudadanía sobre activos comunitarios que facilitan una vida saludable»."),
  "BEM-I4.2": ada("EPVSA, indicador 1.7.1 (recomendaciones desde el SSPA); COMPÁS lo extiende a servicios sociales y educativos. La EPVSA declara que el SSPA aún no dispone de herramienta para contarlas."),
  "BEM-OE4.3": pro("Hallazgo del Perfil de Salud Local de Atarfe (C7)."),
  "BEM-I4.3": pro("Registro de activos del Plan."),
  "BEM-OG5": ada("PESMA-A, OE02 «Mejorar la detección y atención precoz de las personas con problemas de adicciones y/o salud mental» y OE05 (coordinación entre salud mental, adicciones y atención primaria); SNS, objetivo 2.2.5."),
  "BEM-OE5.1": pro("Inspirado en PESMA-A, OE02 y programa P.02.CT02 (formación del personal técnico de juventud)."),
  "BEM-I5.1": pro("Registro formativo del Plan."),
  "BEM-OE5.2": pro("Intervenciones grupales de atención primaria existentes en Atarfe (GRAFA, GRUSE); PESMA-A, OE05."),
  "BEM-I5.2": pro("Registro de orientación del Plan."),
  "BEM-OG6": ada("PESMA-A, OE04 «Disminuir las conductas suicidas y su impacto social»; SNS, línea 3."),
  "BEM-OE6.1": ada("SNS, objetivo 3.1.2 «Detectar precozmente y prevenir el riesgo suicida»; PESMA-A, P.04.01 (fomentar la formación sobre la conducta suicida)."),
  "BEM-I6.1": pro("Registro formativo del Plan."),
  "BEM-OE6.2": ada("SNS, objetivos 3.1.1 (sensibilizar e informar a la población) y 3.2.6 (red de atención telefónica)."),
  "BEM-I6.2": pro("Recursos de ayuda locales y línea 024; sin indicador equivalente en las fuentes."),
  "BEM-OG7": ada("SNS, objetivo 8.2 «Incorporar a las personas con experiencia propia en problemas de salud mental como agentes activos de salud»; PESMA-A, línea 5 (P.09.02, estigma; «personas expertas por experiencia»)."),
  "BEM-OE7.1": ada("PESMA-A, P.09.02; SNS, objetivos contra el estigma."),
  "BEM-I7.1": pro("Cuestionario de actitudes antes y después; sin indicador equivalente en las fuentes."),
  "BEM-OE7.2": ada("SNS, objetivo 8.2.1 «Establecer mecanismos de participación efectiva en el diseño, planificación y evaluación de los servicios»."),
  "BEM-I7.2": pro("Registro de iniciativas del Plan."),
};

function withProvenance(module: ActionPlanCatalogModule, map: Readonly<Record<string, CatalogElementProvenance>>): ActionPlanCatalogModule {
  return {
    ...module,
    strategicObjectiveProvenance: map[module.id],
    generalObjectives: module.generalObjectives.map((g) => ({
      ...g,
      provenance: map[g.code],
      specificObjectives: g.specificObjectives.map((s) => ({
        ...s,
        provenance: map[s.code],
        indicator: { ...s.indicator, provenance: map[s.indicator.code] },
      })),
    })),
  };
}

export const EMOTIONAL_WELLBEING_MODULE: ActionPlanCatalogModule = withProvenance(BEM_EMOTIONAL_WELLBEING_BASE, BEM_PROVENANCE);

export const ACTION_PLAN_CATALOG = [HEALTHY_AGING_MODULE, ADDICTIONS_MODULE, EMOTIONAL_WELLBEING_MODULE] as const;

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
