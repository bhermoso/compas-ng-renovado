import { useMemo, useRef, useState } from "react";
import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import {
  ACTUATION_STATUSES, ACTUATION_STATUS_LABEL, AGENDA_SETTINGS, AGENDA_SETTING_LABEL,
  type AgendaActuation, type AgendaSetting,
} from "../../domain/agenda/AgendaActuation";
import {
  addManualActuation, buildActuationBoard, duplicateManualActuation, importActuationsFromPlan,
  listPlanActions, moveActuation, readActuation, removeActuation,
} from "../../application/agenda/agendaActuations";
import { ActuationFicha } from "./ActuationFicha";
import "./AgendaBoard.css";

interface Props {
  municipalityId: string;
  municipalityName: string;
  actuations: readonly AgendaActuation[];
  worksheets: readonly IndicatorWorksheet[];
  onChange: (next: AgendaActuation[]) => void;
  /** Abre esta ficha al montar (p. ej. desde la vista de Evaluación). */
  focusId?: string;
}

type Column = AgendaSetting | "unassigned";
const COLUMNS: { key: Column; label: string }[] = [
  { key: "unassigned", label: "Sin asignar" },
  ...AGENDA_SETTINGS.map((s) => ({ key: s as Column, label: AGENDA_SETTING_LABEL[s] })),
];
const toSetting = (c: Column): AgendaSetting | null => (c === "unassigned" ? null : c);
const newId = () => `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function AgendaBoard({ municipalityId, municipalityName, actuations, worksheets, onChange, focusId }: Props) {
  const [openId, setOpenId] = useState<string | undefined>(focusId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [dragOver, setDragOver] = useState<Column | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | AgendaActuation["tracking"]["status"]>("");
  const [undo, setUndo] = useState<{ list: AgendaActuation[]; name: string } | null>(null);
  const dragId = useRef<string | null>(null);

  const board = useMemo(() => buildActuationBoard(actuations), [actuations]);
  const pendingFromPlan = useMemo(
    () => listPlanActions(worksheets).filter((ref) =>
      !actuations.some((a) => a.linkedAction?.worksheetKey === ref.worksheetKey && a.linkedAction.actionId === ref.actionId)).length,
    [worksheets, actuations]
  );
  const opened = actuations.find((a) => a.id === openId);
  const now = () => new Date().toISOString();

  const dropOn = (column: Column, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(null);
    if (filtering) return;
    const id = dragId.current ?? event.dataTransfer.getData("text/plain");
    dragId.current = null;
    if (!id) return;
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-actuation-id]"))
      .filter((el) => el.dataset.actuationId !== id);
    let index = cards.length;
    for (let i = 0; i < cards.length; i += 1) {
      const rect = cards[i].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) { index = i; break; }
    }
    onChange(moveActuation(actuations, id, toSetting(column), index, now()));
  };

  const card = (a: AgendaActuation) => {
    const r = readActuation(a, worksheets);
    return (
      <article
        key={a.id}
        className={`agenda-card${r.orphan ? " agenda-card--orphan" : ""}`}
        data-actuation-id={a.id}
        draggable={!filtering}
        onDragStart={(e) => { dragId.current = a.id; e.dataTransfer.setData("text/plain", a.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { dragId.current = null; setDragOver(null); }}
      >
        <button type="button" className="agenda-card__title" onClick={() => setOpenId(a.id)}>{r.name}</button>
        <p className="agenda-card__meta">
          <span>{ACTUATION_STATUS_LABEL[a.tracking.status]}</span>
          {a.tracking.priority && <span>Prioridad {a.tracking.priority}</span>}
          {a.identification.quarter && <span>{a.identification.quarter === "anual" ? "Todo el año" : a.identification.quarter}{a.identification.year ? ` ${a.identification.year}` : ""}</span>}
          {a.linkedAction && <span>Plan de Acción</span>}
        </p>
        {r.orphan && <p className="agenda-card__warn">Ya no figura en el plan.</p>}
        <div className="agenda-card__tools">
          <label>
            <span className="agenda-sr">Entorno de {r.name}</span>
            <select value={a.setting ?? ""} onChange={(e) => onChange(moveActuation(actuations, a.id, (e.target.value || null) as AgendaSetting | null, 9999, now()))}>
              <option value="">Sin asignar</option>
              {AGENDA_SETTINGS.map((s) => <option key={s} value={s}>{AGENDA_SETTING_LABEL[s]}</option>)}
            </select>
          </label>
          {!a.linkedAction && <button type="button" onClick={() => onChange(duplicateManualActuation(actuations, a.id, newId(), now()))}>Duplicar</button>}
          {confirmDelete === a.id ? (
            <>
              <button type="button" className="agenda-danger" onClick={() => { setUndo({ list: [...actuations], name: r.name }); onChange(removeActuation(actuations, a.id)); setConfirmDelete(null); if (openId === a.id) setOpenId(undefined); }}>Eliminar de verdad</button>
              <button type="button" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(a.id)}>Eliminar</button>
          )}
        </div>
      </article>
    );
  };

  const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtering = query.trim() !== "" || statusFilter !== "";
  const matches = (a: AgendaActuation) => {
    if (statusFilter && a.tracking.status !== statusFilter) return false;
    const q = norm(query.trim());
    if (!q) return true;
    const r = readActuation(a, worksheets);
    return norm([r.name, r.description, r.responsible, r.population, a.identification.program, a.identification.mainTopic].filter(Boolean).join(" ")).includes(q);
  };
  const allItems = (c: Column) => (c === "unassigned" ? board.unassigned : board.columns[c]);
  const items = (c: Column) => allItems(c).filter(matches);

  return (
    <section className="workspace-panel agenda">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Agenda · {municipalityName}</p>
          <h2>Agenda de actuaciones por entornos</h2>
        </div>
        <p className="panel-note">
          Registro de trabajo del equipo técnico. Cada actuación pertenece a un entorno que decide una persona:
          arrastra la tarjeta o usa el selector. El sistema no asigna entornos, trimestres ni prioridades.
        </p>
      </div>

      <div className="agenda-toolbar">
        {creating ? (
          <form className="agenda-new" onSubmit={(e) => {
            e.preventDefault();
            const next = addManualActuation(actuations, { id: newId(), municipalityId, name: newName, now: now() });
            if (next.length === actuations.length) return;
            onChange(next);
            setNewName(""); setCreating(false); setOpenId(next[next.length - 1].id);
          }}>
            <label><span className="agenda-sr">Nombre de la actuación</span>
              <input autoFocus type="text" value={newName} placeholder="Nombre de la actuación" onChange={(e) => setNewName(e.target.value)} />
            </label>
            <button type="submit" disabled={!newName.trim()}>Crear</button>
            <button type="button" onClick={() => { setCreating(false); setNewName(""); }}>Cancelar</button>
          </form>
        ) : (
          <button type="button" onClick={() => setCreating(true)}>Nueva actuación</button>
        )}
        <button type="button" disabled={pendingFromPlan === 0} onClick={() => {
          const out = importActuationsFromPlan(actuations, { municipalityId, worksheets, now: now(), newId });
          onChange(out.list);
          setMessage(`${out.added} actuaciones traídas del Plan de Acción, sin asignar.`);
        }}>
          Traer actuaciones del Plan de Acción{pendingFromPlan > 0 ? ` (${pendingFromPlan})` : ""}
        </button>
        {pendingFromPlan === 0 && <span className="panel-note">{listPlanActions(worksheets).length === 0 ? "El Plan de Acción aún no tiene actuaciones." : "Todas las actuaciones del plan están ya en la agenda."}</span>}
      </div>
      <div className="agenda-filters" role="search">
        <label><span className="agenda-sr">Buscar actuaciones</span>
          <input type="search" value={query} placeholder="Buscar por nombre, responsable, población…" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label><span className="agenda-sr">Filtrar por estado</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="">Todos los estados</option>
            {ACTUATION_STATUSES.map((s) => <option key={s} value={s}>{ACTUATION_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        {filtering && <button type="button" onClick={() => { setQuery(""); setStatusFilter(""); }}>Quitar filtros</button>}
        {filtering && <span className="panel-note" role="status">{COLUMNS.reduce((n, c) => n + items(c.key).length, 0)} de {actuations.length} actuaciones. Con filtro activo, mueve las tarjetas con el selector de entorno.</span>}
      </div>
      {message && <p role="status" aria-live="polite" className="panel-note">{message}</p>}
      {undo && (
        <p role="status" className="panel-note agenda-undo">
          «{undo.name}» eliminada.{" "}
          <button type="button" onClick={() => { onChange(undo.list); setUndo(null); setMessage("Eliminación deshecha."); }}>Deshacer</button>{" "}
          <button type="button" onClick={() => setUndo(null)}>Descartar aviso</button>
        </p>
      )}

      <div className="agenda-board">
        {COLUMNS.map(({ key, label }) => (
          <div
            key={key}
            className={`agenda-column agenda-column--${key}${dragOver === key ? " agenda-column--over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(null); }}
            onDrop={(e) => dropOn(key, e)}
          >
            <header><h3>{label}</h3><span className="agenda-count">{filtering ? `${items(key).length}/${allItems(key).length}` : items(key).length}</span></header>
            <div className="agenda-column__body">
              {items(key).length === 0 && <p className="agenda-empty">{filtering && allItems(key).length > 0 ? "Ninguna coincide con el filtro" : "Sin actuaciones"}</p>}
              {items(key).map(card)}
            </div>
          </div>
        ))}
      </div>

      {opened && (
        <ActuationFicha
          key={opened.id}
          actuation={opened}
          worksheets={worksheets}
          onClose={() => setOpenId(undefined)}
          onSave={(next) => {
            const moved = next.setting !== opened.setting;
            let list = actuations.map((a) => (a.id === next.id ? { ...next, setting: opened.setting, order: opened.order, updatedAt: now() } : a));
            if (moved) list = moveActuation(list, next.id, next.setting, 9999, now());
            onChange(list);
            setMessage("Ficha guardada.");
          }}
        />
      )}
    </section>
  );
}
