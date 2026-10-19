import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import {
  buildAntecedents,
  buildDiagnosticAnswers,
  buildCanonicalBuildContext,
  buildCanonicalEditorialView,
  buildCanonicalTechnicalSpace,
  conciliationParagraph,
  excludeHistoricalSources,
} from "../src/application/health-profile";
import { projectCanonicalToDocumentModel } from "../src/application/psl-c-export/pslcCanonicalProjector";
import { createMunicipalityRuntime } from "../src/application/runtime";
import { ProfileIntegratedEditorialPreview } from "../src/ui/components/ProfileIntegratedEditorialPreview";
import { CycleConciliationPanel } from "../src/ui/components/CycleConciliationPanel";
import {
  addCycleConciliation,
  removeCycleConciliation,
  setMunicipalDocumentCycle,
} from "../src/domain/repository";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const load = (id: string): MunicipalityWorkspace =>
  parseWorkspaceJSON(readFileSync(`public/seeds/compas-ng-workspace-${id}.json`, "utf8"))!;

const META = {
  title: "t", subtitle: "s", fileName: "f", portada: [],
  traceability: {
    sourceHash: "h", artifactId: "a", sourcePSLId: "p", sourcePSLVersion: "1",
    sourcePSLEvidenceStoreVersion: "1", frozenEvidenceAtomCount: 0,
  },
};

function setup(declare: boolean) {
  const base = load("atarfe");
  const [h, c] = [base.repository.documents[0].id, base.repository.documents[1].id];
  let repository = setMunicipalDocumentCycle(base.repository, h, { status: "historical", referenceYear: 2022 });
  repository = setMunicipalDocumentCycle(repository, c, { status: "current", referenceYear: 2026 });
  if (declare) {
    repository = addCycleConciliation(repository, {
      id: "c1",
      topic: "Principal problema de salud percibido",
      relation: "divergence",
      historical: { documentId: h, statement: "Se cita el ruido." },
      current: { documentId: c, statement: "Se cita la soledad." },
      note: "Pendiente de contraste en el Grupo Motor.",
    });
  }
  return { ws: { ...base, repository } as MunicipalityWorkspace, h, c };
}

function viewOf(ws: MunicipalityWorkspace) {
  const atoms = excludeHistoricalSources(ws).evidenceStore.atoms;
  const psl = createMunicipalityRuntime({ workspace: ws }).psl;
  const answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: atoms.filter((a) => a.kind === "determinant").map((a) => a.title),
    assets: [],
  });
  const ctx = buildCanonicalBuildContext({ psl, perfil: undefined, answers, territory: ws.municipality.identity.name });
  return { view: buildCanonicalEditorialView(ctx), ctx };
}

describe("conciliación entre ciclos", () => {
  it("sin conciliaciones declaradas no hay clave y la cautela no promete comparaciones", () => {
    const { ws } = setup(false);
    expect(ws.repository.conciliations).toBeUndefined();
    const a = buildAntecedents(ws.repository.documents, ws.evidenceStore.atoms, ws.repository.conciliations);
    expect(a).toBeDefined();
    expect("conciliations" in a!).toBe(false);
    expect(a!.temporalCaution).toContain("no compara con el ciclo actual");
  });

  it("una conciliación declarada aparece con la relación y las dos fuentes", () => {
    const { ws } = setup(true);
    const a = buildAntecedents(ws.repository.documents, ws.evidenceStore.atoms, ws.repository.conciliations)!;
    expect(a.conciliations).toHaveLength(1);
    const text = conciliationParagraph(a.conciliations![0]);
    expect(text).toContain("Divergencia declarada por el equipo técnico, sin resolver");
    expect(text).toContain("Se cita el ruido.");
    expect(text).toContain("Se cita la soledad.");
    expect(text).toContain("Nota del equipo técnico: Pendiente de contraste en el Grupo Motor.");
    expect(a.temporalCaution).toContain("las declaró el equipo técnico");
  });

  it("si cambia el ciclo de una fuente, la conciliación se omite y se declara", () => {
    const { ws, c } = setup(true);
    const repository = setMunicipalDocumentCycle(ws.repository, c, { status: "historical", referenceYear: 2026 });
    const a = buildAntecedents(repository.documents, ws.evidenceStore.atoms, repository.conciliations)!;
    expect(a.conciliations).toBeUndefined();
    expect(a.temporalCaution).toContain("1 conciliación declarada no se muestra");
  });

  it("una conciliación con texto vacío no se muestra", () => {
    const { ws, h, c } = setup(false);
    const repository = addCycleConciliation(ws.repository, {
      id: "x", topic: "t", relation: "convergence",
      historical: { documentId: h, statement: "  " },
      current: { documentId: c, statement: "algo" },
    });
    const a = buildAntecedents(repository.documents, ws.evidenceStore.atoms, repository.conciliations)!;
    expect(a.conciliations).toBeUndefined();
  });

  it("retirar la última conciliación elimina la clave", () => {
    const { ws } = setup(true);
    const repository = removeCycleConciliation(ws.repository, "c1");
    expect("conciliations" in repository).toBe(false);
  });

  it("pantalla y proyector (DOCX/PDF) llevan el mismo texto", () => {
    const { ws } = setup(true);
    const { view, ctx } = viewOf(ws);
    const paragraph = conciliationParagraph(view.antecedents!.conciliations![0]);
    const model = projectCanonicalToDocumentModel(view, buildCanonicalTechnicalSpace(ctx), META);
    const section = model.sections.find((s) => s.sectionId === "antecedents")!;
    expect(section.paragraphs).toContain(paragraph);
    const html = renderToStaticMarkup(createElement(ProfileIntegratedEditorialPreview, { view } as never));
    expect(html.replace(/&#x27;/g, "'")).toContain(paragraph.replace(/&/g, "&amp;"));
  });

  it("el panel solo se ofrece con una fuente histórica y una actual", () => {
    const { ws } = setup(true);
    const noop = () => undefined;
    const withBoth = renderToStaticMarkup(
      createElement(CycleConciliationPanel, { repository: ws.repository, onAdd: noop, onRemove: noop })
    );
    expect(withBoth).toContain("Conciliación entre ciclos");
    const onlyHist = setMunicipalDocumentCycle(ws.repository, ws.repository.documents[1].id, undefined);
    const none = renderToStaticMarkup(
      createElement(CycleConciliationPanel, { repository: onlyHist, onAdd: noop, onRemove: noop })
    );
    expect(none).toBe("");
  });
});
