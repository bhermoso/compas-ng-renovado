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
