/**
 * SAM conectado al IBSE: del CSV con sexo y edad al panel de representatividad.
 * Cubre assessSample con recuento agregado, la persistencia del campo opcional
 * y la interfaz del IBSE con y sin edad y sexo.
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseIBSECSV } from "../src/application/ibse/IBSECSVParser";
import { createIBSEStudy } from "../src/domain/ibse";
import { assessSample, parseAgeBandLabel } from "../src/application/sam/assessSample";
import { getPopulationReferenceSet } from "../src/application/sam/populationReferenceRegistry";
import { IBSEPanel } from "../src/ui/components/IBSEPanel";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { ATARFE_POPULATION_2025 } from "../fixtures/population/atarfe-population-2025";

// Solo para comprobar en el test que una muestra proporcional coincide con el padrón.
const meanAbsDiff = (cells: ReadonlyArray<{ diffPp: number | null }>) => {
  const d = cells.filter((c) => c.diffPp !== null).map((c) => Math.abs(c.diffPp!));
  return d.reduce((s, x) => s + x, 0) / d.length;
};

const MATRIX = ATARFE_POPULATION_2025.ageSexMatrix!;
const BANDS = MATRIX.map((c) => parseAgeBandLabel(c.ageBand)!);

const HEADER =
  "record_id,monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,sexo,edad";

/** CSV cuya distribución por edad y sexo reproduce el padrón a escala 1/60, solo de 20 años en adelante. */
function csvAdults(): string {
  const rows: string[] = [HEADER];
  let id = 1;
  for (const c of MATRIX) {
    const b = parseAgeBandLabel(c.ageBand)!;
    if (b.min < 20) continue;
    for (let i = 0; i < Math.round(c.male / 60); i++) rows.push(`${id++},2,70,70,70,70,70,1,${b.min}`);
    for (let i = 0; i < Math.round(c.female / 60); i++) rows.push(`${id++},2,70,70,70,70,70,2,${b.min}`);
  }
  return rows.join("\n");
}

const AGG = { n: 1, nValid: 1, meanTotal: 70, meanFactorVinculo: 70, meanFactorSituacion: 70, meanFactorControl: 70, meanFactorPersona: 70 };

describe("assessSample con recuento agregado (observedCells)", () => {
  const parsed = parseIBSECSV(csvAdults(), { ageBands: BANDS });
  const cells = parsed.ageSexObserved!.cells;

  it("con rango 20-99 compara con el padrón recortado y el tamaño es el de las bandas conservadas", () => {
    const r = assessSample({ instrumentId: "ibse", municipalityId: "atarfe", observedCells: cells, ageRange: { min: 20, max: 99 } });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    const total = cells.filter((c) => parseAgeBandLabel(c.ageBand)!.min >= 20 && parseAgeBandLabel(c.ageBand)!.max <= 99)
      .reduce((s, c) => s + c.male + c.female, 0);
    expect(r.assessment.nObserved).toBe(total);
    expect(meanAbsDiff(r.assessment.composition!.cells)).toBeLessThan(1);
  });

  it("con todas las edades, una muestra solo adulta se desvía y se ve en la desviación por celda", () => {
    const r = assessSample({ instrumentId: "ibse", municipalityId: "atarfe", observedCells: cells });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    const child = r.assessment.composition!.cells.find((c) => c.ageBand === "5-9" && c.sex === "male")!;
    expect(child.diffPp).toBeLessThan(0);
  });

  it("declara los participantes fuera del rango y no los incluye", () => {
    const withKids = cells.map((c) => (c.ageBand === "5-9" ? { ...c, male: 4, female: 3 } : c));
    const r = assessSample({ instrumentId: "ibse", municipalityId: "atarfe", observedCells: withKids, ageRange: { min: 20, max: 99 } });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.notes.join(" ")).toContain("7 participantes");
    expect(r.notes.join(" ")).toContain("5-9");
  });

  it("bandas incompatibles con el padrón: no evaluable, sin rellenar ceros", () => {
    const r = assessSample({ instrumentId: "ibse", municipalityId: "atarfe", observedCells: cells.slice(0, 5) });
    expect(r.status).toBe("not-evaluable");
  });
});

describe("el recuento por edad y sexo del IBSE suma los registros válidos", () => {
  it("una fila completa sin puntuaciones numéricas no entra en el recuento", () => {
    const csv = [
      HEADER,
      "1,2,70,70,70,70,70,1,30",
      "2,2,,70,70,70,70,2,31", // completa pero sin puntuación total: no válida
      "3,0,70,70,70,70,70,2,32", // incompleta
      "4,2,60,60,60,60,60,2,1993", // edad que no es edad
    ].join("\n");
    const p = parseIBSECSV(csv, { ageBands: BANDS });
    expect(p.aggregates.nValid).toBe(2);
    expect(p.ageSexObserved!.assignedCount).toBe(1);
    expect(p.ageSexObserved!.unassignableBreakdown.outOfBand).toBe(1);
    expect(p.ageSexObserved!.assignedCount + p.ageSexObserved!.unassignableCount).toBe(p.aggregates.nValid);
  });
});

describe("persistencia del recuento edad×sexo del IBSE", () => {
  const parsed = parseIBSECSV(csvAdults(), { ageBands: BANDS });
  const study = createIBSEStudy({
    municipalityId: "atarfe",
    sourceFileName: "x.csv",
    aggregates: parsed.aggregates,
    ageSexObserved: {
      cells: parsed.ageSexObserved!.cells,
      assignedCount: parsed.ageSexObserved!.assignedCount,
      unassignableCount: parsed.ageSexObserved!.unassignableCount,
    },
    methodologicalCautions: [],
  });
  const empty = createCompleteMunicipalityWorkspace({ id: "atarfe", name: "Atarfe", province: "Granada", ineCode: "18022" });
  // La carga exige el documento con la etiqueta del IBSE; sin él, el estudio se descarta por trazabilidad.
  const base = {
    ...empty,
    repository: {
      ...empty.repository,
      documents: [
        {
          id: "doc-ibse",
          municipalityId: "atarfe",
          kind: "redcap-export",
          title: "IBSE - x.csv",
          status: "uploaded",
          source: { system: "Importación REDCap IBSE", collectedAt: "2026-10-18T00:00:00.000Z" },
          sourceFileName: "x.csv",
          tags: ["redcap-export", "ibse"],
          createdAt: "2026-10-18T00:00:00.000Z",
          updatedAt: "2026-10-18T00:00:00.000Z",
        },
      ],
    },
  } as unknown as typeof empty;

  it("se conserva tras serializar y leer", () => {
    const w = { ...base, ibseStudy: study };
    const back = parseWorkspaceJSON(serializeWorkspaceForStorage(w));
    expect(back).not.toBeNull();
    expect(back?.ibseStudy).toBeDefined();
    expect(back?.ibseStudy?.ageSexObserved?.cells.length).toBe(MATRIX.length);
  });

  it("si llega con forma inválida se descarta, no se repara", () => {
    const w = { ...base, ibseStudy: { ...study, ageSexObserved: { cells: [{ ageBand: "0-4", male: -1, female: 2 }], assignedCount: 1, unassignableCount: 0 } } };
    const back = parseWorkspaceJSON(serializeWorkspaceForStorage(w as never));
    expect(back?.ibseStudy).toBeDefined();
    expect(back?.ibseStudy?.ageSexObserved).toBeUndefined();
  });
});

describe("interfaz del IBSE", () => {
  const parsed = parseIBSECSV(csvAdults(), { ageBands: BANDS });
  const mk = (withAgeSex: boolean) =>
    createIBSEStudy({
      municipalityId: "atarfe",
      sourceFileName: "x.csv",
      aggregates: parsed.aggregates,
      sampleScope: "16-plus",
      ageSexObserved: withAgeSex
        ? { cells: parsed.ageSexObserved!.cells, assignedCount: parsed.ageSexObserved!.assignedCount, unassignableCount: 0 }
        : undefined,
      methodologicalCautions: [],
    });
  const html = (s: ReturnType<typeof mk>) => renderToStaticMarkup(createElement(IBSEPanel, { ibseStudy: s, municipalityName: "Atarfe" }));

  it("con edad y sexo muestra la tripirámide y el selector de rango", () => {
    const h = html(mk(true));
    expect(h).toContain("Tripirámide muestral");
    expect(h).toContain("Rango de edad del padrón");
  });

  it("sin edad y sexo declara el motivo y no dibuja pirámides", () => {
    const h = html(mk(false));
    expect(h).toContain("no conserva la edad y el sexo");
    expect(h).not.toContain("sam-tripyramid__bars");
  });

  it("para un municipio sin padrón desglosado, no evaluable", () => {
    expect(getPopulationReferenceSet("loja").allAges).toBeUndefined();
    const s = createIBSEStudy({ municipalityId: "loja", sourceFileName: "x", aggregates: AGG, ageSexObserved: { cells: [{ ageBand: "0-4", male: 1, female: 1 }], assignedCount: 2, unassignableCount: 0 }, methodologicalCautions: [] });
    expect(html(s)).toContain("No hay padrón por edad y sexo verificado");
  });
});
