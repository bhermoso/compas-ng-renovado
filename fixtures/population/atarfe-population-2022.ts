import type { PopulationReference } from "../../src/domain/sam";

// Fuente: "Atarfe población 2022.xlsx" — COMPAS_NG root
// INE — Padrón Municipal de Habitantes, 1 de enero de 2022
// Municipio: 18022 Atarfe (Granada)
// Tabla: Población por sexo, municipios y edad (año a año)
// Grupo objetivo: ≥16 años (población diana EAS — Encuesta Andaluza de Salud)
//
// Totales verificados por grupo etario (16–100+):
//   16–19:  864   |  20–29: 2.006  |  30–39: 3.119
//   40–49: 3.534  |  50–59: 2.497  |  60–69: 1.846
//   70–79:   991  |  80–89:   505  |  90+:     110
//   Total: 15.472 personas ≥16 años
//
// ageSexMatrix (Hamilton): los totales por grupo etario están en el comentario
// anterior, pero el desglose por sexo (hombres/mujeres por banda) no se extrajo
// de la hoja Excel fuente. Hasta obtenerlo, ageSexMatrix queda pendiente y la
// afijación Hamilton no puede ejecutarse para este municipio.
// Principio: celda sin dato = no evaluable; no se estima ni se redondea a 50/50.
//
// Nota IBSE: esta referencia (16 años y más, padrón 2022) vale para instrumentos EAS
// de adultos; para el IBSE de Atarfe, cuya muestra va de 13 a 88 años (no solo
// adultos), se usa ATARFE_POPULATION_2025 (clave allAges del registro); para muestras
// de menores de 16 solo, atarfe-under16-population-2025.
export const ATARFE_POPULATION_2022: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Padrón Municipal de Habitantes — INE, 1 de enero de 2022",
  year: 2022,
  populationTotal: 15_472,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
  // ageSexMatrix: pendiente de desglose por sexo de la fuente INE.
};
