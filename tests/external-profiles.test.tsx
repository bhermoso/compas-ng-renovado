import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProfileStructure } from '../src/application/health-profile/profileStructure';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import type { MunicipalityWorkspace } from '../src/domain/workspace';
import { EMPTY_PROFILE_LIBRARY, appendExternalProfile, archiveExternalProfileVersion, deleteExternalProfileVersion, importProfileFile, isExternalProfileLibrary, prepareImportedProfileRevision, profileAttachmentBlob, readExternalProfilePackage } from '../src/application/health-profile/externalProfiles';
import { createMunicipalityRuntime } from '../src/application/runtime';
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from '../src/infrastructure/persistence/local-storage';
import { ExternalProfileDashboard } from '../src/ui/components/ExternalProfileDashboard';
import { ProfileEditorialLab } from '../src/ui/components/ProfileEditorialLab';
import { externalProfileDocument } from '../src/application/health-profile/externalProfileDocument';
import { profileSaveErrorMessage, profileSaveProgressMessage } from '../src/application/health-profile/profileSaveFeedback';
import { externalProfileFixture } from './helpers/externalProfileFixture';

const workspace = () => {const w=structuredClone(seed) as unknown as MunicipalityWorkspace;delete w.validatedPSL;return w;};
describe('Perfil externo: documentos, versiones y presentación',()=>{
 it('conserva todos los bytes y verifica su huella al recuperar un original',async()=>{
  const text='Perfil aportado · áéíóú\nSin interpretación automática.';
  const {attachment,content}=await importProfileFile(new File([text],'perfil.txt'),'profile-test');
  expect(content.text).toBe(text);
  expect(await (await profileAttachmentBlob(attachment)).text()).toBe(text);
  await expect(profileAttachmentBlob({...attachment,base64:btoa('alterado')})).rejects.toThrow(/integridad/);
 });
 it('extrae un Word real y mantiene el original descargable byte por byte',async()=>{
  const {Document,Paragraph,Packer}=await import('docx');
  const bytes=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph('Perfil externo de prueba: contenido íntegro.')]}]}));
  const {attachment,content,notice}=await importProfileFile(new File([new Uint8Array(bytes)],'perfil.docx'),'profile-test');
  expect(notice).toBeUndefined();expect(content.text).toContain('contenido íntegro');
  expect(new Uint8Array(await (await profileAttachmentBlob(attachment)).arrayBuffer())).toEqual(new Uint8Array(bytes));
 });
 it('rechaza archivos vacíos, formatos distintos y documentos de otro municipio',async()=>{
  await expect(importProfileFile(new File([],'perfil.txt'),'profile-test')).rejects.toThrow(/no vacío/);
  await expect(importProfileFile(new File(['otro'],'perfil.pdf'),'profile-test')).rejects.toThrow(/formato/);
  const p=externalProfileFixture();
  expect(()=>readExternalProfilePackage(JSON.stringify({...p,schema:'compas-profile-package/v1',municipalityId:'other'}),'profile-test')).toThrow(/otro municipio/);
 });
 it('importa contenido literal sin aceptar la validación incluida en un paquete',()=>{
  const p=externalProfileFixture();
  const read=readExternalProfilePackage(JSON.stringify({...p,schema:'compas-profile-package/v1',status:'validated',validatedBy:'admin',text:'<script>alert(1)</script>'}),'profile-test');
  expect(read).not.toHaveProperty('status');expect(read).not.toHaveProperty('validatedBy');
  expect(read.text).toBe('<script>alert(1)</script>');
 });
 it('mantiene originales y todas las revisiones al serializar y recuperar el expediente',async()=>{
  const w=workspace(),id=w.municipality.identity.id;
  const {attachment}=await importProfileFile(new File(['Original íntegro'],'perfil.txt'),id);
  const first={...externalProfileFixture(id),attachmentIds:[attachment.id]};
  const one=appendExternalProfile(EMPTY_PROFILE_LIBRARY,first,[attachment],id);
  const second={...first,id:'profile-test-v2',revisionOf:first.id,text:'Texto revisado'};
  w.externalProfileLibrary=appendExternalProfile(one,second,[],id);
  expect(one.profiles).toHaveLength(1);expect(one.profiles[0].text).not.toBe(second.text);
  const restored=parseWorkspaceJSON(serializeWorkspaceForStorage(w))!;
  expect(restored.externalProfileLibrary).toEqual(w.externalProfileLibrary);
  expect(await (await profileAttachmentBlob(restored.externalProfileLibrary!.attachments[0])).text()).toBe('Original íntegro');
 });
 it('conserva vínculos documentales al exportar, guardar y recuperar una revisión sin activarla',()=>{
  const original=externalProfileFixture();
  const withLinks={...original,id:'profile-test-linked',revisionOf:original.id,results:original.results.map((r,i)=>i===0?{...r,supportsConclusions:['C1']}:r)};
  const library=appendExternalProfile({profiles:[original],attachments:[],activeId:original.id},withLinks,[],original.municipalityId);
  expect(library.activeId).toBe(original.id);
  expect(library.profiles).toHaveLength(2);
  expect(library.profiles[0].results[0].supportsConclusions).toBeUndefined();
  expect(library.profiles[1].results[0].supportsConclusions).toEqual(['C1']);
  const packageText=JSON.stringify({schema:'compas-profile-package/v1',municipalityId:original.municipalityId,
    title:withLinks.title,period:withLinks.period,author:withLinks.author,summary:withLinks.summary,
    text:withLinks.text,results:withLinks.results,findings:withLinks.findings,
    limitations:withLinks.limitations,areas:withLinks.areas});
  expect(readExternalProfilePackage(packageText,original.municipalityId).results[0].supportsConclusions).toEqual(['C1']);
  expect(isExternalProfileLibrary(library,original.municipalityId)).toBe(true);
 });
 it('rechaza vínculos mal formados, duplicados o ajenos al contrato',()=>{
  const p=externalProfileFixture();
  for(const ids of [['C0'],['R1'],['C1','C1']]){
   const broken={...p,results:p.results.map((r,i)=>i===0?{...r,supportsConclusions:ids}:r)};
   expect(isExternalProfileLibrary({profiles:[broken],attachments:[],activeId:broken.id},p.municipalityId)).toBe(false);
   expect(()=>readExternalProfilePackage(JSON.stringify({...broken,schema:'compas-profile-package/v1'}),p.municipalityId)).toThrow();
  }
 });
 it('simula Loja v0.3: revisión trazable, lectura y recuperación sin sustituir la vigente',()=>{
  const text=readFileSync(resolve(__dirname,'fixtures/profile-text/loja-v0.3-package.txt'),'utf8');
  const parsed=parseProfileStructure(text);
  expect(parsed.conclusions.length).toBeGreaterThan(0);
  const first=externalProfileFixture('loja');
  const indicator={...first.results[0],supportsConclusions:[parsed.conclusions[0].id]};
  const revision={...first,id:'loja-v03-review-test',revisionOf:first.id,text,
    results:[indicator,...first.results.slice(1)]};
  const library=appendExternalProfile({profiles:[first],attachments:[],activeId:first.id},revision,[],'loja');
  expect(library.activeId).toBe(first.id);
  expect(library.profiles[0].results[0].supportsConclusions).toBeUndefined();
  const stored=JSON.parse(JSON.stringify(library));
  expect(isExternalProfileLibrary(stored,'loja')).toBe(true);
  expect(stored.profiles[1].results[0].supportsConclusions).toEqual([parsed.conclusions[0].id]);
  const page=renderToStaticMarkup(createElement(ExternalProfileDashboard,{
    municipalityId:'loja',municipalityName:'Loja',library:stored,authorName:'Equipo de pruebas',onSave:async()=>{}
  }));
  expect(page).toContain('Perfil');
  expect(page).toContain('Gestión y versiones');
  expect(page).toContain('Documento completo');
  // El panel abierto inicialmente representa la versión vigente, no una revisión pendiente.
  expect(stored.activeId).toBe(first.id);
 });
 it('no admite referencias rotas, bytes incompletos ni validaciones sin autoría',()=>{
  const p=externalProfileFixture();
  expect(isExternalProfileLibrary({profiles:[{...p,attachmentIds:['lost']}],attachments:[],activeId:p.id},p.municipalityId)).toBe(false);
  expect(isExternalProfileLibrary({profiles:[{...p,status:'validated'}],attachments:[],activeId:p.id},p.municipalityId)).toBe(false);
  expect(isExternalProfileLibrary({profiles:[{...p,revisionOf:'lost'}],attachments:[],activeId:p.id},p.municipalityId)).toBe(false);
  expect(isExternalProfileLibrary({profiles:[p],attachments:[],activeId:p.id},'other')).toBe(false);
 });
 it('no genera un perfil aunque el expediente tenga evidencia sanitaria',()=>{
  const w=workspace();expect(w.evidenceStore.atoms.length).toBeGreaterThan(0);
  const runtime=createMunicipalityRuntime({workspace:w});
  expect(runtime.psl.status).toBe('archived');expect(runtime.psl.conclusiones.content).toBe('');
  expect(runtime.psl.areasDeIntervencion).toEqual([]);expect(runtime.lectura).toBeUndefined();
 });
 it('proyecta exclusivamente el perfil aportado, sin cambiar evidencias ni autoría',()=>{
  const w=workspace(),before=JSON.stringify(w.evidenceStore),p=externalProfileFixture(w.municipality.identity.id);
  w.externalProfileLibrary={profiles:[p],attachments:[],activeId:p.id};
  const runtime=createMunicipalityRuntime({workspace:w});
  expect(runtime.psl.conclusiones.content).toBe(p.text);expect(runtime.psl.territorialSummary).toBe(p.summary);
  expect(runtime.psl.areasDeIntervencion.map(a=>a.title)).toEqual(p.areas.map(a=>a.title));
  expect(JSON.stringify(w.evidenceStore)).toBe(before);expect(w.externalProfileLibrary.profiles[0].status).toBe('review');
 });
 it('conserva un perfil histórico guardado sin recalcularlo',()=>{
  const w=workspace();const saved={...createMunicipalityRuntime({workspace:w}).psl,status:'validated' as const,conclusiones:{content:'Texto histórico firmado',status:'authored' as const,authorshipNote:'Equipo histórico'}};
  w.validatedPSL=saved;expect(createMunicipalityRuntime({workspace:w}).psl).toBe(saved);
 });
 it('ofrece un cargador visible sin generar ni compilar perfiles',()=>{
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{municipalityId:'profile-test',municipalityName:'Municipio de pruebas',library:EMPTY_PROFILE_LIBRARY,authorName:'Pruebas',onSave:async()=>{}}));
  expect(html).toContain('Cargar perfil');expect(html).toContain('Seleccionar el perfil');expect(html).not.toContain('Generar PSL');
 });
 it('presenta cifras con fuente, ámbito y denominador, sin cautelas añadidas a los datos epidemiológicos',()=>{
  const p=externalProfileFixture();
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{municipalityId:p.municipalityId,municipalityName:'Municipio de pruebas',library:{profiles:[p],attachments:[],activeId:p.id},authorName:'Pruebas',onSave:async()=>{}}));
  // Decisión del autor (2026-11-01): los datos epidemiológicos no se cuestionan; COMPÁS no añade advertencias propias.
  expect(html).not.toContain('Antecedente histórico');expect(html).not.toContain('no describe por sí solo');expect(html).toContain('Denominador no documentado');expect(html).toContain('Atlas ficticio');expect(html).toContain('Gestión y versiones');expect(html).toContain('Laboratorio experimental');expect(html).not.toContain('Descargar esta revisión · Word');expect(html).toContain('Exportar presentación COMPÁS · PDF');
  expect(html).not.toContain('prevalencia actual');
 });
 it('una v0.2 importada mantiene la v0.1 activa y en revisión hasta promoción explícita',()=>{
  const first=externalProfileFixture('alfacar');
  const incoming={...externalProfileFixture('alfacar'),id:'alfacar-v02-imported',status:'validated' as const,validatedBy:'No autorizado',validatedAt:'2026-11-03T12:00:00Z'};
  const second=prepareImportedProfileRevision(incoming,first);
  const library=appendExternalProfile({profiles:[first],attachments:[],activeId:first.id},second,[],'alfacar');
  expect(second.revisionOf).toBe(first.id);
  expect(second.status).toBe('review');
  expect(second.validatedBy).toBeUndefined();
  expect(second.validatedAt).toBeUndefined();
  expect(library.activeId).toBe(first.id);
  expect(library.profiles[0]).toEqual(first);
  expect(library.profiles[1].id).toBe('alfacar-v02-imported');
 });
 it('Alfacar: permite eliminar cualquiera de tres versiones, incluso la vigente o la antecesora',()=>{
  const a=externalProfileFixture('alfacar');
  const b={...a,id:'alfacar-v2',revisionOf:a.id};
  const c={...a,id:'alfacar-v3',revisionOf:b.id};
  const library={profiles:[a,b,c],attachments:[],activeId:c.id};
  for(const target of [a.id,b.id,c.id]){
   const next=deleteExternalProfileVersion(library,target);
   expect(next.profiles).toHaveLength(2);
   expect(next.profiles.some(p=>p.id===target)).toBe(false);
   expect(isExternalProfileLibrary(next,'alfacar')).toBe(true);
  }
  const withoutMiddle=deleteExternalProfileVersion(library,b.id);
  expect(withoutMiddle.profiles.find(p=>p.id===c.id)?.revisionOf).toBe(a.id);
  const withoutActive=deleteExternalProfileVersion(library,c.id);
  expect(withoutActive.activeId).toBe(b.id);
  const withoutRoot=deleteExternalProfileVersion(library,a.id);
  expect(withoutRoot.profiles.find(p=>p.id===b.id)?.revisionOf).toBeUndefined();
  const empty=deleteExternalProfileVersion({profiles:[a],attachments:[],activeId:a.id},a.id);
  expect(empty.profiles).toHaveLength(0);
  expect(empty.activeId).toBeUndefined();
 });
 it('al importar el primer perfil no crea una revisión sin antecedente',()=>{
  const profile=externalProfileFixture('alfacar');
  expect(prepareImportedProfileRevision(profile)).toBe(profile);
 });
 it('identifica claramente la exportación derivada y la ausencia del PDF fuente',()=>{
  const p=externalProfileFixture('alfacar');
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{
   municipalityId:'alfacar',municipalityName:'Alfacar',
   library:{profiles:[p],attachments:[],activeId:p.id},authorName:'Pruebas',onSave:async()=>{}
  }));
  expect(html).toContain('Exportar presentación COMPÁS · PDF');
  expect(html).toContain('PDF original no adjunto a esta versión.');
  expect(html).toContain('Borrador técnico: pendiente de validación.');
  expect(html).not.toContain('Perfil completo · PDF');
 });

 it('el laboratorio permite revisar C3, C6 y C7 sin escribir en el perfil original',()=>{
  const p=externalProfileFixture();
  p.text=readFileSync(resolve('tests/fixtures/profile-text/loja-v0.3-package.txt'),'utf8');
  const before=JSON.stringify(p);
  const html=renderToStaticMarkup(createElement(ProfileEditorialLab,{profile:p}));
  for(const id of ['C3','C6','C7']) expect(html).toContain('value="'+id+'"');
  expect(html).toContain('Decisión profesional');
  expect(html).toContain('Exportar decisión profesional');
  expect(html).toContain('ni modifica el perfil vigente');
  expect(JSON.stringify(p)).toBe(before);
 });
 it('el PDF completo incluye el texto fuente y todos los grupos de indicadores, sin depender del filtro visible',()=>{
  const p=externalProfileFixture();
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{municipalityId:p.municipalityId,municipalityName:'Municipio de pruebas',library:{profiles:[p],attachments:[],activeId:p.id},authorName:'Pruebas',onSave:async()=>{}}));
  expect(html).toContain('epd-full-document');
  expect(html).toContain('Texto completo del perfil incorporado');
  expect(html).toContain('Contenido literal aportado por el equipo.');
  expect(html).toContain('epd-print-topics');
  expect(html).toContain('epd-screen-topics');
  expect(html).toContain('Exportar presentación COMPÁS · PDF');
 });
 it('reconoce un perfil anterior de COMPÁS sin exigir que se convierta en perfil externo',()=>{
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{
   municipalityId:'zagra-test',municipalityName:'Zagra',library:EMPTY_PROFILE_LIBRARY,
   legacyText:'Perfil histórico de Zagra conservado en el expediente.',
   authorName:'Pruebas',onSave:async()=>{}
  }));
  expect(html).toContain('Ya existe un perfil anterior de COMPÁS');
  expect(html).toContain('Perfil histórico de Zagra conservado en el expediente.');
  expect(html).toContain('ep-legacy');
  expect(html).toContain('open=""');
  expect(html).toContain('Seleccionar el perfil');
 });
 it('permite cotejar un PDF original sin añadir archivos o modificar el expediente',()=>{
  const p=externalProfileFixture();
  const library={profiles:[p],attachments:[],activeId:p.id};
  const snapshot=JSON.stringify(library);
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{municipalityId:p.municipalityId,municipalityName:'Municipio de pruebas',library,authorName:'Pruebas',onSave:async()=>{}}));
  expect(html).toContain('Comprobar si el PDF original ya está guardado');
  expect(html).toContain('0 PDF originales adjuntos');
  expect(html).toContain('No sube archivos');
  expect(JSON.stringify(library)).toBe(snapshot);
 });
 it('maqueta los datos suministrados para PDF y Word sin inventar conclusiones',()=>{
  const p=externalProfileFixture(),model=externalProfileDocument(p,'Municipio de pruebas');
  expect(model.sections.find(s=>s.title.startsWith('Texto del perfil'))?.paragraphs.join('\n\n')).toBe(p.text);
  expect(JSON.stringify(model)).toContain(p.results[2].caution);
  expect(model.portada.join(' ')).toContain('En revisión');expect(JSON.stringify(model)).not.toContain('2027–2030');
 });
});

describe('Guardado de perfil en Firebase · errores y estados', () => {
 it('distingue espera, progreso y confirmación del servidor', () => {
  expect(profileSaveProgressMessage({phase:'waiting',completedChunks:0,totalChunks:0})).toContain('Esperando');
  expect(profileSaveProgressMessage({phase:'writing',completedChunks:24,totalChunks:120})).toContain('24 de 120');
  expect(profileSaveProgressMessage({phase:'confirming',completedChunks:120,totalChunks:120})).toContain('Confirmando');
  expect(profileSaveProgressMessage({phase:'saved',completedChunks:120,totalChunks:120})).toContain('confirmado');
 });
 it('ofrece un diagnóstico accionable de permisos, cuota, conexión y conflictos', () => {
  expect(profileSaveErrorMessage({code:'permission-denied'})).toContain('permisos');
  expect(profileSaveErrorMessage({code:'resource-exhausted'})).toContain('cuota');
  expect(profileSaveErrorMessage({code:'unavailable'})).toContain('conexión');
  expect(profileSaveErrorMessage(new Error('Firebase tiene una versión más reciente'))).toContain('más reciente');
 });
});

describe('Gestión documental de perfiles · custodia y eliminación sin reapariciones',()=>{
 it('no archiva ni elimina la versión vigente ni una revisión que tenga descendientes',async()=>{
  const id='alfacar';
  const original=await importProfileFile(new File(['Documento A'],'original.txt'),id);
  const first={...externalProfileFixture(id),id:'alfacar-v01',attachmentIds:[original.attachment.id]};
  const second={...first,id:'alfacar-v02',revisionOf:first.id,attachmentIds:[original.attachment.id],createdAt:'2026-11-04T09:00:00.000Z'};
  const third={...first,id:'alfacar-v03',revisionOf:second.id,attachmentIds:[original.attachment.id],createdAt:'2026-11-04T10:00:00.000Z'};
  const library={profiles:[first,second,third],attachments:[original.attachment],activeId:third.id};
  expect(()=>archiveExternalProfileVersion(library,third.id,'Revisión')).toThrow(/vigente/);
  const archived=archiveExternalProfileVersion(library,second.id,'Autoría');
  expect(archived.profiles[1].archivedAt).toBeTruthy();
  expect(isExternalProfileLibrary(archived,id)).toBe(true);
  expect(()=>deleteExternalProfileVersion(archived,second.id)).toThrow(/revisiones posteriores/);
  expect(()=>deleteExternalProfileVersion(library,first.id)).toThrow(/Archiva primero/);
  expect(library.profiles[1].archivedAt).toBeUndefined();
 });
 it('elimina un borrador archivado terminal y solo libera originales no referenciados',async()=>{
  const id='alfacar';
  const original=await importProfileFile(new File(['Fuente compartida'],'compartido.txt'),id);
  const extra=await importProfileFile(new File(['Borrador descartado'],'solo-borrador.txt'),id);
  const first={...externalProfileFixture(id),id:'alfacar-v01',attachmentIds:[original.attachment.id]};
  const second={...first,id:'alfacar-v02',revisionOf:first.id,attachmentIds:[original.attachment.id,extra.attachment.id],createdAt:'2026-11-04T12:00:00.000Z'};
  const library={profiles:[first,second],attachments:[original.attachment,extra.attachment],activeId:first.id};
  const archived=archiveExternalProfileVersion(library,second.id,'Equipo técnico','2026-11-04T13:00:00.000Z');
  const restored=JSON.parse(JSON.stringify(archived));
  expect(isExternalProfileLibrary(restored,id)).toBe(true);
  const deleted=deleteExternalProfileVersion(restored,second.id);
  expect(deleted.profiles.map(p=>p.id)).toEqual(['alfacar-v01']);
  expect(deleted.attachments.map(a=>a.id)).toEqual([original.attachment.id]);
  expect(deleted.activeId).toBe('alfacar-v01');
  expect(isExternalProfileLibrary(deleted,id)).toBe(true);
  expect(await (await profileAttachmentBlob(deleted.attachments[0])).text()).toBe('Fuente compartida');
  expect(library.profiles).toHaveLength(2);
 });
 it('ofrece gestión visible junto al Perfil, no solo en un diálogo oculto',()=>{
  const p=externalProfileFixture('alfacar');
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{
   municipalityId:'alfacar',municipalityName:'Alfacar',library:{profiles:[p],attachments:[],activeId:p.id},authorName:'Equipo',onSave:async()=>{}
  }));
  expect(html).toContain('Gestionar archivos y versiones');
  expect(html).toContain('Crear nueva revisión');
  expect(html).toContain('Archivos y versiones');
 });
});
