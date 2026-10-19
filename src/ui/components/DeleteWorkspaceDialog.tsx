import { useEffect, useRef, useState } from "react";

export function DeleteWorkspaceDialog({ name, discardDraft, remoteSession, onCancel, onConfirm }: {
  name: string;
  discardDraft: boolean;
  /** Hay una sesión de Firebase abierta: la eliminación alcanza también a la copia compartida. */
  remoteSession: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function confirm() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try { await onConfirm(); onCancel(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo completar la eliminación."); }
    finally { running.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className="workspace-delete-dialog" aria-labelledby="workspace-delete-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="workspace-delete-title">Eliminar expediente de {name}</h2>
    <p>Se borrarán los datos y archivos originales de este expediente guardados en este navegador y se retirará del selector.</p>
    {remoteSession
      ? <p>Se eliminará también la copia compartida de Firebase. Esta acción no se puede deshacer; para conservar el trabajo necesitas una copia de recuperación.</p>
      : <p role="status">No hay sesión de Firebase abierta. Un expediente puede existir en Firebase aunque no lo veas aquí; para eliminarlo también allí, entra por <code>?vista=app</code> con la cuenta de administración.</p>}
    {discardDraft && <p>También se descartarán los cambios sin guardar de la propuesta abierta.</p>}
    {error && <p role="alert">{error}</p>}
    <div className="workspace-delete-dialog__actions">
      <button type="button" autoFocus disabled={busy} onClick={onCancel}>Cancelar</button>
      <button type="button" disabled={busy || !remoteSession} onClick={() => { void confirm(); }}>
        {busy ? "Eliminando…" : "Eliminar expediente"}
      </button>
    </div>
  </dialog>;
}
