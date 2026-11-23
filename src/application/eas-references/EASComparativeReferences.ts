import { parseDUKECSV } from "../duke";
import { parsePREDIMEDCSV } from "../predimed";
import { parseSF12CSV } from "../sf12";
import { parseSuenoCSV } from "../sueno";
import { parseCAGECSV } from "../cage";
import { parseIPAQCSV } from "../ipaq";

export type EASComparativeInstrument =
  | "DUKE-EAS"
  | "PREDIMED-EAS"
  | "SF-12 EAS"
  | "Sueño EAS"
  | "CAGE-EAS"
  | "IPAQ-EAS";

export type EASComparisonDirection =
  | "higher-than-andalucia"
  | "lower-than-andalucia"
  | "same-as-andalucia";

export interface EASComparativeValue {
  readonly value: number;
  readonly unit: string;
  readonly nValid: number;
  readonly sourceLabel: string;
  readonly territorialScope: "granada-provincia-proxy" | "andalucia-reference";
}

export interface EASComparativeReference {
  readonly id: string;
  readonly instrument: EASComparativeInstrument;
  readonly indicator: string;
  readonly granada: EASComparativeValue;
  readonly andalucia: EASComparativeValue;
  readonly deltaGranadaMinusAndalucia: number;
  readonly direction: EASComparisonDirection;
  readonly method: string;
  readonly caution: string;
}

export interface EASComparativeReferenceInput {
  readonly dukeGranadaCSV: string;
  readonly dukeAndaluciaCSV: string;
  readonly predimedGranadaCSV: string;
  readonly predimedAndaluciaCSV: string;
  readonly sf12GranadaCSV: string;
  readonly sf12AndaluciaCSV: string;
  readonly suenoGranadaCSV: string;
  readonly suenoAndaluciaCSV: string;
  readonly cageGranadaCSV: string;
  readonly cageAndaluciaCSV: string;
  readonly ipaqGranadaCSV: string;
  readonly ipaqAndaluciaCSV: string;
}

const METHOD =
  "Referencias comparativas calculadas desde microdatos EAS mediante los mismos parsers y fórmulas de COMPÁS; Granada provincia se usa como proxy piloto y Andalucía como referencia autonómica.";

export const EAS_COMPARATIVE_REFERENCE_CAUTION =
  "Los fixtures no contienen estimaciones municipales ni distritales. El valor Granada corresponde a Granada provincia como proxy contextual; no debe redactarse como dato del municipio o del distrito.";

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

function direction(delta: number): EASComparisonDirection {
  if (delta > 0) return "higher-than-andalucia";
  if (delta < 0) return "lower-than-andalucia";
  return "same-as-andalucia";
}

function reference(
  id: string,
  instrument: EASComparativeInstrument,
  indicator: string,
  unit: string,
  granadaValue: number,
  granadaN: number,
  granadaSource: string,
  andaluciaValue: number,
  andaluciaN: number,
  andaluciaSource: string,
  decimals: 1 | 2 = 1
): EASComparativeReference {
  const round = decimals === 2 ? round2 : round1;
  const g = round(granadaValue);
  const a = round(andaluciaValue);
  const delta = round(g - a);

  return {
    id,
    instrument,
    indicator,
    granada: {
      value: g,
      unit,
      nValid: granadaN,
      sourceLabel: granadaSource,
      territorialScope: "granada-provincia-proxy",
    },
    andalucia: {
      value: a,
      unit,
      nValid: andaluciaN,
      sourceLabel: andaluciaSource,
      territorialScope: "andalucia-reference",
    },
    deltaGranadaMinusAndalucia: delta,
    direction: direction(delta),
    method: METHOD,
    caution: EAS_COMPARATIVE_REFERENCE_CAUTION,
  };
}

export function buildEASComparativeReferences(
  input: EASComparativeReferenceInput
): EASComparativeReference[] {
  const dukeGranada = parseDUKECSV(input.dukeGranadaCSV).aggregates;
  const dukeAndalucia = parseDUKECSV(input.dukeAndaluciaCSV).aggregates;

  const predimedGranada = parsePREDIMEDCSV(input.predimedGranadaCSV).aggregates;
  const predimedAndalucia = parsePREDIMEDCSV(input.predimedAndaluciaCSV).aggregates;

  const sf12Granada = parseSF12CSV(input.sf12GranadaCSV).aggregates;
  const sf12Andalucia = parseSF12CSV(input.sf12AndaluciaCSV).aggregates;

  const suenoGranada = parseSuenoCSV(input.suenoGranadaCSV).aggregates;
  const suenoAndalucia = parseSuenoCSV(input.suenoAndaluciaCSV).aggregates;

  const cageGranada = parseCAGECSV(input.cageGranadaCSV).aggregates;
  const cageAndalucia = parseCAGECSV(input.cageAndaluciaCSV).aggregates;

  const ipaqGranada = parseIPAQCSV(input.ipaqGranadaCSV).aggregates;
  const ipaqAndalucia = parseIPAQCSV(input.ipaqAndaluciaCSV).aggregates;

  return [
    reference(
      "duke-global-mean",
      "DUKE-EAS",
      "Apoyo social funcional global — media DUKE-UNC-11",
      "puntos/55",
      dukeGranada.meanGlobal,
      dukeGranada.nValidGlobal,
      "duke-eas-granada.csv",
      dukeAndalucia.meanGlobal,
      dukeAndalucia.nValidGlobal,
      "duke-eas-andalucia.csv"
    ),
    reference(
      "duke-global-low",
      "DUKE-EAS",
      "Apoyo social funcional global bajo",
      "%",
      dukeGranada.lowGlobalPercentage,
      dukeGranada.nValidGlobal,
      "duke-eas-granada.csv",
      dukeAndalucia.lowGlobalPercentage,
      dukeAndalucia.nValidGlobal,
      "duke-eas-andalucia.csv"
    ),
    reference(
      "predimed-mean",
      "PREDIMED-EAS",
      "Adherencia a dieta mediterránea — media PREDIMED-14",
      "puntos/14",
      predimedGranada.meanScore,
      predimedGranada.nValid,
      "predimed-eas-granada.csv",
      predimedAndalucia.meanScore,
      predimedAndalucia.nValid,
      "predimed-eas-andalucia.csv"
    ),
    reference(
      "predimed-high",
      "PREDIMED-EAS",
      "Alta adherencia a dieta mediterránea",
      "%",
      predimedGranada.highPercentage,
      predimedGranada.nValid,
      "predimed-eas-granada.csv",
      predimedAndalucia.highPercentage,
      predimedAndalucia.nValid,
      "predimed-eas-andalucia.csv"
    ),
    reference(
      "sf12-pcs-mean",
      "SF-12 EAS",
      "Salud física percibida — media PCS12_SP",
      "puntos",
      sf12Granada.meanPCS,
      sf12Granada.nValidPCS,
      "sf12-eas-granada.csv",
      sf12Andalucia.meanPCS,
      sf12Andalucia.nValidPCS,
      "sf12-eas-andalucia.csv",
      2
    ),
    reference(
      "sf12-mcs-mean",
      "SF-12 EAS",
      "Salud mental percibida — media MCS12_SP",
      "puntos",
      sf12Granada.meanMCS,
      sf12Granada.nValidMCS,
      "sf12-eas-granada.csv",
      sf12Andalucia.meanMCS,
      sf12Andalucia.nValidMCS,
      "sf12-eas-andalucia.csv",
      2
    ),
    reference(
      "sueno-insuficiente",
      "Sueño EAS",
      "Sueño insuficiente en horas — P33_R",
      "%",
      suenoGranada.pctInsufficientSleep,
      suenoGranada.nValidP33R,
      "sueno-eas-granada.csv",
      suenoAndalucia.pctInsufficientSleep,
      suenoAndalucia.nValidP33R,
      "sueno-eas-andalucia.csv"
    ),
    reference(
      "sueno-no-descansa",
      "Sueño EAS",
      "No descansa suficientemente — P33A",
      "%",
      suenoGranada.pctNoRest,
      suenoGranada.nValidP33A,
      "sueno-eas-granada.csv",
      suenoAndalucia.pctNoRest,
      suenoAndalucia.nValidP33A,
      "sueno-eas-andalucia.csv"
    ),
    reference(
      "cage-risk",
      "CAGE-EAS",
      "Riesgo de alcoholismo — CAGE_R",
      "%",
      cageGranada.pctRisk,
      cageGranada.nValidCAGER,
      "cage-eas-granada.csv",
      cageAndalucia.pctRisk,
      cageAndalucia.nValidCAGER,
      "cage-eas-andalucia.csv"
    ),
    reference(
      "ipaq-high",
      "IPAQ-EAS",
      "Alta actividad física — IPAQ_DICO",
      "%",
      ipaqGranada.pctHigh,
      ipaqGranada.nValidIPAQ,
      "ipaq-eas-granada.csv",
      ipaqAndalucia.pctHigh,
      ipaqAndalucia.nValidIPAQ,
      "ipaq-eas-andalucia.csv"
    ),
    reference(
      "ipaq-inactive",
      "IPAQ-EAS",
      "Inactividad en tiempo libre — P34A_R",
      "%",
      ipaqGranada.pctInactive,
      ipaqGranada.nValidP34AR,
      "ipaq-eas-granada.csv",
      ipaqAndalucia.pctInactive,
      ipaqAndalucia.nValidP34AR,
      "ipaq-eas-andalucia.csv"
    ),
  ];
}
