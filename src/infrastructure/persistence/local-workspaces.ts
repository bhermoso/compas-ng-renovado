import type { MunicipalityWorkspace } from "../../domain/workspace";
import { loadAllWorkspacesFromIndexedDB } from "./indexed-db-workspace";
import { parseWorkspaceJSON } from "./local-storage";

/** Expedientes guardados en este navegador (almacenamiento ampliado y localStorage); el más reciente por ámbito. */
export async function loadLocalWorkspaces(): Promise<MunicipalityWorkspace[]> {
  const byId = new Map<string, MunicipalityWorkspace>();
  for (const stored of await loadAllWorkspacesFromIndexedDB()) {
    byId.set(stored.municipality.identity.id, stored);
  }
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key === null || !key.startsWith("compas-ng:workspace:")) continue;
      const raw = localStorage.getItem(key);
      const parsed = raw ? parseWorkspaceJSON(raw) : null;
      if (parsed === null) continue;
      const id = parsed.municipality.identity.id;
      const current = byId.get(id);
      if (!current || parsed.updatedAt > current.updatedAt) byId.set(id, parsed);
    }
  } catch {
    // localStorage no disponible: se usa solo el almacenamiento ampliado.
  }
  return Array.from(byId.values());
}
