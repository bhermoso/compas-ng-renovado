import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=await createServer({plugins:[{
 name:'admin-preview',enforce:'pre',
 resolveId(source){if(/\/AdminAccounts(?:\.ts)?$/.test(source))return '\0admin-test-actions';},
 load(id){if(id==='\0admin-test-actions')return `export const listTerritorialSpaces=async()=>[{id:'granada-zaidin',name:'Granada · Zaidín',type:'distrito-municipal'},{id:'atarfe',name:'Atarfe',type:'municipio'}];export const createTerritorialSpace=async()=>{};export const listManagedAccounts=async()=>[];export const accessError=e=>e.message;export async function createTerritorialAccount(client,email){window.createdCount=(window.createdCount||0)+1;return {uid:'test-account',email,password:'Example-only-8!'};}export async function saveManagedAccess(){window.grantCount=(window.grantCount||0)+1;if(window.grantCount===1)throw new Error('Permiso pendiente: reintenta la asignación');}`;},
 configureServer(s){s.middlewares.use('/admin-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/admin-test',`<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import Panel from '/src/ui/components/AdministrationPanel.tsx';import '/src/index.css';import '/src/ui/components/BackupPanel.css';import '/src/ui/components/RelasAccess.css';createRoot(document.getElementById('root')).render(React.createElement('main',{className:'backup-recovery relas-access'},React.createElement('section',{className:'backup-panel'},React.createElement(Panel,{client:{},onOpenApp:()=>document.title='full-app',onOpenScope:s=>document.title=s}))));</script></body></html>`));});}
}],server:{host:'127.0.0.1',port:0}});
await server.listen();let browser;
try {
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM||'/tmp/compas-chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 await page.goto(`${base}/admin-test`);
 await page.getByLabel('Plan de salud').selectOption('granada-zaidin');
 assert.equal(await page.getByLabel('Plan de salud').inputValue(),'granada-zaidin');
 await page.getByLabel('Usuario: correo de la persona responsable').fill('responsable@example.test');
 await page.getByRole('button',{name:'Crear usuario, contraseña y acceso'}).click();
 await page.getByRole('heading',{name:'Cuenta creada: permiso pendiente'}).waitFor();
 await page.getByRole('button',{name:'Reintentar asignación'}).click();
 await page.getByRole('heading',{name:'Acceso preparado',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.createdCount),1);
 await page.getByRole('button',{name:'He guardado las credenciales'}).click();
 assert.equal(await page.getByLabel('Contraseña generada').count(),0);
 await page.getByRole('button',{name:'Retirar acceso',exact:true}).click();
 await page.getByRole('button',{name:'Reactivar acceso',exact:true}).waitFor();
 await page.getByRole('button',{name:'Abrir COMPAS completo'}).click();assert.equal(await page.title(),'full-app');
 await page.getByLabel('Plan de salud').selectOption('atarfe');await page.getByRole('button',{name:'Abrir plan seleccionado',exact:true}).click();assert.equal(await page.title(),'atarfe');
 // Alta de espacio con desplegables: sin escribir identificador; el municipio creado sale de la lista y entra en «Plan de salud».
 await page.getByLabel('Tipo de ámbito').selectOption('municipio');
 const before=await page.getByLabel(/Municipio de Granada/).locator('option').count();
 assert.equal(await page.getByLabel(/Municipio de Granada/).locator('option[value="18022"]').count(),0);
 await page.getByLabel(/Municipio de Granada/).selectOption('18079');
 await page.getByText('identificador').first().waitFor();
 assert.equal(await page.getByLabel('Identificador del ámbito').count(),0);
 await page.getByRole('button',{name:'Crear espacio territorial'}).click();
 await page.getByText(/Espacio territorial creado/).waitFor();
 assert.equal(await page.getByLabel(/Municipio de Granada/).locator('option').count(),before-1);
 assert.equal(await page.getByLabel('Plan de salud').locator('option[value="fuente-vaqueros"]').count(),1);
 await page.screenshot({path:'/tmp/compas-admin-panel.png',fullPage:true});
 await page.goto(`${base}/COMPAS_NG/`);
 await page.getByRole('link',{name:'Administración',exact:true}).waitFor();
 assert.equal(await page.getByLabel('Contraseña',{exact:true}).count(),0);
 await page.goto(`${base}/COMPAS_NG/?vista=administracion`);
 await page.getByRole('heading',{name:'COMPAS · Administración general'}).waitFor();
 await page.getByRole('link',{name:'Volver a COMPAS',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: visible administration, direct home entry, scoped account form, partial failure retry without duplicate signup, revocation and credential dismissal.');
}finally{await browser?.close();await server.close();}
