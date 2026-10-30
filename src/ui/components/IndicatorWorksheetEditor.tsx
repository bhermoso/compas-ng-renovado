import { PlanningInstrumentCatalog } from "./PlanningInstrumentCatalog";
import { useState } from "react";
import {
  actionFields, activityFields, consolidationFields, createIndicatorWorksheet, indicatorFields,
  returnFields, worksheetContextChanged, worksheetNotationContext,
  type IndicatorWorksheet, type WorksheetContext, type WorksheetValues,
} from "../../domain/action-plan-catalog/IndicatorWorksheet";
import { actionProposalsForIndicator } from "../../domain/action-plan-catalog/ActionWorksheetProposal";

import type { ActionPlanCatalogModule } from "../../domain/action-plan-catalog/ActionPlanCatalog";

interface Props {
  module?: ActionPlanCatalogModule;
  context: WorksheetContext;
  sheet?: IndicatorWorksheet;
  reviewNotice: string;
  onChange: (sheet: IndicatorWorksheet) => void;
}

function Fields({ fields, values, onChange }: {
  fields: readonly (readonly [string, string])[];
  values: WorksheetValues;
  onChange: (values: WorksheetValues) => void;
}) {
  return <div className="indicator-worksheet__fields">{fields.map(([key, label]) => (
    <label key={key}><span>{label}</span>
      <textarea aria-label={label} rows={2} value={values[key] ?? ""} placeholder="Pendiente de cumplimentar"
        onChange={(event) => onChange({ ...values, [key]: event.target.value })} />
    </label>
  ))}</div>;
}

export function IndicatorWorksheetEditor({ context, sheet, reviewNotice, onChange, module }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const draft = sheet ?? createIndicatorWorksheet(context);
  const changed = worksheetContextChanged(draft, context);
  const displayDraft = {...draft, context: worksheetNotationContext(draft.context, context)};
  const actionProposals = actionProposalsForIndicator(context.indicatorCode);
  function update(next: IndicatorWorksheet) {
    onChange({ ...next, updatedAt: new Date().toISOString() });
  }
  async function download(actionId?: string) {
    setExporting(true);
    setError("");
    try {
      const { downloadIndicatorWorksheet } = await import("../../application/action-plan/exportIndicatorWorksheet");
      await downloadIndicatorWorksheet(displayDraft, reviewNotice, changed, actionId);
    } catch {
      setError("No se pudo descargar el documento. Tus campos permanecen en el expediente; vuelve a intentarlo.");
    } finally { setExporting(false); }
  }
  return <details className="indicator-worksheet" open={open}
    onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>Gestionar actuaciones · {context.indicatorDisplayCode ?? context.indicatorCode}{sheet ? " · En preparación" : ""}</summary>
    {open && <div className="indicator-worksheet__body">
      <p className="eyebrow">Herramienta de recogida y seguimiento · Borrador de trabajo</p>
      <h4>Marco de medición del indicador</h4>
      <p>{reviewNotice}</p>
      <p className="panel-note">Preparar el seguimiento no aprueba el objetivo ni modifica el Perfil de Salud Local.
        El marco común y las fichas de actuación se incorporan al expediente de este municipio en este navegador. Descarga cada ficha para entregarla a la persona responsable;
        transcribe aquí las entregas que recibas.</p>
      {changed && <p role="alert" className="phase-blocked-notice">La redacción o versión de referencia ha cambiado.
        Este seguimiento conserva su referencia anterior: revisa su correspondencia antes de utilizar los datos.</p>}
      <p><strong>Indicador al que aportarán datos las actuaciones:</strong> {displayDraft.context.objective}<br />{displayDraft.context.indicatorDisplayCode ?? displayDraft.context.indicatorCode} · {displayDraft.context.indicator}</p>
      <p className="pcm-source">{draft.context.source} · Versión {draft.context.moduleVersion} · Unidad: {draft.context.unit}</p>
      <PlanningInstrumentCatalog notationModule={module} indicatorCode={context.indicatorCode} indicatorDisplayCode={context.indicatorDisplayCode} onSelect={(instrument,use) => {
        const note = `[OPCIÓN PENDIENTE DE REVISIÓN] ${instrument.name} · ${use}. Población: ${instrument.population}. ${instrument.limitation}${instrument.reference ? ` Fuente: ${instrument.reference}` : ''}`;
        if (!(draft.values.instrument ?? '').includes(note)) update({...draft, values:{...draft.values,instrument:[draft.values.instrument,note].filter(Boolean).join('\n\n')}});
      }} />
      <Fields fields={indicatorFields} values={draft.values} onChange={(values) => update({ ...draft, values })} />
      <h4>Fichas de las actuaciones que alimentan el indicador</h4>
      <p>Crea una ficha por actuación y especifica qué información entregará su responsable a quien consolida el indicador.
        No se han añadido actuaciones ni responsables automáticamente.</p>
      {actionProposals.length > 0 && <section aria-label="Propuestas de actuaciones para revisar">
        <h5>Propuestas de actuaciones para revisar</h5>
        <p className="panel-note">Son borradores técnicos. Solo se convierten en ficha de actuación al pulsar el botón y siguen pendientes de revisión y acuerdo.</p>
        {actionProposals.map((proposal) => {
          const added = draft.actions.some((action) => action.id === proposal.id);
          return <article className="indicator-worksheet__action" key={proposal.id}>
            <strong>{proposal.values.name}</strong>
            <p>{proposal.values.contribution}</p>
            <p className="pcm-source">{proposal.values.population}</p>
            <button type="button" disabled={added} onClick={() => update({ ...draft,
            actions: [...draft.actions, { id: proposal.id, values: { ...proposal.values }, activities: [], returns: [] }],
            })}>{added ? "Ficha de propuesta creada" : "Crear ficha desde esta propuesta"}</button>
          </article>;
        })}
      </section>}
      {draft.actions.length === 0 && <p className="panel-note">Todavía no hay actuaciones vinculadas.</p>}
      {draft.actions.map((action, index) => <details className="indicator-worksheet__action" key={action.id} open>
        <summary>Ficha de actuación {index + 1} · {action.values.name || "Sin nombre"}</summary>
        <p className="pcm-source">Código de enlace: {action.id}</p>
        <Fields fields={actionFields} values={action.values} onChange={(values) => update({ ...draft,
          actions: draft.actions.map((item) => item.id === action.id ? { ...item, values } : item),
        })} />
        <button type="button" disabled={exporting} onClick={() => void download(action.id)}>Descargar ficha de esta actuación (Word)</button>
        <h5>Actividades, hitos o productos verificables</h5>
        {(action.activities ?? []).length === 0 && <p className="panel-note">Añade actividades cuando exista una unidad concreta de ejecución. No se crean hitos automáticamente.</p>}
        {(action.activities ?? []).map((activity, activityIndex) => <fieldset key={activity.id}>
          <legend>Actividad {activityIndex + 1}</legend>
          <Fields fields={activityFields} values={activity.values} onChange={(values) => update({ ...draft,
            actions: draft.actions.map((item) => item.id === action.id ? { ...item,
              activities: (item.activities ?? []).map((record) => record.id === activity.id ? { ...record, values } : record),
            } : item),
          })} />
          <button type="button" onClick={() => {
            if (window.confirm("¿Eliminar esta actividad de la ficha?")) update({ ...draft,
              actions: draft.actions.map((item) => item.id === action.id
                ? { ...item, activities: (item.activities ?? []).filter((item) => item.id !== activity.id) } : item),
            });
          }}>Eliminar actividad</button>
        </fieldset>)}
        <button type="button" onClick={() => update({ ...draft, actions: draft.actions.map((item) => item.id === action.id
          ? { ...item, activities: [...(item.activities ?? []), { id: crypto.randomUUID(), values: {} }] } : item),
        })}>Añadir actividad</button>
        <h5>Entregas de datos por periodo</h5>
        {action.returns.map((delivery, deliveryIndex) => <fieldset key={delivery.id}>
          <legend>Entrega {deliveryIndex + 1}</legend>
          <Fields fields={returnFields} values={delivery.values} onChange={(values) => update({ ...draft,
            actions: draft.actions.map((item) => item.id === action.id ? { ...item,
              returns: item.returns.map((record) => record.id === delivery.id ? { ...record, values } : record),
            } : item),
          })} />
          <button type="button" onClick={() => {
            if (window.confirm("¿Eliminar esta entrega de datos?")) update({ ...draft,
              actions: draft.actions.map((item) => item.id === action.id
                ? { ...item, returns: item.returns.filter((item) => item.id !== delivery.id) } : item),
            });
          }}>Eliminar entrega</button>
        </fieldset>)}
        <button type="button" onClick={() => update({ ...draft, actions: draft.actions.map((item) => item.id === action.id
          ? { ...item, returns: [...item.returns, { id: crypto.randomUUID(), values: {} }] } : item),
        })}>Añadir entrega de datos</button>
        <button type="button" onClick={() => {
          if (window.confirm("¿Eliminar esta ficha de actuación y todas sus entregas?")) update({ ...draft,
            actions: draft.actions.filter((item) => item.id !== action.id),
          });
        }}>Eliminar ficha de actuación</button>
      </details>)}
      <button type="button" onClick={() => update({ ...draft,
        actions: [...draft.actions, { id: crypto.randomUUID(), values: {}, activities: [], returns: [] }],
      })}>Crear ficha de actuación</button>
      <h4>Consolidación del indicador por periodo</h4>
      <p>No se suman automáticamente las entregas ni se promedian sus porcentajes. La persona responsable
        comprueba definiciones, periodos y duplicados. Sin dato no equivale a cero; con denominador cero,
        el porcentaje no es calculable. La actividad realizada no sustituye el resultado del objetivo.</p>
      {draft.consolidations.map((record, index) => <fieldset key={record.id}>
        <legend>Consolidación {index + 1}</legend>
        <label>Estado del dato
          <select value={record.status} onChange={(event) => update({ ...draft,
            consolidations: draft.consolidations.map((item) => item.id === record.id
              ? { ...item, status: event.target.value as typeof record.status } : item),
          })}>
            <option value="pending">Sin datos / pendiente</option>
            <option value="provisional">Provisional</option>
            <option value="reviewed">Revisado por la persona responsable</option>
            <option value="not-calculable">No calculable</option>
          </select>
        </label>
        <Fields fields={consolidationFields} values={record.values} onChange={(values) => update({ ...draft,
          consolidations: draft.consolidations.map((item) => item.id === record.id ? { ...item, values } : item),
        })} />
        <button type="button" onClick={() => {
          if (window.confirm("¿Eliminar este periodo de consolidación?")) update({ ...draft,
            consolidations: draft.consolidations.filter((item) => item.id !== record.id),
          });
        }}>Eliminar periodo</button>
      </fieldset>)}
      <button type="button" onClick={() => update({ ...draft,
        consolidations: [...draft.consolidations, { id: crypto.randomUUID(), status: "pending", values: {} }],
      })}>Añadir periodo de consolidación</button>
      <p className="panel-note">Recoge datos agregados y referencias de justificantes. La identificación personal se conserva en la fuente custodiada.</p>
      <div className="indicator-worksheet__footer">
        <button type="button" disabled={exporting} onClick={() => void download()}>
          {exporting ? "Preparando Word…" : "Descargar dossier del indicador (Word)"}
        </button>
        {sheet?.updatedAt && <span>Última edición: {new Date(sheet.updatedAt).toLocaleString("es-ES")}</span>}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>}
  </details>;
}
