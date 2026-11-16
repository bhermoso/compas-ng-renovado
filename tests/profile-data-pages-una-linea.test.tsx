import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileDataPages } from "../src/ui/components/ProfileDataPages";
import type { ProfileResult } from "../src/domain/health-profile/ExternalHealthProfile";
import { splitDataPageResults, sectionMatrix, profileTablesCovered } from "../src/application/health-profile/profileDashboard";

// Panel de salud como cuadro de mandos: una línea por indicador; las secciones censales, en la página 4 (16-17/11/2026).
const r = (o: Partial<ProfileResult> & { id: string; title: string; value: string }): ProfileResult =>
  ({ unit: "", source: "Informe de salud", page: "Tabla 3", period: "2025", caution: "", topic: "Morbilidad", ...o });
const results: ProfileResult[] = [
  r({ id: "a", title: "Asma", value: "1.589,56", unit: "casos por 10.000", chartValue: 1589.56, comparisons: [{ label: "Provincia de Granada", value: 1448.67 }, { label: "Andalucía", value: 1187.09 }] }),
  r({ id: "b", title: "Diabetes", value: "745,21", unit: "casos por 10.000", chartValue: 745.21, comparisons: [{ label: "Provincia de Granada", value: 906.66 }], denominator: "Población asignada" }),
  r({ id: "c", title: "Defunciones", value: "45", unit: "personas", topic: "Mortalidad", source: "Registro de mortalidad", page: "Tabla 4", chartValue: 45 }),
  r({ id: "s1", title: "Población total", value: "1.376", unit: "personas", topic: "Territorio", scale: "Sección censal 1801101001", source: "INE · tabla 69181", page: "CUSEC 1801101001; Todas las edades; https://www.ine.es/jaxiT3/Tabla.htm?t=69181", chartValue: 1376, comparisons: [{ label: "Provincia de Granada", value: 945797 }] }),
  r({ id: "s2", title: "Población total", value: "1.968", unit: "personas", topic: "Territorio", scale: "Sección censal 1801101002", source: "INE · tabla 69181", page: "CUSEC 1801101002; Todas las edades; https://www.ine.es/jaxiT3/Tabla.htm?t=69181", chartValue: 1968, comparisons: [{ label: "Provincia de Granada", value: 945797 }] }),
];
const pages = { cover: [], whoLivesHere: [], healthPanel: ["Resultados del Informe.", "| Indicador | Alfacar |\n|---|---|\n| Asma | 1.589,56 |\n| Diabetes | 745,21 |"], inequality: { intro: [], blocks: [] } };
const html = renderToStaticMarkup(<ProfileDataPages pages={pages} results={results} municipalityName="Alfacar" title="Perfil" period="0.8.1" metrics={[]} />);
const panel = html.slice(html.indexOf('id="pdp-3"'), html.indexOf('id="pdp-4"'));
const page4 = html.slice(html.indexOf('id="pdp-4"'));
const rows = [...panel.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

describe("Panel de salud · una línea por indicador", () => {
  it("la celda del indicador contiene solo su nombre", () => {
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.split("</th>")[0]).not.toMatch(/<small|<br/);
  });
  it("cada dominio es una tabla con las mismas columnas; la unidad común pasa a la cabecera del dominio", () => {
    expect((panel.match(/<table id="pdp-domain-\d" class="pdp-table pdp-table--line pdp-dtable"/g) ?? []).length).toBe(2);
    expect(panel).toMatch(/<caption class="pdp-dtable__cap">Morbilidad<span class="pdp-dtable__unit"> · casos por 10.000<\/span><\/caption>/);
    expect(rows[0]).toContain('<td class="pdp-num pdp-local">1.589,56</td>');
  });
  it("las fuentes se agrupan por fuente sin perder páginas ni bases; cada fila cita la suya", () => {
    const sources = [...panel.matchAll(/<li id="pdp-t3-f(\d)">([^<]*)<\/li>/g)].map((m) => m[2]);
    expect(sources).toEqual(["Informe de salud — Tabla 3 · Base: Población asignada", "Registro de mortalidad — Tabla 4"]);
    expect(rows.map((row) => row.match(/href="#pdp-t3-f(\d)"/)?.[1])).toEqual(["1", "1", "2"]);
    for (const row of rows) expect(row).toMatch(/<td class="pdp-srcref"><a href=/);
  });
  it("los resultados por sección censal no están en el panel: van a la matriz de la página 4", () => {
    expect(panel).not.toContain("Población total");
    expect(page4).toMatch(/<table class="pdp-table pdp-table--line pdp-matrix">/);
    expect(page4).toMatch(/<th scope="col" class="pdp-num" title="Sección censal 1801101001">01001<\/th>/);
    expect(page4).toMatch(/<th scope="row">Población total<span class="pdp-muted"> · personas<\/span><\/th><td class="pdp-muted">2025<\/td><td class="pdp-num" title="INE · tabla 69181, CUSEC 1801101001; Todas las edades; https:\/\/www.ine.es\/jaxiT3\/Tabla.htm\?t=69181">1.376<\/td>/);
  });
  it("la lista de fuentes de la matriz da cada fuente con su dirección una sola vez; el detalle queda en la celda", () => {
    const sources = [...page4.matchAll(/<li id="pdp-t4s-f(\d)">([^<]*)<\/li>/g)].map((m) => m[2]);
    expect(sources).toEqual(["INE · tabla 69181 — https://www.ine.es/jaxiT3/Tabla.htm?t=69181"]);
  });
  it("la tabla del propio perfil no se repite si todas sus filas están en el panel; su texto sí", () => {
    expect(panel).toContain("Resultados del Informe.");
    expect(panel).not.toContain("profile-text-table");
  });
  it("el comparador por dominio queda plegado en pantalla y fuera de la impresión", () => {
    expect(panel).toMatch(/<details class="pdp-domain-chart pdp-noprint"/);
  });
});

describe("Reparto y matriz por sección", () => {
  it("separa los resultados por sección con valor numérico, salvo los de «Desigualdad»", () => {
    const extra = r({ id: "d", title: "Renta", value: "12.000", topic: "Desigualdad", scale: "Sección censal 1801101001", chartValue: 12000 });
    const sinValor = r({ id: "e", title: "Zona", value: "rural", topic: "Territorio", scale: "Sección censal 1801101003" });
    const split = splitDataPageResults([...results, extra, sinValor]);
    expect(split.bySection.map((x) => x.id)).toEqual(["s1", "s2"]);
    expect(split.inequality.map((x) => x.id)).toEqual(["d"]);
    expect(split.healthPanel.map((x) => x.id)).toEqual(["a", "b", "c", "e"]);
  });
  it("la matriz tiene una fila por indicador y una columna por sección", () => {
    const m = sectionMatrix(results.filter((x) => x.scale));
    expect(m.sections).toEqual([{ code: "1801101001", label: "01001" }, { code: "1801101002", label: "01002" }]);
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0].values).toEqual({ "1801101001": "1.376", "1801101002": "1.968" });
  });
  it("la tabla del perfil solo se da por contenida si están todas sus filas", () => {
    const table = [["Indicador", "Alfacar"], ["Asma", "1.589,56"], ["Diabetes", "745,21"]];
    expect(profileTablesCovered([table], results)).toBe(true);
    expect(profileTablesCovered([[...table, ["Gripe", "12,5"]]], results)).toBe(false);
  });
});
