/**
 * healthReportSanitaryReading
 *
 * El Informe de salud como HILO SANITARIO del Perfil: lectura sustantiva y
 * trazable del cuerpo del Informe (texto ya extraído en la ingesta), basada
 * en PRESENCIA REAL de términos sanitarios — nunca en valores inventados.
 *
 * Reglas:
 *   - D-HR-01 intacta: no se generan EvidenceAtoms del Informe; esto es una
 *     lectura para narrativa, con el documento preservado íntegro.
 *   - Solo se reporta una dimensión si sus términos aparecen de verdad en el
 *     texto del Informe; las magnitudes exactas quedan en el documento.
 *   - Denominación institucional del Informe: nunca nombres técnicos de
 *     archivo ni etiquetas históricas («estilo Atarfe»).
 */

import type {
  HealthReportDocument,
  HealthReportStructuredFinding,
  HealthReportStructuredReading,
} from "../../domain/health-report";
import { buildHealthReportStructuredReading } from "../health-report";

// ── Denominación institucional del Informe ────────────────────────────────────

const TITULOS_INSTITUCIONALES: Record<string, string> = {
  "granada-zaidin": "Informe de salud de El Zaidín",
};

/**
 * Título visible del Informe en producto (pantalla, PSL-C, DOCX, PDF).
 * Cae al título crudo saneado (sin extensión ni etiquetas técnicas) cuando
 * el municipio no tiene denominación institucional registrada.
 */
export function institutionalHealthReportTitle(
  municipalityId: string,
  rawTitle: string
): string {
  const institucional = TITULOS_INSTITUCIONALES[municipalityId];
  if (institucional !== undefined) return institucional;
  return rawTitle
    .replace(/\.(docx|pdf|doc|odt)$/i, "")
    .replace(/\s+estilo\s+\S+.*$/i, "")
    .trim();
}

// Patrón de títulos técnicos históricos dentro de texto narrativo persistido.
const RAW_TITLE_IN_TEXT_RE = /\bInforme[^\n«»]{0,80}?estilo\s+Atarfe(\.docx)?/gi;

/**
 * Saneado DEFENSIVO para rutas de lectura: sustituye menciones del título
 * técnico histórico dentro de texto ya persistido (PSL validados o artefactos
 * congelados anteriores) por la denominación institucional. Solo actúa si el
 * municipio tiene denominación registrada; nunca modifica el dato bruto
 * almacenado — es una etiqueta de presentación/exportación.
 */
export function sanitizeHealthReportTitleInText(
  texto: string,
  municipalityId: string
): string {
  const institucional = TITULOS_INSTITUCIONALES[municipalityId];
  if (institucional === undefined) return texto;
  return texto.replace(RAW_TITLE_IN_TEXT_RE, institucional);
}

// ── Lectura sanitaria por presencia ───────────────────────────────────────────

export interface HealthReportSanitarySignal {
  /** Dimensión sanitaria (agrupación de términos). */
  dimension: string;
  /** Términos de la dimensión realmente presentes en el Informe. */
  terminos: string[];
  /** Total de menciones de esos términos en el cuerpo del Informe. */
  menciones: number;
}

export interface HealthReportSanitaryReading {
  present: boolean;
  /** Señales sanitarias detectadas, ordenadas por peso de menciones. */
  senales: HealthReportSanitarySignal[];
  /** Base epidemiológica estructurada derivada del Informe, sin mutar el original. */
  baseEpidemiologica: HealthReportStructuredReading;
  /** Secciones sanitarias del Informe (títulos reales). */
  seccionesSanitarias: string[];
  /** Qué no permite leer el Informe (declarado, no rellenado). */
  sinResolver: string[];
  charCount: number;
}

// Taxonomía sanitaria conservadora: dimensión → términos (sin acentos).
export const TAXONOMIA_SANITARIA: Array<{ dimension: string; terminos: string[] }> = [
  { dimension: "mortalidad y esperanza de vida", terminos: ["mortalidad", "esperanza de vida"] },
  { dimension: "cáncer y tumores", terminos: ["cancer", "tumores", "tumor"] },
  {
    dimension: "enfermedades crónicas (diabetes, hipertensión, cardiovascular)",
    terminos: ["cronic", "diabetes", "hipertension", "cardiovascular", "circulatorio"],
  },
  { dimension: "salud mental y malestar emocional", terminos: ["salud mental", "depresion", "ansiedad"] },
  { dimension: "consumos de tabaco y alcohol", terminos: ["tabaco", "alcohol", "tabaquismo"] },
  { dimension: "alimentación, sobrepeso y obesidad", terminos: ["obesidad", "sobrepeso", "alimentacion"] },
  { dimension: "actividad física y sedentarismo", terminos: ["sedentari", "actividad fisica"] },
  { dimension: "envejecimiento y dependencia", terminos: ["envejecimiento", "dependencia"] },
  { dimension: "prevención y vacunación", terminos: ["vacunacion", "cribado"] },
  {
    dimension: "condiciones socioeconómicas y desigualdad",
    terminos: ["desigualdad", "renta", "paro", "desempleo", "vivienda"],
  },
];

const SECCION_SANITARIA_RE =
  /epidemiol|problemas de salud|factores de riesgo|encuesta andaluza|sociodemogr/i;

function aTextoPlano(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function contar(texto: string, termino: string): number {
  return texto.split(termino).length - 1;
}

function slugHealthSignal(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function withTextualAgendaFindings(
  base: HealthReportStructuredReading,
  healthReport: HealthReportDocument,
  senales: HealthReportSanitarySignal[]
): HealthReportStructuredReading {
  const agenda: HealthReportStructuredFinding[] = senales.map((senal, index) => ({
    id: `health-report-textual-agenda-${index + 1}-${slugHealthSignal(senal.dimension)}`,
    kind: "textual-agenda",
    topic: senal.dimension,
    statement:
      `El Informe trata «${senal.dimension}» mediante los términos ` +
      `${senal.terminos.join(", ")}.`,
    value: senal.menciones,
    unit: "menciones textuales",
    geography: {
      level: "unknown",
      label: "ámbito del Informe",
      isProxyForTargetTerritory: false,
    },
    source: {
      documentId: healthReport.linkedDocumentId,
      textExcerpt: senal.terminos.join(", "),
    },
    limitations: [
      "La presencia textual no equivale a prevalencia, magnitud epidemiológica ni prioridad territorial.",
    ],
    interpretationStatus: "textual-presence",
    interpretationUse: ["sanitary-thread", "future-human-hypothesis"],
  }));

  return {
    ...base,
    findings: [...base.findings, ...agenda],
  };
}

export function buildHealthReportSanitaryReading(
  healthReport: HealthReportDocument | undefined
): HealthReportSanitaryReading {
  if (!healthReport || !healthReport.body?.originalText) {
    return {
      present: false,
      senales: [],
      baseEpidemiologica: buildHealthReportStructuredReading(undefined),
      seccionesSanitarias: [],
      sinResolver: [],
      charCount: 0,
    };
  }

  const texto = aTextoPlano(healthReport.body.originalText);
  const senales: HealthReportSanitarySignal[] = [];
  for (const grupo of TAXONOMIA_SANITARIA) {
    const presentes: string[] = [];
    let menciones = 0;
    for (const termino of grupo.terminos) {
      const n = contar(texto, aTextoPlano(termino));
      if (n > 0) {
        presentes.push(termino);
        menciones += n;
      }
    }
    if (presentes.length > 0) {
      senales.push({ dimension: grupo.dimension, terminos: presentes, menciones });
    }
  }
  senales.sort((a, b) => b.menciones - a.menciones);
  const baseEpidemiologica = withTextualAgendaFindings(
    buildHealthReportStructuredReading(healthReport),
    healthReport,
    senales
  );

  const seccionesSanitarias = healthReport.sections
    .filter((s) => SECCION_SANITARIA_RE.test(s.title))
    .map((s) => s.title);

  return {
    present: true,
    senales,
    baseEpidemiologica,
    seccionesSanitarias: [...new Set(seccionesSanitarias)],
    sinResolver: [
      "la mayor parte de los apartados no desagrega al nivel del distrito",
      "las magnitudes exactas deben leerse en el propio Informe",
    ],
    charCount: texto.length,
  };
}
