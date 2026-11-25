import { useMemo, useState } from "react";
import {
  PROCESS_MILESTONE_KINDS, milestoneKindLabel, sortMilestones,
  type ProcessMilestone, type ProcessMilestoneKind,
} from "../../domain/process/ProcessMilestone";
import type { Slide } from "../../application/process/processPresentation";
import { ProcessPresentation } from "./ProcessPresentation";

interface ProcessPanelProps {
  municipalityName: string;
  milestones: ProcessMilestone[];
  slides: Slide[];
  authorName: string;
  /** Sin permiso de escritura, los hitos se consultan pero no se editan. */
  onChange?: (next: ProcessMilestone[]) => void;
  onGoToCycle: () => void;
}

const EMPTY = { kind: "impulso" as ProcessMilestoneKind, date: "", title: "", place: "", note: "" };

function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ProcessPanel({ municipalityName, milestones, slides, authorName, onChange, onGoToCycle }: ProcessPanelProps) {
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const ordered = useMemo(() => sortMilestones(milestones), [milestones]);

  const add = () => {
    if (!onChange) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) { setError("Indica la fecha del hito."); return; }
    if (!draft.title.trim()) { setError("Indica un título para el hito."); return; }
    const milestone: ProcessMilestone = {
      id: crypto.randomUUID(), kind: draft.kind, date: draft.date, title: draft.title.trim(),
      ...(draft.place.trim() ? { place: draft.place.trim() } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
      createdAt: new Date().toISOString(),
      ...(authorName ? { createdBy: authorName } : {}),
    };
    onChange([...milestones, milestone]);
    setDraft(EMPTY);
    setError(null);
  };

  const remove = (m: ProcessMilestone) => {
    if (!onChange) return;
    if (!window.confirm(`¿Eliminar el hito «${m.title}» (${shortDate(m.date)})?`)) return;
    onChange(milestones.filter((x) => x.id !== m.id));
  };

  return (
    <section className="workspace-panel process-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Proceso local de salud · {municipalityName}</p>
          <h2>Hitos del proceso</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setPresenting(true)}>Presentar el proceso y el Perfil</button>
      </div>
      <p className="panel-note">
        Talleres y sesiones con fecha: el impulso, la presentación del Perfil, la priorización y el Plan de Acción.
        La presentación reúne estos hitos, los resultados del Perfil vigente, el estudio IBSE y las conclusiones y
        recomendaciones elegidas.
      </p>

      {ordered.length === 0
        ? <p className="empty-state">Todavía no hay hitos registrados.</p>
        : (
          <ol className="process-milestones">
            {ordered.map((m) => (
              <li key={m.id} className={`process-milestone process-milestone--${m.kind}`}>
                <span className="process-milestone__date">{shortDate(m.date)}</span>
                <span className="process-milestone__body">
                  <span className="process-milestone__kind">{milestoneKindLabel(m.kind)}</span>
                  <strong>{m.title}</strong>
                  {m.place && <span>{m.place}</span>}
                  {m.note && <span className="process-milestone__note">{m.note}</span>}
                </span>
                {onChange && <button type="button" className="secondary-button" onClick={() => remove(m)}>Eliminar</button>}
              </li>
            ))}
          </ol>
        )}

      {onChange && (
        <fieldset className="process-form">
          <legend>Registrar un hito</legend>
          <label>Tipo
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as ProcessMilestoneKind })}>
              {PROCESS_MILESTONE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </label>
          <label>Fecha<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="process-form__wide">Título<input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label className="process-form__wide">Lugar (opcional)<input type="text" value={draft.place} onChange={(e) => setDraft({ ...draft, place: e.target.value })} /></label>
          <label className="process-form__full">Nota (opcional)<textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
          {error && <p className="process-form__error" role="alert">{error}</p>}
          <button type="button" className="primary-button" onClick={add}>Añadir hito</button>
        </fieldset>
      )}

      {presenting && (
        <ProcessPresentation
          slides={slides}
          onClose={() => setPresenting(false)}
          onGoToCycle={() => { setPresenting(false); onGoToCycle(); }}
        />
      )}
    </section>
  );
}
