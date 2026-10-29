import { externalProfileDocument } from '../../application/health-profile/externalProfileDocument';
import { useEffect, useRef, useState } from 'react';
import type { ExternalHealthProfile, ExternalProfileLibrary, ProfileAttachment, ProfileResult } from '../../domain/health-profile/ExternalHealthProfile';
import type { LocalHealthProfileArtifact } from '../../domain/health-profile-artifact';
import { appendExternalProfile, importProfileFile, profileAttachmentBlob } from '../../application/health-profile/externalProfiles';
import { PSLCArtifactViewer } from './PSLCArtifactViewer';
import './ExternalProfileDashboard.css';

interface Props {
 municipalityId: string;
 municipalityName: string;
 library: ExternalProfileLibrary;
 legacyProfiles?: LocalHealthProfileArtifact[];
 legacyText?: string;
 authorName: string;
 onSave: (library: ExternalProfileLibrary) => Promise<void>;
 onDirtyChange?: (dirty: boolean) => void;
}
const date = (s: string) => new Date(s).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'});
const lines = (s: string) => s.split('\n').map(v => v.trim()).filter(Boolean);
function download(blob: Blob, name: string) {
 const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;a.click();
 window.setTimeout(() => URL.revokeObjectURL(url),1000);
}
function emptyProfile(municipalityId: string): ExternalHealthProfile {
 return {schema:'compas-external-profile/v1',id:crypto.randomUUID(),municipalityId,title:'',period:'',author:'',createdAt:new Date().toISOString(),
  status:'review',summary:'',text:'',results:[],findings:[],limitations:[],areas:[],attachmentIds:[]};
}
function ResultCard({ result }: {result: ProfileResult}) {
 const numeric = result.chartValue;
 const comparison=result.comparison;
 const max = Math.max(0,numeric ?? 0,comparison?.value ?? 0);
 return <article className="ep-result">
  <div className="ep-result__context"><span>{result.topic || 'Resultado del perfil'}</span><span>{result.period || 'Periodo no indicado'}</span></div>
  <h3>{result.title}</h3><p className="ep-result__value">{result.value}<span>{result.unit}</span></p>
  {result.temporalContext === 'historical' && <p className="ep-result__historical">Antecedente histórico · no describe por sí solo la situación actual</p>}
  {numeric !== undefined && comparison && numeric >= 0 && comparison.value >= 0 && max > 0 && <figure className="ep-comparison" aria-label={`Comparación de ${result.title}`}>
   <div><span>Ámbito del perfil</span><div className="ep-bar"><i style={{width:`${numeric/max*100}%`}}/></div><b>{numeric.toLocaleString('es-ES')} {result.unit}</b></div>
   <div><span>{comparison.label}</span><div className="ep-bar ep-bar--reference"><i style={{width:`${comparison.value/max*100}%`}}/></div><b>{comparison.value.toLocaleString('es-ES')} {result.unit}</b></div>
  </figure>}
  <p className="ep-result__source">Fuente: {result.source || 'Pendiente de indicar'}{result.page && ` · ${result.page}`}</p>
  <p className="ep-result__source">Escala: {result.scale || 'No indicada'}{result.denominator && ` · Base: ${result.denominator}`}</p>
  {result.caution && <p className="ep-result__caution">{result.caution}</p>}
 </article>;
}

export function ExternalProfileDashboard({municipalityId,municipalityName,library,legacyProfiles=[],legacyText,authorName,onSave,onDirtyChange}: Props) {
 const [selectedId,setSelectedId]=useState(library.activeId);
 const [tab,setTab]=useState<'results'|'document'|'versions'>('results');
 const [draft,setDraft]=useState<ExternalHealthProfile>();
 const [newFiles,setNewFiles]=useState<ProfileAttachment[]>([]);
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [error,setError]=useState('');
 const [topic,setTopic]=useState('Todos'); const [fileUrls,setFileUrls]=useState<Record<string,string>>({});
 const [resultDraft,setResultDraft]=useState<ProfileResult>();
 const fileInput=useRef<HTMLInputElement>(null);
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
 const pdf=files.find(f=>f.mimeType==='application/pdf');
 async function loadFiles(list: FileList | null) {
  if(!list?.length)return;
  if(draft&&!window.confirm('Se sustituirá el borrador sin guardar. Las versiones guardadas se conservan. ¿Continuar?'))return;
  setBusy(true);setError('');setMessage('Leyendo el perfil y comprobando sus archivos…');
  try{
   const imported=[];for(const file of Array.from(list))imported.push(await importProfileFile(file,municipalityId));
   const content=imported.find(x=>x.attachment.mimeType==='application/json')?.content ?? imported.find(x=>x.content.text)?.content ?? imported[0].content;
   const attachments=imported.map(x=>x.attachment);
   setNewFiles(attachments);setResultDraft(undefined);setDraft({...emptyProfile(municipalityId),...content,attachmentIds:attachments.map(a=>a.id)});
   setMessage(imported.map(x=>x.notice).filter(Boolean).join(' ') || 'Archivo leído. Revisa los datos y guarda el perfil en Firebase.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudo leer el perfil.');setMessage('');}
  finally{setBusy(false);if(fileInput.current)fileInput.current.value='';}
 }
 function edit() {
  if(!selected)return;
  setDraft({...structuredClone(selected),id:crypto.randomUUID(),revisionOf:selected.id,createdAt:new Date().toISOString(),status:'review',validatedBy:undefined,validatedAt:undefined});
  setNewFiles([]);setResultDraft(undefined);setError('');setMessage('Estás preparando una nueva revisión. La versión anterior y sus originales se conservan.');
 }
 async function saveDraft(e: React.FormEvent) {
  e.preventDefault();if(!draft?.title.trim())return;
  if(resultDraft){setError('Añade o cancela el indicador que estás editando antes de guardar el perfil.');return;}
  setBusy(true);setError('');setMessage('Guardando el documento, los resultados y la versión en Firebase…');
  try{
   const next=appendExternalProfile(library,{...draft,title:draft.title.trim()},newFiles,municipalityId);
   await onSave(next);setSelectedId(draft.id);setDraft(undefined);setNewFiles([]);setTab('results');setTopic('Todos');
   setMessage('Perfil completo guardado en Firebase, incluidos archivos, resultados e historial.');
  }catch(e){setError(e instanceof Error?e.message:'No se ha podido guardar. Tu borrador permanece en pantalla.');setMessage('');}
  finally{setBusy(false);}
 }
 async function exportRevision(format:'pdf'|'docx') {
  if (!selected) return;
  setBusy(true);setError('');setMessage('Maquetando la revisión guardada…');
  try {
   const model = externalProfileDocument(selected,municipalityName);
   if(format==='pdf') {
    const {buildPSLCPdf}=await import('../../application/psl-c-export/pslcPdf');
    download(buildPSLCPdf(model).output('blob'),model.fileName.replace(/\.docx$/,'.pdf'));
   } else {
    const [{buildPSLCDocx},{Packer}]=await Promise.all([import('../../application/psl-c-export/pslcDocx'),import('docx')]);
    download(await Packer.toBlob(buildPSLCDocx(model)),model.fileName);
   }
   setMessage('Descarga preparada con el contenido de esta revisión guardada en Firebase.');
  } catch {setError('No se ha podido preparar la descarga. Los originales y el perfil guardado siguen disponibles.');setMessage('');}
  finally {setBusy(false);}
 }
 async function commit(next:ExternalProfileLibrary,success:string) {
  setBusy(true);setError('');setMessage('Guardando en Firebase…');
  try{await onSave(next);setMessage(success);}catch(e){setError(e instanceof Error?e.message:'No se ha podido guardar en Firebase.');setMessage('');}finally{setBusy(false);}
 }
 function patch(change:Partial<ExternalHealthProfile>){setDraft(p=>p?{...p,...change}:p);}
 const topics=['Todos',...new Set((selected?.results ?? []).map(r=>r.topic).filter((s):s is string=>!!s))];
 const results=(selected?.results ?? []).filter(r=>topic==='Todos'||r.topic===topic);
 return <section className="external-profile" aria-label="Perfil de Salud Local">
  <header className="ep-header"><div className="ep-identity"/><div className="ep-header__body">
   <div><p className="ep-eyebrow">PERFIL DE SALUD LOCAL · {municipalityName}</p><h1>El perfil y sus resultados</h1>
   <p>El documento de referencia del territorio, sus principales hallazgos y su trayectoria de revisión.</p></div>
   <label className={`ep-upload ${busy?'ep-disabled':''}`}><span aria-hidden="true">↑</span> Cargar perfil
    <input ref={fileInput} type="file" aria-label="Cargar perfil" multiple accept=".pdf,.docx,.txt,.md,.json" disabled={busy} onChange={e=>void loadFiles(e.currentTarget.files)}/>
   </label></div>
  </header>
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
   <div className="ep-attached"><strong>Archivos originales incluidos en Firebase</strong>{draft.attachmentIds.map(id=><span key={id}>{[...library.attachments,...newFiles].find(a=>a.id===id)?.name}</span>)}{!draft.attachmentIds.length&&<span>Sin archivo adjunto; se conservarán el texto y los resultados.</span>}</div>
   <div className="ep-editor__footer"><p>Se guardará una versión en revisión. Subir un archivo no equivale a validarlo.</p><button className="ep-primary" disabled={!draft.title.trim()} type="submit">{busy?'Guardando…':'Guardar perfil en Firebase'}</button></div>
   </fieldset>
  </form> : !selected ? <div className="ep-empty"><div className="ep-paper" aria-hidden="true"><span>COMPÁS</span><i/><i/><i/><i/><i/></div>
   <div><p className="ep-eyebrow">DOCUMENTO EXTERNO · UNA VERSIÓN DE REFERENCIA</p><h2>Incorpora el Perfil de Salud Local</h2>
   <p>Carga el documento elaborado fuera de COMPÁS. Podrás consultarlo, descargar sus originales, editar una revisión y presentar sus resultados con la identidad institucional.</p>
   <p className="ep-formats">PDF · Word DOCX · texto · Markdown · paquete de resultados JSON</p>
   <button className="ep-primary" type="button" disabled={busy} onClick={()=>fileInput.current?.click()}>Seleccionar el perfil</button>
   <p className="ep-help">Hasta 20 MB por archivo. Originales, texto, resultados y versiones se guardan en Firebase. El navegador es una caché.</p></div>
  </div> : <>
   <div className="ep-layout"><aside className="ep-document-card"><p className="ep-eyebrow">DOCUMENTO DE REFERENCIA</p>
    <div className="ep-cover"><span>COMPÁS</span><div><small>{municipalityName}</small><h2>{selected.title}</h2><p>{selected.period||'Periodo no declarado'}</p></div><small>PERFIL DE SALUD LOCAL</small></div>
    <p className="ep-status">{selected.id===library.activeId?'Versión vigente':'Versión anterior'} · {selected.status==='validated'?'Validada técnicamente':'En revisión'}</p>
    <dl className="ep-metadata"><div><dt>Autoría</dt><dd>{selected.author||'No declarada'}</dd></div><div><dt>Incorporación</dt><dd>{date(selected.createdAt)}</dd></div>{selected.validatedBy&&<div><dt>Validación</dt><dd>{selected.validatedBy} · {date(selected.validatedAt!)}</dd></div>}</dl>
    <div className="ep-file-actions"><button type="button" disabled={busy} onClick={()=>void exportRevision('pdf')}>↓ Descargar esta revisión · PDF</button><button type="button" disabled={busy} onClick={()=>void exportRevision('docx')}>↓ Descargar esta revisión · Word</button>{files.map(file=><a key={file.id} aria-disabled={!fileUrls[file.id]} href={fileUrls[file.id]} download={file.name}>↓ Descargar original · {file.name}</a>)}
     {selected.text&&<button type="button" onClick={()=>download(new Blob([selected.text],{type:'text/plain;charset=utf-8'}),`${selected.title}.txt`)}>↓ Descargar texto de esta revisión</button>}
     <button type="button" onClick={()=>download(new Blob([JSON.stringify({schema:'compas-profile-package/v1',municipalityId,title:selected.title,period:selected.period,author:selected.author,summary:selected.summary,text:selected.text,results:selected.results,findings:selected.findings,limitations:selected.limitations,areas:selected.areas},null,2)],{type:'application/json'}),`${selected.title}-resultados.json`)}>↓ Descargar paquete de resultados</button>
    </div><button className="ep-primary" disabled={busy} onClick={edit}>Editar una nueva revisión</button>
    <p className="ep-help">Los originales no se modifican. Cada edición conserva la versión anterior.</p>
   </aside><div className="ep-main"><nav className="ep-tabs" aria-label="Vistas del perfil">{([['results','Resultados'],['document','Documento'],['versions','Versiones']] as const).map(([key,label])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {tab==='results'&&<><div className="ep-reading"><p className="ep-eyebrow">LECTURA DE CONJUNTO</p><h2>Qué nos dice el perfil</h2><p>{selected.summary||'El documento está disponible. Su síntesis visual todavía no se ha incorporado.'}</p></div>
     {selected.findings.filter(Boolean).length>0&&<section className="ep-findings"><h3>Principales hallazgos</h3><ol>{selected.findings.filter(Boolean).map((f,i)=><li key={i}>{f}</li>)}</ol></section>}
     <div className="ep-section-heading"><div><p className="ep-eyebrow">DATOS CON CONTEXTO</p><h2>Resultados del perfil</h2></div></div>
     {topics.length>1&&<div className="ep-topics" aria-label="Filtrar resultados por tema">{topics.map(t=><button key={t} aria-pressed={topic===t} onClick={()=>setTopic(t)}>{t}</button>)}</div>}
     {results.length?<div className="ep-results">{results.map(r=><ResultCard key={r.id} result={r}/>)}</div>:<div className="ep-pending"><h3>La presentación de resultados está pendiente</h3><p>El perfil se ha conservado completo. Incorpora el paquete de resultados preparado fuera de COMPÁS o añade sus indicadores al editar una revisión. No se han inventado gráficos a partir del texto.</p><button onClick={edit}>Incorporar resultados</button></div>}
     {selected.limitations.filter(Boolean).length>0&&<section className="ep-limitations"><h3>Cómo interpretar estos resultados</h3><ul>{selected.limitations.filter(Boolean).map((l,i)=><li key={i}>{l}</li>)}</ul></section>}
    </>}
    {tab==='document'&&<section className="ep-document-view"><h2>{selected.title}</h2>
     {pdf&&fileUrls[pdf.id]&&<><p><a href={fileUrls[pdf.id]} target="_blank" rel="noopener noreferrer">Abrir PDF original en otra pestaña</a> · Si el visor no carga, utiliza la descarga del original.</p><iframe title="PDF original del Perfil de Salud Local" src={fileUrls[pdf.id]}/></>}
     {selected.revisionOf&&<p className="ep-help">El texto puede contener cambios de esta revisión. Los archivos adjuntos siguen siendo los originales aportados.</p>}
     {selected.text?<div className="ep-document-text">{selected.text.split(/\n\s*\n/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div>:<p>No hay texto extraíble. Consulta el archivo original o incorpora una transcripción.</p>}
    </section>}
    {tab==='versions'&&<section className="ep-versions"><p className="ep-eyebrow">HISTORIAL CONSERVADO EN FIREBASE</p><h2>Versiones del perfil</h2>{[...library.profiles].reverse().map(p=><article key={p.id}><div><h3>{p.title}</h3><p>{date(p.createdAt)} · {p.author||'Autoría no declarada'} · {p.status==='validated'?'Validada':'En revisión'}{p.id===library.activeId?' · Vigente':''}</p></div><div className="ep-actions"><button onClick={()=>{setSelectedId(p.id);setTab('document');setTopic('Todos');}}>Consultar versión</button>{p.id!==library.activeId&&<button disabled={busy} onClick={()=>void commit({...library,activeId:p.id},'Versión vigente actualizada en Firebase.')}>Establecer como vigente</button>}</div></article>)}</section>}
   </div></div>
   {selected.id===library.activeId&&selected.status==='review'&&<section className="ep-validation"><div><h3>Revisión técnica</h3><p>La incorporación no valida el contenido. La validación quedará vinculada a esta versión y a tu cuenta.</p></div><button disabled={busy} onClick={()=>{if(!authorName.trim()){setError('Identifícate para registrar la validación.');return;}if(window.confirm('¿Registrar la validación técnica de esta versión con tu cuenta?'))void commit({...library,profiles:library.profiles.map(p=>p.id===selected.id?{...p,status:'validated',validatedAt:new Date().toISOString(),validatedBy:authorName}:p)},'Validación técnica registrada en Firebase.');}}>Registrar validación técnica</button></section>}
  </>}
  {(legacyProfiles.length>0||legacyText)&&<details className="ep-legacy"><summary>Consultar perfiles anteriores de COMPÁS · legado conservado</summary><p>Estos documentos históricos se conservan. No se regeneran ni se convierten automáticamente en el perfil externo vigente.</p>{legacyText&&<details><summary>Texto del perfil anterior</summary><p className="ep-legacy-text">{legacyText}</p></details>}{legacyProfiles.map(a=><details key={a.id}><summary>{a.portada.municipalityName} · {a.artifactVersion}</summary><PSLCArtifactViewer artifact={a}/></details>)}</details>}
  <footer className="ep-footnote">Documento elaborado fuera de COMPÁS · Contenido y gráficos trazables a su versión · Conservación completa en Firebase</footer>
 </section>;
}
