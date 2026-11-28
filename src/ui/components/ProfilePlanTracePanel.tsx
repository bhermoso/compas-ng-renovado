import { useState, type FormEvent } from "react";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import {
  describeProfilePlanLink, eligibleProfilePlanTargets, profilePlanBaselineText, profilePlanLinkKey,
  type ProfilePlanLink, type ProfilePlanOptions,
} from "../../application/action-plan/profilePlanLinks";

export type ProfilePlanLinkInput = Pick<ProfilePlanLink, "recommendationId" | "scenarioId" | "worksheetKey" | "moduleVersion" | "baselineResultId">;

export interface ProfilePlanTraceContext {
  workspace: Pick<MunicipalityWorkspace, "municipality" | "externalProfileLibrary" | "deliberativePrioritySelection" | "thematicPrioritisation" | "profilePlanLinks">;
  lectura?: LecturaEstrategicaLocal;
  authorName: string;
  onChange?: (links: ProfilePlanLink[]) => Promise<void>;
}

export function ProfilePlanTracePanel({ options, links, onSave, onRemove }: {
  options: ProfilePlanOptions;
  links: ProfilePlanLink[];
  onSave?: (input: ProfilePlanLinkInput) => Promise<void>;
  onRemove?: (link: ProfilePlanLink) => Promise<void>;
}) {
  const [recommendationId, setRecommendation] = useState("");
  const [scenarioId, setScenario] = useState("");
  const [worksheetKey, setIndicator] = useState("");
  const [baselineResultId, setBaseline] = useState("");
  const [sameMeasure, setSameMeasure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const priorities = options.priorities.filter(s => s.areasOrigen.includes(recommendationId));
  const targets = eligibleProfilePlanTargets(options, scenarioId);
  const target = targets.find(t => t.indicatorWorksheetKey === worksheetKey);

  async function run(operation: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage("");
    try { await operation(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se ha guardado el cambio."); }
    finally { setBusy(false); }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!onSave || !target || !priorities.some(p => p.id === scenarioId) || (baselineResultId && !sameMeasure)) return;
    void run(() => onSave({
      recommendationId, scenarioId, worksheetKey, moduleVersion: target.moduleVersion,
      ...(baselineResultId ? { baselineResultId } : {}),
    }), "Vínculo guardado en Firebase.");
  }

  return <details className="pcm-traceability-map">
    <summary><strong>Del Perfil al indicador</strong>{links.length > 0 && ` · ${links.length} ${links.length === 1 ? "vínculo" : "vínculos"}`}</summary>
    {links.length > 0 && <ul>{links.map(link => {
      const detail = describeProfilePlanLink(options, link);
      return <li key={profilePlanLinkKey(link)}>
        {detail ? <>
          <strong>{detail.recommendationId} · {detail.recommendation}</strong>
          <p>{detail.priority} → {detail.line} → {detail.objective} → {detail.indicator}</p>
          <p>Línea de base · {profilePlanBaselineText(detail.baseline)}</p>
          <small>{detail.profileTitle}</small>
        </> : <p>{link.recommendationId} · Vínculo pendiente de revisar tras un cambio en el Perfil, la prioridad o el Plan.</p>}
        {onRemove && <button type="button" disabled={busy} onClick={() => {
          if (window.confirm("¿Quitar este vínculo del Plan en preparación?")) void run(() => onRemove(link), "Vínculo eliminado.");
        }}>Quitar vínculo</button>}
      </li>;
    })}</ul>}
    {options.recommendations.length === 0 ? <p>El Perfil vigente no tiene recomendaciones elegidas por el equipo técnico: no hay recomendaciones que vincular a un indicador.</p>
      : options.priorities.length === 0 ? <p>{options.selection?.ownPriorities?.length && !options.selection.selectedScenarioIds.length
        ? "Las prioridades del Grupo Motor son propias y no proceden de recomendaciones del Perfil: no se vinculan aquí."
        : "Para vincular, el Grupo Motor debe adoptar recomendaciones del Perfil en una decisión vigente («Priorización»)."}</p>
      : onSave && <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Vincular una recomendación elegida</legend>
          <label>Recomendación del Perfil<select value={recommendationId} onChange={e => {
            setRecommendation(e.target.value); setScenario(""); setIndicator(""); setBaseline(""); setSameMeasure(false);
          }}>
            <option value="">Seleccionar recomendación</option>
            {options.recommendations.map(r => <option key={r.id} value={r.id}>{r.id} · {r.text}</option>)}
          </select></label>
          {recommendationId && <>
            <label>Prioridad adoptada<select value={scenarioId} onChange={e => {
              setScenario(e.target.value); setIndicator(""); setBaseline(""); setSameMeasure(false);
            }}>
              <option value="">Seleccionar prioridad</option>
              {priorities.map(s => <option key={s.id} value={s.id}>{s.tema}</option>)}
            </select></label>
            {!priorities.length && <p>Esta recomendación no figura en una prioridad adoptada.</p>}
          </>}
          {scenarioId && <>
            <label>Objetivo e indicador del Plan<select value={worksheetKey} onChange={e => {
              setIndicator(e.target.value); setBaseline(""); setSameMeasure(false);
            }}>
              <option value="">Seleccionar objetivo e indicador</option>
              {targets.map(t => <option key={t.indicatorWorksheetKey} value={t.indicatorWorksheetKey}>
                {t.moduleTitle} · {t.objectiveCode} {t.objectiveTitle} · {t.indicatorDisplayCode ?? t.indicatorCode} {t.indicatorTitle}
              </option>)}
            </select></label>
            {!targets.length && <p>Vincula la prioridad a una línea e incluye su objetivo e indicador en el Plan.</p>}
          </>}
          {target && <label>Línea de base del Perfil<select value={baselineResultId} onChange={e => {
            setBaseline(e.target.value); setSameMeasure(false);
          }}>
            <option value="">Sin línea de base vinculada</option>
            {options.baselines.map(b => <option key={b.id} value={b.id}>{b.title} · {b.value} {b.unit} · {b.period} · {b.scale || "ámbito sin declarar"} · {b.source}</option>)}
          </select></label>}
          {baselineResultId && <label><input type="checkbox" checked={sameMeasure} onChange={e => setSameMeasure(e.target.checked)} /> La cifra coincide con la definición y el ámbito del indicador.</label>}
          <button type="submit" disabled={!target || Boolean(baselineResultId && !sameMeasure)}>Guardar vínculo</button>
        </fieldset>
      </form>}
    {message && <p role="status">{message}</p>}
  </details>;
}
