import type { MunicipalityWorkspace } from "./domain/workspace";
import type { CreateMunicipalityContextInput } from "./domain/municipality";
import {
  createCompleteMunicipalityWorkspace,
  isEmptyWorkspaceForPersistenceGuard,
} from "./application/workspace";
import {
  loadWorkspaceFromLocalStorage,
  hasWorkspaceInLocalStorage,
} from "./infrastructure/persistence/local-storage";

/**
 * appWorkspaceHydration
 *
 * Composición a nivel de aplicación: decide cómo cargar el expediente de un
 * municipio (localStorage prioritario → placeholder vacío; Firebase se recupera
 * después) y el guard de persistencia que protege una copia local ilegible.
 * Vive fuera de `App.tsx` para ser testable sin renderizar el componente (los
 * tests SSR no ejecutan efectos) y sin disparar `react-refresh/only-export-components`.
 */

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

export interface WorkspaceLoadResult {
  workspace: MunicipalityWorkspace;
  protectExistingStorage: boolean;
}

/**
 * Decide si el efecto de persistencia debe OMITIR el guardado: cuando el guard
 * protege un expediente vacío sobre datos locales que no rehidrataron.
 * Predicado puro y testable.
 */
export function shouldSkipPersistence(params: {
  workspaceMunicipalityId: string;
  protectedEmptyWorkspaceId: string | null;
  isEmpty: boolean;
}): boolean {
  if (
    params.protectedEmptyWorkspaceId === params.workspaceMunicipalityId &&
    params.isEmpty
  ) {
    return true;
  }
  return false;
}

/**
 * Decide si la copia ampliada de IndexedDB debe prevalecer sobre la copia cargada
 * desde localStorage. IndexedDB se consulta siempre porque localStorage
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
  // Una copia vacía nunca borra contenido real, aunque sea más reciente.
  if (!currentIsEmpty && storedIsEmpty) return false;
  if (stored.updatedAt > current.updatedAt) return true;
  // La copia ligera de localStorage no lleva los originales del Diagnóstico y
  // se guarda con la misma fecha que la copia de IndexedDB o la remota. A
  // igualdad de fecha prevalece la que los conserva: si no, un autoguardado
  // posterior los eliminaría también de Firebase.
  return (
    stored.updatedAt === current.updatedAt &&
    ((stored.documentOriginals?.length ?? 0) + (stored.documentDerivedFiles?.length ?? 0)) > ((current.documentOriginals?.length ?? 0) + (current.documentDerivedFiles?.length ?? 0))
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
  const removed = new Set((current.deletedDocuments ?? []).map(o => o.documentId));
  const carried = (other.documentOriginals ?? []).filter((o) => !have.has(o.documentId) && documentIds.has(o.documentId) && !removed.has(o.documentId));
  const derivedHave = new Set((current.documentDerivedFiles ?? []).map(d => d.id));
  const derivedCarried = (other.documentDerivedFiles ?? []).filter(d => !derivedHave.has(d.id) && documentIds.has(d.derivedFromDocumentId) && !removed.has(d.derivedFromDocumentId));
  if (carried.length === 0 && derivedCarried.length === 0) return current;
  return {
    ...current,
    documentOriginals: [...(current.documentOriginals ?? []), ...carried],
    documentDerivedFiles: [...(current.documentDerivedFiles ?? []), ...derivedCarried],
  };
}

/**
 * Carga el expediente de un municipio desde este navegador:
 *   1. Un expediente local válido se usa tal cual; Firebase decide después si
 *      hay una copia compartida más reciente.
 *   2. Sin entrada local → placeholder vacío.
 *   3. Entrada local presente pero que no rehidrata (esquema anterior o dañada) →
 *      placeholder protegido: no se persiste para no pisar ese trabajo.
 */
export function loadOrCreateMunicipalityWorkspace(
  municipalityId: string,
  input: CreateMunicipalityContextInput
): WorkspaceLoadResult {
  const loaded = loadWorkspaceFromLocalStorage(municipalityId);
  if (loaded !== null) return { workspace: loaded, protectExistingStorage: false };
  return {
    workspace: createCompleteMunicipalityWorkspace(input),
    protectExistingStorage: hasWorkspaceInLocalStorage(municipalityId),
  };
}
