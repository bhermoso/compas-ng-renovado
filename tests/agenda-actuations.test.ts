import { describe, expect, it } from "vitest";
import {
  addManualActuation, buildActuationBoard, duplicateManualActuation, importActuationsFromPlan,
  moveActuation, readActuation, removeActuation, updateActuationBlock,
} from "../src/application/agenda/agendaActuations";
import { createIndicatorWorksheet, worksheetKey, type IndicatorWorksheet } from "../src/domain/action-plan-catalog/IndicatorWorksheet";
import type { AgendaActuation } from "../src/domain/agenda/AgendaActuation";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { isEmptyWorkspaceForPersistenceGuard } from "../src/application/workspace/isEmptyWorkspaceForPersistenceGuard";

const NOW = "2026-10-19T10:00:00.000Z";
const ctx = { municipalityId: "m", moduleId: "mod", moduleVersion: "1", line: "l", generalObjective: "g", objective: "o", indicatorCode: "I1", indicator: "i", unit: "%", source: "s" } as never;
const sheet = (): IndicatorWorksheet => ({
  ...createIndicatorWorksheet(ctx),
  actions: [
    { id: "a1", values: { name: "Paseos", owner: "Distrito", contribution: "Caminar en grupo", schedule: "mensual", population: "Mayores", resources: "2 monitores" }, returns: [] },
    { id: "a2", values: { name: "Taller de memoria" }, returns: [] },
  ],
  consolidations: [{ id: "c1", status: "reviewed", values: { result: "42 %" } }],
});
let n = 0;
const id = () => `id-${++n}`;
const manual = (list: AgendaActuation[], name: string, setting?: AgendaActuation["setting"]) =>
  addManualActuation(list, { id: id(), municipalityId: "m", name, setting, now: NOW });

describe("alta manual", () => {
  it("solo exige el nombre y entra sin asignar si no se indica entorno", () => {
    const list = manual([], "  Charla  ");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "Charla", setting: null, origin: "manual" });
    expect(list[0].tracking.status).toBe("planificada");
    expect(list[0].result.nextCycleDecision).toBe("no-decidido");
  });
  it("sin nombre no crea nada", () => {
    expect(manual([], "   ")).toEqual([]);
  });
  it("no asigna trimestre ni prioridad", () => {
    const a = manual([], "X")[0];
    expect(a.identification.quarter).toBeUndefined();
    expect(a.tracking.priority).toBeUndefined();
  });
});

describe("volcado desde el plan", () => {
  const input = { municipalityId: "m", worksheets: [sheet()], now: NOW, newId: id };
  it("crea un registro vinculado por actuación, sin asignar y sin copiar datos", () => {
    const { list, added } = importActuationsFromPlan([], input);
    expect(added).toBe(2);
    expect(list.every((a) => a.setting === null && a.origin === "action-plan" && a.name === undefined)).toBe(true);
    expect(list[0].linkedAction).toEqual({ worksheetKey: worksheetKey((sheet() as IndicatorWorksheet).context), actionId: "a1" });
    expect(list[0].responsibles).toEqual({});
  });
  it("no duplica al repetirlo", () => {
    const first = importActuationsFromPlan([], input).list;
    const again = importActuationsFromPlan(first, input);
    expect(again.added).toBe(0);
    expect(again.list).toHaveLength(2);
  });
});

describe("lectura del plan", () => {
  const ws = [sheet()];
  const linked = importActuationsFromPlan([], { municipalityId: "m", worksheets: ws, now: NOW, newId: id }).list;
  it("lee nombre, responsable, calendario e indicador vinculado del plan", () => {
    const r = readActuation(linked[0], ws);
    expect(r).toMatchObject({ orphan: false, name: "Paseos", responsible: "Distrito", schedule: "mensual", linkedIndicator: expect.objectContaining({ code: expect.any(String) }) });
  });
  it("no atribuye a la actuación el resultado consolidado del indicador", () => {
    const r = readActuation(linked[0], ws);
    expect(JSON.stringify(r)).not.toContain("42 %");
    expect(r.linkedIndicator).toEqual({ code: "I1", name: "i" });
  });
  it("si la actuación ya no está en el plan, lo declara y no inventa", () => {
    const r = readActuation(linked[0], []);
    expect(r.orphan).toBe(true);
    expect(r.responsible).toBeUndefined();
  });
  it("el nombre de un registro vinculado no se edita en la agenda", () => {
    const out = updateActuationBlock(linked, linked[0].id, { block: "name", values: "Otro" }, NOW);
    expect(out[0].name).toBeUndefined();
  });
});

describe("edición, movimiento, duplicado y baja", () => {
  it("edita un bloque sin tocar los demás", () => {
    const l = manual([], "A");
    const out = updateActuationBlock(l, l[0].id, { block: "result", values: { barriers: "Horario" } }, NOW);
    expect(out[0].result).toEqual({ barriers: "Horario", nextCycleDecision: "no-decidido" });
    expect(out[0].tracking).toEqual(l[0].tracking);
  });
  it("mover cambia el entorno y renumera origen y destino", () => {
    let l = manual([], "A", "sanitario");
    l = manual(l, "B", "sanitario");
    l = manual(l, "C", "comunitario");
    const a = l[0].id, b = l[1].id, c = l[2].id;
    l = moveActuation(l, a, "comunitario", 0, NOW);
    const board = buildActuationBoard(l);
    expect(board.columns.comunitario.map((x) => x.id)).toEqual([a, c]);
    expect(board.columns.sanitario.map((x) => [x.id, x.order])).toEqual([[b, 0]]);
    expect(board.columns.comunitario.map((x) => x.order)).toEqual([0, 1]);
  });
  it("reordenar dentro del mismo entorno", () => {
    let l = manual([], "A", "laboral");
    l = manual(l, "B", "laboral");
    l = manual(l, "C", "laboral");
    const [a, b, c] = l.map((x) => x.id);
    l = moveActuation(l, c, "laboral", 0, NOW);
    expect(buildActuationBoard(l).columns.laboral.map((x) => x.id)).toEqual([c, a, b]);
  });
  it("mover a «sin asignar» es posible y un índice fuera de rango se acota", () => {
    let l = manual([], "A", "educativo");
    l = moveActuation(l, l[0].id, null, 99, NOW);
    expect(buildActuationBoard(l).unassigned).toHaveLength(1);
  });
  it("duplicar solo registros manuales y sin copiar el resultado", () => {
    let l = manual([], "A", "sanitario");
    l = updateActuationBlock(l, l[0].id, { block: "result", values: { learnings: "x", nextCycleDecision: "mantener" } }, NOW);
    const d = duplicateManualActuation(l, l[0].id, "dup", NOW);
    expect(d).toHaveLength(2);
    expect(d[1].name).toBe("A (copia)");
    expect(d[1].result).toEqual({ nextCycleDecision: "no-decidido" });
    const linked = importActuationsFromPlan([], { municipalityId: "m", worksheets: [sheet()], now: NOW, newId: id }).list;
    expect(duplicateManualActuation(linked, linked[0].id, "dup2", NOW)).toHaveLength(linked.length);
  });
  it("eliminar quita el registro", () => {
    const l = manual([], "A");
    expect(removeActuation(l, l[0].id)).toEqual([]);
  });
  it("las funciones no mutan la entrada", () => {
    const l = manual([], "A", "sanitario");
    const copy = JSON.stringify(l);
    moveActuation(l, l[0].id, "laboral", 0, NOW);
    updateActuationBlock(l, l[0].id, { block: "tracking", values: { status: "finalizada" } }, NOW);
    removeActuation(l, l[0].id);
    expect(JSON.stringify(l)).toBe(copy);
  });
});

describe("persistencia con el expediente", () => {
  it("las actuaciones sobreviven a guardar y cargar el expediente, y cuentan como contenido", () => {
    const workspace = createCompleteMunicipalityWorkspace({ id: "m", name: "Prueba" });
    let l = manual([], "A", "sanitario");
    l = updateActuationBlock(l, l[0].id, { block: "result", values: { learnings: "Aprendido", nextCycleDecision: "modificar" } }, NOW);
    workspace.agendaActuations = l;
    expect(isEmptyWorkspaceForPersistenceGuard(workspace)).toBe(false);
    const restored = parseWorkspaceJSON(JSON.stringify(workspace))!;
    expect(restored.agendaActuations).toEqual(l);
  });
  it("borrar la última actuación se refleja al guardar", () => {
    const workspace = createCompleteMunicipalityWorkspace({ id: "m", name: "Prueba" });
    workspace.agendaActuations = removeActuation(manual([], "A"), "x");
    const kept = parseWorkspaceJSON(JSON.stringify({ ...workspace, agendaActuations: [] }))!;
    expect(kept.agendaActuations).toEqual([]);
  });
});
