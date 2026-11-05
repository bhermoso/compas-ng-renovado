// Real PlanDocumentActions UI under an isolated simulated confirmed remote write.
// No production Firebase data or credentials are touched.
import assert from "node:assert/strict";
import {createServer} from "vite";
import {chromium} from "playwright";

const script=`
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {PlanDocumentActions} from "/src/ui/components/PlanDocumentActions.tsx";
const initial=[
 {schemaVersion:1,municipalityId:"loja",status:"validated",generatedAt:"2026-09-01T12:00:00Z",validatedBy:"Equipo técnico",paragraphs:[{text:"V1"}]},
 {schemaVersion:1,municipalityId:"loja",status:"validated",generatedAt:"2026-10-01T12:00:00Z",validatedBy:"Equipo técnico",paragraphs:[{text:"V2"}]},
 {schemaVersion:1,municipalityId:"zagra",status:"validated",generatedAt:"2026-08-01T12:00:00Z",validatedBy:"Equipo técnico",paragraphs:[{text:"Otro territorio"}]}
];
window.failDelete=true; window.remoteDeletes=0;window.remoteVersions=structuredClone(initial);
const params=new URLSearchParams(location.search);
function Test(){
 const [versions,setVersions]=useState(initial);
 return React.createElement(PlanDocumentActions,{
  municipalityId:"loja",active:[],versions,
  ...(params.has("reader") ? {} : {onDeleteVersion: async version=>{
   window.remoteDeletes++;
   if(window.failDelete)throw new Error("Fallo simulado de Firebase");
   const updated=versions.filter(item=>item!==version);
   await Promise.resolve();
   window.remoteVersions=structuredClone(updated);
   setVersions(updated);
   return true;
  }})
 });
}
createRoot(document.getElementById("root")).render(React.createElement(Test));
`;
const server=await createServer({server:{host:"127.0.0.1",port:0},plugins:[{
 name:"validated-plan-versions-fixture",
 configureServer(s){s.middlewares.use("/plan-version-fixture",async(_req,res)=>{
  res.setHeader("Content-Type","text/html");
  res.end(await s.transformIndexHtml("/plan-version-fixture",
  `<html><body><div id="root"></div><script type="module">${script}</script></body></html>`));
 });}
}]});
let browser,page;
try{
 await server.listen();
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 page=await browser.newPage();
 page.setDefaultTimeout(10000);
 await page.addInitScript(()=>{window.confirm=()=>true});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.httpServer.address().port}/plan-version-fixture`;
 await page.goto(url);
 await page.getByText("Gestionar versiones validadas (2)",{exact:true}).click();
 assert.equal(await page.getByRole("button",{name:/Eliminar versión validada de/}).count(),1);
 assert.match(await page.locator(".plan-document-versions").innerText(),/Protegida: versión más reciente/);
 assert.equal(await page.getByRole("button",{name:/Descargar PDF de versión/}).count(),2);
 assert.equal(await page.getByRole("button",{name:/Descargar Word de versión/}).count(),2);

 // Failure must keep old version visible and not falsely confirm deletion.
 await page.getByRole("button",{name:/Eliminar versión validada de/}).click();
 await page.getByText(/Fallo simulado de Firebase/).waitFor();
 assert.equal(await page.getByText("Gestionar versiones validadas (2)",{exact:true}).count(),1);
 assert.equal(await page.evaluate(()=>window.remoteVersions.length),3);
 assert.equal(await page.evaluate(()=>window.remoteDeletes),1);

 // Successful remote confirmation changes visible list, keeps last+other scope.
 await page.evaluate(()=>window.failDelete=false);
 await page.getByRole("button",{name:/Eliminar versión validada de/}).click();
 await page.getByText(/confirmado en Firebase/).waitFor();
 assert.equal(await page.getByText("Gestionar versiones validadas (1)",{exact:true}).count(),1);
 assert.equal(await page.getByRole("button",{name:/Eliminar versión validada de/}).count(),0);
 assert.equal(await page.evaluate(()=>window.remoteVersions.length),2);
 assert.equal(await page.evaluate(()=>window.remoteVersions.some(d=>d.municipalityId==="zagra")),true);
 assert.equal(await page.evaluate(()=>window.remoteVersions.some(d=>d.generatedAt==="2026-10-01T12:00:00Z")),true);

 await page.goto(url+"?reader");
 await page.getByText("Gestionar versiones validadas (2)",{exact:true}).click();
 assert.equal(await page.getByRole("button",{name:/Eliminar versión validada de/}).count(),0);
 assert.deepEqual(errors,[]);
 console.log("PASS: historical version deletion is available only with permissions; failure retains copy; confirmed removal keeps latest and other municipality");
}catch(error){
 console.error((await page?.locator("body").innerText())?.slice(0,4000));
 throw error;
}finally{await browser?.close();await server.close();}
