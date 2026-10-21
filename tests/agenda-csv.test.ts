import { describe, expect, it } from "vitest";
import { agendaToCsv } from "../src/application/agenda/agendaCsv";
import { addManualActuation } from "../src/application/agenda/agendaActuations";

const NOW = "2026-10-21T10:00:00.000Z";
describe("exportación CSV de la agenda", () => {
  it("escribe cabecera y una fila por actuación, sin rellenar lo no registrado", () => {
    const list = addManualActuation([], { id: "a", municipalityId: "m", name: 'Taller "Mayores"; marcha', setting: "sanitario", now: NOW });
    const csv = agendaToCsv(list, []);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0].startsWith("Nombre;Entorno;Año;Trimestre")).toBe(true);
    expect(lines[1].startsWith('"Taller ""Mayores""; marcha";Entorno sanitario;;;Planificada')).toBe(true);
  });
  it("marca «Sin asignar» y neutraliza fórmulas", () => {
    const list = addManualActuation([], { id: "b", municipalityId: "m", name: "=SUMA(A1)", now: NOW });
    const csv = agendaToCsv(list, []);
    expect(csv).toContain("'=SUMA(A1);Sin asignar");
  });
  it("sin actuaciones, solo la cabecera", () => {
    expect(agendaToCsv([], []).trim().split("\r\n")).toHaveLength(1);
  });
});
