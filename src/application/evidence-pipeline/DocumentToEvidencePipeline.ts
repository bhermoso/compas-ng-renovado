import type { MunicipalDocument } from "../../domain/repository";
import {
  addEvidenceAtom,
  upsertEvidenceAtom,
  stableAssetKey,
  type EvidenceStore,
  createEvidenceAtom,
  type EvidenceAtom,
  type EvidenceAtomKind,
} from "../../domain/evidence";
import { extractNumberedOpenAnswers } from "./numberedOpenAnswers";

/**
 * Estructura que el equipo técnico declara para el texto del documento.
 * - `open-answers`: respuestas abiertas numeradas de un cuestionario; cada
 *   respuesta completa es una unidad y no se clasifica por palabras clave.
 */
export type DeclaredDocumentStructure = "open-answers";

export interface TransformDocumentToEvidenceInput {
  store: EvidenceStore;
  document: MunicipalDocument;
  plainText: string;
  structure?: DeclaredDocumentStructure;
}

export interface TransformDocumentToEvidenceResult {
  store: EvidenceStore;
  atomsCreated: EvidenceAtom[];
}

// Nombres de sección que NO deben convertirse en activos
const NON_ASSET_SECTION_NAMES = new Set([
  "introducción", "introduccion",
  "presentación", "presentacion",
  "notas", "fuentes",
  "observaciones", "conclusiones",
  "resumen", "índice", "indice",
]);

// Encabezado de activo: ## Nombre o ## 1. Nombre (markdown nivel 2 o más)
const ASSET_HEADING_RE = /^#{2,}\s+(?:\d+\.\s*)?(.+)$/;

// Etiqueta de campo aislada: **Descripción** o **Descripción:** sin contenido
const FIELD_LABEL_ONLY_RE = /^\*\*[^*]+\*\*\s*:?\s*$/;

// Separador de bloque
const SEPARATOR_RE = /^-{3,}$/;

// Palabras que indican que una línea es cabecera de exportación de Localiza Salud
// (primera columna, normalizada: sin tildes, minúsculas, sin guiones bajos).
const LOCALIZA_HEADER_FIRST_FIELDS = new Set([
  "orden", "nombre", "recurso", "nombredelrecurso",
  "municipio", "localidad", "titodvia", "tipodvia", "tipodeva", "tipodev",
  "direccion", "codigopostal", "titular", "telefono", "email", "web",
  "descripcion", "actividades", "requisito", "razonseleccion",
]);

function normalizeForHeaderCheck(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[_\s]/g, "");
}

function isLocalizaSaludHeaderLine(line: string): boolean {
  const sep = line.includes("\t") ? "\t" : line.includes("|") ? "|" : null;
  if (!sep) return false;
  const firstField = normalizeForHeaderCheck(line.split(sep)[0].trim());
  return LOCALIZA_HEADER_FIRST_FIELDS.has(firstField);
}

interface AssetBlock {
  name: string;
  content: string;
}

// Agrupa el texto en bloques por activo comunitario.
// Detecta encabezados ## y acumula las líneas siguientes como contenido de ese activo.
// Fallback conservador cuando no hay encabezados reconocibles.
function segmentCommunityAssets(text: string): AssetBlock[] {
  const lines = text.split(/\r?\n/);
  const assets: AssetBlock[] = [];
  let currentName: string | null = null;
  const currentLines: string[] = [];

  function flush(): void {
    if (currentName !== null) {
      assets.push({ name: currentName, content: currentLines.join(" ").trim() });
      currentName = null;
      currentLines.length = 0;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (SEPARATOR_RE.test(line)) continue;         // --- separador
    if (/^#\s/.test(line)) continue;               // # título del documento

    const headingMatch = ASSET_HEADING_RE.exec(line);
    if (headingMatch !== null) {
      const name = headingMatch[1].trim().replace(/\*\*/g, "");
      if (NON_ASSET_SECTION_NAMES.has(name.toLowerCase())) {
        flush();
        continue;
      }
      flush();
      currentName = name;
      continue;
    }

    if (currentName !== null && !FIELD_LABEL_ONLY_RE.test(line)) {
      currentLines.push(line);
    }
    // Sin activo activo → preamble, ignorar
  }
  flush();

  if (assets.length > 0) return assets;

  // Fallback: sin encabezados ## reconocibles — una línea limpia por activo,
  // descartando separadores, encabezados y etiquetas de campo vacías
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !SEPARATOR_RE.test(l) &&
        !/^#+\s/.test(l) &&
        !FIELD_LABEL_ONLY_RE.test(l)
    )
    .map((l) => {
      const name = l
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/^\d+\.\s*/, "")
        .trim();
      return { name: name || l, content: l };
    });
}

// Ruta de ingesta específica para community-asset:
// genera un EvidenceAtom por bloque de activo, no por línea.
function transformCommunityAssets(
  input: TransformDocumentToEvidenceInput
): TransformDocumentToEvidenceResult {
  const blocks = segmentCommunityAssets(input.plainText);
  let store = input.store;
  const atomsCreated: EvidenceAtom[] = [];

  blocks.forEach((block, index) => {
    const content = block.content.length > 0 ? block.content : block.name;
    const atom = createEvidenceAtom({
      id: `${input.document.id}-atom-${index + 1}`,
      municipalityId: input.store.municipalityId,
      kind: "asset",
      title: block.name,
      content,
      provenance: {
        origin: "community-assets",
        documentId: input.document.id,
        sourceLabel: input.document.title,
        extractedAt: new Date().toISOString(),
      },
      methodology: {
        description:
          "Activo comunitario identificado en el documento de activos municipales.",
        limitations: ["Requiere revisión técnica antes de alimentar decisiones."],
        requiresHumanValidation: true,
      },
      tags: ["community-asset", "asset"],
    });

    const key = stableAssetKey(
      atom.municipalityId,
      atom.provenance.origin,
      atom.title
    );
    store = upsertEvidenceAtom(store, atom, key);
    atomsCreated.push(atom);
  });

  return { store, atomsCreated };
}

function transformOpenAnswers(
  input: TransformDocumentToEvidenceInput
): TransformDocumentToEvidenceResult {
  const parsed = extractNumberedOpenAnswers(input.plainText);
  // Si el texto no tiene la estructura declarada, no se atomiza por líneas:
  // sería volver a la clasificación heurística que se quiso evitar.
  if (parsed === null) return { store: input.store, atomsCreated: [] };

  const now = new Date().toISOString();
  const origin = mapDocumentKindToEvidenceOrigin(input.document.kind);
  let store = input.store;
  const atomsCreated: EvidenceAtom[] = [];
  let sequence = 0;

  parsed.groups.forEach((group, groupIndex) => {
    group.answers.forEach((answer) => {
      sequence += 1;
      const atom = createEvidenceAtom({
        id: `${input.document.id}-atom-${sequence}`,
        municipalityId: input.store.municipalityId,
        kind: "participation",
        title: `Respuesta ${answer.number} · pregunta ${groupIndex + 1}`,
        content: answer.text,
        provenance: {
          origin,
          documentId: input.document.id,
          sourceLabel: input.document.title,
          field: group.question,
          ...(answer.page !== undefined ? { page: answer.page } : {}),
          extractedAt: now,
        },
        methodology: {
          description:
            "Respuesta abierta numerada, transcrita tal como figura en el documento. Cada respuesta completa es una unidad; no se clasifica por temas.",
          limitations: [
            "Persona respondente no identificada.",
            "Representatividad no declarada en el texto extraído.",
            "No establece causalidad ni prioriza automáticamente.",
          ],
          requiresHumanValidation: true,
        },
        tags: [input.document.kind, "participation", "open-answer"],
      });
      store = addEvidenceAtom(store, atom);
      atomsCreated.push(atom);
    });
  });

  sequence += 1;
  const caution = createEvidenceAtom({
    id: `${input.document.id}-atom-${sequence}`,
    municipalityId: input.store.municipalityId,
    kind: "methodological-caution",
    title: "Alcance de la extracción de respuestas abiertas",
    content: `Se extrajeron ${parsed.totalAnswers} respuestas abiertas en ${parsed.groups.length} ${parsed.groups.length === 1 ? "pregunta" : "preguntas"}. El resto del texto (tablas de datos, muestra, cifras) no se atomizó y permanece íntegro en el documento.`,
    provenance: {
      origin,
      documentId: input.document.id,
      sourceLabel: input.document.title,
      extractedAt: now,
    },
    methodology: {
      description: "Recuento de lo extraído por estructura, sin interpretación.",
      limitations: ["Las respuestas se numeran como figuran en el documento."],
      requiresHumanValidation: true,
    },
    tags: [input.document.kind, "methodological-caution"],
  });
  store = addEvidenceAtom(store, caution);
  atomsCreated.push(caution);

  return { store, atomsCreated };
}

export function transformDocumentToEvidence(
  input: TransformDocumentToEvidenceInput
): TransformDocumentToEvidenceResult {
  if (input.document.canGenerateEvidence === false) {
    return { store: input.store, atomsCreated: [] };
  }

  if (input.structure === "open-answers") {
    return transformOpenAnswers(input);
  }

  if (input.document.kind === "community-asset") {
    return transformCommunityAssets(input);
  }

  const rawLines = input.plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = input.document.kind === "localiza-salud"
    ? rawLines.filter((line) => !isLocalizaSaludHeaderLine(line))
    : rawLines;

  let store = input.store;
  const atomsCreated: EvidenceAtom[] = [];

  for (let index = 0; index < lines.length; index++) {
    const content = lines[index];
    const kind = classifyEvidenceKind(content, input.document.kind);

    const atom = createEvidenceAtom({
      id: `${input.document.id}-atom-${index + 1}`,
      municipalityId: input.store.municipalityId,
      kind,
      title: resolveAtomTitle(content, kind, input.document.kind, index + 1),
      content,
      provenance: {
        origin: mapDocumentKindToEvidenceOrigin(input.document.kind),
        documentId: input.document.id,
        sourceLabel: input.document.title,
        extractedAt: new Date().toISOString(),
      },
      methodology: {
        description:
          "Extracción textual inicial. Requiere revisión técnica antes de alimentar decisiones.",
        limitations: [
          "Clasificación heurística inicial.",
          "No establece causalidad.",
          "No prioriza automáticamente.",
        ],
        requiresHumanValidation: true,
      },
      tags: [input.document.kind, kind],
    });

    if (input.document.kind === "localiza-salud") {
      const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
      store = upsertEvidenceAtom(store, atom, key);
    } else {
      store = addEvidenceAtom(store, atom);
    }
    atomsCreated.push(atom);
  }

  return {
    store,
    atomsCreated,
  };
}

function classifyEvidenceKind(
  text: string,
  documentKind: MunicipalDocument["kind"]
): EvidenceAtomKind {
  // Para localiza-salud y community-asset el tipo documental es un prior absoluto:
  // todas sus líneas son activos comunitarios, sin excepción textual.
  if (documentKind === "localiza-salud" || documentKind === "community-asset") {
    return "asset";
  }

  // Los marcos estratégicos y normativos generan prioridades estratégicas.
  if (documentKind === "strategic-framework") {
    return "strategic-priority";
  }

  const normalized = text.toLowerCase();

  // Heurística textual — tiene prioridad sobre el tipo de documento
  if (
    normalized.includes("tasa") ||
    normalized.includes("porcentaje") ||
    normalized.includes("%") ||
    normalized.includes("prevalencia") ||
    normalized.includes("incidencia") ||
    normalized.includes("mortalidad")
  ) {
    return "indicator";
  }

  if (
    normalized.includes("determinante") ||
    normalized.includes("desigualdad") ||
    normalized.includes("vulnerabilidad") ||
    normalized.includes("renta") ||
    normalized.includes("empleo") ||
    normalized.includes("educación") ||
    normalized.includes("vivienda")
  ) {
    return "determinant";
  }

  if (
    normalized.includes("activo") ||
    normalized.includes("asociación") ||
    normalized.includes("recurso comunitario") ||
    normalized.includes("equipamiento") ||
    normalized.includes("red comunitaria")
  ) {
    return "asset";
  }

  if (
    normalized.includes("participación") ||
    normalized.includes("ciudadanía") ||
    normalized.includes("grupo focal") ||
    normalized.includes("entrevista") ||
    normalized.includes("encuesta")
  ) {
    return "participation";
  }

  if (
    normalized.includes("cautela") ||
    normalized.includes("limitación") ||
    normalized.includes("sesgo") ||
    normalized.includes("muestra") ||
    normalized.includes("representatividad")
  ) {
    return "methodological-caution";
  }

  // Fallback semántico: el tipo de documento es un prior fuerte
  // cuando el texto no contiene patrones reconocibles
  if (documentKind === "eas-variable" || documentKind === "cmi-indicator") {
    return "indicator";
  }

  if (documentKind === "redcap-export") {
    return "participation";
  }

  // Evidencia longitudinal: siempre produce snapshots comparativos
  if (documentKind === "longitudinal-evidence") {
    return "longitudinal-snapshot";
  }

  return "qualitative-observation";
}

function resolveAtomTitle(
  content: string,
  kind: EvidenceAtomKind,
  documentKind: MunicipalDocument["kind"],
  index: number
): string {
  if (documentKind === "localiza-salud") {
    return extractLocalizaSaludTitle(content, index);
  }
  return extractAtomTitle(content, kind, index);
}

function extractLocalizaSaludTitle(content: string, index: number): string {
  if (content.includes("|")) {
    const pipeFields = content.split("|");
    const firstField = pipeFields[0].trim();
    // Los exports de Localiza Salud pueden conservar «Orden» como primera
    // columna tanto en TSV como en variantes separadas por pipe.
    if (/^\d+$/.test(firstField) && pipeFields.length > 1) {
      const secondField = pipeFields[1].trim();
      if (secondField.length > 0) return secondField;
    }
    if (firstField.length > 0) return firstField;
  }

  if (content.includes("\t")) {
    const tabFields = content.split("\t");
    const firstField = tabFields[0].trim();
    // Si el primer campo es un número (columna Orden de Localiza Salud), usar el segundo
    if (/^\d+$/.test(firstField) && tabFields.length > 1) {
      const secondField = tabFields[1].trim();
      if (secondField.length > 0) return secondField;
    }
    if (firstField.length > 0) return firstField;
  }

  // Patrones que inician la descripción en Localiza Salud (no son nombres de activo)
  const lowerContent = content.toLowerCase();
  const descriptionStarters = [
    "los centros",
    "grupos de",
    "piscina pública",
    "los puntos",
    "en este taller",
    "las piscinas",
    "este centro",
    "este taller",
  ];
  for (const starter of descriptionStarters) {
    const idx = lowerContent.indexOf(starter);
    if (idx > 0) {
      const candidate = content.slice(0, idx).trim();
      if (candidate.length > 0) return candidate;
    }
  }

  return buildTitle("asset", index);
}

function extractAtomTitle(
  content: string,
  kind: EvidenceAtomKind,
  index: number
): string {
  if (kind === "asset" && content.includes("|")) {
    const firstField = content.split("|")[0].trim();
    if (firstField.length > 0) return firstField;
  }
  return buildTitle(kind, index);
}

function buildTitle(kind: EvidenceAtomKind, index: number): string {
  const labels: Record<EvidenceAtomKind, string> = {
    indicator: "Indicador detectado",
    determinant: "Determinante detectado",
    asset: "Activo detectado",
    participation: "Hallazgo participativo",
    "qualitative-observation": "Observación cualitativa",
    "territorial-context": "Contexto territorial",
    "sample-quality": "Calidad muestral",
    "longitudinal-snapshot": "Snapshot longitudinal",
    "strategic-priority": "Prioridad estratégica",
    "methodological-caution": "Cautela metodológica",
    other: "Evidencia",
  };

  return `${labels[kind]} ${index}`;
}

function mapDocumentKindToEvidenceOrigin(
  kind: MunicipalDocument["kind"]
): EvidenceAtom["provenance"]["origin"] {
  switch (kind) {
    case "health-report":
      return "health-report";
    case "complementary-study":
      return "complementary-study";
    case "eas-variable":
      return "eas";
    case "cmi-indicator":
      return "cmi";
    case "community-asset":
      return "community-assets";
    case "localiza-salud":
      return "localiza-salud";
    case "strategic-framework":
      return "strategic-framework";
    case "redcap-export":
      return "redcap";
    case "longitudinal-evidence":
      return "longi";
    case "territorial-documentation":
      return "territorial-documentation";
    case "qualitative-material":
      return "qualitative-material";
    default:
      return "other";
  }
}
