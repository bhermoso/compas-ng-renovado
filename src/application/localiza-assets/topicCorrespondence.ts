/**
 * Tabla de correspondencia entre temáticas de Localiza Salud y temas de la
 * papeleta de priorización temática (Art. 4 bis.4 del contrato metodológico).
 *
 * Es un catálogo declarado y versionado, no un emparejamiento por texto. Cada
 * entrada nace «propuesta» y solo una persona la pasa a «validada». La
 * derivación de unidades (PR siguiente) usa únicamente entradas validadas.
 * `topicIds: []` significa «sin correspondencia declarada»: no se adivina.
 *
 * El lado del Informe de Salud queda fuera de esta versión: sus temas no son un
 * vocabulario cerrado.
 */

import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";

export const TOPIC_CORRESPONDENCE_VERSION = "0.2.0";

export type CorrespondenceStatus = "propuesta" | "validada";

export interface TopicCorrespondenceEntry {
  /** Temática tal como consta en Localiza Salud. */
  localizaTematica: string;
  /** Ids de tema de la papeleta (`THEMATIC_TOPICS`). Vacío: sin correspondencia declarada. Una temática puede corresponder a varios temas. */
  topicIds: readonly string[];
  status: CorrespondenceStatus;
  /** Quién la validó y cuándo; null mientras sea propuesta. */
  validatedBy: { person: string; date: string } | null;
  note?: string;
}

const propuesta = (
  localizaTematica: string,
  topicIds: readonly string[],
  note?: string
): TopicCorrespondenceEntry => ({
  localizaTematica,
  topicIds,
  status: "propuesta",
  validatedBy: null,
  ...(note ? { note } : {}),
});

/** Validación del autor, 2026-10-21. */
const VALIDADA_POR_EL_AUTOR = { person: "Blas Ramón Hermoso Rico", date: "2026-10-21" } as const;

const validada = (
  localizaTematica: string,
  topicIds: readonly string[],
  note?: string
): TopicCorrespondenceEntry => ({
  localizaTematica,
  topicIds,
  status: "validada",
  validatedBy: VALIDADA_POR_EL_AUTOR,
  ...(note ? { note } : {}),
});

/** Temáticas observadas en los registros de prueba de Granada-Zaidín (15). */
export const TOPIC_CORRESPONDENCE: readonly TopicCorrespondenceEntry[] = [
  validada("Alimentación saludable", ["alimentacion"]),
  validada("Actividad física", ["actividad-fisica"]),
  validada("Bienestar emocional", ["bienestar-emocional"]),
  validada("Salud sexual y reproductiva", ["sexualidad-salud"]),
  validada(
    "Género/identidad",
    ["bienestar-emocional", "sexualidad-salud"],
    "Incluye a las personas trans. La violencia de género se entiende solo respecto de las mujeres y no se asigna a esta temática (declaración del autor)."
  ),
  validada("Prevención del suicidio", ["bienestar-emocional"], "Tema de la papeleta: bienestar emocional y salud mental."),
  propuesta("Naturaleza", ["medioambiente"], "Equivalencia parcial; el autor decide."),
  propuesta("Participación y acción comunitaria", []),
  propuesta("Cultura y ocio", []),
  propuesta("Envejecimiento activo", [], "Población o tema del Informe, no de la papeleta."),
  propuesta("Escuela de salud/formación", []),
  propuesta("Enfermedades crónicas", [], "Tema del Informe, no de la papeleta."),
  propuesta("Personas cuidadoras", []),
  propuesta("Personas en riesgo de exclusión", []),
  propuesta("Otros", []),
];

/** Entradas que una persona ha validado: las únicas que puede usar la derivación de unidades. */
export function validatedCorrespondence(): TopicCorrespondenceEntry[] {
  return TOPIC_CORRESPONDENCE.filter((e) => e.status === "validada" && e.validatedBy !== null);
}

/** Temas de la papeleta sin ninguna temática de Localiza con correspondencia validada: el mapa de activos no puede mostrarles correspondencia. */
export function papeletaTopicsWithoutLocalizaTematica(): string[] {
  const covered = new Set(validatedCorrespondence().flatMap((e) => e.topicIds));
  return THEMATIC_TOPICS.filter((t) => !covered.has(t.id)).map((t) => t.id);
}
