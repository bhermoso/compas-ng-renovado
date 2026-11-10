import type { IBSESampleScope, IBSEStrataCounts, IBSEStratumCount } from "./IBSEStudy";
import type { IBSEAggregates } from "./IBSEAggregates";

/**
 * Descripción canónica y honesta del universo etario de una muestra IBSE.
 *
 * Fuente ÚNICA de los textos que describen el estrato: la usan el constructor de
 * expedientes, la generación de átomos y la interfaz (IBSEPanel), de modo que la
 * descripción SIEMPRE se deriva del discriminador y nunca se afirma "población
 * escolar" cuando la muestra no lo es.
 */
export interface IBSESampleScopeDescription {
  /** Etiqueta breve para cabeceras/tags. */
  shortLabel: string;
  /** Frase descriptiva completa de la muestra. */
  sampleSentence: string;
}

export const IBSE_SAMPLE_SCOPES: readonly IBSESampleScope[] = [
  "under-16",
  "16-plus",
  "mixed",
  "unknown",
];

/** Predicado canónico: ¿es `value` un IBSESampleScope válido? */
export function isIBSESampleScope(value: unknown): value is IBSESampleScope {
  return typeof value === "string" && (IBSE_SAMPLE_SCOPES as readonly string[]).includes(value);
}

/** Normaliza cualquier valor a un IBSESampleScope; lo inválido o ausente → "unknown". */
export function normalizeIBSESampleScope(value: unknown): IBSESampleScope {
  return isIBSESampleScope(value) ? value : "unknown";
}

// El texto de la muestra mixta SIN desglose es contractual (revisión 2026-07-16):
// se exige literalmente en el expediente de Atarfe y en la interfaz.
export const IBSE_MIXED_SAMPLE_SENTENCE =
  "Muestra municipal mixta: incluye menores de 16 y personas de 16 o más; " +
  "el export disponible no permite desglosar los resultados por edad.";

// Texto de la muestra mixta CON desglose etario completo y validado.
export const IBSE_MIXED_SAMPLE_SENTENCE_WITH_BREAKDOWN =
  "Muestra municipal mixta con desglose etario validado: incluye menores de 16 y " +
  "personas de 16 o más, con recuentos por estrato que cuadran con los totales del estudio.";

// Cautela de "muestra participante": los valores describen a quien respondió, no
// a una población representada. Viaja en el estudio y en cada átomo cuando no hay
// representatividad demostrada por estrato.
export const IBSE_MIXED_SAMPLE_SENTENCE_WITH_AGE_SEX =
  "Muestra municipal mixta: incluye menores de 16 y personas de 16 o más; el export trae " +
  "edad y sexo de los participantes y permite describir su composición, aunque los recuentos " +
  "por estrato no cuadran con los totales (hay registros sin edad asignable).";

export const IBSE_PARTICIPANT_SAMPLE_CAUTION =
  "Los valores corresponden a la muestra municipal participante; no se ha " +
  "demostrado representatividad poblacional por estrato con este export.";

// Etiqueta de la media en los átomos cuando no hay representatividad demostrada.
export const IBSE_PARTICIPANT_MEAN_LABEL = "Media de la muestra municipal participante";

// ── Validación de recuentos por estrato ──────────────────────────────────────
//
// Un desglose por estrato solo es admisible si es ESTRUCTURALMENTE sano y CUADRA
// con los agregados del estudio. Nunca se derivan ni se completan datos: un
// desglose parcial, incoherente o que no suma contra `aggregates` se rechaza y la
// muestra queda "no evaluable por estrato".

export interface IBSEStrataValidation {
  valid: boolean;
  reason?: string;
}

function isSaneStratum(s: IBSEStratumCount | undefined): s is IBSEStratumCount {
  return (
    s !== undefined &&
    Number.isInteger(s.n) &&
    Number.isInteger(s.nValid) &&
    s.n >= 0 &&
    s.nValid >= 0 &&
    s.nValid <= s.n
  );
}

/** Comprobación estructural mínima (para normalización legacy en persistencia). */
export function isStructurallySaneStrataCounts(value: unknown): value is IBSEStrataCounts {
  if (value === null || typeof value !== "object") return false;
  const v = value as IBSEStrataCounts;
  // Al menos un estrato definido; los presentes deben ser sanos.
  const under = v.under16;
  const plus = v.plus16;
  if (under === undefined && plus === undefined) return false;
  if (under !== undefined && !isSaneStratum(under)) return false;
  if (plus !== undefined && !isSaneStratum(plus)) return false;
  return true;
}

/**
 * Validación COMPLETA para uso en SAM: exige ambos estratos sanos y que sus sumas
 * coincidan EXACTAMENTE con `aggregates.n` y `aggregates.nValid`.
 */
export function validateIBSEStrataCounts(
  strata: IBSEStrataCounts | undefined,
  aggregates: IBSEAggregates
): IBSEStrataValidation {
  if (strata === undefined) {
    return { valid: false, reason: "Sin recuentos por estrato (strataCounts ausente)." };
  }
  const { under16, plus16 } = strata;
  if (!isSaneStratum(under16) || !isSaneStratum(plus16)) {
    return {
      valid: false,
      reason: "Desglose por estrato incompleto o incoherente (n/nValid inválidos o nValid > n).",
    };
  }
  if (under16.n + plus16.n !== aggregates.n) {
    return {
      valid: false,
      reason: `La suma de n por estrato (${under16.n + plus16.n}) no coincide con aggregates.n (${aggregates.n}).`,
    };
  }
  if (under16.nValid + plus16.nValid !== aggregates.nValid) {
    return {
      valid: false,
      reason: `La suma de nValid por estrato (${under16.nValid + plus16.nValid}) no coincide con aggregates.nValid (${aggregates.nValid}).`,
    };
  }
  return { valid: true };
}

export interface DescribeIBSESampleScopeOptions {
  /**
   * Para `mixed`: ¿existe un desglose etario COMPLETO y VÁLIDO (recuentos por
   * estrato que cuadran con los totales)? Por defecto `false` — la declaración
   * prudente "no permite desglosar" (correcta para la exportación de Atarfe, que
   * no contiene `strataCounts`). El llamador que disponga de un desglose validado
   * debe pasar `true` para no contradecir a la UI que muestra ambos dictámenes.
   */
  hasValidBreakdown?: boolean;
  /** Para `mixed` sin desglose válido: ¿trae el estudio la distribución edad×sexo? */
  hasAgeSexDistribution?: boolean;
}

export function describeIBSESampleScope(
  scope: IBSESampleScope,
  options: DescribeIBSESampleScopeOptions = {}
): IBSESampleScopeDescription {
  switch (scope) {
    case "under-16":
      return {
        shortLabel: "Muestra de menores de 16",
        sampleSentence:
          "Muestra municipal de menores de 16 años. Se evalúa únicamente contra " +
          "una referencia poblacional de menores coherente.",
      };
    case "16-plus":
      return {
        shortLabel: "Muestra de 16 años o más",
        sampleSentence:
          "Muestra municipal de personas de 16 o más años. Comparte el universo " +
          "poblacional de referencia con la EAS (adultos ≥16), no sus datos ni su muestra.",
      };
    case "mixed":
      return {
        shortLabel: "Muestra municipal mixta",
        sampleSentence: options.hasValidBreakdown === true
          ? IBSE_MIXED_SAMPLE_SENTENCE_WITH_BREAKDOWN
          : options.hasAgeSexDistribution === true
            ? IBSE_MIXED_SAMPLE_SENTENCE_WITH_AGE_SEX
            : IBSE_MIXED_SAMPLE_SENTENCE,
      };
    case "unknown":
    default:
      return {
        shortLabel: "Muestra de estrato no determinado",
        sampleSentence:
          "Estrato etario de la muestra no determinado (dato sin desglose de edad): " +
          "no procede atribuir los resultados a un grupo poblacional concreto.",
      };
  }
}
