import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TerritorialDocumentControl } from "../src/ui/components/TerritorialDocumentControl";
import { addMunicipalDocument, type MunicipalDocumentRepository } from "../src/domain/repository";

const empty: MunicipalDocumentRepository = { municipalityId: "zagra", documents: [], updatedAt: "2026-10-31T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;

describe("TerritorialDocumentControl", () => {
  it("muestra nombres de tipo documental, no identificadores internos", () => {
    const repository = addMunicipalDocument(empty, { id: "doc-1", title: "Informe", kind: "health-report" } as never);
    const html = renderToStaticMarkup(<TerritorialDocumentControl repository={repository} evidenceCount={0} studiesLoaded={0} totalStudies={3} kindLabels={[{ value: "health-report", label: "Informe de Salud" }]} />);
    expect(html).toContain("Informe de Salud");
    expect(html).not.toContain(">health-report<");
    expect(html).toContain("0/3");
    expect(html).toContain("No hay estudios complementarios incorporados");
  });
  it("con expediente vacío señala la ausencia de Informe sin inventar fuentes", () => {
    const html = renderToStaticMarkup(<TerritorialDocumentControl repository={empty} evidenceCount={0} studiesLoaded={0} totalStudies={0} />);
    expect(html).toContain("No constan documentos en el repositorio.");
    expect(html).toContain("Informe de Salud sin ficha documental");
  });
});
