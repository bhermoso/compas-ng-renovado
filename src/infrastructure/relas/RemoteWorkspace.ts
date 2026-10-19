import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { parseWorkspaceJSON } from "../persistence/local-storage";
import {
  readAccessProfile,
  readMembership,
  type RelasClient,
} from "./RelasClient";

const REMOTE_WORKSPACE_SCHEMA = "compas-workspace-chunks/v1";
const CHUNK_SIZE = 180_000;
const MAX_BATCH_WRITES = 400;

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
  const user = client.auth.currentUser;
  if (!user) throw new Error("Inicia sesión para guardar el expediente remoto.");
  const role = await readMembership(client, workspace.municipality.identity.id);
  if (role === "reader") {
    throw new Error("La cuenta tiene acceso de consulta y no puede guardar.");
  }
  const raw = JSON.stringify(workspace);
  const chunks = splitText(raw);
  const id = snapshotId();
  const previous = await readManifest(client, workspace.municipality.identity.id);
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
  // La copia anterior ya no es la vigente: se retira para que Firebase no
  // acumule una copia completa por cada guardado. Un fallo aquí no invalida
  // el guardado, que ya está confirmado.
  if (previous !== null && previous.snapshotId !== id) {
    await deleteSnapshotChunks(
      client,
      workspace.municipality.identity.id,
      previous
    ).catch(() => undefined);
  }
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

async function deleteSnapshotChunks(
  client: RelasClient,
  municipalityId: string,
  manifest: RemoteWorkspaceManifest
): Promise<void> {
  for (let start = 0; start < manifest.chunkCount; start += MAX_BATCH_WRITES) {
    const batch = writeBatch(client.db);
    for (
      let index = start;
      index < Math.min(start + MAX_BATCH_WRITES, manifest.chunkCount);
      index++
    ) {
      batch.delete(
        doc(
          client.db,
          "relas_scopes",
          municipalityId,
          "workspace_versions",
          manifest.snapshotId,
          "chunks",
          String(index).padStart(6, "0")
        )
      );
    }
    await batch.commit();
  }
}

/**
 * Elimina de Firebase el expediente de un ámbito: primero los fragmentos de la
 * copia vigente y, solo cuando ya no queda ninguno, el manifiesto. Si algo
 * falla, el manifiesto permanece y el expediente sigue siendo recuperable.
 * Solo el administrador general puede ejecutarlo.
 *
 * Límite verificado en el cliente web: no se pueden enumerar copias anteriores
 * huérfanas (creadas antes de la limpieza automática); solo se retira la vigente.
 */
export async function deleteRemoteWorkspace(
  client: RelasClient,
  municipalityId: string
): Promise<{ deleted: boolean }> {
  if (!client.auth.currentUser) {
    throw new Error("Inicia sesión para eliminar el expediente de Firebase.");
  }
  const profile = await readAccessProfile(client);
  if (!profile.administrator) {
    throw new Error(
      "Solo el administrador general puede eliminar un expediente de Firebase."
    );
  }
  const manifest = await readManifest(client, municipalityId);
  if (manifest === null) return { deleted: false };
  await deleteSnapshotChunks(client, municipalityId, manifest);
  await deleteDoc(
    doc(client.db, "relas_scopes", municipalityId, "workspace", "current")
  );
  return { deleted: true };
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
