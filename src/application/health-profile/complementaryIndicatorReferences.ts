/**
 * complementaryIndicatorReferences
 *
 * Referencias comparativas de los indicadores de estudios complementarios:
 * la cadena bloque diagnóstico → instrumento → indicador → valor territorial
 * demo → referencia provincial → referencia autonómica → procedencia →
 * cautela → lectura comparativa prudente.
 *
 * Corrección conceptual que este módulo garantiza:
 *   - Los estudios complementarios organizan los instrumentos e indicadores;
 *     las referencias comparativas de Granada/provincia y Andalucía NO forman
 *     parte de esos estudios: proceden de cálculos derivados de microdatos EAS
 *     (o de un monitor provincial equivalente, en el caso del IBSE).
 *   - En la demostración Granada-Zaidín los valores territoriales de los
 *     instrumentos EAS coinciden con la referencia provincial de Granada
 *     porque proceden de los mismos ficheros: eso es comportamiento demo/proxy
 *     (demoProxy = true) y NO constituye estimación específica del distrito.
 *   - La referencia autonómica de Andalucía se incorpora para los instrumentos
 *     EAS con fixture autonómico ya calculado; cuando no existe referencia
 *     equivalente, se declara no disponible y nunca se finge.
 *   - Nada se inventa: cada valor procede de los agregados reales del estudio
 *     cargado en el workspace; si no existe, se declara no disponible.
 */

import type { MunicipalityWorkspace } from "../../domain/workspace";
import { territorialLexicon, type TerritorialLexicon } from "./territorialGrammar";
import { DIAGNOSTIC_BLOCK_TITLES } from "./complementaryStudiesReading";
import {
  ANDALUSIA_REFERENCE_VALUE_BY_INDICATOR,
  ANDALUSIA_REFERENCE_LABEL,
} from "../eas-references/andalusiaReferenceContract";
import { getEAS2023ContextForIndicator } from "../eas-references/eas2023References";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface IndicatorComparisonReference {
  indicatorId: string;
  /** Título real del átomo indicador en la evidencia. */
  indicatorTitle: string;
  instrument: string;
  diagnosticBlockId: string;
  diagnosticBlockTitle: string;
  /** Valor de la muestra territorial/demo (agregado real del estudio). */
  territorialValue?: number | string;
  territorialLabel: string;
  provinceReference?: number | string;
  provinceLabel: string;
  andalusiaReference?: number | string;
  andalusiaLabel: string;
  unit?: string;
  /** Fichero/procedencia del cálculo. */
  source: string;
  calculationMethod?: string;
  scaleCaution: string;
  /** El valor territorial demo coincide con la referencia provincial. */
  demoProxy: boolean;
  comparisonReading: string;
  /** Etiqueta narrativa para citar el indicador en el documento. */
  narrativeLabel: string;
  /** Prioridad como indicador trazador del bloque (1 = principal). */
  tracerPriority?: number;
  /**
   * Dimensión temática fina dentro del bloque diagnóstico. Un bloque puede
   * contener dimensiones distintas que NO deben fusionarse (p. ej. «consumos»
   * agrupa alcohol, tabaco y alimentación). La selección de señal principal
   * opera por dimensión, no por bloque.
   */
  dimension: string;
  /**
   * Medición sobre una muestra local del propio ámbito (instrumento cargado
   * desde fichero municipal), no un proxy provincial/autonómico. La primacía
   * local se decide con este campo, no con `tracerPriority`.
   */
  esLocal: boolean;
  /** Tamaño de muestra válida del estudio, si el agregado lo expone. */
  sampleSize?: number;
  /**
   * Contexto de población general EAS 2023 para indicadores sin referencia
   * provincial metodológicamente equivalente (provincial="ninguna").
   * NO es una referencia equivalente al instrumento; es prevalencia poblacional
   * de Granada/Andalucía de un tema relacionado. Siempre etiquetada "no local".
   */
  eas2023PopulationContext?: {
    easKey: string;
    topic: string;
    refAndalucia: number;
    refGranada: number;
    caution: string;
  };
}

export interface IndicatorReferencesCoverage {
  total: number;
  conValorTerritorial: number;
  conReferenciaProvincial: number;
  conReferenciaAndalucia: number;
  pendientesDeReferencia: number;
}

export interface ComplementaryIndicatorReferencesReading {
  references: IndicatorComparisonReference[];
  coverage: IndicatorReferencesCoverage;
}

// ── Especificación declarativa de los 23 indicadores ─────────────────────────
// Los accesores leen los agregados reales del estudio cargado. La procedencia
// provincial distingue tres casos honestos:
//   "eas"      → cálculo derivado de microdatos EAS de Granada (PROV=18); en
//                demo el valor territorial coincide con esa referencia (proxy).
//   "monitor"  → monitor IBSE provincial de Granada (mismo parser canónico);
//                misma coincidencia demo/proxy.
//   "ninguna"  → el instrumento se cargó desde un fichero municipal sin
//                referencia provincial ni autonómica equivalente.

type ProvincialProvenance = "eas" | "monitor" | "ninguna";

interface IndicatorSpec {
  id: string;
  /** Fragmento normalizado que identifica el título real del átomo. */
  match: string;
  narrativeLabel: string;
  instrument: string;
  blockId: string;
  unit?: string;
  value: (w: MunicipalityWorkspace) => number | string | undefined;
  provincial: ProvincialProvenance;
  sourceFile: (w: MunicipalityWorkspace) => string | undefined;
  calculationMethod?: string;
  tracerPriority?: number;
}

const INDICATOR_SPECS: IndicatorSpec[] = [
  // ── IBSE — bienestar socioemocional escolar ────────────────────────────────
  {
    id: "ibse-indice-total",
    match: "indice total",
    narrativeLabel: "el índice total de bienestar socioemocional (IBSE)",
    instrument: "IBSE",
    blockId: "bienestar-socioemocional-escolar",
    unit: "/100",
    value: (w) => w.ibseStudy?.aggregates.meanTotal,
    provincial: "monitor",
    sourceFile: (w) => w.ibseStudy?.sourceFileName,
    calculationMethod: "media de los 8 ítems IBSE, escala 0–100",
    tracerPriority: 1,
  },
  {
    id: "ibse-factor-vinculo",
    match: "factor vinculo",
    narrativeLabel: "el factor Vínculo del IBSE",
    instrument: "IBSE",
    blockId: "bienestar-socioemocional-escolar",
    unit: "/100",
    value: (w) => w.ibseStudy?.aggregates.meanFactorVinculo,
    provincial: "monitor",
    sourceFile: (w) => w.ibseStudy?.sourceFileName,
  },
  {
    id: "ibse-factor-situacion",
    match: "factor situacion",
    narrativeLabel: "el factor Situación del IBSE",
    instrument: "IBSE",
    blockId: "bienestar-socioemocional-escolar",
    unit: "/100",
    value: (w) => w.ibseStudy?.aggregates.meanFactorSituacion,
    provincial: "monitor",
    sourceFile: (w) => w.ibseStudy?.sourceFileName,
  },
  {
    id: "ibse-factor-control",
    match: "factor control",
    narrativeLabel: "el factor Control del IBSE",
    instrument: "IBSE",
    blockId: "bienestar-socioemocional-escolar",
    unit: "/100",
    value: (w) => w.ibseStudy?.aggregates.meanFactorControl,
    provincial: "monitor",
    sourceFile: (w) => w.ibseStudy?.sourceFileName,
  },
  {
    id: "ibse-factor-persona",
    match: "factor persona",
    narrativeLabel: "el factor Persona del IBSE",
    instrument: "IBSE",
    blockId: "bienestar-socioemocional-escolar",
    unit: "/100",
    value: (w) => w.ibseStudy?.aggregates.meanFactorPersona,
    provincial: "monitor",
    sourceFile: (w) => w.ibseStudy?.sourceFileName,
  },
  // ── DUKE — apoyo social ────────────────────────────────────────────────────
  {
    id: "duke-apoyo-global",
    match: "apoyo social funcional global",
    narrativeLabel: "el apoyo social funcional global (DUKE)",
    instrument: "DUKE",
    blockId: "apoyo-social-vinculo-comunitario",
    unit: "/55",
    value: (w) => w.dukeStudy?.aggregates.meanGlobal,
    provincial: "eas",
    sourceFile: (w) => w.dukeStudy?.sourceFileName,
    calculationMethod: "suma P5701–P5711, recodificación EAS reproducida al 100 %",
    tracerPriority: 1,
  },
  {
    id: "duke-apoyo-confidencial",
    match: "apoyo confidencial",
    narrativeLabel: "el apoyo confidencial (DUKE)",
    instrument: "DUKE",
    blockId: "apoyo-social-vinculo-comunitario",
    unit: "/35",
    value: (w) => w.dukeStudy?.aggregates.meanConfidential,
    provincial: "eas",
    sourceFile: (w) => w.dukeStudy?.sourceFileName,
  },
  {
    id: "duke-apoyo-afectivo",
    match: "apoyo afectivo",
    narrativeLabel: "el apoyo afectivo (DUKE)",
    instrument: "DUKE",
    blockId: "apoyo-social-vinculo-comunitario",
    unit: "/20",
    value: (w) => w.dukeStudy?.aggregates.meanAffective,
    provincial: "eas",
    sourceFile: (w) => w.dukeStudy?.sourceFileName,
  },
  // ── PREDIMED — alimentación ────────────────────────────────────────────────
  {
    id: "predimed-adherencia",
    match: "dieta mediterranea",
    narrativeLabel: "la adherencia a la dieta mediterránea (PREDIMED)",
    instrument: "PREDIMED",
    blockId: "consumos-alimentacion-habitos",
    unit: "/14",
    value: (w) => w.predimedStudy?.aggregates.meanScore,
    provincial: "eas",
    sourceFile: (w) => w.predimedStudy?.sourceFileName,
    calculationMethod: "puntuación canónica del campo derivado EAS (PREDIMED-14)",
    tracerPriority: 1,
  },
  // ── SF-12 — salud percibida ────────────────────────────────────────────────
  {
    id: "sf12-pcs",
    match: "componente fisico",
    narrativeLabel: "la salud física percibida (SF-12, componente físico)",
    instrument: "SF-12",
    blockId: "salud-mental-sueno-malestar",
    unit: "/100",
    value: (w) => w.sf12Study?.aggregates.meanPCS,
    provincial: "eas",
    sourceFile: (w) => w.sf12Study?.sourceFileName,
    calculationMethod:
      "puntuación canónica precalculada por la EAS (norma española, Vilagut 2008)",
  },
  {
    id: "sf12-mcs",
    match: "componente mental",
    narrativeLabel: "la salud mental percibida (SF-12, componente mental)",
    instrument: "SF-12",
    blockId: "salud-mental-sueno-malestar",
    unit: "/100",
    value: (w) => w.sf12Study?.aggregates.meanMCS,
    provincial: "eas",
    sourceFile: (w) => w.sf12Study?.sourceFileName,
    calculationMethod:
      "puntuación canónica precalculada por la EAS (norma española, Vilagut 2008)",
    tracerPriority: 1,
  },
  // ── Sueño (EAS) ────────────────────────────────────────────────────────────
  {
    id: "sueno-insuficiente",
    match: "duracion insuficiente",
    narrativeLabel: "el sueño de duración insuficiente (EAS)",
    instrument: "Sueño (EAS)",
    blockId: "salud-mental-sueno-malestar",
    unit: " %",
    value: (w) => w.suenoStudy?.aggregates.pctInsufficientSleep,
    provincial: "eas",
    sourceFile: (w) => w.suenoStudy?.sourceFileName,
    calculationMethod: "campo derivado oficial EAS P33_R",
    tracerPriority: 2,
  },
  {
    id: "sueno-no-descansa",
    match: "no descansa",
    narrativeLabel: "el descanso insuficiente autopercibido (EAS)",
    instrument: "Sueño (EAS)",
    blockId: "salud-mental-sueno-malestar",
    unit: " %",
    value: (w) => w.suenoStudy?.aggregates.pctNoRest,
    provincial: "eas",
    sourceFile: (w) => w.suenoStudy?.sourceFileName,
    calculationMethod: "campo derivado oficial EAS P33A",
  },
  // ── CAGE ───────────────────────────────────────────────────────────────────
  {
    id: "cage-riesgo",
    match: "riesgo de alcoholismo",
    narrativeLabel: "el riesgo de alcoholismo (CAGE)",
    instrument: "CAGE",
    blockId: "consumos-alimentacion-habitos",
    unit: " %",
    value: (w) => w.cageStudy?.aggregates.pctRisk,
    provincial: "eas",
    sourceFile: (w) => w.cageStudy?.sourceFileName,
    calculationMethod: "campo derivado oficial EAS CAGE_R",
  },
  {
    id: "cage-ordinal",
    match: "clasificacion ordinal",
    narrativeLabel: "la clasificación ordinal de consumo (CAGE)",
    instrument: "CAGE",
    blockId: "consumos-alimentacion-habitos",
    value: (w) => {
      const a = w.cageStudy?.aggregates;
      if (!a) return undefined;
      return `distribución ordinal 1–4: ${a.nCAGE1}/${a.nCAGE2}/${a.nCAGE3}/${a.nCAGE4}`;
    },
    provincial: "ninguna",
    sourceFile: (w) => w.cageStudy?.sourceFileName,
    calculationMethod:
      "distribución de categorías del campo derivado EAS CAGE; no comparable como valor único",
  },
  // ── AUDIT-C ────────────────────────────────────────────────────────────────
  {
    id: "auditc-positivo",
    match: "consumo de riesgo de alcohol",
    narrativeLabel: "el cribado AUDIT-C positivo",
    instrument: "AUDIT-C",
    blockId: "consumos-alimentacion-habitos",
    unit: " %",
    value: (w) => w.auditcStudy?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.auditcStudy?.sourceFileName,
    calculationMethod: "punto de corte score ≥ 4",
    tracerPriority: 2,
  },
  // ── IPAQ ───────────────────────────────────────────────────────────────────
  {
    id: "ipaq-alta",
    match: "alta actividad fisica",
    narrativeLabel: "la actividad física alta (IPAQ)",
    instrument: "IPAQ",
    blockId: "actividad-fisica-sedentarismo-entorno",
    unit: " %",
    value: (w) => w.ipaqStudy?.aggregates.pctHigh,
    provincial: "eas",
    sourceFile: (w) => w.ipaqStudy?.sourceFileName,
    calculationMethod: "campo derivado oficial EAS IPAQ_DICO",
  },
  {
    id: "ipaq-inactividad",
    match: "inactividad en tiempo libre",
    narrativeLabel: "la inactividad en tiempo libre (IPAQ)",
    instrument: "IPAQ",
    blockId: "actividad-fisica-sedentarismo-entorno",
    unit: " %",
    value: (w) => w.ipaqStudy?.aggregates.pctInactive,
    provincial: "eas",
    sourceFile: (w) => w.ipaqStudy?.sourceFileName,
    calculationMethod: "campo derivado oficial EAS P34A_R",
    tracerPriority: 1,
  },
  // ── GHQ-12 ─────────────────────────────────────────────────────────────────
  {
    id: "ghq12-positivo",
    match: "malestar psicologico",
    narrativeLabel: "el probable malestar psicológico (GHQ-12)",
    instrument: "GHQ-12",
    blockId: "salud-mental-sueno-malestar",
    unit: " %",
    value: (w) => w.ghq12Study?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.ghq12Study?.sourceFileName,
    calculationMethod: "scoring bimodal, punto de corte ≥ 3",
  },
  // ── PHQ-9 ──────────────────────────────────────────────────────────────────
  {
    id: "phq9-positivo",
    match: "sintomas depresivos",
    narrativeLabel: "los síntomas depresivos moderados o superiores (PHQ-9)",
    instrument: "PHQ-9",
    blockId: "salud-mental-sueno-malestar",
    unit: " %",
    value: (w) => w.phq9Study?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.phq9Study?.sourceFileName,
    calculationMethod: "punto de corte ≥ 10 (Kroenke 2001)",
  },
  // ── PSQI ───────────────────────────────────────────────────────────────────
  {
    id: "psqi-positivo",
    match: "mala calidad del sueno",
    narrativeLabel: "la mala calidad del sueño (PSQI)",
    instrument: "PSQI",
    blockId: "salud-mental-sueno-malestar",
    unit: " %",
    value: (w) => w.psqiStudy?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.psqiStudy?.sourceFileName,
    calculationMethod: "punto de corte > 5 (Buysse 1989)",
  },
  // ── Fagerström ─────────────────────────────────────────────────────────────
  {
    id: "fagerstrom-positivo",
    match: "nicotina",
    narrativeLabel: "la dependencia moderada o superior a la nicotina (Fagerström)",
    instrument: "Fagerström",
    blockId: "consumos-alimentacion-habitos",
    unit: " %",
    value: (w) => w.fagerstromStudy?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.fagerstromStudy?.sourceFileName,
    calculationMethod: "punto de corte ≥ 5 (Heatherton 1991), submuestra de fumadores",
  },
  // ── SBQ ────────────────────────────────────────────────────────────────────
  {
    id: "sbq-sedentario",
    match: "altamente sedentario",
    narrativeLabel: "el comportamiento altamente sedentario (SBQ)",
    instrument: "SBQ",
    blockId: "actividad-fisica-sedentarismo-entorno",
    unit: " %",
    value: (w) => w.sbqStudy?.aggregates.pctPositive,
    provincial: "ninguna",
    sourceFile: (w) => w.sbqStudy?.sourceFileName,
    calculationMethod: "punto de corte > 8 h/día",
    tracerPriority: 2,
  },
];

// ── Dimensión, carácter local y tamaño de muestra (trazabilidad de selección) ─
//
// La dimensión es más fina que el bloque: dentro de «consumos» conviven alcohol,
// tabaco y alimentación, que miden cosas distintas y no se fusionan. La primacía
// local se decide por instrumento cargado municipalmente, no por tamaño de
// muestra ni por procedencia (CAGE es «ninguna» pero de escala provincial).

const INDICATOR_DIMENSION: Record<string, string> = {
  "ibse-indice-total": "bienestar-socioemocional",
  "ibse-factor-vinculo": "bienestar-socioemocional",
  "ibse-factor-situacion": "bienestar-socioemocional",
  "ibse-factor-control": "bienestar-socioemocional",
  "ibse-factor-persona": "bienestar-socioemocional",
  "duke-apoyo-global": "apoyo-social",
  "duke-apoyo-confidencial": "apoyo-social",
  "duke-apoyo-afectivo": "apoyo-social",
  "predimed-adherencia": "alimentacion",
  "sf12-pcs": "salud-fisica-percibida",
  "sf12-mcs": "salud-mental",
  "sueno-insuficiente": "sueno",
  "sueno-no-descansa": "sueno",
  "cage-riesgo": "alcohol",
  "cage-ordinal": "alcohol",
  "auditc-positivo": "alcohol",
  "ipaq-alta": "actividad-fisica",
  "ipaq-inactividad": "actividad-fisica",
  "ghq12-positivo": "salud-mental",
  "phq9-positivo": "salud-mental",
  "psqi-positivo": "sueno",
  "fagerstrom-positivo": "tabaco",
  "sbq-sedentario": "sedentarismo",
};

/** Instrumentos cargados desde muestra municipal propia (evidencia local). */
const LOCAL_INSTRUMENTS = new Set([
  "AUDIT-C",
  "GHQ-12",
  "PHQ-9",
  "PSQI",
  "Fagerström",
  "SBQ",
]);

/** Accesor de tamaño de muestra válida por indicador (agregado real). */
const SAMPLE_SIZE_ACCESSOR: Record<
  string,
  (w: MunicipalityWorkspace) => number | undefined
> = {
  "ibse-indice-total": (w) => w.ibseStudy?.aggregates.nValid,
  "ibse-factor-vinculo": (w) => w.ibseStudy?.aggregates.nValid,
  "ibse-factor-situacion": (w) => w.ibseStudy?.aggregates.nValid,
  "ibse-factor-control": (w) => w.ibseStudy?.aggregates.nValid,
  "ibse-factor-persona": (w) => w.ibseStudy?.aggregates.nValid,
  "duke-apoyo-global": (w) => w.dukeStudy?.aggregates.nValidGlobal,
  "duke-apoyo-confidencial": (w) => w.dukeStudy?.aggregates.nValidConfidential,
  "duke-apoyo-afectivo": (w) => w.dukeStudy?.aggregates.nValidAffective,
  "predimed-adherencia": (w) => w.predimedStudy?.aggregates.nValid,
  "sf12-pcs": (w) => w.sf12Study?.aggregates.nValidPCS,
  "sf12-mcs": (w) => w.sf12Study?.aggregates.nValidMCS,
  "sueno-insuficiente": (w) => w.suenoStudy?.aggregates.n,
  "sueno-no-descansa": (w) => w.suenoStudy?.aggregates.n,
  "cage-riesgo": (w) => w.cageStudy?.aggregates.nValidCAGER,
  "cage-ordinal": (w) => w.cageStudy?.aggregates.nValidCAGER,
  "auditc-positivo": (w) => w.auditcStudy?.aggregates.nValid,
  "ipaq-alta": (w) => w.ipaqStudy?.aggregates.nValidIPAQ,
  "ipaq-inactividad": (w) => w.ipaqStudy?.aggregates.nValidIPAQ,
  "ghq12-positivo": (w) => w.ghq12Study?.aggregates.nValid,
  "phq9-positivo": (w) => w.phq9Study?.aggregates.nValid,
  "psqi-positivo": (w) => w.psqiStudy?.aggregates.nValid,
  "fagerstrom-positivo": (w) => w.fagerstromStudy?.aggregates.nValid,
  "sbq-sedentario": (w) => w.sbqStudy?.aggregates.nValid,
};

// ── Utilidades ────────────────────────────────────────────────────────────────

function normalize(value: string): string {
  const decomposed = value.normalize("NFD").toLowerCase();
  let out = "";
  for (let i = 0; i < decomposed.length; i++) {
    const code = decomposed.charCodeAt(i);
    const keep =
      (code >= 48 && code <= 57) || (code >= 97 && code <= 122) || code === 32;
    if (keep) out += decomposed[i];
  }
  return out;
}

/** Formatea un valor con su unidad para citarlo en la narrativa. */
export function formatIndicatorValue(
  value: number | string | undefined,
  unit?: string
): string {
  if (value === undefined) return "no disponible";
  if (typeof value === "string") return value;
  const s = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit !== undefined ? `${s}${unit}` : s;
}

const PROVINCE_LABEL: Record<ProvincialProvenance, string> = {
  eas: "cálculo derivado de microdatos EAS de Granada (PROV=18), parser canónico",
  monitor: "monitor IBSE provincial de Granada, agregado con el parser canónico",
  ninguna: "sin referencia provincial metodológicamente equivalente",
};

const ANDALUSIA_LABEL: Record<ProvincialProvenance, string> = {
  eas:
    "referencia autonómica calculada desde microdatos EAS de Andalucía con " +
    "fixture metodológicamente equivalente",
  monitor: "sin referencia autonómica equivalente del monitor IBSE",
  ninguna: "sin referencia autonómica disponible",
};

interface AndalusiaReference {
  value: number | string;
  label: string;
}

function andalusiaEASReferenceForSpec(
  spec: IndicatorSpec
): AndalusiaReference | undefined {
  if (spec.provincial !== "eas") return undefined;
  // Contrato único compartido con la capa comparativa EAS: asociación
  // explícita por id, sincronizada por test contra los fixtures autonómicos.
  const value = ANDALUSIA_REFERENCE_VALUE_BY_INDICATOR[spec.id];
  return value === undefined
    ? undefined
    : { value, label: ANDALUSIA_REFERENCE_LABEL };
}

/** Lectura comparativa prudente por indicador. */
export function interpretIndicatorComparison(
  ref: Pick<
    IndicatorComparisonReference,
    "territorialValue" | "provinceReference" | "demoProxy" | "unit" | "esLocal"
  >
): string {
  if (ref.territorialValue === undefined) {
    return "Valor no disponible en el expediente actual.";
  }
  if (ref.demoProxy && ref.provinceReference !== undefined) {
    return (
      "El valor territorial demo coincide con la referencia provincial " +
      "(comportamiento demo/proxy): es referencia contextual para el contraste " +
      "territorial y no constituye una estimación específica del ámbito."
    );
  }
  if (
    typeof ref.territorialValue === "number" &&
    typeof ref.provinceReference === "number"
  ) {
    // Comparación general (fuera de demo): tolerancia prudente para no
    // sobredimensionar pequeñas diferencias. Nunca causalidad.
    const tolerance = Math.max(0.5, Math.abs(ref.provinceReference) * 0.05);
    const diff = ref.territorialValue - ref.provinceReference;
    const posicion =
      Math.abs(diff) <= tolerance
        ? "similar a"
        : diff > 0
          ? "superior a"
          : "inferior a";
    return (
      `El valor territorial se interpreta como ${posicion} la referencia ` +
      `provincial dentro de la cautela de escala declarada; la comparación ` +
      `no implica causalidad.`
    );
  }
  // Sin referencia comparable: la naturaleza del valor la fija su procedencia
  // real (Lote D, ajuste 4). Una medición local del propio ámbito (p. ej. el IBSE
  // municipal de Atarfe) no es una «muestra territorial/demo».
  return (
    "No comparable: sin referencia territorial metodológicamente equivalente; " +
    (ref.esLocal
      ? "el valor describe la muestra local del ámbito, no representativa."
      : "el valor describe la muestra territorial/demo.")
  );
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

export interface BuildIndicatorComparisonReferencesInput {
  workspace: MunicipalityWorkspace;
  /** Títulos reales de los indicadores; si no se pasan, se derivan del workspace. */
  indicatorTitles?: string[];
}

/**
 * ¿El estudio que respalda este indicador se declara municipal? Se decide por la
 * ESCALA TERRITORIAL REAL del documento cargado (`territorialScale === "municipio"`),
 * no por una etiqueta estática del instrumento ni por `sampleScope` (que codifica el
 * universo etario de la muestra, no el territorial). Así se distingue el IBSE
 * municipal de Atarfe (documento con `territorialScale: "municipio"`) del monitor
 * IBSE provincial de Granada-Zaidín (documento sin escala municipal declarada), que
 * conserva su tratamiento proxy.
 */
function studyDocumentIsMunicipal(
  w: MunicipalityWorkspace,
  spec: IndicatorSpec
): boolean {
  const file = spec.sourceFile(w);
  if (file === undefined) return false;
  const doc = w.repository.documents.find((d) => d.sourceFileName === file);
  return doc?.territorialScale === "municipio";
}

export function buildIndicatorComparisonReferences(
  input: BuildIndicatorComparisonReferencesInput
): ComplementaryIndicatorReferencesReading {
  const { workspace } = input;
  // Léxico territorial de la identidad del ámbito (Lote D): un municipio (Atarfe)
  // no describe su muestra como «del distrito». Zaidín (distrito) lo reproduce.
  const lex: TerritorialLexicon = territorialLexicon(
    workspace.municipality.identity
  );
  const titles =
    input.indicatorTitles ??
    workspace.evidenceStore.atoms
      .filter((a) => a.kind === "indicator")
      .map((a) => a.title);
  const normalizedTitles = titles.map((t) => ({ raw: t, norm: normalize(t) }));

  const references: IndicatorComparisonReference[] = [];
  for (const spec of INDICATOR_SPECS) {
    // Un indicador solo se referencia si su átomo consta en la evidencia.
    const atomTitle = normalizedTitles.find(
      (t) =>
        t.norm.includes(normalize(spec.match)) &&
        t.norm.includes(normalize(spec.instrument.split(" ")[0]))
    );
    if (atomTitle === undefined) continue;

    const territorialValue = spec.value(workspace);
    // esLocal: el instrumento es intrínsecamente local (LOCAL_INSTRUMENTS), O el
    // estudio cargado se declara municipal por la ESCALA TERRITORIAL REAL de su
    // documento (territorialScale === "municipio"). Deriva de la procedencia real,
    // no de una etiqueta estática del instrumento.
    const esLocal =
      LOCAL_INSTRUMENTS.has(spec.instrument) ||
      studyDocumentIsMunicipal(workspace, spec);
    // demoProxy SOLO cuando el valor NO es una medición local del ámbito: un estudio
    // municipal (p. ej. el IBSE de Atarfe) nunca es proxy provincial ni fabrica una
    // referencia provincial a partir de su propio valor. Un monitor/EAS provincial
    // (p. ej. el IBSE de Granada-Zaidín) conserva su tratamiento demo/proxy.
    const demoProxy =
      spec.provincial !== "ninguna" &&
      typeof territorialValue === "number" &&
      !esLocal;
    const provinceReference = demoProxy
      ? (territorialValue as number)
      : undefined;
    const sourceFile = spec.sourceFile(workspace) ?? "fichero no registrado";
    const andalusiaReference = andalusiaEASReferenceForSpec(spec);
    const sampleSize = SAMPLE_SIZE_ACCESSOR[spec.id]?.(workspace);
    const muestraStr =
      sampleSize !== undefined ? `n=${sampleSize}` : "muestra declarada";
    // La cautela distingue evidencia local de proxy contextual: no puede
    // etiquetarse una muestra municipal como «proxy provincial».
    const scaleCaution = esLocal
      ? `Muestra local exploratoria (${muestraStr}) del propio ámbito: señal ` +
        `orientativa, no representativa ni estimación poblacional ${lex.delScope}; ` +
        `requiere contraste comunitario.`
      : "Evidencia contextual (proxy) de ámbito provincial u origen externo: " +
        `no constituye estimación específica ${lex.delScope} y requiere contraste ` +
        "territorial.";

    const ref: IndicatorComparisonReference = {
      indicatorId: spec.id,
      indicatorTitle: atomTitle.raw,
      instrument: spec.instrument,
      diagnosticBlockId: spec.blockId,
      diagnosticBlockTitle: DIAGNOSTIC_BLOCK_TITLES[spec.blockId] ?? spec.blockId,
      territorialValue,
      territorialLabel: esLocal
        ? "valor de la muestra local del ámbito (agregado real del estudio cargado)"
        : "valor de la muestra territorial/demo (agregado real del estudio cargado)",
      provinceReference,
      provinceLabel: PROVINCE_LABEL[spec.provincial],
      andalusiaReference: andalusiaReference?.value,
      andalusiaLabel: andalusiaReference?.label ?? ANDALUSIA_LABEL[spec.provincial],
      unit: spec.unit,
      source: sourceFile,
      calculationMethod: spec.calculationMethod,
      scaleCaution,
      demoProxy,
      comparisonReading: "",
      narrativeLabel: spec.narrativeLabel,
      tracerPriority: spec.tracerPriority,
      dimension: INDICATOR_DIMENSION[spec.id] ?? spec.blockId,
      esLocal,
      sampleSize,
    };
    ref.comparisonReading = interpretIndicatorComparison(ref);
    if (ref.andalusiaReference !== undefined) {
      ref.comparisonReading +=
        ` Referencia Andalucía incorporada: ${formatIndicatorValue(
          ref.andalusiaReference,
          ref.unit
        )}.`;
    }
    // Contexto de población EAS 2023 para indicadores sin referencia provincial
    // equivalente (provincial="ninguna"). Instrumento y variable EAS son distintos;
    // se expone solo como contexto epidemiológico "no local", no como comparación
    // metodológicamente equivalente.
    const eas2023Ctx = getEAS2023ContextForIndicator(spec.id);
    if (eas2023Ctx !== undefined) {
      ref.eas2023PopulationContext = {
        easKey: eas2023Ctx.easKey,
        topic: eas2023Ctx.topic,
        refAndalucia: eas2023Ctx.refAndalucia,
        refGranada: eas2023Ctx.refGranada,
        caution: eas2023Ctx.caution,
      };
    }
    references.push(ref);
  }

  const coverage: IndicatorReferencesCoverage = {
    total: references.length,
    conValorTerritorial: references.filter((r) => r.territorialValue !== undefined)
      .length,
    conReferenciaProvincial: references.filter(
      (r) => r.provinceReference !== undefined
    ).length,
    conReferenciaAndalucia: references.filter(
      (r) => r.andalusiaReference !== undefined
    ).length,
    pendientesDeReferencia: references.filter(
      (r) =>
        r.provinceReference === undefined && r.andalusiaReference === undefined
    ).length,
  };

  return { references, coverage };
}
