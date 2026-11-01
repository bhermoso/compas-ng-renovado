import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildDiagnosisControlSummary } from "../src/application/diagnosis/diagnosisControlSummary";
import { DiagnosisControlRoom } from "../src/ui/components/DiagnosisControlRoom";
import { addMunicipalDocument, type AddMunicipalDocumentInput, type MunicipalDocumentRepository } from "../src/domain/repository";

const source = { system: "test", collectedAt: "2026-10-31T00:00:00.000Z" };
const empty = { municipalityId: "zagra", documents: [], updatedAt: "2026-10-31T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;
const add = (repo: MunicipalDocumentRepository, input: Partial<AddMunicipalDocumentInput> & { id: string; kind: AddMunicipalDocumentInput["kind"] }) =>
  addMunicipalDocument(repo, { title: input.id, source, tags: [], ...input });
const declaration = { declaredBy: "tecnica@sas.es", declaredAt: "2026-10-31T00:00:00.000Z", referenceDate: "2026-10-31" };
const base = { evidenceCount: 0, healthReportLoaded: false, studiesLoaded: Array(13).fill(false), studyEvidenceCount: 0, assetCount: 0 };

describe("buildDiagnosisControlSummary", () => {
  it("expediente vacío: todo a cero y estado vacío", () => {
    const s = buildDiagnosisControlSummary({ ...base, repository: empty });
    expect(s.overall).toBe("empty");
    expect(s.metrics).toMatchObject({ activeDocuments: 0, studiesLoaded: 0, totalStudies: 13, withoutTemporalDeclaration: 0 });
    expect(s.modules.map(m => m.state)).toEqual(["empty", "empty", "empty", "empty", "empty", "empty"]);
  });

  it("clasifica por módulo sin contar estudios como otras fuentes y excluye archivados", () => {
    let repo = add(empty, { id: "hr", kind: "health-report" });
    repo = add(repo, { id: "ibse", kind: "redcap-export", tags: ["redcap-export", "ibse"] });
    repo = add(repo, { id: "sf", kind: "strategic-framework" });
    repo = add(repo, { id: "td", kind: "territorial-documentation" });
    repo = add(repo, { id: "old", kind: "other" });
    repo = { ...repo, documents: repo.documents.map(d => d.id === "old" ? { ...d, status: "archived" as const } : d) };
    const studies = Array(13).fill(false); studies[0] = true;
    const s = buildDiagnosisControlSummary({ ...base, repository: repo, healthReportLoaded: true, evidenceCount: 6, studiesLoaded: studies, studyEvidenceCount: 6 });
    expect(s.overall).toBe("ready");
    expect(s.metrics.activeDocuments).toBe(4);
    const byId = Object.fromEntries(s.modules.map(m => [m.id, m]));
    expect(byId["studies"]).toMatchObject({ value: "1 de 13", state: "partial" });
    expect(byId["frameworks"].count).toBe(1);
    expect(byId["other-sources"].count).toBe(1);
  });

  it("línea temporal: solo fechas y alcances declarados; nunca la fecha de carga", () => {
    let repo = add(empty, { id: "a", kind: "territorial-documentation", title: "Informe 2017", temporal: { documentDate: { value: "2017", precision: "year" }, observedPeriod: { literal: "2015–2016" }, temporalScope: "historical", declaration } });
    repo = add(repo, { id: "b", kind: "strategic-framework", title: "Norma 2024", cycle: { status: "current", referenceYear: 2024 } });
    repo = add(repo, { id: "c", kind: "qualitative-material", title: "Acta sin fecha" });
    repo = add(repo, { id: "d", kind: "other", title: "Propuesta sin declarar", temporal: { documentDate: { value: "2026-05", precision: "month" }, temporalScope: "current" } });
    const s = buildDiagnosisControlSummary({ ...base, repository: repo });
    expect(s.timeline.map(e => e.documentId)).toEqual(["d", "b", "a", "c"]);
    const byId = Object.fromEntries(s.timeline.map(e => [e.documentId, e]));
    expect(byId.a).toMatchObject({ scope: "historical", scopeSource: "declaration", dateLabel: "2017 · período 2015–2016" });
    expect(byId.b).toMatchObject({ scope: "current", scopeSource: "cycle", dateLabel: "Año de referencia 2024" });
    expect(byId.c).toMatchObject({ scope: "undetermined", scopeSource: "none" });
    expect(byId.c.dateLabel).toBeUndefined();
    // Un alcance sin declaración humana no cuenta como declarado.
    expect(byId.d).toMatchObject({ scope: "undetermined", scopeSource: "none" });
    expect(s.scopeCounts).toEqual({ current: 1, historical: 1, mixed: 0, undetermined: 2 });
    expect(s.metrics.withoutTemporalDeclaration).toBe(2);
  });
});

describe("DiagnosisControlRoom", () => {
  it("muestra municipio, resumen, matriz y línea temporal con nombres legibles", () => {
    const repo = add(empty, { id: "hr", kind: "health-report", title: "Informe de Salud de Zagra" });
    const summary = buildDiagnosisControlSummary({ ...base, repository: repo, healthReportLoaded: true });
    const html = renderToStaticMarkup(<DiagnosisControlRoom municipalityName="Zagra" summary={summary} kindLabels={[{ value: "health-report", label: "Informe de Salud" }]} onOpenModule={() => {}} />);
    expect(html).toContain("Zagra");
    expect(html).toContain("Sala de control");
    expect(html).toContain("Sin alcance temporal declarado");
    expect(html).toContain("Estudios complementarios");
    expect(html).toContain("Ver detalle");
    expect(html).toContain("Informe de Salud de Zagra");
    expect(html).toContain("Fecha no declarada");
    expect(html).not.toContain(">health-report<");
  });
  it("usa nombres legibles también para tipos fuera del selector", () => {
    const repo = add(empty, { id: "r", kind: "redcap-export", title: "IBSE - a.csv", tags: ["ibse"] });
    const html = renderToStaticMarkup(<DiagnosisControlRoom municipalityName="Atarfe" summary={buildDiagnosisControlSummary({ ...base, repository: repo })} />);
    expect(html).toContain("Exportación REDCap");
  });
});
