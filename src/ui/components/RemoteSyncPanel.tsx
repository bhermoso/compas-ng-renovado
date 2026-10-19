import { useState } from "react";
import { loadLocalWorkspaces } from "../../infrastructure/persistence/local-workspaces";
import type { RelasClient } from "../../infrastructure/relas/RelasClient";
import {
  uploadLocalWorkspaces,
  type RemoteUploadOutcome,
} from "../../infrastructure/relas/RemoteWorkspace";

const LABEL: Record<RemoteUploadOutcome, string> = {
  subido: "subido",
  "ya-actualizado": "ya estaba actualizado",
  "remoto-mas-reciente": "no subido: la copia de Firebase es más reciente",
  error: "error",
};


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
      const workspaces = await loadLocalWorkspaces();
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
