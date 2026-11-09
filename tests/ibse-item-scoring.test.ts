import { describe, expect, it } from "vitest";
import { parseIBSECSV, scoreIBSEItems, IBSE_ITEM_SCORING_CAUTION } from "../src/application/ibse/IBSECSVParser";

const items = ["ibse_deprimido", "ibse_feliz", "ibse_solo", "ibse_disfrutar", "ibse_energia", "ibse_tranquilo", "ibse_optimista", "ibse_bienmismo"];
const row = (v: number[]) => Object.fromEntries(items.map((k, i) => [k, String(v[i])]));

describe("IBSE: puntuación por ítems en escala común 0–100", () => {
  it("la peor respuesta posible da 0 en los cuatro factores y en el total", () => {
    // deprimido=4, feliz=1, solo=4, disfrutar=1, energía=1, tranquilo=1, optimista=5, bien=5
    expect(scoreIBSEItems(row([4, 1, 4, 1, 1, 1, 5, 5]))).toEqual({ total: 0, vinculo: 0, situacion: 0, control: 0, persona: 0 });
  });

  it("la mejor respuesta posible da 100 en los cuatro factores y en el total", () => {
    expect(scoreIBSEItems(row([1, 4, 1, 4, 4, 4, 1, 1]))).toEqual({ total: 100, vinculo: 100, situacion: 100, control: 100, persona: 100 });
  });

  it("un valor fuera de escala o vacío invalida el registro", () => {
    expect(scoreIBSEItems(row([5, 1, 1, 1, 1, 1, 1, 1]))).toBeUndefined();
    expect(scoreIBSEItems({ ...row([1, 1, 1, 1, 1, 1, 1, 1]), ibse_feliz: "" })).toBeUndefined();
    expect(scoreIBSEItems({ ...row([1, 1, 1, 1, 1, 1, 1, 1]), ibse_feliz: "2x" })).toBeUndefined();
  });

  it("con los ocho ítems en el CSV no usa las columnas calculadas por REDCap", () => {
    const header = ["monitor_ibse_complete", "sexo", "edad", ...items, "ibse_factor_vinculo", "ibse_factor_situacion", "ibse_factor_control", "ibse_factor_persona", "ibse_total"].join(",");
    // Columnas REDCap con el defecto de escala (Vínculo máx. 75; Situación mín. 25).
    const csv = [header, "2,1,40,1,4,1,4,4,4,1,1,75,100,100,100,93.75"].join("\n");
    const parsed = parseIBSECSV(csv);
    expect(parsed.aggregates.meanFactorVinculo).toBe(100);
    expect(parsed.aggregates.meanTotal).toBe(100);
    expect(parsed.methodologicalCautions).toContain(IBSE_ITEM_SCORING_CAUTION);
  });

  it("sin ítems y con la firma de REDCap convierte a la escala común", () => {
    const csv = ["ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete", "62.5,75,25,50,53.125,2"].join("\n");
    const parsed = parseIBSECSV(csv);
    expect(parsed.aggregates.meanFactorVinculo).toBe(83.3);
    expect(parsed.aggregates.meanFactorSituacion).toBe(66.7);
    expect(parsed.aggregates.meanFactorControl).toBe(0);
    expect(parsed.methodologicalCautions).not.toContain(IBSE_ITEM_SCORING_CAUTION);
  });

  it("sin la firma de REDCap (valores fuera de la rejilla de 12,5) lee las columnas tal cual", () => {
    const csv = ["ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete", "60,50,30,90,57.5,2"].join("\n");
    expect(parseIBSECSV(csv).aggregates.meanFactorVinculo).toBe(60);
  });
});

describe("IBSE: conversión exacta de las puntuaciones de REDCap", () => {
  it("sin ítems, Atarfe da los mismos resultados que con ítems", async () => {
    const { readFileSync } = await import("node:fs");
    const full = readFileSync("fixtures/ibse-atarfe.csv", "utf8");
    const computedOnly = full.split("\n").map((l) => l.split(",").slice(11).join(",")).join("\n");
    expect(computedOnly.split("\n")[0]).toBe("ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete");
    expect(parseIBSECSV(computedOnly).aggregates).toEqual(parseIBSECSV(full).aggregates);
  });

  it("no convierte columnas que ya están en la escala común", () => {
    const csv = ["ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete", "100,0,50,50,50,2"].join("\n");
    expect(parseIBSECSV(csv).aggregates.meanFactorVinculo).toBe(100);
  });
});
