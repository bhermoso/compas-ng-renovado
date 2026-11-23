import { actionPlanElementCode } from "../../domain/action-plan-catalog/ActionPlanNotation";
import { AGING_FOUR_BLOCKS_BASE } from "../../domain/action-plan-catalog/PlanPreparationDraft";
import type { ActionPlanCatalogModule } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import { useState } from 'react';
import { COLLECTION_USES, PLANNING_INSTRUMENTS, type PlanningInstrument } from '../../domain/action-plan-catalog/PlanningInstruments';
export function PlanningInstrumentCatalog({indicatorCode,indicatorDisplayCode,notationModule=AGING_FOUR_BLOCKS_BASE,onSelect,selectionLabel="Añadir como opción pendiente a la ficha"}:{notationModule?:ActionPlanCatalogModule;indicatorCode?:string;indicatorDisplayCode?:string;selectionLabel?:string;onSelect?:(instrument:PlanningInstrument,use:string)=>void}) {
 const [axis,setAxis]=useState(''); const [query,setQuery]=useState(''); const [use,setUse]=useState<string>(COLLECTION_USES[0]);
 // Cada línea solo ofrece los instrumentos preparados para sus propios objetivos:
 // el catálogo actual pertenece a Envejecimiento saludable (prefijo ENV).
 const prefix=(indicatorCode ?? notationModule.generalObjectives[0]?.code ?? '').split('-')[0];
 const lineInstruments=PLANNING_INSTRUMENTS.filter(i=>i.objectives.some(code=>code.startsWith(`${prefix}-`)));
 const axes=[...new Set(lineInstruments.map(i=>i.axis))];
 const objective=indicatorCode?.replace(/-I(\d)/,'-OE$1');
 const label=indicatorCode ? ` · ${indicatorDisplayCode ?? actionPlanElementCode(notationModule,indicatorCode)}` : ` · ${notationModule.title}`;
 if (lineInstruments.length===0) return <details className="planning-instruments planning-instruments--empty"><summary>Instrumentos para preparar la recogida{label}</summary>
  <p>La línea <strong>{notationModule.title}</strong> no tiene todavía instrumentos de recogida preparados en COMPÁS. El catálogo disponible corresponde a Envejecimiento saludable y no se aplica a esta línea.</p>
  <p>La procedencia del indicador y su fuente de datos figuran en su ficha. Un instrumento nuevo debe documentarse con versión, población, permisos de uso, preguntas y puntuación antes de incorporarse.</p>
 </details>;
 const entries=lineInstruments.filter(i=>(!objective || i.objectives.includes(objective)) && (!axis || i.axis===axis) && `${i.name} ${i.population} ${i.objectives.map(code=>actionPlanElementCode(notationModule,code)).join(' ')}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
 return <details className="planning-instruments"><summary>Instrumentos para preparar la recogida{label}</summary>
 <p><strong>Catálogo de preparación.</strong> Selecciona solo los módulos adecuados a la población y al objetivo. Las opciones siguientes aún no generan cuestionarios ni calculan resultados.</p>
 <p>Antes de administrarlos deben comprobarse <strong>versión, población, permisos de uso, preguntas y puntuación</strong>.{prefix==='ENV' ? ' No se han registrado mediciones en el territorio.' : ' Los instrumentos de la estrategia citan la fuente y el valor de referencia andaluz; un dato municipal no es comparable sin la misma muestra y método.'}</p>
 <div className="planning-instruments__filters"><label>Eje<select value={axis} onChange={e=>setAxis(e.target.value)}><option value="">Todos los ejes</option>{axes.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Buscar instrumento, población u objetivo<input value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <label>Uso previsto<select value={use} onChange={e=>setUse(e.target.value)}>{COLLECTION_USES.map(x=><option key={x}>{x}</option>)}</select></label></div>
 <p><strong>{entries.length} opciones</strong> para revisar. Una relación con un objetivo puede ser parcial.</p>
 <ul>{entries.map(i=><li key={i.id}><h4>{i.name}</h4><p><strong>{i.kind}</strong> · {i.axis}</p><p><strong>Población:</strong> {i.population}</p><p><strong>Objetivos:</strong> {i.objectives.map(code=>actionPlanElementCode(notationModule,code)).join(', ')}</p><p>{i.evidence}</p><p><strong>Límites y tareas pendientes:</strong> {i.limitation}</p>{i.reference && <p><a href={i.reference} target="_blank" rel="noreferrer">Consultar la fuente del instrumento</a></p>}{onSelect && <button type="button" onClick={()=>onSelect(i,use)}>{selectionLabel} · {i.name}</button>}</li>)}</ul>
 {!entries.length && <p>No hay opciones para esta búsqueda. Esto no significa que no existan instrumentos adecuados.</p>}
 <p>El agente puede registrar el <strong>autoinforme de la persona</strong>; su propia valoración se identificará separadamente. Los datos de personas atendidas no representan automáticamente a todo el territorio.</p>
 </details>;
}
