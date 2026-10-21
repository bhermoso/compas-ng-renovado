import type { PopulationReference } from "../../src/domain/sam";

// Fuente: INE — tabla 68535 (municipio × sexo × edad × nacionalidad), Censo anual de población.
// Municipio: 18913 Zagra (Granada), periodo 2025 (fecha del dato: 1 de enero de 2025).
// Lectura: fichero CSV de la tabla 68535 publicado por el INE, filas de Zagra, nacionalidad «Total».
// Grupo objetivo: todas las edades (21 bandas quinquenales: 0-4 … 100+).
// Suma verificada contra el total publicado por el INE: hombres (420) + mujeres (423) = 843.
// Contraste: la ficha de Zagra del IECA (SIMA) da 843 habitantes en 2025 (420 hombres, 423 mujeres).
// Nota de nacionalidad: española y extranjera están sumadas (nacionalidad «Total»).
// Bandas exactas del INE. Regla de uso: no alterar estas cifras ni interpolar. Solo datos del INE.
export const ZAGRA_POPULATION_2025: PopulationReference = {
  municipalityId: "18913",
  municipalityCode: "18913",
  source: "INE — tabla 68535, municipio 18913 Zagra, 1 de enero de 2025 (nacionalidades sumadas)",
  year: 2025,
  populationTotal: 843,
  ageGroupLabel: "todas las edades",
  extractedAt: "2026-10-21",
  ageSexMatrix: [
    { ageBand: "0-4", male:  7, female: 14 },
    { ageBand: "5-9", male: 13, female: 13 },
    { ageBand: "10-14", male: 19, female: 20 },
    { ageBand: "15-19", male: 31, female: 25 },
    { ageBand: "20-24", male: 19, female: 31 },
    { ageBand: "25-29", male: 27, female: 22 },
    { ageBand: "30-34", male: 12, female: 23 },
    { ageBand: "35-39", male: 26, female: 21 },
    { ageBand: "40-44", male: 34, female: 22 },
    { ageBand: "45-49", male: 27, female: 22 },
    { ageBand: "50-54", male: 33, female: 33 },
    { ageBand: "55-59", male: 41, female: 39 },
    { ageBand: "60-64", male: 45, female: 26 },
    { ageBand: "65-69", male: 21, female: 30 },
    { ageBand: "70-74", male: 26, female: 20 },
    { ageBand: "75-79", male: 14, female: 22 },
    { ageBand: "80-84", male: 12, female: 12 },
    { ageBand: "85-89", male: 10, female: 20 },
    { ageBand: "90-94", male:  2, female:  8 },
    { ageBand: "95-99", male:  1, female:  0 },
    { ageBand: "100+", male:  0, female:  0 },
  ],
};
