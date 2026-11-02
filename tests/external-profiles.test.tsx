import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProfileStructure } from '../src/application/health-profile/profileStructure';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import type { MunicipalityWorkspace } from '../src/domain/workspace';
import { EMPTY_PROFILE_LIBRARY, appendExternalProfile, importProfileFile, isExternalProfileLibrary, profileAttachmentBlob, readExternalProfilePackage } from '../src/application/health-profile/externalProfiles';
import { createMunicipalityRuntime } from '../src/application/runtime';
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from '../src/infrastructure/persistence/local-storage';
import { ExternalProfileDashboard } from '../src/ui/components/ExternalProfileDashboard';
import { ProfileEditorialLab } from '../src/ui/components/ProfileEditorialLab';
import { externalProfileDocument } from '../src/application/health-profile/externalProfileDocument';
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
  expect(html).not.toContain('Antecedente histórico');expect(html).not.toContain('no describe por sí solo');expect(html).toContain('Denominador no documentado');expect(html).toContain('Atlas ficticio');expect(html).toContain('Gestión y versiones');expect(html).toContain('Laboratorio experimental');expect(html).not.toContain('Descargar esta revisión · Word');expect(html).toContain('Perfil completo · PDF');
  expect(html).not.toContain('prevalencia actual');
 });
 it('el laboratorio permite revisar C3, C6 y C7 sin escribir en el perfil original',()=>{
  const p=externalProfileFixture();
  p.text=readFileSync(resolve('tests/fixtures/profile-text/loja-v0.3-package.txt'),'utf8');
  const before=JSON.stringify(p);
  const html=renderToStaticMarkup(createElement(ProfileEditorialLab,{profile:p}));
  for(const id of ['C3','C6','C7']) expect(html).toContain('value="'+id+'"');
  expect(html).toContain('Decisión profesional');
  expect(html).toContain('Exportar decisión profesional');
  expect(html).toContain('no modifica el perfil vigente');
  expect(JSON.stringify(p)).toBe(before);
 });
 it('maqueta los datos suministrados para PDF y Word sin inventar conclusiones',()=>{
  const p=externalProfileFixture(),model=externalProfileDocument(p,'Municipio de pruebas');
  expect(model.sections.find(s=>s.title.startsWith('Texto del perfil'))?.paragraphs.join('\n\n')).toBe(p.text);
  expect(JSON.stringify(model)).toContain(p.results[2].caution);
  expect(model.portada.join(' ')).toContain('En revisión');expect(JSON.stringify(model)).not.toContain('2027–2030');
 });
});
