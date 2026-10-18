import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import {
  buildAntecedents,
  buildDiagnosticAnswers,
  excludeHistoricalSources,
} from "../src/application/health-profile";
import {
  buildCanonicalBuildContext,
  buildCanonicalEditorialView,
  CANONICAL_READING_ORDER,
} from "../src/application/health-profile";
import { projectCanonicalToDocumentModel } from "../src/application/psl-c-export/pslcCanonicalProjector";
import { buildCanonicalTechnicalSpace } from "../src/application/health-profile";
import { createMunicipalityRuntime } from "../src/application/runtime";
import { ProfileIntegratedEditorialPreview } from "../src/ui/components/ProfileIntegratedEditorialPreview";
import { setMunicipalDocumentCycle } from "../src/domain/repository";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const SEEDS = ["alfacar", "atarfe", "fuente-vaqueros", "granada-zaidin", "loja"];
const load = (id: string): MunicipalityWorkspace =>
  parseWorkspaceJSON(readFileSync(`public/seeds/compas-ng-workspace-${id}.json`, "utf8"))!;

const META = {
  title: "t",
  subtitle: "s",
  fileName: "f",
  portada: [],
  traceability: {
    sourceHash: "h",
    artifactId: "a",
    sourcePSLId: "p",
    sourcePSLVersion: "1",
    sourcePSLEvidenceStoreVersion: "1",
    frozenEvidenceAtomCount: 0,
  },
};

function viewOf(ws: MunicipalityWorkspace) {
  const atoms = excludeHistoricalSources(ws).evidenceStore.atoms;
  const psl = createMunicipalityRuntime({ workspace: ws }).psl;
  const answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: atoms.filter((a) => a.kind === "determinant").map((a) => a.title),
    assets: atoms.filter((a) => a.kind === "asset").map((a) => ({ title: a.title, content: a.content })),
  });
  const ctx = buildCanonicalBuildContext({ psl, perfil: undefined, answers, territory: ws.municipality.identity.name });
  return { view: buildCanonicalEditorialView(ctx), ctx, answers, psl };
}

function withHistoricalPlizd(): MunicipalityWorkspace {
  const ws = load("fuente-vaqueros");
  const id = ws.repository.documents[0].id;
  return {
    ...ws,
    repository: setMunicipalDocumentCycle(ws.repository, id, { status: "historical", referenceYear: 2022 }),
  };
}

describe("antecedentes: sin ciclo declarado nada cambia", () => {
  it.each(SEEDS)("%s: la vista canónica no lleva la clave antecedents", (id) => {
    const ws = load(id);
    expect(excludeHistoricalSources(ws)).toBe(ws);
    const { view } = viewOf(ws);
    expect("antecedents" in view).toBe(false);
  });
});

describe("antecedentes: con fuente histórica declarada", () => {
  it("la fuente histórica sale de la lectura actual y aparece como antecedente", () => {
    const ws = withHistoricalPlizd();
    const { view, answers, psl } = viewOf(ws);
    expect(view.antecedents?.sources).toHaveLength(1);
    expect(view.antecedents?.sources[0].cycleLabel).toBe("Ciclo histórico · 2022");
    expect(view.antecedents?.temporalCaution).toContain("ciclo anterior (2022)");
    expect(view.antecedents?.temporalCaution).toContain("No hay ninguna fuente de ciclo actual declarada");
    // La lectura actual no usa el documento histórico.
    expect(answers.desigualdadTerritorial.available).toBe(false);
    expect(answers.desigualdadTerritorial.sourceTitles).toEqual([]);
    expect(psl.totalEvidenceAtoms).toBe(0);
  });

  it("el proyector incluye la sección en su posición canónica", () => {
    const { view, ctx } = viewOf(withHistoricalPlizd());
    const model = projectCanonicalToDocumentModel(view, buildCanonicalTechnicalSpace(ctx), META);
    const ids = model.sections.map((s) => s.sectionId);
    expect(ids).toContain("antecedents");
    expect(ids.indexOf("antecedents")).toBeGreaterThan(ids.indexOf("source-blocks"));
    expect(CANONICAL_READING_ORDER.indexOf("antecedents")).toBe(
      CANONICAL_READING_ORDER.indexOf("territorial-readings") + 1
    );
    const section = model.sections.find((s) => s.sectionId === "antecedents")!;
    expect(section.paragraphs[0]).toContain("ciclo anterior");
  });

  it("la pantalla presenta lo mismo que el proyector", () => {
    const { view } = viewOf(withHistoricalPlizd());
    const html = renderToStaticMarkup(createElement(ProfileIntegratedEditorialPreview, { view }));
    expect(html).toContain("Antecedentes de ciclos anteriores");
    expect(html).toContain("Ciclo histórico · 2022");
  });
});

describe("buildAntecedents", () => {
  it("devuelve undefined sin documentos históricos", () => {
    const ws = load("loja");
    expect(buildAntecedents(ws.repository.documents, ws.evidenceStore.atoms)).toBeUndefined();
  });

  it("recuenta respuestas abiertas por pregunta y declara que no consta la muestra", () => {
    const ws = load("fuente-vaqueros");
    const doc = { ...ws.repository.documents[0], cycle: { status: "historical" as const, referenceYear: 2022 } };
    const mk = (n: number, page: number) => ({
      ...ws.evidenceStore.atoms[0],
      id: `a${n}`,
      kind: "participation" as const,
      tags: ["open-answer"],
      provenance: { ...ws.evidenceStore.atoms[0].provenance, page, field: "3.1 Otros problemas" },
    });
    const r = buildAntecedents([doc], [mk(1, 3), mk(2, 4), mk(3, 6)]);
    expect(r?.sources[0].items[0]).toBe("«3.1 Otros problemas»: 3 respuestas abiertas (págs. 3–6).");
    expect(r?.sources[0].gaps[0]).toContain("no incluye la muestra");
  });

  it("una referencia sin texto se declara como tal", () => {
    const ws = load("fuente-vaqueros");
    const doc = { ...ws.repository.documents[0], sourceText: undefined, cycle: { status: "historical" as const } };
    const r = buildAntecedents([doc], []);
    expect(r?.sources[0].items[0]).toBe("Registrado como referencia; el expediente no conserva su texto.");
    expect(r?.temporalCaution).toContain("año no declarado");
  });
});
