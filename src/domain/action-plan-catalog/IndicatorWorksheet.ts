/** Human-authored planning drafts. Never diagnostic evidence or institutional approval. */
export interface WorksheetContext {
  municipalityId: string;
  moduleId: string;
  moduleVersion: string;
  line: string;
  generalObjective: string;
  objective: string;
  indicatorCode: string;
  indicatorDisplayCode?: string;
  indicator: string;
  unit: string;
  source: string;
}

export const indicatorFields = [
  ["owner", "Persona y entidad responsables de consolidar el indicador"],
  ["contact", "Contacto profesional y suplencia"],
  ["agreement", "Versión de la ficha y referencia del acuerdo sobre la medición"],
  ["definition", "Definición operacional: población, criterios de inclusión y cumplimiento"],
  ["instrument", "Instrumento o registro, versión y procedimiento de recogida"],
  ["numerator", "Definición del numerador o del recuento"],
  ["denominator", "Definición del denominador (si procede)"],
  ["calculation", "Método de cálculo acordado"],
  ["frequency", "Periodicidad, fechas de valoración y corte"],
  ["disaggregation", "Desagregaciones acordadas"],
  ["quality", "Reglas sobre duplicados, datos faltantes y cambios de fuente"],
  ["baseline", "Línea base: valor, periodo y fuente (si existe)"],
  ["target", "Meta y horizonte temporal (si se han acordado)"],
  ["deadline", "Plazo y canal de entrega a la persona que consolida"],
] as const;

export const actionFields = [
  ["name", "Nombre de la actuación o programa"],
  ["agreement", "Estado de la actuación y acuerdo que la respalda (propuesta, acordada, descartada…)"],
  ["owner", "Persona responsable, entidad y contacto profesional"],
  ["contribution", "Qué se hará y cómo contribuirá al objetivo"],
  ["otherObjectives", "Otros objetivos o indicadores a los que contribuye (códigos, si procede)"],
  ["population", "Población destinataria y ámbito"],
  ["schedule", "Calendario de ejecución"],
  ["resources", "Recursos humanos, materiales o económicos previstos"],
  ["requestedData", "Datos que debe recoger y entregar para este indicador"],
  ["source", "Instrumento, registro y justificantes que aportará"],
  ["custody", "Quién recoge y custodia los datos; control de duplicados"],
  ["delivery", "Destinatario, fecha límite y canal de entrega"],
] as const;

/** Actividades: ejecución verificable dentro de una actuación, no decisiones autónomas del Plan. */
export const activityFields = [
  ["name", "Nombre de la actividad, hito o producto verificable"],
  ["type", "Tipo: sesión, taller, campaña, reunión, intervención, hito o producto"],
  ["status", "Estado de ejecución"],
  ["schedule", "Fecha, periodo o frecuencia prevista"],
  ["place", "Lugar, recurso o ámbito territorial"],
  ["responsible", "Responsable operativo de la actividad"],
  ["population", "Población destinataria o participantes previstos"],
  ["resources", "Recursos necesarios para ejecutar la actividad"],
  ["evidence", "Evidencia o justificante que permitirá verificarla"],
  ["expectedOutput", "Producto o dato que aportará a la actuación"],
] as const;

export const returnFields = [
  ["period", "Periodo al que corresponden los datos"],
  ["sender", "Persona que entrega y fecha de entrega"],
  ["numerator", "Numerador o recuento observado (si se dispone)"],
  ["denominator", "Denominador observado (si procede y se dispone)"],
  ["activity", "Actividad realizada: personas únicas y asistencias por separado"],
  ["evidence", "Fuente, desagregaciones y referencias de justificantes"],
  ["limitations", "Datos faltantes, pérdidas y posibles duplicados con otras actuaciones"],
  ["review", "Comprobación de la entrega: quién, cuándo y correcciones pendientes"],
] as const;

export const consolidationFields = [
  ["period", "Periodo de consolidación"],
  ["numerator", "Numerador o recuento consolidado, sin duplicados"],
  ["denominator", "Denominador consolidado (si procede)"],
  ["result", "Resultado calculado por la persona responsable y unidad"],
  ["evidence", "Entregas y fuentes utilizadas; comprobación de duplicados"],
  ["limitations", "Datos faltantes, limitaciones e interpretación"],
  ["review", "Persona que revisa, fecha y referencia del cierre"],
] as const;

export type WorksheetValues = Record<string, string>;
export interface WorksheetReturn {
  id: string;
  values: WorksheetValues;
}
export interface WorksheetActivity {
  id: string;
  values: WorksheetValues;
}
export interface WorksheetAction {
  id: string;
  values: WorksheetValues;
  /**
   * Actividades concretas dentro de la actuación. La actuación es la unidad
   * comprometida; la actividad es ejecución verificable y no se independiza del
   * Plan salvo decisión explícita del equipo técnico.
   */
  activities?: WorksheetActivity[];
  returns: WorksheetReturn[];
}
export interface WorksheetConsolidation extends WorksheetReturn {
  status: "pending" | "provisional" | "reviewed" | "not-calculable";
}
export interface IndicatorWorksheet {
  context: WorksheetContext;
  values: WorksheetValues;
  actions: WorksheetAction[];
  consolidations: WorksheetConsolidation[];
  updatedAt: string;
}

export function createIndicatorWorksheet(context: WorksheetContext): IndicatorWorksheet {
  return { context: { ...context }, values: {}, actions: [], consolidations: [], updatedAt: "" };
}

export function worksheetKey(context: WorksheetContext): string {
  return `${context.municipalityId}/${context.moduleId}/${context.indicatorCode}`;
}

const referenceText = (value: string) => value.includes(" · ") ? value.slice(value.indexOf(" · ") + 3) : value;

export function worksheetContextChanged(sheet: IndicatorWorksheet, context: WorksheetContext): boolean {
  return (Object.keys(context) as (keyof WorksheetContext)[]).some(key => {
    if (key === "indicatorDisplayCode") return false;
    if (key === "generalObjective" || key === "objective") return referenceText(sheet.context[key]) !== referenceText(context[key]);
    return sheet.context[key] !== context[key];
  });
}

/** Notation-only projection; historical wording and reference versions remain intact. */
export function worksheetNotationContext(saved: WorksheetContext, current: WorksheetContext): WorksheetContext {
  if (worksheetKey(saved) !== worksheetKey(current) || saved.moduleVersion !== current.moduleVersion) return saved;
  const label = (prior: string, next: string) => prior.includes(" · ") && next.includes(" · ")
    ? next.slice(0, next.indexOf(" · ")) + " · " + referenceText(prior) : prior;
  return {...saved, indicatorDisplayCode: current.indicatorDisplayCode,
    generalObjective: label(saved.generalObjective, current.generalObjective), objective: label(saved.objective, current.objective)};
}
