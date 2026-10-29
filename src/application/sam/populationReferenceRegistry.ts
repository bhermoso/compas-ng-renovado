import type { PopulationReference } from "../../domain/sam";
import { ATARFE_POPULATION_2022 } from "../../../fixtures/population/atarfe-population-2022";
import { ATARFE_UNDER16_POPULATION_2025 } from "../../../fixtures/population/atarfe-under16-population-2025";
import { ATARFE_POPULATION_2025 } from "../../../fixtures/population/atarfe-population-2025";
import { FUENTE_VAQUEROS_POPULATION_2025 } from "../../../fixtures/population/fuente-vaqueros-population-2025";
import { ZAGRA_POPULATION_2025 } from "../../../fixtures/population/zagra-population-2025";

export interface PopulationReferenceSet {
  /** Adultos ≥16 años — instrumentos EAS y muestras IBSE de 16 o más. */
  adult?: PopulationReference;
  /**
   * Referencia poblacional de MENORES de 16 (universo 6–15). Coherente para
   * muestras IBSE de menores de 16. NO reutiliza la referencia escolar 6–17 (que
   * incluye 16 y 17). NO se usa para muestras de 16 o más ni para evaluar una
   * muestra mixta sin desglose etario válido.
   */
  minor?: PopulationReference;
  /**
   * Referencia poblacional de TODAS las edades (padrón completo con desglose
   * quinquenal edad×sexo). Habilita afijación Hamilton y descripción de la composición por celda.
   * No sustituye ni altera las claves adult/minor.
   */
  allAges?: PopulationReference;
}

// Conjunto INMUTABLE de referencias de Atarfe. Un mismo objeto congelado se
// resuelve tanto por el identificador de municipio ("atarfe") como por su código
// INE ("18022"): el expediente canónico usa `municipalityId: "atarfe"`, mientras
// que la fuente poblacional se cita por INE. Sin este alias, un estudio real de
// Atarfe no encontraría nunca sus referencias.
const ATARFE_REFERENCE_SET: PopulationReferenceSet = Object.freeze({
  adult: ATARFE_POPULATION_2022,
  minor: ATARFE_UNDER16_POPULATION_2025,
  allAges: ATARFE_POPULATION_2025,
});

// Fuente Vaqueros: solo padrón de todas las edades. No hay referencia adulta ni de menores.
const FUENTE_VAQUEROS_REFERENCE_SET: PopulationReferenceSet = Object.freeze({
  allAges: FUENTE_VAQUEROS_POPULATION_2025,
});

// Zagra: solo padrón de todas las edades (INE, 2025). No hay referencia adulta ni de menores.
const ZAGRA_REFERENCE_SET: PopulationReferenceSet = Object.freeze({
  allAges: ZAGRA_POPULATION_2025,
});

/**
 * Alias de municipio → clave canónica del registro. Permite que distintas formas
 * de identificar al mismo municipio (id del expediente y código INE) resuelvan el
 * MISMO conjunto de referencias. No fabrica datos: solo enruta identificadores.
 */
const MUNICIPALITY_ALIASES: Readonly<Record<string, string>> = {
  atarfe: "18022",
  "fuente-vaqueros": "18079",
  zagra: "18913",
};

/**
 * Registro de Fuentes Poblacionales de Referencia verificadas por municipio.
 *
 * Solo se registra un municipio cuando existe una fuente verificada (Padrón
 * INE, MTI-BDU o equivalente con suma auditada). No se añaden estimaciones.
 * La ausencia de entrada indica que SAM no puede ejecutarse para ese municipio.
 */
const REGISTRY: Readonly<Record<string, PopulationReferenceSet>> = {
  "18022": ATARFE_REFERENCE_SET,
  "18079": FUENTE_VAQUEROS_REFERENCE_SET,
  "18913": ZAGRA_REFERENCE_SET,
};

/**
 * Devuelve las referencias poblacionales disponibles para un municipio, o {} si no
 * existen. Resuelve alias (p. ej. "atarfe" → "18022") antes de consultar, de modo
 * que el id del expediente y el código INE devuelvan el mismo conjunto inmutable.
 */
export function getPopulationReferenceSet(municipalityId: string): PopulationReferenceSet {
  const canonicalKey = MUNICIPALITY_ALIASES[municipalityId] ?? municipalityId;
  return REGISTRY[canonicalKey] ?? {};
}
