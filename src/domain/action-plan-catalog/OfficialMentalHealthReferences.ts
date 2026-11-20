/**
 * Fuentes normativas para una futura revisión de la línea BEM.
 * No altera el catálogo 0.2 ni los borradores y decisiones municipales guardados.
 *
 * Solo "literal" acredita identidad textual y metodológica, no equivalencia
 * entre una muestra municipal y la Encuesta Andaluza de Salud.
 * Referencias consultadas en ediciones oficiales, 20-11-2026.
 */
export interface OfficialObjectiveReference {
  id: string;
  document: "PESMA-A 2026–2029" | "EPVSA 2024–2030";
  title: string;
  level: "estratégico";
  uri: string;
  location: string;
}

export interface OfficialIndicatorReference {
  id: string;
  objectiveId: string;
  title: string;
  instrument: string;
  source: string;
  population: string;
  uri: string;
  location: string;
  /** La posibilidad de calcular un indicador municipal debe acreditarse aparte. */
  municipalComparability: "requires-methodological-review";
}

const PESMA = "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/PESMAA.pdf";
const EPVSA = "https://www.juntadeandalucia.es/organismos/presidenciasanidadyemergencias/areas/sanidad/planificacion/estrategia-promocion-vida-saludable-andalucia.html";
const EPVSA_INDICATORS = "https://cdn.juntadeandalucia.es/sites/default/files/inline-files/2024/04/INDICADORES_EstrategiaVidaSaludable_02abril2024.pdf";

export const BEM_OFFICIAL_OBJECTIVES: readonly OfficialObjectiveReference[] = [
  { id: "PESMA-OE01", document: "PESMA-A 2026–2029", title: "Aumentar el bienestar emocional de la población andaluza.", level: "estratégico", uri: PESMA, location: "p. 129, línea 1, OE01" },
  { id: "PESMA-OE02", document: "PESMA-A 2026–2029", title: "Mejorar la detección y atención precoz de las personas con problemas de adicciones y/o salud mental.", level: "estratégico", uri: PESMA, location: "p. 129, línea 1, OE02" },
  { id: "PESMA-OE03", document: "PESMA-A 2026–2029", title: "Mejorar la salud física de las personas con problemas de salud mental y adicciones.", level: "estratégico", uri: PESMA, location: "p. 129, línea 1, OE03" },
  { id: "PESMA-OE04", document: "PESMA-A 2026–2029", title: "Disminuir las conductas suicidas y su impacto social.", level: "estratégico", uri: PESMA, location: "p. 129, línea 1, OE04" },
  { id: "PESMA-OE05", document: "PESMA-A 2026–2029", title: "Fomentar un modelo comunitario y mejorar la coordinación Salud Mental, Adicciones y Atención Primaria (proceso asistencial de ansiedad, depresión y somatizaciones).", level: "estratégico", uri: PESMA, location: "p. 129, línea 2, OE05" },
  { id: "PESMA-OE10", document: "PESMA-A 2026–2029", title: "Mejorar la inclusión social de las personas con problemas de salud mental y/o adicciones en colaboración con el tejido asociativo, mediante la reducción del estigma y la discriminación y fomentando la participación social.", level: "estratégico", uri: PESMA, location: "p. 131, línea 5, OE10" },
  { id: "EPVSA-OE1.4", document: "EPVSA 2024–2030", title: "Incrementar la percepción de calidad de vida y de bienestar emocional", level: "estratégico", uri: EPVSA, location: "p. 89-90, OE 1.4" },
  { id: "EPVSA-OE1.6", document: "EPVSA 2024–2030", title: "Disminuir el tiempo dedicado al uso de aparatos electrónicos, en detrimento del tiempo dedicado a familiares y amistades", level: "estratégico", uri: EPVSA, location: "p. 91, OE 1.6" },
  { id: "EPVSA-OE1.7", document: "EPVSA 2024–2030", title: "Incrementar las recomendaciones a la ciudadanía sobre activos comunitarios que facilitan una vida saludable", level: "estratégico", uri: EPVSA, location: "p. 91, OE 1.7" },
] as const;

export const BEM_OFFICIAL_INDICATORS: readonly OfficialIndicatorReference[] = [
  { id: "PESMA-OE01-IBSE", objectiveId: "PESMA-OE01", title: "Índice de Bienestar Emocional (IBSE)", instrument: "IBSE de Bericat", source: "Encuesta Andaluza de Salud 2023", population: "Población > 16 años", uri: PESMA, location: "p. 333, tabla OE1 (referencia Andalucía 75,94)", municipalComparability: "requires-methodological-review" },
  { id: "PESMA-OE01-KIDSCREEN", objectiveId: "PESMA-OE01", title: "Índice Bienestar Emocional de la población Infantil (KIDSCREEN)", instrument: "KIDSCREEN", source: "Encuesta Andaluza de Salud 2023", population: "Población de 8 a 16 años", uri: PESMA, location: "p. 333, tabla OE1", municipalComparability: "requires-methodological-review" },
  { id: "PESMA-P01.02-GEA-GRUBEA", objectiveId: "PESMA-OE01", title: "Número de centros escolares en los que se implanta el Programa de Gestión Emocional para Adolescentes (GEA) y el Grupo de Bienestar Emocional en Adolescentes (GRUBEA)", instrument: "Registro administrativo de programa GEA/GRUBEA", source: "PESMA-A P.01.02", population: "Centros educativos participantes", uri: PESMA, location: "p. 138, indicadores P.01.02", municipalComparability: "requires-methodological-review" },
  { id: "EPVSA-1.4.3", objectiveId: "EPVSA-OE1.4", title: "Media del índice de calidad de vida relacionada con la salud en población adulta en su componente mental", instrument: "SF-12", source: "Encuesta Andaluza de Salud", population: "16 años o más", uri: EPVSA_INDICATORS, location: "Indicadores EPVSA, tabla OE1.4, indicador de contexto 1.4.3.a", municipalComparability: "requires-methodological-review" },
  { id: "EPVSA-1.4.5", objectiveId: "EPVSA-OE1.4", title: "Porcentaje de población adulta que percibe como bajo su apoyo social y afectivo", instrument: "Duke-UNC-11", source: "Encuesta Andaluza de Salud", population: "16 años o más", uri: EPVSA_INDICATORS, location: "Indicadores EPVSA, tabla OE1.4, indicador de contexto 1.4.5.a", municipalComparability: "requires-methodological-review" },
  { id: "EPVSA-1.6.3", objectiveId: "EPVSA-OE1.6", title: "Porcentaje de población infantil de entre 8-15 años que usa más de dos horas al día aparatos electrónicos", instrument: "Encuesta Andaluza de Salud", source: "Encuesta Andaluza de Salud", population: "8 a 15 años", uri: EPVSA_INDICATORS, location: "Indicadores EPVSA, tabla OE1.6, indicador de contexto 1.6.3.a", municipalComparability: "requires-methodological-review" },
  { id: "EPVSA-1.7.1", objectiveId: "EPVSA-OE1.7", title: "Número de recomendaciones a la ciudadanía sobre activos comunitarios para la salud desde el SSPA", instrument: "Registro de recomendaciones desde el SSPA", source: "EPVSA", population: "Recomendaciones del SSPA", uri: EPVSA_INDICATORS, location: "Indicadores EPVSA, tabla OE1.7, indicador de contexto 1.7.1.a", municipalComparability: "requires-methodological-review" },
] as const;

export type BemAlignment = "objective-correspondence" | "indicator-same-instrument-pending-comparability" | "indicator-related-not-equivalent" | "compas-own-no-identical-official-indicator";

/** La correspondencia no transforma los 17 indicadores BEM en indicadores oficiales. */
export const BEM_LEGACY_ALIGNMENT: Readonly<Record<string, { officialObjectiveId?: string; officialIndicatorId?: string; alignment: BemAlignment }>> = {
  "BEM-I1.1": { officialObjectiveId: "PESMA-OE01", officialIndicatorId: "PESMA-OE01-IBSE", alignment: "indicator-same-instrument-pending-comparability" },
  "BEM-I1.2": { officialObjectiveId: "PESMA-OE01", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I1.3": { officialObjectiveId: "PESMA-OE01", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I2.1": { officialObjectiveId: "EPVSA-OE1.4", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I2.2": { officialObjectiveId: "EPVSA-OE1.4", officialIndicatorId: "EPVSA-1.4.5", alignment: "indicator-same-instrument-pending-comparability" },
  "BEM-I3.1": { officialObjectiveId: "PESMA-OE01", officialIndicatorId: "PESMA-P01.02-GEA-GRUBEA", alignment: "indicator-related-not-equivalent" },
  "BEM-I3.2": { officialObjectiveId: "PESMA-OE01", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I3.3": { officialObjectiveId: "EPVSA-OE1.6", officialIndicatorId: "EPVSA-1.6.3", alignment: "indicator-same-instrument-pending-comparability" },
  "BEM-I4.1": { officialObjectiveId: "EPVSA-OE1.7", alignment: "indicator-related-not-equivalent" },
  "BEM-I4.2": { officialObjectiveId: "EPVSA-OE1.7", officialIndicatorId: "EPVSA-1.7.1", alignment: "indicator-related-not-equivalent" },
  "BEM-I4.3": { officialObjectiveId: "EPVSA-OE1.7", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I5.1": { officialObjectiveId: "PESMA-OE02", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I5.2": { officialObjectiveId: "PESMA-OE05", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I6.1": { officialObjectiveId: "PESMA-OE04", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I6.2": { officialObjectiveId: "PESMA-OE04", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I7.1": { officialObjectiveId: "PESMA-OE10", alignment: "compas-own-no-identical-official-indicator" },
  "BEM-I7.2": { officialObjectiveId: "PESMA-OE10", alignment: "compas-own-no-identical-official-indicator" },
};
