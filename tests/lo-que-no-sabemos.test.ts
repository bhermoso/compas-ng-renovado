import { describe, it, expect } from "vitest";
import { splitChosenConclusions, unknownLines, type CanonicalChosenClosing } from "../src/application/proposals/chosenClosing";

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
      "Sin datos locales de estilos de vida.",
      "Condiciona: C1. Dato que la cerraría: Prevalencias locales de la EAS por municipio.",
      "Evidencia: Informe.",
    ]);
    expect(unknownLines(l2!)[1]).toBe("Dato que la cerraría: no declarado.");
  });
});
