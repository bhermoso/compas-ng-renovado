import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import { buildDiagnosticAnswers, buildTerritorialInequalityReading } from "../src/application/health-profile/diagnosticAnswers";
import { buildCanonicalProfileDocumentFromPSL, sealCanonicalProfileDocument, readSealedCanonicalDocument } from "../src/application/health-profile/canonicalProfileDocument";
import { createMunicipalityRuntime } from "../src/application/runtime";
import { projectCanonicalToDocumentModel } from "../src/application/psl-c-export/pslcCanonicalProjector";
import { buildPSLCPdf } from "../src/application/psl-c-export/pslcPdf";

const seed = () => JSON.parse(readFileSync(new URL("../public/seeds/compas-ng-workspace-loja.json", import.meta.url), "utf8")) as MunicipalityWorkspace;

describe("Perfil completo: documentación → lectura → sello → exportación", () => {
  it("conserva las cuatro fuentes de Loja y pasajes localizables sin fabricar validación", () => {
    const workspace = seed();
    const answers = buildDiagnosticAnswers({ workspace, determinantTitles: [], assets: [] });
    const findings = answers.desigualdadTerritorial.documentaryFindings!;
    expect(new Set(findings.map(f => f.documentId)).size).toBe(4);
    for (const finding of findings) {
      const original = workspace.repository.documents.find(d => d.id === finding.documentId)!;
      expect(original.sourceText!.slice(finding.start, finding.end)).toBe(finding.quote);
    }
    const psl = createMunicipalityRuntime({ workspace }).psl;
    expect(psl.status).toBe("generated");
    const doc = buildCanonicalProfileDocumentFromPSL({ psl, answers, territory: "Loja", perfil: undefined });
    expect(doc.editorialView.pendingDeclaration).not.toContain("este Perfil es válido");
    const restored = readSealedCanonicalDocument(JSON.parse(JSON.stringify(sealCanonicalProfileDocument(doc))))!;
    expect(restored.editorialView.sourceBlocks).toEqual(doc.editorialView.sourceBlocks);
    const model = projectCanonicalToDocumentModel(restored.editorialView, restored.technicalSpace, {
      title: "Revisión", subtitle: "Borrador", fileName: "review.pdf", portada: [],
      traceability: { sourceHash: "test", artifactId: "test", sourcePSLId: psl.id,
        sourcePSLVersion: psl.version, sourcePSLEvidenceStoreVersion: psl.evidenceStoreVersion, frozenEvidenceAtomCount: 0 },
    });
    const exported = JSON.stringify(model);
    for (const finding of findings) {
      expect(exported).toContain(JSON.stringify(finding.quote.trim()).slice(1, -1));
      expect(exported).toContain(finding.documentId);
    }
  });

  it("no convierte títulos, etiquetas ni menciones negadas en vulnerabilidad local demostrada", () => {
    const workspace = seed();
    workspace.municipality.identity.id = "test-territory";
    workspace.repository.documents = [{ ...workspace.repository.documents[1], municipalityId: "test-territory",
      title: "ERACIS vivienda renta", tags: ["vulnerabilidad social"], sourceText: "Este documento explica el procedimiento de archivo municipal." }];
    expect(buildTerritorialInequalityReading(workspace).themes).toEqual([]);
    workspace.repository.documents[0].sourceText = "No se dispone de información sobre vulnerabilidad social en el municipio.";
    const answers = buildDiagnosticAnswers({ workspace, determinantTitles: [], assets: [] });
    expect(answers.determinantes.filter(d => d.kind === "documentado")).toEqual([]);
    expect(answers.desigualdadTerritorial.documentaryFindings![0].quote).toContain("No se dispone");
  });

  it.each(["archived", "rejected", "historical", "other-territory"])("excluye fuentes %s también en la lectura directa", (state) => {
    const workspace = seed();
    const doc = { ...workspace.repository.documents[1] };
    if (state === "archived" || state === "rejected") doc.status = state;
    if (state === "historical") doc.cycle = { status: "historical", referenceYear: 2010 };
    if (state === "other-territory") doc.municipalityId = "other";
    workspace.repository.documents = [doc];
    expect(buildTerritorialInequalityReading(workspace).documentaryFindings).toEqual([]);
  });

  it("dos textos distintos con iguales metadatos producen lecturas distintas y conservan el término de un párrafo largo", () => {
    const workspace = seed();
    workspace.repository.documents = [{ ...workspace.repository.documents[1], sourceText: "El documento describe barreras arquitectónicas en los accesos." }];
    const before = buildTerritorialInequalityReading(workspace);
    workspace.repository.documents[0].sourceText = "Introducción general. ".repeat(40) + "La soledad requiere contraste con la población participante.";
    const after = buildTerritorialInequalityReading(workspace);
    expect(after.themes).not.toEqual(before.themes);
    expect(after.documentaryFindings!.some(f => f.quote.includes("soledad"))).toBe(true);
  });

  it("pagina un párrafo mayor que una página sin perder su final", () => {
    const pdf = buildPSLCPdf({ title: "Prueba", subtitle: "Borrador", fileName: "test.pdf", portada: [],
      sections: [{ title: "Texto largo", level: 1, paragraphs: ["PASAJELITERAL ".repeat(1600) + "FINALVERIFICABLE"] }] });
    expect(pdf.getNumberOfPages()).toBeGreaterThan(3);
    pdf.setPage(pdf.getNumberOfPages());
    const lastPage = pdf.output();
    expect(lastPage).toContain("FINALVERIFICABLE");
    // The content stream coordinates must stay on-page. Visual smoke checks the layout too.
    const coordinates = [...lastPage.matchAll(/[-\d.]+ ([-\d.]+) Td/g)].map(m => Number(m[1]));
    expect(coordinates.every(y => y >= 0 && y <= 842)).toBe(true);
  });

  it("repite la cabecera cuando una tabla continúa en otra página", () => {
    const pdf = buildPSLCPdf({ title: "Prueba", subtitle: "Borrador", fileName: "test.pdf", portada: [],
      sections: [{ title: "Tabla", level: 1, kind: "table", paragraphs: [], table: {
        headers: ["CABECERAVERIFICABLE", "Fuente"],
        rows: Array.from({length: 100}, (_, i) => [`Fila ${i}`, "Documento de referencia"]),
      } }] });
    expect((pdf.output().match(/CABECERAVERIFICABLE/g) ?? []).length).toBeGreaterThan(1);
  });
});
