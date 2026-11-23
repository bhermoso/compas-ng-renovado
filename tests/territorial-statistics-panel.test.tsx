import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TerritorialStatisticsPanel } from "../src/ui/components/TerritorialStatisticsPanel";
import type { TerritorialStatisticsSnapshot } from "../src/domain/territorial-statistics/TerritorialStatistics";

// Valores de Alfacar (18011) publicados por el INE, consultados el 2026-11-17.
const snapshot: TerritorialStatisticsSnapshot = {
  schema: "compas-territorial-statistics/v1", id: "s1", municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011",
  retrievedAt: "2026-11-17T10:00:00.000Z", catalogVersion: "2026-11-17", failures: [],
  sources: [{ id: "ine-37698", provider: "INE", product: "Atlas de Distribución de Renta de los Hogares (INE)", table: "37698", title: "Índice de Gini y distribución de la renta P80/P20", url: "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/37698?nult=1&tip=AM" },
    { id: "ine-53688", provider: "INE", product: "Atlas de Distribución de Renta de los Hogares (INE)", table: "53688", title: "Índice de Gini (ámbitos superiores)", url: "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/53688?nult=1&tip=AM" }],
  observations: [
    { indicatorId: "adrh-gini", label: "Dato base. Índice de Gini.", territoryCode: "18011", territoryName: "Alfacar", level: "municipio", period: "2024", value: 28.3, literal: "28,3", unit: "índice", sourceId: "ine-37698" },
    { indicatorId: "adrh-gini", label: "Dato base. Índice de Gini.", territoryCode: "01", territoryName: "Andalucía", level: "andalucia", period: "2024", value: 31, literal: "31", unit: "índice", sourceId: "ine-53688" },
  ],
};

describe("panel de estadística territorial", () => {
  it("sin descargas invita a descargar y no inventa datos", () => {
    const html = renderToStaticMarkup(<TerritorialStatisticsPanel municipalityId="alfacar" municipalityName="Alfacar" ineCode="18011"/>);
    expect(html).toContain("Descargar indicadores");
    expect(html).toContain("Aún no hay ninguna descarga");
  });
  it("muestra el valor publicado, el comparador y la cobertura frente al Perfil vigente", () => {
    const html = renderToStaticMarkup(<TerritorialStatisticsPanel municipalityId="alfacar" municipalityName="Alfacar" ineCode="18011" snapshots={[snapshot]}
      activeProfile={{ schema: "compas-external-profile/v1", id: "p", municipalityId: "alfacar", title: "Perfil 0.8.2", period: "2026", author: "", createdAt: "2026-11-17", status: "review", summary: "", text: "", results: [], findings: [], limitations: [], areas: [], attachmentIds: [] }}/>);
    expect(html).toContain("Índice de Gini");
    expect(html).toContain("28,3");
    expect(html).toContain("Andalucía: 31");
    expect(html).toContain("No figura en el Perfil");
    expect(html).toContain("Comparado con «Perfil 0.8.2»");
  });
  it("sin código INE ofrece buscarlo por el nombre", () => {
    const html = renderToStaticMarkup(<TerritorialStatisticsPanel municipalityId="centro" municipalityName="Granada-Centro"/>);
    expect(html).toContain("Buscar el código de «Granada-Centro»");
  });
});
