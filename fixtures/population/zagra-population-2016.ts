import type { PopulationReference } from "../../src/domain/sam";

// Fuente: IECA — Sistema de Información Multiterritorial de Andalucía (SIMA),
// «Población por edad simple y sexo (Padrón)», año 2016, municipio Zagra (INE 18913, Granada).
// Origen del dato: export R ZAGRA/IECA_export (2).xls del expediente municipal de Zagra.
// Grupo objetivo: todas las edades, bandas quinquenales 0-4 … 80-84 y 85+ (18 bandas, tal como las publica el IECA).
// Suma verificada contra los totales del export: hombres (449) + mujeres (433) = 882.
// Nota de fecha: el export indica «Año=2016»; la fecha exacta de referencia no consta en el fichero y se registra «periodo 2016».
// Regla de uso: no alterar estas cifras ni interpolar; no se reparte la banda 85+.
export const ZAGRA_POPULATION_2016: PopulationReference = {
  municipalityId: "18913",
  municipalityCode: "18913",
  source: "IECA — SIMA, Población por edad simple y sexo (Padrón), municipio 18913 Zagra, año 2016",
  year: 2016,
  populationTotal: 882,
  ageGroupLabel: "todas las edades",
  extractedAt: "2026-10-21",
  ageSexMatrix: [
    { ageBand: "0-4", male: 10, female: 10 },
    { ageBand: "5-9", male: 20, female: 15 },
    { ageBand: "10-14", male: 12, female: 26 },
    { ageBand: "15-19", male: 20, female: 19 },
    { ageBand: "20-24", male: 23, female: 24 },
    { ageBand: "25-29", male: 26, female: 16 },
    { ageBand: "30-34", male: 29, female: 22 },
    { ageBand: "35-39", male: 28, female: 25 },
    { ageBand: "40-44", male: 25, female: 27 },
    { ageBand: "45-49", male: 44, female: 39 },
    { ageBand: "50-54", male: 51, female: 33 },
    { ageBand: "55-59", male: 33, female: 32 },
    { ageBand: "60-64", male: 32, female: 24 },
    { ageBand: "65-69", male: 20, female: 23 },
    { ageBand: "70-74", male: 17, female: 23 },
    { ageBand: "75-79", male: 27, female: 30 },
    { ageBand: "80-84", male: 21, female: 25 },
    { ageBand: "85+", male: 11, female: 20 },
  ],
};
