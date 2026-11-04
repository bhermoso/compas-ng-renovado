import type { RemoteSaveProgress } from "../../infrastructure/relas/RemoteWorkspace";

/** Mensajes orientados a operaciones comprobables, sin atribuir un guardado prematuro. */
export function profileSaveProgressMessage(progress: RemoteSaveProgress): string {
  switch (progress.phase) {
    case "waiting":
      return "Esperando a que termine otra escritura del expediente en Firebase. La revisión permanece en pantalla.";
    case "writing":
      return `Enviando expediente a Firebase: ${progress.completedChunks} de ${progress.totalChunks} fragmentos.`;
    case "confirming":
      return "Todos los fragmentos están enviados. Confirmando la versión nueva en Firebase…";
    case "saved":
      return "Firebase ha confirmado la versión nueva del expediente.";
  }
}

/** Preserva la causa técnica relevante y da una acción concreta cuando es posible. */
export function profileSaveErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as {code: unknown}).code)
    : "";
  const detail = error instanceof Error ? error.message : String(error ?? "");
  if (/permission-denied|PERMISSION_DENIED|missing or insufficient permissions/i.test(code + " " + detail)) {
    return "Firebase ha rechazado la escritura por permisos. Comprueba que tu cuenta tiene acceso de coordinación o administración al expediente municipal; el borrador sigue en pantalla.";
  }
  if (/unauthenticated|auth\/|no auth/i.test(code)) {
    return "La sesión de Firebase no está autenticada. Inicia sesión en COMPÁS y recupera el expediente antes de guardar; el borrador sigue en pantalla.";
  }
  if (/resource-exhausted|quota-exceeded|RESOURCE_EXHAUSTED/i.test(code + " " + detail)) {
    return "Firebase ha alcanzado una cuota o límite de servicio. No se ha confirmado el guardado; conserva el borrador y revisa la cuota de Firestore.";
  }
  if (/unavailable|deadline-exceeded|network-request-failed|offline/i.test(code + " " + detail)) {
    return "No se ha confirmado el guardado por un problema de conexión con Firebase. No cierres el borrador; comprueba la red y el estado del expediente antes de reintentar.";
  }
  if (/más reciente|cambió en otro equipo/i.test(detail)) return detail;
  return detail || "Firebase no ha confirmado el guardado. Conserva el borrador y revisa el estado del expediente.";
}
