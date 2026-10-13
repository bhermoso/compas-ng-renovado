import type { AgendaDraft } from "../agenda";
import type { PLSEvaluationFramework } from "../../domain/health-plan";

export type MonitoringStatus =
  | "pending-validation"
  | "planned"
  | "in-progress"
  | "completed";

export interface MonitoringItem {
  id: string;
  agendaItemId: string;
  title: string;
  status: MonitoringStatus;
  requiredFields: string[];
  notes: string[];
  requiresHumanValidation: true;
}

export interface MonitoringDraft {
  title: string;
  trackedItems: MonitoringItem[];
  cautions: string[];
  requiresHumanValidation: true;
  /** Marco mínimo que hará evaluable el futuro PLS. Gate G-PLS-10. */
  evaluationFramework?: PLSEvaluationFramework;
}

/** Valida que el marco de evaluación tenga responsable nominal y al menos una
 *  pregunta de evaluación (PM-8 / G-PLS-10). Devuelve los mensajes de error;
 *  vacío = válido. */
export function validatePLSEvaluationFramework(
  framework: PLSEvaluationFramework | undefined
): string[] {
  if (!framework) return ["El marco de evaluación no está definido."];
  const errors: string[] = [];
  if (!framework.evaluationResponsible.trim()) {
    errors.push("El responsable de evaluación debe ser una persona nominada (PM-8).");
  }
  if (!framework.evaluationQuestions.some((q) => q.trim())) {
    errors.push("El marco de evaluación debe incluir al menos una pregunta de evaluación (G-PLS-10).");
  }
  return errors;
}

export function generateMonitoringDraft(
  agenda: AgendaDraft
): MonitoringDraft {
  return {
    title: "Seguimiento inicial de actuaciones",
    trackedItems: agenda.annualItems.map((item, index) => ({
      id: `monitor-${index + 1}-${item.id}`,
      agendaItemId: item.id,
      title: item.title,
      status: "pending-validation",
      requiredFields: [
        "Fecha de inicio",
        "Responsable definitivo",
        "Estado de ejecución",
        "Observaciones",
        "Indicadores asociados",
      ],
      notes: [
        "No registrar ejecución real hasta validación del plan.",
        "Separar claramente planificación y seguimiento efectivo.",
      ],
      requiresHumanValidation: true,
    })),
    cautions: [
      "El seguimiento no implica evaluación de resultados.",
      "Debe existir una agenda validada antes de registrar actividad.",
      "Los cambios de estado requieren intervención humana.",
    ],
    requiresHumanValidation: true,
  };
}
