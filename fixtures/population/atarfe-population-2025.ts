import type { PopulationReference } from "../../src/domain/sam";

// Fuente: INE — Padrón Municipal de Habitantes, tabla 68535
// Municipio: 18022 Atarfe (Granada), periodo 2025
// Grupo objetivo: todas las edades (21 bandas quinquenales: 0-4 … 100+)
// Suma verificada: hombres (10.476) + mujeres (10.476) = 20.952
// Nota de fecha: la fecha exacta de referencia no consta en el fichero; se registra "periodo 2025".
// Nota de nacionalidad: española y extranjera están sumadas tal y como se publica la tabla 68535.
// Bandas exactas: 0-4, 5-9, …, 95-99, 100+. Los casos de 13 y 14 años pertenecen a la banda
// 10-14 (exacta); no se parte esa banda ni se estima ninguna cifra.
// Regla de uso: no alterar estas cifras ni interpolar. Solo datos del INE, sin estimaciones.
export const ATARFE_POPULATION_2025: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "INE — Padrón, tabla 68535, municipio 18022 Atarfe, periodo 2025 (nacionalidades sumadas)",
  year: 2025,
  populationTotal: 20_952,
  ageGroupLabel: "todas las edades",
  extractedAt: "2026-10-14",
  ageSexMatrix: [
    { ageBand: "0-4",   male:   533, female:   482 },
    { ageBand: "5-9",   male:   683, female:   648 },
    { ageBand: "10-14", male:   733, female:   668 },
    { ageBand: "15-19", male:   667, female:   652 },
    { ageBand: "20-24", male:   559, female:   521 },
    { ageBand: "25-29", male:   548, female:   562 },
    { ageBand: "30-34", male:   738, female:   708 },
    { ageBand: "35-39", male:   794, female:   816 },
    { ageBand: "40-44", male:   937, female: 1_000 },
    { ageBand: "45-49", male:   991, female:   931 },
    { ageBand: "50-54", male:   810, female:   727 },
    { ageBand: "55-59", male:   660, female:   630 },
    { ageBand: "60-64", male:   559, female:   587 },
    { ageBand: "65-69", male:   447, female:   513 },
    { ageBand: "70-74", male:   344, female:   366 },
    { ageBand: "75-79", male:   227, female:   262 },
    { ageBand: "80-84", male:   141, female:   190 },
    { ageBand: "85-89", male:    64, female:   117 },
    { ageBand: "90-94", male:    35, female:    81 },
    { ageBand: "95-99", male:     4, female:    14 },
    { ageBand: "100+",  male:     2, female:     1 },
  ],
};
