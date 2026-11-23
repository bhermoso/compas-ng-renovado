/**
 * Estadística territorial oficial del expediente (CONTRACT-TERRITORIAL-STATISTICS).
 * Descarga del INE y del IECA, guarda la instantánea en el expediente y prepara
 * el paquete para la próxima revisión del Perfil. No modifica el Perfil vigente.
 */
import { useMemo, useState } from 'react';
import type { ExternalHealthProfile, ProfileResult } from '../../domain/health-profile/ExternalHealthProfile';
import type { TerritorialStatisticsSnapshot } from '../../domain/territorial-statistics/TerritorialStatistics';
import {
  DOMAIN_LABEL, TERRITORIAL_INDICATORS, appendSnapshot, findAndalusianIneCodes, latestSnapshot, profileCoverage, provenanceCsv,
  mergeTerritorialResults, retrieveTerritorialStatistics, revisionPackage, revisionResults, sectionCsv, sectionTable, type CoverageStatus,
} from '../../application/territorial-statistics';
import './TerritorialStatisticsPanel.css';

interface Props {
  municipalityId: string;
  municipalityName: string;
  ineCode?: string;
  province?: string;
  snapshots?: TerritorialStatisticsSnapshot[];
  activeProfile?: ExternalHealthProfile;
  authorName?: string;
  onSave?: (snapshots: TerritorialStatisticsSnapshot[], onProgress?: (message: string) => void) => Promise<void>;
  /** Abre una nueva revisión del Perfil vigente con estos resultados, para revisarla y guardarla. */
  onPrepareRevision?: (results: ProfileResult[], note: string) => void;
}

const STATUS_LABEL: Record<CoverageStatus, string> = {
  ausente: 'No figura en el Perfil',
  actualizable: 'Hay un dato más reciente',
  'al-dia': 'Al día',
  'revisar-valor': 'Mismo periodo, valor distinto',
  'otro-periodo': 'El Perfil usa un periodo posterior',
  'otra-medida': 'El Perfil usa otra medida',
  ambiguo: 'Hay varias filas compatibles en el Perfil',
  'sin-dato': 'Sin dato descargado',
};

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`La fuente respondió ${response.status}.`);
  return response.json();
}

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const when = (iso: string) => new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function TerritorialStatisticsPanel({ municipalityId, municipalityName, ineCode, province, snapshots, activeProfile, authorName, onSave, onPrepareRevision }: Props) {
  const [code, setCode] = useState(ineCode ?? '');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number }>();
  const [fresh, setFresh] = useState<TerritorialStatisticsSnapshot>();
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<Array<{ code: string; name: string }>>();

  const saved = snapshots ?? [];
  const shown = fresh ?? saved.find(s => s.id === selectedId) ?? latestSnapshot(saved);
  const coverage = useMemo(() => shown ? profileCoverage(shown, activeProfile) : [], [shown, activeProfile]);
  const results = useMemo(() => shown ? revisionResults(shown) : [], [shown]);
  const sections = useMemo(() => shown ? sectionTable(shown) : undefined, [shown]);
  const merge = useMemo(() => shown && activeProfile ? mergeTerritorialResults(shown, activeProfile.results) : undefined, [shown, activeProfile]);
  const count = (k: string) => merge?.changes.filter(c => c.kind === k).length ?? 0;

  async function run() {
    setError(''); setMessage(''); setBusy(true);
    try {
      const snapshot = await retrieveTerritorialStatistics({
        municipalityId, municipalityName, ineCode: code.trim(), retrievedBy: authorName || undefined, fetchJson,
        onProgress: (label, done, total) => setProgress({ label, done, total }),
      });
      setFresh(snapshot);
      setMessage(`Descarga terminada: ${snapshot.observations.length} valores de ${snapshot.sources.length} tablas y consultas${snapshot.failures.length ? `, con ${snapshot.failures.length} incidencias` : ''}. Revísala y guárdala en el expediente.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); setProgress(undefined); }
  }

  async function lookup() {
    setError(''); setBusy(true);
    try {
      const found = await findAndalusianIneCodes(municipalityName, province, fetchJson);
      setCandidates(found);
      if (found.length === 1) setCode(found[0].code);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!fresh || !onSave) return;
    setBusy(true); setError('');
    try {
      await onSave(appendSnapshot(saved, fresh), m => setMessage(m));
      setSelectedId(fresh.id); setFresh(undefined);
      setMessage('Descarga guardada en el expediente y confirmada por Firebase.');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const base = shown ? `${slug(municipalityName)}-estadistica-territorial-${shown.retrievedAt.slice(0, 10)}` : '';
  const domains = (['contexto-poblacion', 'ejes-desigualdad', 'condiciones-vida', 'servicios'] as const);

  return <section className="tsp" aria-labelledby="tsp-title">
    <header className="tsp-head">
      <p className="hp-cover__chain">Fuentes oficiales · INE e IECA</p>
      <h2 id="tsp-title" className="hp-cover__section-title">Estadística territorial</h2>
      <hr className="home-cover__rule hp-cover__rule" />
      <p>{municipalityName} · {TERRITORIAL_INDICATORS.length} indicadores de determinantes sociales y desigualdad, con fuente y fecha de consulta. Los datos guardados se pueden incorporar a una nueva revisión del Perfil.</p>
      <div className="tsp-run">
        <label>Código INE del municipio
          <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={5} disabled={busy} placeholder="18011"/>
        </label>
        <button type="button" className="ep-primary" disabled={busy || !/^\d{5}$/.test(code.trim())} onClick={() => void run()}>Descargar indicadores</button>
        {fresh && onSave && <button type="button" className="ep-primary" disabled={busy} onClick={() => void save()}>Guardar en el expediente</button>}
        {fresh && <button type="button" disabled={busy} onClick={() => { setFresh(undefined); setMessage(''); }}>Descartar descarga</button>}
      </div>
      {!ineCode && <p className="ep-help">El expediente no tiene código INE registrado: indícalo para esta descarga o búscalo por el nombre del municipio. El código usado queda guardado con la descarga. <button type="button" disabled={busy} onClick={() => void lookup()}>Buscar el código de «{municipalityName}»</button></p>}
      {candidates && <p className="ep-help" role="status">{candidates.length === 0 ? `El INE no publica ningún municipio andaluz llamado «${municipalityName}». Si el ámbito no es un municipio, indica el código del municipio matriz.` : candidates.length === 1 ? `Código encontrado: ${candidates[0].code} (${candidates[0].name}). Compruébalo antes de descargar.` : `Varios municipios con ese nombre: ${candidates.map(c => `${c.code} (${c.name})`).join(', ')}.`}</p>}
      {progress && <div className="tsp-progress" role="status"><progress max={progress.total} value={progress.done}/> <span>{progress.label} ({progress.done + 1} de {progress.total})</span></div>}
      {message && <p className="ep-message" role="status">{message}</p>}
      {error && <p className="ep-error" role="alert">{error}</p>}
    </header>

    {saved.length > 0 && <nav className="tsp-history" aria-label="Descargas guardadas">
      <span>Descargas guardadas:</span>
      {[...saved].reverse().map(s => <button key={s.id} type="button" aria-pressed={!fresh && shown?.id === s.id} onClick={() => { setFresh(undefined); setSelectedId(s.id); }}>{when(s.retrievedAt)}</button>)}
    </nav>}

    {!shown ? <p className="tsp-empty">Aún no hay ninguna descarga en este expediente.</p> : <>
      <p className="tsp-meta">{fresh ? 'Descarga sin guardar' : 'Descarga guardada'} del {when(shown.retrievedAt)} · código INE {shown.ineCode} · catálogo {shown.catalogVersion}{shown.retrievedBy ? ` · ${shown.retrievedBy}` : ''}</p>

      <div className="tsp-downloads">
        <button type="button" onClick={() => download(JSON.stringify(revisionPackage(shown, activeProfile), null, 2), `${base}-paquete-revision.json`, 'application/json')}>↓ Paquete para la revisión (JSON)</button>
        <button type="button" onClick={() => download(provenanceCsv(shown), `${base}-procedencia.csv`, 'text/csv;charset=utf-8')}>↓ Valores y procedencia (CSV)</button>
        {sections && sections.rows.length > 0 && <button type="button" onClick={() => download(sectionCsv(shown), `${base}-secciones.csv`, 'text/csv;charset=utf-8')}>↓ Secciones censales (CSV)</button>}
        {shown.grid && <button type="button" onClick={() => download(shown.grid!.geojson, `${base}-malla-250m.geojson`, 'application/geo+json')}>↓ Malla de 250 m (GeoJSON)</button>}
      </div>

      {activeProfile && merge && <details className="workspace-disclosure tsp-block tsp-revision">
        <summary><strong>Llevar estos datos al Perfil</strong></summary>
        <p>Se prepara una nueva revisión de «{activeProfile.title}» con los indicadores de esta descarga: <strong>{count('añadido')} añadidos</strong> y <strong>{count('actualizado')} actualizados</strong> (dato más reciente o valor distinto del publicado por la fuente); {count('conservado')} se conservan como están. Los añadidos se muestran en las páginas de datos del Perfil, en el orden del marco de determinantes sociales: «Contexto y población», «Ejes de desigualdad» (con la desigualdad por sección), «Condiciones de vida» y «Servicios».</p>
        <p className="ep-help">El texto del Perfil no cambia, y la revisión vigente tampoco: la nueva queda en revisión hasta que la valides. El PDF original adjunto no contiene estos datos; la revisión lo declara entre sus limitaciones.</p>
        <details><summary>Ver los cambios uno a uno ({merge.changes.length})</summary>
          <div className="tsp-scroll"><table className="tsp-table">
            <thead><tr><th>Cambio</th><th>Indicador</th><th>Escala</th><th>Valor</th><th>En el Perfil vigente</th></tr></thead>
            <tbody>{merge.changes.map((c, i) => <tr key={i}><td>{c.kind}</td><td>{c.title}</td><td>{c.scale}</td><td className="tsp-num">{c.value} <span>({c.period})</span></td><td>{c.previous ? `${c.previous.value} (${c.previous.period || '—'}) · ${STATUS_LABEL[c.previous.reason]}` : c.issue ? STATUS_LABEL[c.issue] : '—'}</td></tr>)}</tbody>
          </table></div>
        </details>
        {onPrepareRevision && <div className="tsp-run">
          <button type="button" className="ep-primary" disabled={busy || !!fresh || count('añadido') + count('actualizado') === 0}
            onClick={() => onPrepareRevision(merge.results, `Esta revisión incorpora ${count('añadido')} indicadores y actualiza ${count('actualizado')} con estadística territorial oficial (INE, IECA) descargada en COMPÁS el ${when(shown.retrievedAt)} (catálogo ${shown.catalogVersion}). El PDF original adjunto no contiene estos datos.`)}>
            Preparar la nueva revisión del Perfil
          </button>
          {fresh && <span className="ep-help">Guarda antes la descarga en el expediente, para que la revisión remita a ella.</span>}
        </div>}
      </details>}

      <details className="workspace-disclosure tsp-block">
        <summary><strong>Cobertura frente al Perfil vigente</strong></summary>
        <p className="ep-help">{activeProfile ? `Comparado con «${activeProfile.title}». La coincidencia se busca por el nombre del indicador y se compara en la misma escala: si el Perfil da el dato de una sección, con esa sección. Conviene comprobarla.` : 'El expediente no tiene Perfil vigente: todos los indicadores figuran como ausentes.'}</p>
        <div className="tsp-scroll"><table className="tsp-table">
          <thead><tr><th>Indicador</th><th>Descargado</th><th>En el Perfil vigente</th><th>Estado</th></tr></thead>
          <tbody>{coverage.map(c => <tr key={c.indicatorId} data-status={c.status}>
            <td>{c.title}</td>
            <td>{c.downloaded ? `${c.downloaded.literal} (${c.downloaded.period})` : '—'}{c.downloaded && c.inProfile ? <small>{c.downloaded.territory}</small> : null}</td>
            <td>{c.inProfile ? <>{`${c.inProfile.value} ${c.inProfile.unit} (${c.inProfile.period || 'periodo no declarado'})`}<small>«{c.inProfile.title}»{c.inProfile.scale ? ` · ${c.inProfile.scale}` : ''}</small></> : '—'}</td>
            <td>{STATUS_LABEL[c.status]}</td>
          </tr>)}</tbody>
        </table></div>
      </details>

      {domains.map(d => {
        const rows = results.filter(r => r.topic === DOMAIN_LABEL[d]);
        if (!rows.length) return null;
        return <details key={d} className="workspace-disclosure tsp-block">
          <summary><strong>{DOMAIN_LABEL[d]}</strong></summary>
          <div className="tsp-scroll"><table className="tsp-table tsp-table--values">
            <thead><tr><th>Indicador</th><th>{municipalityName}</th><th>Comparadores publicados</th><th>Año</th><th>Fuente</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.id}>
              <td>{r.title}<small>{r.caution}</small></td>
              <td className="tsp-num">{r.value} <span>{r.unit}</span></td>
              <td>{r.comparisons?.map(c => `${c.label}: ${c.value.toLocaleString('es-ES', { maximumFractionDigits: 10 })}`).join(' · ') || (TERRITORIAL_INDICATORS.find(f => `ts-${f.id}` === r.id)?.comparators.length ? 'No publicados' : 'No se compara')}</td>
              <td>{r.period}</td>
              <td><small>{r.source} · {r.page}</small></td>
            </tr>)}</tbody>
          </table></div>
        </details>;
      })}

      {sections && sections.rows.length > 0 && <details className="workspace-disclosure tsp-block">
        <summary><strong>Por sección censal ({sections.rows.length})</strong></summary>
        <p className="ep-help">Datos agregados de cada sección; no se atribuyen a calles, viviendas ni personas.{sections.rows.length < 2 ? ' Con una sola sección no hay diferencias internas que analizar.' : ''}</p>
        <div className="tsp-scroll"><table className="tsp-table">
          <thead><tr><th>Sección</th>{sections.fichas.map(f => <th key={f.id}>{f.title} <small>({f.unit})</small></th>)}</tr></thead>
          <tbody>{sections.rows.map(r => <tr key={r.code}><td>{r.code}</td>{r.values.map((v, i) => <td key={i} className="tsp-num">{v ? v.literal : '—'}</td>)}</tr>)}</tbody>
        </table></div>
      </details>}

      {shown.grid && <details className="workspace-disclosure tsp-block">
        <summary><strong>Malla de 250 m ({shown.grid.year})</strong></summary>
        <p>{shown.grid.cellCount} celdas con población en el término municipal. Sumas de las celdas publicadas: {shown.grid.totals.map(t => `${t.label.toLowerCase()} ${t.sum.toLocaleString('es-ES')}${t.secretCells ? ` (${t.secretCells} celdas con secreto estadístico, no sumadas)` : ''}`).join('; ')}.</p>
        <p className="ep-help">Las sumas de la malla no sustituyen a las cifras oficiales del municipio; sirven para localizar dónde vive la población dentro del término.</p>
      </details>}

      {shown.failures.length > 0 && <details className="workspace-disclosure tsp-block tsp-failures">
        <summary><strong>Incidencias de la descarga</strong></summary>
        <ul>{shown.failures.map((f, i) => <li key={i}><strong>{f.scope}</strong>: {f.message}</li>)}</ul>
      </details>}

      <details className="workspace-disclosure tsp-block"><summary><strong>Fuentes consultadas ({shown.sources.length})</strong></summary>
        <ul className="tsp-sources">{shown.sources.map(s => <li key={s.id}><strong>{s.provider}</strong> · {s.product} · {s.title} ({s.table}) · <a href={s.url} target="_blank" rel="noopener noreferrer">dirección de consulta</a>{s.notes ? <small>{s.notes}</small> : null}</li>)}</ul>
      </details>
    </>}
  </section>;
}
