import { describe, it, expect } from "vitest";
import { parseIBSECSV } from "../src/application/ibse/IBSECSVParser";
import type { AgeBand } from "../src/application/sam/buildAgeSexObserved";

// Bandas para mezcla escolar+adulto, como en el IBSE Atarfe real.
const BANDS: AgeBand[] = [
  { label: "13-18", min: 13, max: 18 },
  { label: "19-29", min: 19, max: 29 },
  { label: "30-39", min: 30, max: 39 },
  { label: "40-88", min: 40, max: 88 },
];

// CSV mínimo sin columnas demográficas (cabecera canónica IBSE).
const CSV_NO_DEMO = [
  "record_id,monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona",
  "1,2,70.5,75.0,65.0,68.0,74.0",
  "2,2,60.0,62.0,58.0,55.0,65.0",
].join("\n");

// CSV con columnas demográficas (sexo + edad).
function makeCsvWithDemo(rows: string[]): string {
  const header = "record_id,monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,sexo,edad";
  return [header, ...rows].join("\n");
}

// Fila válida helper: scores completos, complete=2, con sexo y edad configurables.
function row(
  id: number,
  complete: string,
  sexo: string,
  edad: string,
  total = "70.0",
  vinculo = "72.0",
  situacion = "68.0",
  control = "70.0",
  persona = "70.0"
): string {
  return `${id},${complete},${total},${vinculo},${situacion},${control},${persona},${sexo},${edad}`;
}

describe("parseIBSECSV — sin columnas demográficas", () => {
  it("salida idéntica cuando no hay columnas sexo/edad y no se pasan opciones", () => {
    const sinOpciones = parseIBSECSV(CSV_NO_DEMO);
    const conOpciones = parseIBSECSV(CSV_NO_DEMO, { ageBands: BANDS });
    expect(sinOpciones.aggregates).toEqual(conOpciones.aggregates);
    expect(sinOpciones.warnings).toEqual(conOpciones.warnings);
    expect(sinOpciones.ageSexObserved).toBeUndefined();
    expect(conOpciones.ageSexObserved).toBeUndefined();
  });

  it("no genera ageSexObserved si el CSV no tiene columnas demográficas", () => {
    const result = parseIBSECSV(CSV_NO_DEMO, { ageBands: BANDS });
    expect(result.ageSexObserved).toBeUndefined();
  });
});

describe("parseIBSECSV — sin opciones ageBands", () => {
  it("no genera ageSexObserved aunque el CSV tenga columnas demográficas", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "16")]);
    const result = parseIBSECSV(csv);
    expect(result.ageSexObserved).toBeUndefined();
  });
});

describe("parseIBSECSV — con columnas demográficas y ageBands", () => {
  it("asigna participantes válidos a sus celdas", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "15"),  // male, 13-18
      row(2, "2", "2", "25"),  // female, 19-29
      row(3, "2", "1", "45"),  // male, 40-88
    ]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved).toBeDefined();
    const obs = result.ageSexObserved!;
    expect(obs.assignedCount).toBe(3);
    expect(obs.cells.find((c) => c.ageBand === "13-18")!.male).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "19-29")!.female).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "40-88")!.male).toBe(1);
  });

  it("ageSexObserved no afecta los agregados (son independientes)", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "15"),
      row(2, "2", "2", "25"),
    ]);
    const conDemo = parseIBSECSV(csv, { ageBands: BANDS });
    const sinDemo = parseIBSECSV(CSV_NO_DEMO);
    // Los agregados siguen la misma lógica; la distribución es adicional.
    expect(conDemo.aggregates.nValid).toBe(2);
    expect(sinDemo.aggregates.nValid).toBe(2);
  });

  it("sexo=3 (otro género) → noSex, no asignado", () => {
    const csv = makeCsvWithDemo([row(1, "2", "3", "20")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.noSex).toBe(1);
    expect(result.ageSexObserved!.assignedCount).toBe(0);
  });

  it("sexo=4 (prefiero no indicar) → noSex", () => {
    const csv = makeCsvWithDemo([row(1, "2", "4", "20")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.noSex).toBe(1);
  });

  it("sexo vacío → noSex", () => {
    const csv = makeCsvWithDemo([row(1, "2", "", "20")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.noSex).toBe(1);
  });

  it("edad vacía → noAge=0 y noBirthYear=1 (se almacena como age=undefined → ruta noBirthYear)", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    // Edad vacía → parseInt("") = NaN → se almacena como age=undefined → noBirthYear
    const bd = result.ageSexObserved!.unassignableBreakdown;
    expect(bd.noBirthYear).toBe(1);
    expect(result.ageSexObserved!.assignedCount).toBe(0);
  });

  it("edad=1993 (captura incorrecta: año en lugar de edad) → outOfBand declarado", () => {
    const csv = makeCsvWithDemo([row(1, "2", "2", "1993")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.outOfBand).toBe(1);
    expect(result.ageSexObserved!.assignedCount).toBe(0);
  });

  it("edad=12 (menor del límite inferior de banda) → outOfBand", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "12")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.outOfBand).toBe(1);
  });

  it("edad=13 (límite inferior exacto) → asignada a 13-18", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "13")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.assignedCount).toBe(1);
    expect(result.ageSexObserved!.cells.find((c) => c.ageBand === "13-18")!.male).toBe(1);
  });

  it("edad=18 (límite superior de primera banda) → asignada a 13-18", () => {
    const csv = makeCsvWithDemo([row(1, "2", "2", "18")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.cells.find((c) => c.ageBand === "13-18")!.female).toBe(1);
  });

  it("edad=19 (inicio de banda adulta) → asignada a 19-29", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "19")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.cells.find((c) => c.ageBand === "19-29")!.male).toBe(1);
  });

  it("edad=88 (límite superior) → asignada a 40-88", () => {
    const csv = makeCsvWithDemo([row(1, "2", "2", "88")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.cells.find((c) => c.ageBand === "40-88")!.female).toBe(1);
  });

  it("edad=89 → outOfBand", () => {
    const csv = makeCsvWithDemo([row(1, "2", "1", "89")]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.unassignableBreakdown.outOfBand).toBe(1);
  });

  it("mezcla escolar+adultos: distribución completa declarada", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "14"),   // escolar male → 13-18
      row(2, "2", "2", "16"),   // escolar female → 13-18
      row(3, "2", "1", "22"),   // adulto male → 19-29
      row(4, "2", "2", "55"),   // adulto female → 40-88
      row(5, "2", "1", "1993"), // error captura → outOfBand
      row(6, "2", "", "20"),    // sin sexo → noSex
    ]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    const obs = result.ageSexObserved!;
    expect(obs.assignedCount).toBe(4);
    expect(obs.unassignableBreakdown.outOfBand).toBe(1);
    expect(obs.unassignableBreakdown.noSex).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "13-18")!.male).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "13-18")!.female).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "19-29")!.male).toBe(1);
    expect(obs.cells.find((c) => c.ageBand === "40-88")!.female).toBe(1);
  });

  it("filas con complete≠2 no contribuyen a ageSexObserved", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "20"),  // completo → incluido
      row(2, "1", "2", "25"),  // incompleto → excluido de demográficos
      row(3, "0", "1", "30"),  // incompleto → excluido de demográficos
    ]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    expect(result.ageSexObserved!.assignedCount).toBe(1);
    // Solo la fila 1 (complete=2) debe contribuir.
    expect(result.ageSexObserved!.cells.find((c) => c.ageBand === "19-29")!.male).toBe(1);
  });

  it("declara en warnings cuántos no asignados y por qué", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "20"),   // asignado
      row(2, "2", "", "25"),    // noSex
      row(3, "2", "2", "1993"), // outOfBand
    ]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    const warning = result.warnings.find((w) => w.includes("no asignados"));
    expect(warning).toBeDefined();
    expect(warning).toContain("sin sexo reconocible");
    expect(warning).toContain("fuera de bandas");
  });

  it("sin no-asignados no genera warning de distribución", () => {
    const csv = makeCsvWithDemo([
      row(1, "2", "1", "20"),
      row(2, "2", "2", "15"),
    ]);
    const result = parseIBSECSV(csv, { ageBands: BANDS });
    const warning = result.warnings.find((w) => w.includes("no asignados"));
    expect(warning).toBeUndefined();
  });
});
