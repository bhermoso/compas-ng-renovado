import type { MunicipalityId } from "../municipality";

/**
 * Celda de la matriz edad×sexo del padrón.
 * Ambas cifras son personas (enteros no negativos).
 */
export interface AgeSexCell {
  ageBand: string;
  male: number;
  female: number;
}

export interface PopulationReference {
  municipalityId: MunicipalityId;
  municipalityCode: string;
  source: string;
  year: number;
  populationTotal: number;
  ageGroupLabel: string;
  extractedAt: string;
  /**
   * Desglose por grupo de edad y sexo, opcional y aditivo.
   * Si está presente, habilita la afijación Hamilton y la evaluación de
   * representatividad por celda. Debe ser coherente con populationTotal:
   * sum(male + female) de todas las celdas === populationTotal.
   * Cuando falta, el motor SAM existente (Cochran + cobertura global) opera
   * sin cambios.
   */
  ageSexMatrix?: AgeSexCell[];
}
