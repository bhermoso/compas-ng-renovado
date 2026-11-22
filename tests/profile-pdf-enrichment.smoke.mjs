import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const PDF='docs/source-material/territorial-documentation/PLIZD_FUENTE_VAQUEROS_2024.pdf',ID='fuente-vaqueros';
const PDF_SHA256=createHash('sha256').update(await readFile(PDF)).digest('hex');
// Las subidas usan PDF generados aquí: COMPÁS rechaza, con razón, volver a incorporar un archivo que ya está en el expediente.
const {jsPDF}=await import('jspdf');
async function testPdf(name,label){
 const pdf=new jsPDF();const line=`${label}: texto de ensayo para comprobar la extracción de un PDF. No describe ningún territorio real.`;
 for(let page=0;page<6;page++){if(page)pdf.addPage();for(let row=0;row<30;row++)pdf.text(`${page+1}.${row+1} ${line}`.slice(0,95),10,10+row*9);}
 const file=join(tmpdir(),name);await writeFile(file,Buffer.from(pdf.output('arraybuffer')));return file;
}
const SUPPLEMENTARY_PDF=await testPdf('compas-documento-complementario-prueba.pdf','Documento complementario');
const REPLACEMENT_PDF=await testPdf('compas-informe-sustituto-prueba.pdf','Informe sustituto');
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try {
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text());});const base='http://127.0.0.1:'+server.httpServer.address().port+server.config.base;
 await page.goto(base+'?vista=recuperacion');
 // Expediente de prueba en un almacenamiento aislado: el seed público de Fuente Vaqueros con un Informe de
 // Salud en PDF incorporado y sin texto. Como PDF se usa el PLIZD de Fuente Vaqueros 2024, el único PDF
 // territorial del repositorio: aquí solo sirve para probar la extracción; no es su Informe de Salud.
 const baseline=await page.evaluate(async({base,pdf,id})=>{
  const seed=await (await fetch(base+'seeds/compas-ng-workspace-'+id+'.json')).json();
  const now='2026-11-21T00:00:00.000Z',docId='doc-prueba-informe-pdf';
  seed.repository.documents.push({id:docId,municipalityId:id,kind:'health-report',title:'PDF de prueba para la extracción del Informe de Salud',status:'validated',
   source:{system:'Prueba automática',url:pdf},sourceFileName:'PLIZD_FUENTE_VAQUEROS_2024.pdf',tags:['health-report','prueba'],createdAt:now,updatedAt:now});
  seed.healthReport={id:'prueba-informe-pdf',municipalityId:id,linkedDocumentId:docId,sourceFileName:'PLIZD_FUENTE_VAQUEROS_2024.pdf',title:'PDF de prueba',authors:[],
   body:{originalText:'',format:'plain',charCount:0,isAuthoritative:true},sections:[],createdAt:now,updatedAt:now};
  const {createMunicipalityRuntime}=await import(base+'src/application/runtime/MunicipalityRuntime.ts');
  seed.validatedPSL={...createMunicipalityRuntime({workspace:seed}).psl,status:'validated'};
  localStorage.setItem('compas-ng:workspace:'+id,JSON.stringify(seed));
  localStorage.setItem('compas-ng:active-municipality',id);
  return {atoms:seed.evidenceStore.atoms.length,validated:JSON.stringify(seed.validatedPSL),doc:seed.healthReport.linkedDocumentId};
 },{base,pdf:PDF,id:ID});
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
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('compas-ng:workspace:'+id)).healthReport.pdfExtraction?.pageCount>0,ID,{timeout:120000});
 const result=await page.evaluate(async({base,id})=>{
  const w=JSON.parse(localStorage.getItem('compas-ng:workspace:'+id));
  const {buildHealthReportSanitaryReading}=await import(base+'src/application/health-profile/healthReportSanitaryReading.ts');
  const reading=buildHealthReportSanitaryReading(w.healthReport);
  return {chars:w.healthReport.body.charCount,hash:w.healthReport.pdfExtraction.sha256,text:w.healthReport.body.originalText.slice(0,250),atoms:w.evidenceStore.atoms.length,validated:JSON.stringify(w.validatedPSL),doc:w.healthReport.linkedDocumentId,present:reading.present,signals:reading.senales.length,sections:w.healthReport.sections.length,pages:w.healthReport.pdfExtraction.pageCount};
 },{base,id:ID});
 assert.ok(result.chars>10000);assert.equal(result.hash,PDF_SHA256);
 assert.equal(result.atoms,baseline.atoms);assert.equal(result.validated,baseline.validated);assert.equal(result.doc,baseline.doc);assert.ok(result.present);assert.ok(result.signals>0);
 // El Perfil validado queda pendiente de revisión porque cambió su fuente: lo decide el runtime (pslIsStale).
 assert.equal(await page.evaluate(async({base,id})=>{const {createMunicipalityRuntime}=await import(base+'src/application/runtime/MunicipalityRuntime.ts');return createMunicipalityRuntime({workspace:JSON.parse(localStorage.getItem('compas-ng:workspace:'+id))}).pslIsStale;},{base,id:ID}),true);
 // Las cargas viven en Diagnóstico territorial › «Carga manual por tipo» (el panel de fuentes del Perfil se retiró).
 await page.locator('.app-nav__tab').filter({hasText:'Diagnóstico'}).first().click();
 const panel=page.locator('#diag-mod-manual');
 // Se abre la sección y los apartados que la contienen (el diseño de Inicio los pliega).
 await panel.waitFor({state:'attached'});
 await panel.evaluate(el=>{for(let e=el;e;e=e.parentElement?.closest('details'))e.open=true;});
 await panel.getByLabel('Tipo de documento').first().waitFor();
 await panel.getByLabel('Tipo de documento').first().selectOption('territorial-documentation');
 await panel.getByLabel('Subir documento (.docx o .pdf)').waitFor({state:'attached'});
 assert.equal(await panel.getByLabel('Subir documento (.docx o .pdf)').count(),1);
 await panel.screenshot({path:join(tmpdir(),'compas-enrichment.png')});
 // Supplementary PDF upload actually extracts text instead of registering a reference only.
 await panel.getByLabel('Subir documento (.docx o .pdf)').setInputFiles(SUPPLEMENTARY_PDF);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:fuente-vaqueros')).repository.documents.some(d=>d.source?.system==='Texto extraído de PDF, con marcas de página'),{},{timeout:120000});
 const supplementary=await page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('compas-ng:workspace:fuente-vaqueros'));const d=w.repository.documents.find(d=>d.source?.system==='Texto extraído de PDF, con marcas de página');return {chars:d.sourceText?.length,kind:d.kind,primary:w.healthReport.linkedDocumentId};});
 assert.ok(supplementary.chars>5000);assert.equal(supplementary.kind,'territorial-documentation');assert.equal(supplementary.primary,baseline.doc);
 await panel.getByLabel('Tipo de documento').first().selectOption('health-report');
 await panel.getByLabel('Cargar Informe de Salud (.docx / .doc / .pdf)').setInputFiles(REPLACEMENT_PDF);
 await page.waitForFunction(old=>JSON.parse(localStorage.getItem('compas-ng:workspace:fuente-vaqueros')).healthReport.linkedDocumentId!==old,baseline.doc,{timeout:120000});
 const replacement=await page.evaluate(old=>{const w=JSON.parse(localStorage.getItem('compas-ng:workspace:fuente-vaqueros'));return {archived:w.repository.documents.find(d=>d.id===old)?.status,previous:w.previousHealthReports.some(r=>r.linkedDocumentId===old),chars:w.healthReport.body.charCount};},baseline.doc);
 assert.equal(replacement.archived,'archived');assert.equal(replacement.previous,true);assert.ok(replacement.chars>5000);
 console.log('PASS: original PDF auto-processed in the actual app; pages and hash verified; no new primary-source atoms or rewritten validation; sanitary reading receives text; diagnosis uploader processes supplementary PDF without replacing main report.',JSON.stringify({chars:result.chars,hash:result.hash,signals:result.signals,sections:result.sections,pages:result.pages}));
} finally {await browser?.close();await server.close();}
