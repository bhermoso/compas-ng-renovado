import type { DefinitiveActionPlanModuleProjection } from "./DefinitiveActionPlanProjection";
import { resolvedPlanDecisionText } from "./DefinitiveActionPlanProjection";
import type { IndicatorWorksheet, WorksheetAction } from "./IndicatorWorksheet";
import { worksheetKey, type WorksheetContext } from "./IndicatorWorksheet";
import { thematicBlockNameFor } from "./PlanPreparationDraft";
import type { AgendaActuation } from "../agenda/AgendaActuation";

/**
 * Desde el 28/11/2026 la ficha del indicador es solo de medición y las
 * actuaciones se registran en la Agenda, que declara a qué indicador
 * contribuyen (`strategic.mainIndicator` o `secondaryIndicators`, con el código
 * al principio). La trazabilidad lee esas actuaciones; las fichas de actuación
 * antiguas solo se leen si tienen contenido.
 */
export function agendaActuationsForIndicator(actuations: readonly AgendaActuation[], indicatorCode: string, displayCode?: string): AgendaActuation[] {
  const codes = [indicatorCode, displayCode].filter((c): c is string => Boolean(c));
  const declares = (value?: string) => Boolean(value) && codes.some((code) => value!.trim() === code || value!.trim().startsWith(`${code} `));
  return actuations.filter((a) => declares(a.strategic?.mainIndicator) || (a.strategic?.secondaryIndicators ?? []).some(declares));
}

function agendaSummary(actuation: AgendaActuation): ActionPlanLinkedActionSummary {
  const schedule = [actuation.identification?.year, actuation.identification?.quarter, actuation.tracking?.plannedDate].filter(Boolean).join(" · ");
  const owner = [actuation.responsibles?.responsible, actuation.responsibles?.organisation].filter(Boolean).join(" · ");
  const missingFields = [
    [owner, "responsable"],
    [schedule, "calendario"],
    [actuation.tracking?.resources, "recursos"],
  ].filter(([value]) => !clean(value)).map(([, label]) => label as string);
  return {
    id: actuation.id,
    name: clean(actuation.name) || "Actuación pendiente de nombrar",
    agreement: actuation.tracking?.status ?? "planificada",
    owner: owner || "Pendiente",
    schedule: schedule || "Pendiente",
    resources: clean(actuation.tracking?.resources) || "Pendiente",
    population: clean(actuation.population?.population) || "Pendiente",
    contribution: clean(actuation.identification?.description) || "Pendiente de describir",
    requestedData: "Se registra en la ficha del indicador (entregas de datos)",
    source: clean(actuation.result?.verificationSource) || "Pendiente de fuente o justificante",
    deliveryCount: 0,
    activities: [],
    missingFields,
    isUsableFicha: missingFields.length === 0,
  };
}

/** Ficha de actuación antigua con algún dato escrito (las vacías no cuentan). */
export function legacyActionHasContent(action: WorksheetAction): boolean {
  return Object.values(action.values).some((v) => clean(v)) || (action.activities ?? []).length > 0 || action.returns.length > 0;
}

export type ActionPlanIndicatorRole = "action-plan";

export interface ActionPlanLinkedActivitySummary {
  id: string;
  name: string;
  status: string;
  schedule: string;
  evidence: string;
}

export interface ActionPlanLinkedActionSummary {
  id: string;
  name: string;
  agreement: string;
  owner: string;
  schedule: string;
  resources: string;
  population: string;
  contribution: string;
  requestedData: string;
  source: string;
  deliveryCount: number;
  activities: ActionPlanLinkedActivitySummary[];
  missingFields: string[];
  isUsableFicha: boolean;
}

export interface ActionPlanTraceabilityLink {
  moduleId: string;
  moduleTitle: string;
  moduleVersion: string;
  strategicObjective: string;
  thematicBlockCode: string;
  thematicBlock: string;
  generalObjective: string;
  objectiveCode: string;
  objectiveId?: string;
  objectiveTitle: string;
  indicatorCode: string;
  indicatorDisplayCode?: string;
  indicatorTitle: string;
  indicatorRole: ActionPlanIndicatorRole;
  indicatorWorksheetKey: string;
  indicatorFichaStatus: "missing" | "draft" | "linked-actions";
  actionCards: ActionPlanLinkedActionSummary[];
  consolidationCount: number;
  pendingSummary: string[];
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function missingActionFields(action: WorksheetAction): string[] {
  const required: Array<[string, string]> = [
    ["name", "nombre"],
    ["contribution", "contribucion"],
    ["owner", "responsable"],
    ["schedule", "calendario"],
    ["resources", "recursos"],
    ["requestedData", "datos a entregar"],
  ];
  return required
    .filter(([key]) => !clean(action.values[key]))
    .map(([, label]) => label);
}

function actionSummary(action: WorksheetAction): ActionPlanLinkedActionSummary {
  const missingFields = missingActionFields(action);
  return {
    id: action.id,
    name: clean(action.values.name) || "Actuacion pendiente de nombrar",
    agreement: clean(action.values.agreement) || "Pendiente de acuerdo",
    owner: clean(action.values.owner) || "Pendiente",
    schedule: clean(action.values.schedule) || "Pendiente",
    resources: clean(action.values.resources) || "Pendiente",
    population: clean(action.values.population) || "Pendiente",
    contribution: clean(action.values.contribution) || "Pendiente de describir",
    requestedData: clean(action.values.requestedData) || "Pendiente de cerrar",
    source: clean(action.values.source) || "Pendiente de fuente o justificante",
    deliveryCount: action.returns.length,
    activities: (action.activities ?? []).map((activity) => ({
      id: activity.id,
      name: clean(activity.values.name) || "Actividad pendiente de nombrar",
      status: clean(activity.values.status) || "Pendiente",
      schedule: clean(activity.values.schedule) || "Pendiente",
      evidence: clean(activity.values.evidence) || "Pendiente",
    })),
    missingFields,
    isUsableFicha: missingFields.length === 0,
  };
}

function contextForLink(link: Pick<ActionPlanTraceabilityLink, "moduleId" | "moduleVersion" | "moduleTitle" | "generalObjective" | "objectiveCode" | "objectiveTitle" | "indicatorCode" | "indicatorTitle">): WorksheetContext {
  return {
    municipalityId: "",
    moduleId: link.moduleId,
    moduleVersion: link.moduleVersion,
    line: link.moduleTitle,
    generalObjective: link.generalObjective,
    objective: `${link.objectiveCode} · ${link.objectiveTitle}`,
    indicatorCode: link.indicatorCode,
    indicator: link.indicatorTitle,
    unit: "",
    source: "",
  };
}

export function buildActionPlanTraceability(
  municipalityId: string,
  active: DefinitiveActionPlanModuleProjection[],
  worksheets: IndicatorWorksheet[] = [],
  agendaActuations: readonly AgendaActuation[] = []
): ActionPlanTraceabilityLink[] {
  const byKey = new Map(worksheets.map((sheet) => [worksheetKey(sheet.context), sheet]));
  return active.flatMap(({ module, moduleDecision, rows }) =>
    rows
      .filter((row) => row.indicatorIncluded)
      .map((row) => {
        const generalObjective = `${row.general.displayCode ?? row.general.code} · ${resolvedPlanDecisionText(row.generalDecision, row.general.title)}`;
        const objectiveTitle = resolvedPlanDecisionText(row.objectiveDecision, row.specific.title);
        const indicatorTitle = resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title);
        const base = {
          moduleId: module.id,
          moduleTitle: module.title,
          moduleVersion: module.version,
          generalObjective,
          objectiveCode: row.specific.displayCode ?? row.specific.code,
          objectiveId: row.specific.code,
          objectiveTitle,
          indicatorCode: row.specific.indicator.code,
          indicatorDisplayCode: row.specific.indicator.displayCode,
          indicatorTitle,
        };
        const key = worksheetKey({
          ...contextForLink(base),
          municipalityId,
          unit: row.specific.indicator.unit,
          source: module.sourceLabel,
        });
        const sheet = byKey.get(key);
        const legacyCards = (sheet?.actions ?? []).filter(legacyActionHasContent).map(actionSummary);
        const agendaCards = agendaActuationsForIndicator(agendaActuations, row.specific.indicator.code, row.specific.indicator.displayCode).map(agendaSummary);
        const actionCards = [...agendaCards, ...legacyCards];
        const pendingSummary: string[] = [];
        if (!sheet) pendingSummary.push("ficha de indicador pendiente");
        if (actionCards.length === 0) pendingSummary.push("sin actuaciones de la agenda vinculadas");
        for (const action of actionCards) {
          if (action.missingFields.length > 0) {
            pendingSummary.push(`${action.name}: falta ${action.missingFields.join(", ")}`);
          }
        }
        return {
          ...base,
          strategicObjective: resolvedPlanDecisionText(moduleDecision, module.strategicObjective),
          thematicBlockCode: row.general.code,
          thematicBlock: thematicBlockNameFor(row.general.code, module) ?? row.general.code,
          indicatorRole: "action-plan" as const,
          indicatorWorksheetKey: key,
          indicatorFichaStatus: !sheet ? "missing" : actionCards.length > 0 ? "linked-actions" : "draft",
          actionCards,
          consolidationCount: sheet?.consolidations.length ?? 0,
          pendingSummary,
        };
      })
  );
}

export function traceabilityHasLinkedActionFichas(links: readonly ActionPlanTraceabilityLink[]): boolean {
  return links.some((link) => link.actionCards.length > 0);
}
