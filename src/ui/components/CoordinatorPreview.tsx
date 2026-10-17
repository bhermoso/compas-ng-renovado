import { useState } from 'react';
import './CoordinatorPreview.css';
import { PlanningInstrumentCatalog } from './PlanningInstrumentCatalog';
import { PlanPreparationPanel } from './PlanPreparationPanel';
import { ZAIDIN_AGING_PROPOSAL, type PlanPreparationDraft } from '../../domain/action-plan-catalog/PlanPreparationDraft';

// Misma propuesta editorial; almacenamiento de demostración separado.
// Se conserva esta versión de contenedor para recuperar las descargas anteriores.
const coordinatorProposal = {
  ...ZAIDIN_AGING_PROPOSAL,
  version: 'coordinacion-zaidin-propuesta-v1',
  sourceLabel: 'Propuesta de coordinación · revisión de autonomía y participación',
};

const DRAFT_KEY = 'compas-ng:demo:coordinacion-zaidin:v1';
function parseDraft(raw: string): PlanPreparationDraft {
  const value = JSON.parse(raw) as PlanPreparationDraft;
  const ids = new Set([coordinatorProposal.id, ...coordinatorProposal.generalObjectives.flatMap(g => [g.code, ...g.specificObjectives.flatMap(o => [o.code, o.indicator.code])])]);
  if (!value || value.municipalityId !== 'demo-coordinacion-zaidin' || value.moduleId !== coordinatorProposal.id || value.version !== coordinatorProposal.version || typeof value.updatedAt !== 'string' || !value.decisions || Array.isArray(value.decisions) || typeof value.decisions !== 'object') throw new Error('Archivo incompatible con este borrador de coordinación.');
  for (const [id, decision] of Object.entries(value.decisions)) {
    if (!ids.has(id) || !decision || !['pending','included','excluded','modified'].includes(decision.status) || typeof decision.sourceText !== 'string' || (decision.text !== undefined && typeof decision.text !== 'string')) throw new Error('El archivo contiene decisiones no válidas.');
  }
  return value;
}

const sections = {
  'Plan de Acción': {
    intro: 'Revisar las propuestas del plan y coordinar objetivos, indicadores y actuaciones.',
    items: ['Edadismo', 'Soledad no deseada', 'Autonomía personal, social y relacional', 'Participación, accesibilidad e inclusión digital'],
    detail: 'La coordinación podrá proponer cambios y revisar el borrador. La aprobación institucional del plan seguirá su procedimiento propio.',
  },
  'Fichas y aportaciones': {
    intro: 'Recibir las fichas de las personas responsables de actuaciones y consolidar los indicadores.',
    items: ['Borradores de agentes', 'Aportaciones enviadas a revisión', 'Solicitudes de corrección', 'Resultados revisados para consolidar'],
    detail: 'Circuito propuesto. No hay aportaciones conectadas a esta demostración; esto no significa que el territorio carezca de información.',
  },
  'Instrumentos y encuestas': {
    intro: 'Seleccionar módulos según objetivos, población y momento de recogida.',
    items: ['Encuesta temática o combinada', 'Registro inicial de personas usuarias', 'Seguimiento durante una actuación', 'Evaluación final o posterior'],
    detail: 'Un mismo instrumento podrá reutilizarse en encuesta o registro, conservando versión, autoría de la respuesta y reglas de cálculo. El catálogo está pendiente de integración.',
  },
  'Equipo y responsabilidades': {
    intro: 'Consultar el equipo territorial y organizar las responsabilidades sobre actuaciones e indicadores.',
    items: ['Coordinación del plan', 'Responsables de objetivos e indicadores', 'Agentes de actuaciones', 'Consulta de resultados agregados'],
    detail: 'Propuesta de roles. No se han creado cuentas ni asignaciones. La coordinación no administra la plataforma ni concede acceso a otros territorios.',
  },
  'Seguimiento del plan': {
    intro: 'Consultar la evolución de los indicadores y la procedencia de cada aportación.',
    items: ['Mediciones iniciales y posteriores', 'Cobertura y datos pendientes', 'Procedencia y fecha de los registros', 'Informes agregados del ámbito'],
    detail: 'Sin resultados conectados. Las personas atendidas y la población general se analizarán por separado; los registros repetidos no se contarán como personas diferentes.',
  },
};
type Section = keyof typeof sections;

/** Walkthrough only: deliberately does not mount App or read municipal workspaces. */
export default function CoordinatorPreview() {
  const [entered, setEntered] = useState(false);
  const [section, setSection] = useState<Section>('Plan de Acción');
  const [initial] = useState(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); return { draft: raw ? parseDraft(raw) : undefined, message: raw ? 'Borrador de prueba recuperado de este navegador.' : 'Sin decisiones guardadas.' }; }
    catch { return { draft: undefined, message: 'No se pudo recuperar el borrador. La copia existente no se ha borrado; conserva una descarga antes de continuar.' }; }
  });
  const [draft, setDraft] = useState<PlanPreparationDraft | undefined>(initial.draft);
  const [message, setMessage] = useState(initial.message);
  const [pendingImport, setPendingImport] = useState<PlanPreparationDraft>();
  function saveDraft(next: PlanPreparationDraft) {
    setDraft(next);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); setMessage('Borrador de prueba guardado en este navegador. Descárgalo para conservar una copia o cambiar de equipo.'); }
    catch { setMessage('No se pudo guardar en el navegador. Los cambios están solo en memoria: descarga el borrador antes de cerrar.'); }
  }
  function downloadDraft() {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'COMPAS_Zaidin_borrador_coordinacion.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const current = sections[section];
  return <main className="coord-preview">
    <div className="coord-notice" role="note">Prototipo de coordinación · Sin autenticación ni datos personales · No es un acceso privado</div>
    <header className="coord-header"><strong>COMPÁS</strong><span>Plan de Salud de El Zaidín · 2027–2030</span></header>
    {!entered ? <section className="coord-entry">
      <p className="coord-kicker">Acceso de ejemplo · Coordinación territorial</p>
      <h1>Tu espacio de coordinación del Zaidín</h1>
      <p>Organiza el plan, revisa las aportaciones del equipo y reúne la información necesaria para su seguimiento.</p>
      <dl><dt>Perfil</dt><dd>Coordinación del plan de salud</dd><dt>Ámbito asignado</dt><dd>Distrito municipal de El Zaidín · Granada</dd><dt>Tipo de acceso previsto</dt><dd>Cuenta personal, sin privilegios de administración de la plataforma</dd></dl>
      <button type="button" onClick={() => setEntered(true)}>Explorar como coordinación del Zaidín</button>
      <p className="coord-muted">Esta entrada permite revisar el diseño. La cuenta personal y su clave se habilitarán cuando exista un servicio de acceso seguro.</p>
      <a href={import.meta.env.BASE_URL}>Volver a COMPÁS</a>
    </section> : <>
      <div className="coord-profile"><div><h1>Coordinación del Zaidín</h1><p>Distrito municipal · Perfil de coordinación · Vista de ejemplo</p></div><button type="button" onClick={() => {setEntered(false); setSection('Plan de Acción');}}>Salir del ejemplo</button></div>
      <div className="coord-layout">
        <nav aria-label="Áreas de coordinación">{(Object.keys(sections) as Section[]).map(name => <button key={name} type="button" aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}>{name}</button>)}</nav>
        <section className="coord-content" aria-label={section}>
          <p className="coord-kicker">El Zaidín · Espacio territorial propuesto</p><h2>{section}</h2><p>{current.intro}</p>
          {section === 'Plan de Acción' ? <>
            <p className="coord-muted">Prueba editable. Las decisiones se guardan solo en este navegador, separadas del expediente municipal. La redacción ampliada de autonomía y los indicadores siguen sujetos a revisión.</p>
            <div className="coord-transfer">
              <button type="button" disabled={!draft} onClick={downloadDraft}>Descargar borrador de prueba</button>
              <label>Recuperar borrador de prueba<input type="file" accept=".json,application/json" onChange={async e => {
                const file = e.target.files?.[0]; e.target.value = ''; setPendingImport(undefined);
                if (!file) return;
                try { if (file.size > 1_000_000) throw new Error('El archivo supera el tamaño permitido.'); setPendingImport(parseDraft(await file.text())); }
                catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo leer el archivo.'); }
              }} /></label>
              {pendingImport && <div role="status"><p>Archivo compatible: {Object.keys(pendingImport.decisions).length} decisiones. Sustituirá el borrador de prueba actual. Puedes descargarlo antes.</p><button type="button" onClick={() => {saveDraft(pendingImport); setPendingImport(undefined);}}>Sustituir borrador de prueba</button> <button type="button" onClick={() => setPendingImport(undefined)}>Cancelar recuperación</button></div>}
            </div>
            <PlanPreparationPanel module={coordinatorProposal} municipalityId="demo-coordinacion-zaidin" draft={draft} onChange={saveDraft}
              persistenceMessage={message}
              renderWorksheet={() => <p className="coord-muted">La ficha de recogida y las aportaciones de agentes se conectarán en una entrega posterior.</p>} />
          </> : section === 'Instrumentos y encuestas' ? <PlanningInstrumentCatalog /> : <ul className="coord-cards">{current.items.map(item => <li key={item}>{item}</li>)}</ul>}
          <p className="coord-muted">{current.detail}</p>
        </section>
      </div>
      <aside className="coord-scope"><h2>Alcance del perfil propuesto</h2><p>Trabajo sobre el propio ámbito y las funciones asignadas. Los registros individuales requerirán permiso específico; coordinar el plan no dará acceso automático a todos ellos. El acceso de mancomunidades a municipios se autorizará expresamente.</p></aside>
    </>}
  </main>;
}
