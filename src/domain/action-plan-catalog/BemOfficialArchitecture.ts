/**
 * Arquitectura oficial candidata de la línea Bienestar emocional y salud mental.
 *
 * NO es un ActionPlanCatalogModule operativo ni reemplaza BEM 0.2.
 * Selecciona objetivos estratégicos oficiales con su código y título ORIGINAL,
 * y los relaciona con programas, indicadores, competencias y fuentes de datos.
 * No convierte una contribución municipal en responsabilidad sanitaria.
 *
 * PESMA-A: Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029.
 * EPVSA: Estrategia de Promoción de una Vida Saludable en Andalucía 2024–2030.
 */
import {
  BEM_OFFICIAL_INDICATORS,
  BEM_OFFICIAL_OBJECTIVES,
} from "./OfficialMentalHealthReferences";
import { BEM_OBJECTIVE_REVIEW } from "./BemOfficialRevisionCandidate";

export const BEM_OFFICIAL_ARCHITECTURE_VERSION = "0.3-candidate" as const;
export type BemOfficialScope = "eje-pesma" | "referencia-epvsa";
export type BemMunicipalRole =
  | "promocion-comunitaria"
  | "coordinacion-intersectorial"
  | "participacion-comunitaria"
  | "contribucion-sin-competencia-clinica";
export type BemMeasurementState =
  | "instrumento-existente-revisar-equivalencia"
  | "registro-institucional-por-acordar"
  | "fuente-oficial-no-municipal"
  | "sin-equivalente-homologado";

export interface BemOfficialAxis {
  officialObjectiveId: string;
  scope: BemOfficialScope;
  /** No modifica ni reproduce el texto oficial: se lee de la biblioteca canónica. */
  linkedProgramCodes: readonly string[];
  localRole: BemMunicipalRole;
  /** IDs de indicadores oficiales: ninguno se presume disponible localmente. */
  officialIndicatorIds: readonly string[];
  dataReadiness: BemMeasurementState;
  /** Invariantes y cautelas de ámbito local; no son objetivos oficiales. */
  note: string;
}

/**
 * Cinco objetivos estratégicos del PESMA-A como ejes y tres referencias EPVSA.
 * Conservamos los códigos institucionales: NO hay "BEM-OG1" nuevo ni
 * trasvase silencioso de los 7 objetivos generales del módulo anterior.
 */
export const BEM_OFFICIAL_AXES: readonly BemOfficialAxis[] = [
  {
    officialObjectiveId: "PESMA-OE01",
    scope: "eje-pesma",
    linkedProgramCodes: ["P.01.02"],
    localRole: "promocion-comunitaria",
    officialIndicatorIds: ["PESMA-OE01-IBSE", "PESMA-OE01-KIDSCREEN", "PESMA-P01.02-GEA-GRUBEA"],
    dataReadiness: "instrumento-existente-revisar-equivalencia",
    note: "El monitor IBSE de Atarfe no sustituye la Encuesta Andaluza de Salud. Requiere cálculo y estratos de edad compatibles. Los programas escolares se cuentan mediante registro acordado."
  },
  {
    officialObjectiveId: "PESMA-OE02",
    scope: "eje-pesma",
    linkedProgramCodes: ["P.02.CT02"],
    localRole: "contribucion-sin-competencia-clinica",
    officialIndicatorIds: [],
    dataReadiness: "registro-institucional-por-acordar",
    note: "La formación comunitaria contribuye a la orientación y prevención; detección clínica y acceso asistencial son competencias sanitarias."
  },
  {
    officialObjectiveId: "PESMA-OE04",
    scope: "eje-pesma",
    linkedProgramCodes: ["P.04.01"],
    localRole: "contribucion-sin-competencia-clinica",
    officialIndicatorIds: [],
    dataReadiness: "registro-institucional-por-acordar",
    note: "Se pueden registrar actuaciones de sensibilización y formación; no inferir reducción del suicidio a partir de recuentos municipales."
  },
  {
    officialObjectiveId: "PESMA-OE05",
    scope: "eje-pesma",
    linkedProgramCodes: ["P.05.02"],
    localRole: "coordinacion-intersectorial",
    officialIndicatorIds: [],
    dataReadiness: "registro-institucional-por-acordar",
    note: "Requiere acuerdos con Atención Primaria, Salud Mental y recursos comunitarios. No recoger información clínica nominal en el Plan Local."
  },
  {
    officialObjectiveId: "PESMA-OE10",
    scope: "eje-pesma",
    linkedProgramCodes: ["P.10.01", "P.10.05"],
    localRole: "participacion-comunitaria",
    officialIndicatorIds: [],
    dataReadiness: "sin-equivalente-homologado",
    note: "Sensibilización, lucha contra el estigma, inclusión y participación con personas expertas por experiencia; los porcentajes locales no son automáticamente indicadores oficiales de OE10."
  },
  {
    officialObjectiveId: "EPVSA-OE1.4",
    scope: "referencia-epvsa",
    linkedProgramCodes: [],
    localRole: "promocion-comunitaria",
    officialIndicatorIds: ["EPVSA-1.4.3", "EPVSA-1.4.5"],
    dataReadiness: "fuente-oficial-no-municipal",
    note: "SF-12 y Duke-UNC-11 con metodología, población y puntos de corte de la EAS; no inferir series municipales de datos autonómicos."
  },
  {
    officialObjectiveId: "EPVSA-OE1.6",
    scope: "referencia-epvsa",
    linkedProgramCodes: [],
    localRole: "promocion-comunitaria",
    officialIndicatorIds: ["EPVSA-1.6.3"],
    dataReadiness: "fuente-oficial-no-municipal",
    note: "Referencia transversal a uso de pantallas en infancia de 8–15 años; no confundir con indicador general de salud mental."
  },
  {
    officialObjectiveId: "EPVSA-OE1.7",
    scope: "referencia-epvsa",
    linkedProgramCodes: [],
    localRole: "coordinacion-intersectorial",
    officialIndicatorIds: ["EPVSA-1.7.1"],
    dataReadiness: "registro-institucional-por-acordar",
    note: "Recomendaciones de activos desde el SSPA; no confundir con número de activos existentes en Localiza Salud ni sumar automáticamente recomendaciones de otros agentes."
  },
] as const;

export const BEM_OFFICIAL_REVIEW_RULES = {
  previousModuleVersion: "0.2",
  candidateVersion: BEM_OFFICIAL_ARCHITECTURE_VERSION,
  retainPreviousDrafts: true,
  retainIndicatorWorksheets: true,
  requireExplicitSelection: true,
  requireHumanValidation: true,
  preserveOfficialCodes: true,
  preserveOriginals: true,
  autoPromote: false,
  /** Los cinco ejes PESMA no heredan automáticamente las decisiones de los siete OG COMPÁS. */
  inheritMunicipalDecisions: false,
} as const;

/** La lectura oficial se separa del vínculo local; nunca reescribir el título. */
export function listBemOfficialArchitecture() {
  const objectiveById = new Map(BEM_OFFICIAL_OBJECTIVES.map(o => [o.id, o]));
  const indicatorById = new Map(BEM_OFFICIAL_INDICATORS.map(i => [i.id, i]));
  return BEM_OFFICIAL_AXES.map(axis => ({
    ...axis,
    objective: objectiveById.get(axis.officialObjectiveId)!,
    indicators: axis.officialIndicatorIds.map(id => indicatorById.get(id)!),
    relatedLegacySpecificCodes: BEM_OBJECTIVE_REVIEW
      .filter(r => r.officialObjectiveId === axis.officialObjectiveId)
      .map(r => r.legacySpecificCode),
  }));
}

export function auditBemOfficialArchitecture() {
  const axes = listBemOfficialArchitecture();
  const unique = new Set(axes.map(x => x.officialObjectiveId)).size === axes.length;
  const allMapped = axes.every(x =>
    Boolean(x.objective)
    && x.indicators.every(i => Boolean(i) && i.objectiveId === x.officialObjectiveId)
  );
  return {
    version: BEM_OFFICIAL_ARCHITECTURE_VERSION,
    primaryObjectives: axes.filter(x => x.scope === "eje-pesma").length,
    complementaryObjectives: axes.filter(x => x.scope === "referencia-epvsa").length,
    unique, allMapped, automaticActivationAllowed: false as const,
  };
}
