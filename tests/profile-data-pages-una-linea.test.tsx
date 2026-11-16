import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileDataPages } from "../src/ui/components/ProfileDataPages";
import type { ProfileResult } from "../src/domain/health-profile/ExternalHealthProfile";

// Panel de salud como cuadro de mandos: todos los datos de un indicador en una línea (16/11/2026).
const r = (o: Partial<ProfileResult> & { id: string; title: string; value: string }): ProfileResult =>
  ({ unit: "", source: "Informe de salud", page: "Tabla 3", period: "2025", caution: "", topic: "Morbilidad", ...o });
const results: ProfileResult[] = [
  r({ id: "a", title: "Asma", value: "1.589,56", unit: "casos por 10.000", chartValue: 1589.56, comparisons: [{ label: "Provincia de Granada", value: 1448.67 }, { label: "Andalucía", value: 1187.09 }] }),
  r({ id: "b", title: "Diabetes", value: "745,21", unit: "casos por 10.000", chartValue: 745.21, comparisons: [{ label: "Provincia de Granada", value: 906.66 }], denominator: "Población asignada" }),
  r({ id: "c", title: "Defunciones", value: "45", topic: "Mortalidad", page: "Tabla 4", chartValue: 45 }),
];
const pages = { cover: [], whoLivesHere: [], healthPanel: [], inequality: { intro: [], blocks: [] } };
const html = renderToStaticMarkup(<ProfileDataPages pages={pages} results={results} municipalityName="Alfacar" title="Perfil" period="0.8.1" metrics={[]} />);
const panel = html.slice(html.indexOf('id="pdp-3"'), html.indexOf('id="pdp-4"'));
const rows = [...panel.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

describe("Panel de salud · una línea por indicador", () => {
  it("la celda del indicador contiene solo su nombre, sin líneas añadidas", () => {
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.split("</th>")[0]).not.toMatch(/<small|<br/);
    expect(panel).not.toContain("Antes:");
  });
  it("la procedencia se numera una vez bajo la tabla y cada fila la cita", () => {
    const sources = [...panel.matchAll(/<li id="pdp-t3-f(\d)">([^<]*)<\/li>/g)].map((m) => m[2]);
    expect(sources).toEqual(["Informe de salud, Tabla 3", "Informe de salud, Tabla 3 · Base: Población asignada", "Informe de salud, Tabla 4"]);
    expect(rows.map((row) => row.match(/href="#pdp-t3-f(\d)"/)?.[1])).toEqual(["1", "2", "3"]);
    // clase propia: «pdp-ref» ya es la línea de referencia de los gráficos (posición absoluta, ancho 0)
    for (const row of rows) expect(row).toMatch(/<td class="pdp-srcref"><a href=/);
  });
  it("no añade columna «Antes» si ningún indicador tiene ciclo anterior", () => {
    expect(panel).not.toMatch(/<th scope="col">Antes<\/th>/);
  });
  it("el comparador por dominio queda plegado en pantalla y fuera de la impresión", () => {
    expect(panel).toMatch(/<details class="pdp-domain-chart pdp-noprint"/);
    expect(panel).not.toContain("pdp-domain-print-all");
  });
});
