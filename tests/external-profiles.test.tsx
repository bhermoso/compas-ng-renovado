import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import type { MunicipalityWorkspace } from '../src/domain/workspace';
import { EMPTY_PROFILE_LIBRARY, appendExternalProfile, importProfileFile, isExternalProfileLibrary, profileAttachmentBlob, readExternalProfilePackage } from '../src/application/health-profile/externalProfiles';
import { createMunicipalityRuntime } from '../src/application/runtime';
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from '../src/infrastructure/persistence/local-storage';
import { ExternalProfileDashboard } from '../src/ui/components/ExternalProfileDashboard';
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
 it('presenta cifras con fuente, ámbito, denominador y cautela histórica',()=>{
  const p=externalProfileFixture();
  const html=renderToStaticMarkup(createElement(ExternalProfileDashboard,{municipalityId:p.municipalityId,municipalityName:'Municipio de pruebas',library:{profiles:[p],attachments:[],activeId:p.id},authorName:'Pruebas',onSave:async()=>{}}));
  expect(html).toContain('Antecedente histórico');expect(html).toContain('Denominador no documentado');expect(html).toContain('Atlas ficticio');expect(html).toContain('Descargar esta revisión · Word');
  expect(html).not.toContain('prevalencia actual');
 });
 it('maqueta los datos suministrados para PDF y Word sin inventar conclusiones',()=>{
  const p=externalProfileFixture(),model=externalProfileDocument(p,'Municipio de pruebas');
  expect(model.sections.find(s=>s.title.startsWith('Texto del perfil'))?.paragraphs.join('\n\n')).toBe(p.text);
  expect(JSON.stringify(model)).toContain(p.results[2].caution);
  expect(model.portada.join(' ')).toContain('En revisión');expect(JSON.stringify(model)).not.toContain('2027–2030');
 });
});
