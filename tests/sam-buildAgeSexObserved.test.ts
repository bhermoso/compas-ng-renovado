import { describe, it, expect } from "vitest";
import {
  buildAgeSexObserved,
} from "../src/application/sam/buildAgeSexObserved";
import type { AgeBand } from "../src/application/sam/buildAgeSexObserved";

// Bandas EAS adulto estándar (quinquenales 16-79, más 80+) — sintéticas para tests.
const BANDS_ADULT: AgeBand[] = [
  { label: "16-19", min: 16, max: 19 },
  { label: "20-24", min: 20, max: 24 },
  { label: "25-29", min: 25, max: 29 },
  { label: "30-34", min: 30, max: 34 },
];

describe("buildAgeSexObserved — caso básico con datos completos", () => {
  it("asigna correctamente hombre y mujer a sus bandas", () => {
    const rows = [
      { sex: "1", birthYear: 2000 }, // edad 24 en 2024 → banda 20-24, male
      { sex: "2", birthYear: 1998 }, // edad 26 en 2024 → banda 25-29, female
    ];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);

    expect(result.assignedCount).toBe(2);
    expect(result.unassignableCount).toBe(0);
    expect(result.cells.find((c) => c.ageBand === "20-24")!.male).toBe(1);
    expect(result.cells.find((c) => c.ageBand === "25-29")!.female).toBe(1);
  });

  it("acepta códigos de texto: hombre/mujer y male/female", () => {
    const rows = [
      { sex: "hombre", birthYear: 2000 },
      { sex: "mujer", birthYear: 2000 },
      { sex: "male", birthYear: 2000 },
      { sex: "female", birthYear: 2000 },
      { sex: "H", birthYear: 2000 },
      { sex: "M", birthYear: 2000 },
    ];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.assignedCount).toBe(6);
    expect(result.unassignableCount).toBe(0);
    const banda = result.cells.find((c) => c.ageBand === "20-24")!;
    expect(banda.male).toBe(3);
    expect(banda.female).toBe(3);
  });
});

describe("buildAgeSexObserved — respondientes sin sexo", () => {
  it("sex undefined → noSex++, no asignado", () => {
    const rows = [{ birthYear: 2000 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableCount).toBe(1);
    expect(result.unassignableBreakdown.noSex).toBe(1);
    expect(result.assignedCount).toBe(0);
  });

  it("sex vacío → noSex++", () => {
    const rows = [{ sex: "", birthYear: 2000 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.noSex).toBe(1);
  });

  it("código GES 3 (otro género) → noSex++, no imputado", () => {
    const rows = [{ sex: "3", birthYear: 2000 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.noSex).toBe(1);
    expect(result.assignedCount).toBe(0);
  });

  it("código GES 4 (prefiero no indicar) → noSex++", () => {
    const rows = [{ sex: "4", birthYear: 2000 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.noSex).toBe(1);
  });
});

describe("buildAgeSexObserved — respondientes sin año de nacimiento", () => {
  it("birthYear undefined con sexo presente → noBirthYear++", () => {
    const rows = [{ sex: "1" }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.noBirthYear).toBe(1);
    expect(result.assignedCount).toBe(0);
  });

  it("birthYear NaN (columna vacía parseada) → noBirthYear++", () => {
    const rows = [{ sex: "2", birthYear: NaN }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.noBirthYear).toBe(1);
  });
});

describe("buildAgeSexObserved — respondientes fuera de bandas", () => {
  it("edad calculada fuera de todas las bandas → outOfBand++", () => {
    // birthYear 1980 → edad 44 en 2024 → fuera de las bandas 16-34
    const rows = [{ sex: "1", birthYear: 1980 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.outOfBand).toBe(1);
    expect(result.assignedCount).toBe(0);
  });

  it("edad negativa → outOfBand++ (no imputada)", () => {
    // birthYear mayor que referenceYear
    const rows = [{ sex: "1", birthYear: 2030 }];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.unassignableBreakdown.outOfBand).toBe(1);
  });
});

describe("buildAgeSexObserved — margen ±1 en límites de banda", () => {
  it("edad = bandMin - 1 asignada a esa banda (margen inferior)", () => {
    // banda 20-24: min=20 → edad 19 debería caer en 16-19 exactamente.
    // pero si las bandas son [20-24] y [25-29] y edad=19, solo matchea 20-24 con margen
    const SOLO_20_24: AgeBand[] = [{ label: "20-24", min: 20, max: 24 }];
    const rows = [{ sex: "1", birthYear: 2005 }]; // edad 19 en 2024
    const result = buildAgeSexObserved(rows, 2024, SOLO_20_24);
    // 19 = 20 - 1 → margen aceptado
    expect(result.assignedCount).toBe(1);
    expect(result.cells[0].male).toBe(1);
  });

  it("edad = bandMax + 1 asignada a esa banda (margen superior)", () => {
    const SOLO_20_24: AgeBand[] = [{ label: "20-24", min: 20, max: 24 }];
    const rows = [{ sex: "2", birthYear: 1999 }]; // edad 25 en 2024 = 24 + 1
    const result = buildAgeSexObserved(rows, 2024, SOLO_20_24);
    expect(result.assignedCount).toBe(1);
    expect(result.cells[0].female).toBe(1);
  });

  it("el margen no supera 1: edad = bandMax + 2 → outOfBand", () => {
    const SOLO_20_24: AgeBand[] = [{ label: "20-24", min: 20, max: 24 }];
    const rows = [{ sex: "1", birthYear: 1998 }]; // edad 26 en 2024 = 24 + 2
    const result = buildAgeSexObserved(rows, 2024, SOLO_20_24);
    expect(result.unassignableBreakdown.outOfBand).toBe(1);
  });

  it("con bandas contiguas, el match exacto tiene prioridad sobre el margen", () => {
    // edad 20: cae exactamente en 20-24, no en 16-19 con margen
    const rows = [{ sex: "1", birthYear: 2004 }]; // edad 20 en 2024
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.cells.find((c) => c.ageBand === "20-24")!.male).toBe(1);
    expect(result.cells.find((c) => c.ageBand === "16-19")!.male).toBe(0);
  });
});

describe("buildAgeSexObserved — casos de borde globales", () => {
  it("lista vacía devuelve células a cero", () => {
    const result = buildAgeSexObserved([], 2024, BANDS_ADULT);
    expect(result.assignedCount).toBe(0);
    expect(result.unassignableCount).toBe(0);
    expect(result.cells).toHaveLength(BANDS_ADULT.length);
    for (const c of result.cells) {
      expect(c.male).toBe(0);
      expect(c.female).toBe(0);
    }
  });

  it("sin bandas devuelve cells vacío y todos no asignables por outOfBand", () => {
    const rows = [{ sex: "1", birthYear: 2000 }];
    const result = buildAgeSexObserved(rows, 2024, []);
    expect(result.cells).toHaveLength(0);
    expect(result.unassignableBreakdown.outOfBand).toBe(1);
  });

  it("la suma assignedCount + unassignableCount = total de filas", () => {
    const rows = [
      { sex: "1", birthYear: 2000 },    // asignado
      { sex: "3", birthYear: 2000 },    // noSex
      { sex: "1" },                     // noBirthYear
      { sex: "1", birthYear: 1960 },    // outOfBand (edad 64, fuera de 16-34)
    ];
    const result = buildAgeSexObserved(rows, 2024, BANDS_ADULT);
    expect(result.assignedCount + result.unassignableCount).toBe(rows.length);
  });

  it("cells tiene el mismo número de entradas que ageBands y preserva el orden", () => {
    const result = buildAgeSexObserved([], 2024, BANDS_ADULT);
    expect(result.cells.map((c) => c.ageBand)).toEqual(
      BANDS_ADULT.map((b) => b.label)
    );
  });
});
