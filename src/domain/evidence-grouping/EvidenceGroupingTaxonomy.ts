import type { EvidenceAtomKind } from "../evidence/EvidenceAtom";

/**
 * Marco propio de COMPÁS para agrupar evidencias: ocho dimensiones heredadas del
 * histórico. Es una taxonomía propia, no una fuente bibliográfica. No tiene
 * pesos, umbrales ni puntuaciones, y ninguna dimensión tiene rango superior.
 * Contrato: CONTRACT-EVIDENCE-GROUPING.
 */
export const EVIDENCE_GROUPING_FRAMEWORK_LABEL = "Marco propio de COMPÁS";

export type EvidenceGroupingDimensionId =
  | "epidemiologia-territorial"
  | "tendencias-cuadro-de-mando"
  | "determinantes-sociales"
  | "inequidad"
  | "evidencia-cualitativa"
  | "participacion-ciudadana"
  | "factibilidad-institucional"
  | "convergencia-estrategica";

export interface EvidenceGroupingDimension {
  readonly id: EvidenceGroupingDimensionId;
  readonly label: string;
  readonly description: string;
  /** Tipos de átomo que se agrupan aquí. Vacío: ningún tipo de átomo corresponde. */
  readonly atomKinds: readonly EvidenceAtomKind[];
  /** Dónde está hoy el dato en NG, o por qué no hay. Texto, no cálculo. */
  readonly ngSource: string;
  /** Verdadero si NG no tiene el dato que la poblaría. No se rellena. */
  readonly withoutNgEquivalent: boolean;
}

export const EVIDENCE_GROUPING_DIMENSIONS: readonly EvidenceGroupingDimension[] = [
  {
    id: "epidemiologia-territorial",
    label: "Epidemiología territorial",
    description: "Estado de salud medible del territorio.",
    atomKinds: ["indicator"],
    ngSource: "Indicadores del informe de salud y de los estudios complementarios.",
    withoutNgEquivalent: false,
  },
  {
    id: "tendencias-cuadro-de-mando",
    label: "Tendencias del Cuadro de Mando Integral",
    description: "Evolución de indicadores de seguimiento institucional.",
    atomKinds: [],
    ngSource: "NG no incorpora el Cuadro de Mando Integral. No hay dato que la pueble.",
    withoutNgEquivalent: true,
  },
  {
    id: "determinantes-sociales",
    label: "Determinantes sociales",
    description: "Condiciones que estructuran el estado de salud.",
    atomKinds: ["determinant"],
    ngSource: "Átomos de determinantes; referencias EAS solo como comparación «no local».",
    withoutNgEquivalent: false,
  },
  {
    id: "inequidad",
    label: "Inequidad",
    description: "Desigualdades en salud entre grupos o áreas del territorio.",
    atomKinds: [],
    ngSource: "Las desigualdades se declaran en el Perfil, no son un tipo de átomo.",
    withoutNgEquivalent: false,
  },
  {
    id: "evidencia-cualitativa",
    label: "Evidencia cualitativa",
    description: "Relatos y conocimiento experiencial de los actores del territorio.",
    atomKinds: ["qualitative-observation"],
    ngSource: "Material cualitativo y observaciones de estudios complementarios.",
    withoutNgEquivalent: false,
  },
  {
    id: "participacion-ciudadana",
    label: "Participación ciudadana",
    description: "Prioridades y percepciones expresadas por la comunidad.",
    atomKinds: ["participation"],
    ngSource: "Priorización ciudadana y evidencia participativa.",
    withoutNgEquivalent: false,
  },
  {
    id: "factibilidad-institucional",
    label: "Factibilidad institucional",
    description: "Capacidad institucional para actuar sobre lo identificado.",
    atomKinds: [],
    ngSource: "Marco institucional del ciclo de planificación; no es un tipo de átomo.",
    withoutNgEquivalent: false,
  },
  {
    id: "convergencia-estrategica",
    label: "Convergencia estratégica",
    description: "Relación con marcos estratégicos y normativos (EPVSA, ESCA, RELAS).",
    atomKinds: ["strategic-priority"],
    ngSource: "Marcos estratégicos cargados y su traducción.",
    withoutNgEquivalent: false,
  },
];
