import type { ActuationTemplate } from "../../domain/agenda/ActuationTemplate";
import type { AgendaActuation, AgendaSetting } from "../../domain/agenda/AgendaActuation";
import {
  HISTORIC_ACTUATIONS, HISTORIC_CATALOG_SOURCE, HISTORIC_PROGRAMS,
} from "../../domain/agenda/historicActuationCatalog";
import { emptyResult, emptyTracking } from "./agendaActuations";

/**
 * Repositorio de actuaciones-tipo (CONTRACT-ACTUATION-TEMPLATES). Funciones puras.
 * Adaptar una plantilla crea una copia independiente; la plantilla no cambia.
 */

const clean = (value: string | undefined): string => value?.trim() ?? "";
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Plantillas del catálogo heredado del histórico. Siempre las mismas; no se editan. */
export function historicTemplates(): ActuationTemplate[] {
  const programs = new Map(HISTORIC_PROGRAMS.map((p) => [p.code, p]));
  return HISTORIC_ACTUATIONS.map((a) => {
    const program = programs.get(a.programCode);
    return {
      id: `historico:${a.code}`,
      origin: "historico" as const,
      name: a.name,
      code: a.code,
      program: program ? `${program.code} · ${program.shortName || program.name}` : a.programCode,
      sourceLabel: HISTORIC_CATALOG_SOURCE,
    };
  });
}

export interface TemplateFilter {
  query?: string;
  program?: string;
  origin?: "" | ActuationTemplate["origin"];
}

/** Catálogo completo: propias primero, después las heredadas. */
export function listTemplates(own: readonly ActuationTemplate[], filter: TemplateFilter = {}): ActuationTemplate[] {
  const q = norm(clean(filter.query));
  return [...own, ...historicTemplates()].filter((t) => {
    if (filter.origin && t.origin !== filter.origin) return false;
    if (filter.program && t.program !== filter.program) return false;
    if (!q) return true;
    return norm([t.name, t.code, t.program, t.description, t.mainTopic, t.collective].filter(Boolean).join(" ")).includes(q);
  });
}

export function templatePrograms(own: readonly ActuationTemplate[]): string[] {
  return Array.from(new Set([...own, ...historicTemplates()].map((t) => t.program).filter((p): p is string => !!p)));
}

export interface InstantiateInput {
  id: string;
  municipalityId: string;
  now: string;
  setting?: AgendaSetting | null;
}

/**
 * Alta de una actuación a partir de una plantilla. Copia solo lo descriptivo.
 * Entra sin asignar salvo que una persona indique entorno: la sugerencia no se aplica sola.
 */
export function instantiateTemplate(
  list: readonly AgendaActuation[],
  template: ActuationTemplate,
  input: InstantiateInput
): AgendaActuation[] {
  const setting = input.setting ?? null;
  const order = list.filter((a) => a.setting === setting).reduce((max, a) => Math.max(max, a.order + 1), 0);
  const opt = (v: string | undefined) => (clean(v) ? clean(v) : undefined);
  return [
    ...list,
    {
      id: input.id,
      municipalityId: input.municipalityId,
      order,
      origin: "manual",
      setting,
      name: template.name,
      templateRef: { id: template.id, origin: template.origin, name: template.name },
      identification: {
        code: opt(template.code),
        program: opt(template.program),
        description: opt(template.description),
        activityType: template.activityType,
        mainTopic: opt(template.mainTopic),
      },
      strategic: {},
      population: { collective: opt(template.collective), lifeStage: opt(template.lifeStage), ageGroups: opt(template.ageGroups) },
      responsibles: {},
      tracking: emptyTracking(),
      result: emptyResult(),
      createdAt: input.now,
      updatedAt: input.now,
    },
  ];
}

/**
 * Plantilla propia a partir de una actuación. Solo pasa lo descriptivo y transferible:
 * quedan fuera fechas, responsables, participantes, recursos, evidencias y resultados.
 */
export function templateFromActuation(
  actuation: AgendaActuation,
  name: string,
  input: { id: string; municipalityName: string; now: string }
): ActuationTemplate | null {
  const title = clean(name);
  if (!title) return null;
  const opt = (v: string | undefined) => (clean(v) ? clean(v) : undefined);
  return {
    id: input.id,
    origin: "propia",
    name: title,
    sourceLabel: `Actuación-tipo propia, creada desde «${clean(actuation.name) || title}» (${input.municipalityName})`,
    code: opt(actuation.identification.code),
    program: opt(actuation.identification.program),
    description: opt(actuation.identification.description),
    activityType: actuation.identification.activityType,
    mainTopic: opt(actuation.identification.mainTopic),
    collective: opt(actuation.population.collective),
    lifeStage: opt(actuation.population.lifeStage),
    ageGroups: opt(actuation.population.ageGroups),
    suggestedSetting: actuation.setting ?? undefined,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function upsertOwnTemplate(own: readonly ActuationTemplate[], template: ActuationTemplate): ActuationTemplate[] {
  if (template.origin !== "propia") return [...own];
  return own.some((t) => t.id === template.id) ? own.map((t) => (t.id === template.id ? template : t)) : [...own, template];
}

export function removeOwnTemplate(own: readonly ActuationTemplate[], id: string): ActuationTemplate[] {
  return own.filter((t) => t.id !== id);
}
