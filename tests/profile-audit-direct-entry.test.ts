import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,it,expect} from 'vitest';

const read=(name:string)=>readFileSync(resolve(name),'utf8');

describe('Acceso inequívoco al verificador de perfiles',()=>{
 it('compila una página independiente para evitar la vista administrativa anterior en caché',()=>{
  const html=read('verificar-perfiles.html');
  const vite=read('vite.config.ts');
  expect(html).toContain('Verificar perfiles en Firebase');
  expect(html).toContain('/src/main.tsx');
  expect(vite).toContain("verificarPerfiles: resolve(process.cwd(), 'verificar-perfiles.html')");
 });
 it('solo permite la auditoría de Firebase desde el área de administración autenticada',()=>{
  const source=read('src/ui/components/BrowserRelasAccess.tsx');
  expect(source).toContain("auditEntry=window.location.pathname.endsWith('/verificar-perfiles.html')");
  expect(source).toContain('if(profile?.administrator&&auditEntry)return');
  expect(source).toContain('<ProfileRemoteAuditPanel client={client}/>');
  expect(source).toContain('onAuthStateChanged');
  expect(source).not.toContain('if(auditEntry)return <ProfileRemoteAuditPanel');
 });
 it('el panel principal ofrece un acceso explícito al verificador',()=>{
  const admin=read('src/ui/components/AdministrationPanel.tsx');
  expect(admin).toContain('Abrir comprobación independiente de Firebase');
  expect(admin).toContain('verificar-perfiles.html');
 });
});
