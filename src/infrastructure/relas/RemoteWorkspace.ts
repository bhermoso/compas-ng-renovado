import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { parseWorkspaceJSON } from "../persistence/local-storage";
import {
  readMembership,
  type RelasClient,
} from "./RelasClient";

const REMOTE_WORKSPACE_SCHEMA = "compas-workspace-chunks/v1";
const CHUNK_SIZE = 180_000;
// Keep document batches well below the 10 MiB request limit, including UTF-8 and metadata.
// https://firebase.google.com/docs/firestore/quotas
const MAX_BATCH_WRITES = 8;
const saveQueues = new WeakMap<RelasClient, Map<string, Promise<void>>>();

interface RemoteWorkspaceManifest {
  schema: typeof REMOTE_WORKSPACE_SCHEMA;
  municipalityId: string;
  snapshotId: string;
  chunkCount: number;
  characterLength: number;
  workspaceUpdatedAt: string;
  savedBy: string;
}

function splitText(value: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < value.length; start += CHUNK_SIZE) {
    chunks.push(value.slice(start, start + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [""];
}

function snapshotId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export async function readRemoteWorkspace(
  client: RelasClient,
  municipalityId: string
): Promise<MunicipalityWorkspace | null> {
  if (!client.auth.currentUser) return null;
  await readMembership(client, municipalityId);
  const manifestRef = doc(
    client.db,
    "relas_scopes",
    municipalityId,
    "workspace",
    "current"
  );
  const manifestSnapshot = await getDocFromServer(manifestRef);
  if (!manifestSnapshot.exists()) return null;
  const manifest = manifestSnapshot.data() as RemoteWorkspaceManifest;
  if (
    manifest.schema !== REMOTE_WORKSPACE_SCHEMA ||
    manifest.municipalityId !== municipalityId ||
    !manifest.snapshotId ||
    !Number.isInteger(manifest.chunkCount) ||
    manifest.chunkCount < 1
  ) {
    throw new Error("El expediente remoto tiene un manifiesto no compatible.");
  }
  const chunksSnapshot = await getDocs(
    collection(
      client.db,
      "relas_scopes",
      municipalityId,
      "workspace_versions",
      manifest.snapshotId,
      "chunks"
    )
  );
  const chunks = chunksSnapshot.docs
    .map((entry) => ({
      id: entry.id,
      index: entry.data().index as number,
      content: entry.data().content as string,
    }))
    .sort((a, b) => a.index - b.index);
  if (
    chunks.length !== manifest.chunkCount ||
    chunks.some(
      (chunk, index) =>
        chunk.index !== index || typeof chunk.content !== "string"
    )
  ) {
    throw new Error("El expediente remoto está incompleto.");
  }
  const raw = chunks.map((chunk) => chunk.content).join("");
  if (raw.length !== manifest.characterLength) {
    throw new Error("El expediente remoto no supera la comprobación de integridad.");
  }
  const workspace = parseWorkspaceJSON(raw);
  if (
    workspace === null ||
    workspace.municipality.identity.id !== municipalityId
  ) {
    throw new Error("El expediente remoto no pertenece al ámbito solicitado.");
  }
  return workspace;
}

export async function saveRemoteWorkspace(
  client: RelasClient,
  workspace: MunicipalityWorkspace
): Promise<void> {
  let queue = saveQueues.get(client);
  if (!queue) { queue = new Map(); saveQueues.set(client, queue); }
  const key = workspace.municipality.identity.id;
  const previous = queue.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => persistRemoteWorkspace(client, workspace));
  queue.set(key, next);
  try { await next; } finally { if (queue.get(key) === next) queue.delete(key); }
}

async function persistRemoteWorkspace(client: RelasClient, workspace: MunicipalityWorkspace): Promise<void> {
  const raw = JSON.stringify(workspace);
  const chunks = splitText(raw);
  if (chunks.length > 400) throw new Error('El expediente supera la capacidad de 400 fragmentos de Firebase. Conserva la versión anterior y reduce el tamaño de los archivos.');
  const user = client.auth.currentUser;
  if (!user) throw new Error("Inicia sesión para guardar el expediente remoto.");
  const role = await readMembership(client, workspace.municipality.identity.id);
  if (role === "reader") {
    throw new Error("La cuenta tiene acceso de consulta y no puede guardar.");
  }
  await assertScopeNotWithdrawn(client, workspace.municipality.identity.id);
  await ensureRemoteScope(client, workspace);
  const id = snapshotId();
  for (let start = 0; start < chunks.length; start += MAX_BATCH_WRITES) {
    const batch = writeBatch(client.db);
    chunks
      .slice(start, start + MAX_BATCH_WRITES)
      .forEach((chunk, offset) => {
        const index = start + offset;
        batch.set(
          doc(
            client.db,
            "relas_scopes",
            workspace.municipality.identity.id,
            "workspace_versions",
            id,
            "chunks",
            String(index).padStart(6, "0")
          ),
          {
            index,
            content: chunk,
            savedBy: user.uid,
            savedAt: serverTimestamp(),
          }
        );
      });
    await batch.commit();
  }
  const manifest: RemoteWorkspaceManifest = {
    schema: REMOTE_WORKSPACE_SCHEMA,
    municipalityId: workspace.municipality.identity.id,
    snapshotId: id,
    chunkCount: chunks.length,
    characterLength: raw.length,
    workspaceUpdatedAt: workspace.updatedAt,
    savedBy: user.uid,
  };
  const batch = writeBatch(client.db);
  batch.set(
    doc(
      client.db,
      "relas_scopes",
      workspace.municipality.identity.id,
      "workspace",
      "current"
    ),
    { ...manifest, savedAt: serverTimestamp() }
  );
  await batch.commit();

}

async function readManifest(
  client: RelasClient,
  municipalityId: string
): Promise<RemoteWorkspaceManifest | null> {
  const snapshot = await getDocFromServer(
    doc(client.db, "relas_scopes", municipalityId, "workspace", "current")
  );
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as RemoteWorkspaceManifest;
  return data.schema === REMOTE_WORKSPACE_SCHEMA &&
    typeof data.snapshotId === "string" &&
    Number.isInteger(data.chunkCount)
    ? data
    : null;
}

/** La eliminación física queda deshabilitada: los snapshots son históricos e inmutables.
 * Para retirar un ámbito de la navegación existe una lápida independiente.
 * No escribir una lápida como efecto secundario de una operación fallida.
 */
export async function deleteRemoteWorkspace(
  _client: RelasClient,
  _municipalityId: string
): Promise<{ deleted: boolean }> {
  void _client;
  void _municipalityId;
  throw new Error("La eliminación física del expediente está deshabilitada para preservar su historial. Usa el procedimiento explícito de retirada territorial.");
}

/** Reject restoration of a withdrawn territory, including automatic synchronization. */
export async function assertScopeNotWithdrawn(client: RelasClient, municipalityId: string): Promise<void> {
  const snapshot = await getDocFromServer(doc(client.db, "compas_deleted_scopes", municipalityId));
  if (snapshot.exists()) throw new Error("Ámbito retirado administrativamente: no se admite restauración automática.");
}

const SCOPE_TYPES = ["municipio", "mancomunidad", "distrito-municipal"] as const;

/** Crea el registro del ámbito si no existe (lo exige el listado de administración). */
export async function ensureRemoteScope(
  client: RelasClient,
  workspace: MunicipalityWorkspace
): Promise<void> {
  const user = client.auth.currentUser;
  if (!user) throw new Error("Inicia sesión para registrar el ámbito.");
  const identity = workspace.municipality.identity;
  await assertScopeNotWithdrawn(client, identity.id);
  const ref = doc(client.db, "relas_scopes", identity.id);
  if ((await getDocFromServer(ref)).exists()) return;
  const type = (SCOPE_TYPES as readonly string[]).includes(
    identity.territorialType ?? ""
  )
    ? identity.territorialType
    : "municipio";
  await setDoc(ref, {
    name: identity.name,
    type,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
}

/** Lista de ámbitos eliminados: evita que otro equipo reponga un expediente retirado. */
export async function readRemoteTombstones(
  client: RelasClient
): Promise<Set<string>> {
  const rows = await getDocs(collection(client.db, "compas_deleted_scopes"));
  return new Set(rows.docs.map((row) => row.id));
}

export async function writeRemoteTombstone(
  client: RelasClient,
  municipalityId: string
): Promise<void> {
  const user = client.auth.currentUser;
  if (!user) throw new Error("Inicia sesión para registrar la eliminación.");
  await setDoc(doc(client.db, "compas_deleted_scopes", municipalityId), {
    deletedBy: user.uid,
    deletedAt: serverTimestamp(),
  });
}

export async function clearRemoteTombstone(
  client: RelasClient,
  municipalityId: string
): Promise<void> {
  await deleteDoc(doc(client.db, "compas_deleted_scopes", municipalityId));
}

export async function hasRemoteWorkspace(
  client: RelasClient,
  municipalityId: string
): Promise<boolean> {
  return (await readManifest(client, municipalityId)) !== null;
}

export type RemoteUploadOutcome =
  | "subido"
  | "ya-actualizado"
  | "remoto-mas-reciente"
  | "error";

/**
 * Sube a Firebase los expedientes que existen en este navegador. No sustituye
 * una copia remota más reciente: se compara `updatedAt` antes de cada subida.
 */
export async function uploadLocalWorkspaces(
  client: RelasClient,
  workspaces: MunicipalityWorkspace[],
  onProgress?: (id: string, outcome: RemoteUploadOutcome, detail?: string) => void
): Promise<Record<string, RemoteUploadOutcome>> {
  const result: Record<string, RemoteUploadOutcome> = {};
  for (const workspace of workspaces) {
    const id = workspace.municipality.identity.id;
    let outcome: RemoteUploadOutcome;
    let detail: string | undefined;
    try {
      const remote = await readRemoteWorkspace(client, id);
      if (remote !== null && remote.updatedAt > workspace.updatedAt) {
        outcome = "remoto-mas-reciente";
      } else if (remote !== null && remote.updatedAt === workspace.updatedAt) {
        outcome = "ya-actualizado";
      } else {
        await saveRemoteWorkspace(client, workspace);
        outcome = "subido";
      }
    } catch (error) {
      outcome = "error";
      detail = error instanceof Error ? error.message : undefined;
    }
    result[id] = outcome;
    onProgress?.(id, outcome, detail);
  }
  return result;
}
