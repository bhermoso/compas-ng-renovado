// E2E contra el editor REAL con transporte RELAS simulado: nunca accede a Firebase.
// Verifica la transición 3.1→4 bloques, dos líneas, guardado separado y roles.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";

const remoteMock = `
const rows = new Map();
const copy = value => structuredClone(value);
export async function readRelasDraft(_client,scope,id) {
 const key=scope+"/"+id;
 if (!rows.has(key) && id==="env-2027-2030" && scope==="loja") {
  rows.set(key,{version:7,payload:{
   municipalityId:"loja",moduleId:id,
   version: new URLSearchParams(location.search).has("unknown") ? "version-desconocida" : "3.1",
   updatedAt:"2026-10-05",decisions:{
    "ENV-OG1":{status:"excluded",sourceText:"Autonomía antigua"},
    "ENV-OE1.1":{status:"modified",sourceText:"Texto original",text:"Redacción individual de Loja"},
    "ENV-I1.1":{status:"modified",sourceText:"Indicador original",text:"Indicador individual de Loja"},
    "ENV-OE5.1":{status:"included",sourceText:"Edadismo"}
   }
  }});
 }
 return rows.has(key) ? copy(rows.get(key)) : null;
}
export async function readRelasReview(){return null;}
export async function saveRelasDraft(_client,draft,expectedVersion) {
 const key=draft.municipalityId+"/"+draft.moduleId,prev=rows.get(key);
 if ((prev?.version ?? null)!==expectedVersion) throw new Error("Conflicto de versiones");
 const row={version:(prev?.version??0)+1,payload:copy(draft)};
 rows.set(key,row);
 (window.mockSaved??={})[draft.moduleId]=copy(row);
 return copy(row);
}
export async function saveRelasReview(){throw new Error("No se esperaba una consolidación administrativa");}
`;
const app = `
import React from "react";
import {createRoot} from "react-dom/client";
import TerritorialWorkspace from "/src/ui/components/TerritorialWorkspace.tsx";
const p=new URLSearchParams(location.search);
createRoot(document.getElementById("root")).render(React.createElement(
 TerritorialWorkspace,{scope:p.get("scope")||"loja",role:p.get("role")||"coordinator",client:{},onBack:()=>{}}
));
`;
const server=await createServer({
 server:{host:"127.0.0.1",port:0},
 plugins:[{
  name:"common-plan-e2e-fixture",enforce:"pre",
  resolveId(source,importer){
   if(importer?.split("?")[0].endsWith("/TerritorialWorkspace.tsx") &&
     source.includes("/RelasClient")) return "\0fake-plan-relas";
  },
  load(id){if(id==="\0fake-plan-relas")return remoteMock;},
  configureServer(s){s.middlewares.use("/common-plan-fixture",async(_req,res)=>{
   res.setHeader("Content-Type","text/html");
   res.end(await s.transformIndexHtml("/common-plan-fixture",
     `<html><body><div id="root"></div><script type="module">${app}</script></body></html>`));
  });}
 }]
});
let browser,page;
try{
 await server.listen();
 const origin=`http://127.0.0.1:${server.httpServer.address().port}/common-plan-fixture`;
 browser=await chromium.launch({headless:true,...(process.env.COMPAS_TEST_CHROMIUM
  ? {executablePath:process.env.COMPAS_TEST_CHROMIUM}:{}),args:["--no-sandbox"]});
 page=await browser.newPage({viewport:{width:1400,height:900},acceptDownloads:true});
 page.setDefaultTimeout(12000);
 const errors=[];page.on("pageerror",error=>errors.push(error.message));

 await page.goto(origin+"?scope=loja");
 const aging=page.locator(".pcm-line-fold > summary");
 await page.getByText("Borrador reagrupado con el original archivado.",{exact:false}).waitFor();
 assert.equal(await page.getByRole("button",{name:"Guardar propuesta territorial"}).first().isEnabled(),true);
 assert.equal(await page.getByRole("button",{name:"Envejecimiento saludable"}).count(),1);
 assert.equal(await page.getByRole("button",{name:"Prevención y abordaje de las adicciones"}).count(),1);
 await aging.click();
 assert.deepEqual(
  (await page.locator(".pcm-general > summary").allTextContents()).map(x=>x.trim()),
  ["Edadismo","Soledad no deseada","Autonomía","Participación"]);
 await page.getByRole("button",{name:"Guardar propuesta territorial"}).first().click();
 await page.getByText("Propuesta territorial guardada. Pendiente de revisión administrativa.",{exact:true}).waitFor();
 const afterMigration=await page.evaluate(()=>window.mockSaved?.["env-2027-2030"]);
 assert.equal(afterMigration?.version,8);
 assert.equal(afterMigration.payload.version,"comun-cuatro-bloques-2026-11-04");
 assert.equal(afterMigration.payload.migration.draft.version,"3.1");
 assert.equal(afterMigration.payload.decisions["ENV-OE1.1"].text,"Redacción individual de Loja");
 assert.equal(afterMigration.payload.decisions["ENV-I1.1"].text,"Indicador individual de Loja");
 assert.equal(afterMigration.payload.decisions["COMUN-ENV-OG1"].status,"pending");
 await page.getByRole("button",{name:"Recuperar versión del servidor"}).first().click();
 await page.getByText("Borrador recuperado.",{exact:true}).waitFor();
 assert.equal(await page.getByRole("button",{name:"Guardar propuesta territorial"}).first().isEnabled(),false);

 await page.getByRole("button",{name:"Prevención y abordaje de las adicciones"}).click();
 await page.getByText("No hay propuesta territorial guardada.",{exact:true}).waitFor();
 assert.match(await page.locator(".pcm-line-fold > summary").innerText(),/6 objetivos generales/);
 await page.locator(".pcm-line-fold > summary").click();
 await page.locator(".pcm-general > summary").first().click();
 await page.getByLabel("Estado del Plan ADI-OE1.1",{exact:true}).selectOption("modified");
 await page.getByLabel("Redacción vigente · ADI-OE1.1",{exact:true}).fill("Redacción solo de prueba para adicciones en Loja");
 await page.getByRole("button",{name:"Guardar propuesta territorial"}).first().click();
 await page.getByText("Propuesta territorial guardada. Pendiente de revisión administrativa.",{exact:true}).waitFor();
 const afterAddictions=await page.evaluate(()=>window.mockSaved?.["adi-2027-2030"]);
 assert.equal(afterAddictions.payload.version,"3.1");
 assert.equal(afterAddictions.payload.municipalityId,"loja");
 assert.equal(afterAddictions.payload.decisions["ADI-OE1.1"].text,
   "Redacción solo de prueba para adicciones en Loja");

 await page.getByRole("button",{name:"Envejecimiento saludable"}).click();
 await page.getByText("Borrador recuperado.",{exact:true}).waitFor();
 await page.locator(".pcm-line-fold > summary").click();
 assert.deepEqual(
  (await page.locator(".pcm-general > summary").allTextContents()).map(x=>x.trim()),
  ["Edadismo","Soledad no deseada","Autonomía","Participación"]);
 assert.equal(await page.getByRole("button",{name:"Guardar propuesta territorial"}).first().isEnabled(),false);
 assert.equal(await page.evaluate(()=>window.mockSaved?.["env-2027-2030"]?.payload?.migration?.draft?.version),"3.1");

 // Los roles de lectura y administración no escriben automáticamente el borrador migrado.
 for(const role of ["reader","administrator"]){
  await page.goto(origin+"?scope=loja&role="+role);
  await page.getByText("Borrador reagrupado con el original archivado.",{exact:false}).waitFor();
  assert.equal(await page.getByRole("button",{name:"Guardar propuesta territorial"}).count(),0);
  assert.equal(await page.getByRole("button",{name:"Envejecimiento saludable"}).count(),1);
  assert.equal(await page.getByRole("button",{name:"Prevención y abordaje de las adicciones"}).count(),1);
  if(role==="administrator"){
   assert.equal(await page.getByRole("button",{name:"Consolidar cambios administrativos"}).first().isEnabled(),false);
  }
  assert.equal(await page.evaluate(()=>window.mockSaved),undefined);
 }
 await page.goto(origin+"?scope=loja&unknown=1");
 await page.getByText(/La versión del borrador requiere revisión de compatibilidad/).waitFor();
 assert.equal(await page.locator(".pcm-preparation").count(),0);
 assert.equal(await page.evaluate(()=>window.mockSaved),undefined);

 // Nuevo ámbito, sin ningún dato: ambas líneas disponibles y ninguna aprobación o dato prestado.
 await page.goto(origin+"?scope=municipio-nuevo");
 await page.getByText("No hay propuesta territorial guardada.",{exact:true}).waitFor();
 await page.locator(".pcm-line-fold > summary").click();
 assert.equal(await page.locator(".pcm-general").count(),4);
 assert.equal(await page.evaluate(()=>window.mockSaved),undefined);
 assert.deepEqual(errors,[]);
 console.log("PASS: Loja 3.1→4 bloques y archivo íntegro, recuperación, adicciones independientes, roles, versión incompatible y nuevo expediente.");
}catch(err){
 console.error("E2E fallo:",err);
 console.error((await page?.locator("body").innerText())?.slice(0,6000));
 throw err;
}finally{await browser?.close();await server.close();}
