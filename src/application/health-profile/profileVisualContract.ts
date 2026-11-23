/**
 * profileVisualContract
 *
 * Versión operativa de docs/historico/contratos-perfil/PROFILE-VISUAL-CONTRACT.md (histórico).
 * La visualización del Perfil responde preguntas diagnósticas y declara
 * siempre fuente, escala y cautela. Pequeño, puro y testeable.
 */

export type VisualForm =
  | "tabla"
  | "grafico-simple"
  | "matriz"
  | "ficha-secundaria"
  | "bloque-destacado"
  | "no-visualizar";

export interface VisualContractRule {
  id: string;
  elemento: string;
  forma: VisualForm;
  /** Pregunta diagnóstica que responde (regla madre). */
  pregunta: string;
  /** Estructura de datos real que lo sostiene. */
  fuenteDatos: string;
  /** Destino: pantalla, documento (DOCX/PDF) y/o anexo. */
  destino: Array<"pantalla" | "documento" | "anexo">;
}

export const VISUAL_CONTRACT_RULES: VisualContractRule[] = [
  {
    id: "tabla-senales-informe",
    elemento: "Señales sanitarias del Informe de salud",
    forma: "tabla",
    pregunta: "¿Qué trata el Informe de salud y con qué peso?",
    fuenteDatos: "healthReportSanitaryReading",
    destino: ["pantalla", "documento"],
  },
  {
    id: "tabla-trazadores",
    elemento: "Indicadores trazadores con referencias comparativas",
    forma: "tabla",
    pregunta:
      "¿Qué señales de vida cotidiana miden los estudios y frente a qué referencia?",
    fuenteDatos: "complementaryIndicatorReferences",
    destino: ["pantalla", "documento", "anexo"],
  },
  {
    id: "matriz-deliberativa",
    elemento: "Matriz epistemológica/deliberativa",
    forma: "matriz",
    pregunta: "¿Qué debe deliberar el Grupo Motor y con qué base?",
    fuenteDatos: "integratedProfileSignals",
    destino: ["pantalla", "documento"],
  },
  {
    id: "activos-por-capacidad",
    elemento: "Activos por ámbito de capacidad",
    forma: "grafico-simple",
    pregunta: "¿Dónde se concentra la capacidad comunitaria potencial?",
    fuenteDatos: "salutogenicReading",
    destino: ["pantalla", "documento"],
  },
  {
    id: "incertidumbres",
    elemento: "Incertidumbres críticas",
    forma: "bloque-destacado",
    pregunta: "¿Qué no sabemos y por qué importa?",
    fuenteDatos: "incertidumbres + lagunas + EKC",
    destino: ["pantalla", "documento"],
  },
  {
    id: "ficha-badea",
    elemento: "Contexto municipal BADEA/IECA",
    forma: "ficha-secundaria",
    pregunta: "¿En qué contexto urbano se inscribe el municipio matriz?",
    fuenteDatos: "badeaMunicipalContext",
    destino: ["anexo"],
  },
];

export interface VisualProhibition {
  id: string;
  motivo: string;
}

export const VISUAL_PROHIBITIONS: VisualProhibition[] = [
  {
    id: "menciones-como-prevalencia",
    motivo:
      "Las menciones del Informe son trazabilidad textual, no prevalencia: " +
      "jamás gráfico de magnitud sanitaria.",
  },
  {
    id: "proxy-como-hallazgo",
    motivo:
      "El valor demo y la referencia provincial coinciden por diseño (proxy): " +
      "compararlos gráficamente sugeriría hallazgo donde hay construcción.",
  },
  {
    id: "series-temporales",
    motivo: "No existen series en el expediente: sin tendencias.",
  },
  {
    id: "desagregaciones-inexistentes",
    motivo:
      "No hay desagregación por sexo, edad ni renta: su ausencia solo se " +
      "visualiza como incertidumbre declarada.",
  },
  {
    id: "activos-como-resultado",
    motivo:
      "Los activos son capacidades potenciales: sin mapas de cobertura ni " +
      "porcentajes de servicio garantizado.",
  },
  {
    id: "badea-protagonista",
    motivo:
      "BADEA es contexto secundario: nunca en la apertura ni como gráfico " +
      "principal.",
  },
];

/** Pie obligatorio de toda tabla/gráfico: fuente · escala · cautela. */
export function visualCaption(
  fuente: string,
  escala: string,
  cautela: string
): string {
  return `Fuente: ${fuente}. Escala: ${escala}. Cautela: ${cautela}.`;
}
