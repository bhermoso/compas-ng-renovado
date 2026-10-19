import type { PopulationReference } from "../../src/domain/sam";

// Fuente: INE — tabla 68535 (municipio × sexo × edad × nacionalidad), consulta a la API del INE
// Municipio: 18079 Fuente Vaqueros (Granada), periodo 2025 (fecha del dato: 1 de enero de 2025)
// Grupo objetivo: todas las edades (21 bandas quinquenales: 0-4 … 100+)
// Suma verificada contra el total publicado por el INE: hombres (2.368) + mujeres (2.376) = 4.744
// Nota de nacionalidad: española y extranjera están sumadas (nacionalidad «Total»).
// Bandas exactas del INE. Regla de uso: no alterar estas cifras ni interpolar. Solo datos del INE.
export const FUENTE_VAQUEROS_POPULATION_2025: PopulationReference = {
  municipalityId: "18079",
  municipalityCode: "18079",
  source: "INE — tabla 68535, municipio 18079 Fuente Vaqueros, 1 de enero de 2025 (nacionalidades sumadas)",
  year: 2025,
  populationTotal: 4_744,
  ageGroupLabel: "todas las edades",
  extractedAt: "2026-10-19",
  ageSexMatrix: [
    { ageBand: "0-4",   male: 128, female: 111 },
    { ageBand: "5-9",   male: 119, female:  90 },
    { ageBand: "10-14", male: 105, female: 110 },
    { ageBand: "15-19", male: 147, female: 147 },
    { ageBand: "20-24", male: 172, female: 172 },
    { ageBand: "25-29", male: 152, female: 149 },
    { ageBand: "30-34", male: 146, female: 139 },
    { ageBand: "35-39", male: 152, female: 129 },
    { ageBand: "40-44", male: 158, female: 144 },
    { ageBand: "45-49", male: 178, female: 188 },
    { ageBand: "50-54", male: 181, female: 163 },
    { ageBand: "55-59", male: 181, female: 174 },
    { ageBand: "60-64", male: 162, female: 179 },
    { ageBand: "65-69", male: 133, female: 123 },
    { ageBand: "70-74", male:  78, female:  88 },
    { ageBand: "75-79", male:  71, female:  73 },
    { ageBand: "80-84", male:  55, female:  87 },
    { ageBand: "85-89", male:  27, female:  62 },
    { ageBand: "90-94", male:  20, female:  37 },
    { ageBand: "95-99", male:   3, female:   9 },
    { ageBand: "100+",  male:   0, female:   2 },
  ],
};
