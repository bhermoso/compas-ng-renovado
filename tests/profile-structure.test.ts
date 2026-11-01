import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";

const fixture = (name: string) => readFileSync(resolve(__dirname, "fixtures/profile-text", name), "utf8");
const cases = [
  ["PDF v0.1 (tabla de recomendaciones)", "zagra-v0.1-pdf.txt"],
  ["PDF v0.2 (recomendaciones agrupadas)", "zagra-v0.2-pdf.txt"],
  ["DOCX v0.2", "zagra-v0.2-docx.txt"],
] as const;

describe("parseProfileStructure · Perfil de Zagra", () => {
  for (const [label, file] of cases) {
    describe(label, () => {
      const s = parseProfileStructure(fixture(file));
      it("reconoce los siete apartados, el resumen y los anexos", () => {
        const titles = s.sections.map((x) => x.title);
        for (const t of ["Resumen", "1. Punto de partida", "2. Conclusiones", "4. Lo que no sabemos", "5. Recomendaciones", "7. Autoría y validación", "Anexos", "H. Referencias"]) expect(titles).toContain(t);
        expect(s.summary.join(" ")).toContain("843 habitantes [1]");
      });
      it("reconoce las ocho conclusiones con su enunciado y a qué llevan", () => {
        expect(s.conclusions.map((c) => c.id)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]);
        expect(s.conclusions[0].title).toMatch(/^Zagra pierde población por saldo natural y envejece/);
        expect(s.conclusions[0].leadsTo).toBe("R4 y R5");
        expect(s.conclusions.every((c) => c.body.length > 0)).toBe(true);
      });
      it("reconoce las diez recomendaciones con su tipo y su origen, sin confundir el verbo con el tipo", () => {
        const byId = Object.fromEntries(s.recommendations.map((r) => [r.id, r]));
        expect(Object.keys(byId).sort()).toEqual(["R1", "R10", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"]);
        expect(byId.R1).toMatchObject({ type: "Conocer", derivesFrom: "C2, C4" });
        expect(byId.R4).toMatchObject({ type: "Conocer", derivesFrom: "C1, C5" });
        expect(byId.R4.text).toContain("que viven solas");
        expect(byId.R5).toMatchObject({ type: "Contrastar", derivesFrom: "C1" });
        expect(byId.R5.text).toMatch(/^Contrastar con las cuidadoras/);
        expect(byId.R7).toMatchObject({ type: "Abordar", derivesFrom: "C3, C7" });
      });
      it("lista las referencias y destaca cifras literales del resumen", () => {
        expect(s.references.length).toBeGreaterThanOrEqual(8);
        expect(s.references[0]).toMatch(/^Instituto de Estadística y Cartografía de Andalucía/);
        expect(s.keyFigures.length).toBeGreaterThanOrEqual(5);
        expect(s.keyFigures.some((k) => k.value === "843")).toBe(true);
        for (const k of s.keyFigures) expect(fixture(file)).toContain(k.value);
      });
    });
  }
  it("un texto sin estructura RELAS queda como texto, sin inventar conclusiones", () => {
    const s = parseProfileStructure("Informe libre.\n\nUn párrafo sin apartados ni conclusiones.");
    expect(s.conclusions).toEqual([]);
    expect(s.recommendations).toEqual([]);
    expect(s.sections[0].paragraphs).toHaveLength(2);
  });
});

import { prefillFromStructure } from "../src/application/health-profile/profileStructure";
describe("prefillFromStructure", () => {
  const empty = { title: "v01", period: "", author: "", summary: "", text: fixture("zagra-v0.1-pdf.txt"), results: [], findings: [], limitations: [], areas: [] };
  it("completa título, versión, resumen, conclusiones y recomendaciones de un documento sin paquete", () => {
    const { content, recognized } = prefillFromStructure(empty);
    expect(content.title).toBe("Perfil de Salud Local de Zagra");
    expect(content.period).toMatch(/^Versión 0\.1/);
    expect(content.summary).toContain("843 habitantes [1]");
    expect(content.findings).toHaveLength(8);
    expect(content.areas).toHaveLength(10);
    expect(content.areas[0]).toMatchObject({ id: "R1", rationale: "Conocer · Deriva de C2, C4" });
    expect(recognized).toEqual({ conclusions: 8, recommendations: 10, summary: true });
  });
  it("no sustituye lo que ya trae un paquete", () => {
    const { content, recognized } = prefillFromStructure({ ...empty, summary: "Del paquete", findings: ["C1. Del paquete"], areas: [{ id: "X", title: "X", rationale: "" }] });
    expect(content.summary).toBe("Del paquete");
    expect(content.findings).toEqual(["C1. Del paquete"]);
    expect(content.areas).toHaveLength(1);
    expect(recognized).toEqual({ conclusions: 0, recommendations: 0, summary: false });
  });
});
