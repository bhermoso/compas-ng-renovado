import { useState } from 'react';
import type { MunicipalDocumentRepository } from '../../domain/repository';
import { assetEntriesOfDocument } from '../../application/evidence-pipeline/DocumentToEvidencePipeline';

type Incoming = {id_localiza_salud:string;nombre:string;url_origen:string};
type Row = Incoming & {status:'ya registrado (ID)'|'mismo nombre: comprobar centro y actividad'|'no localizado';detail:string};
const norm = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const sourceId = (s:string) => /(?:[?&]id=)(\d+)/.exec(s)?.[1] ?? '';
const isObj = (v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);

export function LocalizaAssetPreview({repository}:{repository:MunicipalDocumentRepository}){
 const [rows,setRows]=useState<Row[]>([]);
 const [error,setError]=useState('');
 const [checked,setChecked]=useState(false);
 async function examine(file?:File){
  setRows([]);setError('');setChecked(false);
  if(!file)return;
  if(file.size>2*1024*1024){setError('El inventario supera los 2 MB admitidos para cotejo.');return;}
  try{
   const parsed:unknown=JSON.parse(await file.text());
   if(!isObj(parsed)||parsed.schema!=='compas-activos-origen/v1'||!Array.isArray(parsed.registros)
    ||parsed.registros.length>1000)throw new Error('El archivo no es un inventario normalizado de activos COMPÁS.');
   const incoming:Incoming[]=parsed.registros.map((v:unknown)=>{
    if(!isObj(v)||typeof v.id_localiza_salud!=='string'||typeof v.nombre!=='string'||typeof v.url_origen!=='string')
     throw new Error('Hay una ficha sin identificador, nombre o enlace.');
    return {id_localiza_salud:v.id_localiza_salud,nombre:v.nombre,url_origen:v.url_origen};
   });
   const existing=repository.documents.filter(d=>(d.kind==='community-asset'||d.kind==='localiza-salud')&&d.status!=='archived'&&d.status!=='rejected')
    .flatMap(d=>assetEntriesOfDocument(d).map(line=>({
     id:sourceId(line),name:norm(line.split('\t')[0]||line),document:d.title
    })));
   const result=incoming.map(r=>{
    const byId=existing.find(e=>e.id&&e.id===r.id_localiza_salud);
    const byName=existing.find(e=>e.name&&e.name===norm(r.nombre));
    return {...r,
      status:(byId?'ya registrado (ID)':byName?'mismo nombre: comprobar centro y actividad':'no localizado') as Row['status'],
      detail:(byId??byName)?.document??''};
   });
   setRows(result);setChecked(true);
  }catch(e){setError(e instanceof Error?e.message:'No se puede analizar el inventario.');}
 }
 return <section className="activos-source" aria-labelledby="localiza-comparison-title">
  <h3 id="localiza-comparison-title">Cotejar inventario de Localiza Salud</h3>
  <p className="panel-note">Comparación local, solo lectura, con las fichas del expediente abierto. No incorpora activos, no modifica validaciones y no sustituye documentos.</p>
  <label>Seleccionar inventario normalizado (.json)
   <input type="file" accept=".json,application/json" onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';void examine(f);}}/>
  </label>
  {error&&<p role="alert">{error}</p>}
  {checked&&<div aria-live="polite">
   <p><strong>{rows.length} fichas revisadas</strong> · {rows.filter(r=>r.status==='ya registrado (ID)').length} coincidencias por ID · {rows.filter(r=>r.status==='mismo nombre: comprobar centro y actividad').length} que requieren cotejo de centro y actividad · {rows.filter(r=>r.status==='no localizado').length} no localizadas.</p>
   <p className="panel-note">Dos fichas pueden describir un mismo activo si coinciden actividad y centro, aunque tengan ID distintos. Actividades distintas en un centro, o la misma actividad en centros distintos, son activos diferentes. Esta pantalla compara fichas, NO determina el número de activos únicos ni su validación. «No localizado» solo expresa ausencia de coincidencia reconocible. No se autoriza importación automática.</p>
   <div className="table-wrap"><table><thead><tr><th>ID Localiza</th><th>Recurso</th><th>Cotejo</th><th>Fuente existente</th></tr></thead><tbody>
    {rows.map((r,i)=><tr key={r.id_localiza_salud+'-'+i}><td>{r.id_localiza_salud}</td><td>{r.nombre}</td><td>{r.status}</td><td>{r.detail||'—'}</td></tr>)}
   </tbody></table></div>
  </div>}
 </section>;
}
