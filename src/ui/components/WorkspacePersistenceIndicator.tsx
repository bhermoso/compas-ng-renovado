import type { ReactNode } from "react";

/** Las confirmaciones se presentan como metadatos, nunca como tarjetas de aviso. */
export type PersistenceSignal = "neutral" | "progress" | "confirmed" | "caution" | "error";

export function classifyPersistenceMessage(message: string | null): PersistenceSignal {
  if (!message?.trim()) return "neutral";
  if (/conflicto|no se (?:ha |pudo |puede )?(?:guardar|guardado|recuperar|sincronizar|confirmar)|no ha (?:guardado|confirmado)|no se confirmó|fall[oó]|error|rechaz|bloquead|sin permisos|cuota|desconectad|superad/i.test(message)) return "error";
  if (/guardando|subiendo|enviando|esperando|confirmando|comprobando|recuperando|sincronizando/i.test(message)) return "progress";
  if (/guardad|confirmad|recuperad|sincronizad|actualizad|incorporad/i.test(message)) return "confirmed";
  return "caution";
}

export function persistenceSummary(message: string | null, source: "firebase" | "browser"): string {
  const tone = classifyPersistenceMessage(message);
  if (tone === "error") return message?.trim() || "Incidencia en la conservación del expediente";
  if (tone === "progress") return source === "firebase" ? "Guardando en Firebase…" : "Guardando en este navegador…";
  if (tone === "confirmed") return source === "firebase" ? "Firebase · copia confirmada" : "Navegador · copia guardada";
  return message?.trim() || (source === "firebase" ? "Sin confirmación reciente" : "Estado local no comprobado");
}

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
