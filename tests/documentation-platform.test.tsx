import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocumentationProvider } from "../src/ui/components/Documentation";
import { STRATEGIC_REFERENCES } from "../src/application/strategic-reference-library";

// «Consultar documentación»: índice por funciones, ficha por documento y el
// marco estratégico común separado de los documentos del municipio.
describe("Plataforma documental del expediente", () => {
  const zaidin = JSON.parse(readFileSync("public/seeds/compas-ng-workspace-granada-zaidin.json", "utf8"));
  const html = renderToStaticMarkup(<DocumentationProvider workspace={zaidin}><p>contenido</p></DocumentationProvider>);

  it("ordena el índice por función municipal", () => {
    expect(html).toContain("01 · Informes de Salud");
    expect(html).toContain("04 · Activos para la salud");
    expect(html).toContain('aria-label="Índice documental del expediente"');
  });

  it("presenta las copias de marcos como copias, no como documentos del municipio", () => {
    expect(html).toContain("07 · Copias municipales de marcos comunes");
    expect(html).toContain("Copia de un marco común");
    expect(html).not.toContain("Marco estratégico y normativo");
    expect(html).toContain(`Marco estratégico común · ${STRATEGIC_REFERENCES.length} documentos`);
  });

  it("distingue el archivo de origen del texto conservado", () => {
    expect(html).toContain("PDF conservado en COMPÁS");
    expect(html).toMatch(/\d+ fichas · \d+ con archivo de origen · \d+ archivadas/);
  });

  it("el botón conserva su rótulo y muestra el número de fichas", () => {
    expect(html).toContain("Consultar documentación");
    expect(html).toContain(`documentation-launcher__count">${zaidin.repository.documents.length}<`);
  });
});
