import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Synthetic drafts only. The virtual client never connects to Firebase.
const remoteMock = `
let row;
export async function readRelasDraft(){
 if (!row) row={version:7,payload:{municipalityId:'zagra',moduleId:'env-2027-2030',version:new URLSearchParams(location.search).get('unknown')?'unknown':'3.1',updatedAt:'2026-10-01',decisions:{'ENV-OG1':{status:'excluded',sourceText:'Autonomía'},'ENV-OE1.1':{status:'modified',sourceText:'Fuente',text:'Adaptación municipal conservada'},'ENV-OE5.1':{status:'included',sourceText:'Edadismo'}}}};
 return structuredClone(row);
}
export async function readRelasReview(){return null;}
export async function saveRelasDraft(_client,payload,version){
 if(version!==row.version) throw new Error('conflict');
 row={version:version+1,payload:structuredClone(payload)};
 window.savedDraft=structuredClone(row);return structuredClone(row);
}
export async function saveRelasReview(){throw new Error('Unexpected review write');}
`;
const script = `
import React from 'react';import {createRoot} from 'react-dom/client';
import TerritorialWorkspace from '/src/ui/components/TerritorialWorkspace.tsx';
import {PlanDocumentActions} from '/src/ui/components/PlanDocumentActions.tsx';
import {ZAGRA_AGING_PROPOSAL as module} from '/src/domain/action-plan-catalog/MunicipalActionPlanModule.ts';
import {buildDefinitiveActionPlanProjection} from '/src/domain/action-plan-catalog/DefinitiveActionPlanProjection.ts';
import {buildPlanDocument} from '/src/domain/action-plan-catalog/PlanDocument.ts';
const params=new URLSearchParams(location.search);
const draft={municipalityId:'zagra',moduleId:module.id,version:module.version,updatedAt:'2026-10-30',decisions:{'ENV-OE5.1':{status:'included',sourceText:'Edadismo'}}};
const active=buildDefinitiveActionPlanProjection('zagra',[module],[draft]);
const saved={...buildPlanDocument('zagra',active,'2026-10-01'),status:'validated',validatedBy:'Equipo de prueba',paragraphs:[{text:'Plan anterior inmutable'}]};
const root=createRoot(document.getElementById('root'));
root.render(params.has('downloads')?React.createElement(PlanDocumentActions,{municipalityId:'zagra',active,versions:[saved]}):React.createElement(TerritorialWorkspace,{client:{},scope:'zagra',role:params.get('role')||'coordinator',onBack:()=>{}}));
`;
const server=await createServer({server:{port:0,strictPort:false},plugins:[{
 name:'plan-compatibility-fixture',enforce:'pre',
 resolveId(source,importer){if(importer?.split('?')[0].endsWith('/TerritorialWorkspace.tsx')&&source.includes('/RelasClient'))return '\0fake-territorial-client';},
 load(id){if(id==='\0fake-territorial-client')return remoteMock;},
 configureServer(s){s.middlewares.use('/plan-compatibility-fixture',async(_req,res)=>{
  res.setHeader('Content-Type','text/html');
  res.end(await s.transformIndexHtml('/plan-compatibility-fixture',`<html><body><div id="root"></div><script type="module">${script}</script></body></html>`));
 });},
}]});
let browser,page;
try{
 await server.listen();
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
 page=await browser.newPage({acceptDownloads:true});
 page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const url=`http://localhost:${server.httpServer.address().port}/plan-compatibility-fixture`;
 await page.goto(url);
 const save=page.getByRole('button',{name:'Guardar propuesta territorial'}).first();
 await save.waitFor();await page.getByText('Borrador reagrupado con el original archivado.',{exact:false}).waitFor();
 assert.equal(await save.isEnabled(),true);
 await save.click();await page.getByText('Propuesta territorial guardada. Pendiente de revisión administrativa.',{exact:true}).waitFor();
 const archived=await page.evaluate(()=>window.savedDraft);
 assert.equal(archived.version,8);assert.equal(archived.payload.migration.draft.version,'3.1');
 assert.equal(archived.payload.decisions['ENV-OE1.1'].excludedDecision.text,'Adaptación municipal conservada');
 await page.getByRole('button',{name:'Recuperar versión del servidor'}).first().click();
 await page.getByText('Borrador recuperado.',{exact:true}).waitFor();assert.equal(await save.isEnabled(),false);
 for(const role of ['reader','administrator']){
  await page.goto(url+'?role='+role);
  await page.getByText('Borrador reagrupado con el original archivado.',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>window.savedDraft),undefined);
  assert.equal(await page.getByRole('button',{name:'Guardar propuesta territorial'}).count(),0);
  if(role==='administrator')assert.equal(await page.getByRole('button',{name:'Consolidar cambios administrativos'}).first().isEnabled(),false);
 }
 await page.goto(url+'?unknown=1');
 await page.getByText('La versión del borrador requiere revisión de compatibilidad. Se conserva sin modificar.',{exact:true}).waitFor();
 assert.equal(await page.locator('select').count(),0);assert.equal(await page.evaluate(()=>window.savedDraft),undefined);
 await page.goto(url+'?downloads=1');
 for(const [label,status] of [['borrador actual','draft'],['última versión validada','validated']]){
  for(const format of ['PDF','Word']){
   const pending=page.waitForEvent('download');
   await page.getByRole('button',{name:'Descargar '+label+' · '+format,exact:true}).click();
   const download=await pending;
   assert.match(download.suggestedFilename(),new RegExp('-'+status+'-.*\\.'+(format==='PDF'?'pdf':'docx')+'$'));
   if(status==='validated')assert.ok(download.suggestedFilename().includes('2026-10-01'));
   assert.equal(await download.failure(),null);
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: migration, save/reload, reader/admin permissions, unknown version, and four real downloads.');
}catch(error){console.error(await page?.locator('body').innerText());throw error;}finally{await browser?.close();await server.close();}
