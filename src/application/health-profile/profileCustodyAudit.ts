/**
 * Comprobaciones documentales no destructivas. Una nota de revisión no prueba
 * que su versión esté conservada como registro en Firebase.
 */
import type { ExternalHealthProfile, ExternalProfileLibrary } from "../../domain/health-profile/ExternalHealthProfile";

const revision = (s: string) => /\brevisi[oó]n\s+(\d+\.\d+(?:\.\d+)?)/i.exec(s)?.[1];
const fileRevision = (s: string) => /(?:^|[_\s-])v(\d+)[._-](\d+)(?:[._-](\d+))?/i.exec(s)?.slice(1).filter(Boolean).join(".");

export function profileAttachmentEdition(name: string) {
  const version = fileRevision(name);
  const date = /(?:^|[_\s-])(\d{4})-(\d{2})-(\d{2})(?=[._\s-]|$)/.exec(name);
  return { version, date: date ? [date[3], date[2], date[1]].join("/") : undefined };
}

export interface ProfileCustodyAudit {
  declaredRevisions: string[];
  missingRevisions: string[];
  attachmentVersions: string[];
  attachedFiles: string[];
  currentVersion?: string;
  distinctOriginal: boolean;
}

/** Distingue la historia declarada en el texto de los registros custodiados. */
export function auditProfileCustody(profile: ExternalHealthProfile, library: ExternalProfileLibrary): ProfileCustodyAudit {
  const currentVersion = revision(profile.title);
  const declaredRevisions = [...new Set(profile.limitations.flatMap(l => {
    const matches = [...l.matchAll(/\brevisi[oó]n\s+(\d+\.\d+(?:\.\d+)?)/gi)];
    return matches.map(m => m[1]);
  }))].filter(v => v !== currentVersion);
  const storedRevisions = new Set(library.profiles.map(p => revision(p.title)).filter(Boolean));
  const missingRevisions = declaredRevisions.filter(v => !storedRevisions.has(v));
  const attachedFiles = profile.attachmentIds
    .map(id => library.attachments.find(a => a.id === id)?.name)
    .filter((name): name is string => !!name);
  const attachmentVersions = [...new Set(attachedFiles.map(fileRevision).filter((v): v is string => !!v))];
  return {
    declaredRevisions,
    missingRevisions,
    attachmentVersions,
    attachedFiles,
    currentVersion,
    distinctOriginal: !!currentVersion && attachmentVersions.some(v => v !== currentVersion),
  };
}

export interface UnpublishedValueConflict {
  section: string;
  displayed: string;
}

/**
 * Alerta si el propio texto niega la publicación de un porcentaje exacto en
 * una sección, pero una tabla del mismo texto lo presenta como cifra exacta.
 * No adjudica cuál de las dos afirmaciones es correcta ni altera el documento.
 */
export function findUnpublishedValueConflicts(text: string): UnpublishedValueConflict[] {
  const mentioned = [
    ...[...text.matchAll(/secci[oó]n\s+(\d{5})[^\n.]{0,180}no publica un porcentaje exacto/gi)].map(m => m[1]),
    ...[...text.matchAll(/no publica un porcentaje exacto[^\n.]{0,180}secci[oó]n\s+(\d{5})/gi)].map(m => m[1]),
  ];
  const sections = [...new Set(mentioned)];
  const lines = text.split("\n");
  const conflicts: UnpublishedValueConflict[] = [];
  for (const section of sections) {
    for (let i = 0; i < lines.length; i++) {
      const row = lines[i].split("|").map(x => x.trim()).filter(Boolean);
      if (row[0] !== section || row.length < 3) continue;
      // La tabla debe declarar explícitamente una columna bajo el 60 %.
      const header = lines.slice(Math.max(0, i - 25), i).reverse()
        .find(l => /(?:secci[oó]n|distrito)/i.test(l) && /(?:bajo el 60|inferiores al 60|umbral)/i.test(l));
      if (!header) continue;
      const columns = header.split("|").map(x => x.trim()).filter(Boolean);
      const position = columns.findIndex(c => /(?:bajo el 60|inferiores al 60|umbral)/i.test(c));
      const value = row[position];
      if (position < 0 || !value || !/^\d{1,3}(?:[.,]\d+)?\s*%?$/.test(value)) continue;
      conflicts.push({ section, displayed: value });
      break;
    }
  }
  return conflicts;
}
