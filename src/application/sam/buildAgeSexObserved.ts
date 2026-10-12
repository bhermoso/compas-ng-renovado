// Convenciones:
// - edad = referenceYear - birthYear (diferencia de años calendario)
// - pertenencia exacta [min, max]; si no cae en ninguna banda → outOfBand
// - sin dato: respondiente sin sexo reconocible, sin birthYear, o fuera de todas las
//   bandas → no asignable. Se cuenta y declara; nunca se imputa.

import type { AgeSexCell } from "../../domain/sam/PopulationReference";

export interface AgeBand {
  label: string;
  min: number;
  max: number;
}

export interface AgeSexObservedResult {
  /** Distribución observada por celda edad×sexo — compatible con enrichWithRepresentativeness. */
  cells: AgeSexCell[];
  assignedCount: number;
  unassignableCount: number;
  unassignableBreakdown: {
    /** Sexo ausente, vacío o con código no reconocible (incluye 3 y 4 en GES). */
    noSex: number;
    /** Sexo presente pero birthYear ausente o no numérico. */
    noBirthYear: number;
    /** Ambos datos presentes pero la edad calculada cae fuera de todas las bandas. */
    outOfBand: number;
  };
}

/** Normaliza el campo de sexo al par canónico "male"/"female" o null si no reconocible.
 *  Acepta los códigos REDCap GES (1=hombre, 2=mujer) y sus equivalentes en texto.
 *  Códigos 3/4 (extensión COMPÁS NG) y cualquier otro valor → null (no asignable).
 */
function normalizeSex(sex: string | undefined): "male" | "female" | null {
  if (!sex) return null;
  const s = sex.trim().toLowerCase();
  if (s === "1" || s === "male" || s === "hombre") return "male";
  if (s === "2" || s === "female" || s === "mujer") return "female";
  return null;
}

function findBand(age: number, bands: AgeBand[]): number {
  for (let i = 0; i < bands.length; i++) {
    if (age >= bands[i].min && age <= bands[i].max) return i;
  }
  return -1;
}

/**
 * Construye la distribución observada por celda edad×sexo a partir de datos individuales.
 *
 * @param rows           Registros individuales con sexo y año de nacimiento opcionales.
 * @param referenceYear  Año de referencia para calcular la edad (referenceYear - birthYear).
 * @param ageBands       Bandas de edad en orden canónico; deben coincidir con las de
 *                       PopulationReference.ageSexMatrix para poder llamar a
 *                       enrichWithRepresentativeness.
 */
export function buildAgeSexObserved(
  rows: ReadonlyArray<{ sex?: string; birthYear?: number }>,
  referenceYear: number,
  ageBands: AgeBand[]
): AgeSexObservedResult {
  const counts = new Map<string, { male: number; female: number }>();
  for (const band of ageBands) {
    counts.set(band.label, { male: 0, female: 0 });
  }

  let assignedCount = 0;
  let noSex = 0;
  let noBirthYear = 0;
  let outOfBand = 0;

  for (const row of rows) {
    const sex = normalizeSex(row.sex);
    if (sex === null) {
      noSex++;
      continue;
    }

    if (
      row.birthYear === undefined ||
      row.birthYear === null ||
      !Number.isFinite(row.birthYear)
    ) {
      noBirthYear++;
      continue;
    }

    const age = referenceYear - row.birthYear;
    const bandIdx = findBand(age, ageBands);
    if (bandIdx === -1) {
      outOfBand++;
      continue;
    }

    counts.get(ageBands[bandIdx].label)![sex]++;
    assignedCount++;
  }

  const cells: AgeSexCell[] = ageBands.map((band) => {
    const c = counts.get(band.label)!;
    return { ageBand: band.label, male: c.male, female: c.female };
  });

  const unassignableCount = noSex + noBirthYear + outOfBand;
  return {
    cells,
    assignedCount,
    unassignableCount,
    unassignableBreakdown: { noSex, noBirthYear, outOfBand },
  };
}
