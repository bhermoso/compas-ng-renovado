/**
 * Estructura estratégica del catálogo de actuaciones-tipo heredado del histórico
 * (COMPAS-RESCATE-20260514, constante ESTRUCTURA_EPVSA, index.html:18252 en el commit 58be063):
 * 4 líneas, sus objetivos estratégicos, y el vínculo de cada programa con su línea y sus objetivos.
 *
 * Verificación contra la fuente (docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf):
 *  - Las 4 líneas coinciden literalmente con el documento (LE 1 a LE 4).
 *  - Los objetivos OE 1.1 a OE 1.7 coinciden literalmente. Los de OE 2.1, OE 3.1 y OE 4.1 del histórico estaban
 *    resumidos y no coincidían: aquí se usa el texto del documento.
 *  - Los programas (P01 a P15), su ámbito, su vínculo con la línea y con los objetivos, y las 125 actuaciones NO figuran
 *    en el documento: siguen siendo heredados, no verificados.
 * Es referencia de clasificación, no dato local ni evidencia del diagnóstico. Generado a partir del histórico;
 * solo se corrigieron los tres textos indicados.
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
      { code: "OE 2.1", name: "Incrementar el número de empresas con productos o actividades de consumo, que se comprometan a crear condiciones que favorezcan los hábitos saludables, así como un consumo justo y sostenible entre la población." },
    ],
  },
  {
    code: "LE3",
    name: "Difusión y comunicación de información veraz a la ciudadanía sobre los beneficios de una vida saludable y protección de la población frente a mensajes, publicidad y campañas perjudiciales para la salud",
    sourceLine: 18882,
    programCodes: ["P14"],
    objectives: [
      { code: "OE 3.1", name: "Incrementar y favorecer la difusión de información sobre hábitos saludables, con contenidos relevantes, veraces y accesibles." },
    ],
  },
  {
    code: "LE4",
    name: "Impulso a la gestión del conocimiento, la investigación y la innovación en el área de la promoción de hábitos de vida saludables",
    sourceLine: 18954,
    programCodes: ["P15"],
    objectives: [
      { code: "OE 4.1", name: "Incrementar la formación y la investigación en el área de la promoción de hábitos saludables." },
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
