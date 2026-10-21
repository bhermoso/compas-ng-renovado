import type {
  ActivityType, ActuationPriority, ActuationStatus, AgendaActuation, AgendaQuarterValue,
  AgendaSetting, NextCycleDecision,
} from "../../domain/agenda/AgendaActuation";
import {
  ACTIVITY_TYPES, ACTUATION_PRIORITIES, ACTUATION_STATUSES, AGENDA_QUARTERS, AGENDA_SETTINGS,
  NEXT_CYCLE_DECISIONS,
} from "../../domain/agenda/AgendaActuation";

/**
 * Importación de la agenda del monolito (COMPAS-RESCATE) a la agenda de NG.
 * Origen: copia «Exportar copia (.json)» del modo local, o volcado de Firebase.
 * Ruta en el histórico: estrategias/<estrategia>/municipios/<municipio>/agendas
 * (objeto id → actuación; la copia local puede llevarlo como lista).
 *
 * Solo traduce campos. No infiere entorno, trimestre ni prioridad: si el valor
 * del histórico no es válido, el campo queda vacío y se cuenta en `unmapped`.
 */

export interface HistoricAgendaSource {
  strategy: string;
  municipality: string;
  actuations: Record<string, unknown>[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const toList = (v: unknown): Record<string, unknown>[] =>
  (Array.isArray(v) ? v : isObj(v) ? Object.values(v) : []).filter(isObj);

/** Busca todas las agendas del fichero. Acepta la copia completa, un municipio o la propia agenda. */
export function findHistoricAgendas(text: string): HistoricAgendaSource[] {
  let root: unknown;
  try { root = JSON.parse(text); } catch { return []; }
  const out: HistoricAgendaSource[] = [];
  const fromMunicipios = (strategy: string, municipios: unknown) => {
    if (!isObj(municipios)) return;
    for (const [municipality, data] of Object.entries(municipios)) {
      if (isObj(data) && data.agendas !== undefined) {
        const actuations = toList(data.agendas);
        if (actuations.length > 0) out.push({ strategy, municipality, actuations });
      }
    }
  };
  if (isObj(root)) {
    if (isObj(root.estrategias)) {
      for (const [strategy, data] of Object.entries(root.estrategias)) {
        if (isObj(data)) fromMunicipios(strategy, data.municipios);
      }
    }
    if (out.length === 0 && isObj(root.municipios)) fromMunicipios("", root.municipios);
    if (out.length === 0 && root.agendas !== undefined) {
      const actuations = toList(root.agendas);
      if (actuations.length > 0) out.push({ strategy: "", municipality: "", actuations });
    }
  }
  if (out.length === 0) {
    const actuations = toList(root);
    if (actuations.some((a) => typeof a.nombre === "string" || typeof a.actuacion === "string")) {
      out.push({ strategy: "", municipality: "", actuations });
    }
  }
  return out;
}

const str = (v: unknown): string | undefined => {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
};
const norm = (v: unknown): string => (str(v) ?? "").toLowerCase().replace(/[\s_]+/g, "-");
const pick = <T extends string>(allowed: readonly T[], v: unknown): T | undefined =>
  allowed.find((a) => a.toLowerCase() === norm(v));
const list = (v: unknown): string[] | undefined => {
  const items = (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [])
    .map((s) => str(s)).filter((s): s is string => s !== undefined);
  return items.length > 0 ? items : undefined;
};

export interface HistoricImportReport {
  added: number;
  /** Actuaciones sin nombre, no importadas. */
  skipped: number;
  /** Campos con un valor que NG no puede representar tal cual; se conservan en notas o se dejan vacíos. */
  unmapped: string[];
}

export interface HistoricImportContext {
  municipalityId: string;
  now: string;
  newId: () => string;
}

/** Traduce una actuación del histórico. Devuelve null si no tiene nombre. */
export function convertHistoricActuation(
  raw: Record<string, unknown>, ctx: HistoricImportContext, order: number, unmapped: string[],
): AgendaActuation | null {
  const name = str(raw.nombre) ?? str(raw.actuacion);
  if (!name) return null;
  const note: string[] = [];
  const num = (key: string, label: string): number | undefined => {
    const t = str(raw[key]);
    if (t === undefined) return undefined;
    const n = Number(t.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) return n;
    note.push(`${label} (texto del histórico): ${t}`);
    unmapped.push(`${key}: «${t}»`);
    return undefined;
  };
  const enumField = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const v = pick(allowed, raw[key]);
    if (v === undefined && str(raw[key]) !== undefined) unmapped.push(`${key}: «${str(raw[key])}»`);
    return v;
  };
  const setting = enumField<AgendaSetting>("entorno", AGENDA_SETTINGS);
  const yearText = str(raw.anio);
  const year = yearText !== undefined && /^\d{4}$/.test(yearText) ? Number(yearText) : undefined;
  const indicatorValue = str(raw.valorIndicadorAlcanzado);
  if (indicatorValue) note.push(`Valor de indicador alcanzado (según el histórico, sin verificar): ${indicatorValue}`);
  const observations = str(raw.observaciones);
  if (observations) note.unshift(observations);
  const line = str(raw.lineaEpvsa) ?? str(raw.estrategia);
  const objective = str(raw.objetivoEPVSA) ?? str(raw.objetivo);

  return {
    id: ctx.newId(),
    municipalityId: ctx.municipalityId,
    setting: setting ?? null,
    order,
    origin: "manual",
    name,
    identification: {
      code: str(raw.codigoEPVSA),
      program: str(raw.programa),
      description: str(raw.descripcion),
      activityType: enumField<ActivityType>("tipoActividad", ACTIVITY_TYPES),
      mainTopic: str(raw.tematicaPrincipal),
      secondaryTopics: list(raw.tematicasSecundarias),
      territorialScope: str(raw.ambitoTerritorial),
      year,
      quarter: enumField<AgendaQuarterValue>("trimestre", AGENDA_QUARTERS),
    },
    strategic: {
      framework: line || objective ? "EPVSA (según el histórico, sin verificar)" : undefined,
      line,
      objective,
      mainIndicator: str(raw.indicadorPrincipal) ?? str(raw.indicador),
      secondaryIndicators: list(raw.indicadoresSecundarios),
      target: str(raw.meta),
      frequency: str(raw.frecuencia),
    },
    population: {
      population: str(raw.poblacion),
      collective: str(raw.colectivo),
      lifeStage: str(raw.etapaVida),
      ageGroups: str(raw.gruposEdad),
      plannedParticipants: num("participantesPrevistos", "Participantes previstos"),
      reachedParticipants: num("participantesAlcanzados", "Participantes alcanzados"),
      women: num("participantesMujeres", "Mujeres"),
      men: num("participantesHombres", "Hombres"),
      otherOrUnknown: num("participantesOtroNoConsta", "Otro o no consta"),
      sessions: num("numeroSesiones", "Número de sesiones"),
    },
    responsibles: {
      responsible: str(raw.responsable),
      organisation: str(raw.organizacion),
      responsibleEntity: str(raw.entidadResponsable),
      referencePerson: str(raw.personaReferente),
      contact: str(raw.contacto),
      professionals: str(raw.profesionalesDetalle) ?? str(raw.profesionales),
      collaboratingEntities: str(raw.entidadesColaboradoras),
      associations: str(raw.asociacionesImplicadas),
      communityAssets: str(raw.activosComunitarios),
    },
    tracking: {
      status: pick<ActuationStatus>(ACTUATION_STATUSES, raw.estado) ?? "planificada",
      priority: enumField<ActuationPriority>("prioridad", ACTUATION_PRIORITIES),
      plannedDate: str(raw.fechaPrevista),
      actualDate: str(raw.fechaReal),
      resources: str(raw.recursos),
      evidence: str(raw.evidencia),
      notes: note.length > 0 ? note.join("\n") : undefined,
    },
    result: {
      observedResult: str(raw.resultadoObservado),
      verificationSource: str(raw.fuenteVerificacion),
      barriers: str(raw.barreras),
      facilitators: str(raw.facilitadores),
      learnings: str(raw.aprendizajes),
      nextCycleDecision: pick<NextCycleDecision>(NEXT_CYCLE_DECISIONS, raw.decisionSiguienteCiclo) ?? "no-decidido",
    },
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
}

/** Añade las actuaciones del histórico a la agenda. No sustituye ni borra las existentes. */
export function importHistoricAgenda(
  current: readonly AgendaActuation[], source: readonly Record<string, unknown>[], ctx: HistoricImportContext,
): { list: AgendaActuation[]; report: HistoricImportReport } {
  const unmapped: string[] = [];
  const next = [...current];
  const counters = new Map<AgendaSetting | null, number>();
  const orderFor = (s: AgendaSetting | null) => {
    const base = counters.get(s) ?? current.filter((a) => a.setting === s).reduce((m, a) => Math.max(m, a.order + 1), 0);
    counters.set(s, base + 1);
    return base;
  };
  const sorted = [...source].sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0));
  let skipped = 0;
  let added = 0;
  for (const raw of sorted) {
    const setting = pick<AgendaSetting>(AGENDA_SETTINGS, raw.entorno) ?? null;
    const converted = convertHistoricActuation(raw, ctx, orderFor(setting), unmapped);
    if (converted) { next.push(converted); added += 1; } else skipped += 1;
  }
  return { list: next, report: { added, skipped, unmapped } };
}
