import {useState} from 'react';
import type {RelasClient} from '../../infrastructure/relas/RelasClient';
import {readRemoteWorkspace} from '../../infrastructure/relas/RemoteWorkspace';
import {listTerritorialSpaces} from '../../infrastructure/relas/AdminAccounts';
import {inspectProfilePackage,type ProfilePackageReadiness} from '../../application/health-profile/profilePackageReadiness';
import {inspectRemoteProfile,PROFILE_AUDIT_SCOPES,profileParity,type ProfileAuditResult} from '../../application/health-profile/profileRemoteAudit';
import './ProfileRemoteAuditPanel.css';

function shortDate(value?:string){
 if(!value)return 'Sin fecha';
 const date=new Date(value);
 return Number.isNaN(date.valueOf())?'Fecha no válida':date.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
}
type Scope = {id:string;name:string};
type Diagnostic = {documents:number;reports:number;studies:number;studyRecords:string[];prioritisation:boolean;prioritisationStudy:boolean;attachments:string[];results:number;jsonFiles:number;resultsWithSource:number;resultsWithPeriod:number;resultsWithPage:number;resultsWithComparators:number};
function diagnosticOf(remote:NonNullable<Awaited<ReturnType<typeof readRemoteWorkspace>>>):Diagnostic{
 const documents=remote.repository?.documents??[];
 const active=remote.externalProfileLibrary?.profiles.find(p=>p.id===remote.externalProfileLibrary?.activeId);
 const namedStudyFields=['ibseStudy','dukeStudy','predimedStudy','sf12Study','suenoStudy','cageStudy','auditcStudy','ipaqStudy','ghq12Study','phq9Study','psqiStudy','fagerstromStudy','sbqStudy'] as const;
 const studyRecords=namedStudyFields.filter(name=>Boolean(remote[name]));
 return {
  documents:documents.length,
  reports:documents.filter(d=>d.kind==='health-report').length + (remote.healthReport && !documents.some(d=>d.kind==='health-report')?1:0),
  studies:documents.filter(d=>d.kind==='complementary-study').length,
  studyRecords:[...studyRecords],
  prioritisation:Boolean(remote.thematicPrioritisation),
  prioritisationStudy:Boolean(remote.thematicPrioritisationStudy),
  attachments:(remote.externalProfileLibrary?.attachments??[]).map(a=>a.name),
  results:active?.results.length??0,
  jsonFiles:(remote.externalProfileLibrary?.attachments??[]).filter(a=>a.mimeType==='application/json').length,
  resultsWithSource:active?.results.filter(r=>r.source.trim()).length??0,
  resultsWithPeriod:active?.results.filter(r=>r.period.trim()).length??0,
  resultsWithPage:active?.results.filter(r=>r.page.trim()).length??0,
  resultsWithComparators:active?.results.filter(r=>(r.comparisons?.length??0)>0||Boolean(r.comparison)).length??0,
 };
}
function summary(rows:ProfileAuditResult[],scopes:Scope[],diagnostics:Record<string,Diagnostic>):string{
 const lines=['Auditoría solo lectura de perfiles COMPÁS / Firebase',''];
 for(const scope of scopes){
  const row=rows.find(x=>x.scope===scope.id);
  if(!row){lines.push(scope.name+': no comprobado');continue;}
  lines.push(scope.name+': '+row.remote+'; estructura externa '+(row.libraryValid?'válida':'no confirmada')+
   '; versiones externas '+row.externalVersions+'; versiones legado '+row.legacyVersions+
   '; vigente '+(row.activeFound?'sí':'no')+'; PDF vigente '+(row.activePdf?'sí':'no')+
   '; texto vigente '+(row.activeText?'sí':'no')+'; resultados estructurados '+(row.activeResults?'sí':'no')+
   '; originales verificados '+row.originalsChecked+'; fallidos '+row.originalsFailed+
   (row.remoteUpdatedAt?'; actualización '+row.remoteUpdatedAt:''));
  const d=diagnostics[scope.id];if(d)lines.push('  Documentos '+d.documents+'; informes '+d.reports+'; estudios complementarios catalogados '+d.studies+'; priorización '+(d.prioritisation?'sí':'no')+'; resultados perfil '+d.results+'; adjuntos '+d.attachments.length); 
  for(const issue of row.observations)lines.push('  - '+issue);
  if(row.error)lines.push('  - Error de lectura: '+row.error);
 }
 const reference=rows.filter(r=>PROFILE_AUDIT_SCOPES.some(scope=>scope.id===r.scope));
 if(reference.length===3){lines.push('', 'Tres casos de referencia: '+profileParity(reference).status);for(const note of profileParity(reference).notes)lines.push('- '+note);}
 lines.push('No comprueba igualdad textual entre PDF y transcripción ni calidad científica del contenido.');
 return lines.join('\n');
}
export function ProfileRemoteAuditPanel({client}:{client:RelasClient}){
 const [rows,setRows]=useState<ProfileAuditResult[]>([]);
 const [scopes,setScopes]=useState<Scope[]>([]);
 const [diagnostics,setDiagnostics]=useState<Record<string,Diagnostic>>({});
 const [packageReadiness,setPackageReadiness]=useState<Record<string,ProfilePackageReadiness>>({});
 const [running,setRunning]=useState(false);
 const [completed,setCompleted]=useState(false);
 const [message,setMessage]=useState('');
 async function run(){
  if(running)return;
  setRunning(true);setCompleted(false);setRows([]);setScopes([]);setDiagnostics({});setPackageReadiness({});setMessage('Consultando catálogo y expedientes de Firebase, sin modificar datos…');
  const found:ProfileAuditResult[]=[];
  let targets:Scope[];
  try { targets=(await listTerritorialSpaces(client)).map(s=>({id:s.id,name:s.name})); }
  catch(error){setMessage('No se pudo leer el catálogo de ámbitos: '+(error instanceof Error?error.message:'Error de permisos'));setRunning(false);return;}
  // Los tres ejemplos se incluyen incluso cuando el catálogo todavía no los expone.
  targets=[...targets,...PROFILE_AUDIT_SCOPES.filter(f=>!targets.some(x=>x.id===f.id))];
  setScopes(targets);
  const details:Record<string,Diagnostic>={};
  const packages:Record<string,ProfilePackageReadiness>={};
  for(const scope of targets){
   let item:ProfileAuditResult;
   try{
    const remote=await readRemoteWorkspace(client,scope.id);
    item=await inspectRemoteProfile(remote,scope.id,scope.name);
    if(remote){details[scope.id]=diagnosticOf(remote);setDiagnostics({...details});packages[scope.id]=inspectProfilePackage(remote);setPackageReadiness({...packages});}
   }catch(error){
    item={scope:scope.id,name:scope.name,remote:'error',error:error instanceof Error?error.message:'Lectura no disponible',
     libraryValid:false,originalsVerified:false,originalsChecked:0,originalsFailed:0,
     externalVersions:0,legacyVersions:0,hasLegacyText:false,activeFound:false,
     activePdf:false,activeText:false,activeResults:false,versions:[],observations:[]};
   }
   found.push(item);
   setRows([...found]);
   setMessage('Consultados '+found.length+' de '+targets.length+' expedientes directamente desde Firebase.');
  }
  setCompleted(true);setRunning(false);
  setMessage('Auditoría terminada. No se ha escrito ni eliminado ningún expediente.');
 }
 async function copy(){
  try{await navigator.clipboard.writeText(summary(rows,scopes,diagnostics));setMessage('Resumen de diagnóstico copiado, sin texto ni archivos de los perfiles.');}
  catch{setMessage('No se pudo copiar automáticamente. Puedes consultar los resultados en la tabla.');}
 }
 const reference=rows.filter(r=>PROFILE_AUDIT_SCOPES.some(scope=>scope.id===r.scope));
 const parity=profileParity(reference);
 return <section className="admin-section audit-profiles" aria-labelledby="audit-profiles-title">
  <h2 id="audit-profiles-title">Verificación de expedientes y perfiles · Todos los ámbitos</h2>
  <p>Comprobación <strong>de solo lectura</strong> de todos los ámbitos disponibles en el catálogo de Firebase, incluidos los tres casos de referencia. Se obtienen directamente del servidor los fragmentos de Firebase y se verifica su integridad; los originales adjuntos se comprueban con SHA-256. No se comparan cifras de municipios distintos ni se modifican sus versiones.</p>
  <div className="audit-profiles__actions">
   <button type="button" onClick={()=>void run()} disabled={running}>{running?'Verificando expedientes…':completed?'Repetir comprobación en Firebase':'Comprobar todos los expedientes en Firebase'}</button>
   {completed&&<button className="secondary" type="button" onClick={()=>void copy()}>Copiar resumen del diagnóstico</button>}
  </div>
  <p role="status" aria-live="polite">{message||'Aún no se ha consultado Firebase desde esta pantalla.'}</p>
  {rows.length>0&&<div className="table-wrap">
   <table className="audit-profiles__table">
    <caption>Resultados leídos en esta sesión administrativa; «no comprobado» no equivale a expediente ausente.</caption>
    <thead><tr><th>Municipio</th><th>Expediente Firebase</th><th>Perfiles</th><th>Versión externa vigente</th><th>Documento y resultados</th><th>Originales</th><th>Fuentes del expediente</th><th>Paquete estructurado</th></tr></thead>
    <tbody>{scopes.map(scope=>{
     const x=rows.find(row=>row.scope===scope.id);
     return <tr key={scope.id}><th scope="row">{scope.name}</th>
      {!x?<td colSpan={7}>Pendiente de comprobación</td>:<>
      <td><strong>{x.remote==='ok'?'Cargado íntegramente':x.remote==='missing'?'Sin expediente remoto':'Error de lectura'}</strong>
       <small>{x.remote==='ok'?shortDate(x.remoteUpdatedAt):x.error||'No existe una copia compartida'}</small></td>
      <td>{x.externalVersions} externos · {x.legacyVersions} legado
       <small>{x.libraryValid?'Biblioteca validada':'Biblioteca no confirmada'}</small></td>
      <td>{x.activeFound?'Sí · '+(x.activeStatus==='validated'?'Validado':'En revisión'):'No'}</td>
      <td>{x.activePdf?'PDF original':'Sin PDF'} · {x.activeText?'Texto':'Sin texto'} · {x.activeResults?'Resultados':'Sin resultados'}</td>
      <td>{x.remote!=='ok'?'No verificados':x.originalsVerified?'Correctos':'Con incidencias'}
       <small>{x.originalsChecked} comprobados; {x.originalsFailed} fallidos</small></td>
      <td>{diagnostics[scope.id] ? <>{diagnostics[scope.id].documents} documentos · {diagnostics[scope.id].reports} informes · {diagnostics[scope.id].studies} estudios<small>Estudios cargados: {diagnostics[scope.id].studyRecords.length} · Prioridad adoptada: {diagnostics[scope.id].prioritisation?'sí':'no'} · Estudio temático: {diagnostics[scope.id].prioritisationStudy?'sí':'no'}</small></> : 'No verificadas'}</td>
      <td>{diagnostics[scope.id] ? <>{diagnostics[scope.id].jsonFiles} JSON adjuntos · {diagnostics[scope.id].results} indicadores<small>{diagnostics[scope.id].resultsWithSource} con fuente · {diagnostics[scope.id].resultsWithPeriod} con periodo · {diagnostics[scope.id].resultsWithPage} con página · {diagnostics[scope.id].resultsWithComparators} comparables</small></> : 'No evaluable'}</td>
      </>}
     </tr>;
    })}</tbody></table>
   </div>}
  {completed&&reference.length===3&&<div className="audit-profiles__conclusion">
   <h3>Comparación técnica de los tres casos de referencia</h3>
   <p><strong>{parity.status==='equivalentes'?'Equivalentes en los mínimos técnicos':parity.status==='distintos'?'No equivalentes o con carencias':'No evaluable todavía'}</strong></p>
   {parity.notes.map((note,i)=><p key={i}>{note}</p>)}
  </div>}
  {rows.map(row=><details key={row.scope} className="audit-profiles__detail">
   <summary>{row.name} · {row.externalVersions} versiones externas · {row.observations.length} observaciones</summary>
   {row.error&&<p role="alert">{row.error}</p>}
   {row.observations.map((note,i)=><p key={i}>{note}</p>)}
   {diagnostics[row.scope]&&<p>Fuentes registradas: {diagnostics[row.scope].documents} documentos, {diagnostics[row.scope].reports} informes de salud, {diagnostics[row.scope].studies} estudios complementarios catalogados ; estudios cargados {diagnostics[row.scope].studyRecords.join(', ')||'ninguno'}; priorización adoptada {diagnostics[row.scope].prioritisation?'sí':'no'}; estudio temático {diagnostics[row.scope].prioritisationStudy?'sí':'no'}.</p>}
   {diagnostics[row.scope]&&<p>Resultados del perfil vigente: {diagnostics[row.scope].results} indicadores; {diagnostics[row.scope].resultsWithSource} con fuente; {diagnostics[row.scope].resultsWithPeriod} con periodo; {diagnostics[row.scope].resultsWithPage} con página; {diagnostics[row.scope].resultsWithComparators} con comparadores; {diagnostics[row.scope].jsonFiles} archivos JSON adjuntos.</p>}
   {diagnostics[row.scope]&&diagnostics[row.scope].attachments.length>0&&<p>Archivos del paquete: {diagnostics[row.scope].attachments.join(' · ')}</p>}
   {packageReadiness[row.scope]&&<p><strong>Lectura de suficiencia:</strong> {packageReadiness[row.scope].stage==='sin-perfil'?'Sin perfil externo':packageReadiness[row.scope].stage==='documental'?'Perfil documental':'Perfil con indicadores estructurados'} · Original vinculado: {packageReadiness[row.scope].hasOriginal?'sí':'no'} · JSON adjunto: {packageReadiness[row.scope].hasPackageJson?'sí':'no'} · Cuatro páginas reconocidas: {packageReadiness[row.scope].hasFourDataPages?'sí':'no'} · Indicadores numéricos: {packageReadiness[row.scope].numericIndicators} · Con denominador: {packageReadiness[row.scope].withDenominator}.</p>}
   {packageReadiness[row.scope]?.warnings.map((warning,i)=><p key={i}>Revisión pendiente: {warning}</p>)}
   {row.versions.length>0?<table><thead><tr><th>Versión</th><th>Estado</th><th>Texto</th><th>PDF</th><th>Indicadores</th></tr></thead><tbody>
    {row.versions.map(p=><tr key={p.id}><td>{p.title}</td><td>{p.active?'Vigente':'Histórica'} · {p.archived?'Archivada':p.status==='validated'?'Validada':'En revisión'}</td><td>{p.textPresent?'Sí':'No'}</td><td>{p.pdfs}</td><td>{p.results}</td></tr>)}
   </tbody></table>:<p>No hay revisiones externas que mostrar.</p>}
  </details>)}
  <p className="audit-profiles__caveat">La ausencia de un perfil externo no implica que falten fuentes diagnósticas. Los estudios se distinguen entre documentos catalogados y módulos de estudio cargados; el estudio de priorización no equivale a una selección de prioridades adoptada. Esta comprobación verifica conservación e integridad estructural. No certifica que la transcripción coincida palabra por palabra con el PDF original ni que los datos epidemiológicos estén científicamente validados. No usa copias del navegador ni semillas de demostración como prueba de Firebase.</p>
 </section>;
}
