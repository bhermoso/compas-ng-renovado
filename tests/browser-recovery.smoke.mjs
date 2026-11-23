import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const SCOPES=['atarfe','fuente-vaqueros'],PLIZD='docs/source-material/territorial-documentation/PLIZD_FUENTE_VAQUEROS_2024.pdf';
const PLIZD_SHA256=createHash('sha256').update(await readFile(PLIZD)).digest('hex');
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
const dir=await mkdtemp(join(tmpdir(),'compas-backup-test-'));let browser;
try {
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM,headless:true,args:['--no-sandbox']});
 const base='http://127.0.0.1:'+server.httpServer.address().port+'/compas-ng-renovado/';
 const createPage=async()=>{const context=await browser.newContext();const page=await context.newPage();await page.goto(base+'?vista=recuperacion');await page.getByRole('heading',{name:'Conservar y recuperar el trabajo'}).waitFor();return page;};
 const source=await createPage();
 assert.equal(await source.evaluate(()=>localStorage.length),0,'Recovery must not hydrate seeds');
 const seeds=await Promise.all(SCOPES.map(id=>readFile('fixtures/seeds/compas-ng-workspace-'+id+'.json','utf8')));
 await source.evaluate(async({seeds,PLIZD,scopes})=>{
  for(const text of seeds){const w=JSON.parse(text);
   // El PLIZD de Fuente Vaqueros se distribuye con la aplicación: la copia debe incluir el PDF, no solo su referencia.
   for(const d of w.repository.documents)if(d.id==='doc-territorial-fuente-vaqueros-plizd-2024')d.source={...d.source,url:PLIZD};
   localStorage.setItem('compas-ng:workspace:'+w.municipality.identity.id,JSON.stringify(w));}
  const {saveOriginalFile}=await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts');
  for(const id of scopes)await saveOriginalFile(id,'orphan-test',new File(['Prueba de conservación '+id],'prueba.txt',{type:'text/plain',lastModified:12345}));
 },{seeds,PLIZD,scopes:SCOPES});
 const [download]=await Promise.all([source.waitForEvent('download'),source.getByRole('button',{name:'Descargar copia con originales'}).click()]);
 const path=join(dir,'copy.compas.json');await download.saveAs(path);const text=await readFile(path,'utf8');const backup=JSON.parse(text);
 assert.equal(backup.format,'compas-ng-browser-backup');assert.equal(backup.payload.storage.length,2);
 assert.ok(backup.payload.files.some(f=>f.name==='PLIZD_FUENTE_VAQUEROS_2024.pdf' && f.sha256===PLIZD_SHA256));
 assert.ok(backup.payload.notices.some(n=>n.includes('original no conservado')));
 const target=await createPage();
 await target.getByLabel('Seleccionar copia o expediente JSON de COMPÁS').setInputFiles(path);
 await target.getByText('Copia completa comprobada. Revisa su contenido antes de recuperar.').waitFor();
 await target.screenshot({path:'/tmp/compas-backup-review.png',fullPage:true});
 await target.getByRole('button',{name:'Recuperar sin sobrescribir'}).click();
 await target.getByText('Recuperación terminada.',{exact:false}).waitFor();
 const result=await target.evaluate(async()=>({storage:Object.fromEntries(Object.entries(localStorage)),files:(await (await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts')).listOriginalFiles()).map(e=>({municipalityId:e.municipalityId,documentId:e.documentId,name:e.file.name,size:e.file.size}))}));
 for(const entry of backup.payload.storage)assert.equal(result.storage[entry.key],entry.value,'Raw state must be preserved byte for byte');
 assert.equal(result.files.length,backup.payload.files.length);
 assert.deepEqual(await target.evaluate(async text=>{const {restoreBackup}=await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts');return (await restoreBackup(text)).conflicts;},text),[],'Restore is idempotent');
 const corrupt=JSON.parse(text);corrupt.payload.createdAt='alterado';
 assert.match(await target.evaluate(async text=>{try{await (await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts')).restoreBackup(text);return 'UNEXPECTED';}catch(e){return e.message;}},JSON.stringify(corrupt)),/huella|incompleta/);
 const fileCorrupt=JSON.parse(text);fileCorrupt.payload.files[0].base64='YQ==';
 assert.match(await target.evaluate(async b=>{const m=await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts');b.sha256=await m.digest(new TextEncoder().encode(JSON.stringify(b.payload)));try{await m.restoreBackup(JSON.stringify(b));return 'UNEXPECTED';}catch(e){return e.message;}},fileCorrupt),/Original alterado/);
 await target.evaluate(()=>localStorage.setItem('compas-ng:workspace:atarfe','version local que debe conservarse'));
 assert.match(await target.evaluate(async text=>{try{await (await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts')).restoreBackup(text);return 'UNEXPECTED';}catch(e){return e.message;}},text),/versiones diferentes/);
 assert.equal(await target.evaluate(()=>localStorage.getItem('compas-ng:workspace:atarfe')),'version local que debe conservarse');
 const quota=await createPage();
 const quotaResult=await quota.evaluate(async text=>{
  const m=await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts');const original=Storage.prototype.setItem;let n=0;Storage.prototype.setItem=function(...args){if(++n===2)throw new Error('quota-test');return original.apply(this,args);};
  try{await m.restoreBackup(text);return 'UNEXPECTED';}catch(e){return e.message;}finally{Storage.prototype.setItem=original;}
 },text);
 assert.match(quotaResult,/quota-test/);assert.equal(await quota.evaluate(()=>localStorage.length),0,'Storage writes must roll back on quota failure');
 await quota.evaluate(async text=>{await (await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts')).restoreBackup(text);},text);
 assert.equal(await quota.evaluate(()=>localStorage.length),2,'Recovery can be retried after quota failure');
 const malformed=JSON.parse(text);malformed.payload.storage[0].key='unrelated:setting';
 assert.match(await target.evaluate(async b=>{const m=await import('/compas-ng-renovado/src/infrastructure/recovery/browserRecovery.ts');b.sha256=await m.digest(new TextEncoder().encode(JSON.stringify(b.payload)));try{await m.restoreBackup(JSON.stringify(b));return 'UNEXPECTED';}catch(e){return e.message;}},malformed),/clave/);
 console.log('PASS: empty recovery entry, UI export/import, 2 scopes, original PDF hash, unreferenced originals, exact raw state, idempotence, envelope/file corruption, conflicts, foreign keys and quota rollback/retry.');
}finally{await browser?.close();await server.close();await rm(dir,{recursive:true,force:true});}
