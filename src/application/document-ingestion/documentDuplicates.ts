import type { EvidenceStore } from "../../domain/evidence";
import type { DocumentId, MunicipalDocument, MunicipalDocumentRepository } from "../../domain/repository";

/**
 * Documentos repetidos en el expediente.
 *
 * Criterios, de más a menos seguro:
 * - «same-file»: misma huella SHA-256 del archivo (registrada o calculada del
 *   original conservado en este navegador). Es el mismo archivo.
 * - «same-text»: mismo texto extraído, una vez normalizados espacios y
 *   mayúsculas. Es el mismo contenido aunque el archivo difiera.
 * - «same-name»: mismo tipo y mismo nombre de archivo o mismo título. Es
 *   probable, no seguro: la persona decide.
 *
 * Nada se retira automáticamente. La retirada archiva la copia (no la borra)
 * y quita las evidencias que derivan de ella, que repiten las de la copia que
 * se conserva.
 */

export type DuplicateReason = "same-file" | "same-text" | "same-name";

export interface DuplicateGroup {
  reason: DuplicateReason;
  documents: MunicipalDocument[];
  /** Copia que se propone conservar; la persona puede retirar cualquier otra. */
  suggestedKeepId: DocumentId;
}

export interface DuplicateContext {
  /** Huellas calculadas de los originales conservados localmente, por documento. */
  localHashes?: Readonly<Record<DocumentId, string>>;
  /** Documentos que no pueden retirarse (Informe vigente, estudio vigente…). */
  protectedIds?: ReadonlySet<DocumentId>;
  /** Evidencias derivadas de cada documento, para elegir la copia más completa. */
  atomCountByDocument?: Readonly<Record<DocumentId, number>>;
}

const MIN_TEXT_LENGTH = 200;

const isActive = (d: MunicipalDocument) => d.status !== "archived" && d.status !== "rejected";
const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const normalizeName = (s: string) =>
  normalize(s).replace(/\.(pdf|docx?|csv|xlsx?|txt|md)$/i, "").replace(/[_-]+/g, " ").replace(/\s*\(\d+\)$/, "").trim();

export function documentFingerprint(document: MunicipalDocument, localHashes?: Readonly<Record<DocumentId, string>>): string | undefined {
  return document.contentSha256 ?? localHashes?.[document.id];
}

function pickKeeper(docs: MunicipalDocument[], ctx: DuplicateContext): DocumentId {
  const protectedDoc = docs.find((d) => ctx.protectedIds?.has(d.id));
  if (protectedDoc) return protectedDoc.id;
  const ranked = [...docs].sort((a, b) =>
    Number(b.status === "validated") - Number(a.status === "validated") ||
    (ctx.atomCountByDocument?.[b.id] ?? 0) - (ctx.atomCountByDocument?.[a.id] ?? 0) ||
    a.createdAt.localeCompare(b.createdAt)
  );
  return ranked[0].id;
}

export function findDuplicateGroups(repository: MunicipalDocumentRepository, ctx: DuplicateContext = {}): DuplicateGroup[] {
  const active = repository.documents.filter(isActive);
  const grouped = new Set<DocumentId>();
  const groups: DuplicateGroup[] = [];

  const collect = (reason: DuplicateReason, keyOf: (d: MunicipalDocument) => string | undefined) => {
    const buckets = new Map<string, MunicipalDocument[]>();
    for (const d of active) {
      if (grouped.has(d.id)) continue;
      const key = keyOf(d);
      if (!key) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(d);
    }
    for (const docs of buckets.values()) {
      if (docs.length < 2) continue;
      docs.forEach((d) => grouped.add(d.id));
      groups.push({ reason, documents: docs, suggestedKeepId: pickKeeper(docs, ctx) });
    }
  };

  collect("same-file", (d) => documentFingerprint(d, ctx.localHashes));
  collect("same-text", (d) => (d.sourceText && d.sourceText.trim().length >= MIN_TEXT_LENGTH ? normalize(d.sourceText) : undefined));
  collect("same-name", (d) => (d.sourceFileName ? `${d.kind}::file::${normalizeName(d.sourceFileName)}` : undefined));
  collect("same-name", (d) => `${d.kind}::title::${normalizeName(d.title)}`);
  return groups;
}

export interface ExistingDuplicate {
  document: MunicipalDocument;
  reason: "same-file" | "same-name";
}

/** Busca en el expediente un archivo idéntico (huella) o, en su defecto, con el mismo nombre. */
export function findExistingCopy(
  repository: MunicipalDocumentRepository,
  file: { sha256?: string; name: string },
  localHashes?: Readonly<Record<DocumentId, string>>
): ExistingDuplicate | undefined {
  const active = repository.documents.filter(isActive);
  if (file.sha256) {
    const same = active.find((d) => documentFingerprint(d, localHashes) === file.sha256);
    if (same) return { document: same, reason: "same-file" };
  }
  const name = normalizeName(file.name);
  const sameName = active.find((d) => d.sourceFileName && normalizeName(d.sourceFileName) === name);
  return sameName ? { document: sameName, reason: "same-name" } : undefined;
}

/**
 * Retira una copia repetida: el documento pasa a «archived» con una etiqueta
 * que conserva a qué copia remite, y se quitan sus evidencias derivadas.
 * Devuelve null si el documento no existe, ya está archivado o es la copia
 * que se conserva.
 */
export function retireDuplicateDocument(
  repository: MunicipalDocumentRepository,
  evidenceStore: EvidenceStore,
  documentId: DocumentId,
  keptId: DocumentId,
  now: string = new Date().toISOString()
): { repository: MunicipalDocumentRepository; evidenceStore: EvidenceStore; removedAtoms: number } | null {
  if (documentId === keptId) return null;
  const target = repository.documents.find((d) => d.id === documentId);
  if (!target || !isActive(target) || !repository.documents.some((d) => d.id === keptId)) return null;
  const atoms = evidenceStore.atoms.filter((a) => a.provenance.documentId !== documentId);
  return {
    repository: {
      ...repository,
      documents: repository.documents.map((d) =>
        d.id === documentId
          ? { ...d, status: "archived" as const, tags: [...d.tags.filter((t) => !t.startsWith("duplicate-of:")), `duplicate-of:${keptId}`], updatedAt: now }
          : d
      ),
      updatedAt: now,
    },
    evidenceStore: { ...evidenceStore, atoms, updatedAt: now },
    removedAtoms: evidenceStore.atoms.length - atoms.length,
  };
}

export const DUPLICATE_REASON_LABEL: Record<DuplicateReason, string> = {
  "same-file": "Mismo archivo",
  "same-text": "Mismo texto",
  "same-name": "Mismo nombre",
};
