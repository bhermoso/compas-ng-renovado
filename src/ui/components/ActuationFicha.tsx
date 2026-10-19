import { useState } from "react";
import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import {
  ACTIVITY_TYPES, ACTIVITY_TYPE_LABEL, ACTUATION_PRIORITIES, ACTUATION_STATUSES, ACTUATION_STATUS_LABEL,
  AGENDA_QUARTERS, AGENDA_SETTINGS, AGENDA_SETTING_LABEL, NEXT_CYCLE_DECISIONS, NEXT_CYCLE_DECISION_LABEL,
  type AgendaActuation,
} from "../../domain/agenda/AgendaActuation";
import { readActuation } from "../../application/agenda/agendaActuations";

interface Props {
  actuation: AgendaActuation;
  worksheets: readonly IndicatorWorksheet[];
  onSave: (next: AgendaActuation) => void;
  onClose: () => void;
}

type Block = "identification" | "strategic" | "population" | "responsibles" | "tracking" | "result";

const text = (v: string | undefined) => v ?? "";
const num = (v: number | undefined) => (v === undefined ? "" : String(v));
const toNum = (v: string): number | undefined => {
  const n = Number(v.trim().replace(",", "."));
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? undefined : n;
};
const toList = (v: string): string[] | undefined => {
  const items = v.split("\n").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : undefined;
};
const orUndefined = (v: string): string | undefined => (v.trim() === "" ? undefined : v);

function ReadOnly({ label, value, hint }: { label: string; value?: string; hint?: string }) {
  return (
    <div className="ficha-field ficha-field--read">
      <span className="ficha-label">{label}</span>
      <span className="ficha-read-value">{value?.trim() ? value : "sin dato"}</span>
      {hint && <span className="ficha-hint">{hint}</span>}
    </div>
  );
}

export function ActuationFicha({ actuation, worksheets, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<AgendaActuation>(actuation);
  const reading = readActuation(actuation, worksheets);
  const linked = Boolean(actuation.linkedAction);
  const set = <B extends Block>(block: B, patch: Partial<AgendaActuation[B]>) =>
    setDraft((d) => ({ ...d, [block]: { ...d[block], ...patch } }));

  const field = (label: string, input: React.ReactNode) => (
    <label className="ficha-field"><span className="ficha-label">{label}</span>{input}</label>
  );
  const textInput = (block: Block, key: string, label: string, multiline = false) => {
    const value = text((draft[block] as Record<string, string | undefined>)[key]);
    const onChange = (v: string) => set(block, { [key]: orUndefined(v) } as never);
    return field(label, multiline
      ? <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
      : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />);
  };
  const numInput = (block: Block, key: string, label: string) =>
    field(label, <input type="number" min={0} value={num((draft[block] as Record<string, number | undefined>)[key])}
      onChange={(e) => set(block, { [key]: toNum(e.target.value) } as never)} />);
  const listInput = (block: Block, key: string, label: string) =>
    field(`${label} (una por línea)`, <textarea rows={2}
      value={((draft[block] as Record<string, string[] | undefined>)[key] ?? []).join("\n")}
      onChange={(e) => set(block, { [key]: toList(e.target.value) } as never)} />);

  const missingName = !linked && !(draft.name ?? "").trim();
  const unknownSum = (() => {
    const p = draft.population;
    const parts = [p.women, p.men, p.otherOrUnknown];
    if (parts.every((x) => x === undefined) || p.reachedParticipants === undefined) return null;
    const sum = parts.reduce<number>((s, x) => s + (x ?? 0), 0);
    return sum === p.reachedParticipants ? null : `Mujeres, hombres y otro suman ${sum} y los participantes alcanzados son ${p.reachedParticipants}.`;
  })();

  return (
    <section className="ficha" aria-label={`Ficha de la actuación ${reading.name}`}>
      <header className="ficha-header">
        <div>
          <p className="eyebrow">Ficha de actuación</p>
          <h3>{reading.name}</h3>
          <p className="panel-note">
            {linked ? "Vinculada al Plan de Acción. Los datos que el plan ya recoge se leen de allí." : "Alta manual."}
          </p>
        </div>
        <div className="ficha-actions">
          <button type="button" disabled={missingName} onClick={() => onSave(draft)}>Guardar ficha</button>
          <button type="button" className="ficha-secondary" onClick={onClose}>Cerrar sin guardar</button>
        </div>
      </header>

      {missingName && <p className="ficha-warning" role="status">El nombre es obligatorio.</p>}
      {reading.orphan && (
        <p className="ficha-warning" role="status">
          Esta actuación ya no figura en el Plan de Acción. Se conserva el registro de agenda y sus datos; no se ha borrado nada.
        </p>
      )}

      <div className="ficha-field-row">
        {field("Entorno", (
          <select value={draft.setting ?? ""} onChange={(e) => setDraft((d) => ({ ...d, setting: (e.target.value || null) as AgendaActuation["setting"] }))}>
            <option value="">Sin asignar</option>
            {AGENDA_SETTINGS.map((s) => <option key={s} value={s}>{AGENDA_SETTING_LABEL[s]}</option>)}
          </select>
        ))}
      </div>

      <details open>
        <summary>Identificación</summary>
        {linked ? (
          <>
            <ReadOnly label="Nombre" value={reading.name} hint={reading.planEditHint} />
            <ReadOnly label="Descripción (contribución al objetivo)" value={reading.description} hint={reading.planEditHint} />
            <ReadOnly label="Calendario" value={reading.schedule} hint={reading.planEditHint} />
          </>
        ) : (
          <>
            {field("Nombre", <input type="text" value={text(draft.name)} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />)}
            {textInput("identification", "description", "Descripción", true)}
          </>
        )}
        {textInput("identification", "code", "Código")}
        {textInput("identification", "program", "Programa")}
        {field("Tipo de actividad", (
          <select value={draft.identification.activityType ?? ""} onChange={(e) => set("identification", { activityType: (e.target.value || undefined) as never })}>
            <option value="">Sin dato</option>
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</option>)}
          </select>
        ))}
        {textInput("identification", "mainTopic", "Temática principal")}
        {listInput("identification", "secondaryTopics", "Temáticas secundarias")}
        {textInput("identification", "territorialScope", "Ámbito territorial")}
        {numInput("identification", "year", "Año")}
        {field("Trimestre", (
          <select value={draft.identification.quarter ?? ""} onChange={(e) => set("identification", { quarter: (e.target.value || undefined) as never })}>
            <option value="">Sin dato</option>
            {AGENDA_QUARTERS.map((q) => <option key={q} value={q}>{q === "anual" ? "Todo el año" : q}</option>)}
          </select>
        ))}
      </details>

      <details>
        <summary>Vínculo estratégico</summary>
        {textInput("strategic", "framework", "Marco estratégico")}
        {textInput("strategic", "line", "Línea")}
        {textInput("strategic", "objective", "Objetivo", true)}
        {textInput("strategic", "mainIndicator", "Indicador principal")}
        {listInput("strategic", "secondaryIndicators", "Indicadores secundarios")}
        {textInput("strategic", "target", "Meta")}
        {textInput("strategic", "frequency", "Frecuencia")}
      </details>

      <details>
        <summary>Población</summary>
        {linked
          ? <ReadOnly label="Población destinataria" value={reading.population} hint={reading.planEditHint} />
          : textInput("population", "population", "Población destinataria")}
        {textInput("population", "collective", "Colectivo")}
        {textInput("population", "lifeStage", "Etapa de vida")}
        {textInput("population", "ageGroups", "Grupos de edad")}
        {numInput("population", "plannedParticipants", "Participantes previstos")}
        {numInput("population", "reachedParticipants", "Participantes alcanzados")}
        {numInput("population", "women", "Mujeres")}
        {numInput("population", "men", "Hombres")}
        {numInput("population", "otherOrUnknown", "Otro o no consta")}
        {numInput("population", "sessions", "Número de sesiones")}
        {unknownSum && <p className="ficha-warning" role="status">{unknownSum} No se corrige: revísalo.</p>}
      </details>

      <details>
        <summary>Responsables</summary>
        {linked
          ? <ReadOnly label="Responsable" value={reading.responsible} hint={reading.planEditHint} />
          : textInput("responsibles", "responsible", "Responsable")}
        {textInput("responsibles", "organisation", "Organización")}
        {textInput("responsibles", "responsibleEntity", "Entidad responsable")}
        {textInput("responsibles", "referencePerson", "Persona referente")}
        {textInput("responsibles", "contact", "Contacto")}
        <p className="ficha-hint">Persona referente y contacto son datos personales de terceros. Son opcionales.</p>
        {textInput("responsibles", "professionals", "Profesionales", true)}
        {textInput("responsibles", "collaboratingEntities", "Entidades colaboradoras", true)}
        {textInput("responsibles", "associations", "Asociaciones implicadas", true)}
        {textInput("responsibles", "communityAssets", "Activos comunitarios", true)}
      </details>

      <details>
        <summary>Seguimiento</summary>
        {field("Estado", (
          <select value={draft.tracking.status} onChange={(e) => set("tracking", { status: e.target.value as never })}>
            {ACTUATION_STATUSES.map((s) => <option key={s} value={s}>{ACTUATION_STATUS_LABEL[s]}</option>)}
          </select>
        ))}
        {field("Prioridad", (
          <select value={draft.tracking.priority ?? ""} onChange={(e) => set("tracking", { priority: (e.target.value || undefined) as never })}>
            <option value="">Sin dato</option>
            {ACTUATION_PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
        ))}
        {field("Fecha prevista", <input type="date" value={text(draft.tracking.plannedDate)} onChange={(e) => set("tracking", { plannedDate: orUndefined(e.target.value) })} />)}
        {field("Fecha real", <input type="date" value={text(draft.tracking.actualDate)} onChange={(e) => set("tracking", { actualDate: orUndefined(e.target.value) })} />)}
        {linked
          ? <ReadOnly label="Recursos" value={reading.resources} hint={reading.planEditHint} />
          : textInput("tracking", "resources", "Recursos", true)}
        {textInput("tracking", "evidence", "Evidencia", true)}
        {textInput("tracking", "notes", "Observaciones", true)}
      </details>

      <details>
        <summary>Resultado</summary>
        <p className="ficha-hint">Lo registra el equipo. El sistema no calcula cumplimiento ni etiqueta resultados.</p>
        {linked
          ? <ReadOnly label="Resultado consolidado del indicador" value={reading.consolidatedResult} hint="Se lee de la consolidación del Plan de Acción." />
          : textInput("result", "indicatorValueReached", "Valor del indicador alcanzado")}
        {textInput("result", "observedResult", "Resultado observado", true)}
        {textInput("result", "verificationSource", "Fuente de verificación")}
        {textInput("result", "barriers", "Barreras", true)}
        {textInput("result", "facilitators", "Facilitadores", true)}
        {textInput("result", "learnings", "Aprendizajes", true)}
        {field("Decisión para el siguiente ciclo", (
          <select value={draft.result.nextCycleDecision} onChange={(e) => set("result", { nextCycleDecision: e.target.value as never })}>
            {NEXT_CYCLE_DECISIONS.map((d) => <option key={d} value={d}>{NEXT_CYCLE_DECISION_LABEL[d]}</option>)}
          </select>
        ))}
      </details>
    </section>
  );
}
