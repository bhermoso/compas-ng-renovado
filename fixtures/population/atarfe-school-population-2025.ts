import type { PopulationReference } from "../../src/domain/sam";

// Fuente: "20260101_Pob por cap sexo y edad (1).xlsx" — COMPAS_NG root
// MTI-BDU — Poblaciones por Edad a 31/12/2025
// Centro de Atención Primaria: Atarfe (CAP 21046), Zona Básica: 04046
// Municipio: Atarfe (Granada)
//
// Grupo objetivo: 6–17 años — universo completo del estudio escolar IBSE
// (educación primaria 6–11 y secundaria 12–17, incluyendo bachillerato hasta 17)
//
// Distribución por edades:
//   6: 206  |  7: 201  |  8: 210  |  9: 271  | 10: 230  | 11: 255
//  12: 232  | 13: 245  | 14: 226  | 15: 247  | 16: 262  | 17: 262
//   Total 6–17: 2.847 personas
//
// Nota metodológica: universo ESCOLAR 6–17 (documental). NO es la referencia SAM
// de menores de 16: para `sampleScope: "under-16"` se usa atarfe-under16-population-2025.ts
// (6–15, N=2.323), que no incluye 16 ni 17 años. Este fixture 6–17 no se emplea
// como referencia SAM y se conserva solo como dato del universo escolar completo.
export const ATARFE_SCHOOL_POPULATION_2025: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "MTI-BDU — Poblaciones por Edad, 31 de diciembre de 2025",
  year: 2025,
  populationTotal: 2_847,
  ageGroupLabel: "6 a 17 años (universo escolar)",
  extractedAt: "2026-06-29",
};

/**
 * Personas por edad simple de 6 a 17 años, mismo origen que el universo escolar
 * (MTI-BDU, CAP Atarfe 21046, a 31/12/2025). Son las cifras declaradas arriba,
 * sin estimar ni interpolar. Es población con tarjeta sanitaria asignada al
 * centro, no padrón: se declara así donde se use.
 */
export const ATARFE_SINGLE_AGE_BDU_2025 = {
  source: "MTI-BDU — Poblaciones por Edad, 31 de diciembre de 2025, CAP Atarfe",
  counts: { 6: 206, 7: 201, 8: 210, 9: 271, 10: 230, 11: 255, 12: 232, 13: 245, 14: 226, 15: 247, 16: 262, 17: 262 } as Readonly<Record<number, number>>,
} as const;
