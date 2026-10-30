import {useEffect,useState} from 'react';
import {readRelasDraft,readRelasReview,saveRelasDraft,saveRelasReview,type RelasClient} from '../../infrastructure/relas/RelasClient';
import {type PlanPreparationDraft,type PlanPreparationReview,type PlanPreparationReviewStatus} from '../../domain/action-plan-catalog/PlanPreparationDraft';
import {municipalActionPlanModule,prepareMunicipalActionPlanDraft} from '../../domain/action-plan-catalog/MunicipalActionPlanModule';
import {HEALTHY_AGING_MODULE} from '../../domain/action-plan-catalog/ActionPlanCatalog';
import {PlanPreparationPanel} from './PlanPreparationPanel';

export default function TerritorialWorkspace({client,scope,role,onBack}:{client:RelasClient;scope:string;role:string;onBack:()=>void}) {
 const module=municipalActionPlanModule(scope,HEALTHY_AGING_MODULE);
 const [draft,setDraft]=useState<PlanPreparationDraft>();
 const [version,setVersion]=useState<number|null>(null);
 const [dirty,setDirty]=useState(false);
 const [review,setReview]=useState<PlanPreparationReview>();
 const [reviewVersion,setReviewVersion]=useState<number|null>(null);
 const [reviewDirty,setReviewDirty]=useState(false);
 const [loadedScope,setLoadedScope]=useState<string>();
 const scopeVersion=`${scope}/${module.version}`;
 const ready=loadedScope===scopeVersion;
 const [busy,setBusy]=useState(true);
 const [message,setMessage]=useState('Recuperando borrador…');
 const isAdministrator=role==='administrator';
 const isCoordinator=role==='coordinator';
 const currentDraftVersion=version??0;
 const [migrationPending,setMigrationPending]=useState(false);
 const reviewIsCurrent=Boolean(!migrationPending&&review&&review.sourceDraftVersion===currentDraftVersion&&review.sourceVersion===module.version);
 const effectiveReviewIsCurrent=reviewIsCurrent||reviewDirty;

 function sourceTextFor(id:string){
  if(id===module.id)return module.strategicObjective;
  for(const general of module.generalObjectives){
   if(id===general.code)return general.title;
   for(const specific of general.specificObjectives){
    if(id===specific.code)return specific.title;
    if(id===specific.indicator.code)return specific.indicator.title;
   }
  }
  return draft?.decisions[id]?.sourceText??id;
 }

 function setAdministrativeDecision(id:string,status:PlanPreparationReviewStatus,consolidatedText?:string){
  if(!isAdministrator)return;
  const territorial=draft?.decisions[id];
  const source=sourceTextFor(id);
  const proposed=territorial?.status==='modified'?(territorial.text?.trim()||source):undefined;
  setReview({
   municipalityId:scope,
   moduleId:module.id,
   sourceVersion:module.version,
   sourceDraftVersion:currentDraftVersion,
   updatedAt:new Date().toISOString(),
   decisions:{...(effectiveReviewIsCurrent ? review?.decisions : {}),[id]:{
    status,
    sourceText:source,
    proposedText:proposed,
    consolidatedText:status==='reformulated'?(consolidatedText??review?.decisions[id]?.consolidatedText??proposed??source):undefined,
    reviewedAt:new Date().toISOString(),
   }},
  });
  setReviewDirty(true);
 }

 async function load(){
  setLoadedScope(undefined);
  const [row,reviewRow]=await Promise.all([readRelasDraft(client,scope,module.id),readRelasReview(client,scope,module.id)]);
  const prepared=prepareMunicipalActionPlanDraft(scope,module,row?.payload);
  setDraft(prepared);setVersion(row?.version??null);setMigrationPending(prepared!==row?.payload);setDirty(isCoordinator&&prepared!==row?.payload);
  setReview(reviewRow?.payload);setReviewVersion(reviewRow?.version??null);setReviewDirty(false);
  setLoadedScope(scopeVersion);
  if(isAdministrator&&reviewRow&&reviewRow.payload.sourceDraftVersion!==(row?.version??0))setMessage('Estado recuperado. La consolidación administrativa existente corresponde a otra versión territorial y debe revisarse de nuevo.');
  else setMessage(row?'Borrador recuperado.':'No hay propuesta territorial guardada. La administración puede modificar y consolidar directamente el texto vigente.');
 }

 useEffect(()=>{let cancelled=false;Promise.all([readRelasDraft(client,scope,module.id),readRelasReview(client,scope,module.id)]).then(([row,reviewRow])=>{
  if(cancelled)return;
  const prepared=prepareMunicipalActionPlanDraft(scope,module,row?.payload);
  setMigrationPending(prepared!==row?.payload);setDirty(isCoordinator&&prepared!==row?.payload);
  setDraft(prepared);setVersion(row?.version??null);setReview(reviewRow?.payload);setReviewVersion(reviewRow?.version??null);setReviewDirty(false);setLoadedScope(scopeVersion);
  if(isAdministrator&&reviewRow&&reviewRow.payload.sourceDraftVersion!==(row?.version??0))setMessage('Estado recuperado. La consolidación administrativa debe revisarse porque la propuesta territorial ha cambiado.');
  else setMessage(row?'Borrador recuperado.':'No hay propuesta territorial guardada.');
 }).catch(e=>{if(!cancelled){setLoadedScope(undefined);setMessage(e.message);}}).finally(()=>{if(!cancelled)setBusy(false);});return()=>{cancelled=true;};},[client,scope,module,scopeVersion,isAdministrator,isCoordinator]);

 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty||reviewDirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,reviewDirty]);
 const hasUnsaved=dirty||reviewDirty;
 const territorialProposals=Object.entries(draft?.decisions??{}).filter(([,decision])=>decision.status==='modified'&&Boolean(decision.text?.trim()));
 const pendingProposals=territorialProposals.filter(([id])=>!effectiveReviewIsCurrent||!review?.decisions[id]);
 const reviewedProposals=territorialProposals.length-pendingProposals.length;

 async function saveCoordinatorProposal(){
  if(!draft)return;
  setBusy(true);
  try{const row=await saveRelasDraft(client,draft,version);setVersion(row.version);setDraft(row.payload);setMigrationPending(false);setDirty(false);setMessage('Propuesta territorial guardada. Pendiente de revisión administrativa.');}
  catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
 }

 async function saveAdministrativeReview(){
  if(!review)return;
  setBusy(true);
  try{
   const current={...review,sourceDraftVersion:currentDraftVersion,sourceVersion:module.version,updatedAt:new Date().toISOString()};
   const row=await saveRelasReview(client,current,reviewVersion);
   setReviewVersion(row.version);setReview(row.payload);setReviewDirty(false);
   setMessage('Cambios administrativos consolidados. El texto resultante queda vigente en COMPAS sin constituir aprobación del Grupo Motor.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
 }

 const actionBar=<div className="backup-panel__actions" aria-label="Acciones de guardado">
  {isCoordinator&&<button disabled={!ready||busy||!dirty||!draft} onClick={saveCoordinatorProposal}>Guardar propuesta territorial</button>}
  {isAdministrator&&<button disabled={!ready||busy||migrationPending||!reviewDirty||!review} onClick={saveAdministrativeReview}>Consolidar cambios administrativos</button>}
  <button disabled={busy} onClick={async()=>{if(hasUnsaved&&!window.confirm('¿Descartar cambios y recuperar el servidor?'))return;setBusy(true);try{await load();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>Recuperar versión del servidor</button>
 </div>;

 return <section><button onClick={()=>{if(!hasUnsaved||window.confirm('Hay cambios sin guardar. ¿Volver y descartarlos?'))onBack();}}>Volver al panel</button>
  <h2>Ámbito: {scope}</h2>
  <p>{isAdministrator?'Edición administrativa del Plan. Puedes modificar directamente objetivos e indicadores y consolidar esos cambios sin generar una propuesta para revisión. Si existe una propuesta territorial, puedes aceptarla, rechazarla o reformularla.':'Preparación del Plan. Guardar una modificación crea una propuesta territorial y no cambia por sí sola el texto consolidado.'}</p>
  {actionBar}
  {ready&&migrationPending&&<p role="status">Borrador reagrupado con el original archivado. El coordinador debe guardar la migración antes de consolidar una revisión administrativa.</p>}
  {isAdministrator&&ready&&<section className="workspace-panel" aria-label="Propuestas territoriales pendientes">
   <p className="eyebrow">Revisión administrativa</p>
   <h3>Propuestas territoriales de modificación</h3>
   <p><strong>{pendingProposals.length} pendientes</strong>{territorialProposals.length>0?` · ${reviewedProposals} revisadas · ${territorialProposals.length} propuestas registradas`:' · No hay propuestas territoriales registradas.'}</p>
   {pendingProposals.length===0&&territorialProposals.length>0&&<p>No hay propuestas pendientes para la versión territorial actual.</p>}
   {!migrationPending&&pendingProposals.map(([id,decision])=>{
    const source=sourceTextFor(id);
    const proposed=decision.text?.trim()||source;
    const currentReview=effectiveReviewIsCurrent?review?.decisions[id]:undefined;
    return <article key={id} className="pcm-admin-review">
     <h4>{id}</h4>
     <p><strong>Texto vigente:</strong> {source}</p>
     <p><strong>Propuesta territorial:</strong> {proposed}</p>
     <div className="backup-panel__actions">
      <button onClick={()=>setAdministrativeDecision(id,'accepted')}>Aceptar propuesta</button>
      <button onClick={()=>setAdministrativeDecision(id,'rejected')}>Rechazar y mantener vigente</button>
      <button onClick={()=>setAdministrativeDecision(id,'reformulated',proposed)}>Editar antes de aceptar</button>
     </div>
     {currentReview?.status==='reformulated'&&<label>Redacción administrativa final
      <textarea rows={3} value={currentReview.consolidatedText??proposed} onChange={e=>setAdministrativeDecision(id,'reformulated',e.target.value)}/>
     </label>}
    </article>;
   })}
   <p className="panel-note">Aceptar, rechazar o reformular una propuesta constituye una consolidación administrativa. No equivale a aprobación del Grupo Motor.</p>
  </section>}
  {ready&&<fieldset disabled={busy||role==='reader'||(isAdministrator&&migrationPending)} style={{border:0,padding:0}}><PlanPreparationPanel
   module={module}
   municipalityId={scope}
   draft={draft}
   onChange={d=>{if(!isCoordinator)return;setDraft(d);setDirty(true);}}
   review={review}
   onReviewChange={r=>{if(!isAdministrator)return;setReview({...r,sourceDraftVersion:currentDraftVersion});setReviewDirty(true);}}
   canEditProposal={isCoordinator}
   canReview={isAdministrator}
   reviewIsCurrent={effectiveReviewIsCurrent}
   renderWorksheet={()=><p>Las fichas y sus documentos aún se gestionan en el espacio de trabajo completo.</p>}
   persistenceMessage={isAdministrator?(reviewDirty?'Cambios administrativos pendientes de consolidar. Usa «Consolidar cambios administrativos».':reviewIsCurrent?'Texto administrativo consolidado para el estado territorial actual.':'Sin cambios administrativos pendientes de consolidación.'):(dirty?'Propuesta territorial pendiente de guardar. Usa «Guardar propuesta territorial».':'Sin cambios territoriales pendientes.')}
  /></fieldset>}
  {actionBar}
  <p role="status">{message}</p>
 </section>;
}
