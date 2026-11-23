/**
 * tests/document-loaders-persistence.test.ts
 *
 * Contrato local de persistencia documental de los cargadores visibles.
 * Replica a nivel de servicio el flujo exacto de cada cargador de la UI
 * (creación de documento → fusión en workspace → guardado con el servicio
 * real de persistencia → recarga) y fija que ningún registro se pierde.
 *
 * Incidencia origen (2026-07-08): el cargador de «Marco estratégico» permitía
 * cargar un PDF sin semántica de sustitución — recargar el mismo marco lo
 * duplicaba (síntoma «Plan de Mayores duplicado»). La corrección introduce
 * removeEquivalentStrategicFramework: la carga nueva sustituye a la anterior
 * por título o fichero normalizados, purgando los derivados del sustituido.
 */

import { describe, it, expect } from "vitest";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import {
  ingestManualDocument,
  removeEquivalentStrategicFramework,
} from "../src/application/document-ingestion";
import {
  saveWorkspaceToLocalStorage,
  loadWorkspaceFromLocalStorage,
} from "../src/infrastructure/persistence/local-storage";
import { addMunicipalDocument } from "../src/domain/repository";
import { getCategory } from "../src/ui/components/documentRepositoryCategorization";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

// ── Simulación de localStorage ────────────────────────────────────────────────

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

const SCOPE_ID = "granada-centro";

function makeWorkspace(): MunicipalityWorkspace {
  return createCompleteMunicipalityWorkspace({
    id: SCOPE_ID,
    name: "Granada-Centro",
    province: "Granada",
    territorialType: "distrito",
  });
}

/**
 * Réplica exacta de la rama PDF de handleLoadDocumentFile para un marco:
 * sustitución por equivalencia + documento de referencia sin evidencias.
 */
function loadStrategicFrameworkPdf(
  prev: MunicipalityWorkspace,
  fileName: string,
  docTitle: string
): MunicipalityWorkspace {
  const documentId = crypto.randomUUID();
  const replaced = removeEquivalentStrategicFramework(prev.repository, {
    title: docTitle,
    sourceFileName: fileName,
  });
  const nextRepository = addMunicipalDocument(replaced.repository, {
    id: documentId,
    kind: "strategic-framework",
    title: docTitle,
    source: {
      system: "Archivo PDF — referencia documental",
      collectedAt: new Date().toISOString(),
    },
    sourceFileName: fileName,
    canGenerateEvidence: false,
    tags: ["strategic-framework"],
  });
  const nextStore =
    replaced.removedDocumentIds.length > 0
      ? {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (a) =>
              a.provenance.documentId === undefined ||
              !replaced.removedDocumentIds.includes(a.provenance.documentId)
          ),
          updatedAt: new Date().toISOString(),
        }
      : prev.evidenceStore;
  return {
    ...prev,
    repository: nextRepository,
    evidenceStore: nextStore,
    updatedAt: new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Marco estratégico — el cargador corregido
// ══════════════════════════════════════════════════════════════════════════════

describe("cargador de marco estratégico — persistencia documental garantizada", () => {
  it("cargar un marco PDF crea el registro con kind, fichero y sin evidencias", () => {
    const ws = loadStrategicFrameworkPdf(
      makeWorkspace(),
      "Plan de mayores 2020-23.pdf",
      "Plan de mayores 2020 23"
    );
    const marcos = ws.repository.documents.filter((d) => d.kind === "strategic-framework");
    expect(marcos.length).toBe(1);
    expect(marcos[0].canGenerateEvidence).toBe(false);
    expect(marcos[0].sourceFileName).toBe("Plan de mayores 2020-23.pdf");
    expect(marcos[0].source.system).toContain("referencia documental");
    expect(ws.evidenceStore.atoms.length).toBe(0);
  });

  it("aparece en el bloque «Marcos estratégicos para Plan de Acción», no como fuente diagnóstica", () => {
    const ws = loadStrategicFrameworkPdf(
      makeWorkspace(),
      "Plan de mayores 2020-23.pdf",
      "Plan de mayores 2020 23"
    );
    const marco = ws.repository.documents[0];
    expect(getCategory(marco)).toBe("strategic-input");
  });

  it("sobrevive a guardar y recargar con los servicios reales de persistencia", () => {
    store.clear();
    const ws = loadStrategicFrameworkPdf(
      makeWorkspace(),
      "Plan de mayores 2020-23.pdf",
      "Plan de mayores 2020 23"
    );
    expect(saveWorkspaceToLocalStorage(ws)).toBe(true);
    const loaded = loadWorkspaceFromLocalStorage(SCOPE_ID);
    expect(loaded).not.toBeNull();
    const marcos = loaded!.repository.documents.filter(
      (d) => d.kind === "strategic-framework"
    );
    expect(marcos.length).toBe(1);
    expect(marcos[0].sourceFileName).toBe("Plan de mayores 2020-23.pdf");
    expect(marcos[0].canGenerateEvidence).toBe(false);
    expect(loaded!.evidenceStore.atoms.length).toBe(0);
  });

  it("recargar el mismo marco NO duplica: la carga nueva sustituye a la anterior", () => {
    let ws = makeWorkspace();
    ws = loadStrategicFrameworkPdf(ws, "Plan de mayores 2020-23.pdf", "Plan de mayores 2020 23");
    const primeraId = ws.repository.documents[0].id;
    ws = loadStrategicFrameworkPdf(ws, "Plan de mayores 2020-23.pdf", "Plan de mayores 2020 23");
    const marcos = ws.repository.documents.filter((d) => d.kind === "strategic-framework");
    expect(marcos.length).toBe(1);
    expect(marcos[0].id).not.toBe(primeraId); // es la versión nueva
  });

  it("la sustitución también purga las evidencias de un marco previo cargado con texto", () => {
    let ws = makeWorkspace();
    // Marco cargado antes por la vía DOCX/texto (genera prioridades estratégicas)
    const conTexto = ingestManualDocument({
      repository: ws.repository,
      evidenceStore: ws.evidenceStore,
      kind: "strategic-framework",
      title: "EPVSA 2024 2030",
      plainText: "Línea 1 EPVSA.\nLínea 2 EPVSA.",
      sourceFileName: "epvsa.docx",
      sourceSystem: "Archivo DOCX cargado",
    });
    expect(conTexto).not.toBeNull();
    ws = { ...ws, repository: conTexto!.repository, evidenceStore: conTexto!.evidenceStore };
    expect(ws.evidenceStore.atoms.length).toBeGreaterThan(0);

    // Se recarga el mismo marco como PDF de referencia
    ws = loadStrategicFrameworkPdf(ws, "epvsa.pdf", "EPVSA 2024 2030");
    const marcos = ws.repository.documents.filter((d) => d.kind === "strategic-framework");
    expect(marcos.length).toBe(1);
    expect(marcos[0].sourceFileName).toBe("epvsa.pdf");
    expect(ws.evidenceStore.atoms.length).toBe(0);
  });

  it("marcos distintos NO se sustituyen entre sí", () => {
    let ws = makeWorkspace();
    ws = loadStrategicFrameworkPdf(ws, "epvsa.pdf", "EPVSA 2024 2030");
    ws = loadStrategicFrameworkPdf(ws, "esca.pdf", "ESCA 2026 2030");
    ws = loadStrategicFrameworkPdf(ws, "Plan de mayores 2020-23.pdf", "Plan de mayores 2020 23");
    expect(
      ws.repository.documents.filter((d) => d.kind === "strategic-framework").length
    ).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Resto de cargadores visibles — el registro persiste tras guardar/recargar
// ══════════════════════════════════════════════════════════════════════════════

describe("cargadores documentales visibles — todo registro sobrevive a save/load", () => {
  const textualKinds = [
    { kind: "territorial-documentation", title: "Informe Vigía Centro Sur", esperaAtomos: true },
    { kind: "qualitative-material", title: "Acta Grupo Motor", esperaAtomos: true },
    { kind: "localiza-salud", title: "Activos Localiza", esperaAtomos: true },
    { kind: "longitudinal-evidence", title: "Serie longitudinal", esperaAtomos: true },
  ] as const;

  for (const caso of textualKinds) {
    it(`${caso.kind}: crea documento, actualiza workspace y persiste`, () => {
      store.clear();
      const base = makeWorkspace();
      const result = ingestManualDocument({
        repository: base.repository,
        evidenceStore: base.evidenceStore,
        kind: caso.kind,
        title: caso.title,
        plainText: "Centro comunitario | Recurso de prueba del territorio.",
      });
      expect(result).not.toBeNull();
      const ws: MunicipalityWorkspace = {
        ...base,
        repository: result!.repository,
        evidenceStore: result!.evidenceStore,
        updatedAt: new Date().toISOString(),
      };
      expect(ws.repository.documents.some((d) => d.kind === caso.kind)).toBe(true);
      if (caso.esperaAtomos) expect(result!.atomsCreated).toBeGreaterThan(0);

      expect(saveWorkspaceToLocalStorage(ws)).toBe(true);
      const loaded = loadWorkspaceFromLocalStorage(SCOPE_ID);
      expect(loaded).not.toBeNull();
      expect(loaded!.repository.documents.some((d) => d.kind === caso.kind)).toBe(true);
      expect(loaded!.evidenceStore.atoms.length).toBe(ws.evidenceStore.atoms.length);
    });
  }

  it("health-report: el documento persiste y nunca genera evidencias (D-HR-01)", () => {
    store.clear();
    const base = makeWorkspace();
    const result = ingestManualDocument({
      repository: base.repository,
      evidenceStore: base.evidenceStore,
      kind: "health-report",
      title: "Informe de Salud",
      plainText: "Texto del informe que no debe atomizarse.",
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(0);
    const ws: MunicipalityWorkspace = {
      ...base,
      repository: result!.repository,
      evidenceStore: result!.evidenceStore,
      updatedAt: new Date().toISOString(),
    };
    expect(saveWorkspaceToLocalStorage(ws)).toBe(true);
    const loaded = loadWorkspaceFromLocalStorage(SCOPE_ID);
    expect(loaded!.repository.documents.some((d) => d.kind === "health-report")).toBe(true);
    expect(loaded!.evidenceStore.atoms.length).toBe(0);
  });
});
