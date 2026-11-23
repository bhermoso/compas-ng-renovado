/**
 * tests/workspace-global-wipe-regression.test.ts
 *
 * Tests de regresión del incidente de persistencia (2026-07-07):
 * la aplicación aparecía vacía para los 5 ámbitos demo tras el incremento
 * de cargadores documentales.
 *
 * DIAGNÓSTICO (ver informe de la sesión):
 *   1. La ruta save → load de LocalStorageWorkspacePersistence NO es destructiva
 *      para workspaces bien formados: estos tests lo fijan como invariante.
 *   2. Sí existía una bomba latente de la misma clase que la Intervención 3:
 *      isEmptyWorkspaceForPersistenceGuard omitía los 7 estudios incorporados
 *      después de su última revisión (AUDIT-C, IPAQ, GHQ-12, PHQ-9, PSQI,
 *      Fagerström, SBQ), projectDatasetImports y perfilLocalDeSalud.
 *      Un workspace con SOLO esas colecciones se consideraba "vacío" y el
 *      guard bloqueaba su guardado (pérdida silenciosa en la ruta protegida).
 *
 * INVARIANTES QUE FIJA ESTE FICHERO (§6 de la orden operativa):
 *   - Ninguna operación de persistencia (guardar, cargar, normalizar) puede
 *     vaciar un workspace poblado bien formado.
 *   - El seed en memoria de los ámbitos demo nunca sobreescribe un workspace
 *     persistido: la carga con datos ilegibles devuelve null SIN escribir,
 *     y el guard de vacío impide guardar el workspace fresco encima.
 *   - Una operación documental (texto pegado o DOCX extraído de
 *     strategic-framework / territorial-documentation / qualitative-material,
 *     o PDF de referencia) solo puede AÑADIR: no toca informe de salud,
 *     estudios complementarios, activos Localiza Salud ni átomos previos.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createCompleteMunicipalityWorkspace,
  isEmptyWorkspaceForPersistenceGuard,
} from "../src/application/workspace";
import {
  saveWorkspaceToLocalStorage,
  loadWorkspaceFromLocalStorage,
  hasWorkspaceInLocalStorage,
  buildWorkspaceStorageKey,
} from "../src/infrastructure/persistence/local-storage";
import { ingestManualDocument } from "../src/application/document-ingestion";
import { addMunicipalDocument } from "../src/domain/repository";
import { createEvidenceAtom, type EvidenceAtom } from "../src/domain/evidence";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

// ── Simulación de localStorage (entorno node) ────────────────────────────────

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

beforeEach(() => store.clear());

// ── Constructores de datos de prueba ─────────────────────────────────────────

const NOW = "2026-07-07T12:00:00.000Z";

/** Los 13 instrumentos del catálogo con su clave de workspace, tag y kind documental. */
const INSTRUMENTS: Array<{
  studyKey: keyof MunicipalityWorkspace;
  tag: string;
  docKind: "redcap-export" | "complementary-study";
}> = [
  { studyKey: "ibseStudy", tag: "ibse", docKind: "redcap-export" },
  { studyKey: "dukeStudy", tag: "duke-eas", docKind: "complementary-study" },
  { studyKey: "predimedStudy", tag: "predimed-eas", docKind: "complementary-study" },
  { studyKey: "sf12Study", tag: "sf12-eas", docKind: "complementary-study" },
  { studyKey: "suenoStudy", tag: "sueno-eas", docKind: "complementary-study" },
  { studyKey: "cageStudy", tag: "cage-eas", docKind: "complementary-study" },
  { studyKey: "auditcStudy", tag: "auditc", docKind: "complementary-study" },
  { studyKey: "ipaqStudy", tag: "ipaq-eas", docKind: "complementary-study" },
  { studyKey: "ghq12Study", tag: "ghq12", docKind: "complementary-study" },
  { studyKey: "phq9Study", tag: "phq9", docKind: "complementary-study" },
  { studyKey: "psqiStudy", tag: "psqi", docKind: "complementary-study" },
  { studyKey: "fagerstromStudy", tag: "fagerstrom", docKind: "complementary-study" },
  { studyKey: "sbqStudy", tag: "sbq", docKind: "complementary-study" },
];

function makeStudy(municipalityId: string, tag: string): unknown {
  return {
    municipalityId,
    sourceFileName: `${tag}.csv`,
    importedAt: NOW,
    aggregates: { n: 100, nValid: 90 },
    methodologicalCautions: [],
    warnings: [],
  };
}

function makeHealthReport(municipalityId: string): MunicipalityWorkspace["healthReport"] {
  return {
    linkedDocumentId: "doc-hr",
    municipalityId,
    title: `Informe de Salud — ${municipalityId}`,
    body: { bodyText: "Texto íntegro del informe de salud." },
    sections: [],
    sourceFileName: "informe.docx",
    createdAt: NOW,
  } as unknown as MunicipalityWorkspace["healthReport"];
}

/**
 * Workspace de Granada-Centro con el estado esperado previo al incidente:
 * informe de salud, 13/13 estudios, 36 evidencias de estudios complementarios,
 * 56 activos Localiza Salud (92 evidencias derivadas totales), distrito sin INE.
 */
function buildGranadaCentroWorkspace(): MunicipalityWorkspace {
  const municipalityId = "granada-centro";
  const base = createCompleteMunicipalityWorkspace({
    id: municipalityId,
    name: "Granada-Centro",
    province: "Granada",
    territorialType: "distrito",
  });

  let repository = base.repository;
  repository = addMunicipalDocument(repository, {
    id: "doc-hr",
    kind: "health-report",
    title: "Informe de Salud — Granada-Centro",
    canGenerateEvidence: false,
    tags: ["health-report"],
  });
  for (const inst of INSTRUMENTS) {
    repository = addMunicipalDocument(repository, {
      id: `doc-${inst.tag}`,
      kind: inst.docKind,
      title: `Estudio ${inst.tag}`,
      tags: [inst.tag],
    });
  }
  repository = addMunicipalDocument(repository, {
    id: "doc-localiza",
    kind: "localiza-salud",
    title: "Activos Localiza Salud — Granada-Centro",
    tags: ["localiza-salud"],
  });

  const atoms: EvidenceAtom[] = [];
  // 36 evidencias de estudios complementarios: 12 instrumentos EAS × 3 átomos.
  const easInstruments = INSTRUMENTS.filter((i) => i.tag !== "ibse");
  for (const inst of easInstruments) {
    for (let n = 1; n <= 3; n++) {
      atoms.push(
        createEvidenceAtom({
          id: `${inst.tag}-atom-${n}`,
          municipalityId,
          kind: "indicator",
          title: `Indicador ${inst.tag} ${n}`,
          content: `Valor agregado ${n} del instrumento ${inst.tag}.`,
          provenance: {
            origin: "complementary-study",
            documentId: `doc-${inst.tag}`,
            extractedAt: NOW,
          },
          tags: [inst.tag],
        })
      );
    }
  }
  // 56 activos Localiza Salud.
  for (let n = 1; n <= 56; n++) {
    atoms.push(
      createEvidenceAtom({
        id: `localiza-atom-${n}`,
        municipalityId,
        kind: "asset",
        title: `Activo Localiza Salud ${n}`,
        content: `Activo comunitario ${n} incorporado desde Localiza Salud.`,
        provenance: {
          origin: "localiza-salud",
          documentId: "doc-localiza",
          extractedAt: NOW,
        },
        tags: ["localiza-salud", "asset"],
      })
    );
  }

  const studies = Object.fromEntries(
    INSTRUMENTS.map((i) => [i.studyKey, makeStudy(municipalityId, i.tag)])
  ) as Partial<MunicipalityWorkspace>;

  return {
    ...base,
    ...studies,
    repository,
    evidenceStore: { ...base.evidenceStore, atoms, updatedAt: NOW },
    healthReport: makeHealthReport(municipalityId),
    updatedAt: NOW,
  };
}

/** Workspace municipal con datos mínimos pero no vacío (para el test global). */
function buildPopulatedMunicipalWorkspace(id: string, name: string): MunicipalityWorkspace {
  const base = createCompleteMunicipalityWorkspace({ id, name, province: "Granada" });
  let repository = base.repository;
  repository = addMunicipalDocument(repository, {
    id: `doc-hr-${id}`,
    kind: "health-report",
    title: `Informe de Salud — ${name}`,
    canGenerateEvidence: false,
    tags: ["health-report"],
  });
  repository = addMunicipalDocument(repository, {
    id: `doc-duke-${id}`,
    kind: "complementary-study",
    title: `DUKE — ${name}`,
    tags: ["duke-eas"],
  });
  const atoms = [1, 2, 3].map((n) =>
    createEvidenceAtom({
      id: `${id}-duke-atom-${n}`,
      municipalityId: id,
      kind: "indicator",
      title: `Indicador DUKE ${n}`,
      content: `Valor ${n}.`,
      provenance: {
        origin: "complementary-study",
        documentId: `doc-duke-${id}`,
        extractedAt: NOW,
      },
      tags: ["duke-eas"],
    })
  );
  return {
    ...base,
    repository,
    evidenceStore: { ...base.evidenceStore, atoms, updatedAt: NOW },
    healthReport: makeHealthReport(id),
    dukeStudy: makeStudy(id, "duke-eas") as MunicipalityWorkspace["dukeStudy"],
    updatedAt: NOW,
  };
}

function countByOrigin(ws: MunicipalityWorkspace, origin: string): number {
  return ws.evidenceStore.atoms.filter((a) => a.provenance.origin === origin).length;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Test global: 5 workspaces poblados sobreviven a save → load → normalización
// ══════════════════════════════════════════════════════════════════════════════

describe("persistencia global — los 5 ámbitos demo no pueden vaciarse", () => {
  it("save → load conserva íntegros los 5 workspaces (4 municipios + Granada-Centro)", () => {
    const workspaces = [
      buildPopulatedMunicipalWorkspace("atarfe", "Atarfe"),
      buildPopulatedMunicipalWorkspace("alfacar", "Alfacar"),
      buildPopulatedMunicipalWorkspace("churriana", "Churriana de la Vega"),
      buildPopulatedMunicipalWorkspace("zagra", "Zagra"),
      buildGranadaCentroWorkspace(),
    ];

    for (const ws of workspaces) {
      expect(saveWorkspaceToLocalStorage(ws)).toBe(true);
    }

    for (const ws of workspaces) {
      const id = ws.municipality.identity.id;
      const loaded = loadWorkspaceFromLocalStorage(id);
      expect(loaded, `workspace ${id} debe poder cargarse`).not.toBeNull();
      expect(loaded!.municipality.identity.id).toBe(id);
      expect(loaded!.healthReport, `healthReport de ${id}`).toBeDefined();
      expect(loaded!.dukeStudy, `dukeStudy de ${id}`).toBeDefined();
      expect(
        loaded!.repository.documents.length,
        `documentos de ${id}`
      ).toBe(ws.repository.documents.length);
      expect(
        loaded!.evidenceStore.atoms.length,
        `átomos de ${id}`
      ).toBe(ws.evidenceStore.atoms.length);
      expect(isEmptyWorkspaceForPersistenceGuard(loaded!)).toBe(false);
    }
  });

  it("cargar un ámbito no altera las claves persistidas de los demás", () => {
    const centro = buildGranadaCentroWorkspace();
    const atarfe = buildPopulatedMunicipalWorkspace("atarfe", "Atarfe");
    saveWorkspaceToLocalStorage(centro);
    saveWorkspaceToLocalStorage(atarfe);

    const rawCentroBefore = store.get(buildWorkspaceStorageKey("granada-centro"));
    loadWorkspaceFromLocalStorage("atarfe");
    loadWorkspaceFromLocalStorage("granada-centro");
    const rawCentroAfter = store.get(buildWorkspaceStorageKey("granada-centro"));

    // La carga es de solo lectura: nunca escribe.
    expect(rawCentroAfter).toBe(rawCentroBefore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Test específico Granada-Centro: estado esperado previo al incidente
// ══════════════════════════════════════════════════════════════════════════════

describe("Granada-Centro — el expediente completo sobrevive a la persistencia", () => {
  it("informe + 13 estudios + 36 evidencias de estudios + 56 activos (92 totales) intactos tras save → load", () => {
    const ws = buildGranadaCentroWorkspace();

    // Precondiciones del expediente reconstruido
    expect(ws.evidenceStore.atoms.length).toBe(92);
    expect(countByOrigin(ws, "complementary-study")).toBe(36);
    expect(countByOrigin(ws, "localiza-salud")).toBe(56);

    expect(saveWorkspaceToLocalStorage(ws)).toBe(true);
    const loaded = loadWorkspaceFromLocalStorage("granada-centro");

    expect(loaded).not.toBeNull();
    const l = loaded!;

    // Informe de Salud
    expect(l.healthReport).toBeDefined();
    expect(l.healthReport!.body.bodyText).toBe("Texto íntegro del informe de salud.");

    // 13 de 13 estudios complementarios
    for (const inst of INSTRUMENTS) {
      expect(l[inst.studyKey], `estudio ${String(inst.studyKey)}`).toBeDefined();
    }

    // 92 evidencias derivadas: 36 de estudios + 56 Localiza Salud
    expect(l.evidenceStore.atoms.length).toBe(92);
    expect(countByOrigin(l, "complementary-study")).toBe(36);
    expect(countByOrigin(l, "localiza-salud")).toBe(56);

    // Documentos del repositorio: informe + 13 estudios + Localiza Salud
    expect(l.repository.documents.length).toBe(15);

    // Identidad territorial: distrito sin INE propio
    expect(l.municipality.identity.id).toBe("granada-centro");
    expect(l.municipality.identity.territorialType).toBe("distrito");
    expect(l.municipality.identity.ineCode).toBeUndefined();

    // El guard lo reconoce como no vacío
    expect(isEmptyWorkspaceForPersistenceGuard(l)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Arranque con datos ilegibles: nunca se sobreescribe el almacenamiento
// ══════════════════════════════════════════════════════════════════════════════

describe("arranque — un workspace fresco jamás pisa datos persistidos ilegibles", () => {
  it("load con schemaVersion desconocida devuelve null SIN escribir, y el guard bloquea el workspace fresco", () => {
    const ws = buildGranadaCentroWorkspace();
    saveWorkspaceToLocalStorage(ws);

    // Simular datos de un esquema distinto (ilegibles para esta versión)
    const key = buildWorkspaceStorageKey("granada-centro");
    const raw = store.get(key)!;
    const tampered = raw.replace('"schemaVersion":"1.0.0"', '"schemaVersion":"0.9.9"');
    store.set(key, tampered);

    // Secuencia de arranque de App.tsx (loadOrCreateMunicipalityWorkspace)
    const loaded = loadWorkspaceFromLocalStorage("granada-centro");
    expect(loaded).toBeNull();
    expect(hasWorkspaceInLocalStorage("granada-centro")).toBe(true);

    // La carga fallida NO ha modificado el almacenamiento
    expect(store.get(key)).toBe(tampered);

    // El workspace fresco que crearía la app está vacío → el guard impide guardarlo
    const fresh = createCompleteMunicipalityWorkspace({
      id: "granada-centro",
      name: "Granada-Centro",
      province: "Granada",
      territorialType: "distrito",
    });
    expect(isEmptyWorkspaceForPersistenceGuard(fresh)).toBe(true);
  });

  it("REGRESIÓN guard: un workspace con SOLO un estudio posterior a la Intervención 3 NO es vacío", () => {
    const base = createCompleteMunicipalityWorkspace({ id: "t", name: "T" });
    const newStudyKeys = [
      "auditcStudy",
      "ipaqStudy",
      "ghq12Study",
      "phq9Study",
      "psqiStudy",
      "fagerstromStudy",
      "sbqStudy",
    ] as const;

    for (const key of newStudyKeys) {
      const ws = { ...base, [key]: makeStudy("t", key) } as MunicipalityWorkspace;
      // Sin la corrección: true → el guard bloqueaba el guardado → pérdida silenciosa.
      expect(isEmptyWorkspaceForPersistenceGuard(ws), key).toBe(false);
    }
  });

  it("REGRESIÓN guard: projectDatasetImports y perfilLocalDeSalud con contenido no son vacíos", () => {
    const base = createCompleteMunicipalityWorkspace({ id: "t", name: "T" });

    const conImports = {
      ...base,
      projectDatasetImports: [{ id: "imp-1", importedAt: NOW } as never],
    } as MunicipalityWorkspace;
    expect(isEmptyWorkspaceForPersistenceGuard(conImports)).toBe(false);

    const conPerfil = {
      ...base,
      perfilLocalDeSalud: {
        interpretaciones: [{ id: "i-1" } as never],
        hipotesis: [],
        preguntasAbiertas: [],
      } as never,
    } as MunicipalityWorkspace;
    expect(isEmptyWorkspaceForPersistenceGuard(conPerfil)).toBe(false);

    // Un perfil presente pero sin ningún elemento sigue contando como vacío
    const conPerfilVacio = {
      ...base,
      perfilLocalDeSalud: {
        interpretaciones: [],
        hipotesis: [],
        preguntasAbiertas: [],
      } as never,
    } as MunicipalityWorkspace;
    expect(isEmptyWorkspaceForPersistenceGuard(conPerfilVacio)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Operación documental reciente: solo puede añadir, nunca borrar
// ══════════════════════════════════════════════════════════════════════════════

describe("carga documental — strategic-framework / territorial-documentation / qualitative-material", () => {
  const textKinds = [
    "strategic-framework",
    "territorial-documentation",
    "qualitative-material",
  ] as const;

  for (const kind of textKinds) {
    it(`ingestar ${kind} (texto o DOCX extraído) no borra informe, estudios, activos ni átomos previos`, () => {
      const full = buildGranadaCentroWorkspace();
      const atomIdsBefore = new Set(full.evidenceStore.atoms.map((a) => a.id));

      const result = ingestManualDocument({
        repository: full.repository,
        evidenceStore: full.evidenceStore,
        kind,
        title: `Documento ${kind}`,
        plainText: "Línea de contenido uno.\nLínea de contenido dos.",
        sourceFileName: "documento.docx",
        sourceSystem: "Archivo DOCX cargado",
      });
      expect(result).not.toBeNull();

      // Réplica del handler de App.tsx: fusión parcial e inmutable
      const next: MunicipalityWorkspace = {
        ...full,
        repository: result!.repository,
        evidenceStore: result!.evidenceStore,
        updatedAt: new Date().toISOString(),
      };

      // Nada se pierde
      expect(next.healthReport).toBeDefined();
      for (const inst of INSTRUMENTS) {
        expect(next[inst.studyKey], String(inst.studyKey)).toBeDefined();
      }
      expect(countByOrigin(next, "complementary-study")).toBe(36);
      expect(countByOrigin(next, "localiza-salud")).toBe(56);
      for (const id of atomIdsBefore) {
        expect(next.evidenceStore.atoms.some((a) => a.id === id)).toBe(true);
      }

      // Solo se añade: el documento nuevo y sus átomos
      expect(next.repository.documents.length).toBe(full.repository.documents.length + 1);
      expect(next.evidenceStore.atoms.length).toBe(92 + result!.atomsCreated);

      // Y el resultado sobrevive a la persistencia
      expect(saveWorkspaceToLocalStorage(next)).toBe(true);
      const reloaded = loadWorkspaceFromLocalStorage("granada-centro");
      expect(reloaded).not.toBeNull();
      expect(reloaded!.evidenceStore.atoms.length).toBe(next.evidenceStore.atoms.length);
      expect(reloaded!.healthReport).toBeDefined();
    });
  }

  it("registrar un PDF de referencia (sin extracción) solo añade el documento, sin tocar nada más", () => {
    const full = buildGranadaCentroWorkspace();

    // Réplica de la rama PDF de handleLoadDocumentFile
    const nextRepository = addMunicipalDocument(full.repository, {
      id: "doc-pdf-ref",
      kind: "strategic-framework",
      title: "Marco estratégico (PDF)",
      sourceFileName: "marco.pdf",
      canGenerateEvidence: false,
      tags: ["strategic-framework"],
    });
    const next: MunicipalityWorkspace = {
      ...full,
      repository: nextRepository,
      updatedAt: new Date().toISOString(),
    };

    expect(next.repository.documents.length).toBe(full.repository.documents.length + 1);
    expect(next.evidenceStore.atoms.length).toBe(92);
    expect(next.healthReport).toBeDefined();
    for (const inst of INSTRUMENTS) {
      expect(next[inst.studyKey], String(inst.studyKey)).toBeDefined();
    }

    expect(saveWorkspaceToLocalStorage(next)).toBe(true);
    const reloaded = loadWorkspaceFromLocalStorage("granada-centro");
    expect(reloaded).not.toBeNull();
    expect(reloaded!.evidenceStore.atoms.length).toBe(92);
    expect(reloaded!.repository.documents.length).toBe(16);
  });
});
