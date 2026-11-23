import { describe, expect, it } from "vitest";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import {
  applyCurrentSourcesConsolidation,
  planCurrentSourcesConsolidation,
  retireCurrentPredecessors,
} from "../src/application/workspace/currentSources";
import { addMunicipalDocument } from "../src/domain/repository";
import { createEvidenceAtom } from "../src/domain/evidence";

const municipalityId = "ensayo";
const now = "2026-11-23T12:00:00.000Z";

function base() {
  const state = createCompleteMunicipalityWorkspace({ id: municipalityId, name: "Ensayo" });
  const add = (id: string, kind: Parameters<typeof addMunicipalDocument>[1]["kind"], tags: string[] = [], extra = {}) => {
    state.repository = addMunicipalDocument(state.repository, { id, kind, title: id, tags, ...extra });
    state.repository.documents = state.repository.documents.map(document => document.id === id
      ? { ...document, createdAt: `2026-11-${id.endsWith("2") ? "20" : "10"}T10:00:00.000Z`, ...extra }
      : document);
  };
  add("informe-1", "health-report");
  add("informe-2", "health-report");
  add("informe-2018", "health-report", [], { cycle: { status: "historical", referenceYear: 2018 } });
  add("ibse-1", "redcap-export", ["redcap-export", "ibse-history"], { status: "archived" });
  add("ibse-2", "redcap-export", ["redcap-export", "ibse"]);
  add("localiza-1", "localiza-salud");
  add("localiza-2", "localiza-salud");
  state.healthReport = { linkedDocumentId: "informe-2" } as NonNullable<typeof state.healthReport>;
  state.ibseStudy = { sourceFileName: "ibse-2.csv" } as NonNullable<typeof state.ibseStudy>;
  state.studySourceDocumentIds = { ibseStudy: "ibse-2" };
  state.ibseStudyHistory = [{ replacedAt: now, previousStudy: state.ibseStudy!, documents: [], evidence: [] }];
  state.documentOriginals = [
    { id: "o1", documentId: "informe-1", name: "informe-1.pdf", type: "application/pdf", size: 1, sha256: "a", dataBase64: "" },
    { id: "o2", documentId: "informe-2", name: "informe-2.pdf", type: "application/pdf", size: 1, sha256: "b", dataBase64: "" },
  ] as NonNullable<typeof state.documentOriginals>;
  state.evidenceStore.atoms = [
    createEvidenceAtom({
      id: "ficha", municipalityId, title: "Ficha", content: "Recurso", kind: "asset",
      provenance: {
        documentId: "localiza-1", origin: "localiza-salud", extractedAt: now,
        additionalDocuments: [{ documentId: "localiza-2", sourceLabel: "localiza-2", extractedAt: now }],
      },
    }),
    createEvidenceAtom({
      id: "solo-antigua", municipalityId, title: "Otra", content: "Recurso", kind: "asset",
      provenance: { documentId: "localiza-1", origin: "localiza-salud", extractedAt: now },
    }),
  ];
  return state;
}

describe("una sola versión vigente de cada fuente del proceso actual", () => {
  it("el plan conserva la versión activa, propone eliminar las anteriores y respeta lo histórico", () => {
    const plan = planCurrentSourcesConsolidation(base());
    const byLabel = Object.fromEntries(plan.entries.map(entry => [entry.label, entry]));
    expect(byLabel["Informe de salud"].keep?.id).toBe("informe-2");
    expect(byLabel["Informe de salud"].remove.map(d => d.id)).toEqual(["informe-1"]);
    expect(byLabel["Localiza Salud"].keep?.id).toBe("localiza-2");
    expect(byLabel["Localiza Salud"].remove.map(d => d.id)).toEqual(["localiza-1"]);
    expect(byLabel["Estudio complementario (ibse)"].keep?.id).toBe("ibse-2");
    expect(byLabel["Estudio complementario (ibse)"].remove.map(d => d.id)).toEqual(["ibse-1"]);
    expect(plan.replacedCopies).toBe(1);
    expect(plan.isEmpty).toBe(false);
  });

  it("aplicar el plan elimina documentos, originales, historiales y evidencias que solo dependían de ellos", () => {
    const state = base();
    const next = applyCurrentSourcesConsolidation(state, planCurrentSourcesConsolidation(state), now);
    expect(next.repository.documents.map(d => d.id).sort()).toEqual(["ibse-2", "informe-2", "informe-2018", "localiza-2"]);
    expect(next.documentOriginals?.map(o => o.documentId)).toEqual(["informe-2"]);
    expect(next.ibseStudyHistory).toEqual([]);
    expect(next.evidenceStore.atoms.map(a => a.id)).toEqual(["ficha"]);
    expect(next.evidenceStore.atoms[0].provenance.documentId).toBe("localiza-2");
    expect(next.evidenceStore.atoms[0].provenance.additionalDocuments).toBeUndefined();
    expect(planCurrentSourcesConsolidation(next).isEmpty).toBe(true);
  });

  it("la sustitución al cargar no toca otras fuentes ni documentos históricos", () => {
    const state = base();
    const next = retireCurrentPredecessors(state, { kind: "health-report" }, "informe-2", now);
    expect(next.repository.documents.map(d => d.id)).not.toContain("informe-1");
    expect(next.repository.documents.map(d => d.id)).toContain("informe-2018");
    expect(next.repository.documents.map(d => d.id)).toContain("localiza-1");
    expect(next.ibseStudyHistory).toHaveLength(1);
  });

  it("casos hallados en Firebase: informe antiguo con otro tipo, series duplicadas y copias del informe sustituido", () => {
    const state = base();
    const add = (id: string, kind: Parameters<typeof addMunicipalDocument>[1]["kind"], tags: string[], createdAt: string) => {
      state.repository = addMunicipalDocument(state.repository, { id, kind, title: id, tags });
      state.repository.documents = state.repository.documents.map(document => document.id === id ? { ...document, createdAt } : document);
    };
    add("informe-otro-tipo", "other", ["health-report", "primary-source"], "2026-10-05T10:00:00.000Z");
    add("series-1", "longitudinal-evidence", ["longitudinal-evidence"], "2026-10-26T04:34:00.000Z");
    add("series-2", "longitudinal-evidence", ["longitudinal-evidence"], "2026-10-26T04:44:00.000Z");
    state.previousHealthReports = [
      { linkedDocumentId: "desaparecido" },
      { linkedDocumentId: "informe-2018" },
    ] as NonNullable<typeof state.previousHealthReports>;
    const plan = planCurrentSourcesConsolidation(state);
    const byLabel = Object.fromEntries(plan.entries.map(entry => [entry.label, entry]));
    expect(byLabel["Informe de salud"].remove.map(d => d.id).sort()).toEqual(["informe-1", "informe-otro-tipo"]);
    expect(byLabel["Series comparadas entre ciclos"].keep?.id).toBe("series-2");
    expect(byLabel["Series comparadas entre ciclos"].remove.map(d => d.id)).toEqual(["series-1"]);
    const next = applyCurrentSourcesConsolidation(state, plan, now);
    expect(next.previousHealthReports?.map(report => report.linkedDocumentId)).toEqual(["informe-2018"]);
    expect(next.repository.documents.map(d => d.id)).toContain("informe-2018");
    expect(planCurrentSourcesConsolidation(next).isEmpty).toBe(true);
  });
});
