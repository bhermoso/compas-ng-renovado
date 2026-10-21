/**
 * Tabla de correspondencia entre las dimensiones sanitarias que detecta la
 * lectura del Informe de Salud y los temas de la papeleta de priorización
 * temática (Art. 4 bis.4 del contrato metodológico).
 *
 * Las dimensiones son un vocabulario cerrado (`TAXONOMIA_SANITARIA`). Cuando el
 * Informe no tiene lectura estructurada de autoría, cada dimensión solo consta
 * por presencia textual (recuento de términos), que no equivale a prevalencia,
 * magnitud ni prioridad: esta tabla no cambia ese estatuto.
 *
 * Mismas reglas que la tabla de Localiza: todas las entradas nacen «propuesta»;
 * solo una persona las pasa a «validada»; `topicIds: []` es «sin correspondencia
 * declarada». Los hallazgos con tema libre de una lectura de autoría necesitarán
 * entradas propias cuando existan.
 */

import { TAXONOMIA_SANITARIA } from "../health-profile/healthReportSanitaryReading";
import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";
import type { CorrespondenceStatus } from "./topicCorrespondence";

export const INFORME_CORRESPONDENCE_VERSION = "0.1.0";

export interface InformeTopicCorrespondenceEntry {
  /** Dimensión sanitaria tal como la nombra la lectura del Informe. */
  informeDimension: string;
  topicIds: readonly string[];
  status: CorrespondenceStatus;
  validatedBy: { person: string; date: string } | null;
  note?: string;
}

const propuesta = (
  informeDimension: string,
  topicIds: readonly string[],
  note?: string
): InformeTopicCorrespondenceEntry => ({
  informeDimension,
  topicIds,
  status: "propuesta",
  validatedBy: null,
  ...(note ? { note } : {}),
});

export const INFORME_TOPIC_CORRESPONDENCE: readonly InformeTopicCorrespondenceEntry[] = [
  propuesta("salud mental y malestar emocional", ["bienestar-emocional"]),
  propuesta("consumos de tabaco y alcohol", ["tabaco-alcohol-drogas"], "La papeleta incluye además vapeadores y otras drogas."),
  propuesta("alimentación, sobrepeso y obesidad", ["alimentacion"]),
  propuesta("actividad física y sedentarismo", ["actividad-fisica"]),
  propuesta("mortalidad y esperanza de vida", [], "Sin tema de papeleta."),
  propuesta("cáncer y tumores", [], "Sin tema de papeleta."),
  propuesta("enfermedades crónicas (diabetes, hipertensión, cardiovascular)", [], "Sin tema de papeleta."),
  propuesta("envejecimiento y dependencia", [], "Sin tema de papeleta."),
  propuesta("prevención y vacunación", [], "Sin tema de papeleta."),
  propuesta("condiciones socioeconómicas y desigualdad", [], "Sin tema de papeleta; dimensión transversal (Art. 11)."),
];

export function validatedInformeCorrespondence(): InformeTopicCorrespondenceEntry[] {
  return INFORME_TOPIC_CORRESPONDENCE.filter((e) => e.status === "validada" && e.validatedBy !== null);
}

/** Dimensiones del Informe que la lectura detecta y la tabla no recoge (debe ser vacío). */
export function informeDimensionsMissingFromTable(): string[] {
  const en = new Set(INFORME_TOPIC_CORRESPONDENCE.map((e) => e.informeDimension));
  return TAXONOMIA_SANITARIA.map((g) => g.dimension).filter((d) => !en.has(d));
}

/** Temas de la papeleta sin ninguna dimensión del Informe con correspondencia validada. */
export function papeletaTopicsWithoutInformeDimension(): string[] {
  const covered = new Set(validatedInformeCorrespondence().flatMap((e) => e.topicIds));
  return THEMATIC_TOPICS.filter((t) => !covered.has(t.id)).map((t) => t.id);
}
