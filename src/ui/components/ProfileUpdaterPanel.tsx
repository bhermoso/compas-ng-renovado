/**
 * Actualizador de perfiles (CONTRACT-PROFILE-UPDATER): elige cambios y expedientes,
 * muestra la vista previa y, si se confirma, crea en cada expediente una revisión
 * «en revisión». La revisión vigente de cada expediente no cambia hasta validarla.
 */
import { useState } from 'react';
import type { ProfileUpdateDelta } from '../../application/health-profile/profileUpdateDelta';
import type { ExternalHealthProfile } from '../../domain/health-profile/ExternalHealthProfile';
import { PROFILE_UPDATE_LABEL, type ProfileUpdateKind } from '../../application/health-profile/profileUpdater';
import { parseTextPackage, type ProfileTextPackage } from '../../application/health-profile/profileTextOperations';

export interface ProfileUpdateOutcome {
  id: string;
  name: string;
  changes: string[];
  blocked?: string;
  from?: string;
  title?: string;
  profile?: ExternalHealthProfile;
  delta?: ProfileUpdateDelta;
  /** Snapshot exacto de la revisión de partida, para rechazar cambios entre vista previa y guardado. */
  baseline?: string;
  saved?: boolean;
}

interface Props {
  municipalities: Array<{ id: string; name: string }>;
  currentId: string;
  onRun: (ids: string[], kinds: ProfileUpdateKind[], apply: boolean, onProgress: (message: string) => void, textPackage?: ProfileTextPackage, expectedBaselines?: Record<string,string>) => Promise<ProfileUpdateOutcome[]>;
}

const KINDS = Object.keys(PROFILE_UPDATE_LABEL) as ProfileUpdateKind[];
const DEFAULT_KINDS: ProfileUpdateKind[] = ['rotulos', 'paginas-datos', 'indicadores', 'cifras-conclusiones', 'campos-derivados'];
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function downloadPackage(o: ProfileUpdateOutcome) {
  if (!o.profile) return;
  const p = o.profile;
  const pkg = { schema: 'compas-profile-package/v1', municipalityId: p.municipalityId, title: p.title, period: p.period, author: p.author, summary: p.summary, text: p.text, results: p.results, findings: p.findings, limitations: p.limitations, areas: p.areas };
  const url = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `${slug(o.name)}-${slug(p.title)}.json`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProfileUpdaterPanel({ municipalities, currentId, onRun }: Props) {
  const [kinds, setKinds] = useState<ProfileUpdateKind[]>(DEFAULT_KINDS);
  const [pkg, setPkg] = useState<ProfileTextPackage>();
  const [pkgName, setPkgName] = useState('');
  const [pkgError, setPkgError] = useState('');
  const [ids, setIds] = useState<string[]>([currentId]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ProfileUpdateOutcome[]>();
  const [applied, setApplied] = useState(false);

  const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter(y => y !== x) : [...list, x]);
  async function run(apply: boolean) {
    setBusy(true); setError(''); setApplied(false);
    try {
      if (kinds.includes('paquete-texto') && !pkg) throw new Error(pkgError ? `El paquete de texto no se puede aplicar: ${pkgError}` : 'Elige el archivo del paquete de texto.');
      const expectedBaselines = apply ? Object.fromEntries((preview ?? []).filter(o=>o.profile&&o.baseline).map(o=>[o.id,o.baseline!])) : undefined;
      const out = await onRun(ids, kinds, apply, setProgress, kinds.includes('paquete-texto') ? pkg : undefined, expectedBaselines);
      setPreview(out); setApplied(apply && out.some(o=>o.saved));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  const ready = preview?.filter(o => o.profile) ?? [];

  return <section className="tsp" aria-labelledby="pu-title">
    <header className="tsp-head">
      <p className="ep-eyebrow">Actualizador de perfiles</p>
      <h2 id="pu-title">Aplicar cambios a los Perfiles de los expedientes</h2>
      <p>Cada cambio se aplica sobre el Perfil vigente de cada expediente y produce una revisión nueva, en revisión. La revisión de referencia permanece vigente hasta que selecciones explícitamente otra en «Gestión y versiones». Según los cambios elegidos, el Actualizador puede modificar el texto, el resumen, las conclusiones y las recomendaciones estructuradas de una revisión nueva; nunca reescribe los archivos originales adjuntos. Examina las diferencias de la vista previa antes de crearla.</p>
      <fieldset className="pu-fieldset"><legend>Cambios</legend>
        {KINDS.map(k => <label key={k}><input type="checkbox" checked={kinds.includes(k)} disabled={busy} onChange={() => { setKinds(toggle(kinds, k)); setPreview(undefined); }}/> {PROFILE_UPDATE_LABEL[k]}</label>)}
      </fieldset>
      <p className="ep-help"><label>Paquete de texto (compas-profile-text-package/v1): <input type="file" accept="application/json,.json" disabled={busy} onChange={async e => {
        const f = e.target.files?.[0]; setPkg(undefined); setPkgName(''); setPkgError(''); setError(''); setPreview(undefined);
        if (!f) return;
        try {
          const p = parseTextPackage(JSON.parse(await f.text()));
          setPkg(p); setPkgName(`${f.name} · ${p.entries.length} expedientes · ${p.note}`);
          // Cargar un paquete es pedir que se aplique: se marcan el texto y los campos que se derivan de él.
          setKinds(current => [...new Set<ProfileUpdateKind>([...current, 'paquete-texto', 'campos-derivados'])]);
        }
        catch (err) { const message = err instanceof Error ? err.message : String(err); setPkgError(message); setError(`El paquete de texto no se puede aplicar: ${message}`); }
      }}/></label>{pkgName && <small> {pkgName}</small>}
      {pkg && kinds.some(k => k === 'paginas-datos' || k === 'indicadores') && <small className="pu-note"> También están marcados cambios de datos: la revisión recompilará las páginas de datos o los indicadores con la última descarga. Desmárcalos si solo quieres aplicar el paquete.</small>}</p>
      <fieldset className="pu-fieldset"><legend>Expedientes</legend>
        <label><input type="checkbox" checked={ids.length === municipalities.length} disabled={busy} onChange={() => { setIds(ids.length === municipalities.length ? [currentId] : municipalities.map(m => m.id)); setPreview(undefined); }}/> Todos</label>
        {municipalities.map(m => <label key={m.id}><input type="checkbox" checked={ids.includes(m.id)} disabled={busy} onChange={() => { setIds(toggle(ids, m.id)); setPreview(undefined); }}/> {m.name}</label>)}
      </fieldset>
      <div className="tsp-run">
        <button type="button" className="ep-primary" disabled={busy || !ids.length || !kinds.length} onClick={() => void run(false)}>Ver la vista previa</button>
        <button type="button" className="ep-primary" disabled={busy || !ready.length || applied} onClick={() => void run(true)}>Crear las revisiones ({ready.length})</button>
      </div>
      {busy && <p className="ep-help" role="status">{progress}</p>}
      {error && <p className="ep-error" role="alert">{error}</p>}
      {applied && <p className="ep-message" role="status">Revisiones creadas y confirmadas por Firebase. No son todavía las vigentes: para revisarlas, elegir sus propuestas y validarlas, o para aplicarles otro paquete, establécelas como vigentes en «Gestión y versiones» de cada expediente.</p>}
    </header>

    {preview && <section className="tsp-block">
      <h3>{applied ? 'Resultado' : 'Vista previa'}</h3>
      <div className="tsp-scroll"><table className="tsp-table">
        <thead><tr><th>Expediente</th><th>Revisión</th><th>Cambios</th><th>Paquete</th></tr></thead>
        <tbody>{preview.map(o => <tr key={o.id}>
          <td>{o.name}</td>
          <td>{o.blocked ? <><em>{o.blocked}</em>{/revisión vigente es/.test(o.blocked) && <small>El Actualizador trabaja sobre la revisión vigente. Si el paquete se redactó sobre una revisión posterior, establécela como vigente en «Gestión y versiones».</small>}</> : <>{o.title}<small>a partir de «{o.from}»{o.saved ? ' · guardada' : ''}</small></>}</td>
          <td>{o.delta && <details className="pu-delta"><summary>Ver comparación de campos editoriales (antes → después)</summary><p>Texto del cuerpo: {o.delta.textChanged?"modificado":"sin cambios"}. Resumen: {o.delta.summaryChanged?"modificado":"sin cambios"}. Conclusiones: {o.delta.findingsChanged?"modificadas":"sin cambios"}. Recomendaciones: {o.delta.areasChanged?"modificadas":"sin cambios"}.</p>{o.delta.summaryChanged&&<section><h4>Resumen anterior</h4><pre>{o.delta.before.summary}</pre><h4>Resumen propuesto</h4><pre>{o.delta.after.summary}</pre></section>}{o.delta.findingsChanged&&<section><h4>Conclusiones anteriores</h4><pre>{o.delta.before.findings.join("\n\n")}</pre><h4>Conclusiones propuestas</h4><pre>{o.delta.after.findings.join("\n\n")}</pre></section>}{o.delta.areasChanged&&<section><h4>Recomendaciones anteriores</h4><pre>{o.delta.before.areas.map(a=>`${a.id} · ${a.title}\n${a.rationale}`).join("\n\n")}</pre><h4>Recomendaciones propuestas</h4><pre>{o.delta.after.areas.map(a=>`${a.id} · ${a.title}\n${a.rationale}`).join("\n\n")}</pre></section>}{o.delta.textChanged&&<p>El texto completo se puede examinar en el JSON de la vista previa; no se reemplaza el original adjunto.</p>}</details>}{o.changes.length ? <ul className="pu-changes">{o.changes.map((c, i) => <li key={i}>{c}</li>)}</ul> : '—'}{o.profile?.reviewFlags?.length ? <ul className="pu-changes pu-flags">{o.profile.reviewFlags.map((f, i) => <li key={i}><strong>{f.target}</strong>: {f.reason}</li>)}</ul> : null}</td>
          <td>{o.profile ? <button type="button" onClick={() => downloadPackage(o)}>↓ JSON</button> : '—'}</td>
        </tr>)}</tbody>
      </table></div>
      <p className="ep-help">El paquete JSON permite cargar la revisión en otra instalación o conservarla fuera de COMPÁS.</p>
    </section>}
  </section>;
}
