/** Registro de originales remoto (Firestore metadata + Cloud Storage bytes).
 * Diseño aditivo. Esta unidad NO escribe en Firebase.
 */
export interface OriginalRecord {
  schema: "compas-original/v1";
  municipalityId: string;
  /** SHA-256 hexadecimal del contenido original, calculado antes de subir. */
  sha256: string;
  storagePath: string;
  byteLength: number;
  fileName: string;
  contentType: string;
  createdBy: string;
  createdAt: string;
}
export interface OriginalReference {
  municipalityId: string;
  sha256: string;
  documentId: string;
  versionId: string;
  linkedBy: string;
  linkedAt: string;
}
const HASH = /^[0-9a-f]{64}$/;
const SCOPE = /^[a-z0-9][a-z0-9-]{0,79}$/;
export function storagePathForOriginal(municipalityId: string, sha256: string): string {
  if (!SCOPE.test(municipalityId) || !HASH.test(sha256)) throw new Error("Ámbito o SHA-256 inválido");
  return `relas_scopes/${municipalityId}/originals/${sha256}`;
}
export function buildOriginalRecord(input: Omit<OriginalRecord,"schema"|"storagePath">): OriginalRecord {
  if (!Number.isSafeInteger(input.byteLength) || input.byteLength < 0 || input.byteLength > 40 * 1024 * 1024) throw new Error("Tamaño de original fuera de límites");
  if (!input.fileName.trim() || input.fileName.length > 255) throw new Error("Nombre de archivo inválido");
  if (!input.createdBy.trim() || !input.createdAt.trim()) throw new Error("Falta procedencia");
  return {...input, schema:"compas-original/v1",storagePath:storagePathForOriginal(input.municipalityId,input.sha256)};
}
export type DuplicateCheck = "exact" | "not-indexed" | "unverified";
export function compareIndexedOriginal(candidate: OriginalRecord, existing?: OriginalRecord): DuplicateCheck {
  if (!existing) return "not-indexed";
  if (existing.schema !== "compas-original/v1" ||
      existing.municipalityId !== candidate.municipalityId ||
      existing.storagePath !== storagePathForOriginal(existing.municipalityId, existing.sha256)) return "unverified";
  return existing.sha256 === candidate.sha256 && existing.byteLength === candidate.byteLength ? "exact" : "unverified";
}
