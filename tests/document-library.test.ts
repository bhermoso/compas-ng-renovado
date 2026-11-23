import { describe, expect, it } from "vitest";
import {
  assignLibraryDocumentToWorkspace,
  collectCompasDocumentLibrary,
} from "../src/application/document-library";
import { createEvidenceStore } from "../src/domain/evidence";
import { createMunicipalityContext } from "../src/domain/municipality";
import {
  addMunicipalDocument,
  createMunicipalDocumentRepository,
  type DocumentKind,
  type MunicipalDocument,
} from "../src/domain/repository";
import {
  createMunicipalityWorkspace,
  type MunicipalityWorkspace,
} from "../src/domain/workspace";

function makeWorkspace(
  municipalityId: string,
  municipalityName: string
): MunicipalityWorkspace {
  return createMunicipalityWorkspace(
    createMunicipalityContext({
      id: municipalityId,
      name: municipalityName,
      province: "Granada",
    }),
    createMunicipalDocumentRepository({ municipalityId }),
    createEvidenceStore(municipalityId)
  );
}

function addDocument(
  workspace: MunicipalityWorkspace,
  input: {
    id: string;
    kind: DocumentKind;
    title: string;
    sourceText?: string;
    canGenerateEvidence?: boolean;
    tags?: string[];
  }
): { workspace: MunicipalityWorkspace; document: MunicipalDocument } {
  const repository = addMunicipalDocument(workspace.repository, {
    id: input.id,
    kind: input.kind,
    title: input.title,
    source: {
      system: "Expediente origen de prueba",
      collectedAt: "2026-01-01T00:00:00.000Z",
    },
    sourceText: input.sourceText,
    canGenerateEvidence: input.canGenerateEvidence,
    tags: input.tags ?? [input.kind],
  });
  const document = repository.documents.find((doc) => doc.id === input.id);
  if (document === undefined) throw new Error("Documento de prueba no creado");
  return {
    workspace: { ...workspace, repository },
    document,
  };
}

describe("Biblioteca documental COMPAS", () => {
  it("no expone documentos locales de otros expedientes como marcos reutilizables", () => {
    let source = makeWorkspace("granada-centro", "Granada-Centro");
    const strategic = addDocument(source, {
      id: "epvsa",
      kind: "strategic-framework",
      title: "EPVSA 2024-2030",
      sourceText: "Linea estrategica de salud comunitaria.",
    });
    source = strategic.workspace;
    const healthReport = addDocument(source, {
      id: "health-report",
      kind: "health-report",
      title: "Informe de Salud Granada-Centro",
      sourceText: "Texto no reutilizable como extra intermunicipal.",
      canGenerateEvidence: false,
      tags: ["health-report"],
    });
    source = healthReport.workspace;
    const localAssets = addDocument(source, {
      id: "localiza-centro",
      kind: "localiza-salud",
      title: "Activos Localiza Salud Granada-Centro",
      sourceText: "Activos concretos de un territorio concreto.",
      tags: ["localiza-salud", "asset"],
    });
    source = localAssets.workspace;
    const territorial = addDocument(source, {
      id: "diagnostico-centro",
      kind: "territorial-documentation",
      title: "Diagnostico territorial Granada-Centro",
      sourceText: "Diagnostico local no reutilizable como extra intermunicipal.",
    });
    source = territorial.workspace;

    const library = collectCompasDocumentLibrary(
      [source, makeWorkspace("alfacar", "Alfacar")],
      "alfacar"
    );

    expect(library).toHaveLength(0);
    expect(library.some((item) => item.document.id === "health-report")).toBe(
      false
    );
    expect(library.some((item) => item.document.id === "localiza-centro")).toBe(
      false
    );
    expect(
      library.some((item) => item.document.id === "diagnostico-centro")
    ).toBe(false);
  });

  it("no copia marcos estrategicos procedentes de expedientes municipales concretos", () => {
    const source = makeWorkspace("granada-centro", "Granada-Centro");
    const added = addDocument(source, {
      id: "plan-mayores",
      kind: "strategic-framework",
      title: "Plan estrategico de mayores",
      sourceText: "Prioridad: envejecimiento activo y cuidados comunitarios.",
    });
    const target = makeWorkspace("alfacar", "Alfacar");

    const result = assignLibraryDocumentToWorkspace({
      workspace: target,
      sourceMunicipalityId: "granada-centro",
      sourceMunicipalityName: "Granada-Centro",
      document: added.document,
      atoms: [],
    });

    expect(result.status).toBe("not-assignable");
    expect(result.workspace.repository.documents).toHaveLength(0);
    expect(result.atomsCreated).toHaveLength(0);
  });

  it("no expone ni copia automaticamente tipos no reutilizables como health-report", () => {
    let source = makeWorkspace("granada-centro", "Granada-Centro");
    const added = addDocument(source, {
      id: "health-report",
      kind: "health-report",
      title: "Informe de Salud Granada-Centro",
      sourceText: "Contenido sanitario local.",
      canGenerateEvidence: false,
      tags: ["health-report"],
    });
    source = added.workspace;
    const target = makeWorkspace("alfacar", "Alfacar");
    const library = collectCompasDocumentLibrary([source, target], "alfacar");

    expect(library).toHaveLength(0);

    const result = assignLibraryDocumentToWorkspace({
      workspace: target,
      sourceMunicipalityId: "granada-centro",
      sourceMunicipalityName: "Granada-Centro",
      document: added.document,
      atoms: [],
    });

    expect(result.status).toBe("not-assignable");
    expect(result.workspace.repository.documents).toHaveLength(0);
  });
});
