import { externalProfileDocument } from '../../application/health-profile/externalProfileDocument';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseProfileStructure, prefillFromStructure } from '../../application/health-profile/profileStructure';
import { ProfileReader } from './ProfileReader';
import type { ExternalHealthProfile, ExternalProfileLibrary, ProfileAttachment, ProfileResult } from '../../domain/health-profile/ExternalHealthProfile';
import type { LocalHealthProfileArtifact } from '../../domain/health-profile-artifact';
import { appendExternalProfile, archiveExternalProfileVersion, deleteExternalProfileVersion, importProfileFile, prepareImportedProfileRevision, profileAttachmentBlob } from '../../application/health-profile/externalProfiles';
import { PSLCArtifactViewer } from './PSLCArtifactViewer';
import { ProfileResultsDashboard } from './ProfileResultsDashboard';
import { ProfileEditorialLab } from './ProfileEditorialLab';
import { ProfileOriginalVerifier } from './ProfileOriginalVerifier';
import './ExternalProfileDashboard.css';

interface Props {
 municipalityId: string;
 municipalityName: string;
 library: ExternalProfileLibrary;
 legacyProfiles?: LocalHealthProfileArtifact[];
 legacyText?: string;
 authorName: string;
 onSave: (library: ExternalProfileLibrary, onProgress?: (message: string) => void) => Promise<void>;
 onDirtyChange?: (dirty: boolean) => void;
}
const date = (s: string) => new Date(s).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'});
const lines = (s: string) => s.split('\n').map(v => v.trim()).filter(Boolean);
function download(blob: Blob, name: string) {
 const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;a.click();
 window.setTimeout(() => URL.revokeObjectURL(url),1000);
}
/** Imprime la lectura completa del perfil, no solo las cuatro páginas de datos. */
function printCompleteProfile(node: HTMLElement | null, title: string) {
 if (!node) return;
 const frame=document.createElement('iframe');
 frame.title='Exportación del Perfil de Salud Local';
 frame.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';
 document.body.appendChild(frame);
 const doc=frame.contentDocument;
 if(!doc){frame.remove();return;}
 const styles=Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).map(el=>el.outerHTML).join('');
 const safeTitle=title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 doc.open();
 doc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${safeTitle}</title>${styles}
 <style>@page{size:A4;margin:12mm} body{background:white!important;margin:0!important}
 .epd-trace__item,.epd-findings li,.epd-recos__group{break-inside:avoid}
 .epd{max-width:none!important} .pdp-page{break-after:auto!important;page-break-after:auto!important}
 .pdp-print-body .pdp-page{break-after:auto!important}
 </style></head><body class="pdp-print-body"><main class="external-profile"><div class="ep-main ep-main--profile">${node.outerHTML}</div></main></body></html>`);
 doc.close();
 let printed=false;
 const go=()=>{if(printed)return;printed=true;frame.contentWindow?.focus();frame.contentWindow?.print();window.setTimeout(()=>frame.remove(),1500)};
 if(doc.readyState==='complete')window.setTimeout(go,400);else frame.addEventListener('load',()=>window.setTimeout(go,400),{once:true});
}
function emptyProfile(municipalityId: string): ExternalHealthProfile {
 return {schema:'compas-external-profile/v1',id:crypto.randomUUID(),municipalityId,title:'',period:'',author:'',createdAt:new Date().toISOString(),
  status:'review',summary:'',text:'',results:[],findings:[],limitations:[],areas:[],attachmentIds:[]};
}
export function ExternalProfileDashboard({municipalityId,municipalityName,library,legacyProfiles=[],legacyText,authorName,onSave,onDirtyChange}: Props) {
 const [selectedId,setSelectedId]=useState(library.activeId);
 const [tab,setTab]=useState<'results'|'document'|'versions'|'laboratory'>('results');
 const [draft,setDraft]=useState<ExternalHealthProfile>();
 const [newFiles,setNewFiles]=useState<ProfileAttachment[]>([]);
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [error,setError]=useState('');
 const [fileUrls,setFileUrls]=useState<Record<string,string>>({});
 const [resultDraft,setResultDraft]=useState<ProfileResult>();
 const fileInput=useRef<HTMLInputElement>(null);
 const draftFileInput=useRef<HTMLInputElement>(null);
 const replaceAttachmentId=useRef<string|undefined>(undefined);
 const fullProfileRef=useRef<HTMLDivElement>(null);
 const selected=library.profiles.find(p=>p.id===(selectedId ?? library.activeId)) ?? library.profiles.find(p=>p.id===library.activeId);
 useEffect(()=>{onDirtyChange?.(!!draft);return()=>onDirtyChange?.(false);},[draft,onDirtyChange]);
 useEffect(()=>{
  if(!draft)return;
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[draft]);
 useEffect(()=>{
  let active=true;const urls:string[]=[];setFileUrls({});
  void (async()=>{
   const map:Record<string,string>={};
   for(const id of selected?.attachmentIds ?? []){
    const file=library.attachments.find(f=>f.id===id);if(!file)continue;
    try {const blob=await profileAttachmentBlob(file);if(!active)return;const url=URL.createObjectURL(blob);urls.push(url);map[id]=url;}
    catch {if(active)setError('No se ha podido verificar un archivo. Conserva el expediente y revisa su copia en Firebase.');}
   }
   if(active)setFileUrls(map);
  })();return()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
 },[selected,library.attachments]);
 const files=library.attachments.filter(f=>selected?.attachmentIds.includes(f.id));
 const selectedText=selected?.text;
 const structure=useMemo(()=>selectedText ? parseProfileStructure(selectedText) : undefined,[selectedText]);
 const [readerAnchor,setReaderAnchor]=useState<string>();
 useEffect(()=>{
  if(tab!=='document'||!readerAnchor)return;
  const timer=window.setTimeout(()=>{document.getElementById(readerAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});setReaderAnchor(undefined);},60);
  return()=>window.clearTimeout(timer);
 },[tab,readerAnchor]);
 const pdf=files.find(f=>f.mimeType==='application/pdf');
 async function loadFiles(list: FileList | null) {
  if(!list?.length)return;
  if(draft&&!window.confirm('Se sustituirá el borrador sin guardar. Las versiones guardadas se conservan. ¿Continuar?'))return;
  setBusy(true);setError('');setMessage('Leyendo el perfil y comprobando sus archivos…');
  try{
   const imported=[];for(const file of Array.from(list))imported.push(await importProfileFile(file,municipalityId));
   const packaged=imported.find(x=>x.attachment.mimeType==='application/json')?.content;
   const documentText=imported.find(x=>x.attachment.mimeType!=='application/json'&&x.content.text)?.content.text ?? '';
   const base=packaged ? {...packaged,text:packaged.text||documentText} : imported.find(x=>x.content.text)?.content ?? imported[0].content;
   // Lo que el documento deja vacío se completa con su estructura reconocida (conclusiones, recomendaciones, resumen).
   const {content,recognized}=prefillFromStructure(base, {preservePackageTitle: !!packaged});
   const attachments=imported.map(x=>x.attachment);
   setNewFiles(attachments);setResultDraft(undefined);
   setDraft(prepareImportedProfileRevision(
     {...emptyProfile(municipalityId),...content,attachmentIds:attachments.map(a=>a.id)},
     selected
   ));
   const found=[recognized.summary?'el resumen':'',recognized.conclusions?`${recognized.conclusions} conclusiones`:'',recognized.recommendations?`${recognized.recommendations} recomendaciones`:''].filter(Boolean);
   const withoutPdf=!!packaged && !imported.some(x=>x.attachment.mimeType==='application/pdf');
   setMessage([
     selected?'Nueva revisión enlazada a la versión seleccionada: la versión vigente se conserva hasta que la promociones explícitamente.':'',
     withoutPdf?'El paquete JSON no incluye un PDF original; selecciona el PDF y el paquete JSON juntos para conservar ambos en Firebase.':'',
     ...imported.map(x=>x.notice).filter(Boolean),
     found.length?`Se han reconocido en el documento ${found.join(', ')}. Revísalos antes de guardar.`:'Archivo leído. Revisa los datos y guarda el perfil en Firebase.'
   ].filter(Boolean).join(' '));
  }catch(e){setError(e instanceof Error?e.message:'No se pudo leer el perfil.');setMessage('');}
  finally{setBusy(false);if(fileInput.current)fileInput.current.value='';}
 }
 /** Attach or replace a file only in the new draft revision. */
 async function changeDraftFiles(list: FileList | null) {
  const file=list?.[0], replacedId=replaceAttachmentId.current;
  replaceAttachmentId.current=undefined;
  if(!file||!draft||busy)return;
  setBusy(true);setError('');setMessage('Comprobando integridad del nuevo archivo…');
  try {
   const imported=await importProfileFile(file,municipalityId);
   const old=replacedId&&[...library.attachments,...newFiles].find(a=>a.id===replacedId);
   if(replacedId&&!old)throw new Error('El archivo a sustituir ya no está en el borrador.');
   if(old&&old.mimeType!==imported.attachment.mimeType)throw new Error('Para sustituir un archivo debe conservarse su formato. Para otro formato, añade un archivo.');
   setNewFiles(current=>[...current.filter(f=>f.id!==replacedId),imported.attachment]);
   setDraft(current=>current?{...current,attachmentIds:[...current.attachmentIds.filter(id=>id!==replacedId),imported.attachment.id]}:current);
   setMessage(replacedId?'Sustituido solo en la nueva revisión. El original de las versiones anteriores se conserva; comprueba el texto y los resultados.':'Archivo añadido a esta revisión. Se incorporará a Firebase al guardarla.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudo incorporar el archivo.');setMessage('');}
  finally{setBusy(false);}
 }
 function openDraftFilePicker(replaceId?:string){
  replaceAttachmentId.current=replaceId;
  draftFileInput.current?.click();
 }
 function removeDraftAttachment(id:string){
  setDraft(current=>current?{...current,attachmentIds:current.attachmentIds.filter(x=>x!==id)}:current);
  setNewFiles(current=>current.filter(file=>file.id!==id));
  setMessage('Adjunto retirado solo de esta revisión. Las versiones guardadas permanecen intactas.');
 }
 function edit() {
  if(!selected)return;
  setDraft({...structuredClone(selected),id:crypto.randomUUID(),revisionOf:selected.id,createdAt:new Date().toISOString(),status:'review',validatedBy:undefined,validatedAt:undefined,archivedAt:undefined,archivedBy:undefined});
  setNewFiles([]);setResultDraft(undefined);setError('');setMessage('Estás preparando una nueva revisión. La versión anterior y sus originales se conservan.');
 }
 async function archiveVersion(profile:ExternalHealthProfile){
  if(!window.confirm(`¿Archivar «${profile.title}»? Los archivos, las fuentes y la historia permanecerán accesibles.`))return;
  try{await commit(archiveExternalProfileVersion(library,profile.id,authorName),'Versión archivada y conservada en Firebase.');}catch(e){setError(e instanceof Error?e.message:'No se pudo archivar.');}
 }
 async function deleteVersion(profile:ExternalHealthProfile){
  if(!window.confirm(`¿Eliminar definitivamente «${profile.title}»? Solo se borrarán los adjuntos que ninguna otra versión utilice. Esta operación no se puede deshacer.`))return;
  setBusy(true);setError('');setMessage('Eliminando del expediente compartido…');
  try{
   const next=deleteExternalProfileVersion(library,profile.id);
   await onSave(next,progress=>setMessage(progress));
   setSelectedId(library.activeId);
   setMessage('Versión eliminada en Firebase. Se conservaron las demás versiones y sus archivos.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar.');setMessage('');}
  finally{setBusy(false);}
 }
 async function saveDraft(e: React.FormEvent) {
  e.preventDefault();if(!draft?.title.trim())return;
  if(resultDraft){setError('Añade o cancela el indicador que estás editando antes de guardar el perfil.');return;}
  const conclusionIds = new Set(parseProfileStructure(draft.text).conclusions.map(c=>c.id));
  const invalidLinks = draft.results.flatMap(r=>(r.supportsConclusions??[]).filter(id=>!conclusionIds.has(id)).map(id=>`${r.title}: ${id}`));
  if(invalidLinks.length){setError(`Hay vínculos a conclusiones que ya no figuran en el documento: ${invalidLinks.join(', ')}. Corrígelos antes de guardar.`);return;}
  setBusy(true);setError('');setMessage('Guardando el documento, los resultados y la versión en Firebase…');
  try{
   const appended=appendExternalProfile(library,{...draft,title:draft.title.trim()},newFiles.filter(file=>draft.attachmentIds.includes(file.id)),municipalityId);
   // Una nueva revisión no sustituye la versión vigente hasta una promoción explícita.
   const next=draft.revisionOf && library.activeId ? {...appended,activeId:library.activeId} : appended;
   await onSave(next, progress => setMessage(progress));setSelectedId(draft.id);setDraft(undefined);setNewFiles([]);setTab('results');
   setMessage('Revisión guardada con originales y resultados. La versión vigente se establece desde Gestión y versiones.');
  }catch(e){setError(e instanceof Error?e.message:'No se ha podido guardar. Tu borrador permanece en pantalla.');setMessage('');}
  finally{setBusy(false);}
 }
 async function exportRevision() {
  if (!selected) return;
  setBusy(true);setError('');setMessage('Maquetando la revisión guardada…');
  try {
   const model = externalProfileDocument(selected,municipalityName);
   const [{buildPSLCDocx},{Packer}]=await Promise.all([import('../../application/psl-c-export/pslcDocx'),import('docx')]);
   download(await Packer.toBlob(buildPSLCDocx(model)),model.fileName);
   setMessage('Descarga preparada con el contenido de esta revisión guardada en Firebase.');
  } catch {setError('No se ha podido preparar la descarga. Los originales y el perfil guardado siguen disponibles.');setMessage('');}
  finally {setBusy(false);}
 }
 async function commit(next:ExternalProfileLibrary,success:string) {
  setBusy(true);setError('');setMessage('Guardando en Firebase…');
  try{await onSave(next, progress => setMessage(progress));setMessage(success);}catch(e){setError(e instanceof Error?e.message:'No se ha podido guardar en Firebase.');setMessage('');}finally{setBusy(false);}
 }
 function patch(change:Partial<ExternalHealthProfile>){setDraft(p=>p?{...p,...change}:p);}
 return <section className="external-profile" aria-label="Perfil de Salud Local">
  {!selected && <header className="ep-header"><div className="ep-header__body"><div><p className="ep-eyebrow">PERFIL DE SALUD LOCAL · {municipalityName}</p><h1>Incorporar un perfil</h1></div></div></header>}
  <input className="ep-sr-only" ref={fileInput} type="file" aria-label="Cargar perfil" multiple accept=".pdf,.docx,.txt,.md,.json" disabled={busy} onChange={e=>void loadFiles(e.currentTarget.files)} />
  <input className="ep-sr-only" ref={draftFileInput} type="file" aria-label="Añadir o sustituir archivo" accept=".pdf,.docx,.txt,.md,.json" disabled={busy} onChange={e=>{const files=e.currentTarget.files;void changeDraftFiles(files);e.currentTarget.value='';}} />
  {message&&<p className="ep-message" role="status">{message}</p>}{error&&<p className="ep-error" role="alert">{error}</p>}
  {draft ? <form className="ep-editor" onSubmit={e=>void saveDraft(e)}>
   <div className="ep-section-heading"><div><p className="ep-eyebrow">{draft.revisionOf?'NUEVA REVISIÓN':'INCORPORAR UN PERFIL EXTERNO'}</p><h2>Revisa el perfil antes de guardarlo</h2></div>
    <button type="button" disabled={busy} onClick={()=>{if(window.confirm('¿Descartar este borrador sin guardar?')){setDraft(undefined);setNewFiles([]);setResultDraft(undefined);setMessage('');}}}>Cancelar</button></div>
   <fieldset disabled={busy}><legend className="ep-sr-only">Datos del perfil</legend>
   <div className="ep-fields"><label>Título del perfil<input required value={draft.title} onChange={e=>patch({title:e.target.value})}/></label>
    <label>Periodo o fecha del documento<input value={draft.period} onChange={e=>patch({period:e.target.value})} placeholder="Tal como figura en el perfil"/></label>
    <label>Autoría del contenido<input value={draft.author} onChange={e=>patch({author:e.target.value})}/></label></div>
   <label>Lectura de conjunto<textarea rows={4} value={draft.summary} onChange={e=>patch({summary:e.target.value})} placeholder="Síntesis aportada con el perfil; no se redacta automáticamente"/></label>
   <label>Texto del perfil<textarea className="ep-fulltext" rows={14} value={draft.text} onChange={e=>patch({text:e.target.value})}/></label>
   <p className="ep-help">Puedes editar el texto de esta revisión. Los archivos originales permanecen intactos; su PDF o DOCX no se reescribe al cambiar este texto.</p>
   <div className="ep-fields ep-fields--two"><label>Hallazgos principales · uno por línea<textarea rows={5} value={draft.findings.join('\n')} onChange={e=>patch({findings:e.target.value.split('\n')})}/></label>
    <label>Limitaciones y cautelas · una por línea<textarea rows={5} value={draft.limitations.join('\n')} onChange={e=>patch({limitations:e.target.value.split('\n')})}/></label></div>
   <div className="ep-section-heading"><div><h3>Indicadores y gráficos</h3><p>Solo cifras del perfil, con su periodo, ámbito y fuente. Las preferencias ciudadanas no son prevalencias.</p></div>
    <button type="button" onClick={()=>setResultDraft({id:crypto.randomUUID(),title:'',value:'',unit:'',source:'',page:'',period:'',caution:'',topic:'',scale:'',denominator:'',temporalContext:'not-stated'})}>Añadir indicador</button></div>
   {draft.results.map(r=><div className="ep-edit-result" key={r.id}><span><strong>{r.title}</strong> · {r.value} {r.unit} · {r.period}</span><div><button type="button" onClick={()=>setResultDraft(structuredClone(r))}>Editar indicador</button><button type="button" onClick={()=>patch({results:draft.results.filter(x=>x.id!==r.id)})}>Quitar de esta revisión</button></div></div>)}
   {resultDraft&&<fieldset className="ep-result-form"><legend>Editar indicador del perfil</legend><div className="ep-fields">
    {([['title','Indicador'],['value','Valor literal'],['unit','Unidad'],['topic','Tema'],['period','Periodo del dato'],['source','Fuente'],['page','Página o tabla'],['scale','Ámbito territorial'],['denominator','Denominador o base'],['caution','Cautela']] as const).map(([key,label])=><label key={key}>{label}<input value={resultDraft[key]??''} onChange={e=>setResultDraft({...resultDraft,[key]:e.target.value})}/></label>)}
    <label>Vigencia del dato<select value={resultDraft.temporalContext??'not-stated'} onChange={e=>setResultDraft({...resultDraft,temporalContext:e.target.value as ProfileResult['temporalContext']})}><option value="not-stated">Sin declarar</option><option value="current">Referencia actual declarada</option><option value="historical">Antecedente histórico</option></select></label>
    <label>Valor numérico para el gráfico · opcional<input type="number" step="any" value={resultDraft.chartValue??''} onChange={e=>setResultDraft({...resultDraft,chartValue:e.target.value===''?undefined:Number(e.target.value)})}/></label>
    <label>Referencia comparable · nombre<input value={resultDraft.comparison?.label??''} onChange={e=>setResultDraft({...resultDraft,comparison:{label:e.target.value,value:resultDraft.comparison?.value??Number.NaN}})}/></label>
    <label>Referencia comparable · valor<input type="number" step="any" value={Number.isFinite(resultDraft.comparison?.value)?resultDraft.comparison!.value:''} onChange={e=>setResultDraft({...resultDraft,comparison:e.target.value===''?undefined:{label:resultDraft.comparison?.label??'',value:Number(e.target.value)}})}/></label>
   </div><div className="ep-actions"><button type="button" onClick={()=>{if(!resultDraft.title.trim()||!resultDraft.value.trim()||!resultDraft.source.trim()){setError('Indica el nombre, el valor y la fuente del indicador.');return;}if(resultDraft.comparison&&(!resultDraft.comparison.label.trim()||!Number.isFinite(resultDraft.comparison.value))){setError('Completa el nombre y el valor de la referencia comparable, o retírala.');return;}patch({results:[...draft.results.filter(r=>r.id!==resultDraft.id),resultDraft]});setResultDraft(undefined);setError('');}}>Incorporar indicador</button><button type="button" onClick={()=>setResultDraft(undefined)}>Cancelar indicador</button></div></fieldset>}
   <label>Áreas que el perfil propone para la deliberación · una por línea<textarea rows={3} value={draft.areas.map(a=>a.title).join('\n')} onChange={e=>patch({areas:lines(e.target.value).map(title=>draft.areas.find(a=>a.title===title)??{id:crypto.randomUUID(),title,rationale:''})})}/></label>
   <section className="ep-link-editor" aria-label="Vínculos entre indicadores y conclusiones">
    <h3>Trazabilidad de la revisión</h3>
    <p className="ep-help">Relaciona cada indicador únicamente con las conclusiones que lo citan o fundamentan expresamente. No se proponen vínculos automáticamente. Los cambios se guardan como una revisión nueva y no modifican el documento original.</p>
    {parseProfileStructure(draft.text).conclusions.length===0
      ? <p className="ep-help">El texto de esta revisión no contiene conclusiones C1, C2… reconocibles. No es posible añadir vínculos hasta incorporarlas al documento.</p>
      : <div className="ep-link-editor__list">{draft.results.map(r=><fieldset key={r.id} className="ep-link-editor__item">
         <legend>{r.title} · {r.value} {r.unit}</legend>
         <div className="ep-link-editor__options">{parseProfileStructure(draft.text).conclusions.map(c=><label key={c.id}>
           <input type="checkbox" checked={(r.supportsConclusions??[]).includes(c.id)}
             onChange={e=>patch({results:draft.results.map(item=>item.id!==r.id?item:{...item,supportsConclusions:e.target.checked?[...new Set([...(item.supportsConclusions??[]),c.id])]: (item.supportsConclusions??[]).filter(id=>id!==c.id)})})}/>
           <span><strong>{c.id}</strong> · {c.title}</span>
         </label>)}</div>
       </fieldset>)}</div>}
   </section>
   <section className="ep-attached" aria-label="Archivos de esta revisión">
      <div className="ep-document-toolbar__top"><strong>Archivos de esta revisión</strong><button type="button" disabled={busy} onClick={()=>openDraftFilePicker()}>Añadir archivo</button></div>
      {draft.attachmentIds.map(id=>{
       const file=[...library.attachments,...newFiles].find(a=>a.id===id);
       if(!file)return <p key={id} role="alert">Referencia de archivo no disponible: {id}</p>;
       return <div key={id} className="ep-attached__row">
         <span>{file.name} · {(file.size/1024).toLocaleString('es-ES',{maximumFractionDigits:0})} KB</span>
         <div className="ep-actions">
          <button type="button" disabled={busy} onClick={()=>void profileAttachmentBlob(file).then(blob=>download(blob,file.name)).catch(()=>setError('No se ha podido verificar este archivo.'))}>Descargar</button>
          <button type="button" disabled={busy} onClick={()=>openDraftFilePicker(id)}>Sustituir</button>
          <button type="button" disabled={busy} onClick={()=>{if(window.confirm('¿Retirar este adjunto solo de la nueva revisión? Las versiones anteriores conservarán su original.'))removeDraftAttachment(id);}}>Retirar</button>
         </div>
       </div>;
      })}
      {!draft.attachmentIds.length&&<p>Sin adjuntos en esta revisión; se conservarán el texto y los resultados.</p>}
      <p className="ep-help">Sustituir o retirar aquí no modifica originales anteriores. Los cambios solo son definitivos tras la confirmación de Firebase.</p>
    </section>
   <div className="ep-editor__footer"><p>Se guardará una versión en revisión. El guardado solo finaliza al confirmarlo Firebase; no cierres la pestaña mientras aparezca «Guardando…».</p><button className="ep-primary" disabled={busy||!draft.title.trim()} type="submit">{busy?'Guardando en Firebase…':'Guardar perfil en Firebase'}</button></div>
   </fieldset>
  </form> : !selected ? <div className="ep-empty"><div className="ep-paper" aria-hidden="true"><span>COMPÁS</span><i/><i/><i/><i/><i/></div>
   <div><p className="ep-eyebrow">PERFIL DE SALUD LOCAL · EXPEDIENTE MUNICIPAL</p><h2>{legacyProfiles.length>0||legacyText ? "Ya existe un perfil anterior de COMPÁS" : "Incorpora el Perfil de Salud Local"}</h2>
   <p>{legacyProfiles.length>0||legacyText ? "El expediente conserva un perfil elaborado previamente en COMPÁS. Puedes consultarlo más abajo, en «Perfiles anteriores de COMPÁS». Si también deseas incorporar un documento externo, se guardará por separado y no sustituirá el anterior." : "Carga el documento elaborado fuera de COMPÁS. Podrás consultarlo, descargar sus originales, editar una revisión y presentar sus resultados con la identidad institucional."}</p>
   <p className="ep-formats">PDF · Word DOCX · texto · Markdown · paquete de resultados JSON</p>
   <button className="ep-primary" type="button" disabled={busy} onClick={()=>fileInput.current?.click()}>Seleccionar el perfil</button>
   <p className="ep-help">Hasta 20 MB por archivo. Originales, texto, resultados y versiones se guardan en Firebase. El navegador es una caché.</p></div>
  </div> : <>
   <div className="ep-document-toolbar" aria-label="Acceso a archivos y versiones">
     <div className="ep-document-toolbar__top">
       <span><strong>Archivos y versiones</strong> · {selected.status==='validated'?'Validada':'En revisión'}{selected.archivedAt?' · Archivada':''}</span>
       <button type="button" disabled={busy} onClick={()=>setTab('versions')}>Gestionar archivos y versiones</button>
       <button type="button" disabled={busy} onClick={edit}>Crear nueva revisión</button>
     </div>
     <div className="ep-document-toolbar__files">
       {files.map(file=><span key={file.id} className="ep-document-toolbar__file">
         <span>{file.name}</span>
         {file.mimeType==='application/pdf'&&fileUrls[file.id]&&<a href={fileUrls[file.id]} target="_blank" rel="noopener noreferrer">Abrir</a>}
         {fileUrls[file.id]&&<a href={fileUrls[file.id]} download={file.name}>Descargar</a>}
         {!fileUrls[file.id]&&<small>Verificando original…</small>}
       </span>)}
       {files.length===0&&<small>No hay archivos adjuntos a esta versión.</small>}
     </div>
   </div>
   <nav className="ep-tabs ep-tabs--primary" aria-label="Espacios del perfil">{([['results','Perfil'],['document','Documento completo'],['versions','Gestión y versiones'],['laboratory','Laboratorio experimental']] as const).map(([key,label])=><button key={key} type="button" aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{label}</button>)}</nav>
   {tab==='results'&&<main className="ep-main ep-main--profile">
    <p className="ep-review-status" role="status">
      {selected.id!==library.activeId ? 'Revisión no vigente. ' : ''}
      {selected.status==='review' ? 'Borrador técnico: pendiente de validación.' : 'Versión validada técnicamente.'}
    </p>
    <div className="ep-complete-download pdp-noprint">
      <div><strong>Perfil de Salud Local completo</strong><span>Datos, interpretación, conclusiones y recomendaciones de esta versión. La exportación de COMPÁS no sustituye el PDF original.</span></div>
      <button type="button" className="ep-primary" onClick={()=>printCompleteProfile(fullProfileRef.current,`${selected.title} · ${municipalityName}`)}>↓ Exportar presentación COMPÁS · PDF</button>
      {pdf && fileUrls[pdf.id] ? <a className="ep-original-download" href={fileUrls[pdf.id]} download={pdf.name}>↓ Descargar PDF original · {pdf.name}</a> : <span className="ep-help">PDF original no adjunto a esta versión.</span>}
    </div>
    <div ref={fullProfileRef}><ProfileResultsDashboard profile={selected} municipalityName={municipalityName} structure={structure} pdfUrl={pdf ? fileUrls[pdf.id] : undefined} pdfName={pdf?.name} onOpenReader={anchor=>{setReaderAnchor(anchor);setTab('document');}}/></div></main>}
   {tab==='document'&&<main className="ep-main ep-main--document"><section className="ep-document-view"><h2>{selected.title}</h2>
    {selected.revisionOf&&<p className="ep-help">El texto puede contener cambios de esta revisión. Los archivos adjuntos siguen siendo los originales aportados.</p>}
    {structure ? <ProfileReader structure={structure} title={selected.title} pdfUrl={pdf ? fileUrls[pdf.id] : undefined}/>
     : pdf&&fileUrls[pdf.id] ? <><p><a href={fileUrls[pdf.id]} target="_blank" rel="noopener noreferrer">Abrir PDF original en otra pestaña</a></p><iframe title="PDF original del Perfil de Salud Local" src={fileUrls[pdf.id]}/></>
     : <p>No hay texto extraíble. Consulta el archivo original o incorpora una transcripción.</p>}
   </section></main>}
   {tab==='laboratory'&&<main className="ep-main ep-main--laboratory"><ProfileEditorialLab key={selected.id} profile={selected}/></main>}
   {tab==='versions'&&<main className="ep-main ep-main--management">
    <section className="ep-management-upload"><div><p className="ep-eyebrow">ADMINISTRACIÓN DOCUMENTAL</p><h2>Gestionar el perfil de {municipalityName}</h2><p>Para incorporar una revisión, selecciona conjuntamente su PDF original y su paquete JSON de resultados. Se conservará la versión anterior y la nueva quedará en revisión, sin validación automática.</p></div><button type="button" className="ep-primary" disabled={busy} onClick={()=>fileInput.current?.click()}>↑ Incorporar nueva revisión</button></section>
    <div className="ep-management-grid"><aside className="ep-document-card"><p className="ep-eyebrow">DOCUMENTO DE REFERENCIA</p>
    <div className="ep-cover"><span>COMPÁS</span><div><small>{municipalityName}</small><h2>{selected.title}</h2><p>{selected.period||'Periodo no declarado'}</p></div><small>PERFIL DE SALUD LOCAL</small></div>
    <p className="ep-status">{selected.id===library.activeId?'Versión de referencia':'Revisión no vigente'} · {selected.status==='validated'?'Validada técnicamente':'En revisión'}</p>
    <dl className="ep-metadata"><div><dt>Autoría</dt><dd>{selected.author||'No declarada'}</dd></div><div><dt>Incorporación</dt><dd>{date(selected.createdAt)}</dd></div>{selected.validatedBy&&<div><dt>Validación</dt><dd>{selected.validatedBy} · {date(selected.validatedAt!)}</dd></div>}</dl>
    <div className="ep-file-actions"><button type="button" disabled={busy} onClick={()=>void exportRevision()}>↓ Descargar esta revisión · Word</button>{files.map(file=><a key={file.id} aria-disabled={!fileUrls[file.id]} href={fileUrls[file.id]} download={file.name}>↓ Descargar original · {file.name}</a>)}
     {selected.text&&<button type="button" onClick={()=>download(new Blob([selected.text],{type:'text/plain;charset=utf-8'}),`${selected.title}.txt`)}>↓ Descargar texto de esta revisión</button>}
     <button type="button" onClick={()=>download(new Blob([JSON.stringify({schema:'compas-profile-package/v1',municipalityId,title:selected.title,period:selected.period,author:selected.author,summary:selected.summary,text:selected.text,results:selected.results,findings:selected.findings,limitations:selected.limitations,areas:selected.areas},null,2)],{type:'application/json'}),`${selected.title}-resultados.json`)}>↓ Descargar paquete de resultados</button>
    </div><button className="ep-primary" disabled={busy} onClick={edit}>Editar una nueva revisión</button>
    <p className="ep-help">Los originales no se modifican. Cada edición conserva la versión anterior.</p>
   </aside>
    <section className="ep-versions"><p className="ep-eyebrow">HISTORIAL CONSERVADO EN FIREBASE</p><h2>Versiones del perfil</h2>{[...library.profiles].reverse().map(p=><article key={p.id}><div><h3>{p.title}</h3><p>{date(p.createdAt)} · {p.author||'Autoría no declarada'} · {p.status==='validated'?'Validada':'En revisión'}{p.id===library.activeId?' · Vigente':''}{p.archivedAt?' · Archivada':''}</p></div><div className="ep-actions"><button onClick={()=>{setSelectedId(p.id);setTab('document');}}>Consultar versión</button>{p.id!==library.activeId&&!p.archivedAt&&<button disabled={busy} onClick={()=>void commit({...library,activeId:p.id},'Versión vigente actualizada en Firebase.')}>Establecer como vigente</button>}
      {p.id!==library.activeId&&!p.archivedAt&&<button disabled={busy} onClick={()=>void archiveVersion(p)}>Archivar versión</button>}
      {p.id!==library.activeId&&p.archivedAt&&!library.profiles.some(child=>child.revisionOf===p.id)&&<button disabled={busy} onClick={()=>void deleteVersion(p)}>Eliminar versión archivada</button>}</div></article>)}</section></div>
    {selected.id===library.activeId&&selected.status==='review'&&<section className="ep-validation"><div><h3>Revisión técnica</h3><p>La incorporación no valida el contenido. La validación quedará vinculada a esta versión y a tu cuenta.</p></div><button disabled={busy} onClick={()=>{if(!authorName.trim()){setError('Identifícate para registrar la validación.');return;}if(window.confirm('¿Registrar la validación técnica de esta versión con tu cuenta?'))void commit({...library,profiles:library.profiles.map(p=>p.id===selected.id?{...p,status:'validated',validatedAt:new Date().toISOString(),validatedBy:authorName}:p)},'Validación técnica registrada en Firebase.');}}>Registrar validación técnica</button></section>}
   </main>}
  </>}
  {!draft&&<ProfileOriginalVerifier key={municipalityId} library={library}/>}
  {(legacyProfiles.length>0||legacyText)&&<details className="ep-legacy" open={!selected}><summary>Consultar perfiles anteriores de COMPÁS · legado conservado</summary><p>Estos documentos históricos se conservan. No se regeneran ni se convierten automáticamente en el perfil externo vigente.</p>{legacyText&&<details><summary>Texto del perfil anterior</summary><p className="ep-legacy-text">{legacyText}</p></details>}{legacyProfiles.map(a=><details key={a.id}><summary>{a.portada.municipalityName} · {a.artifactVersion}</summary><PSLCArtifactViewer artifact={a}/></details>)}</details>}
  <footer className="ep-footnote">Documento elaborado fuera de COMPÁS · Contenido y gráficos trazables a su versión · Conservación completa en Firebase</footer>
 </section>;
}
