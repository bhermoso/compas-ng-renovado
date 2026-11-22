import type { WorksheetValues } from "./IndicatorWorksheet";

export interface WorksheetActionProposal {
  id: string;
  indicatorCode: string;
  values: WorksheetValues;
}

export const AGEISM_ACTION_PROPOSALS: readonly WorksheetActionProposal[] = [
  {
    id: "proposal-env-i5-1-intergenerational",
    indicatorCode: "ENV-I5.1",
    values: {
      name: "Programa intergeneracional para prevenir el edadismo en centros educativos",
      agreement: "Propuesta técnica pendiente de revisión y acuerdo por el Grupo Motor y los agentes implicados.",
      contribution: "Diseñar con centros educativos y personas mayores sesiones de aprendizaje, encuentros intergeneracionales y reflexión antes y después de la intervención para reducir estereotipos y actitudes edadistas.",
      otherObjectives: "Pendiente de revisar vínculos con otros objetivos del Plan de Acción.",
      population: "Alumnado y comunidad educativa del territorio, con participación de personas mayores.",
      schedule: "Por acordar con los centros y las personas participantes.",
      requestedData: "Personas participantes únicas por grupo de edad; número y tipo de sesiones; respuestas válidas al instrumento previo y posterior; pérdidas de seguimiento.",
      source: "Registro de participación y actividad, más el instrumento pre/post que se acuerde para medir actitudes edadistas.",
      custody: "Por designar. Deberá conservar identificadores no nominativos para controlar duplicados y emparejar mediciones cuando proceda.",
      delivery: "Destinatario, fecha límite y canal pendientes de acuerdo.",
    },
  },
  {
    id: "proposal-env-i5-2-community-campaign",
    indicatorCode: "ENV-I5.2",
    values: {
      name: "Campaña comunitaria cocreada con personas mayores",
      agreement: "Propuesta técnica pendiente de revisión y acuerdo por el Grupo Motor y los agentes implicados.",
      contribution: "Cocrear y desarrollar acciones de sensibilización en las que las personas mayores participen de forma directa en el diseño, los mensajes, la realización y la evaluación.",
      otherObjectives: "Pendiente de revisar vínculos con otros objetivos del Plan de Acción.",
      population: "Personas mayores participantes y población general alcanzada por las acciones comunitarias en el territorio.",
      schedule: "Por acordar con las entidades y personas participantes.",
      requestedData: "Número de iniciativas; iniciativas con participación directa de personas mayores; papel desempeñado; personas participantes únicas y alcance estimado, diferenciados.",
      source: "Ficha de actividad, actas o documentos de cocreación, materiales publicados y registro de participación.",
      custody: "Por designar. Deberá documentar el criterio de participación directa y controlar duplicados entre iniciativas.",
      delivery: "Destinatario, fecha límite y canal pendientes de acuerdo.",
    },
  },
];

export function actionProposalsForIndicator(indicatorCode: string): readonly WorksheetActionProposal[] {
  return AGEISM_ACTION_PROPOSALS.filter((proposal) => proposal.indicatorCode === indicatorCode);
}
