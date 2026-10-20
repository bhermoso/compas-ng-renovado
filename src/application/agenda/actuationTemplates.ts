import type { ActuationTemplate } from "../../domain/agenda/ActuationTemplate";
import type { AgendaActuation, AgendaSetting } from "../../domain/agenda/AgendaActuation";
import {
  HISTORIC_ACTUATIONS, HISTORIC_CATALOG_SOURCE, HISTORIC_PROGRAMS,
} from "../../domain/agenda/historicActuationCatalog";
import {
  HISTORIC_DETAILED_ACTUATIONS, HISTORIC_DETAILED_SOURCE,
} from "../../domain/agenda/historicDetailedActuations";
import {
  HISTORIC_LINES, HISTORIC_PROGRAM_LINKS, type HistoricLine,
} from "../../domain/agenda/historicEpvsaStructure";
import { emptyResult, emptyTracking } from "./agendaActuations";

/**
 * Repositorio de actuaciones-tipo (CONTRACT-ACTUATION-TEMPLATES). Funciones puras.
 * Adaptar una plantilla crea una copia independiente; la plantilla no cambia.
 */

const clean = (value: string | undefined): string => value?.trim() ?? "";
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const lineByCode = new Map<string, HistoricLine>(HISTORIC_LINES.map((l) => [l.code, l]));
function lineLabel(code: string | undefined): string | undefined {
  const line = code ? lineByCode.get(code) : undefined;
  return line ? `${line.code} · ${line.name}` : undefined;
}

/** Plantillas del catálogo heredado del histórico. Siempre las mismas; no se editan. */
export function historicTemplates(): ActuationTemplate[] {
  const programs = new Map(HISTORIC_PROGRAMS.map((p) => [p.code, p]));
  const catalog: ActuationTemplate[] = HISTORIC_ACTUATIONS.map((a) => {
    const program = programs.get(a.programCode);
    return {
      id: `historico:${a.code}`,
      origin: "historico" as const,
      name: a.name,
      code: a.code,
      program: program ? `${program.code} · ${program.shortName || program.name}` : a.programCode,
      sourceLabel: HISTORIC_CATALOG_SOURCE,
      // La línea se deduce del programa (vínculo único en el histórico). El objetivo no: el programa se vincula a varios.
      epvsaLine: lineLabel(HISTORIC_PROGRAM_LINKS[a.programCode]?.lineCode),
    };
  });
  // Fichas completas del histórico. Son plantillas aparte: su código no coincide con el del catálogo.
  const detailed: ActuationTemplate[] = HISTORIC_DETAILED_ACTUATIONS.map((a) => ({
    id: `historico:${a.key}`,
    origin: "historico" as const,
    name: a.name,
    program: a.program,
    sourceLabel: HISTORIC_DETAILED_SOURCE,
    description: a.description,
    population: a.population,
    lifeStage: a.lifeStage,
    suggestedSetting: a.suggestedSetting,
    epvsaLine: a.epvsaLine,
    epvsaObjective: a.epvsaObjective,
    indicator: a.indicator,
    resources: a.resources,
    professionals: a.professionals,
    frequency: a.frequency,
    evidenceBase: a.evidenceBase,
  }));
  return [...catalog, ...detailed];
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

export interface CatalogFilter {
  query?: string;
  lineCode?: string;
  ambito?: string;
  programCode?: string;
}
export interface CatalogProgramNode {
  code: string;
  name: string;
  shortName: string;
  ambito: string;
  objectiveCodes: readonly string[];
  templates: ActuationTemplate[];
}
export interface CatalogLineNode {
  code: string;
  name: string;
  objectives: HistoricLine["objectives"];
  programs: CatalogProgramNode[];
}

/** Ámbitos presentes en el catálogo heredado, en orden de aparición. */
export function catalogAmbitos(): string[] {
  return Array.from(new Set(HISTORIC_PROGRAMS.map((p) => p.ambito)));
}

/**
 * Catálogo heredado por línea estratégica → programa → actuaciones-tipo (solo las 125 con código).
 * Solo estructura de clasificación: no asigna entorno, meta, prioridad ni responsable.
 */
export function epvsaCatalogTree(filter: CatalogFilter = {}): CatalogLineNode[] {
  const q = norm(clean(filter.query));
  const all = historicTemplates().filter((t) => t.code);
  return HISTORIC_LINES.filter((l) => !filter.lineCode || l.code === filter.lineCode).map((line) => {
    const programs: CatalogProgramNode[] = [];
    for (const code of line.programCodes) {
      const program = HISTORIC_PROGRAMS.find((p) => p.code === code);
      if (!program) continue;
      if (filter.ambito && program.ambito !== filter.ambito) continue;
      if (filter.programCode && program.code !== filter.programCode) continue;
      const templates = all.filter((t) => t.code?.startsWith(`${code}-`)).filter((t) =>
        !q || norm([t.name, t.code, program.name, program.shortName].join(" ")).includes(q));
      if (q && !templates.length) continue;
      programs.push({
        code, name: program.name, shortName: program.shortName, ambito: program.ambito,
        objectiveCodes: HISTORIC_PROGRAM_LINKS[code]?.objectiveCodes ?? [], templates,
      });
    }
    return { code: line.code, name: line.name, objectives: line.objectives, programs };
  }).filter((l) => l.programs.length > 0);
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
      strategic: {
        framework: opt(template.epvsaLine || template.epvsaObjective ? "EPVSA" : undefined),
        line: opt(template.epvsaLine),
        objective: opt(template.epvsaObjective),
        // El indicador de la plantilla es solo referencia: no se copia, porque la relación con el
        // indicador se establece en el Plan de Acción (CONTRACT-ACTUATION-TEMPLATES §4).
        frequency: opt(template.frequency),
      },
      population: {
        population: opt(template.population),
        collective: opt(template.collective),
        lifeStage: opt(template.lifeStage),
        ageGroups: opt(template.ageGroups),
      },
      responsibles: { professionals: opt(template.professionals) },
      tracking: { ...emptyTracking(), resources: opt(template.resources) },
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
