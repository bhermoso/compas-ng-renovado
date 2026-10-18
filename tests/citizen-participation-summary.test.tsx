/**
 * Priorización temática: edad y sexo del CSV, resumen de participación y SAM.
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { parseThematicPrioritisationCSV } from "../src/application/thematic-prioritisation/ThematicPrioritisationCSVParser";
import { ageBandsForMunicipality } from "../src/application/sam/ageBandsForMunicipality";
import { CitizenParticipationSummary } from "../src/ui/components/CitizenParticipationSummary";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";

const TEMAS = Array.from({ length: 10 }, (_, i) => `temas___${i + 1}`);
const HEADER = ["record_id", "sexo", "edad", ...TEMAS, "papeleta_pri_tematica_complete"].join(",");
function row(id: number, sexo: string, edad: string, marcados: number[], complete = "2") {
  const t = TEMAS.map((_, i) => (marcados.includes(i + 1) ? "1" : "0"));
  return [id, sexo, edad, ...t, complete].join(",");
}
const CSV = [
  HEADER,
  row(1, "1", "34", [1, 2, 3]),
  row(2, "2", "35", [3, 4]),
  row(3, "2", "71", [3, 8]),
  row(4, "1", "1993", [1]), // edad que no es edad
  row(5, "", "40", [2]), // sin sexo
  row(6, "2", "50", [1], "0"), // incompleta
].join("\n");

describe("parseThematicPrioritisationCSV con edad y sexo", () => {
  it("sin opciones no recoge edad ni sexo (compatibilidad)", () => {
    const r = parseThematicPrioritisationCSV(CSV, "x.csv");
    expect(r.partialStudy.ageSexObserved).toBeUndefined();
    expect(r.partialStudy.completeRecords).toBe(5);
  });

  it("con bandas recoge solo papeletas completas y declara las no asignables", () => {
    const r = parseThematicPrioritisationCSV(CSV, "x.csv", { ageBands: ageBandsForMunicipality("zagra") });
    const o = r.partialStudy.ageSexObserved!;
    expect(o.assignedCount).toBe(3);
    expect(o.unassignableCount).toBe(2);
    expect(o.assignedCount + o.unassignableCount).toBe(r.partialStudy.completeRecords);
    expect(r.warnings.join(" ")).toContain("fuera de bandas");
    expect(r.warnings.join(" ")).toContain("sin sexo");
  });

  it("sin columnas sexo y edad no inventa la distribución", () => {
    const csv = [["record_id", ...TEMAS, "papeleta_pri_tematica_complete"].join(","), "1,1,0,0,0,0,0,0,0,0,0,2"].join("\n");
    const r = parseThematicPrioritisationCSV(csv, "x.csv", { ageBands: ageBandsForMunicipality("atarfe") });
    expect(r.partialStudy.ageSexObserved).toBeUndefined();
  });
});

describe("ageBandsForMunicipality", () => {
  it("usa las bandas del padrón si existe y las quinquenales estándar si no", () => {
    expect(ageBandsForMunicipality("atarfe").length).toBe(21);
    const std = ageBandsForMunicipality("zagra");
    expect(std.length).toBe(21);
    expect(std[0].label).toBe("0-4");
    expect(std[20].label).toBe("100+");
  });
});

describe("CitizenParticipationSummary", () => {
  const study = (mun: string) => ({
    municipalityId: mun,
    importedAt: "2026-10-18T00:00:00.000Z",
    ...parseThematicPrioritisationCSV(CSV, "x.csv", { ageBands: ageBandsForMunicipality(mun) }).partialStudy,
  });
  const html = (mun: string, s = study(mun)) =>
    renderToStaticMarkup(createElement(CitizenParticipationSummary, { study: s, municipalityId: mun, municipalityName: mun }));

  it("no se muestra sin estudio o sin papeletas completas", () => {
    expect(renderToStaticMarkup(createElement(CitizenParticipationSummary, { municipalityId: "zagra" }))).toBe("");
  });

  it("con padrón (Atarfe) incluye la evaluación SAM", () => {
    const h = html("atarfe");
    expect(h).toContain("Temas marcados");
    expect(h).toContain("Rango de edad del padrón");
  });

  it("sin padrón (Zagra) muestra solo el recuento y declara no evaluable, sin estimar", () => {
    const h = html("zagra");
    expect(h).toContain("No evaluable: no hay padrón");
    expect(h).toContain("Participantes por banda de edad y sexo");
    expect(h).not.toContain("sam-tripyramid");
    expect(h).toContain("no se pueden asignar");
  });

  it("si el CSV no traía edad y sexo lo declara", () => {
    const s = { ...study("zagra"), ageSexObserved: undefined };
    expect(html("zagra", s)).toContain("no incluía las columnas");
  });

  it("el CSS no usa colores literales", () => {
    const css = readFileSync("src/ui/components/CitizenParticipationSummary.css", "utf8");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("persistencia", () => {
  const empty = createCompleteMunicipalityWorkspace({ id: "atarfe", name: "Atarfe", province: "Granada", ineCode: "18022" });
  const st = (o: unknown) => ({
    municipalityId: "atarfe", sourceFileName: "x", importedAt: "a", totalRecords: 1, completeRecords: 1,
    ranking: [], topFiveTopicIds: [], methodologicalCautions: [], ageSexObserved: o,
  });
  const w = (o: unknown) => ({ ...empty, thematicPrioritisationStudy: st(o) }) as never;

  it("conserva una distribución válida", () => {
    const back = parseWorkspaceJSON(serializeWorkspaceForStorage(w({ cells: [{ ageBand: "0-4", male: 1, female: 2 }], assignedCount: 3, unassignableCount: 0 })));
    expect(back?.thematicPrioritisationStudy?.ageSexObserved?.cells.length).toBe(1);
  });
  it("descarta una distribución con forma inválida, sin repararla", () => {
    const back = parseWorkspaceJSON(serializeWorkspaceForStorage(w({ cells: [{ ageBand: "0-4", male: -2, female: 2 }], assignedCount: 1, unassignableCount: 0 })));
    expect(back?.thematicPrioritisationStudy).toBeDefined();
    expect(back?.thematicPrioritisationStudy?.ageSexObserved).toBeUndefined();
  });
});
