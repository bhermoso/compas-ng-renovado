/**
 * Comprobación de solo lectura. Ningún nombre, texto, binario o hash se envía
 * fuera de la sesión del administrador; los archivos se verifican en memoria.
 *
 * "Equivalencia" significa misma modalidad documental y mínimos técnicos,
 * nunca igualdad de cifras epidemiológicas entre municipios.
 */
import type { MunicipalityWorkspace } from '../../domain/workspace';
import { EMPTY_PROFILE_LIBRARY, isExternalProfileLibrary, profileAttachmentBlob } from './externalProfiles';

export const PROFILE_AUDIT_SCOPES = [
 {id:'alfacar',name:'Alfacar'},
 {id:'atarfe',name:'Atarfe'},
 {id:'loja',name:'Loja'},
 {id:'zagra',name:'Zagra'},
] as const;

export interface ProfileAuditVersion {
 id: string;
 title: string;
 status: string;
 active: boolean;
 archived: boolean;
 parentFound: boolean;
 pdfs: number;
 files: number;
 results: number;
 textPresent: boolean;
 createdAt: string;
 attachmentNames: string[];
}
export interface ProfileAuditResult {
 scope: string;
 name: string;
 remote: 'ok'|'missing'|'error';
 remoteUpdatedAt?: string;
 error?: string;
 libraryValid: boolean;
 originalsVerified: boolean;
 originalsChecked: number;
 originalsFailed: number;
 externalVersions: number;
 legacyVersions: number;
 hasLegacyText: boolean;
 activeFound: boolean;
 activePdf: boolean;
 activeText: boolean;
 activeResults: boolean;
 activeStatus?: string;
 versions: ProfileAuditVersion[];
 observations: string[];
}
export type ProfileAuditParity = {status:'no_evaluable'|'equivalentes'|'distintos';notes:string[]};

/** readRemoteWorkspace ya contrasta esquema, ámbito, conteo, orden y longitud de fragmentos Firestore. */
export async function inspectRemoteProfile(
 workspace: MunicipalityWorkspace|null,
 scope:string,
 name:string
): Promise<ProfileAuditResult>{
 const basic:ProfileAuditResult={
  scope,name,remote:workspace?'ok':'missing',libraryValid:false,originalsVerified:false,
  originalsChecked:0,originalsFailed:0,externalVersions:0,legacyVersions:0,
  hasLegacyText:false,activeFound:false,activePdf:false,activeText:false,
  activeResults:false,versions:[],observations:[]
 };
 if(!workspace){basic.observations.push('No hay expediente compartido en Firebase para este ámbito.');return basic;}
 if(workspace.municipality.identity.id!==scope){
  return {...basic,remote:'error',error:'El expediente leído pertenece a otro municipio.'};
 }
 basic.remoteUpdatedAt=workspace.updatedAt;
 basic.legacyVersions=workspace.compiledProfiles?.length||0;
 basic.hasLegacyText=Boolean(workspace.validatedPSL?.conclusiones?.content?.trim());
 const library=workspace.externalProfileLibrary??EMPTY_PROFILE_LIBRARY;
 basic.libraryValid=isExternalProfileLibrary(library,scope);
 if(!basic.libraryValid){
  basic.observations.push('Biblioteca externa incompatible: versiones, adjuntos o linaje sin integridad.');
  return basic;
 }
 basic.externalVersions=library.profiles.length;
 const attachments=new Map(library.attachments.map(x=>[x.id,x]));
 const active=library.profiles.find(x=>x.id===library.activeId);
 basic.activeFound=Boolean(active);
 basic.activePdf=Boolean(active?.attachmentIds.some(id=>{
  const f=attachments.get(id);
  return f?.mimeType==='application/pdf'||f?.name.toLowerCase().endsWith('.pdf');
 }));
 basic.activeText=Boolean(active?.text.trim());
 basic.activeResults=Boolean(active?.results.length);
 basic.activeStatus=active?.status;
 const ids=new Set(library.profiles.map(p=>p.id));
 basic.versions=library.profiles.map(p=>({
  id:p.id,title:p.title,status:p.status,active:p.id===library.activeId,
  archived:Boolean(p.archivedAt),parentFound:!p.revisionOf||ids.has(p.revisionOf),
  pdfs:p.attachmentIds.filter(id=>attachments.get(id)?.mimeType==='application/pdf'||
     attachments.get(id)?.name.toLowerCase().endsWith('.pdf')).length,
  files:p.attachmentIds.length,results:p.results.length,textPresent:Boolean(p.text.trim()),
  createdAt:p.createdAt,attachmentNames:p.attachmentIds.flatMap(id=>attachments.get(id)?[attachments.get(id)!.name]:[])
 }));
 // No basta comprobar el hash anunciado: se recalcula SHA-256 de cada original.
 for(const file of library.attachments){
  basic.originalsChecked++;
  try{await profileAttachmentBlob(file);}
  catch{basic.originalsFailed++;}
 }
 basic.originalsVerified=basic.originalsFailed===0;
 if(!basic.originalsVerified)basic.observations.push(basic.originalsFailed+' original(es) no superan SHA-256 o longitud.');
 if(!library.profiles.length){
  basic.observations.push(basic.legacyVersions||basic.hasLegacyText
    ?'Solo hay perfil histórico generado en COMPÁS; no hay perfil externo subido.'
    :'No consta ningún perfil externo cargado en Firebase.');
 }else{
  if(!active)basic.observations.push('Hay versiones externas, pero no existe versión vigente designada.');
  if(active&&!basic.activePdf)basic.observations.push('La versión vigente no enlaza un PDF original.');
  if(active&&!basic.activeText)basic.observations.push('La versión vigente no dispone de texto completo.');
  if(active&&!basic.activeResults)basic.observations.push('La versión vigente carece de resultados estructurados.');
 }
 return basic;
}

export function profileParity(rows:ProfileAuditResult[]):ProfileAuditParity{
 if(rows.length!==PROFILE_AUDIT_SCOPES.length||rows.some(r=>r.remote!=='ok')){
  return {status:'no_evaluable',notes:['No se han podido recuperar del servidor los cuatro expedientes. No cabe concluir equivalencia.']};
 }
 if(rows.some(r=>!r.libraryValid||!r.originalsVerified)){
  return {status:'distintos',notes:['Alguna biblioteca u original no supera la verificación de integridad.']};
 }
 const missing=rows.filter(r=>!r.activeFound);
 if(missing.length){
  return {status:'distintos',notes:[
   'Falta un perfil externo vigente en: '+missing.map(x=>x.name).join(', ')+'.',
   'Un perfil histórico compilado no equivale automáticamente a un perfil externo con original PDF.'
  ]};
 }
 const criteria=[
  {key:'activePdf',label:'PDF original vinculado'},
  {key:'activeText',label:'texto completo'},
  {key:'activeResults',label:'resultados estructurados'},
 ] as const;
 const mismatch=criteria.filter(c=>rows.some(r=>!r[c.key]));
 if(mismatch.length){
  return {status:'distintos',notes:mismatch.map(c=>
   'No todos reúnen '+c.label+': '+rows.filter(r=>!r[c.key]).map(r=>r.name).join(', ')+'.'
  )};
 }
 return {status:'equivalentes',notes:[
  'Los cuatro expedientes se leen desde Firebase y conservan el mismo soporte técnico: versión externa vigente, PDF original con integridad verificada, texto y resultados.',
  'Esto no acredita que el contenido del PDF y su transcripción sean idénticos ni que los indicadores de los cuatro municipios tengan la misma cobertura.',
  'La validación técnica, número de versiones y amplitud del contenido se muestran por separado.'
 ]};
}
