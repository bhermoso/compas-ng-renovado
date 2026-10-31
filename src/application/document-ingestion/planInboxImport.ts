import type {
  DocumentKind,
  DocumentTemporalMetadata,
  MunicipalDocument,
  MunicipalDocumentRepository,
  TemporalDate,
  TemporalScope,
} from "../../domain/repository";
import { removeEquivalentStrategicFramework } from "./strategicFrameworkReplace";
import type { InspectedFormat } from "./preliminaryDocumentAnalyzer";
import type { MethodologicalMatch } from "./identifyMethodologicalHeaders";

/** Cargador existente de COMPÁS al que la bandeja entrega el archivo revisado. */
export type InboxImportRoute = "health-report" | "document-file" | "study-csv";

export type InboxImportKind =
  | "health-report"
  | "strategic-framework"
  | "territorial-documentation"
  | "qualitative-material"
  | "complementary-study";

/** Instrumento reconocido por cabeceras al que se entrega un CSV de estudio. */
export interface InboxStudyInstrument {
  moduleId: string;
  label: string;
  confidence: MethodologicalMatch["confidence"];
  matched: number;
  expected: number;
}

export interface InboxImportPlan {
  route: InboxImportRoute;
  kind: InboxImportKind;
  /** create: añade un documento; replace: el cargador retira o archiva documentos existentes. */
  effect: "create" | "replace";
  /** Documentos que el cargador archivará (Informe) o retirará con sus evidencias (marco). */
  affected: MunicipalDocument[];
  /** Documentos que no se tocan pero comparten nombre de archivo: posible duplicado. */
  sameFileName: MunicipalDocument[];
  /** Consecuencia de escritura, en lenguaje de interfaz. */
  consequence: string;
  /** Solo en la ruta de estudios: instrumento cuyo cargador recibirá el CSV. */
  instrument?: InboxStudyInstrument;
  /** Advertencias que no bloquean la carga (coincidencia parcial, opciones por defecto). */
  notes?: string[];
}

export type InboxImportBlock = { blocked: true; reason: string };

const IMPORTABLE_KINDS: readonly InboxImportKind[] = [
  "health-report",
  "strategic-framework",
  "territorial-documentation",
  "qualitative-material",
  "complementary-study",
];

function isImportableKind(kind: DocumentKind | "undetermined"): kind is InboxImportKind {
  return (IMPORTABLE_KINDS as readonly string[]).includes(kind);
}

function deriveTitle(fileName: string): string {
  const raw = fileName.replace(/\.(docx?|pdf)$/i, "").replace(/[-_]/g, " ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function activeDocuments(repository: MunicipalDocumentRepository): MunicipalDocument[] {
  return repository.documents.filter((d) => d.status !== "archived" && d.status !== "rejected");
}

/**
 * Decide, sin escribir nada, qué haría el cargador existente con un archivo
 * revisado en la bandeja. Reproduce las reglas de sustitución de los
 * cargadores (Informe: el anterior se archiva; marco estratégico: el
 * equivalente se retira con sus evidencias) para que la persona las vea antes
 * de confirmar.
 */
export function planInboxImport(input: {
  kind: DocumentKind | "undetermined";
  format: InspectedFormat;
  fileName: string;
  repository: MunicipalDocumentRepository;
  /** Coincidencias de cabecera del análisis preliminar (solo CSV). */
  methodologicalMatches?: MethodologicalMatch[];
  /** Instrumentos con cargador CSV conectado a la bandeja (ids de módulo). */
  connectedInstruments?: readonly string[];
}): InboxImportPlan | InboxImportBlock {
  const { kind, format, fileName, repository } = input;
  // Un CSV de instrumento se reconoce por sus columnas, no por el tipo elegido:
  // IBSE se registra como exportación REDCap y el resto como estudio complementario.
  if ((kind === "complementary-study" || kind === "redcap-export") && format === "csv") {
    return planStudyImport(fileName, repository, input.methodologicalMatches ?? [], input.connectedInstruments ?? []);
  }
  if (kind === "complementary-study") {
    return {
      blocked: true,
      reason:
        "Desde la bandeja solo se incorporan estudios complementarios en CSV de un instrumento reconocido. Para un estudio en texto (PDF o DOCX), usa el bloque «Añadir o sustituir fuentes».",
    };
  }
  if (!isImportableKind(kind)) {
    return {
      blocked: true,
      reason:
        "Este tipo documental no tiene todavía un cargador conectado a la bandeja. Usa el bloque «Añadir o sustituir fuentes» o el módulo especializado.",
    };
  }
  if (format !== "pdf" && format !== "docx") {
    return {
      blocked: true,
      reason:
        format === "doc"
          ? "El formato .doc (Word 97-2003) no puede procesarse. Conviértelo a .docx y vuelve a revisarlo."
          : "Solo se pueden incorporar desde la bandeja archivos PDF o DOCX con firma verificada.",
    };
  }

  const active = activeDocuments(repository);
  const normalizedName = fileName.trim().toLowerCase();
  const sameName = (d: MunicipalDocument) =>
    d.sourceFileName !== undefined && d.sourceFileName.trim().toLowerCase() === normalizedName;

  if (kind === "health-report") {
    const affected = active.filter((d) => d.kind === "health-report");
    return {
      route: "health-report",
      kind,
      effect: affected.length ? "replace" : "create",
      affected,
      sameFileName: active.filter((d) => sameName(d) && !affected.includes(d)),
      consequence: affected.length
        ? "Sustituye al Informe de Salud vigente. El anterior se conserva archivado y como versión previa; no se borra."
        : "Crea el Informe de Salud del expediente. El Informe no genera unidades de evidencia.",
    };
  }

  if (kind === "strategic-framework") {
    const { removedDocumentIds } = removeEquivalentStrategicFramework(repository, {
      title: deriveTitle(fileName),
      sourceFileName: fileName,
    });
    const affected = repository.documents.filter((d) => removedDocumentIds.includes(d.id));
    return {
      route: "document-file",
      kind,
      effect: affected.length ? "replace" : "create",
      affected,
      sameFileName: active.filter((d) => sameName(d) && !affected.includes(d)),
      consequence: affected.length
        ? "Sustituye un marco estratégico equivalente (mismo título o archivo). El cargador retira el anterior y sus unidades de evidencia derivadas."
        : "Añade un marco estratégico de referencia. No genera recomendaciones automáticas del Perfil.",
    };
  }

  return {
    route: "document-file",
    kind,
    effect: "create",
    affected: [],
    sameFileName: active.filter(sameName),
    consequence:
      "Añade un documento nuevo al repositorio y extrae unidades de evidencia del texto. No sustituye documentos existentes.",
  };
}

function planStudyImport(
  fileName: string,
  repository: MunicipalDocumentRepository,
  matches: MethodologicalMatch[],
  connected: readonly string[]
): InboxImportPlan | InboxImportBlock {
  const candidates = matches.filter((m) => connected.includes(m.moduleId));
  if (candidates.length === 0) {
    return {
      blocked: true,
      reason: matches.length
        ? "Las columnas coinciden con un instrumento que todavía no tiene cargador conectado a la bandeja. Usa el panel «Estudios complementarios»."
        : "Las columnas del CSV no coinciden con ningún instrumento del catálogo metodológico. No se atribuye a ningún cuestionario: revísalo manualmente.",
    };
  }
  const ratio = (m: MethodologicalMatch) => m.matched / m.expected;
  const best = candidates[0];
  const tied = candidates.filter((m) => m.moduleId !== best.moduleId && ratio(m) === ratio(best) && m.matched === best.matched);
  if (tied.length) {
    return {
      blocked: true,
      reason: `Las columnas encajan por igual con ${[best, ...tied].map((m) => m.label).join(" y ")}. Para no atribuir el CSV a un instrumento equivocado, cárgalo desde el panel «Estudios complementarios».`,
    };
  }
  const active = activeDocuments(repository);
  const affected = active.filter((d) => d.tags.includes(best.moduleId));
  const normalizedName = fileName.trim().toLowerCase();
  const sameFileName = active.filter(
    (d) => !affected.includes(d) && d.sourceFileName !== undefined && d.sourceFileName.trim().toLowerCase() === normalizedName
  );
  const notes: string[] = [];
  if (best.confidence === "partial") {
    notes.push(`Coincidencia parcial de columnas (${best.matched}/${best.expected}). El cargador de ${best.label} comprobará si hay registros válidos; si no los hay, no escribe nada.`);
  }
  if (best.moduleId === "ibse") {
    notes.push("IBSE se carga sin ajuste demográfico. Para ajustarlo por edad y sexo, usa el panel «Estudios complementarios».");
  }
  return {
    route: "study-csv",
    kind: "complementary-study",
    effect: affected.length ? "replace" : "create",
    affected,
    sameFileName,
    consequence: affected.length
      ? `Sustituye el estudio ${best.label} cargado. El cargador retira el documento anterior y sus indicadores del análisis territorial.`
      : `Carga el estudio ${best.label} con su cargador específico, que valida los registros y calcula los indicadores.`,
    instrument: { moduleId: best.moduleId, label: best.label, confidence: best.confidence, matched: best.matched, expected: best.expected },
    ...(notes.length ? { notes } : {}),
  };
}

const DATE_PATTERN = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/;

/** Normaliza AAAA, AAAA-MM o AAAA-MM-DD; devuelve null si el texto no es una fecha válida. */
export function parseDeclaredDate(value: string): TemporalDate | null {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  return { value: value.trim(), precision: match[3] ? "day" : match[2] ? "month" : "year" };
}

/**
 * Convierte los campos temporales de la bandeja en metadatos de dominio.
 * Solo hay declaración cuando una persona identificada fija un alcance
 * distinto de «por determinar»; en otro caso los datos quedan registrados sin
 * declarar y el documento sigue requiriendo revisión temporal.
 */
export function buildInboxTemporalMetadata(input: {
  documentDate: string;
  observedPeriod: string;
  temporalScope: TemporalScope;
  declaredBy: string;
  now: string;
}): { temporal?: DocumentTemporalMetadata } | { error: string } {
  const dateText = input.documentDate.trim();
  const periodText = input.observedPeriod.trim();
  const documentDate = dateText ? parseDeclaredDate(dateText) : undefined;
  if (documentDate === null) {
    return { error: "La fecha del documento debe tener la forma AAAA, AAAA-MM o AAAA-MM-DD." };
  }
  const declares = input.temporalScope !== "undetermined" && input.declaredBy.trim() !== "";
  if (!documentDate && !periodText && !declares) return {};
  return {
    temporal: {
      ...(documentDate ? { documentDate } : {}),
      ...(periodText ? { observedPeriod: { literal: periodText } } : {}),
      ingestedAt: input.now,
      ...(declares
        ? {
            temporalScope: input.temporalScope,
            declaration: {
              declaredBy: input.declaredBy.trim(),
              declaredAt: input.now,
              referenceDate: input.now.slice(0, 10),
              reason: "Declaración en la bandeja de revisión documental",
            },
          }
        : {}),
    },
  };
}
