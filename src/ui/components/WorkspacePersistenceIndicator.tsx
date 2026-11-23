import type { ReactNode } from "react";
import { classifyPersistenceMessage, persistenceSummary } from "./workspacePersistenceSignals";

interface WorkspacePersistenceIndicatorProps {
  localMessage: string | null;
  remoteMessage: string | null;
  signedIn: boolean;
  children: ReactNode;
}

/** Zona única de estado: solo los errores ganan prominencia. */
export function WorkspacePersistenceIndicator({
  localMessage, remoteMessage, signedIn, children
}: WorkspacePersistenceIndicatorProps) {
  const remoteTone = signedIn ? classifyPersistenceMessage(remoteMessage) : "caution";
  const localTone = classifyPersistenceMessage(localMessage);
  const remoteLabel = signedIn
    ? persistenceSummary(remoteMessage, "firebase")
    : "Sin sesión remota · solo este navegador";
  return (
    <section className="app-status-strip" aria-label="Conservación del expediente">
      <details className="app-status-strip__details">
        <summary>Conservación y copias <span className="app-status-strip__signal" data-tone={remoteTone}>{remoteLabel}</span></summary>
        <div className="app-status-strip__expanded">
          <p>Firebase conserva el expediente compartido. La copia del navegador permite recuperar el trabajo de este equipo.</p>
          {remoteMessage && <p><strong>Firebase:</strong> {remoteMessage}</p>}
          {localMessage && <p><strong>Navegador:</strong> {persistenceSummary(localMessage, "browser")}</p>}
          {children}
        </div>
      </details>
      {remoteTone === "error" && <p className="app-status-strip__warning" role="alert">{remoteMessage}</p>}
      {localTone === "error" && <p className="app-status-strip__warning" role="alert">{localMessage}</p>}
    </section>
  );
}
