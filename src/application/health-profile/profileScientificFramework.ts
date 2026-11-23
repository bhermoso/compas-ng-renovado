/**
 * profileScientificFramework
 *
 * Versión operativa de docs/historico/contratos-perfil/PROFILE-SCIENTIFIC-FRAMEWORK.md (histórico):
 * principios científicos del Perfil traducidos a reglas verificables y a la
 * taxonomía cerrada de estatus causal. Pequeño, puro y testeable.
 */

// ── Estatus causal (Hernán/Robins: inferencia prudente) ──────────────────────

export type CausalStatus =
  | "presencia-textual"
  | "descriptivo"
  | "hipotesis-plausible"
  | "a-contrastar"
  | "no-evaluable";

export const CAUSAL_STATUS_LABEL: Record<CausalStatus, string> = {
  "presencia-textual":
    "presencia textual en la fuente (trazabilidad, no prevalencia)",
  descriptivo: "valor descriptivo en su escala declarada (sin lectura causal)",
  "hipotesis-plausible":
    "mecanismo social plausible, trazable y pendiente de contraste",
  "a-contrastar": "eje sugerido por evidencia indirecta; requiere contraste",
  "no-evaluable": "no evaluable con la evidencia disponible",
};

// ── Principios operativos del marco ───────────────────────────────────────────

export interface ScientificPrinciple {
  id: string;
  /** Autores/marco de referencia. */
  marco: string;
  /** Regla operativa verificable en COMPÁS. */
  reglaOperativa: string;
}

export const SCIENTIFIC_PRINCIPLES: ScientificPrinciple[] = [
  {
    id: "conocimiento-lego",
    marco: "Popay (eje del marco)",
    reglaOperativa:
      "El Grupo Motor y el vecindario producen conocimiento (mecanismos, " +
      "barreras, significados, acceso real): toda señal deja una pregunta de " +
      "contraste comunitario y la validación comunitaria consta como " +
      "pendiente mientras no exista material cualitativo o deliberación.",
  },
  {
    id: "determinantes-equidad",
    marco: "OMS-CDSS, Marmot, Dahlgren-Whitehead",
    reglaOperativa:
      "Toda señal de salud se conecta con condiciones de vida como mecanismo " +
      "plausible, nunca como atribución causal.",
  },
  {
    id: "ecosocial",
    marco: "Krieger",
    reglaOperativa:
      "Las señales se leen como incorporación de condiciones sociales: la " +
      "pregunta guía es qué exposición o recurso distribuye el patrón.",
  },
  {
    id: "desigualdades",
    marco: "Whitehead, Graham, Borrell, Benach, Bambra",
    reglaOperativa:
      "Cada señal declara su distribución: conocida o desconocida por falta " +
      "de desagregación. La ausencia de dato desagregado es incertidumbre de " +
      "equidad, jamás ausencia de desigualdad.",
  },
  {
    id: "salutogenesis",
    marco: "Antonovsky",
    reglaOperativa:
      "La lectura pregunta también qué genera salud: los activos se leen " +
      "frente a las señales, no como lista aparte.",
  },
  {
    id: "activos",
    marco: "Morgan-Ziglio, Cofiño, Hernán-García, Botello, Cassetti",
    reglaOperativa:
      "Un activo inventariado es capacidad potencial hasta su validación " +
      "comunitaria; nunca se presenta como resultado ni cobertura.",
  },
  {
    id: "genero-cuidados",
    marco: "Ruiz Cantero, García-Calvente",
    reglaOperativa:
      "Sin desagregación por sexo/género ni datos de cuidados, el Perfil lo " +
      "declara como laguna específica y lo traslada a pregunta para el Grupo " +
      "Motor.",
  },
  {
    id: "lugar",
    marco: "Macintyre/Ellaway, Segura del Pozo",
    reglaOperativa:
      "La unidad de lectura es la vida cotidiana del barrio; los datos de " +
      "escala superior son contexto del lugar, no su medida.",
  },
  {
    id: "causalidad-prudente",
    marco: "Hernán/Robins",
    reglaOperativa:
      "Estatus causal explícito por señal (presencia-textual → descriptivo → " +
      "hipótesis-plausible → a-contrastar → no-evaluable); las menciones del " +
      "Informe son trazabilidad textual, no prevalencia.",
  },
];
