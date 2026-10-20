import { describe, expect, it } from "vitest";
import {
  historicTemplates, instantiateTemplate, listTemplates, removeOwnTemplate, templateFromActuation,
  templatePrograms, upsertOwnTemplate,
} from "../src/application/agenda/actuationTemplates";
import { addManualActuation, duplicateManualActuation, updateActuationBlock } from "../src/application/agenda/agendaActuations";

const NOW = "2026-10-20T10:00:00.000Z";

describe("repositorio de actuaciones-tipo", () => {
  it("incorpora el catálogo heredado completo: 125 actuaciones en 15 programas, rotuladas como heredadas", () => {
    const all = historicTemplates().filter((t) => t.code);
    expect(all).toHaveLength(125);
    expect(new Set(all.map((t) => t.program)).size).toBe(15);
    expect(all.every((t) => t.origin === "historico" && t.sourceLabel.includes("no verificado"))).toBe(true);
    expect(all.find((t) => t.code === "P01-A21")?.name).toContain("Puntos Vuela");
    expect(all.find((t) => t.code === "P03-A09")?.name).toContain("GRUSE");
  });

  it("incorpora las 32 fichas completas del histórico, sin código, sin meta y sin asignar nada por sí solas", () => {
    const fichas = historicTemplates().filter((t) => !t.code);
    expect(fichas).toHaveLength(32);
    expect(fichas.every((t) => t.origin === "historico" && /no verificad/.test(t.sourceLabel))).toBe(true);
    expect(fichas.every((t) => t.name && t.description && t.indicator && t.suggestedSetting)).toBe(true);
    // No se importan trimestre, prioridad, año, meta, responsable ni organización.
    for (const f of fichas) {
      for (const k of ["quarter", "trimestre", "priority", "prioridad", "year", "anio", "target", "meta", "responsible", "organisation"]) {
        expect(Object.keys(f), `${f.name}.${k}`).not.toContain(k);
      }
    }
    expect(new Set(fichas.map((t) => t.id)).size).toBe(32);
  });

  it("adaptar una ficha completa copia lo descriptivo y deja el entorno sin asignar", () => {
    const t = historicTemplates().find((x) => x.name === "Prescripción de ejercicio físico desde atención primaria")!;
    expect(t.suggestedSetting).toBe("sanitario");
    const a = instantiateTemplate([], t, { id: "f1", municipalityId: "zagra", now: NOW })[0];
    expect(a.setting).toBeNull();
    expect(a.strategic.mainIndicator).toBeUndefined();
    expect(a.strategic.framework).toBe("EPVSA");
    expect(a.strategic.target).toBeUndefined();
    expect(a.tracking.resources).toBe(t.resources);
    expect(a.tracking.priority).toBeUndefined();
    expect(a.identification.quarter).toBeUndefined();
    expect(a.responsibles.responsible).toBeUndefined();
    expect(a.tracking.evidence).toBeUndefined();
    expect(a.population.population).toBe(t.population);
  });

  it("busca sin tildes y filtra por programa y origen", () => {
    expect(listTemplates([], { query: "movilidad" }).some((t) => t.code === "P02-A01")).toBe(true);
    expect(listTemplates([], { program: templatePrograms([])[0] }).every((t) => t.program === templatePrograms([])[0])).toBe(true);
    expect(listTemplates([], { origin: "propia" })).toHaveLength(0);
  });

  it("adaptar crea una copia independiente: copia lo descriptivo, entra sin asignar y no toca la plantilla", () => {
    const t = historicTemplates().find((x) => x.code === "P03-A09")!;
    const snapshot = JSON.stringify(t);
    const list = instantiateTemplate([], t, { id: "a1", municipalityId: "zagra", now: NOW });
    const a = list[0];
    expect(a.name).toBe(t.name);
    expect(a.setting).toBeNull();
    expect(a.templateRef).toEqual({ id: t.id, origin: "historico", name: t.name });
    expect(a.responsibles).toEqual({});
    expect(a.tracking.status).toBe("planificada");
    const edited = updateActuationBlock(list, "a1", { block: "identification", values: { ...a.identification, description: "Adaptada a Zagra" } }, NOW);
    expect(edited[0].identification.description).toBe("Adaptada a Zagra");
    expect(JSON.stringify(t)).toBe(snapshot);
  });

  it("la sugerencia de entorno de una plantilla propia no se aplica sola", () => {
    const base = addManualActuation([], { id: "x", municipalityId: "zagra", name: "Taller CPA", setting: "comunitario", now: NOW });
    const tpl = templateFromActuation(base[0], "Taller CPA tipo", { id: "t1", municipalityName: "Zagra", now: NOW })!;
    expect(tpl.suggestedSetting).toBe("comunitario");
    expect(instantiateTemplate([], tpl, { id: "b", municipalityId: "atarfe", now: NOW })[0].setting).toBeNull();
  });

  it("la plantilla propia solo conserva lo descriptivo, no fechas, responsables, participantes ni resultados", () => {
    let list = addManualActuation([], { id: "x", municipalityId: "zagra", name: "GRAFA Zagra", now: NOW });
    list = updateActuationBlock(list, "x", { block: "identification", values: { description: "Grupo de apoyo", activityType: "taller" } }, NOW);
    list = updateActuationBlock(list, "x", { block: "responsibles", values: { responsible: "Ana Pérez", contact: "600000000" } }, NOW);
    list = updateActuationBlock(list, "x", { block: "population", values: { collective: "Mujeres", plannedParticipants: 12, reachedParticipants: 9 } }, NOW);
    list = updateActuationBlock(list, "x", { block: "tracking", values: { status: "finalizada", plannedDate: "2026-11-01", evidence: "acta" } }, NOW);
    const tpl = templateFromActuation(list[0], "GRAFA", { id: "t1", municipalityName: "Zagra", now: NOW })!;
    const text = JSON.stringify(tpl);
    expect(tpl.description).toBe("Grupo de apoyo");
    expect(tpl.collective).toBe("Mujeres");
    for (const private_ of ["Ana Pérez", "600000000", "2026-11-01", "acta", "finalizada"]) expect(text).not.toContain(private_);
    expect(tpl).not.toHaveProperty("plannedParticipants");
  });

  it("alta, edición y baja de plantillas propias; sin nombre no hay plantilla", () => {
    const a = addManualActuation([], { id: "x", municipalityId: "zagra", name: "X", now: NOW })[0];
    expect(templateFromActuation(a, "  ", { id: "t", municipalityName: "Zagra", now: NOW })).toBeNull();
    const tpl = templateFromActuation(a, "Tipo", { id: "t1", municipalityName: "Zagra", now: NOW })!;
    const own = upsertOwnTemplate([], tpl);
    expect(listTemplates(own)[0].id).toBe("t1");
    expect(upsertOwnTemplate(own, { ...tpl, name: "Tipo 2" })[0].name).toBe("Tipo 2");
    expect(upsertOwnTemplate(own, historicTemplates()[0])).toHaveLength(1);
    expect(removeOwnTemplate(own, "t1")).toHaveLength(0);
  });

  it("duplicar conserva la referencia a la plantilla", () => {
    const list = instantiateTemplate([], historicTemplates()[0], { id: "a1", municipalityId: "zagra", now: NOW });
    expect(duplicateManualActuation(list, "a1", "a2", NOW)[1].templateRef?.id).toBe(historicTemplates()[0].id);
  });
});
