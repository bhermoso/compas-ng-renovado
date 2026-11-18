import { describe, expect, it } from "vitest";
import { ESA_2030_LINES, esa2030Action } from "../src/domain/strategy/Esa2030";
import { getSupportDocument, supportDocumentIdsCitedIn } from "../src/domain/strategy/SupportDocuments";

describe("ESA 2030 como documentación estratégica común", () => {
  it("transcribe 4 líneas, 14 objetivos y las 164 acciones sin saltos", () => {
    expect(ESA_2030_LINES.map(l => l.id)).toEqual(["ESA-LE1", "ESA-LE2", "ESA-LE3", "ESA-LE4"]);
    expect(ESA_2030_LINES.flatMap(l => l.objectives)).toHaveLength(14);
    const ns = ESA_2030_LINES.flatMap(l => l.objectives.flatMap(o => o.actions.map(a => a.n)));
    expect(ns).toEqual(Array.from({ length: 164 }, (_, i) => i + 1));
  });
  it("localiza acciones de ámbito municipal", () => {
    expect(esa2030Action(5)?.action.label).toBe("Promoción de redes comunitarias de cuidado para personas mayores con el apoyo de los municipios");
    expect(esa2030Action(15)?.objective.id).toBe("ESA-LE1-O2");
    expect(esa2030Action(165)).toBeUndefined();
  });
  it("figura en el repositorio común con su original y se reconoce en las citas", () => {
    expect(getSupportDocument("esa-2030")?.location).toEqual({ kind: "compas", path: "docs/source-material/strategic-frameworks/Estrategia de Salud de Andalucia 2030-ESA.pdf" });
    expect(supportDocumentIdsCitedIn("ESA 2030, LE2, objetivo 1")).toContain("esa-2030");
  });
});
