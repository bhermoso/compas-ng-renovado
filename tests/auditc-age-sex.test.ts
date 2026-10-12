import { describe, it, expect } from "vitest";
import { parseAUDITCCSV } from "../src/application/auditc/AUDITCCSVParser";
import type { AgeBand } from "../src/application/sam/buildAgeSexObserved";

const BANDS: AgeBand[] = [
  { label: "16-34", min: 16, max: 34 },
  { label: "35-54", min: 35, max: 54 },
  { label: "55+",   min: 55, max: 99 },
];

// CSV sin columnas demográficas — igual que el fixture original
const CSV_SIN_DEMO = [
  "auditc_q1,auditc_q2,auditc_q3",
  "1,0,0",
  "2,1,1",
].join("\n");

// CSV con columnas demográficas (export REDCap completo simulado)
const CSV_CON_DEMO = [
  "sexo,anio_nacimiento,auditc_q1,auditc_q2,auditc_q3",
  "1,1990,1,0,0",   // hombre, edad 34 en 2024 → banda 16-34
  "2,1975,2,1,1",   // mujer,  edad 49 en 2024 → banda 35-54
  "3,1990,1,0,0",   // sexo no binario → noSex
  "1,,1,0,0",       // sin birthYear → noBirthYear
  "1,1940,1,0,0",   // edad 84 → banda 55+
].join("\n");

describe("parseAUDITCCSV — compatibilidad sin opciones demográficas", () => {
  it("sin opciones: ageSexObserved es undefined", () => {
    const result = parseAUDITCCSV(CSV_SIN_DEMO);
    expect(result.ageSexObserved).toBeUndefined();
  });

  it("sin opciones: los agregados siguen siendo correctos", () => {
    const result = parseAUDITCCSV(CSV_SIN_DEMO);
    expect(result.aggregates.n).toBe(2);
    expect(result.aggregates.nValid).toBe(2);
  });

  it("con ageBands pero sin columnas demo en CSV: ageSexObserved undefined", () => {
    const result = parseAUDITCCSV(CSV_SIN_DEMO, { ageBands: BANDS });
    expect(result.ageSexObserved).toBeUndefined();
  });
});

describe("parseAUDITCCSV — distribución edad×sexo cuando las columnas existen", () => {
  const result = parseAUDITCCSV(CSV_CON_DEMO, { ageBands: BANDS, referenceYear: 2024 });

  it("ageSexObserved está presente", () => {
    expect(result.ageSexObserved).toBeDefined();
  });

  it("los agregados de los ítems no se ven afectados", () => {
    expect(result.aggregates.n).toBe(5);
    expect(result.aggregates.nValid).toBe(5);
  });

  it("assignedCount = 3 (hombre 1990, mujer 1975, hombre 1940)", () => {
    expect(result.ageSexObserved!.assignedCount).toBe(3);
  });

  it("unassignableCount = 2 (noSex + noBirthYear)", () => {
    expect(result.ageSexObserved!.unassignableCount).toBe(2);
    expect(result.ageSexObserved!.unassignableBreakdown.noSex).toBe(1);
    expect(result.ageSexObserved!.unassignableBreakdown.noBirthYear).toBe(1);
  });

  it("banda 16-34: 1 hombre, 0 mujeres", () => {
    const banda = result.ageSexObserved!.cells.find((c) => c.ageBand === "16-34")!;
    expect(banda.male).toBe(1);
    expect(banda.female).toBe(0);
  });

  it("banda 35-54: 0 hombres, 1 mujer", () => {
    const banda = result.ageSexObserved!.cells.find((c) => c.ageBand === "35-54")!;
    expect(banda.male).toBe(0);
    expect(banda.female).toBe(1);
  });

  it("banda 55+: 1 hombre (born 1940, edad 84)", () => {
    const banda = result.ageSexObserved!.cells.find((c) => c.ageBand === "55+")!;
    expect(banda.male).toBe(1);
    expect(banda.female).toBe(0);
  });

  it("cells tiene el mismo orden que las ageBands proporcionadas", () => {
    const labels = result.ageSexObserved!.cells.map((c) => c.ageBand);
    expect(labels).toEqual(BANDS.map((b) => b.label));
  });
});

describe("parseAUDITCCSV — columnas demo presentes pero sin ageBands (no calcula)", () => {
  it("sin ageBands en opciones: ageSexObserved undefined aunque el CSV tenga las columnas", () => {
    const result = parseAUDITCCSV(CSV_CON_DEMO);
    expect(result.ageSexObserved).toBeUndefined();
  });
});

describe("parseAUDITCCSV — columnas demo presentes, ageBands presentes, sin referenceYear", () => {
  it("ageSexObserved undefined cuando falta referenceYear", () => {
    const result = parseAUDITCCSV(CSV_CON_DEMO, { ageBands: BANDS });
    expect(result.ageSexObserved).toBeUndefined();
  });

  it("warnings incluye aviso de referenceYear no proporcionado", () => {
    const result = parseAUDITCCSV(CSV_CON_DEMO, { ageBands: BANDS });
    expect(result.warnings.some((w) => w.includes("referenceYear"))).toBe(true);
  });
});
