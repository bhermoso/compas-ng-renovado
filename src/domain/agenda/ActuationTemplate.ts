import type { ActivityType, AgendaSetting } from "./AgendaActuation";

/**
 * Actuación-tipo: plantilla reutilizable de actuación. Contrato: CONTRACT-ACTUATION-TEMPLATES.
 * Solo recoge lo descriptivo y transferible entre municipios. No lleva fechas, responsables,
 * participantes ni resultados: esos son del municipio y se rellenan al adaptar.
 */
export type ActuationTemplateOrigin = "historico" | "propia";

export interface ActuationTemplate {
  id: string;
  origin: ActuationTemplateOrigin;
  name: string;
  /** Rótulo de procedencia visible. En las propias, el municipio de origen. */
  sourceLabel: string;
  code?: string;
  program?: string;
  description?: string;
  activityType?: ActivityType;
  mainTopic?: string;
  collective?: string;
  lifeStage?: string;
  ageGroups?: string;
  /** Sugerencia de entorno. No se aplica sola: lo decide una persona. */
  suggestedSetting?: AgendaSetting;
  /** Población a la que se dirige, tal como la describe la fuente. */
  population?: string;
  /** Línea y objetivo de la EPVSA que la fuente atribuye a la actuación. No verificados. */
  epvsaLine?: string;
  epvsaObjective?: string;
  /** Indicador que la fuente atribuía. Solo referencia visible: no se copia a la actuación. */
  indicator?: string;
  resources?: string;
  professionals?: string;
  frequency?: string;
  /** Base de evidencia citada por la fuente. Solo se muestra; no se copia a la actuación. */
  evidenceBase?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Referencia que guarda una actuación creada desde una plantilla. La plantilla no se modifica al adaptar. */
export interface ActuationTemplateRef {
  id: string;
  origin: ActuationTemplateOrigin;
  name: string;
}
