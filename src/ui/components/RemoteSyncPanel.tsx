import { useState } from "react";
import { loadAllWorkspacesFromIndexedDB } from "../../infrastructure/persistence/indexed-db-workspace";
import { parseWorkspaceJSON } from "../../infrastructure/persistence/local-storage";
import type { RelasClient } from "../../infrastructure/relas/RelasClient";
import {
  uploadLocalWorkspaces,
  type RemoteUploadOutcome,
} from "../../infrastructure/relas/RemoteWorkspace";
import type { MunicipalityWorkspace } from "../../domain/workspace";

const LABEL: Record<RemoteUploadOutcome, string> = {
  subido: "subido",
  "ya-actualizado": "ya estaba actualizado",
  "remoto-mas-reciente": "no subido: la copia de Firebase es más reciente",
  error: "error",
};

async function localWorkspaces(): Promise<MunicipalityWorkspace[]> {
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

/**
 * Sin sesión: avisa de que el trabajo solo está en este navegador.
 * Con sesión: permite subir a Firebase todos los expedientes de este navegador.
 */
export function RemoteSyncPanel({ client }: { client: RelasClient }) {
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const signedIn = client.auth.currentUser !== null;

  if (!signedIn) {
    return (
      <p className="app-persistence-warning" role="status">
        Sin sesión de Firebase: los cambios de esta pantalla se guardan solo en este navegador.{" "}
        <a href="?vista=app">Entrar con la cuenta de administración</a>
      </p>
    );
  }

  async function upload() {
    setBusy(true);
    setLines([]);
    try {
      const workspaces = await localWorkspaces();
      if (workspaces.length === 0) {
        setLines(["No hay expedientes guardados en este navegador."]);
        return;
      }
      await uploadLocalWorkspaces(client, workspaces, (id, outcome, detail) =>
        setLines((previous) => [
          ...previous,
          `${id}: ${LABEL[outcome]}${detail ? ` (${detail})` : ""}`,
        ])
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="app-persistence-warning">
      <summary>Expedientes de este navegador y Firebase</summary>
      <p>
        Sube a Firebase todos los expedientes guardados en este navegador. No
        sustituye una copia de Firebase más reciente.
      </p>
      <button type="button" disabled={busy} onClick={() => { void upload(); }}>
        {busy ? "Subiendo…" : "Subir a Firebase los expedientes de este navegador"}
      </button>
      {lines.length > 0 && (
        <ul aria-live="polite">
          {lines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      )}
    </details>
  );
}
