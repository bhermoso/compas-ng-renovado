import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:0}});
await server.listen();
let browser;
try {
 browser=await chromium.launch({executablePath:process.env.COMPAS_TEST_CHROMIUM||'/tmp/compas-chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // No real account or network request to Firebase is needed for this rendering check.
 // Toda entrada ordinaria muestra el acceso (main.tsx); la antigua vista relas-centro se retiró.
 await page.route(/https:\/\/(.*googleapis.com|.*firebaseapp.com)\/.*/,r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/compas-ng-renovado/`);
 await page.getByRole('heading',{name:'COMPAS · Acceso'}).waitFor();
 assert.equal(await page.getByLabel('Correo electrónico').count(),1);
 assert.equal(await page.getByLabel('Contraseña').getAttribute('type'),'password');
 assert.equal(await page.getByRole('button',{name:'Guardar borrador compartido'}).count(),0);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/compas-relas-login.png',fullPage:true});
 console.log('PASS: login renders without exposing a draft or contacting Firebase.');
} finally {await browser?.close();await server.close();}
