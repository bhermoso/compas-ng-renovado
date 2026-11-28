// Contexto de navegador aislado: todos los valores introducidos son de prueba.
// node tests/plan-preparation.smoke.mjs; opcional COMPAS_TEST_CHROMIUM y COMPAS_TEST_SCREENSHOT.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
// La portada exige sesión (main.tsx): se monta la aplicación directamente, con el expediente público de Loja.
const appDirect={name:'app-direct',configureServer(s){s.middlewares.use('/app-direct',async(_q,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/app-direct',`<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`));});}};
const server=await createServer({plugins:[appDirect],server:{host:'127.0.0.1',port:0,strictPort:false}});await server.listen();let browser;
try{
 browser=await chromium.launch({...(process.env.COMPAS_TEST_CHROMIUM ? {executablePath:process.env.COMPAS_TEST_CHROMIUM} : {}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/app-direct`);
 // Plan de Acción con el diseño de Inicio: los apartados se abren desde su encabezado.
 const plan=async()=>{await page.locator('.app-nav__tab').filter({hasText:'Plan de Acción'}).click();await page.locator('details.plan-page__section > summary').first().click();
  // Cada línea y cada objetivo general se pliegan: se despliega la primera línea completa.
  await page.locator('details.pcm-line-fold > summary').first().click();
  await page.locator('.pcm-preparation').first().evaluate(x=>x.querySelectorAll('details.pcm-general').forEach(d=>d.open=true));};
 const result=async()=>{await page.locator('details.plan-page__section > summary').nth(1).click();return page.getByLabel('Plan de Acción resultante · Loja',{exact:true});};
 // Abre Loja: en la primera visita el selector ya está abierto; después se reabre con «Cambiar ámbito».
 const loja=async()=>{await page.waitForTimeout(1500);if(!(await page.locator('.municipality-selector').isVisible()))await page.getByRole('button',{name:/Cambiar ámbito|Elige un ámbito/}).first().click();await page.locator('.municipality-selector__option').filter({hasText:'Loja'}).first().click();await page.waitForFunction(()=>!!localStorage.getItem('compas-ng:workspace:loja'));};
 await loja();await plan();
 const panel=page.locator('.pcm-preparation').first();await panel.locator('.pcm-general').first().waitFor({state:'attached'});
 assert.equal(await panel.locator('.pcm-general').count(),4);
 assert.equal(await panel.locator('select').count(),41);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:loja')));
 // Los rótulos muestran el código visible de la plantilla común (ENV-OE1.1, ENV-I1.1); el expediente guarda el código interno estable (ENV-OE5.1, ENV-I5.1).
 await panel.getByLabel('Estado del Plan ENV-OE1.1',{exact:true}).selectOption('included');
 await panel.getByLabel('Estado del Plan ENV-OE1.2',{exact:true}).selectOption('included');
 const ind=panel.locator('.pcm-specific').first().locator('.pcm-sheet');await ind.locator(':scope > summary').click();
 await panel.getByLabel('Estado del Plan ENV-I1.1',{exact:true}).selectOption('modified');
 await panel.getByLabel('Redacción vigente · ENV-I1.1',{exact:true}).fill('INDICADOR SOLO DE PRUEBA');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:loja')).planPreparationDrafts?.[0]?.decisions['ENV-I5.1']?.text==='INDICADOR SOLO DE PRUEBA');
 const sheet=ind.locator('.indicator-worksheet');await sheet.locator(':scope > summary').click();
 await sheet.locator('.planning-instruments > summary').click();
 await sheet.getByRole('button',{name:'Añadir como opción pendiente a la ficha · CENVE',exact:true}).click();
 assert.match(await sheet.locator('label').filter({has:page.locator('span').filter({hasText:/^Instrumento o registro, versión y procedimiento de recogida$/})}).locator('textarea').inputValue(),/CENVE/);
 await sheet.getByLabel('Persona y entidad responsables de consolidar el indicador',{exact:true}).fill('RESPONSABLE SOLO DE PRUEBA');
 await sheet.getByRole('button',{name:'Crear ficha de actuación',exact:true}).click();
 await sheet.locator('details.indicator-worksheet__action').last().getByLabel('Nombre de la actuación o programa',{exact:true}).fill('ACTUACIÓN SOLO DE PRUEBA');
 await panel.getByLabel('Estado del Plan ENV-OE1.1',{exact:true}).selectOption('excluded');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:loja')).planPreparationDrafts?.[0]?.decisions['ENV-OE5.1']?.status==='excluded');
 assert.ok(await panel.getByText('Fuera del Plan porque un elemento superior está excluido.',{exact:false}).count());
 await page.reload();await loja();await plan();
 assert.equal(await panel.getByLabel('Estado del Plan ENV-OE1.1',{exact:true}).inputValue(),'excluded');
 await panel.getByLabel('Estado del Plan ENV-OE1.1',{exact:true}).selectOption('included');
 await panel.locator('.pcm-specific').first().locator('.pcm-sheet > summary').click();
 assert.equal(await panel.getByLabel('Redacción vigente · ENV-I1.1',{exact:true}).inputValue(),'INDICADOR SOLO DE PRUEBA');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('compas-ng:workspace:loja')));
 assert.match(after.indicatorWorksheets[0].values.instrument,/CENVE/);
 assert.equal(after.indicatorWorksheets[0].actions.at(-1).values.name,'ACTUACIÓN SOLO DE PRUEBA');
 assert.equal(after.indicatorWorksheets[0].values.owner,'RESPONSABLE SOLO DE PRUEBA');
 assert.deepEqual(after.evidenceStore.atoms,before.evidenceStore.atoms);
 assert.deepEqual(after.actionPlanModuleReviews,before.actionPlanModuleReviews);
 const res=await result();
 await res.getByRole('button',{name:'Generar Plan de Acción',exact:true}).click();
 await res.getByText('Plan generado con la selección actual.',{exact:true}).waitFor();
 assert.match(await res.locator('.pcm-generated-plan').innerText(),/ENV-OE1\.1[\s\S]*ENV-I1\.1/);
 assert.match(await res.locator('.pcm-generated-plan').innerText(),/ENV-OE1\.2[\s\S]*ENV-I1\.2/);
 if(process.env.COMPAS_TEST_SCREENSHOT) await page.screenshot({path:process.env.COMPAS_TEST_SCREENSHOT});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: 4 bloques, 41 controles, editar/excluir/recargar/recuperar/generar, ficha y actuación conservadas, evidencia y revisión formal intactas, sin errores JS ni desbordamiento móvil');
}finally{await browser?.close();await server.close();}
