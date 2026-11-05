import { useState } from "react";
import type { DefinitiveActionPlanModuleProjection } from "../../domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { buildPlanDocument, latestValidatedPlan, validatePlanDocument, type PlanDocument } from "../../domain/action-plan-catalog/PlanDocument";
import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";

/** Versions stored in the complete municipal expediente, not Firestore's immutable RELAS audit. */
export function PlanDocumentActions({municipalityId,active,versions=[],worksheets=[],onValidate,onDeleteVersion}:{
 municipalityId:string;
 active:DefinitiveActionPlanModuleProjection[];
 versions?:PlanDocument[];
 worksheets?:IndicatorWorksheet[];
 onValidate?:(document:PlanDocument)=>boolean;
 onDeleteVersion?:(document:PlanDocument)=>Promise<boolean>;
}){
 const [name,setName]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const saved=versions.filter(d=>d.schemaVersion===1&&d.municipalityId===municipalityId&&d.status==="validated")
  .sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
 const latest=latestValidatedPlan(versions,municipalityId);

 async function download(format:"docx"|"pdf", document:PlanDocument){
  setBusy(true);setMessage("");
  try{
   const {downloadPlanDocument}=await import("../../application/action-plan/exportPlanDocument");
   await downloadPlanDocument(document,format);
  }catch{setMessage("No se pudo descargar el documento. Inténtalo de nuevo.");}
  finally{setBusy(false);}
 }

 function validate(){
  try{
   const version=validatePlanDocument(municipalityId,active,name,new Date().toISOString(),{worksheets});
   if(!onValidate?.(version))throw new Error("No se pudo guardar la versión validada. Conserva una copia del expediente y vuelve a intentarlo.");
   setMessage("Versión validada añadida al expediente. Comprueba la confirmación de Firebase en la barra de sincronización.");
  }catch(e){setMessage((e as Error).message);}
 }

 async function remove(document:PlanDocument){
  if(!onDeleteVersion||busy||document===latest)return;
  if(!window.confirm(
   `¿Eliminar la versión validada del Plan de Acción de ${document.generatedAt}, validada por ${document.validatedBy ?? "autoría no indicada"}?\n\nEsta operación elimina esa copia antigua del expediente compartido. La última versión validada y el historial de auditoría RELAS no se modifican. No se puede deshacer.`
  ))return;
  setBusy(true);setMessage("Comprobando y eliminando la versión en Firebase…");
  try{
   const confirmed=await onDeleteVersion(document);
   setMessage(confirmed
    ? "Versión antigua eliminada y cambio confirmado en Firebase. La última versión validada permanece disponible."
    : "No se ha confirmado la eliminación. La versión anterior permanece en el expediente.");
  }catch(error){
   setMessage(error instanceof Error ? `No se ha eliminado la versión: ${error.message}` : "No se ha eliminado la versión. Comprueba Firebase.");
  }finally{setBusy(false);}
 }

 return <section className="workspace-panel plan-document-actions" aria-label="Documento independiente del Plan">
  <h3>Documento independiente del Plan de Acción</h3>
  <p>El borrador actual se descarga sin validar. Las versiones validadas se conservan por separado.</p>
  {latest&&<p>Última validación: {latest.generatedAt} · {latest.validatedBy}</p>}
  <label>Persona que valida técnicamente<input value={name} onChange={e=>setName(e.target.value)}/></label>
  <button type="button" disabled={busy||!onValidate} onClick={validate}>Validar y guardar versión actual</button>
  <div className="backup-panel__actions">
   <button type="button" disabled={busy||!active.some(x=>x.rows.length)} onClick={()=>download("docx",buildPlanDocument(municipalityId,active,new Date().toISOString(),{worksheets}))}>Descargar borrador actual · Word</button>
   <button type="button" disabled={busy||!active.some(x=>x.rows.length)} onClick={()=>download("pdf",buildPlanDocument(municipalityId,active,new Date().toISOString(),{worksheets}))}>Descargar borrador actual · PDF</button>
   {latest&&<>
    <button type="button" disabled={busy} onClick={()=>download("docx",latest)}>Descargar última versión validada · Word</button>
    <button type="button" disabled={busy} onClick={()=>download("pdf",latest)}>Descargar última versión validada · PDF</button>
   </>}
  </div>
  <details className="plan-document-versions">
   <summary>Gestionar versiones validadas ({saved.length})</summary>
   <p className="panel-note">Cada copia histórica puede descargarse. Solo se pueden eliminar las versiones anteriores a la más reciente, y solo después de confirmar el cambio en Firebase.</p>
   {saved.length===0&&<p>No hay versiones validadas guardadas en este expediente.</p>}
   <ol className="plan-document-versions__list">
    {saved.map((version,index)=><li key={`${version.generatedAt}:${version.validatedBy??""}:${index}`} className="plan-document-versions__row">
     <div>
      <strong>Versión de {version.generatedAt}</strong>
      <span> · {version.validatedBy??"Sin autoría registrada"}{version===latest?" · Última versión validada":""}</span>
     </div>
     <div className="backup-panel__actions">
      <button type="button" disabled={busy} onClick={()=>download("pdf",version)} aria-label={`Descargar PDF de versión ${version.generatedAt}`}>PDF</button>
      <button type="button" disabled={busy} onClick={()=>download("docx",version)} aria-label={`Descargar Word de versión ${version.generatedAt}`}>Word</button>
      {version===latest
       ? <small>Protegida: versión más reciente</small>
       : onDeleteVersion
        ? <button type="button" disabled={busy} className="plan-document-versions__delete"
           aria-label={`Eliminar versión validada de ${version.generatedAt}`}
           onClick={()=>void remove(version)}>Eliminar versión</button>
        : <small>Solo lectura</small>}
     </div>
    </li>)}
   </ol>
  </details>
  <p role="status">{message}</p>
 </section>;
}
