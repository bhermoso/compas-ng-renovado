/**
 * Hidratación inicial de expedientes municipales desde seeds canónicos (Paso post-4).
 *
 * Prioridad: localStorage válido → seed canónico → placeholder vacío. Nunca se
 * sobreescribe trabajo local; nunca se persiste el placeholder vacío durante la
 * hidratación asíncrona; solo se hidratan municipios con export real.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadMunicipalitySeed,
  municipalitySeedUrl,
  hasMunicipalitySeed,
  MUNICIPALITY_SEEDS,
} from "../src/infrastructure/seeds";
import {
  loadOrCreateMunicipalityWorkspace,
  shouldSkipPersistence,
  shouldReplaceWithSeed,
  shouldRestoreIndexedDbWorkspace,
  resolveSeedMigration,
  applySeedDocumentMigration,
  backfillSeedMigrationMarker,
  INCREMENTAL_SEED_MIGRATIONS,
} from "../src/appWorkspaceHydration";
import {
  saveWorkspaceToLocalStorage,
  parseWorkspaceJSON,
} from "../src/infrastructure/persistence/local-storage";
import {
  createCompleteMunicipalityWorkspace,
  isEmptyWorkspaceForPersistenceGuard,
} from "../src/application/workspace";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

// ── localStorage mínimo ───────────────────────────────────────────────────────
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

// Seed desplegable REAL (el fichero que Vite copia a dist/).
const SEED_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/seeds/compas-ng-workspace-granada-zaidin.json"
);
const SEED_RAW = readFileSync(SEED_PATH, "utf8");

// Export restaurable de origen. El seed desplegable puede conservar material
// histórico adicional, pero debe mantener las fuentes observadas y los activos.
const CANONICAL_EXPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json"
);

const GRANADA_SEED_INPUT = {
  id: "granada-zaidin",
  name: "Granada-Zaidín",
  province: "Granada",
  territorialType: "distrito",
  createdBy: "test",
};

// ── fetch mocks ───────────────────────────────────────────────────────────────
function okFetch(body: string, onUrl?: (url: string) => void): typeof fetch {
  return (async (url: string) => {
    onUrl?.(url);
    return { ok: true, status: 200, text: async () => body };
  }) as unknown as typeof fetch;
}
function notOkFetch(): typeof fetch {
  return (async () => ({ ok: false, status: 404, text: async () => "" })) as unknown as typeof fetch;
}
function throwingFetch(): typeof fetch {
  return (async () => {
    throw new Error("network down");
  }) as unknown as typeof fetch;
}

const GRANADA_INPUT = {
  id: "granada-zaidin",
  name: "Granada-Zaidín",
  province: "Granada",
  territorialType: "distrito",
  createdBy: "test",
};
const ALFACAR_INPUT = {
  id: "alfacar",
  name: "Alfacar",
  province: "Granada",
  ineCode: "18011",
  createdBy: "test",
};

beforeEach(() => {
  store.clear();
});

describe("hidratación de expedientes municipales desde seed", () => {
  it("1. localStorage vacío: un municipio con seed carga el expediente canónico", async () => {
    const ws = await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/",
      fetchImpl: okFetch(SEED_RAW),
    });
    expect(ws).not.toBeNull();
    expect(ws?.municipality.identity.id).toBe("granada-zaidin");
    expect(ws?.municipality.identity.name).toBe("Granada-Zaidín");
  });

  it("2. Granada-Zaidín carga 8 documentos reales y 56 evidencias de activos", async () => {
    const ws = await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/",
      fetchImpl: okFetch(SEED_RAW),
    });
    expect(ws?.repository.documents.length).toBe(8);
    expect(ws?.evidenceStore.atoms.length).toBe(56);
  });

  it("3. un workspace local existente prevalece sobre el seed", () => {
    // Sembrar un expediente local con contenido para granada-zaidin.
    const localWs = JSON.parse(SEED_RAW) as MunicipalityWorkspace;
    expect(saveWorkspaceToLocalStorage(localWs)).toBe(true);

    const result = loadOrCreateMunicipalityWorkspace("granada-zaidin", GRANADA_INPUT);
    // El seed NO se hidrata (no hay carrera): gana el local.
    expect(result.seedPending).toBe(false);
    expect(result.workspace.repository.documents.length).toBe(8);
    expect(result.workspace.evidenceStore.atoms.length).toBe(56);
  });

  it("4a. seed con schemaVersion incorrecto → rechazado (null)", async () => {
    const bad = JSON.stringify({ ...JSON.parse(SEED_RAW), schemaVersion: "9.9.9" });
    const ws = await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/",
      fetchImpl: okFetch(bad),
    });
    expect(ws).toBeNull();
  });

  it("4b. seed con identidad municipal que no concuerda → rechazado (null)", async () => {
    const parsed = JSON.parse(SEED_RAW);
    parsed.municipality.identity.id = "otro-municipio";
    const ws = await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/",
      fetchImpl: okFetch(JSON.stringify(parsed)),
    });
    expect(ws).toBeNull();
  });

  it("4c. HTTP no-ok o error de red → rechazado (null), sin lanzar", async () => {
    expect(
      await loadMunicipalitySeed("granada-zaidin", { baseUrl: "/", fetchImpl: notOkFetch() })
    ).toBeNull();
    expect(
      await loadMunicipalitySeed("granada-zaidin", { baseUrl: "/", fetchImpl: throwingFetch() })
    ).toBeNull();
  });

  it("5. Alfacar tiene seed canónico y arranca con hidratación pendiente", async () => {
    const alfacarRaw = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../public/seeds/compas-ng-workspace-alfacar.json"
      ),
      "utf8"
    );
    expect(hasMunicipalitySeed("alfacar")).toBe(true);
    const result = loadOrCreateMunicipalityWorkspace("alfacar", ALFACAR_INPUT);
    expect(result.seedPending).toBe(true);
    expect(result.workspace.repository.documents.length).toBe(0);
    expect(result.workspace.evidenceStore.atoms.length).toBe(0);
    await expect(
      loadMunicipalitySeed("alfacar", { baseUrl: "/", fetchImpl: okFetch(alfacarRaw) })
    ).resolves.toMatchObject({
      municipality: { identity: { id: "alfacar" } },
      repository: { documents: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]) },
    });
  });

  it("5b. granada-zaidin sin expediente local → seedPending true con placeholder vacío", () => {
    const result = loadOrCreateMunicipalityWorkspace("granada-zaidin", GRANADA_INPUT);
    expect(result.seedPending).toBe(true);
    expect(result.workspace.repository.documents.length).toBe(0);
    expect(result.workspace.evidenceStore.atoms.length).toBe(0);
  });

  it("6. no se persiste el placeholder vacío durante la hidratación asíncrona", () => {
    // Mientras pendingSeedId apunta al municipio actual → OMITE el guardado.
    expect(
      shouldSkipPersistence({
        workspaceMunicipalityId: "granada-zaidin",
        pendingSeedId: "granada-zaidin",
        protectedEmptyWorkspaceId: null,
        isEmpty: true,
      })
    ).toBe(true);
    // Tras terminar la hidratación (pendingSeedId liberado) → SÍ persiste.
    expect(
      shouldSkipPersistence({
        workspaceMunicipalityId: "granada-zaidin",
        pendingSeedId: null,
        protectedEmptyWorkspaceId: null,
        isEmpty: false,
      })
    ).toBe(false);
    // Comprobación de extremo a extremo del efecto: con seedPending y guardado
    // omitido, localStorage permanece vacío (no se guarda el placeholder).
    store.clear();
    const result = loadOrCreateMunicipalityWorkspace("granada-zaidin", GRANADA_INPUT);
    const skip = shouldSkipPersistence({
      workspaceMunicipalityId: result.workspace.municipality.identity.id,
      pendingSeedId: result.seedPending
        ? result.workspace.municipality.identity.id
        : null,
      protectedEmptyWorkspaceId: null,
      isEmpty: true,
    });
    if (!skip) saveWorkspaceToLocalStorage(result.workspace);
    expect(store.has("compas-ng:workspace:granada-zaidin")).toBe(false);
  });

  it("7. la URL del seed funciona con el BASE_URL de GitHub Pages", async () => {
    const seed = MUNICIPALITY_SEEDS["granada-zaidin"];
    expect(municipalitySeedUrl(seed, "/COMPAS_NG/")).toBe(
      "/COMPAS_NG/seeds/compas-ng-workspace-granada-zaidin.json"
    );
    // El loader pide EXACTAMENTE esa URL bajo el base de Pages.
    let requested = "";
    await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/COMPAS_NG/",
      fetchImpl: okFetch(SEED_RAW, (u) => {
        requested = u;
      }),
    });
    expect(requested).toBe("/COMPAS_NG/seeds/compas-ng-workspace-granada-zaidin.json");
  });

  it("8. el seed desplegable existe en public/ (Vite lo copia a dist) y es válido", () => {
    const parsed = JSON.parse(SEED_RAW);
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.municipality.identity.id).toBe("granada-zaidin");
    expect(parsed.municipality.identity.name).toBe("Granada-Zaidín");
    expect(parsed.repository.documents.length).toBe(8);
    expect(parsed.evidenceStore.atoms.length).toBe(56);
    // La ruta registrada coincide con el fichero desplegable.
    expect(MUNICIPALITY_SEEDS["granada-zaidin"].path).toBe(
      "seeds/compas-ng-workspace-granada-zaidin.json"
    );
  });

  it("8b. el seed desplegable conserva las fuentes del export restaurable y añade solo el histórico archivado", () => {
    const seed = parseWorkspaceJSON(SEED_RAW)!;
    const canonicalRawText = readFileSync(CANONICAL_EXPORT_PATH, "utf8");
    const canonicalRaw = JSON.parse(canonicalRawText) as MunicipalityWorkspace;
    const canonical = parseWorkspaceJSON(canonicalRawText)!;
    expect(seed.repository.documents.length).toBe(8);
    expect(canonicalRaw.repository.documents.length).toBe(7);
    expect(canonical.repository.documents.length).toBe(8);
    expect(seed.repository.documents.map((document) => document.id).sort()).toEqual(
      canonical.repository.documents.map((document) => document.id).sort()
    );
    expect(seed.evidenceStore.atoms.length).toBe(canonicalRaw.evidenceStore.atoms.length);
    expect(seed.evidenceStore.atoms.length).toBe(56);
    expect(new Set(seed.evidenceStore.atoms.map((atom) => atom.id))).toEqual(
      new Set(canonicalRaw.evidenceStore.atoms.map((atom) => atom.id))
    );
    const canonicalIds = new Set(canonicalRaw.repository.documents.map((document) => document.id));
    const seedIds = new Set(seed.repository.documents.map((document) => document.id));
    for (const id of canonicalIds) expect(seedIds.has(id), id).toBe(true);
    const extraDocs = seed.repository.documents.filter((document) => !canonicalIds.has(document.id));
    expect(extraDocs).toHaveLength(1);
    expect(extraDocs[0].kind).toBe("health-report");
    const historical = seed.repository.documents.find((document) => document.id === "1ca11945-44a2-4af5-b779-bb02582eb516");
    expect(historical?.kind).toBe("other");
    expect(historical?.status).toBe("archived");
  });

  // ── Migración: placeholder vacío de la versión anterior → seed canónico ────────

  it("6b. MIGRACIÓN: localStorage con Granada-Zaidín válido pero prístino → al arrancar carga el seed (8/56)", async () => {
    // Un navegador de la versión anterior guardó un expediente VÁLIDO pero VACÍO
    // (creado por createCompleteMunicipalityWorkspace). Debe considerarse placeholder.
    const placeholder = createCompleteMunicipalityWorkspace(GRANADA_SEED_INPUT);
    expect(isEmptyWorkspaceForPersistenceGuard(placeholder)).toBe(true);
    expect(saveWorkspaceToLocalStorage(placeholder)).toBe(true);

    // Arranque: se detecta el placeholder y se marca la hidratación del seed.
    const result = loadOrCreateMunicipalityWorkspace("granada-zaidin", GRANADA_INPUT);
    expect(result.seedPending).toBe(true);
    expect(result.workspace.repository.documents.length).toBe(0);
    expect(shouldReplaceWithSeed(result.workspace, "granada-zaidin")).toBe(true);

    // Hidratación asíncrona (misma decisión que el efecto de App).
    const seed = await loadMunicipalitySeed("granada-zaidin", {
      baseUrl: "/",
      fetchImpl: okFetch(SEED_RAW),
    });
    const hydrated = shouldReplaceWithSeed(result.workspace, "granada-zaidin")
      ? seed
      : result.workspace;
    expect(hydrated?.repository.documents.length).toBe(8);
    expect(hydrated?.evidenceStore.atoms.length).toBe(56);
  });

  it("7b. un workspace local NO vacío prevalece: no se sustituye por el seed", () => {
    // Expediente local con contenido humano real (priorización ciudadana).
    const local: MunicipalityWorkspace = {
      ...createCompleteMunicipalityWorkspace(GRANADA_SEED_INPUT),
      thematicPrioritisation: {
        municipalityId: "granada-zaidin",
        selectedTopicIds: ["bienestar-emocional"],
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    };
    expect(isEmptyWorkspaceForPersistenceGuard(local)).toBe(false);
    expect(saveWorkspaceToLocalStorage(local)).toBe(true);

    const result = loadOrCreateMunicipalityWorkspace("granada-zaidin", GRANADA_INPUT);
    // No es placeholder: prevalece y NO se hidrata el seed.
    expect(result.seedPending).toBe(false);
    expect(shouldReplaceWithSeed(result.workspace, "granada-zaidin")).toBe(false);
    expect(result.workspace.thematicPrioritisation?.selectedTopicIds).toEqual([
      "bienestar-emocional",
    ]);
    // No se ha sustituido por el seed canónico.
    expect(result.workspace.repository.documents.length).toBe(0);
  });
});

// ── Migración incremental de activos Localiza para Atarfe (marca versionada) ────

const ATARFE_SEED_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/seeds/compas-ng-workspace-atarfe.json"
);
const ATARFE_SEED_RAW = readFileSync(ATARFE_SEED_PATH, "utf8");
const ATARFE_MARKER = "atarfe-localiza-v1";
const ATARFE_MIGRATION = INCREMENTAL_SEED_MIGRATIONS.find(
  (m) => m.municipalityId === "atarfe"
)!;
const ATARFE_INPUT = {
  id: "atarfe",
  name: "Atarfe",
  province: "Granada",
  ineCode: "18022",
  createdBy: "test",
};
const LOJA_SEED_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/seeds/compas-ng-workspace-loja.json"
);
const LOJA_SEED_RAW = readFileSync(LOJA_SEED_PATH, "utf8");
const LOJA_MIGRATION = INCREMENTAL_SEED_MIGRATIONS.find(
  (m) => m.municipalityId === "loja"
)!;
const LOJA_INPUT = {
  id: "loja",
  name: "Loja",
  province: "Granada",
  ineCode: "18122",
  createdBy: "test",
};

/** Seed real de Atarfe (3 docs / 11 átomos, con la marca aplicada). */
function atarfeSeed(): MunicipalityWorkspace {
  return parseWorkspaceJSON(ATARFE_SEED_RAW)!;
}

/** Copia sin la marca de migración (simula un expediente previo a esta feature). */
function stripMigrationMarker(ws: MunicipalityWorkspace): MunicipalityWorkspace {
  const clone: MunicipalityWorkspace = { ...ws };
  delete clone.appliedSeedMigrations;
  return clone;
}

/** Atarfe "legacy" previo a la feature: sin Localiza, sin marca (2 docs / 6 átomos). */
function legacyAtarfeWithoutLocaliza(): MunicipalityWorkspace {
  const seed = atarfeSeed();
  return {
    ...stripMigrationMarker(seed),
    repository: {
      ...seed.repository,
      documents: seed.repository.documents.filter(
        (d) => d.id !== ATARFE_MIGRATION.documentId
      ),
    },
    evidenceStore: {
      ...seed.evidenceStore,
      atoms: seed.evidenceStore.atoms.filter(
        (a) => a.provenance.documentId !== ATARFE_MIGRATION.documentId
      ),
    },
  };
}

describe("sincronización incremental de expedientes canónicos", () => {
  it("sincroniza el seed completo de Atarfe sobre una copia parcial", () => {
    const legacy = legacyAtarfeWithoutLocaliza();
    const migration = INCREMENTAL_SEED_MIGRATIONS.find(
      (item) => item.municipalityId === "atarfe"
    )!;
    expect(resolveSeedMigration(legacy)).toEqual({
      kind: "download-and-merge",
      migration,
    });

    const migrated = applySeedDocumentMigration(legacy, atarfeSeed(), migration);
    expect(migrated.repository.documents).toHaveLength(
      atarfeSeed().repository.documents.length
    );
    expect(migrated.evidenceStore.atoms).toHaveLength(
      atarfeSeed().evidenceStore.atoms.length
    );
    expect(migrated.appliedSeedMigrations).toContain(migration.marker);
  });

  it("preserva documentos y átomos propios al completar el expediente", () => {
    const legacy = legacyAtarfeWithoutLocaliza();
    const userDoc = {
      ...legacy.repository.documents[0],
      id: "doc-usuario-propio",
      title: "Documento propio del usuario",
    };
    const userAtom = {
      ...legacy.evidenceStore.atoms[0],
      id: "atom-usuario-propio",
    };
    const current: MunicipalityWorkspace = {
      ...legacy,
      repository: {
        ...legacy.repository,
        documents: [...legacy.repository.documents, userDoc],
      },
      evidenceStore: {
        ...legacy.evidenceStore,
        atoms: [...legacy.evidenceStore.atoms, userAtom],
      },
    };
    const migration = INCREMENTAL_SEED_MIGRATIONS.find(
      (item) => item.municipalityId === "atarfe"
    )!;
    const migrated = applySeedDocumentMigration(current, atarfeSeed(), migration);
    expect(migrated.repository.documents.some((d) => d.id === userDoc.id)).toBe(true);
    expect(migrated.evidenceStore.atoms.some((a) => a.id === userAtom.id)).toBe(true);
  });

  it("es idempotente y respeta retiradas posteriores gracias a la marca", () => {
    const migration = INCREMENTAL_SEED_MIGRATIONS.find(
      (item) => item.municipalityId === "atarfe"
    )!;
    const once = applySeedDocumentMigration(
      legacyAtarfeWithoutLocaliza(),
      atarfeSeed(),
      migration
    );
    expect(resolveSeedMigration(once)).toEqual({ kind: "none" });
    expect(applySeedDocumentMigration(once, atarfeSeed(), migration)).toBe(once);
  });

  it("Granada-Zaidín también propone sincronización completa si falta la marca", () => {
    const zaidin = JSON.parse(SEED_RAW) as MunicipalityWorkspace;
    const migration = INCREMENTAL_SEED_MIGRATIONS.find(
      (item) => item.municipalityId === "granada-zaidin"
    )!;
    expect(resolveSeedMigration(zaidin)).toEqual({
      kind: "download-and-merge",
      migration,
    });
  });

  it("un placeholder vacío sigue usando hidratación completa, no migración", () => {
    const placeholder = createCompleteMunicipalityWorkspace(ATARFE_INPUT);
    expect(saveWorkspaceToLocalStorage(placeholder)).toBe(true);
    const result = loadOrCreateMunicipalityWorkspace("atarfe", ATARFE_INPUT);
    expect(result.seedPending).toBe(true);
    expect(result.seedMigration).toEqual({ kind: "none" });
  });

  it("una baja en Loja no restaura automáticamente documentos canónicos ya migrados", () => {
    const seed = parseWorkspaceJSON(LOJA_SEED_RAW)!;
    const partial: MunicipalityWorkspace = {
      ...seed,
      repository: {
        ...seed.repository,
        documents: seed.repository.documents.slice(0, 3),
      },
      appliedSeedMigrations: [LOJA_MIGRATION.marker],
      updatedAt: "2026-10-09T08:00:00.000Z",
    };
    expect(resolveSeedMigration(partial)).toEqual({ kind: "none" });
    // Una recuperación manual explícita sigue disponible si la pérdida fue accidental.
    const repaired = applySeedDocumentMigration(partial, seed, LOJA_MIGRATION);
    expect(repaired.repository.documents).toHaveLength(seed.repository.documents.length);
  });

  it("las bajas explícitas de Loja impiden reintroducir el documento y sus evidencias desde un seed", () => {
    const seed = parseWorkspaceJSON(LOJA_SEED_RAW)!;
    const removed = seed.repository.documents[0];
    const partial: MunicipalityWorkspace = {
      ...seed,
      repository: { ...seed.repository, documents: seed.repository.documents.filter(d => d.id !== removed.id) },
      evidenceStore: { ...seed.evidenceStore, atoms: seed.evidenceStore.atoms.filter(a => a.provenance.documentId !== removed.id) },
      deletedDocuments: [{ documentId: removed.id, title: removed.title, deletedAt: "2026-11-04T14:00:00Z" }],
    };
    const result = applySeedDocumentMigration(partial, seed, LOJA_MIGRATION);
    expect(result.repository.documents.some(d => d.id === removed.id)).toBe(false);
    expect(result.evidenceStore.atoms.some(a => a.provenance.documentId === removed.id)).toBe(false);
  });

  it("Loja se repara si IndexedDB aporta una copia parcial durante la hidratación del seed", () => {
    const seed = parseWorkspaceJSON(LOJA_SEED_RAW)!;
    const placeholder = createCompleteMunicipalityWorkspace(LOJA_INPUT);
    const indexedPartial: MunicipalityWorkspace = {
      ...seed,
      repository: {
        ...seed.repository,
        documents: seed.repository.documents.slice(0, 2),
      },
      appliedSeedMigrations: [],
      updatedAt: "2026-10-09T08:00:00.000Z",
    };

    expect(shouldRestoreIndexedDbWorkspace(placeholder, indexedPartial)).toBe(true);
    const migration = resolveSeedMigration(indexedPartial);
    expect(migration).toEqual({
      kind: "download-and-merge",
      migration: LOJA_MIGRATION,
    });
    const repaired =
      migration.kind === "download-and-merge"
        ? applySeedDocumentMigration(indexedPartial, seed, migration.migration)
        : indexedPartial;
    expect(repaired.repository.documents).toHaveLength(seed.repository.documents.length);
    expect(
      repaired.repository.documents.some((document) => document.kind === "health-report")
    ).toBe(true);
  });
});

describe("recuperación desde almacenamiento ampliado", () => {
  it("recupera IndexedDB aunque localStorage contenga un seed no vacío más antiguo", () => {
    const current = JSON.parse(ATARFE_SEED_RAW) as MunicipalityWorkspace;
    const stored = structuredClone(current);
    current.updatedAt = "2026-09-01T00:00:00.000Z";
    stored.updatedAt = "2026-10-05T09:00:00.000Z";
    expect(isEmptyWorkspaceForPersistenceGuard(current)).toBe(false);
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(true);
  });

  it("no permite que una copia vacía más reciente sustituya el seed hidratado", () => {
    const current = JSON.parse(ATARFE_SEED_RAW) as MunicipalityWorkspace;
    const stored = createCompleteMunicipalityWorkspace(ATARFE_INPUT);
    current.updatedAt = "2026-10-05T09:00:00.000Z";
    stored.updatedAt = "2026-10-08T10:00:00.000Z";
    expect(isEmptyWorkspaceForPersistenceGuard(current)).toBe(false);
    expect(isEmptyWorkspaceForPersistenceGuard(stored)).toBe(true);
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
  });

  it("respeta una baja posterior en Loja cuando la migración ya está marcada", () => {
    const current = parseWorkspaceJSON(LOJA_SEED_RAW)!;
    const stored: MunicipalityWorkspace = {
      ...current,
      repository: {
        ...current.repository,
        documents: current.repository.documents.slice(0, 3),
      },
      updatedAt: "2099-10-09T08:00:00.000Z",
    };
    expect(current.repository.documents).toHaveLength(6);
    expect(stored.repository.documents).toHaveLength(3);
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(true);
  });

  it("no sustituye una copia local más reciente ni mezcla municipios", () => {
    const current = JSON.parse(ATARFE_SEED_RAW) as MunicipalityWorkspace;
    const stored = structuredClone(current);
    current.updatedAt = "2026-10-05T10:00:00.000Z";
    stored.updatedAt = "2026-10-05T09:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
    stored.municipality.identity.id = "otro-municipio";
    stored.updatedAt = "2026-10-05T11:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
  });
});


describe("expediente canónico de Fuente Vaqueros", () => {
  const fuenteSeedPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../public/seeds/compas-ng-workspace-fuente-vaqueros.json"
  );

  it("se despliega, conserva la identidad y contiene únicamente la selección territorial autorizada", async () => {
    const raw = readFileSync(fuenteSeedPath, "utf8");
    const parsed = parseWorkspaceJSON(raw);
    expect(hasMunicipalitySeed("fuente-vaqueros")).toBe(true);
    expect(parsed).not.toBeNull();
    expect(parsed?.municipality.identity).toMatchObject({
      id: "fuente-vaqueros",
      name: "Fuente Vaqueros",
      province: "Granada",
      ineCode: "18079",
    });
    expect(parsed?.repository.documents).toHaveLength(1);
    expect(parsed?.repository.documents[0]).toMatchObject({
      kind: "territorial-documentation",
      sourceFileName: "PLIZD FUENTE VAQUEROS 2024.pdf",
    });
    expect(parsed?.evidenceStore.atoms.length).toBeGreaterThan(0);

    await expect(
      loadMunicipalitySeed("fuente-vaqueros", {
        baseUrl: "/COMPAS_NG/",
        fetchImpl: okFetch(raw),
      })
    ).resolves.toMatchObject({
      municipality: { identity: { id: "fuente-vaqueros" } },
    });
  });
});

describe("Fuente Vaqueros en navegadores sin descarga de JSON", () => {
  const input = {
    id: "fuente-vaqueros", name: "Fuente Vaqueros",
    province: "Granada", ineCode: "18079", createdBy: "test",
  };
  it("recupera un placeholder persistido sin ninguna petición de red", async () => {
    const placeholder = createCompleteMunicipalityWorkspace(input);
    expect(saveWorkspaceToLocalStorage(placeholder)).toBe(true);
    const loaded = loadOrCreateMunicipalityWorkspace(input.id, input);
    expect(loaded.seedPending).toBe(true);
    let requests = 0;
    const blockedFetch = (async () => {
      requests++;
      throw new Error("ERR_BLOCKED_BY_CLIENT");
    }) as typeof fetch;
    const seed = await loadMunicipalitySeed(input.id, {
      baseUrl: "/COMPAS_NG/", fetchImpl: blockedFetch,
    });
    expect(requests).toBe(0);
    expect(seed).not.toBeNull();
    expect(shouldReplaceWithSeed(loaded.workspace, input.id)).toBe(true);
    expect(seed!.repository.documents).toHaveLength(1);
    expect(seed!.evidenceStore.atoms).toHaveLength(29);
    expect(saveWorkspaceToLocalStorage(seed!)).toBe(true);
    const reloaded = loadOrCreateMunicipalityWorkspace(input.id, input);
    expect(reloaded.seedPending).toBe(false);
    expect(reloaded.workspace.repository.documents).toHaveLength(1);
    expect(reloaded.workspace.evidenceStore.atoms).toHaveLength(29);
  });
  it("la copia incluida coincide con el seed público y cada carga es independiente", async () => {
    const raw = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),
      "../public/seeds/compas-ng-workspace-fuente-vaqueros.json"), "utf8");
    const first = await loadMunicipalitySeed(input.id, { baseUrl: "/COMPAS_NG/" });
    expect(first).toEqual(parseWorkspaceJSON(raw));
    first!.repository.documents.length = 0;
    const second = await loadMunicipalitySeed(input.id, { baseUrl: "/COMPAS_NG/" });
    expect(second!.repository.documents).toHaveLength(1);
  });
  it("conserva trabajo local del usuario sin sustituirlo por el expediente inicial", () => {
    const local = {
      ...createCompleteMunicipalityWorkspace(input),
      thematicPrioritisation: {
        municipalityId: input.id, selectedTopicIds: ["bienestar-emocional"],
        updatedAt: "2026-10-08T10:00:00.000Z",
      },
    };
    expect(saveWorkspaceToLocalStorage(local)).toBe(true);
    const loaded = loadOrCreateMunicipalityWorkspace(input.id, input);
    expect(loaded.seedPending).toBe(false);
    expect(shouldReplaceWithSeed(loaded.workspace, input.id)).toBe(false);
    expect(loaded.workspace.thematicPrioritisation).toEqual(local.thematicPrioritisation);
  });
});
