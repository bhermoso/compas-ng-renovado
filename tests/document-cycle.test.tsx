import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  addMunicipalDocument,
  createMunicipalDocumentRepository,
  describeDocumentCycle,
  setMunicipalDocumentCycle,
} from "../src/domain/repository";
import { DocumentRepositoryPanel } from "../src/ui/components/DocumentRepositoryPanel";

function repoWith() {
  const base = createMunicipalDocumentRepository({ municipalityId: "fuente-vaqueros" });
  return addMunicipalDocument(base, {
    id: "d1",
    kind: "territorial-documentation",
    title: "Informe de factores",
    canGenerateEvidence: true,
    tags: ["territorial-documentation"],
  });
}

describe("ciclo de la fuente", () => {
  it("un documento sin ciclo declarado lo muestra como no declarado", () => {
    const repo = repoWith();
    expect(repo.documents[0].cycle).toBeUndefined();
    expect(describeDocumentCycle(repo.documents[0].cycle)).toBe("Ciclo no declarado");
  });

  it("declara y retira el ciclo sin tocar el resto del documento", () => {
    const repo = repoWith();
    const historic = setMunicipalDocumentCycle(repo, "d1", { status: "historical", referenceYear: 2022 });
    expect(historic.documents[0].cycle).toEqual({ status: "historical", referenceYear: 2022 });
    expect(historic.documents[0].title).toBe("Informe de factores");
    expect(describeDocumentCycle(historic.documents[0].cycle)).toBe("Ciclo histórico · 2022");
    const cleared = setMunicipalDocumentCycle(historic, "d1", undefined);
    expect("cycle" in cleared.documents[0]).toBe(false);
    expect(describeDocumentCycle({ status: "current" })).toBe("Ciclo actual");
  });

  it("no altera otros documentos", () => {
    const repo = addMunicipalDocument(repoWith(), { id: "d2", kind: "health-report", title: "Informe 2026" });
    const next = setMunicipalDocumentCycle(repo, "d1", { status: "historical" });
    expect(next.documents.find((d) => d.id === "d2")?.cycle).toBeUndefined();
  });

  it("la lista de documentos ofrece el control de ciclo con el valor declarado", () => {
    const repo = setMunicipalDocumentCycle(repoWith(), "d1", { status: "historical", referenceYear: 2022 });
    const html = renderToStaticMarkup(
      createElement(DocumentRepositoryPanel, { repository: repo, onSetDocumentCycle: () => undefined })
    );
    expect(html).toContain("Ciclo histórico · 2022");
    expect(html).toContain('aria-label="Año de referencia de la fuente"');
  });

  it("sin manejador no se ofrece el control", () => {
    const html = renderToStaticMarkup(
      createElement(DocumentRepositoryPanel, { repository: repoWith() })
    );
    expect(html).not.toContain("Ciclo de la fuente");
  });
});
