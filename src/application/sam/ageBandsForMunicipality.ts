import type { AgeBand } from "./buildAgeSexObserved";
import { parseAgeBandLabel } from "./assessSample";
import { getPopulationReferenceSet } from "./populationReferenceRegistry";

/**
 * Bandas quinquenales estándar del padrón (0-4 … 95-99, 100+). Se usan solo para
 * describir la distribución de los participantes cuando el municipio no tiene un
 * padrón desglosado; no permiten evaluar representatividad por sí solas.
 */
export const STANDARD_QUINQUENNIAL_BAND_LABELS: readonly string[] = [
  ...Array.from({ length: 20 }, (_, i) => `${i * 5}-${i * 5 + 4}`),
  "100+",
];

/**
 * Bandas de edad con las que recoger la distribución edad×sexo de un CSV: las del
 * padrón de referencia del municipio si existe, y si no las quinquenales estándar.
 */
export function ageBandsForMunicipality(municipalityId: string): AgeBand[] {
  const fromRegistry = getPopulationReferenceSet(municipalityId).allAges?.ageSexMatrix;
  const labels = fromRegistry
    ? fromRegistry.map((c) => c.ageBand)
    : STANDARD_QUINQUENNIAL_BAND_LABELS;
  return labels
    .map((l) => parseAgeBandLabel(l))
    .filter((b): b is AgeBand => b !== null);
}
