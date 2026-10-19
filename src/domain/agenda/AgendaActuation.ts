/**
 * Actuación de agenda: registro con autoría humana, organizado por entornos.
 * Contrato: CONTRACT-AGENDA-ACTUATIONS.
 *
 * En un registro vinculado a una actuación del Plan de Acción (`linkedActionId`),
 * los datos que el plan ya recoge se leen del plan y no se copian aquí.
 */

export const AGENDA_SETTINGS = ["sanitario", "comunitario", "educativo", "laboral"] as const;
export type AgendaSetting = (typeof AGENDA_SETTINGS)[number];

export const AGENDA_SETTING_LABEL: Record<AgendaSetting, string> = {
  sanitario: "Entorno sanitario",
  comunitario: "Entorno comunitario",
  educativo: "Entorno educativo",
  laboral: "Entorno laboral",
};

export const ACTIVITY_TYPES = [
  "taller", "jornada", "campana", "intervencion_comunitaria",
  "formacion", "coordinacion", "comunicacion", "otra",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  taller: "Taller",
  jornada: "Jornada",
  campana: "Campaña",
  intervencion_comunitaria: "Intervención comunitaria",
  formacion: "Formación",
  coordinacion: "Coordinación",
  comunicacion: "Comunicación",
  otra: "Otra",
};

export const ACTUATION_STATUSES = ["planificada", "en-ejecucion", "finalizada", "suspendida"] as const;
export type ActuationStatus = (typeof ACTUATION_STATUSES)[number];
export const ACTUATION_STATUS_LABEL: Record<ActuationStatus, string> = {
  planificada: "Planificada",
  "en-ejecucion": "En ejecución",
  finalizada: "Finalizada",
  suspendida: "Suspendida",
};

export const ACTUATION_PRIORITIES = ["alta", "media", "baja"] as const;
export type ActuationPriority = (typeof ACTUATION_PRIORITIES)[number];

export const AGENDA_QUARTERS = ["T1", "T2", "T3", "T4", "anual"] as const;
export type AgendaQuarterValue = (typeof AGENDA_QUARTERS)[number];

export const NEXT_CYCLE_DECISIONS = [
  "no-decidido", "mantener", "modificar", "escalar", "suspender", "evaluar-mas",
] as const;
export type NextCycleDecision = (typeof NEXT_CYCLE_DECISIONS)[number];
export const NEXT_CYCLE_DECISION_LABEL: Record<NextCycleDecision, string> = {
  "no-decidido": "No decidido",
  mantener: "Mantener",
  modificar: "Modificar",
  escalar: "Escalar",
  suspender: "Suspender",
  "evaluar-mas": "Evaluar más",
};

export interface ActuationIdentification {
  code?: string;
  program?: string;
  description?: string;
  activityType?: ActivityType;
  mainTopic?: string;
  secondaryTopics?: string[];
  territorialScope?: string;
  year?: number;
  quarter?: AgendaQuarterValue;
}

export interface ActuationStrategicLink {
  framework?: string;
  line?: string;
  objective?: string;
  mainIndicator?: string;
  secondaryIndicators?: string[];
  target?: string;
  frequency?: string;
}

export interface ActuationPopulation {
  population?: string;
  collective?: string;
  lifeStage?: string;
  ageGroups?: string;
  plannedParticipants?: number;
  reachedParticipants?: number;
  women?: number;
  men?: number;
  otherOrUnknown?: number;
  sessions?: number;
}

export interface ActuationResponsibles {
  responsible?: string;
  organisation?: string;
  responsibleEntity?: string;
  referencePerson?: string;
  contact?: string;
  professionals?: string;
  collaboratingEntities?: string;
  associations?: string;
  communityAssets?: string;
}

export interface ActuationTracking {
  status: ActuationStatus;
  priority?: ActuationPriority;
  plannedDate?: string;
  actualDate?: string;
  resources?: string;
  evidence?: string;
  notes?: string;
}

export interface ActuationResult {
  /** Lo realizado según el registro propio de la actuación (sesiones, personas, asistencias). No es el valor de ningún indicador. */
  deliveredOutput?: string;
  observedResult?: string;
  verificationSource?: string;
  barriers?: string;
  facilitators?: string;
  learnings?: string;
  nextCycleDecision: NextCycleDecision;
}

export interface AgendaActuation {
  id: string;
  municipalityId: string;
  /** null: sin asignar. Solo una persona lo cambia. */
  setting: AgendaSetting | null;
  /** Orden dentro del entorno. */
  order: number;
  origin: "manual" | "action-plan";
  /** Identifica la actuación del plan: clave de la ficha del indicador y id de la actuación. */
  linkedAction?: { worksheetKey: string; actionId: string };
  /** Nombre. En un registro vinculado se lee del plan y este campo queda vacío. */
  name?: string;
  identification: ActuationIdentification;
  strategic: ActuationStrategicLink;
  population: ActuationPopulation;
  responsibles: ActuationResponsibles;
  tracking: ActuationTracking;
  result: ActuationResult;
  createdAt: string;
  updatedAt: string;
}
