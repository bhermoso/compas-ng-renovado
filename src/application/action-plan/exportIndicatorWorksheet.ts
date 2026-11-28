import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import {
  actionFields, consolidationFields, indicatorFields, indicatorReturnFields,
  type IndicatorWorksheet, type WorksheetValues,
} from "../../domain/action-plan-catalog/IndicatorWorksheet";
import { legacyActionHasContent } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import { ACTUATION_STATUS_LABEL, type AgendaActuation } from "../../domain/agenda/AgendaActuation";

const statusLabels = { pending: "Sin datos / pendiente", provisional: "Provisional", reviewed: "Revisado por la persona responsable", "not-calculable": "No calculable" };
function text(value: string) { return new Paragraph({ children: value.split("\n").map((line, index) => new TextRun({ text: line, break: index ? 1 : 0 })) }); }
function heading(value: string) { return new Paragraph({ text: value, heading: HeadingLevel.HEADING_1 }); }
function fields(definitions: readonly (readonly [string, string])[], values: WorksheetValues) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ tableHeader: true, children: ["Campo", "Información que se cumplimenta"].map((label) =>
      new TableCell({ shading: { fill: "E8F1F2" }, children: [text(label)] })) }),
    ...definitions.map(([key, label]) => new TableRow({
    cantSplit: true,
    children: [new TableCell({ width: { size: 38, type: WidthType.PERCENTAGE }, children: [text(label)] }),
      new TableCell({ width: { size: 62, type: WidthType.PERCENTAGE }, children: [text(values[key]?.trim() || "[Pendiente de cumplimentar]")] })],
  }))] });
}

/**
 * Ficha del indicador (solo medición, 28/11/2026). Los mismos valores y campos
 * alimentan el editor y el Word. Las actuaciones se listan desde la Agenda.
 */
export function buildIndicatorWorksheetDocument(sheet: IndicatorWorksheet, reviewNotice: string, stale: boolean, agendaActuations: readonly AgendaActuation[] = []) {
  const context = sheet.context;
  const code = context.indicatorDisplayCode ?? context.indicatorCode;
  const children: (Paragraph | Table)[] = [
    heading("Ficha del indicador"),
    text("COMPÁS NG · Borrador de trabajo para cumplimentar"),
    text(`Ámbito: ${context.municipalityId} · ${context.line}`),
    text(context.generalObjective), text(context.objective),
    text(`${code} · ${context.indicator}`),
    text(`Unidad: ${context.unit} · Fuente: ${context.source} · Versión ${context.moduleVersion}`),
    text(reviewNotice), text("Preparar esta ficha no constituye aprobación institucional ni evidencia diagnóstica."),
  ];
  if (stale) children.push(text("ATENCIÓN: la referencia actual ha cambiado. Esta ficha conserva la anterior y requiere revisión."));
  children.push(heading("Definición de la medición y responsable del indicador"), fields(indicatorFields, sheet.values));
  children.push(heading("Actuaciones de la agenda que contribuyen a este indicador"));
  if (agendaActuations.length) for (const a of agendaActuations) children.push(text(`${a.name || "Actuación sin nombre"} · ${ACTUATION_STATUS_LABEL[a.tracking.status]}${a.responsibles?.responsible ? ` · ${a.responsibles.responsible}` : ""}`));
  else children.push(text("Ninguna actuación de la agenda declara contribuir a este indicador."));
  const legacy = sheet.actions.filter(legacyActionHasContent);
  for (const action of legacy) children.push(heading("Ficha de actuación anterior (solo lectura)"), fields(actionFields, action.values));
  // Se deja una entrega en blanco para entregar la ficha a quien aporta los datos.
  const returns = sheet.returns?.length ? sheet.returns : [{ id: "", values: {} }];
  for (const delivery of returns) children.push(heading("Entrega de datos del periodo"), fields(indicatorReturnFields, delivery.values));
  children.push(heading("Consolidación del indicador"), text("No sumar recuentos solapados ni promediar porcentajes. Comprobar definiciones y periodos compatibles. Las actividades no sustituyen la medición del objetivo."));
  const records = sheet.consolidations.length ? sheet.consolidations : [{ status: "pending" as const, values: {} }];
  for (const record of records) children.push(text(`Estado: ${statusLabels[record.status]}`), fields(consolidationFields, record.values));
  children.push(text("Sin dato no equivale a cero. Un porcentaje con denominador cero no es calculable. Registrar agregados y referencias; conservar los datos personales en la fuente custodiada."));
  return new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, children }],
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120 } } } } },
  });
}

export async function downloadIndicatorWorksheet(sheet: IndicatorWorksheet, reviewNotice: string, stale: boolean, agendaActuations: readonly AgendaActuation[] = []) {
  const blob = await Packer.toBlob(buildIndicatorWorksheetDocument(sheet, reviewNotice, stale, agendaActuations));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Ficha-${sheet.context.municipalityId}-${sheet.context.indicatorDisplayCode ?? sheet.context.indicatorCode}.docx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
