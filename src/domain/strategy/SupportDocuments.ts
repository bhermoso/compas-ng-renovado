/**
 * Repositorio común de documentación de apoyo.
 *
 * Documentos de referencia (estrategias y planes) que sostienen la procedencia de
 * los objetivos e indicadores del catálogo del Plan de Acción. Es común a cualquier
 * expediente. `location` indica si el original se conserva en COMPÁS (ruta del PDF
 * incluido en la compilación) o solo se cita por su dirección pública.
 *
 * Las citas de cada elemento del catálogo (CatalogElementProvenance) se contrastaron
 * el 10/11/2026 con estos documentos: con el PDF cuando COMPÁS lo conserva y con la
 * versión pública en los demás casos.
 *
 * Nota: `StrategicFrameworkRegistry` (motor de traducción estratégica) no reproduce
 * con fidelidad las líneas de EPVSA, ESCA ni del Plan de mayores; su corrección está
 * pendiente de decisión. Este repositorio no depende de él.
 */

export type SupportDocumentLocation =
  | { kind: "compas"; path: string }
  | { kind: "url"; url: string };

export interface SupportDocument {
  id: string;
  shortName: string;
  title: string;
  issuer: string;
  period: string;
  location: SupportDocumentLocation;
  note?: string;
}

export const SUPPORT_DOCUMENTS: readonly SupportDocument[] = Object.freeze([
  {
    id: "epvsa",
    shortName: "EPVSA",
    title: "Estrategia de Promoción de una Vida Saludable en Andalucía · Líneas, objetivos e indicadores",
    issuer: "Consejería de Salud y Consumo, Junta de Andalucía",
    period: "Versión de 02/04/2024",
    location: { kind: "compas", path: "docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf" },
  },
  {
    id: "epvsa-indicadores",
    shortName: "EPVSA · indicadores",
    title: "Estrategia de Promoción de una Vida Saludable en Andalucía · Indicadores",
    issuer: "Consejería de Salud y Consumo, Junta de Andalucía",
    period: "Versión de 02/04/2024",
    location: { kind: "url", url: "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/04/INDICADORES_EstrategiaVidaSaludable_02abril2024.pdf" },
    note: "Incluye el programa P04 de identificación y dinamización de activos para la salud.",
  },
  {
    id: "esca",
    shortName: "ESCA",
    title: "Estrategia de Salud Comunitaria de Andalucía 2026–2030",
    issuer: "Consejería de Sanidad, Presidencia y Emergencias, Junta de Andalucía",
    period: "2026–2030",
    location: { kind: "compas", path: "docs/source-material/strategic-frameworks/Estrategia de Salud Comunitaria de Andalucia 2026-2030-ESCA.pdf" },
    note: "Cinco líneas estratégicas, 5 objetivos generales, 19 objetivos específicos y 59 líneas de acción.",
  },
  {
    id: "mayores",
    shortName: "Plan de mayores",
    title: "I Plan Estratégico Integral para Personas Mayores en Andalucía 2020–2023",
    issuer: "Consejería de Igualdad, Políticas Sociales y Conciliación, Junta de Andalucía",
    period: "2020–2023 (vigencia cumplida)",
    location: { kind: "compas", path: "docs/source-material/strategic-frameworks/Plan de mayores 2020-23.pdf" },
    note: "Objetivos estratégicos 1.1–5.1, líneas L1–L5 y programas P1_1–P5_2.",
  },
  {
    id: "pesma-a",
    shortName: "PESMA-A",
    title: "I Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029",
    issuer: "Consejería de Sanidad, Presidencia y Emergencias, Junta de Andalucía",
    period: "2026–2029",
    location: { kind: "url", url: "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/PESMAA.pdf" },
  },
  {
    id: "sns-salud-mental",
    shortName: "Estrategia SNS",
    title: "Estrategia de Salud Mental del Sistema Nacional de Salud 2022–2026",
    issuer: "Ministerio de Sanidad",
    period: "2022–2026",
    location: { kind: "url", url: "https://www.sanidad.gob.es/bibliotecaPub/repositorio/libros/29236_estrategia_de_salud_mental_del_Sistema_Nacional_de_Salud_2022-2026.pdf" },
  },
  {
    id: "ena-2017-2024",
    shortName: "ENA",
    title: "Estrategia Nacional sobre Adicciones 2017–2024",
    issuer: "Delegación del Gobierno para el Plan Nacional sobre Drogas, Ministerio de Sanidad",
    period: "2017–2024 (vigencia cumplida)",
    location: { kind: "url", url: "https://cendocps.carm.es/documentacion/2018_Estrategia_Nacional_Adicciones_2017-2024.pdf" },
    note: "No se ha comprobado si existe una estrategia nacional posterior.",
  },
]);

const BY_ID = new Map(SUPPORT_DOCUMENTS.map((d) => [d.id, d]));

export function getSupportDocument(id: string): SupportDocument | undefined {
  return BY_ID.get(id);
}

/** Documentos citados en un texto de procedencia, por sus siglas o nombre corto. */
export function supportDocumentIdsCitedIn(source: string): string[] {
  const ids: string[] = [];
  const cite = (id: string, pattern: RegExp) => { if (pattern.test(source) && !ids.includes(id)) ids.push(id); };
  cite("pesma-a", /PESMA-A/);
  cite("epvsa", /EPVSA/);
  cite("epvsa-indicadores", /P04/);
  cite("esca", /ESCA/);
  cite("mayores", /Plan de mayores/);
  cite("sns-salud-mental", /\bSNS\b/);
  cite("ena-2017-2024", /\bENA\b/);
  return ids;
}
