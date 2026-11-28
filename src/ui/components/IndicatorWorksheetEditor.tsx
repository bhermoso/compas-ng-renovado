import { PlanningInstrumentCatalog } from "./PlanningInstrumentCatalog";
import { useState } from "react";
import {
  actionFields, consolidationFields, createIndicatorWorksheet, indicatorFields, indicatorReturnFields,
  worksheetContextChanged, worksheetNotationContext,
  type IndicatorWorksheet, type WorksheetContext, type WorksheetValues,
} from "../../domain/action-plan-catalog/IndicatorWorksheet";
import { agendaActuationsForIndicator, legacyActionHasContent } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import { ACTUATION_STATUS_LABEL, type AgendaActuation } from "../../domain/agenda/AgendaActuation";
import type { ActionPlanCatalogModule } from "../../domain/action-plan-catalog/ActionPlanCatalog";

interface Props {
  module?: ActionPlanCatalogModule;
  context: WorksheetContext;
  sheet?: IndicatorWorksheet;
  reviewNotice: string;
  onChange: (sheet: IndicatorWorksheet) => void;
  /** Actuaciones de la agenda: se muestran las que declaran contribuir a este indicador. */
  agendaActuations?: readonly AgendaActuation[];
  onGoToAgenda?: () => void;
}

function Fields({ fields, values, onChange, readOnly = false }: {
  fields: readonly (readonly [string, string])[];
  values: WorksheetValues;
  onChange?: (values: WorksheetValues) => void;
  readOnly?: boolean;
}) {
  return <div className="indicator-worksheet__fields">{fields.map(([key, label]) => (
    <label key={key}><span>{label}</span>
      <textarea aria-label={label} rows={2} value={values[key] ?? ""} placeholder={readOnly ? "Sin dato" : "Pendiente de cumplimentar"}
        readOnly={readOnly} onChange={(event) => onChange?.({ ...values, [key]: event.target.value })} />
    </label>
  ))}</div>;
}

/**
 * Ficha del indicador: solo medición (decisión del responsable, 28/11/2026).
 * Las actuaciones, con responsable, calendario y recursos, se registran en la
 * Agenda (Art. 16 bis) y declaran a qué indicador contribuyen.
 */
export function IndicatorWorksheetEditor({ context, sheet, reviewNotice, onChange, module, agendaActuations = [], onGoToAgenda }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const draft = sheet ?? createIndicatorWorksheet(context);
  const changed = worksheetContextChanged(draft, context);
  const displayDraft = {...draft, context: worksheetNotationContext(draft.context, context)};
  const returns = draft.returns ?? [];
  const linked = agendaActuationsForIndicator(agendaActuations, context.indicatorCode, context.indicatorDisplayCode);
  const legacy = draft.actions.filter(legacyActionHasContent);
  const code = context.indicatorDisplayCode ?? context.indicatorCode;
  function update(next: IndicatorWorksheet) {
    onChange({ ...next, updatedAt: new Date().toISOString() });
  }
  async function download() {
    setExporting(true);
    setError("");
    try {
      const { downloadIndicatorWorksheet } = await import("../../application/action-plan/exportIndicatorWorksheet");
      await downloadIndicatorWorksheet(displayDraft, reviewNotice, changed, linked);
    } catch {
      setError("No se pudo descargar el documento. Tus campos permanecen en el expediente; vuelve a intentarlo.");
    } finally { setExporting(false); }
  }
  return <details className="indicator-worksheet" open={open}
    onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>Ficha del indicador · {code}{sheet ? " · En preparación" : ""}{linked.length ? ` · ${linked.length} ${linked.length === 1 ? "actuación" : "actuaciones"} en la agenda` : ""}</summary>
    {open && <div className="indicator-worksheet__body">
      <p className="eyebrow">Ficha de medición del indicador · Borrador de trabajo</p>
      <p>{reviewNotice}</p>
      <p className="panel-note">La ficha define cómo se mide el indicador, quién lo consolida y qué datos se entregan. Las actuaciones
        (responsable, calendario y recursos) se registran en la Agenda y declaran a qué indicador contribuyen.
        Preparar la ficha no aprueba el objetivo ni modifica el Perfil de Salud Local.</p>
      {changed && <p role="alert" className="phase-blocked-notice">La redacción o versión de referencia ha cambiado.
        Esta ficha conserva su referencia anterior: revisa su correspondencia antes de utilizar los datos.</p>}
      <p><strong>Objetivo:</strong> {displayDraft.context.objective}<br /><strong>Indicador:</strong> {code} · {displayDraft.context.indicator}</p>
      <p className="pcm-source">{draft.context.source} · Versión {draft.context.moduleVersion} · Unidad: {draft.context.unit}</p>
      <h4>Definición de la medición</h4>
      <PlanningInstrumentCatalog notationModule={module} indicatorCode={context.indicatorCode} indicatorDisplayCode={context.indicatorDisplayCode} onSelect={(instrument,use) => {
        const note = `[OPCIÓN PENDIENTE DE REVISIÓN] ${instrument.name} · ${use}. Población: ${instrument.population}. ${instrument.limitation}${instrument.reference ? ` Fuente: ${instrument.reference}` : ''}`;
        if (!(draft.values.instrument ?? '').includes(note)) update({...draft, values:{...draft.values,instrument:[draft.values.instrument,note].filter(Boolean).join('\n\n')}});
      }} />
      <Fields fields={indicatorFields} values={draft.values} onChange={(values) => update({ ...draft, values })} />

      <h4>Actuaciones de la agenda que contribuyen a este indicador</h4>
      {linked.length === 0
        ? <p className="panel-note">Ninguna actuación de la agenda declara contribuir a {code}. Se declara en la ficha de la actuación, en «Vínculo estratégico».</p>
        : <ul className="indicator-worksheet__agenda">{linked.map((a) => <li key={a.id}>
            <strong>{a.name || "Actuación sin nombre"}</strong> · {ACTUATION_STATUS_LABEL[a.tracking.status]}
            {a.responsibles?.responsible ? ` · ${a.responsibles.responsible}` : ""}
          </li>)}</ul>}
      {onGoToAgenda && <button type="button" onClick={onGoToAgenda}>Ir a la Agenda</button>}
      {legacy.length > 0 && <details className="indicator-worksheet__legacy">
        <summary>Fichas de actuación anteriores ({legacy.length}) · solo lectura</summary>
        <p className="panel-note">Se registraron en la ficha del indicador antes del 28/11/2026. Se conservan sin cambios; regístralas en la Agenda.</p>
        {legacy.map((action) => <Fields key={action.id} fields={actionFields} values={action.values} readOnly />)}
      </details>}

      <h4>Entregas de datos por periodo</h4>
      {returns.length === 0 && <p className="panel-note">Transcribe aquí cada entrega de datos que recibas para este indicador.</p>}
      {returns.map((delivery, index) => <fieldset key={delivery.id}>
        <legend>Entrega {index + 1}</legend>
        <Fields fields={indicatorReturnFields} values={delivery.values} onChange={(values) => update({ ...draft,
          returns: returns.map((record) => record.id === delivery.id ? { ...record, values } : record),
        })} />
        <button type="button" onClick={() => {
          if (window.confirm("¿Eliminar esta entrega de datos?")) update({ ...draft, returns: returns.filter((record) => record.id !== delivery.id) });
        }}>Eliminar entrega</button>
      </fieldset>)}
      <button type="button" onClick={() => update({ ...draft, returns: [...returns, { id: crypto.randomUUID(), values: {} }] })}>Añadir entrega de datos</button>

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
          {exporting ? "Preparando Word…" : "Descargar ficha del indicador (Word)"}
        </button>
        {sheet?.updatedAt && <span>Última edición: {new Date(sheet.updatedAt).toLocaleString("es-ES")}</span>}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>}
  </details>;
}
