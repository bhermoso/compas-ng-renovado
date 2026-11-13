import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';
import type {MunicipalityWorkspace} from '../src/domain/workspace';
import {inspectRemoteProfile,profileParity,PROFILE_AUDIT_SCOPES} from '../src/application/health-profile/profileRemoteAudit';
import {externalProfileFixture} from './helpers/externalProfileFixture';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';

function pdf(id:string){
 const buf=Buffer.from('%PDF-1.7\nAudit test only\n%%EOF');
 return {id,name:'perfil-'+id+'.pdf',mimeType:'application/pdf',size:buf.length,
  sha256:createHash('sha256').update(buf).digest('hex'),base64:buf.toString('base64')};
}
function workspace(scope:string,{external=true,original=true,good=true}={}){
 const w=structuredClone(seed) as unknown as MunicipalityWorkspace;
 w.municipality.identity.id=scope;
 if(external){
  const doc=pdf(scope);
  if(!good)doc.sha256='0'.repeat(64);
  const p={...externalProfileFixture(scope),id:scope+'-rev1',attachmentIds:original?[doc.id]:[]};
  w.externalProfileLibrary={profiles:[p],attachments:original?[doc]:[],activeId:p.id};
 }else{w.externalProfileLibrary=undefined;}
 return w;
}

describe('auditoría remota auténtica de perfiles (cálculos puros, sin acceso a Firebase en tests)',()=>{
 it('define los cuatro municipios exactos y no declara éxito cuando falta el expediente',async()=>{
  expect(PROFILE_AUDIT_SCOPES.map(x=>x.id)).toEqual(['alfacar','atarfe','loja','zagra']);
  const missing=await inspectRemoteProfile(null,'zagra','Zagra');
  expect(missing.remote).toBe('missing');
  expect(missing.activeFound).toBe(false);
  expect(profileParity([missing]).status).toBe('no_evaluable');
 });
 it('mismo contrato documental con datos distintos se considera equivalente',async()=>{
  const rows=[];
  for(const s of PROFILE_AUDIT_SCOPES){
   const w=workspace(s.id);
   w.externalProfileLibrary!.profiles[0].text='Informe territorial específico: '+s.name;
   const summary=await inspectRemoteProfile(w,s.id,s.name);
   expect(summary.remote).toBe('ok');
   expect(summary.libraryValid).toBe(true);
   expect(summary.originalsChecked).toBe(1);
   expect(summary.originalsFailed).toBe(0);
   expect(summary.activePdf).toBe(true);
   rows.push(summary);
  }
  expect(profileParity(rows).status).toBe('equivalentes');
  expect(profileParity(rows).notes.join(' ')).toMatch(/no acredita/);
 });
 it('sin externo en Zagra no equivale a uno vigente de Alfacar y Loja',async()=>{
  const rows=await Promise.all(PROFILE_AUDIT_SCOPES.map(s=>
   inspectRemoteProfile(workspace(s.id,{external:s.id!=='zagra'}),s.id,s.name)));
  expect(rows.find(r=>r.scope==='zagra')!.externalVersions).toBe(0);
  expect(profileParity(rows).status).toBe('distintos');
  expect(profileParity(rows).notes.join(' ')).toContain('Zagra');
 });
 it('PDF ausente en Loja se distingue de un archivo no verificado',async()=>{
  const rows=await Promise.all(PROFILE_AUDIT_SCOPES.map(s=>
   inspectRemoteProfile(workspace(s.id,{original:s.id!=='loja'}),s.id,s.name)));
  expect(rows.find(r=>r.scope==='loja')!.activePdf).toBe(false);
  expect(rows.find(r=>r.scope==='loja')!.originalsVerified).toBe(true);
  expect(profileParity(rows).status).toBe('distintos');
  expect(profileParity(rows).notes.join(' ')).toContain('Loja');
 });
 it('identifica revisiones con el mismo título por ID, fecha y originales propios',async()=>{
  const w=workspace('alfacar');
  const lib=w.externalProfileLibrary!;
  const previous=lib.profiles[0];
  const nextFile=pdf('alfacar-nuevo');
  lib.attachments.push(nextFile);
  lib.profiles.push({...previous,id:'alfacar-rev2',revisionOf:previous.id,
   createdAt:'2026-11-12T12:00:00.000Z',attachmentIds:[nextFile.id]});
  // Una revisión posterior no se convierte en vigente por su fecha o título.
  const result=await inspectRemoteProfile(w,'alfacar','Alfacar');
  expect(result.versions.map(p=>p.id)).toEqual([previous.id,'alfacar-rev2']);
  expect(result.versions.filter(p=>p.active).map(p=>p.id)).toEqual([previous.id]);
  expect(result.versions[0].attachmentNames).toEqual(['perfil-alfacar.pdf']);
  expect(result.versions[1].attachmentNames).toEqual(['perfil-alfacar-nuevo.pdf']);
  expect(result.versions[1].createdAt).toBe('2026-11-12T12:00:00.000Z');
 });
 it('tres casos correctos no acreditan la comprobación de los cuatro casos actuales',async()=>{
  const rows=await Promise.all(PROFILE_AUDIT_SCOPES.slice(0,3).map(s=>
   inspectRemoteProfile(workspace(s.id),s.id,s.name)));
  expect(profileParity(rows).status).toBe('no_evaluable');
 });
 it('detecta PDF de SHA incorrecto incluso si las estructuras son correctas',async()=>{
  const row=await inspectRemoteProfile(workspace('alfacar',{good:false}),'alfacar','Alfacar');
  expect(row.libraryValid).toBe(true);
  expect(row.originalsFailed).toBe(1);
  expect(row.originalsVerified).toBe(false);
  expect(row.observations.join(' ')).toMatch(/SHA-256/);
 });
 it('rechaza un expediente que pertenezca a otro municipio',async()=>{
  const row=await inspectRemoteProfile(workspace('loja'),'alfacar','Alfacar');
  expect(row.remote).toBe('error');
  expect(row.error).toMatch(/otro municipio/);
 });
 it('se exige lectura de todos los fragmentos directamente de Firestore, no de caché',()=>{
  const src=readFileSync(resolve('src/infrastructure/relas/RemoteWorkspace.ts'),'utf8');
  expect(src).toMatch(/const chunksSnapshot = await getDocsFromServer\(/);
  expect(src).toMatch(/const manifestSnapshot = await getDocFromServer\(/);
  const admin=readFileSync(resolve('src/ui/components/AdministrationPanel.tsx'),'utf8');
  expect(admin).toMatch(/<ProfileRemoteAuditPanel client=\{client\}\/>/);
  const panel=readFileSync(resolve('src/ui/components/ProfileRemoteAuditPanel.tsx'),'utf8');
  expect(panel).toContain('readRemoteWorkspace(client,scope.id)');
  expect(panel).not.toMatch(/saveRemoteWorkspace|setDoc|deleteDoc|writeBatch/);
 });
});
