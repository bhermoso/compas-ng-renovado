import type { ProfileAttachment, ExternalProfileLibrary } from "../../domain/health-profile/ExternalHealthProfile";
import type { MunicipalDocument } from "../../domain/repository";
import { MAX_PROFILE_FILE_BYTES, MAX_PROFILE_LIBRARY_BYTES, profileAttachmentBlob } from "../health-profile/externalProfiles";

/**
 * Originales de los documentos del Diagnóstico guardados en el expediente.
 *
 * Mismo mecanismo que los originales del Perfil externo (EXTERNAL-PROFILE.md):
 * bytes completos en base64, con nombre, tipo, tamaño y SHA-256, dentro del
 * expediente que viaja en los fragmentos de Firebase. IndexedDB queda como
 * caché del navegador. El presupuesto de 40 MB es común a los originales del
 * Perfil y del Diagnóstico, para no superar la capacidad de fragmentos.
 */

export interface StoredDocumentOriginal extends ProfileAttachment {
  /** Documento del repositorio al que pertenece el original. */
  documentId: string;
}

export const MAX_ORIGINAL_FILE_BYTES = MAX_PROFILE_FILE_BYTES;
export const MAX_WORKSPACE_ORIGINALS_BYTES = MAX_PROFILE_LIBRARY_BYTES;

export function profileOriginalsBytes(library: ExternalProfileLibrary | undefined): number {
  return (library?.attachments ?? []).reduce((sum, a) => sum + a.size, 0);
}

export function documentOriginalsBytes(originals: readonly StoredDocumentOriginal[] | undefined): number {
  return (originals ?? []).reduce((sum, o) => sum + o.size, 0);
}

export async function encodeDocumentOriginal(documentId: string, file: Blob & { name?: string }): Promise<StoredDocumentOriginal> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return {
    id: documentId,
    documentId,
    name: file.name || documentId,
    mimeType: file.type || "application/octet-stream",
    size: bytes.length,
    sha256,
    base64: btoa(binary),
  };
}

/** Recupera el archivo comprobando tamaño y huella; lanza si no supera la comprobación. */
export async function decodeDocumentOriginal(original: StoredDocumentOriginal): Promise<File> {
  const blob = await profileAttachmentBlob(original);
  return new File([blob], original.name, { type: original.mimeType });
}

export type UploadDecision = "fits" | "too-large" | "over-budget";

/** Decide si un original cabe, dado lo ya ocupado por el Perfil y el Diagnóstico. */
export function decideOriginalUpload(size: number, usedBytes: number): UploadDecision {
  if (size > MAX_ORIGINAL_FILE_BYTES) return "too-large";
  if (usedBytes + size > MAX_WORKSPACE_ORIGINALS_BYTES) return "over-budget";
  return "fits";
}

/** Quita originales de documentos que ya no existen en el repositorio (los archivados se conservan). */
export function pruneDocumentOriginals(originals: readonly StoredDocumentOriginal[], documents: readonly MunicipalDocument[]): StoredDocumentOriginal[] {
  const ids = new Set(documents.map((d) => d.id));
  return originals.filter((o) => ids.has(o.documentId));
}

/** Añade o reemplaza originales por documento, sin duplicar entradas. */
export function mergeDocumentOriginals(originals: readonly StoredDocumentOriginal[], additions: readonly StoredDocumentOriginal[]): StoredDocumentOriginal[] {
  const added = new Set(additions.map((a) => a.documentId));
  return [...originals.filter((o) => !added.has(o.documentId)), ...additions];
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}
