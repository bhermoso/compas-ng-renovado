/**
 * BEM 0.3 — propuesta NO ACTIVADA: correspondencia de los 17 objetivos
 * específicos de COMPÁS 0.2 con la arquitectura de PESMA-A y EPVSA.
 *
 * La estructura del PESMA-A separa objetivos estratégicos, objetivos de
 * programas e indicadores; no contiene una colección intercambiable de 17
 * "objetivos específicos municipales". Evitamos renumerar los oficiales
 * como si cada código BEM tuviera un equivalente literal.
 *
 * Ninguna entrada convierte una propuesta local en objetivo oficial ni
 * promociona automáticamente el Plan de Acción de un municipio.
 */
import {
  BEM_LEGACY_ALIGNMENT,
  BEM_OFFICIAL_INDICATORS,
  BEM_OFFICIAL_OBJECTIVES,
} from "./OfficialMentalHealthReferences";

export const BEM_OFFICIAL_REVISION_CANDIDATE_VERSION = "0.3-candidate" as const;
export type BemDisposition =
  | "referencia-oficial-con-indicador"
  | "desarrollo-local-complementario"
  | "reubicar-como-actuacion"
  | "requiere-decision-institucional";

export interface BemObjectiveReview {
  legacySpecificCode: string;
  officialObjectiveId: string;
  /** Indicador oficialmente trazado, si existe correspondencia temática. */
  officialIndicatorId?: string;
  disposition: BemDisposition;
  /** La misma herramienta no implica igualdad de población ni fórmula. */
  verification: string;
  /** Capacidad necesaria para reproducir/recoger el dato, no dato existente. */
  measurementRoute: string;
}

export const BEM_OBJECTIVE_REVIEW: readonly BemObjectiveReview[] = [
  {
    legacySpecificCode: "BEM-OE1.1", officialObjectiveId: "PESMA-OE01",
    officialIndicatorId: "PESMA-OE01-IBSE", disposition: "referencia-oficial-con-indicador",
    verification: "PESMA-A OE01, tabla p. 333: IBSE de Bericat de mayores de 16 años. El monitor local mixto no es la EAS.",
    measurementRoute: "Revisar cálculo original, restricciones de edad, diseño muestral, pesos, temporalidad y denominador antes de comparar."
  },
  {
    legacySpecificCode: "BEM-OE1.2", officialObjectiveId: "PESMA-OE01",
    disposition: "desarrollo-local-complementario",
    verification: "Diferencias de IBSE por sexo/edad: desagregación útil, pero no objetivo estratégico literal del PESMA.",
    measurementRoute: "IBSE por estratos con n y cobertura; no convertir la distancia entre medias en indicador oficial."
  },
  {
    legacySpecificCode: "BEM-OE1.3", officialObjectiveId: "PESMA-OE01",
    disposition: "desarrollo-local-complementario",
    verification: "Ítem tranquilidad/relajación del monitor: señal municipal, no indicador IBSE oficial de OE01.",
    measurementRoute: "Conservar distribución del ítem y periodo de recuerdo sin sustituir el índice oficial."
  },
  {
    legacySpecificCode: "BEM-OE2.1", officialObjectiveId: "EPVSA-OE1.4",
    disposition: "desarrollo-local-complementario",
    verification: "El ítem solo/a del IBSE no es un instrumento oficial homologado de soledad no deseada en estas fuentes.",
    measurementRoute: "Registrar medida local de soledad percibida y buscar protocolo de identificación específico, sin equipararlo al DUKE."
  },
  {
    legacySpecificCode: "BEM-OE2.2", officialObjectiveId: "EPVSA-OE1.4",
    officialIndicatorId: "EPVSA-1.4.5", disposition: "referencia-oficial-con-indicador",
    verification: "EPVSA 1.4.5.a, porcentaje de adultos con bajo apoyo social y afectivo. Coincidencia de herramienta DUKE pendiente de operacionalización.",
    measurementRoute: "DUKE-UNC-11 con punto de corte, ponderación y población 16+ de EAS; si se aplica localmente, documentar diferencias."
  },
  {
    legacySpecificCode: "BEM-OE3.1", officialObjectiveId: "PESMA-OE01",
    officialIndicatorId: "PESMA-P01.02-GEA-GRUBEA", disposition: "referencia-oficial-con-indicador",
    verification: "PESMA P.01.02 cuenta centros GEA/GRUBEA, no porcentaje de centros con cualquier educación emocional.",
    measurementRoute: "Registro acordado con Educación y servicios responsables de GEA/GRUBEA, recuento anual de centros únicos."
  },
  {
    legacySpecificCode: "BEM-OE3.2", officialObjectiveId: "PESMA-OE01",
    disposition: "reubicar-como-actuacion",
    verification: "PESMA P.01.02 contempla colaboración familiar; no se ha identificado indicador oficial equivalente al porcentaje pre/post de competencias.",
    measurementRoute: "Registro de programa familiar y herramienta validada, si se acuerda como evaluación local complementaria."
  },
  {
    legacySpecificCode: "BEM-OE3.3", officialObjectiveId: "EPVSA-OE1.6",
    officialIndicatorId: "EPVSA-1.6.3", disposition: "referencia-oficial-con-indicador",
    verification: "EPVSA 1.6.3.a usa población de 8 a 15 años, más de dos horas diarias de aparatos electrónicos; no extrapolar de otras edades.",
    measurementRoute: "Encuesta Andaluza de Salud o cuestionario local comparable con las mismas preguntas y denominador."
  },
  {
    legacySpecificCode: "BEM-OE4.1", officialObjectiveId: "EPVSA-OE1.7",
    disposition: "desarrollo-local-complementario",
    verification: "Inventario de activos etiquetados bienestar emocional ≠ recomendaciones de activos desde el SSPA (1.7.1.a).",
    measurementRoute: "Localiza Salud: ID de recurso, actividad, estado de validación, vigencia y temática; deduplicar entidades sin borrar actividades."
  },
  {
    legacySpecificCode: "BEM-OE4.2", officialObjectiveId: "EPVSA-OE1.7",
    officialIndicatorId: "EPVSA-1.7.1", disposition: "referencia-oficial-con-indicador",
    verification: "Separar la medida oficial SSPA de las recomendaciones realizadas por servicios sociales, educativos o comunitarios.",
    measurementRoute: "Registro con emisor y sector, fecha, recurso recomendado e identificador no personal; indicador oficial calculado solo para SSPA."
  },
  {
    legacySpecificCode: "BEM-OE4.3", officialObjectiveId: "EPVSA-OE1.7",
    disposition: "desarrollo-local-complementario",
    verification: "La oferta para grupos sin recursos registrados es una necesidad territorial; no hay indicador oficial equivalente identificado.",
    measurementRoute: "Cruzar mapa de activos con necesidades del Perfil por grupos y validación comunitaria; no inferir ausencia real solo por el registro."
  },
  {
    legacySpecificCode: "BEM-OE5.1", officialObjectiveId: "PESMA-OE02",
    disposition: "reubicar-como-actuacion",
    verification: "La formación de agentes comunitarios se vincula a PESMA P.02.CT02, pero aplicar un procedimiento local no es el indicador estratégico OE02.",
    measurementRoute: "Registro formativo y protocolo de orientación acordado; evaluar cobertura sin computar diagnósticos clínicos."
  },
  {
    legacySpecificCode: "BEM-OE5.2", officialObjectiveId: "PESMA-OE05",
    disposition: "requiere-decision-institucional",
    verification: "La incorporación a GRAFA/GRUSE requiere participación de Atención Primaria y protección de datos; no es indicador oficial PESMA OE05.",
    measurementRoute: "Acuerdo interinstitucional y agregados anónimos del circuito comunitario; no tratar derivación individual como dato libre de COMPÁS."
  },
  {
    legacySpecificCode: "BEM-OE6.1", officialObjectiveId: "PESMA-OE04",
    disposition: "reubicar-como-actuacion",
    verification: "PESMA P.04.01 incluye formación y prevención comunitaria; el número de agentes locales formados no equivale a tasas de intentos ni seguimiento.",
    measurementRoute: "Registro de formación, alcance y capacidades; indicadores asistenciales únicamente desde fuentes sanitarias oficiales."
  },
  {
    legacySpecificCode: "BEM-OE6.2", officialObjectiveId: "PESMA-OE04",
    disposition: "reubicar-como-actuacion",
    verification: "La difusión de recursos de ayuda es una actuación; el porcentaje de equipamientos con información 024 es indicador municipal propio.",
    measurementRoute: "Auditoría verificable de equipamientos, fecha y reposición de información; sin atribuir efecto causal en suicidios."
  },
  {
    legacySpecificCode: "BEM-OE7.1", officialObjectiveId: "PESMA-OE10",
    disposition: "desarrollo-local-complementario",
    verification: "OE10 aborda inclusión y reducción del estigma; una escala pre/post requiere validar instrumento y diseño de evaluación.",
    measurementRoute: "Herramienta de actitudes válida con consentimiento y evaluación; distinguir actividades de cambios en población."
  },
  {
    legacySpecificCode: "BEM-OE7.2", officialObjectiveId: "PESMA-OE10",
    disposition: "desarrollo-local-complementario",
    verification: "PESMA OE10 promueve participación e inclusión; el recuento de iniciativas con personas expertas por experiencia es local.",
    measurementRoute: "Registro de participación voluntaria en diseño/ejecución de iniciativas, minimizando datos personales."
  },
] as const;

export const BEM_OFFICIAL_GROUPING = [
  { id: "salud-emocional", officialObjectiveIds: ["PESMA-OE01", "EPVSA-OE1.4"], description: "Bienestar emocional y calidad de vida" },
  { id: "comunidad-activos", officialObjectiveIds: ["EPVSA-OE1.7", "PESMA-OE05"], description: "Promoción comunitaria y activos" },
  { id: "educacion-familias", officialObjectiveIds: ["PESMA-OE01", "EPVSA-OE1.6"], description: "Entornos educativos y familiares" },
  { id: "deteccion-coordinacion", officialObjectiveIds: ["PESMA-OE02", "PESMA-OE05"], description: "Detección y coordinación, competencias compartidas" },
  { id: "prevencion-suicidio", officialObjectiveIds: ["PESMA-OE04"], description: "Prevención y derivación según competencias" },
  { id: "derechos-participacion", officialObjectiveIds: ["PESMA-OE10"], description: "Estigma, participación e inclusión" },
] as const;

/**
 * Condición explícita antes de activar el nuevo módulo: las cuatro tareas son
 * necesarias. El 0.3-candidate no debe mostrarse como catálogo vigente.
 */
export const BEM_OFFICIAL_ACTIVATION_GATES = [
  "Contrastar objetivos e indicadores de programa que se incorporarán como oficiales, con texto, código y ubicación de fuente.",
  "Revisar viabilidad y responsabilidad local de cada objetivo/indicador sin atribuir asistencia clínica al municipio.",
  "Acordar correspondencia de IDs y migración no destructiva de versiones 0.2, borradores y fichas de indicadores.",
  "Ejecutar pruebas y aprobación del catálogo 0.3 por revisión técnica y Grupo Motor; sin validación automática."
] as const;

/** Comprueba la correspondencia documental y deja explícito el estado no activado. */
export function auditBemCandidateCompleteness() {
  const objectiveIds = new Set(BEM_OFFICIAL_OBJECTIVES.map(x => x.id));
  const indicatorIds = new Set(BEM_OFFICIAL_INDICATORS.map(x => x.id));
  const legacyIndicators = new Set(Object.keys(BEM_LEGACY_ALIGNMENT));
  const mappedObjectives = new Set(BEM_OBJECTIVE_REVIEW.map(x => x.legacySpecificCode));
  return {
    version: BEM_OFFICIAL_REVISION_CANDIDATE_VERSION,
    mappedSpecificObjectives: BEM_OBJECTIVE_REVIEW.length,
    mappedLegacyIndicators: legacyIndicators.size,
    uniqueSpecificObjectives: mappedObjectives.size === BEM_OBJECTIVE_REVIEW.length,
    knownOfficialReferences: BEM_OBJECTIVE_REVIEW.every(x =>
      objectiveIds.has(x.officialObjectiveId) && (!x.officialIndicatorId || indicatorIds.has(x.officialIndicatorId))),
    activationAllowed: false as const,
  };
}
