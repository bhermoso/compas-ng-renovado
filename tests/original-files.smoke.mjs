import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try{
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 const origin='http://127.0.0.1:'+server.httpServer.address().port;
 await page.goto(origin+'/compas-ng-renovado/');
 await page.evaluate(async()=>{
  const {saveOriginalFile}=await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts');
  await saveOriginalFile('test-a','document-1',new File(['original intacto'],'original.txt',{type:'text/plain'}));
 });
 await page.reload();
 const result=await page.evaluate(async()=>{
  const {loadOriginalFile}=await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts');
  const file=await loadOriginalFile('test-a','document-1');
  return {name:file.name,text:await file.text(),other:await loadOriginalFile('test-b','document-1')};
 });
 assert.equal(result.name,'original.txt');assert.equal(result.text,'original intacto');assert.equal(result.other,undefined);
 await page.evaluate(async()=>{
  const React=await import('/compas-ng-renovado/node_modules/.vite/deps/react.js');
  const client=await import('/compas-ng-renovado/node_modules/.vite/deps/react-dom_client.js');
  const {DocumentAccess}=await import('/compas-ng-renovado/src/ui/components/DocumentAccess.tsx');
  const container=document.createElement('div');container.id='access-test';document.body.append(container);
  client.default.createRoot(container).render(React.default.createElement(DocumentAccess,{document:{id:'document-1',municipalityId:'test-a',title:'Prueba',source:{},tags:[]}}));
 });
 const panel=page.locator('#access-test');
 await panel.getByRole('button',{name:'Descargar original · original.txt'}).waitFor();
 const [download]=await Promise.all([page.waitForEvent('download'),panel.getByRole('button',{name:'Descargar original · original.txt'}).click()]);
 const stream=await download.createReadStream();const chunks=[];for await(const c of stream)chunks.push(c);
 assert.equal(Buffer.concat(chunks).toString(),'original intacto');
 page.once('dialog',d=>d.accept());
 await panel.getByLabel('Adjuntar original: Prueba').setInputFiles({name:'sustituto.txt',mimeType:'text/plain',buffer:Buffer.from('segunda versión')});
 await panel.getByRole('button',{name:'Descargar original · sustituto.txt'}).waitFor();
 console.log('PASS: conservación tras recarga, separación por ámbito, descarga íntegra y sustitución del original');
}finally{await browser?.close();await server.close();}
