import { describe, it, expect } from "vitest";
import { buildStartingPoint, startingPointParagraphs } from "../src/application/health-profile/startingPoint";
import type { MunicipalDocument } from "../src/domain/repository";

const doc = (over: Partial<MunicipalDocument>): MunicipalDocument => ({
  id: "d", municipalityId: "m", kind: "health-report", title: "Informe", status: "uploaded",
  source: {}, tags: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...over,
}) as MunicipalDocument;

const base = {
  municipalityName: "Loja", province: "Granada", ineCode: "18122",
  structuredStudies: [], assetsTotal: 162, assetsValidated: 0,
  hasThematicPrioritisation: false, axes: [],
};

describe("Punto de partida (Art. 16 quater, apartado 1)", () => {
  it("no infiere año, escala ni población: declara lo que no consta", () => {
    const sp = buildStartingPoint({ ...base, documents: [doc({ title: "INFORME SALUD LOJA 2026 definitivo" })] });
    const text = startingPointParagraphs(sp).join("\n");
    expect(text).toContain("INFORME SALUD LOJA 2026 definitivo (Informe de Salud): año, escala y ciclo sin declarar.");
    expect(text).toContain("Población: no consta una referencia poblacional verificada con fuente y año.");
    expect(text).toContain("Recursos de Localiza Salud: 162, de los que 0 tienen validación territorial declarada.");
    expect(sp.noConsta).toContain("Validación territorial de los recursos de Localiza Salud.");
    expect(sp.noConsta).toContain("Priorización ciudadana temática.");
  });

  it("usa lo declarado: año de ciclo, escala y población del registro", () => {
    const sp = buildStartingPoint({
      ...base, assetsValidated: 3, assetsTotal: 3, hasThematicPrioritisation: true,
      population: { total: 843, source: "INE — tabla 68535, 2025", year: 2025 },
      documents: [doc({ territorialScale: "municipio", cycle: { status: "current", referenceYear: 2026 } })],
    });
    const text = startingPointParagraphs(sp).join("\n");
    expect(text).toContain("Población: 843 habitantes (INE — tabla 68535, 2025).");
    expect(text).toContain("Informe (Informe de Salud): 2026; escala municipio; ciclo actual.");
    expect(sp.noConsta).not.toContain("Validación territorial de los recursos de Localiza Salud.");
    expect(sp.noConsta).not.toContain("Priorización ciudadana temática.");
  });

  it("los documentos archivados no figuran; los estudios en texto se declaran sin indicadores", () => {
    const sp = buildStartingPoint({ ...base, documents: [
      doc({ status: "archived", title: "Viejo" }),
      doc({ kind: "complementary-study", title: "Estudio 2019", contentMode: "full-text-non-atomized" }),
    ] });
    expect(sp.fuentes.map((f) => f.titulo)).toEqual(["Estudio 2019"]);
    expect(sp.incorporado.join(" ")).toContain("Documentos de estudio en texto: 1");
    expect(sp.noConsta).toContain("Informe de Salud vigente.");
  });
});
