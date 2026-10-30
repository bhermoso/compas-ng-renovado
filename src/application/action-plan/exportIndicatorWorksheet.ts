import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import {
  actionFields, activityFields, consolidationFields, indicatorFields, returnFields,
  type IndicatorWorksheet, type WorksheetValues,
} from "../../domain/action-plan-catalog/IndicatorWorksheet";

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

/** The same saved values and field definitions feed both the editor and Word. No generated observations. */
export function buildIndicatorWorksheetDocument(sheet: IndicatorWorksheet, reviewNotice: string, stale: boolean, actionId?: string) {
  const context = sheet.context;
  const children: (Paragraph | Table)[] = [
    heading(actionId ? "Ficha de actuación y entrega de datos" : "Ficha de objetivo, indicador y actuaciones"),
    text("COMPÁS NG · Borrador de trabajo para cumplimentar"),
    text(`Ámbito: ${context.municipalityId} · ${context.line}`),
    text(context.generalObjective), text(context.objective),
    text(`${context.indicatorDisplayCode ?? context.indicatorCode} · ${context.indicator}`),
    text(`Unidad: ${context.unit} · Fuente: ${context.source} · Versión ${context.moduleVersion}`),
    text(reviewNotice), text("Preparar esta ficha no constituye aprobación institucional ni evidencia diagnóstica."),
  ];
  if (stale) children.push(text("ATENCIÓN: la referencia actual ha cambiado. Esta ficha conserva la anterior y requiere revisión."));
  children.push(heading("Definición de la medición y responsable del indicador"), fields(indicatorFields, sheet.values));
  const actions = actionId ? sheet.actions.filter((action) => action.id === actionId) : sheet.actions;
  for (const action of actions) {
    children.push(new Paragraph({ text: "Ficha de actuación o programa", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
      text(`Vínculo: ${context.indicatorDisplayCode ?? context.indicatorCode} · Código de actuación: ${action.id}`), fields(actionFields, action.values));
    const activities = action.activities ?? [];
    children.push(heading("Actividades, hitos o productos verificables"));
    if (activities.length) {
      for (const activity of activities) children.push(fields(activityFields, activity.values));
    } else children.push(fields(activityFields, {}));
    // An unfilled return is provided for handing the sheet to the action owner.
    const returns = action.returns.length ? action.returns : [{ id: "", values: {} }];
    for (const delivery of returns) children.push(heading("Entrega de datos del periodo"), fields(returnFields, delivery.values));
  }
  if (!actions.length) children.push(heading("Actuación o programa por concretar"), fields(actionFields, {}), heading("Entrega de datos del periodo"), fields(returnFields, {}));
  if (!actionId) {
    children.push(heading("Consolidación del indicador"), text("No sumar recuentos solapados ni promediar porcentajes. Comprobar definiciones y periodos compatibles. Las actividades no sustituyen la medición del objetivo."));
    const records = sheet.consolidations.length ? sheet.consolidations : [{ status: "pending" as const, values: {} }];
    for (const record of records) children.push(text(`Estado: ${statusLabels[record.status]}`), fields(consolidationFields, record.values));
  }
  children.push(text("Sin dato no equivale a cero. Un porcentaje con denominador cero no es calculable. Registrar agregados y referencias; conservar los datos personales en la fuente custodiada."));
  return new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, children }],
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120 } } } } },
  });
}

export async function downloadIndicatorWorksheet(sheet: IndicatorWorksheet, reviewNotice: string, stale: boolean, actionId?: string) {
  const blob = await Packer.toBlob(buildIndicatorWorksheetDocument(sheet, reviewNotice, stale, actionId));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Ficha-${sheet.context.municipalityId}-${sheet.context.indicatorDisplayCode ?? sheet.context.indicatorCode}${actionId ? `-actuacion-${actionId}` : ""}.docx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
