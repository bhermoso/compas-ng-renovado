import { actionPlanElementCode } from "../../domain/action-plan-catalog/ActionPlanNotation";
import { ZAIDIN_AGING_PROPOSAL } from "../../domain/action-plan-catalog/PlanPreparationDraft";
import type { ActionPlanCatalogModule } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import { useState } from 'react';
import { COLLECTION_USES, PLANNING_INSTRUMENTS, type PlanningInstrument } from '../../domain/action-plan-catalog/PlanningInstruments';
export function PlanningInstrumentCatalog({indicatorCode,indicatorDisplayCode,notationModule=ZAIDIN_AGING_PROPOSAL,onSelect,selectionLabel="Añadir como opción pendiente a la ficha"}:{notationModule?:ActionPlanCatalogModule;indicatorCode?:string;indicatorDisplayCode?:string;selectionLabel?:string;onSelect?:(instrument:PlanningInstrument,use:string)=>void}) {
 const [axis,setAxis]=useState(''); const [query,setQuery]=useState(''); const [use,setUse]=useState<string>(COLLECTION_USES[0]);
 const objective=indicatorCode?.replace('ENV-I','ENV-OE');
 const entries=PLANNING_INSTRUMENTS.filter(i=>(!objective || i.objectives.includes(objective)) && (!axis || i.axis===axis) && `${i.name} ${i.population} ${i.objectives.map(code=>actionPlanElementCode(notationModule,code)).join(' ')}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
 return <details className="planning-instruments"><summary>Instrumentos para preparar la recogida{indicatorCode ? ` · ${indicatorDisplayCode ?? actionPlanElementCode(notationModule,indicatorCode)}` : ' · Envejecimiento saludable'}</summary>
 <p><strong>Catálogo de preparación.</strong> Selecciona solo los módulos adecuados a la población y al objetivo. Las opciones siguientes aún no generan cuestionarios ni calculan resultados.</p>
 <p>Antes de administrarlos deben comprobarse <strong>versión, población, permisos de uso, preguntas y puntuación</strong>. No se han registrado mediciones del Zaidín.</p>
 <div className="planning-instruments__filters"><label>Eje<select value={axis} onChange={e=>setAxis(e.target.value)}><option value="">Todos los ejes</option>{['Edadismo','Soledad no deseada','Autonomía','Participación'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Buscar instrumento, población u objetivo<input value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <label>Uso previsto<select value={use} onChange={e=>setUse(e.target.value)}>{COLLECTION_USES.map(x=><option key={x}>{x}</option>)}</select></label></div>
 <p><strong>{entries.length} opciones</strong> para revisar. Una relación con un objetivo puede ser parcial.</p>
 <ul>{entries.map(i=><li key={i.id}><h4>{i.name}</h4><p><strong>{i.kind}</strong> · {i.axis}</p><p><strong>Población:</strong> {i.population}</p><p><strong>Objetivos:</strong> {i.objectives.map(code=>actionPlanElementCode(notationModule,code)).join(', ')}</p><p>{i.evidence}</p><p><strong>Límites y tareas pendientes:</strong> {i.limitation}</p>{i.reference && <p><a href={i.reference} target="_blank" rel="noreferrer">Consultar la fuente del instrumento</a></p>}{onSelect && <button type="button" onClick={()=>onSelect(i,use)}>{selectionLabel} · {i.name}</button>}</li>)}</ul>
 {!entries.length && <p>No hay opciones para esta búsqueda. Esto no significa que no existan instrumentos adecuados.</p>}
 <p>El agente puede registrar el <strong>autoinforme de la persona</strong>; su propia valoración se identificará separadamente. Los datos de personas atendidas no representan automáticamente a todo el territorio.</p>
 </details>;
}
