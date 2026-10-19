import type { IndicatorWorksheet, WorksheetAction } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import { worksheetKey } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import type {
  ActuationIdentification,
  ActuationPopulation,
  ActuationResponsibles,
  ActuationResult,
  ActuationStrategicLink,
  ActuationTracking,
  AgendaActuation,
  AgendaSetting,
} from "../../domain/agenda/AgendaActuation";

/**
 * Funciones puras de la agenda de actuaciones (CONTRACT-AGENDA-ACTUATIONS).
 * No generan entornos, trimestres ni prioridades: los asigna una persona.
 */

const clean = (value: string | undefined): string => value?.trim() ?? "";

export function emptyTracking(): ActuationTracking {
  return { status: "planificada" };
}
export function emptyResult(): ActuationResult {
  return { nextCycleDecision: "no-decidido" };
}

function baseActuation(
  id: string,
  municipalityId: string,
  now: string,
  order: number
): Omit<AgendaActuation, "origin" | "setting" | "name" | "linkedAction"> {
  return {
    id,
    municipalityId,
    order,
    identification: {},
    strategic: {},
    population: {},
    responsibles: {},
    tracking: emptyTracking(),
    result: emptyResult(),
    createdAt: now,
    updatedAt: now,
  };
}

const nextOrder = (list: readonly AgendaActuation[], setting: AgendaSetting | null): number =>
  list.filter((a) => a.setting === setting).reduce((max, a) => Math.max(max, a.order + 1), 0);

export interface CreateManualActuationInput {
  id: string;
  municipalityId: string;
  name: string;
  setting?: AgendaSetting | null;
  now: string;
}

/** Alta manual. Solo el nombre es obligatorio. Devuelve la lista sin cambios si falta. */
export function addManualActuation(
  list: readonly AgendaActuation[],
  input: CreateManualActuationInput
): AgendaActuation[] {
  const name = clean(input.name);
  if (!name) return [...list];
  const setting = input.setting ?? null;
  return [
    ...list,
    {
      ...baseActuation(input.id, input.municipalityId, input.now, nextOrder(list, setting)),
      origin: "manual",
      setting,
      name,
    },
  ];
}

export interface PlanActionRef {
  worksheetKey: string;
  actionId: string;
  action: WorksheetAction;
}

/** Actuaciones que hoy tiene el Plan de Acción, en el orden de las fichas. */
export function listPlanActions(worksheets: readonly IndicatorWorksheet[]): PlanActionRef[] {
  return worksheets.flatMap((sheet) =>
    sheet.actions.map((action) => ({ worksheetKey: worksheetKey(sheet.context), actionId: action.id, action }))
  );
}

const isLinkedTo = (a: AgendaActuation, ref: { worksheetKey: string; actionId: string }): boolean =>
  a.linkedAction?.worksheetKey === ref.worksheetKey && a.linkedAction.actionId === ref.actionId;

export interface ImportFromPlanInput {
  municipalityId: string;
  worksheets: readonly IndicatorWorksheet[];
  now: string;
  newId: () => string;
}

/**
 * Volcado desde el Plan de Acción. Una actuación del plan genera como máximo un
 * registro. Entra sin asignar: el plan no declara entorno, y no se infiere.
 */
export function importActuationsFromPlan(
  list: readonly AgendaActuation[],
  input: ImportFromPlanInput
): { list: AgendaActuation[]; added: number } {
  const out = [...list];
  let added = 0;
  for (const ref of listPlanActions(input.worksheets)) {
    if (out.some((a) => isLinkedTo(a, ref))) continue;
    out.push({
      ...baseActuation(input.newId(), input.municipalityId, input.now, nextOrder(out, null)),
      origin: "action-plan",
      setting: null,
      linkedAction: { worksheetKey: ref.worksheetKey, actionId: ref.actionId },
    });
    added += 1;
  }
  return { list: out, added };
}

export type ActuationBlockPatch =
  | { block: "name"; values: string }
  | { block: "identification"; values: Partial<ActuationIdentification> }
  | { block: "strategic"; values: Partial<ActuationStrategicLink> }
  | { block: "population"; values: Partial<ActuationPopulation> }
  | { block: "responsibles"; values: Partial<ActuationResponsibles> }
  | { block: "tracking"; values: Partial<ActuationTracking> }
  | { block: "result"; values: Partial<ActuationResult> };

/** Edita un bloque de la ficha. En un registro vinculado, el nombre no se edita aquí. */
export function updateActuationBlock(
  list: readonly AgendaActuation[],
  id: string,
  patch: ActuationBlockPatch,
  now: string
): AgendaActuation[] {
  return list.map((a) => {
    if (a.id !== id) return a;
    if (patch.block === "name") {
      if (a.linkedAction) return a;
      const name = clean(patch.values);
      return name ? { ...a, name, updatedAt: now } : a;
    }
    return { ...a, [patch.block]: { ...a[patch.block], ...patch.values }, updatedAt: now };
  });
}

/** Mueve una actuación a un entorno (o a «sin asignar») y a una posición. Renumera los órdenes. */
export function moveActuation(
  list: readonly AgendaActuation[],
  id: string,
  setting: AgendaSetting | null,
  index: number,
  now: string
): AgendaActuation[] {
  const moving = list.find((a) => a.id === id);
  if (!moving) return [...list];
  const bySetting = (s: AgendaSetting | null, excludeId?: string) =>
    list.filter((a) => a.setting === s && a.id !== excludeId).sort((x, y) => x.order - y.order);
  const target = bySetting(setting, id);
  const at = Math.max(0, Math.min(index, target.length));
  target.splice(at, 0, { ...moving, setting });
  const orders = new Map<string, number>();
  target.forEach((a, i) => orders.set(a.id, i));
  if (moving.setting !== setting) bySetting(moving.setting, id).forEach((a, i) => orders.set(a.id, i));
  return list.map((a) => {
    if (a.id === id) return { ...a, setting, order: orders.get(a.id) ?? 0, updatedAt: now };
    const o = orders.get(a.id);
    return o !== undefined && o !== a.order ? { ...a, order: o } : a;
  });
}

/** Duplica un registro manual. Un registro vinculado no se duplica: duplicaría el vínculo. */
export function duplicateManualActuation(
  list: readonly AgendaActuation[],
  id: string,
  newId: string,
  now: string
): AgendaActuation[] {
  const source = list.find((a) => a.id === id);
  if (!source || source.linkedAction) return [...list];
  return [
    ...list,
    {
      ...source,
      id: newId,
      name: `${source.name ?? ""} (copia)`,
      order: nextOrder(list, source.setting),
      tracking: { ...source.tracking },
      result: emptyResult(),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function removeActuation(list: readonly AgendaActuation[], id: string): AgendaActuation[] {
  return list.filter((a) => a.id !== id);
}

export interface ActuationBoard {
  columns: Record<AgendaSetting, AgendaActuation[]>;
  unassigned: AgendaActuation[];
}

export function buildActuationBoard(list: readonly AgendaActuation[]): ActuationBoard {
  const sorted = (s: AgendaSetting | null) =>
    list.filter((a) => a.setting === s).sort((x, y) => x.order - y.order);
  return {
    columns: {
      sanitario: sorted("sanitario"),
      comunitario: sorted("comunitario"),
      educativo: sorted("educativo"),
      laboral: sorted("laboral"),
    },
    unassigned: sorted(null),
  };
}

export interface ActuationPlanReading {
  /** Verdadero si el vínculo apunta a una actuación que ya no existe en el plan. */
  orphan: boolean;
  name: string;
  description?: string;
  responsible?: string;
  population?: string;
  schedule?: string;
  resources?: string;
  /** Indicador al que la actuación declara contribuir. El resultado del indicador se consolida en el plan y no se atribuye a la actuación. */
  linkedIndicator?: { code: string; name: string };
  planEditHint?: string;
}

/**
 * Lee del plan los datos que el plan ya recoge. No copia nada al registro de agenda.
 * Un registro manual se lee de sí mismo.
 */
export function readActuation(
  actuation: AgendaActuation,
  worksheets: readonly IndicatorWorksheet[]
): ActuationPlanReading {
  if (!actuation.linkedAction) {
    return {
      orphan: false,
      name: clean(actuation.name) || "Actuación sin nombre",
      description: actuation.identification.description,
      responsible: actuation.responsibles.responsible,
      population: actuation.population.population,
      resources: actuation.tracking.resources,
    };
  }
  const sheet = worksheets.find((s) => worksheetKey(s.context) === actuation.linkedAction!.worksheetKey);
  const action = sheet?.actions.find((a) => a.id === actuation.linkedAction!.actionId);
  if (!sheet || !action) {
    return { orphan: true, name: "Actuación que ya no figura en el Plan de Acción" };
  }
  const v = action.values;
  return {
    orphan: false,
    name: clean(v.name) || "Actuación pendiente de nombrar",
    description: clean(v.contribution) || undefined,
    responsible: clean(v.owner) || undefined,
    population: clean(v.population) || undefined,
    schedule: clean(v.schedule) || undefined,
    resources: clean(v.resources) || undefined,
    linkedIndicator: { code: sheet.context.indicatorCode, name: sheet.context.indicator },
    planEditHint: "Se edita en el Plan de Acción.",
  };
}
