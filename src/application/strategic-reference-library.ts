/**
 * Marco estratégico común de COMPÁS. No forma parte de ningún
 * MunicipalityWorkspace ni produce EvidenceAtoms municipales: es el mismo para
 * todos los expedientes, y de él proceden objetivos e indicadores del Plan de
 * Acción.
 *
 * Fuente única: el repertorio de documentación de apoyo (SupportDocuments).
 * La biblioteca de Diagnóstico y la «Documentación de apoyo» del Plan de
 * Acción muestran así los mismos documentos, con su denominación oficial.
 * Un registro no equivale a validar la vigencia de un marco: fecha y ámbito
 * deben revisarse antes de aplicarlo.
 */
import { SUPPORT_DOCUMENTS, type SupportDocument } from "../domain/strategy/SupportDocuments";

export interface StrategicReference {
  id: string;
  shortName: string;
  /** Denominación oficial del documento. */
  title: string;
  issuer: string;
  period: string;
  scope: "andalucia" | "espana";
  /** Ruta del PDF conservado en COMPÁS, si lo conserva. */
  sourcePath?: string;
  /** Dirección pública, cuando COMPÁS no conserva el original. */
  url?: string;
  category: "estrategia" | "plan";
  note?: string;
}

/** Orden de lectura: marco general, salud comunitaria, vida saludable, planes sectoriales y referencias estatales. */
const ORDER = ["esa-2030", "esca", "epvsa", "epvsa-indicadores", "pesma-a", "mayores", "sns-salud-mental", "ena-2017-2024"];

function toReference(doc: SupportDocument): StrategicReference {
  const estatal = /Ministerio|Gobierno para el Plan Nacional/.test(doc.issuer);
  return {
    id: doc.id,
    shortName: doc.shortName,
    title: doc.title,
    issuer: doc.issuer,
    period: doc.period,
    scope: estatal ? "espana" : "andalucia",
    ...(doc.location.kind === "compas" ? { sourcePath: doc.location.path } : { url: doc.location.url }),
    category: /^(I )?Plan\b/.test(doc.title) ? "plan" : "estrategia",
    ...(doc.note ? { note: doc.note } : {}),
  };
}

export const STRATEGIC_REFERENCES: readonly StrategicReference[] = Object.freeze(
  [...SUPPORT_DOCUMENTS]
    .sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99))
    .map(toReference),
);
