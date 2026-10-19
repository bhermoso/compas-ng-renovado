import type { CreateMunicipalityContextInput } from "../../domain/municipality/MunicipalityContext";
import type { MunicipalityWorkspace } from "../../domain/workspace";

/**
 * Sincronización del catálogo de expedientes con Firebase al abrir la aplicación.
 * Firebase es la custodia; el navegador es una caché de trabajo. El resultado no
 * depende del equipo desde el que se abra.
 *
 * Orden de decisión por expediente:
 *  1. Con lápida en Firebase (eliminado en cualquier equipo): se descarta la copia local.
 *  2. En Firebase y ausente aquí: se incorpora al catálogo de este equipo.
 *  3. Local con contenido y ausente en Firebase: se sube (alta o migración).
 */
export interface RemoteScope {
  id: string;
  name: string;
  type: string;
}

export interface CatalogSyncPorts {
  listScopes(): Promise<RemoteScope[]>;
  listTombstones(): Promise<Set<string>>;
  hasRemoteWorkspace(id: string): Promise<boolean>;
  readRemoteContext(id: string): Promise<CreateMunicipalityContextInput | null>;
  uploadWorkspace(workspace: MunicipalityWorkspace): Promise<void>;
  localWorkspaces(): Promise<MunicipalityWorkspace[]>;
  localCatalogIds(): ReadonlySet<string>;
  isEmptyWorkspace(workspace: MunicipalityWorkspace): boolean;
  discardLocal(id: string): Promise<void>;
}

export interface CatalogSyncResult {
  discarded: string[];
  adopted: CreateMunicipalityContextInput[];
  uploaded: string[];
  errors: Array<{ id: string; message: string }>;
}

export async function syncRemoteCatalog(
  ports: CatalogSyncPorts
): Promise<CatalogSyncResult> {
  const result: CatalogSyncResult = {
    discarded: [],
    adopted: [],
    uploaded: [],
    errors: [],
  };
  const fail = (id: string, error: unknown) =>
    result.errors.push({
      id,
      message: error instanceof Error ? error.message : "error desconocido",
    });

  const [scopes, tombstones, locals] = await Promise.all([
    ports.listScopes(),
    ports.listTombstones(),
    ports.localWorkspaces(),
  ]);
  const catalog = ports.localCatalogIds();
  const localById = new Map(locals.map((w) => [w.municipality.identity.id, w]));

  // 1. Lápidas.
  for (const id of tombstones) {
    if (!catalog.has(id) && !localById.has(id)) continue;
    try {
      await ports.discardLocal(id);
      result.discarded.push(id);
      localById.delete(id);
    } catch (error) {
      fail(id, error);
    }
  }

  // 2. En Firebase y ausentes aquí.
  for (const scope of scopes) {
    if (tombstones.has(scope.id) || catalog.has(scope.id)) continue;
    try {
      if (!(await ports.hasRemoteWorkspace(scope.id))) continue;
      const context = await ports.readRemoteContext(scope.id);
      if (context !== null) result.adopted.push(context);
    } catch (error) {
      fail(scope.id, error);
    }
  }

  // 3. Locales con contenido que Firebase aún no tiene.
  for (const [id, workspace] of localById) {
    if (tombstones.has(id) || ports.isEmptyWorkspace(workspace)) continue;
    try {
      if (await ports.hasRemoteWorkspace(id)) continue;
      await ports.uploadWorkspace(workspace);
      result.uploaded.push(id);
    } catch (error) {
      fail(id, error);
    }
  }
  return result;
}
