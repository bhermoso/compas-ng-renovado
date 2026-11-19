import type { MunicipalityWorkspace } from "../../domain/workspace";

export interface ArchiveComparison {
  matches: boolean;
  problems: string[];
  remoteUpdatedAt: string;
  remoteDocuments: number;
  remoteOriginals: number;
}

/** Compara el archivo del navegador con una lectura confirmada desde Firestore. */
export function compareDocumentArchive(local: MunicipalityWorkspace, remote: MunicipalityWorkspace): ArchiveComparison {
  const problems: string[] = [];
  const scope = local.municipality.identity.id;
  if (remote.municipality.identity.id !== scope) {
    return {matches:false,problems:["La respuesta de Firebase pertenece a otro municipio."],remoteUpdatedAt:remote.updatedAt,remoteDocuments:remote.repository.documents.length,remoteOriginals:remote.documentOriginals?.length??0};
  }
  const localDocs = new Map(local.repository.documents.map(d=>[d.id,d]));
  const remoteDocs = new Map(remote.repository.documents.map(d=>[d.id,d]));
  const allIds = new Set([...localDocs.keys(),...remoteDocs.keys()]);
  for (const id of allIds) {
    const a = localDocs.get(id), b = remoteDocs.get(id);
    if (!a) { problems.push(`Firebase conserva una ficha que falta localmente: «${b?.title??id}».`); continue; }
    if (!b) { problems.push(`Falta en Firebase: «${a.title}».`); continue; }
    if (a.title !== b.title || a.status !== b.status || a.sourceFileName !== b.sourceFileName || a.contentSha256 !== b.contentSha256) {
      problems.push(`Difieren los datos de «${a.title}» (estado, nombre o huella).`);
    }
  }
  const lOrig = new Map((local.documentOriginals??[]).map(o=>[o.documentId,o.sha256]));
  const rOrig = new Map((remote.documentOriginals??[]).map(o=>[o.documentId,o.sha256]));
  for (const id of new Set([...lOrig.keys(),...rOrig.keys()])) {
    if (lOrig.get(id) !== rOrig.get(id)) {
      problems.push(`El original de «${localDocs.get(id)?.title??remoteDocs.get(id)?.title??id}» no coincide entre navegador y Firebase.`);
    }
  }
  const sorted = (values:string[]) => [...values].sort().join("|");
  const lv = (local.repository.assetValidations??[]).map(v=>`${v.id}:${v.documentId}`);
  const rv = (remote.repository.assetValidations??[]).map(v=>`${v.id}:${v.documentId}`);
  if (sorted(lv) !== sorted(rv)) problems.push("Las declaraciones de validación de activos no coinciden.");
  const links=(workspace:MunicipalityWorkspace)=>workspace.evidenceStore.atoms
    .filter(a=>!!a.provenance.documentId)
    .map(a=>`${a.id}:${a.provenance.documentId}`);
  if (sorted(links(local)) !== sorted(links(remote))) problems.push("Las evidencias vinculadas a documentos no coinciden.");
  return {
    matches:problems.length===0,
    problems,
    remoteUpdatedAt:remote.updatedAt,
    remoteDocuments:remoteDocs.size,
    remoteOriginals:rOrig.size,
  };
}
