/**
 * Estructura estratégica del catálogo de actuaciones-tipo heredado del histórico
 * (COMPAS-RESCATE-20260514, constante ESTRUCTURA_EPVSA, index.html:18252 en el commit 58be063):
 * 4 líneas, sus objetivos estratégicos, y el vínculo de cada programa con su línea y sus objetivos.
 *
 * Estado de la fuente: heredado, NO verificado contra la EPVSA (igual que el catálogo de actuaciones).
 * Es referencia de clasificación, no dato local ni evidencia del diagnóstico. Generado a partir del
 * histórico; no editar a mano salvo para corregir un texto.
 */
export interface HistoricObjective {
  readonly code: string;
  readonly name: string;
}
export interface HistoricLine {
  readonly code: string;
  readonly name: string;
  readonly objectives: readonly HistoricObjective[];
  readonly programCodes: readonly string[];
  readonly sourceLine: number;
}
export interface HistoricProgramLink {
  readonly lineCode: string;
  /** Códigos de objetivo estratégico a los que el histórico vincula el programa, p. ej. «OE 1.1». */
  readonly objectiveCodes: readonly string[];
}

export const HISTORIC_LINES: readonly HistoricLine[] = [
  {
    code: "LE1",
    name: "Promoción de hábitos de vida saludable mediante intervenciones en políticas y entornos y dinamización de activos comunitarios para la salud",
    sourceLine: 18258,
    programCodes: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12"],
    objectives: [
      { code: "OE 1.1", name: "Incrementar los niveles de lactancia materna y el consumo de alimentos saludables en detrimento de los no saludables" },
      { code: "OE 1.2", name: "Aumentar los niveles de actividad física y disminuir los hábitos sedentarios" },
      { code: "OE 1.3", name: "Incrementar las horas y la calidad del sueño en la población" },
      { code: "OE 1.4", name: "Incrementar la percepción de calidad de vida y de bienestar emocional" },
      { code: "OE 1.5", name: "Incrementar la percepción de satisfacción con las relaciones sexuales para todas las partes, independientemente de su sexo, orientación o identidad sexual" },
      { code: "OE 1.6", name: "Disminuir el tiempo dedicado al uso de aparatos electrónicos, en detrimento del tiempo dedicado a familiares y amistades" },
      { code: "OE 1.7", name: "Incrementar las recomendaciones a la ciudadanía sobre activos comunitarios que facilitan una vida saludable" },
    ],
  },
  {
    code: "LE2",
    name: "Fomento de responsabilidad social ante la salud por parte del sector empresarial",
    sourceLine: 18814,
    programCodes: ["P13"],
    objectives: [
      { code: "OE 2.1", name: "Incrementar el número de empresas que favorezcan en sus estrategias corporativas la adquisición y mantenimiento de hábitos saludables por parte de la ciudadanía" },
    ],
  },
  {
    code: "LE3",
    name: "Difusión y comunicación de información veraz a la ciudadanía sobre los beneficios de una vida saludable y protección de la población frente a mensajes, publicidad y campañas perjudiciales para la salud",
    sourceLine: 18882,
    programCodes: ["P14"],
    objectives: [
      { code: "OE 3.1", name: "Incrementar la difusión de información veraz sobre hábitos saludables dirigida a la ciudadanía" },
    ],
  },
  {
    code: "LE4",
    name: "Impulso a la gestión del conocimiento, la investigación y la innovación en el área de la promoción de hábitos de vida saludables",
    sourceLine: 18954,
    programCodes: ["P15"],
    objectives: [
      { code: "OE 4.1", name: "Incrementar la formación de profesionales y la investigación e innovación en el ámbito de la promoción de hábitos saludables" },
    ],
  },
]

export const HISTORIC_PROGRAM_LINKS: Readonly<Record<string, HistoricProgramLink>> = {
  "P01": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P02": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.6", "OE 1.7"] },
  "P03": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P04": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P05": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P06": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P07": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.6"] },
  "P08": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P09": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P10": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P11": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P12": { lineCode: "LE1", objectiveCodes: ["OE 1.1", "OE 1.2", "OE 1.3", "OE 1.4", "OE 1.5", "OE 1.6", "OE 1.7"] },
  "P13": { lineCode: "LE2", objectiveCodes: ["OE 2.1"] },
  "P14": { lineCode: "LE3", objectiveCodes: ["OE 3.1"] },
  "P15": { lineCode: "LE4", objectiveCodes: ["OE 4.1"] },
}
