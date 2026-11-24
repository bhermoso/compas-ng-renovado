import { useMemo, useState } from "react";
import type { ExternalHealthProfile, ProfileChoice } from "../../domain/health-profile/ExternalHealthProfile";
import { choicesByTarget, profileProposals, recordProfileChoices, type ChoiceInput, type ProfileProposal } from "../../application/health-profile/profileChoices";

interface ProfileChoiceMenuProps {
  profile: ExternalHealthProfile;
  /** Nombre con el que se registran las decisiones. */
  authorName: string;
  busy: boolean;
  onSave: (next: ExternalHealthProfile) => Promise<void> | void;
}

type Draft = Record<string, { decision?: ProfileChoice["decision"]; reason: string }>;

const date = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Menú de elección (Art. 16 ter; CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY §7).
 * Las decisiones se preparan aquí y se guardan juntas en Firebase.
 */
export function ProfileChoiceMenu({ profile, authorName, busy, onSave }: ProfileChoiceMenuProps) {
  const proposals = useMemo(() => profileProposals(profile), [profile]);
  const recorded = useMemo(() => choicesByTarget(profile), [profile]);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState("");
  const locked = profile.status === "validated" || !!profile.archivedAt;

  const current = (id: string) => draft[id]?.decision ?? recorded.get(id)?.decision;
  const changes: ChoiceInput[] = Object.entries(draft)
    .filter(([id, d]) => d.decision && (d.decision !== recorded.get(id)?.decision || (d.decision === "discarded" && d.reason.trim() !== (recorded.get(id)?.reason ?? ""))))
    .map(([target, d]) => ({ target, decision: d.decision!, reason: d.reason }));
  const resolved = proposals.filter(p => current(p.id)).length;

  if (!proposals.length) {
    return <section className="ep-choice" aria-label="Elección del equipo técnico">
      <h2>Elección del equipo técnico</h2>
      <p className="ep-help">El texto de esta revisión no contiene conclusiones C1, C2… ni recomendaciones R1, R2… reconocibles. No hay nada que elegir hasta que figuren en el documento.</p>
    </section>;
  }

  function set(id: string, decision: ProfileChoice["decision"]) {
    setDraft(d => ({ ...d, [id]: { decision, reason: d[id]?.reason ?? recorded.get(id)?.reason ?? "" } }));
  }
  function setReason(id: string, reason: string) {
    setDraft(d => ({ ...d, [id]: { decision: d[id]?.decision ?? recorded.get(id)?.decision, reason } }));
  }
  async function save() {
    setError("");
    try {
      await onSave(recordProfileChoices(profile, changes, authorName, new Date().toISOString()));
      setDraft({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido registrar la elección.");
    }
  }

  const item = (p: ProfileProposal) => {
    const decision = current(p.id);
    const saved = recorded.get(p.id);
    const reason = draft[p.id]?.reason ?? saved?.reason ?? "";
    return <li key={p.id} className={`ep-choice__item${decision ? ` ep-choice__item--${decision}` : ""}`}>
      <div className="ep-choice__text">
        <span className="epr-badge">{p.id}</span>
        <span>{p.type ? <strong>{p.type}. </strong> : null}{p.text}</span>
      </div>
      <fieldset className="ep-choice__decision" disabled={locked || busy}>
        <legend className="ep-sr-only">Decisión sobre {p.id}</legend>
        <label><input type="radio" name={`choice-${p.id}`} checked={decision === "chosen"} onChange={() => set(p.id, "chosen")} /> Elegir</label>
        <label><input type="radio" name={`choice-${p.id}`} checked={decision === "discarded"} onChange={() => set(p.id, "discarded")} /> Descartar</label>
        {decision === "discarded" && <label className="ep-choice__reason">Motivo del descarte · opcional<input value={reason} onChange={e => setReason(p.id, e.target.value)} /></label>}
      </fieldset>
      {saved && <small className="ep-choice__record">{saved.decision === "chosen" ? "Elegida" : "Descartada"} por {saved.by} · {date(saved.at)}{saved.reason ? ` · ${saved.reason}` : ""}</small>}
    </li>;
  };

  const conclusions = proposals.filter(p => p.kind === "conclusion");
  const recommendations = proposals.filter(p => p.kind === "recommendation");
  return <section className="ep-choice" aria-label="Elección del equipo técnico">
    <div className="ep-section-heading"><div>
      <p className="ep-eyebrow">ELECCIÓN DEL EQUIPO TÉCNICO</p>
      <h2>Conclusiones y recomendaciones de esta revisión</h2>
      <p>Elige o descarta cada propuesta. Ninguna nace elegida. Descartar no borra texto del original: la propuesta queda rotulada como descartada hasta que el equipo redactor entregue una revisión con las elegidas. Elegir no es priorizar; la priorización corresponde al Grupo Motor.</p>
    </div></div>
    <p className="ep-review-status" role="status">{resolved} de {proposals.length} resueltas{locked ? (profile.status === "validated" ? " · revisión validada, elección cerrada" : " · revisión archivada") : ""}</p>
    {error && <p className="ep-error" role="alert">{error}</p>}
    {conclusions.length > 0 && <><h3>Conclusiones</h3><ol className="ep-choice__list">{conclusions.map(item)}</ol></>}
    {recommendations.length > 0 && <><h3>Recomendaciones</h3><ol className="ep-choice__list">{recommendations.map(item)}</ol></>}
    {!locked && <div className="ep-editor__footer">
      <p>{changes.length ? `${changes.length} ${changes.length === 1 ? "decisión" : "decisiones"} sin guardar.` : "Sin cambios pendientes."} Se registran con tu cuenta y la fecha.</p>
      <button type="button" className="ep-primary" disabled={busy || !changes.length || !authorName.trim()} onClick={() => void save()}>{busy ? "Guardando en Firebase…" : "Guardar la elección en Firebase"}</button>
    </div>}
    {!locked && !authorName.trim() && <p className="ep-help">Identifícate para registrar la elección.</p>}
  </section>;
}
