import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocumentationProvider } from "../src/ui/components/Documentation";
import { STRATEGIC_REFERENCES } from "../src/application/strategic-reference-library";

// «Consultar documentación»: índice por funciones, ficha por documento y el
// marco estratégico común separado de los documentos del municipio.
describe("Plataforma documental del expediente", () => {
  // Expediente de ensayo con una copia municipal de un marco común (PDF incluido en la compilación).
  const ensayo = JSON.parse(readFileSync("fixtures/workspaces/municipio-ensayo-synthetic-test.json", "utf8"));
  const [first] = ensayo.repository.documents;
  ensayo.repository.documents.push({ ...first, id: "copia-epvsa", kind: "strategic-framework", title: "EPVSA — copia municipal de ensayo", sourceText: undefined, sourceFileName: "08_Lineas_EPVSA_02abril24.pdf", source: { system: "Copia municipal de ensayo", url: "docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf" }, tags: ["strategic-framework"] });
  const html = renderToStaticMarkup(<DocumentationProvider workspace={ensayo}><p>contenido</p></DocumentationProvider>);

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
    expect(html).toContain(`documentation-launcher__count">${ensayo.repository.documents.length}<`);
  });
});
