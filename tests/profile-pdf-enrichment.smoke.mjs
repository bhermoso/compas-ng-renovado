import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try {
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text());});const base='http://127.0.0.1:'+server.httpServer.address().port+server.config.base;
 await page.goto(base+'?vista=recuperacion');
 const baseline=await page.evaluate(async(base)=>{
  const seed=await (await fetch(base+'seeds/compas-ng-workspace-granada-zaidin.json')).json();
  const {createMunicipalityRuntime}=await import(base+'src/application/runtime/MunicipalityRuntime.ts');
  seed.validatedPSL={...createMunicipalityRuntime({workspace:seed}).psl,status:'validated'};
  localStorage.setItem('compas-ng:workspace:granada-zaidin',JSON.stringify(seed));
  return {atoms:seed.evidenceStore.atoms.length,validated:JSON.stringify(seed.validatedPSL),doc:seed.healthReport.linkedDocumentId};
 },base);
 // Mount the local App in this isolated test context. Production entry requires
 // authentication; this smoke neither simulates a login nor accesses Firebase.
 await page.evaluate(async(base)=>{
  const {default:React}=await import(base+'node_modules/.vite/deps/react.js');
  const {default:ReactDOM}=await import(base+'node_modules/.vite/deps/react-dom_client.js');
  const {default:App}=await import(base+'src/App.tsx');
  document.getElementById('root').style.display='none';
  const mount=document.createElement('main');document.body.append(mount);
  ReactDOM.createRoot(mount).render(React.createElement(App));
 },base);
 await page.getByRole('button',{name:/Perfil de Salud Local$/}).first().click();
 await page.getByRole('button',{name:'Cambiar ámbito ▾'}).click();
 await page.getByRole('button',{name:/^Granada-Zaidín/}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin')).healthReport.pdfExtraction?.pageCount===130,{},{timeout:90000});
 const result=await page.evaluate(async(base)=>{
  const w=JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin'));
  const {buildHealthReportSanitaryReading}=await import(base+'src/application/health-profile/healthReportSanitaryReading.ts');
  const reading=buildHealthReportSanitaryReading(w.healthReport);
  return {chars:w.healthReport.body.charCount,hash:w.healthReport.pdfExtraction.sha256,text:w.healthReport.body.originalText.slice(0,250),atoms:w.evidenceStore.atoms.length,validated:JSON.stringify(w.validatedPSL),doc:w.healthReport.linkedDocumentId,present:reading.present,signals:reading.senales.length,sections:w.healthReport.sections.length};
 },base);
 assert.ok(result.chars>10000);assert.equal(result.hash,'c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1');
 assert.equal(result.atoms,baseline.atoms);assert.equal(result.validated,baseline.validated);assert.equal(result.doc,baseline.doc);assert.ok(result.present);assert.ok(result.signals>0);
 assert.ok(await page.getByText('Perfil pendiente de revisión.',{exact:true}).count()>0);
 const panel=page.locator('#psl-enriquecimiento-fuentes');await panel.scrollIntoViewIfNeeded();
 await panel.getByRole('combobox').first().selectOption('territorial-documentation');
 await panel.getByLabel('Subir documento (.docx o .pdf)').waitFor({state:'attached'});
 assert.equal(await panel.getByLabel('Subir documento (.docx o .pdf)').count(),1);
 assert.equal(await panel.getByRole('button',{name:'Procesar el PDF ya incorporado'}).count(),1);
 await panel.screenshot({path:join(tmpdir(),'compas-enrichment.png')});
 // Supplementary PDF upload actually extracts text instead of registering a reference only.
 await panel.getByLabel('Subir documento (.docx o .pdf)').setInputFiles('docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin')).repository.documents.some(d=>d.source?.system==='Texto extraído de PDF, con marcas de página'),{},{timeout:90000});
 const supplementary=await page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin'));const d=w.repository.documents.find(d=>d.source?.system==='Texto extraído de PDF, con marcas de página');return {chars:d.sourceText?.length,kind:d.kind,primary:w.healthReport.linkedDocumentId};});
 assert.ok(supplementary.chars>10000);assert.equal(supplementary.kind,'territorial-documentation');assert.equal(supplementary.primary,baseline.doc);
 await panel.getByRole('combobox').first().selectOption('health-report');
 await panel.getByLabel('Cargar Informe de Salud (.docx / .doc / .pdf)').setInputFiles('docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf');
 await page.waitForFunction(old=>JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin')).healthReport.linkedDocumentId!==old,baseline.doc,{timeout:90000});
 const replacement=await page.evaluate(old=>{const w=JSON.parse(localStorage.getItem('compas-ng:workspace:granada-zaidin'));return {archived:w.repository.documents.find(d=>d.id===old)?.status,previous:w.previousHealthReports.some(r=>r.linkedDocumentId===old),chars:w.healthReport.body.charCount};},baseline.doc);
 assert.equal(replacement.archived,'archived');assert.equal(replacement.previous,true);assert.ok(replacement.chars>10000);
 console.log('PASS: original PDF auto-processed in the actual app; 130 pages, hash verified; no new primary-source atoms or rewritten validation; sanitary reading receives text; enrichment uploader processes supplementary PDF without replacing main report.',JSON.stringify({chars:result.chars,hash:result.hash,signals:result.signals,sections:result.sections}));
} finally {await browser?.close();await server.close();}
