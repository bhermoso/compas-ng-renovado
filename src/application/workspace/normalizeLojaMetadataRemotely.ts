import type { MunicipalityWorkspace } from "../../domain/workspace";
import { normalizeKnownMunicipalDocumentKinds, validateHistoricalNormalization } from "./normalizeKnownMunicipalDocuments";

interface RemoteMetadataNormalizationDependencies {
  read: (municipalityId: string) => Promise<MunicipalityWorkspace | null>;
  save: (workspace: MunicipalityWorkspace, expectedPreviousUpdatedAt: string) => Promise<void>;
}

export interface RemoteMetadataNormalizationResult {
  status: "updated" | "already-normalized";
  workspace: MunicipalityWorkspace;
}

/**
 * Migración remota explícita y limitada a la ficha histórica de Loja.
 * Debe invocarse DESPUÉS de haber descargado y comprobado una copia integral.
 * El lector remoto y la escritura deben estar autenticados y aplicar las
 * reglas de permiso del expediente. No hay escritura automática al hidratar.
 */
export async function normalizeLojaMetadataRemotely(
  dependencies: RemoteMetadataNormalizationDependencies,
  expectedWorkspace: MunicipalityWorkspace,
): Promise<RemoteMetadataNormalizationResult> {
  if (expectedWorkspace.municipality.identity.id !== "loja") {
    throw new Error("Esta corrección sólo corresponde al expediente de Loja.");
  }
  const current = await dependencies.read("loja");
  if (!current) throw new Error("No existe una versión de Loja en Firebase. No se ha modificado nada.");
  if (current.updatedAt !== expectedWorkspace.updatedAt ||
      JSON.stringify(current) !== JSON.stringify(expectedWorkspace)) {
    throw new Error("Firebase contiene una versión distinta de la revisada. Recarga el expediente y prepara una copia nueva; no se ha escrito nada.");
  }
  const normalized = normalizeKnownMunicipalDocumentKinds(current);
  if (normalized.changes.length === 0) {
    return {status:"already-normalized",workspace:current};
  }
  if (normalized.changes.length !== 1 || !validateHistoricalNormalization(current,normalized.workspace)) {
    throw new Error("La propuesta altera más campos de los permitidos; normalización cancelada.");
  }
  const now = new Date().toISOString();
  // El metadato 'kind' es el único cambio documental. Las fechas del
  // contenedor permiten que Firebase detecte la nueva revisión.
  const updated: MunicipalityWorkspace = {
    ...normalized.workspace,
    repository: {...normalized.workspace.repository,updatedAt:now},
    updatedAt:now,
  };
  await dependencies.save(updated,current.updatedAt);
  const reread = await dependencies.read("loja");
  if (!reread || JSON.stringify(reread) !== JSON.stringify(updated)) {
    throw new Error("Firebase no devuelve la revisión esperada después del guardado. Conserva la copia de recuperación y comprueba el expediente antes de continuar.");
  }
  return {status:"updated",workspace:reread};
}
