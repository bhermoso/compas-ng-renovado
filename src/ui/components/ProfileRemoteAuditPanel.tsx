import {useState} from 'react';
import type {RelasClient} from '../../infrastructure/relas/RelasClient';
import {readRemoteWorkspace} from '../../infrastructure/relas/RemoteWorkspace';
import {inspectRemoteProfile,PROFILE_AUDIT_SCOPES,profileParity,type ProfileAuditResult} from '../../application/health-profile/profileRemoteAudit';
import './ProfileRemoteAuditPanel.css';

function shortDate(value?:string){
 if(!value)return 'Sin fecha';
 const date=new Date(value);
 return Number.isNaN(date.valueOf())?'Fecha no válida':date.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
}
function summary(rows:ProfileAuditResult[]):string{
 const lines=['Auditoría solo lectura de perfiles COMPÁS / Firebase',''];
 for(const scope of PROFILE_AUDIT_SCOPES){
  const row=rows.find(x=>x.scope===scope.id);
  if(!row){lines.push(scope.name+': no comprobado');continue;}
  lines.push(scope.name+': '+row.remote+'; estructura externa '+(row.libraryValid?'válida':'no confirmada')+
   '; versiones externas '+row.externalVersions+'; versiones legado '+row.legacyVersions+
   '; vigente '+(row.activeFound?'sí':'no')+'; PDF vigente '+(row.activePdf?'sí':'no')+
   '; texto vigente '+(row.activeText?'sí':'no')+'; resultados estructurados '+(row.activeResults?'sí':'no')+
   '; originales verificados '+row.originalsChecked+'; fallidos '+row.originalsFailed+
   (row.remoteUpdatedAt?'; actualización '+row.remoteUpdatedAt:''));
  for(const issue of row.observations)lines.push('  - '+issue);
  if(row.error)lines.push('  - Error de lectura: '+row.error);
 }
 lines.push('', 'Equivalencia documental: '+profileParity(rows).status);
 for(const note of profileParity(rows).notes)lines.push('- '+note);
 lines.push('No comprueba igualdad textual entre PDF y transcripción ni calidad científica del contenido.');
 return lines.join('\n');
}
export function ProfileRemoteAuditPanel({client}:{client:RelasClient}){
 const [rows,setRows]=useState<ProfileAuditResult[]>([]);
 const [running,setRunning]=useState(false);
 const [completed,setCompleted]=useState(false);
 const [message,setMessage]=useState('');
 async function run(){
  if(running)return;
  setRunning(true);setCompleted(false);setRows([]);setMessage('Consultando Firebase, sin modificar expedientes…');
  const found:ProfileAuditResult[]=[];
  for(const scope of PROFILE_AUDIT_SCOPES){
   let item:ProfileAuditResult;
   try{
    const remote=await readRemoteWorkspace(client,scope.id);
    item=await inspectRemoteProfile(remote,scope.id,scope.name);
   }catch(error){
    item={scope:scope.id,name:scope.name,remote:'error',error:error instanceof Error?error.message:'Lectura no disponible',
     libraryValid:false,originalsVerified:false,originalsChecked:0,originalsFailed:0,
     externalVersions:0,legacyVersions:0,hasLegacyText:false,activeFound:false,
     activePdf:false,activeText:false,activeResults:false,versions:[],observations:[]};
   }
   found.push(item);
   setRows([...found]);
   setMessage('Consultados '+found.length+' de '+PROFILE_AUDIT_SCOPES.length+' expedientes directamente desde Firebase.');
  }
  setCompleted(true);setRunning(false);
  setMessage('Auditoría terminada. No se ha escrito ni eliminado ningún expediente.');
 }
 async function copy(){
  try{await navigator.clipboard.writeText(summary(rows));setMessage('Resumen de diagnóstico copiado, sin texto ni archivos de los perfiles.');}
  catch{setMessage('No se pudo copiar automáticamente. Puedes consultar los resultados en la tabla.');}
 }
 const parity=profileParity(rows);
 return <section className="admin-section audit-profiles" aria-labelledby="audit-profiles-title">
  <h2 id="audit-profiles-title">Verificación de expedientes y perfiles · Alfacar, Loja y Zagra</h2>
  <p>Comprobación <strong>de solo lectura</strong> de los tres expedientes compartidos. Se obtienen directamente del servidor los fragmentos de Firebase y se verifica su integridad; los originales adjuntos se comprueban con SHA-256. No se comparan cifras de municipios distintos ni se modifican sus versiones.</p>
  <div className="audit-profiles__actions">
   <button type="button" onClick={()=>void run()} disabled={running}>{running?'Verificando expedientes…':completed?'Repetir comprobación en Firebase':'Comprobar los tres expedientes en Firebase'}</button>
   {completed&&<button className="secondary" type="button" onClick={()=>void copy()}>Copiar resumen del diagnóstico</button>}
  </div>
  <p role="status" aria-live="polite">{message||'Aún no se ha consultado Firebase desde esta pantalla.'}</p>
  {rows.length>0&&<div className="table-wrap">
   <table className="audit-profiles__table">
    <caption>Resultados leídos en esta sesión administrativa; «no comprobado» no equivale a expediente ausente.</caption>
    <thead><tr><th>Municipio</th><th>Expediente Firebase</th><th>Perfiles</th><th>Versión externa vigente</th><th>Documento y resultados</th><th>Originales</th></tr></thead>
    <tbody>{PROFILE_AUDIT_SCOPES.map(scope=>{
     const x=rows.find(row=>row.scope===scope.id);
     return <tr key={scope.id}><th scope="row">{scope.name}</th>
      {!x?<td colSpan={5}>Pendiente de comprobación</td>:<>
      <td><strong>{x.remote==='ok'?'Cargado íntegramente':x.remote==='missing'?'Sin expediente remoto':'Error de lectura'}</strong>
       <small>{x.remote==='ok'?shortDate(x.remoteUpdatedAt):x.error||'No existe una copia compartida'}</small></td>
      <td>{x.externalVersions} externos · {x.legacyVersions} legado
       <small>{x.libraryValid?'Biblioteca validada':'Biblioteca no confirmada'}</small></td>
      <td>{x.activeFound?'Sí · '+(x.activeStatus==='validated'?'Validado':'En revisión'):'No'}</td>
      <td>{x.activePdf?'PDF original':'Sin PDF'} · {x.activeText?'Texto':'Sin texto'} · {x.activeResults?'Resultados':'Sin resultados'}</td>
      <td>{x.remote!=='ok'?'No verificados':x.originalsVerified?'Correctos':'Con incidencias'}
       <small>{x.originalsChecked} comprobados; {x.originalsFailed} fallidos</small></td>
      </>}
     </tr>;
    })}</tbody></table>
   </div>}
  {completed&&<div className="audit-profiles__conclusion">
   <h3>Equivalencia técnica y documental</h3>
   <p><strong>{parity.status==='equivalentes'?'Equivalentes en los mínimos técnicos':parity.status==='distintos'?'No equivalentes o con carencias':'No evaluable todavía'}</strong></p>
   {parity.notes.map((note,i)=><p key={i}>{note}</p>)}
  </div>}
  {rows.map(row=><details key={row.scope} className="audit-profiles__detail">
   <summary>{row.name} · {row.externalVersions} versiones externas · {row.observations.length} observaciones</summary>
   {row.error&&<p role="alert">{row.error}</p>}
   {row.observations.map((note,i)=><p key={i}>{note}</p>)}
   {row.versions.length>0?<table><thead><tr><th>Versión</th><th>Estado</th><th>Texto</th><th>PDF</th><th>Indicadores</th></tr></thead><tbody>
    {row.versions.map(p=><tr key={p.id}><td>{p.title}</td><td>{p.active?'Vigente':'Histórica'} · {p.archived?'Archivada':p.status==='validated'?'Validada':'En revisión'}</td><td>{p.textPresent?'Sí':'No'}</td><td>{p.pdfs}</td><td>{p.results}</td></tr>)}
   </tbody></table>:<p>No hay revisiones externas que mostrar.</p>}
  </details>)}
  <p className="audit-profiles__caveat">Esta comprobación verifica conservación e integridad estructural. No certifica que la transcripción coincida palabra por palabra con el PDF original ni que los datos epidemiológicos estén científicamente validados. No usa copias del navegador ni semillas de demostración como prueba de Firebase.</p>
 </section>;
}
