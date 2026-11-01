import type { MunicipalityWorkspace } from "./domain/workspace";
import type { CreateMunicipalityContextInput } from "./domain/municipality";
import {
  createCompleteMunicipalityWorkspace,
  isEmptyWorkspaceForPersistenceGuard,
  removeNonObservedZaidinStudies,
} from "./application/workspace";
import {
  loadWorkspaceFromLocalStorage,
  hasWorkspaceInLocalStorage,
} from "./infrastructure/persistence/local-storage";
import { hasMunicipalitySeed } from "./infrastructure/seeds";

/**
 * appWorkspaceHydration
 *
 * Composición a nivel de aplicación: decide cómo cargar el expediente de un
 * municipio (localStorage prioritario → seed canónico → placeholder vacío) y el
 * guard de persistencia que evita la carrera de la hidratación asíncrona.
 * Vive fuera de `App.tsx` para ser testable sin renderizar el componente (los
 * tests SSR no ejecutan efectos) y sin disparar `react-refresh/only-export-components`.
 */

/**
 * Migración incremental de un documento de seed a un expediente ya persistido.
 * A diferencia del reemplazo completo (`shouldReplaceWithSeed`), añade los
 * documentos y átomos canónicos que falten, preservando todo el trabajo del
 * usuario. La marca versionada evita duplicidades, pero no permite que una copia
 * local más pobre tape la base documental oficial del expediente.
 */
export interface SeedDocumentMigration {
  municipalityId: string;
  documentId: string;
  marker: string;
  /** Fusiona todos los documentos y átomos del seed en una sola migración. */
  mergeAllDocuments?: boolean;
  /** Umbral mínimo esperable para detectar copias locales incompletas. */
  expectedMinDocuments?: number;
  /** Umbral mínimo esperable de átomos de evidencia derivados del seed. */
  expectedMinEvidenceAtoms?: number;
}

/**
 * Lista blanca CERRADA de migraciones incrementales autorizadas. No es una
 * reconciliación genérica del seed: solo se migra exactamente lo declarado aquí.
 */
export const INCREMENTAL_SEED_MIGRATIONS: readonly SeedDocumentMigration[] = [
  {
    municipalityId: "granada-zaidin",
    documentId: "__all__",
    marker: "granada-zaidin-documentacion-canonica-v1",
    mergeAllDocuments: true,
    expectedMinDocuments: 8,
    expectedMinEvidenceAtoms: 56,
  },
  {
    municipalityId: "atarfe",
    documentId: "__all__",
    marker: "atarfe-documentacion-canonica-v2",
    mergeAllDocuments: true,
    expectedMinDocuments: 3,
    expectedMinEvidenceAtoms: 11,
  },
  {
    municipalityId: "alfacar",
    documentId: "__all__",
    marker: "alfacar-documentacion-base-v1",
    mergeAllDocuments: true,
    expectedMinDocuments: 2,
    expectedMinEvidenceAtoms: 7,
  },
  {
    municipalityId: "fuente-vaqueros",
    documentId: "__all__",
    marker: "fuente-vaqueros-documentacion-canonica-v2",
    mergeAllDocuments: true,
    expectedMinDocuments: 1,
    expectedMinEvidenceAtoms: 29,
  },
  {
    municipalityId: "loja",
    documentId: "__all__",
    marker: "loja-documentacion-base-v1",
    mergeAllDocuments: true,
    expectedMinDocuments: 6,
    expectedMinEvidenceAtoms: 0,
  },
];

export const ACTIVE_MUNICIPALITY_STORAGE_KEY = "compas-ng:active-municipality";

export function sortMunicipalitiesByName<T extends { name: string }>(
  municipalities: readonly T[]
): T[] {
  return [...municipalities].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
}

export function sanitizeCustomMunicipalities(
  municipalities: readonly CreateMunicipalityContextInput[],
  reservedMunicipalityIds: readonly string[] = []
): CreateMunicipalityContextInput[] {
  const seen = new Set(reservedMunicipalityIds);
  const normalized: CreateMunicipalityContextInput[] = [];

  for (const municipality of municipalities) {
    const id = municipality.id?.trim();
    const name = municipality.name?.trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      ...municipality,
      id,
      name,
      province: municipality.province?.trim() || "Granada",
      territorialType: municipality.territorialType?.trim() || undefined,
      ineCode: municipality.ineCode?.trim() || undefined,
      createdBy: municipality.createdBy?.trim() || undefined,
    });
  }

  return sortMunicipalitiesByName(normalized);
}

export function mergeMunicipalityCatalog(
  defaultMunicipalities: readonly CreateMunicipalityContextInput[],
  customMunicipalities: readonly CreateMunicipalityContextInput[]
): CreateMunicipalityContextInput[] {
  const defaultIds = defaultMunicipalities.map((municipality) => municipality.id);
  return sortMunicipalitiesByName([
    ...defaultMunicipalities,
    ...sanitizeCustomMunicipalities(customMunicipalities, defaultIds),
  ]);
}

export function readActiveMunicipalityId(
  municipalities: readonly Pick<CreateMunicipalityContextInput, "id">[],
  fallbackId: string
): string {
  try {
    const stored = localStorage
      .getItem(ACTIVE_MUNICIPALITY_STORAGE_KEY)
      ?.trim();
    if (stored && municipalities.some((municipality) => municipality.id === stored)) {
      return stored;
    }
  } catch {
    // localStorage can be disabled; the caller's fallback remains authoritative.
  }
  return fallbackId;
}

export function saveActiveMunicipalityId(municipalityId: string): boolean {
  try {
    localStorage.setItem(ACTIVE_MUNICIPALITY_STORAGE_KEY, municipalityId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Acción de migración incremental resuelta para un expediente:
 *   - none               → nada que hacer (marca presente, u otro municipio).
 *   - backfill-marker     → ya contiene el documento pero falta la marca: se estampa
 *                           localmente, sin descargar el seed ni duplicar nada.
 *   - download-and-merge  → falta marca y documento: hay que descargar el seed,
 *                           fusionar el doc + sus átomos y estampar la marca (atómico).
 */
export type SeedMigrationAction =
  | { kind: "none" }
  | { kind: "backfill-marker"; migration: SeedDocumentMigration }
  | { kind: "download-and-merge"; migration: SeedDocumentMigration };

export interface WorkspaceLoadResult {
  workspace: MunicipalityWorkspace;
  protectExistingStorage: boolean;
  /**
   * true cuando NO hay expediente local válido pero existe un seed canónico para
   * el municipio: el workspace devuelto es un placeholder vacío que debe hidratarse
   * de forma asíncrona desde el seed. Mientras esté pendiente, el placeholder NO se
   * persiste (evita la carrera que guarda un expediente vacío antes de la carga).
   */
  seedPending: boolean;
  /**
   * Migración incremental pendiente para un expediente CON CONTENIDO (no vacío).
   * Mutuamente excluyente con `seedPending`: si el expediente se va a reemplazar
   * entero por el seed, no procede migración incremental. `{ kind: "none" }` cuando
   * no hay nada que migrar.
   */
  seedMigration: SeedMigrationAction;
}

function migrationForMunicipality(
  municipalityId: string
): SeedDocumentMigration | undefined {
  return INCREMENTAL_SEED_MIGRATIONS.find(
    (migration) => migration.municipalityId === municipalityId
  );
}

function hasExpectedSeedBaseline(
  workspace: MunicipalityWorkspace,
  migration: SeedDocumentMigration
): boolean {
  const hasExpectedDocs =
    migration.expectedMinDocuments === undefined ||
    workspace.repository.documents.length >= migration.expectedMinDocuments;
  const hasExpectedAtoms =
    migration.expectedMinEvidenceAtoms === undefined ||
    workspace.evidenceStore.atoms.length >= migration.expectedMinEvidenceAtoms;
  return hasExpectedDocs && hasExpectedAtoms;
}

function hasSeedBaselineRegression(
  current: MunicipalityWorkspace,
  stored: MunicipalityWorkspace
): boolean {
  const migration = migrationForMunicipality(current.municipality.identity.id);
  if (migration === undefined) return false;
  return hasExpectedSeedBaseline(current, migration) && !hasExpectedSeedBaseline(stored, migration);
}

/**
 * Resuelve la migración incremental aplicable a un expediente. Predicado puro:
 * si la copia local no alcanza el mínimo documental del seed canónico, se fuerza
 * la descarga y fusión aunque exista una marca antigua. La marca solo cierra la
 * migración cuando el expediente conserva la base esperada.
 */
export function resolveSeedMigration(
  current: MunicipalityWorkspace
): SeedMigrationAction {
  const id = current.municipality.identity.id;
  for (const migration of INCREMENTAL_SEED_MIGRATIONS) {
    if (migration.municipalityId !== id) continue;
    const hasMarker = (current.appliedSeedMigrations ?? []).includes(
      migration.marker
    );
    const hasBaseline = hasExpectedSeedBaseline(current, migration);
    if (hasMarker && !hasBaseline) {
      return { kind: "download-and-merge", migration };
    }
    if (hasMarker) return { kind: "none" };
    const hasDoc = current.repository.documents.some(
      (d) => d.id === migration.documentId
    );
    if (hasDoc) return { kind: "backfill-marker", migration };
    return { kind: "download-and-merge", migration };
  }
  return { kind: "none" };
}

/** Añade una marca de migración al expediente (idempotente). Puro. */
function withMarker(
  workspace: MunicipalityWorkspace,
  marker: string
): MunicipalityWorkspace {
  const current = workspace.appliedSeedMigrations ?? [];
  if (current.includes(marker)) return workspace;
  return { ...workspace, appliedSeedMigrations: [...current, marker] };
}

/**
 * Caso `backfill-marker`: el expediente ya contiene el documento (p. ej. tras una
 * hidratación limpia previa a esta versión). Solo registra la marca; no descarga
 * ni duplica. Puro.
 */
export function backfillSeedMigrationMarker(
  current: MunicipalityWorkspace,
  migration: SeedDocumentMigration
): MunicipalityWorkspace {
  return withMarker(current, migration.marker);
}

/**
 * Caso `download-and-merge`: fusiona el documento del seed y sus átomos derivados
 * (los que apuntan a `documentId`) en el expediente actual, y estampa la marca —
 * TODO en un único objeto devuelto (atómico al persistir). Preserva íntegramente
 * documentos, evidencias y trabajo del usuario. Determinista: usa el sello canónico
 * del documento del seed (no `new Date()`). Idempotente por marca y por id de átomo.
 */
export function applySeedDocumentMigration(
  current: MunicipalityWorkspace,
  seed: MunicipalityWorkspace,
  migration: SeedDocumentMigration
): MunicipalityWorkspace {
  const seedDocs = migration.mergeAllDocuments
    ? seed.repository.documents
    : seed.repository.documents.filter((d) => d.id === migration.documentId);
  if (seedDocs.length === 0) return current;

  const existingDocIds = new Set(current.repository.documents.map((d) => d.id));
  const existingAtomIds = new Set(current.evidenceStore.atoms.map((a) => a.id));
  const migratedDocIds = new Set(seedDocs.map((d) => d.id));
  const docsToAdd = seedDocs.filter((d) => !existingDocIds.has(d.id));
  const atomsToAdd = seed.evidenceStore.atoms.filter(
    (a) =>
      a.provenance.documentId !== undefined &&
      migratedDocIds.has(a.provenance.documentId) &&
      !existingAtomIds.has(a.id)
  );
  if (
    (current.appliedSeedMigrations ?? []).includes(migration.marker) &&
    docsToAdd.length === 0 &&
    atomsToAdd.length === 0
  ) {
    return current;
  }
  const stamp = seed.updatedAt;

  const merged: MunicipalityWorkspace = {
    ...current,
    repository:
      docsToAdd.length === 0
        ? current.repository
        : {
            ...current.repository,
            documents: [...current.repository.documents, ...docsToAdd],
            updatedAt: stamp,
          },
    evidenceStore:
      atomsToAdd.length === 0
        ? current.evidenceStore
        : {
            ...current.evidenceStore,
            atoms: [...current.evidenceStore.atoms, ...atomsToAdd],
            updatedAt: stamp,
          },
    updatedAt: stamp,
  };
  return withMarker(merged, migration.marker);
}

/**
 * Decide si el efecto de persistencia debe OMITIR el guardado. Se omite (a) durante
 * la hidratación asíncrona del seed del municipio —no persistir el placeholder
 * vacío evita la carrera que dejaría el expediente vacío permanente— o (b) cuando
 * el guard protege un expediente vacío sobre datos locales que no rehidrataron.
 * Predicado puro y testable.
 */
export function shouldSkipPersistence(params: {
  workspaceMunicipalityId: string;
  pendingSeedId: string | null;
  protectedEmptyWorkspaceId: string | null;
  isEmpty: boolean;
}): boolean {
  if (params.pendingSeedId === params.workspaceMunicipalityId) return true;
  if (
    params.protectedEmptyWorkspaceId === params.workspaceMunicipalityId &&
    params.isEmpty
  ) {
    return true;
  }
  return false;
}

/**
 * Decide si el placeholder actual puede sustituirse por el seed canónico. SOLO se
 * sustituye cuando el workspace en memoria es del municipio del seed y está VACÍO
 * según la definición canónica `isEmptyWorkspaceForPersistenceGuard` (sin
 * documentos, evidencias, estudios, priorización, perfiles compilados ni ningún
 * otro contenido humano). Nunca sobreescribe contenido real. Predicado puro.
 */
/**
 * Decide si la copia ampliada de IndexedDB debe prevalecer sobre la copia cargada
 * desde localStorage o seed. IndexedDB se consulta siempre porque localStorage
 * puede conservar una copia válida pero antigua si agotó su cuota.
 */
export function shouldRestoreIndexedDbWorkspace(
  current: MunicipalityWorkspace,
  stored: MunicipalityWorkspace
): boolean {
  if (current.municipality.identity.id !== stored.municipality.identity.id) {
    return false;
  }
  const currentIsEmpty = isEmptyWorkspaceForPersistenceGuard(current);
  const storedIsEmpty = isEmptyWorkspaceForPersistenceGuard(stored);
  if (currentIsEmpty && !storedIsEmpty) return true;
  // Una copia vacía de IndexedDB puede ser más reciente que el seed porque se
  // creó antes de que terminara la hidratación. Nunca debe borrar contenido real.
  if (!currentIsEmpty && storedIsEmpty) return false;
  // Si el workspace actual ya contiene la base canónica de un municipio con
  // seed, una copia persistida más pobre no puede sustituirlo por ser más nueva.
  if (hasSeedBaselineRegression(current, stored)) return false;
  if (stored.updatedAt > current.updatedAt) return true;
  // La copia ligera de localStorage no lleva los originales del Diagnóstico y
  // se guarda con la misma fecha que la copia de IndexedDB o la remota. A
  // igualdad de fecha prevalece la que los conserva: si no, un autoguardado
  // posterior los eliminaría también de Firebase.
  return (
    stored.updatedAt === current.updatedAt &&
    (stored.documentOriginals?.length ?? 0) > (current.documentOriginals?.length ?? 0)
  );
}

/**
 * Cuando se conserva `current` y se descarta otra copia del mismo expediente,
 * traslada los originales del Diagnóstico que la otra copia tenga y `current`
 * no, siempre que su documento exista en `current`. Solo añade: nunca quita ni
 * sustituye. Evita perderlos cuando la copia ligera de localStorage (sin
 * originales) gana por fecha. Devuelve `current` si no hay nada que trasladar.
 */
export function withCarriedDocumentOriginals(
  current: MunicipalityWorkspace,
  other: MunicipalityWorkspace | null
): MunicipalityWorkspace {
  if (!other || other.municipality.identity.id !== current.municipality.identity.id) return current;
  const have = new Set((current.documentOriginals ?? []).map((o) => o.documentId));
  const documentIds = new Set(current.repository.documents.map((d) => d.id));
  const carried = (other.documentOriginals ?? []).filter((o) => !have.has(o.documentId) && documentIds.has(o.documentId));
  if (carried.length === 0) return current;
  return { ...current, documentOriginals: [...(current.documentOriginals ?? []), ...carried] };
}

export function shouldReplaceWithSeed(
  current: MunicipalityWorkspace,
  seedMunicipalityId: string
): boolean {
  return (
    current.municipality.identity.id === seedMunicipalityId &&
    isEmptyWorkspaceForPersistenceGuard(current)
  );
}

/**
 * Carga el expediente de un municipio. Prioridad:
 *   1. Un expediente local válido y CON CONTENIDO real gana SIEMPRE (no se toca).
 *   2. Un expediente local válido pero PRÍSTINO/VACÍO es un placeholder de la
 *      versión anterior (creado por `createCompleteMunicipalityWorkspace`); si el
 *      municipio tiene seed canónico, se marca `seedPending` para sustituirlo.
 *   3. Sin ninguna entrada local y con seed → placeholder vacío + `seedPending`.
 *   4. Entrada local presente pero que no rehidrata (esquema anterior/corrupta) →
 *      se protege y NO se hidrata (hay trabajo del usuario que no debe pisarse).
 * La sustitución efectiva la realiza el llamador de forma asíncrona (ver
 * `shouldReplaceWithSeed`), nunca sobre contenido real.
 */
export function loadOrCreateMunicipalityWorkspace(
  municipalityId: string,
  input: CreateMunicipalityContextInput
): WorkspaceLoadResult {
  const loaded = loadWorkspaceFromLocalStorage(municipalityId);
  if (loaded !== null) {
    const migrated = removeNonObservedZaidinStudies(loaded);
    // Placeholder vacío de la versión anterior: sustituible por el seed. Un
    // expediente con contenido real conserva seedPending=false y prevalece.
    const isReplaceablePlaceholder =
      isEmptyWorkspaceForPersistenceGuard(migrated) &&
      hasMunicipalitySeed(municipalityId);
    return {
      workspace: migrated,
      protectExistingStorage: false,
      seedPending: isReplaceablePlaceholder,
      // La migración incremental solo aplica a un expediente CON contenido que no
      // se va a reemplazar entero. Si es placeholder reemplazable, el seed completo
      // (que ya trae el documento y su marca) lo cubre.
      seedMigration: isReplaceablePlaceholder
        ? { kind: "none" }
        : resolveSeedMigration(migrated),
    };
  }

  // Hay entrada local pero no rehidrata (esquema anterior/corrupta): se protege y
  // NO se hidrata seed —hay trabajo del usuario que no debe pisarse—.
  const hasCorruptLocal = hasWorkspaceInLocalStorage(municipalityId);

  return {
    workspace: createCompleteMunicipalityWorkspace(input),
    protectExistingStorage: hasCorruptLocal,
    // Solo se hidrata desde seed cuando no existe NINGUNA entrada local.
    seedPending: !hasCorruptLocal && hasMunicipalitySeed(municipalityId),
    seedMigration: { kind: "none" },
  };
}
