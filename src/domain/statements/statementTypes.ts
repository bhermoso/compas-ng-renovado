/**
 * Tipos de afirmación del Perfil y pasos de la cadena de lectura.
 * Contrato: CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY v1.7, Arts. 8 y 8 ter.
 */

export const STATEMENT_TYPES = [
  "hecho",
  "interpretacion",
  "hipotesis",
  "orientacion",
  "percepcion",
  "cautela",
  "laguna",
  "decision-posterior",
] as const;
export type StatementType = (typeof STATEMENT_TYPES)[number];

export const READING_STEPS = ["describir", "analizar", "inferir", "concluir", "orientar"] as const;
export type ReadingStep = (typeof READING_STEPS)[number];

/** Tipos que admite cada paso (Art. 8 ter). La cautela cabe en cualquiera. */
export const STEP_ALLOWED_TYPES: Record<ReadingStep, readonly StatementType[]> = {
  describir: ["hecho", "percepcion", "laguna", "cautela"],
  analizar: ["hecho", "percepcion", "cautela", "laguna"],
  inferir: ["interpretacion", "hipotesis", "cautela"],
  concluir: ["hecho", "interpretacion", "laguna", "cautela"],
  orientar: ["orientacion", "decision-posterior", "cautela"],
};

/**
 * Tipos de recomendación del Perfil (Art. 8 quater, contrato v2.0.0).
 * `abordar` exige una conclusión sostenida por una relación de grado 1 o 2.
 */
export const RECOMMENDATION_KINDS = ["conocer", "contrastar", "abordar"] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export const RECOMMENDATION_LABEL: Record<RecommendationKind, string> = {
  conocer: "Conocer",
  contrastar: "Contrastar",
  abordar: "Abordar",
};

/** Tipos que exigen autoría humana y no los puede generar el sistema (Art. 8). */
export const HUMAN_AUTHORSHIP_TYPES: readonly StatementType[] = ["interpretacion", "hipotesis", "orientacion"];
