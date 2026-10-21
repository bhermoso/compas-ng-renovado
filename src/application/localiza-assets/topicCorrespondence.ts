/**
 * Tabla de correspondencia entre temáticas de Localiza Salud y temas de la
 * papeleta de priorización temática (Art. 4 bis.4 del contrato metodológico).
 *
 * Es un catálogo declarado y versionado, no un emparejamiento por texto. Cada
 * entrada nace «propuesta» y solo una persona la pasa a «validada». La
 * derivación de unidades (PR siguiente) usa únicamente entradas validadas.
 * `topicId: null` significa «sin correspondencia declarada»: no se adivina.
 *
 * El lado del Informe de Salud queda fuera de esta versión: sus temas no son un
 * vocabulario cerrado.
 */

import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";

export const TOPIC_CORRESPONDENCE_VERSION = "0.1.0";

export type CorrespondenceStatus = "propuesta" | "validada";

export interface TopicCorrespondenceEntry {
  /** Temática tal como consta en Localiza Salud. */
  localizaTematica: string;
  /** Id de tema de la papeleta (`THEMATIC_TOPICS`), o null si no hay correspondencia declarada. */
  topicId: string | null;
  status: CorrespondenceStatus;
  /** Quién la validó y cuándo; null mientras sea propuesta. */
  validatedBy: { person: string; date: string } | null;
  note?: string;
}

const propuesta = (
  localizaTematica: string,
  topicId: string | null,
  note?: string
): TopicCorrespondenceEntry => ({
  localizaTematica,
  topicId,
  status: "propuesta",
  validatedBy: null,
  ...(note ? { note } : {}),
});

/** Temáticas observadas en los registros de prueba de Granada-Zaidín (15). */
export const TOPIC_CORRESPONDENCE: readonly TopicCorrespondenceEntry[] = [
  propuesta("Alimentación saludable", "alimentacion"),
  propuesta("Actividad física", "actividad-fisica"),
  propuesta("Bienestar emocional", "bienestar-emocional"),
  propuesta("Prevención del suicidio", "bienestar-emocional", "Subtema; el autor decide si se agrupa."),
  propuesta("Salud sexual y reproductiva", "sexualidad-salud"),
  propuesta("Naturaleza", "medioambiente", "Equivalencia parcial; el autor decide."),
  propuesta("Género/identidad", null, "No equivale a «Violencia de género»."),
  propuesta("Participación y acción comunitaria", null),
  propuesta("Cultura y ocio", null),
  propuesta("Envejecimiento activo", null, "Población o tema del Informe, no de la papeleta."),
  propuesta("Escuela de salud/formación", null),
  propuesta("Enfermedades crónicas", null, "Tema del Informe, no de la papeleta."),
  propuesta("Personas cuidadoras", null),
  propuesta("Personas en riesgo de exclusión", null),
  propuesta("Otros", null),
];

/** Entradas que una persona ha validado: las únicas que puede usar la derivación de unidades. */
export function validatedCorrespondence(): TopicCorrespondenceEntry[] {
  return TOPIC_CORRESPONDENCE.filter((e) => e.status === "validada" && e.validatedBy !== null);
}

/** Temas de la papeleta sin ninguna temática de Localiza propuesta ni validada: no tienen cobertura declarada en el mapa. */
export function papeletaTopicsWithoutLocalizaTematica(): string[] {
  const covered = new Set(
    TOPIC_CORRESPONDENCE.map((e) => e.topicId).filter((id): id is string => id !== null)
  );
  return THEMATIC_TOPICS.filter((t) => !covered.has(t.id)).map((t) => t.id);
}
