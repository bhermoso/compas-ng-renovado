import { describe, it, expect } from "vitest";
import { conclusionLines, recommendationLines, splitChosenConclusions, unknownLines, visibleLabel, type CanonicalChosenClosing } from "../src/application/proposals/chosenClosing";

const cc: CanonicalChosenClosing = {
  conclusions: [
    { etiqueta: "C1", tipo: "interpretacion", texto: "Población envejecida.", evidencia: ["Informe"], elegidaPor: "A", elegidaEl: "2026-10-24" },
    { etiqueta: "C4", tipo: "laguna", texto: "Sin datos locales de estilos de vida.", evidencia: ["Informe"], condiciona: ["C1"], datoQueLaCierra: "Prevalencias locales de la EAS por municipio.", elegidaPor: "A", elegidaEl: "2026-10-24" },
    { etiqueta: "L2", tipo: "laguna", texto: "Cifras sin unidad.", evidencia: ["Lectura por tema"], elegidaPor: "A", elegidaEl: "2026-10-24" },
  ],
  orientations: [],
};

describe("Lo que no sabemos (Art. 16 quater, apartado 4)", () => {
  it("las lagunas salen de Conclusiones y van a su apartado", () => {
    const { cuerpo, lagunas } = splitChosenConclusions(cc);
    expect(cuerpo.map((c) => c.etiqueta)).toEqual(["C1"]);
    expect(lagunas.map((c) => c.etiqueta)).toEqual(["C4", "L2"]);
  });

  it("cada laguna dice qué condiciona y el dato que la cerraría, o que no está declarado", () => {
    const [c4, l2] = splitChosenConclusions(cc).lagunas;
    expect(unknownLines(c4!)).toEqual([
      "C4 · Sin datos locales de estilos de vida.",
      "Condiciona: C1. Dato que la cerraría: Prevalencias locales de la EAS por municipio.",
      "Evidencia: Informe.",
    ]);
    expect(unknownLines(l2!)[1]).toBe("Dato que la cerraría: no declarado.");
  });

  it("las conclusiones llevan etiqueta, tipo, sustento, límite y recomendaciones a las que llevan (apartado 2)", () => {
    const o = { etiqueta: "O1", tipo: "orientacion" as const, recomendacion: "contrastar" as const, texto: "Contrastar X.", evidencia: ["C1"], derivaDe: ["C1"], elegidaPor: "A", elegidaEl: "x" };
    const c1 = { ...cc.conclusions[0]!, cautelas: "Desfase de diez años", evidencia: ["a", "b", "c", "d."] };
    expect(conclusionLines(c1, [o])).toEqual([
      "C1 · Interpretación. Población envejecida.",
      "Evidencia: a; b; c; y 1 más.",
      "Sustento: sin relación declarada.",
      "Límite principal: Desfase de diez años.",
      "Lleva a: O1.",
    ]);
    expect(recommendationLines(o)[0]).toBe("O1 · Contrastar. Contrastar X.");
  });

  it("las etiquetas internas del sistema no se muestran", () => {
    const sys = { ...cc.conclusions[0]!, etiqueta: "conclusion:lectura-por-tema:x", tipo: "hecho" as const };
    expect(visibleLabel(sys)).toBeNull();
    expect(conclusionLines(sys, [])[0]).toBe("Hecho. Población envejecida.");
  });
});
