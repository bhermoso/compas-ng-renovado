import { describe, expect, it } from "vitest";
import { findHistoricAgendas, importHistoricAgenda } from "../src/application/agenda/historicAgendaImport";

let n = 0;
const ctx = { municipalityId: "m", now: "2026-10-21T08:00:00.000Z", newId: () => `id-${++n}` };
const act = {
  id: 7, nombre: "Paseos saludables", codigoEPVSA: "P01-A01", programa: "RELAS Comunitario", entorno: "comunitario",
  anio: "2026", trimestre: "T2", estado: "en ejecucion", prioridad: "alta", lineaEpvsa: "LE1", objetivoEPVSA: "OE 1.1",
  indicadorPrincipal: "1.1.1.a", indicadoresSecundarios: ["x", "y"], participantesPrevistos: "30", participantesAlcanzados: "unas 25",
  valorIndicadorAlcanzado: "62 %", decisionSiguienteCiclo: "evaluar_mas", orden: 2, observaciones: "Con el distrito",
};
const tree = { estrategias: { "es-andalucia-epvsa": { municipios: { Prueba: { agendas: { 7: act, 8: { nombre: "Sin entorno", entorno: "otro", orden: 1 }, 9: { descripcion: "sin nombre" } } } } } } };

describe("importación de la agenda del histórico", () => {
  it("localiza la agenda en la copia completa", () => {
    const found = findHistoricAgendas(JSON.stringify(tree));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ strategy: "es-andalucia-epvsa", municipality: "Prueba" });
    expect(found[0].actuations).toHaveLength(3);
  });
  it("acepta lista, un municipio y la agenda sola; devuelve vacío si no es una copia", () => {
    expect(findHistoricAgendas(JSON.stringify({ agendas: [act] }))).toHaveLength(1);
    expect(findHistoricAgendas(JSON.stringify([act]))).toHaveLength(1);
    expect(findHistoricAgendas("{}")).toEqual([]);
    expect(findHistoricAgendas("no json")).toEqual([]);
  });
  it("traduce campos sin inventar entorno, trimestre ni prioridad", () => {
    const src = findHistoricAgendas(JSON.stringify(tree))[0].actuations;
    const { list, report } = importHistoricAgenda([], src, ctx);
    expect(report).toMatchObject({ added: 2, skipped: 1 });
    const a = list.find((x) => x.name === "Paseos saludables")!;
    expect(a.setting).toBe("comunitario");
    expect(a.tracking.status).toBe("en-ejecucion");
    expect(a.tracking.priority).toBe("alta");
    expect(a.identification).toMatchObject({ code: "P01-A01", program: "RELAS Comunitario", year: 2026, quarter: "T2" });
    expect(a.strategic).toMatchObject({ line: "LE1", objective: "OE 1.1", mainIndicator: "1.1.1.a", secondaryIndicators: ["x", "y"] });
    expect(a.population.plannedParticipants).toBe(30);
    expect(a.population.reachedParticipants).toBeUndefined();
    expect(a.tracking.notes).toContain("unas 25");
    expect(a.result.nextCycleDecision).toBe("evaluar-mas");
    expect(a.result.observedResult).toBeUndefined();
    expect(a.tracking.notes).toContain("Con el distrito");
    expect(a.tracking.notes).toContain("62 %");
    const b = list.find((x) => x.name === "Sin entorno")!;
    expect(b.setting).toBeNull();
    expect(report.unmapped.some((u) => u.startsWith("entorno"))).toBe(true);
  });
  it("conserva el orden del histórico y no toca las actuaciones existentes", () => {
    const src = findHistoricAgendas(JSON.stringify(tree))[0].actuations;
    const first = importHistoricAgenda([], src, ctx).list;
    const again = importHistoricAgenda(first, src, ctx).list;
    expect(again.slice(0, first.length)).toEqual(first);
    expect(again.length).toBe(first.length + 2);
  });
});
