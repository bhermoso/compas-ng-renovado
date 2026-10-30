import { useState } from "react";
import type { DefinitiveActionPlanModuleProjection } from "../../domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { buildPlanDocument, latestValidatedPlan, validatePlanDocument, type PlanDocument } from "../../domain/action-plan-catalog/PlanDocument";
import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
export function PlanDocumentActions({municipalityId,active,versions=[],worksheets=[],onValidate}:{
 municipalityId:string;active:DefinitiveActionPlanModuleProjection[];versions?:PlanDocument[];worksheets?:IndicatorWorksheet[];onValidate?:(document:PlanDocument)=>boolean;
}){
 const [name,setName]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const latest=latestValidatedPlan(versions,municipalityId);
 async function download(format:"docx"|"pdf", source:"draft"|"validated"){
  setBusy(true);setMessage("");
  try{const {downloadPlanDocument}=await import("../../application/action-plan/exportPlanDocument");
   await downloadPlanDocument(source === "validated" && latest ? latest : buildPlanDocument(municipalityId,active,new Date().toISOString(),{worksheets}),format);
  }catch{setMessage("No se pudo descargar el documento. Inténtalo de nuevo.");}finally{setBusy(false);}
 }
 function validate(){
  try{const version=validatePlanDocument(municipalityId,active,name,new Date().toISOString(),{worksheets});
   if(!onValidate?.(version))throw new Error("No se pudo guardar la versión validada. Conserva una copia del expediente y vuelve a intentarlo.");
   setMessage("Versión validada guardada en este expediente.");
  }catch(e){setMessage((e as Error).message);}
 }
 return <section className="workspace-panel plan-document-actions" aria-label="Documento independiente del Plan">
 <h3>Documento independiente del Plan de Acción</h3>
 <p>El borrador actual se descarga sin validar. Las versiones validadas se conservan por separado.</p>
 {latest&&<p>Última validación: {latest.generatedAt} · {latest.validatedBy}</p>}
 <label>Persona que valida técnicamente<input value={name} onChange={e=>setName(e.target.value)}/></label>
 <button type="button" disabled={busy||!onValidate} onClick={validate}>Validar y guardar versión actual</button>
 <div className="backup-panel__actions">
 <button type="button" disabled={busy||!active.some(x=>x.rows.length)} onClick={()=>download("docx","draft")}>Descargar borrador actual · Word</button>
 <button type="button" disabled={busy||!active.some(x=>x.rows.length)} onClick={()=>download("pdf","draft")}>Descargar borrador actual · PDF</button>
 {latest&&<>
 <button type="button" disabled={busy} onClick={()=>download("docx","validated")}>Descargar última versión validada · Word</button>
 <button type="button" disabled={busy} onClick={()=>download("pdf","validated")}>Descargar última versión validada · PDF</button>
 </>}
 </div><p role="status">{message}</p>
 </section>;
}
