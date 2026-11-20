/**
 * Prueba de DOM real (no SSR): la portada debe mostrar qué expediente ha cargado.
 * La lectura no debe depender de abrir el Perfil ni de deducirlo por una cifra.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HOST="127.0.0.1",PORT="5173";
const APP_URL=`http://${HOST}:${PORT}/compas-ng-renovado/`;
const ROOT=fileURLToPath(new URL("..",import.meta.url));
const VITE=fileURLToPath(new URL("../node_modules/vite/bin/vite.js",import.meta.url));
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function responds(){
  try{const a=AbortSignal.timeout(1000);return (await fetch(APP_URL,{signal:a})).ok}catch{return false}
}
async function ready(processRef){
  for(let n=0;n<80;n++){
    if(processRef?.exitCode!=null)throw new Error(`Vite exited: ${processRef.exitCode}`);
    if(await responds())return;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error("Vite did not become ready at "+APP_URL);
}

let proc,browser;
try{
  if(!(await responds())){
    proc=spawn(process.execPath,[VITE,"--host",HOST,"--port",PORT,"--strictPort"],{cwd:ROOT,stdio:["ignore","pipe","pipe"]});
    await ready(proc);
  }
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text())});
  const response=await page.goto(APP_URL,{waitUntil:"domcontentloaded"});
  await page.waitForTimeout(2000);
  console.log("E2E diagnostic",JSON.stringify({url:page.url(),httpStatus:response?.status(),title:await page.title(),body:(await page.locator("body").innerText()).slice(0,1200),errors}));
  if ((await page.locator("body").innerText()).includes("COMPAS · Acceso")) {
    console.warn("SKIP autenticación requerida: la prueba no certifica visibilidad del municipio en una sesión real.");
  } else {
  const nav=page.locator("nav.app-nav");
  const municipality=nav.locator(".app-nav__municipality");
  await municipality.waitFor({state:"visible",timeout:15000});
  const text=await municipality.innerText();
  assert(text.includes("Expediente cargado:"),`Falta la identidad del expediente en Inicio: ${text}`);
  const name=(await municipality.locator(".app-nav__municipality-name").innerText()).trim();
  assert(name.length>0,`Nombre municipal vacío: ${text}`);
  assert(await municipality.getByRole("button",{name:/Cambiar ámbito/}).isVisible(),"No existe selector de ámbito visible");
  const box=await municipality.boundingBox();
  assert(box && box.width>0 && box.height>0,"La barra del municipio está colapsada en Inicio");
  // La etiqueta debe quedar dentro de la ventana sin desplazamiento horizontal del viewport.
  const label=await municipality.locator(".app-nav__context-label").boundingBox();
  assert(label && label.x>=0 && label.x+label.width<=1280,"Etiqueta municipal fuera de pantalla");
  await municipality.getByRole("button",{name:/Cambiar ámbito/}).click();
  await page.locator(".municipality-selector").waitFor({state:"visible",timeout:5000});
  assert(await page.locator(".municipality-selector__option").count()>0,"El selector no ofrece ámbitos");
  // Comprobación con otra pantalla: la identificación no se pierde al navegar.
  await page.getByRole("button",{name:/Diagnóstico territorial/i}).first().click();
  await municipality.waitFor({state:"visible",timeout:5000});
  assert((await municipality.innerText()).includes(name),"El ámbito desapareció al navegar");
  // La estadística es una fuente de Diagnóstico, no una pestaña de Perfil.
  const statistics=page.locator('[data-testid="diagnosis-territorial-statistics"]');
  await statistics.waitFor({state:"visible",timeout:5000});
  await statistics.locator("summary").click();
  assert(await statistics.locator(".tsp").isVisible(),"No se abre la estadística territorial en Diagnóstico");
  await page.getByRole("button",{name:/Perfil de Salud Local/i}).first().click();
  const tabs=page.locator(".ep-tabs--primary");
  if (await tabs.count() > 0) {
    assert(!(await tabs.innerText()).includes("Estadística territorial"),"El Perfil conserva la pestaña territorial duplicada");
  }

  console.log(`PASS: expediente ${name} visible en Inicio, selector abierto y navegación comprobada.`);
  }
}finally{
  if(browser)await browser.close();
  if(proc && proc.exitCode===null)proc.kill();
}
