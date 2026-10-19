/**
 * pslcCanonicalProjector
 *
 * Proyección MECÁNICA del documento canónico (GOV-SALIDA-01, PR-2): traduce la
 * lectura editorial (`CanonicalEditorialView`) y el espacio técnico
 * (`CanonicalTechnicalSpace`) al modelo documental de renderizado
 * (`PSLCDocumentModel`) que consumen visor, DOCX y PDF.
 *
 * Reglas (verificables):
 *   - NO lee la instantánea de respuestas diagnósticas ni el cuerpo narrativo
 *     del PSL (esas fuentes solo las usa la ruta B histórica, aislada).
 *   - NO ejecuta el parser de capítulos narrativos ni recompone reglas
 *     editoriales.
 *   - NO crea secciones sin origen en la vista / el espacio técnico / la
 *     metadata; cada elemento aparece UNA vez.
 *   - Emite `sectionId` estables y orden determinista (lectura y luego técnico).
 *   - Solo adapta el tipo visual (`kind`); ninguna decisión científica o
 *     editorial.
 */

import type { LocalHealthProfileArtifact } from "../../domain/health-profile-artifact";
import type {
  CanonicalEditorialView,
  CanonicalTechnicalSpace,
} from "../health-profile";
import { conciliationParagraph } from "../health-profile/antecedents";
import type { PSLCDocumentModel, PSLCDocumentSection } from "./pslcDocumentModel";
import { pslcDocxFileName } from "./pslcDocumentModel";

// ── Metadata no semántica (portada + trazabilidad) ────────────────────────────

export interface PSLCDocumentMetadata {
  title: string;
  subtitle: string;
  fileName: string;
  portada: string[];
  traceability: {
    sourceHash: string;
    artifactId: string;
    sourcePSLId: string;
    sourcePSLVersion: string;
    sourcePSLEvidenceStoreVersion: string;
    frozenEvidenceAtomCount: number;
  };
}

function fecha(iso: string | undefined): string {
  if (!iso) return "no disponible";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "no disponible";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parrafos(content: string): string[] {
  return content
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Ensambla la metadata desde el artefacto (sin recomputar contenido semántico). */
export function buildPSLCDocumentMetadata(
  artifact: LocalHealthProfileArtifact
): PSLCDocumentMetadata {
  const provincia = artifact.portada.municipalityProvince
    ? ` (${artifact.portada.municipalityProvince})`
    : "";
  const portada: string[] = [
    `Versión ${artifact.portada.artifactVersion} · compilado el ` +
      `${fecha(artifact.compiledAt)}` +
      (artifact.compiledBy ? ` · por ${artifact.compiledBy}` : ""),
    "Artefacto institucional congelado: representa el estado del diagnóstico " +
      "en el momento de su compilación y no admite edición.",
    `Validación técnica: ${artifact.notaValidacion.pslValidatedBy ?? "no disponible"}` +
      (artifact.notaValidacion.pslValidatedAt
        ? ` · ${fecha(artifact.notaValidacion.pslValidatedAt)}`
        : ""),
    "La trazabilidad completa (hash, identificadores y fuentes) consta en el " +
      "anexo técnico.",
  ];
  return {
    title: `Perfil de Salud Local de ${artifact.portada.municipalityName}${provincia}`,
    subtitle: "Documento institucional compilado (PSL-C)",
    fileName: pslcDocxFileName(artifact),
    portada,
    traceability: {
      sourceHash: artifact.sourceHash,
      artifactId: artifact.id,
      sourcePSLId: artifact.sourcePSLId,
      sourcePSLVersion: artifact.sourcePSLVersion,
      sourcePSLEvidenceStoreVersion: artifact.sourcePSLEvidenceStoreVersion,
      frozenEvidenceAtomCount: artifact.evidenceAtomIds.length,
    },
  };
}

// ── Proyección ────────────────────────────────────────────────────────────────

export function projectCanonicalToDocumentModel(
  reading: CanonicalEditorialView,
  technicalSpace: CanonicalTechnicalSpace,
  metadata: PSLCDocumentMetadata
): PSLCDocumentModel {
  const sections: PSLCDocumentSection[] = [];

  // ── Lectura editorial ─────────────────────────────────────────────────────
  if (reading.overview.length > 0) {
    sections.push({
      sectionId: "overview",
      title: "Imagen general",
      level: 1,
      kind: "summaryCards",
      cards: reading.overview.map((m) => ({ destacado: true, texto: m.text })),
      paragraphs: [],
    });
  }

  sections.push({
    sectionId: "source-blocks",
    title: "Señales principales por fuente",
    level: 1,
    paragraphs: reading.sourceBlocks.map(
      (b) => `${b.title} — ${b.whatItAdds}. ${b.whatItDoesNotAllow}.`
    ),
  });

  if (reading.informeSignalRanking !== null) {
    const r = reading.informeSignalRanking;
    sections.push({
      sectionId: "informe-ranking",
      title: "Señales sanitarias del Informe de salud",
      level: 1,
      kind: "barRanking",
      ranking: r.items.map((i) => ({
        etiqueta: i.etiqueta,
        valor: i.valor,
        max: i.max,
      })),
      paragraphs: [r.unidad + ".", r.caption],
    });
  }

  if (reading.pendingDeclaration !== null) {
    sections.push({
      sectionId: "pending-declaration",
      title: "Lectura territorial pendiente",
      level: 1,
      paragraphs: [reading.pendingDeclaration],
    });
  }

  if (reading.territorialReadings.length > 0) {
    // El aviso de no exhaustividad encabeza la lectura, igual que en pantalla:
    // proyección mecánica del campo canónico `interpretation.nonExhaustiveNotice`,
    // para que el documento sellado (DOCX/PDF/visor) lleve la misma cautela
    // metodológica que la lectura viva (Art. 17 bis).
    const nonExhaustive = reading.interpretation.nonExhaustiveNotice.trim();
    sections.push({
      sectionId: "territorial-readings",
      title: "Lectura integrada del territorio",
      level: 1,
      paragraphs: [
        ...(nonExhaustive.length > 0 ? [nonExhaustive] : []),
        ...reading.territorialReadings.flatMap((b) => {
          const base = `${b.title}. ${b.reading}`;
          return b.reading.includes(b.groupMotorQuestion)
            ? [base]
            : [base, b.groupMotorQuestion];
        }),
      ],
    });
  }

  if (reading.antecedents !== undefined) {
    const a = reading.antecedents;
    sections.push({
      sectionId: "antecedents",
      title: a.title,
      level: 1,
      paragraphs: [
        a.temporalCaution,
        ...a.sources.map(
          (s) => `${s.title} (${s.cycleLabel}). ${[...s.items, ...s.gaps].join(" ")}`
        ),
        ...(a.conciliations ?? []).map(conciliationParagraph),
      ],
    });
  }

  if (reading.diagnosticSynthesis !== null) {
    const synthesis = reading.diagnosticSynthesis;
    sections.push({
      sectionId: "diagnostic-synthesis",
      title: synthesis.title,
      level: 1,
      paragraphs: [
        synthesis.thesis,
        synthesis.interpretiveWeight,
        synthesis.caution,
        ...synthesis.contrastQuestions.map(
          (question) => `Pregunta de contraste: ${question}`
        ),
      ],
    });
  }

  if (reading.tracerTable.length > 0) {
    sections.push({
      sectionId: "tracer-table",
      title: "Indicadores trazadores: valores y referencias",
      level: 1,
      kind: "table",
      table: {
        headers: [
          "Bloque",
          "Indicador",
          "Valor",
          "Ref. Granada",
          "Ref. Andalucía",
          "Escala",
          "Lectura",
        ],
        rows: reading.tracerTable.map((r) => [
          r.bloque,
          r.indicador,
          r.valor,
          r.refGranada,
          r.refAndalucia,
          r.escala,
          r.lectura,
        ]),
      },
      paragraphs: [],
    });
  }

  if (reading.principalSignals.length > 0) {
    sections.push({
      sectionId: "principal-signals",
      title: "Señales principales para deliberación",
      level: 1,
      kind: "compactSignalList",
      signalList: reading.principalSignals.map((s) => ({
        grupo: s.grupo,
        senal: s.senal,
        fuente: s.fuente,
        pregunta: s.pregunta,
      })),
      paragraphs: [],
    });
  }

  if (reading.groupMotorAgenda.length > 0) {
    sections.push({
      sectionId: "group-motor-agenda",
      title: "Qué debe discutir el Grupo Motor",
      level: 1,
      kind: "groupMotorAgenda",
      agenda: reading.groupMotorAgenda.map((c) => ({
        tema: c.tema,
        senal: c.senal,
        mecanismo: c.mecanismo,
        oculto: c.oculto,
        pregunta: c.pregunta,
      })),
      paragraphs: [
        "Cada entrada conecta una señal con su mecanismo social plausible, " +
          "con quién puede quedar fuera de los datos y con la pregunta que el " +
          "Grupo Motor puede responder mejor que ningún dato. Son materiales " +
          "de deliberación, no decisiones.",
      ],
    });
  }

  sections.push({
    sectionId: "generated-closing",
    title: "Cierre de la lectura",
    level: 1,
    paragraphs: reading.closing.flatMap((col) => [col.title, ...col.items]),
  });

  if (reading.humanClosing !== null) {
    sections.push({
      sectionId: "human-closing",
      title: "Cierre interpretativo",
      level: 2,
      paragraphs: parrafos(reading.humanClosing.content),
    });
  }

  const frontera: string[] = [reading.institutionalBoundary.statement];
  if (reading.institutionalBoundary.candidaturas.length > 0) {
    frontera.push(
      `El documento deja preparadas ` +
        `${reading.institutionalBoundary.candidaturas.length} candidatura(s) ` +
        `técnica(s) para la deliberación posterior: ` +
        reading.institutionalBoundary.candidaturas.join("; ") +
        "."
    );
  }
  frontera.push(
    `Consenso del Grupo Motor documentado: ` +
      `${reading.institutionalBoundary.consensoDocumentado ? "sí" : "no disponible"}.`
  );
  sections.push({
    sectionId: "institutional-boundary",
    title: "Frontera institucional",
    level: 2,
    paragraphs: frontera,
  });

  // ── Espacio técnico ───────────────────────────────────────────────────────
  sections.push({
    title: "Anexo técnico",
    level: 1,
    paragraphs: [
      "Expediente técnico del documento institucional: alcance metodológico, " +
        "base documental, cautelas y trazabilidad. Sustenta la lectura " +
        "principal sin interrumpirla.",
    ],
  });

  const base = technicalSpace.documentaryBase;
  const baseParrafos: string[] = [
    `Base de evidencia: ${base.evidenceAtoms} elementos de evidencia y ` +
      `${base.complementaryStudies} estudios complementarios.`,
    base.informeTitle !== null
      ? `Fuente diagnóstica primaria: «${base.informeTitle}»` +
        (base.informeSections !== null ? ` (${base.informeSections} secciones)` : "") +
        ". El Informe de Salud se preserva íntegro y se referencia sin atomizar."
      : "Fuente diagnóstica primaria: no disponible.",
  ];
  if (base.scaleWarnings.length > 0) {
    baseParrafos.push("Advertencia de escala: " + base.scaleWarnings.join(" "));
  }
  sections.push({
    sectionId: "documentary-base",
    title: "Base documental",
    level: 2,
    paragraphs: baseParrafos,
  });

  sections.push({
    sectionId: "methodological-cautions",
    title: "Cautelas metodológicas",
    level: 2,
    paragraphs: technicalSpace.cautions.map((c) => c.text),
  });

  if (technicalSpace.comparativeReferences.length > 0) {
    sections.push({
      sectionId: "comparative-references",
      title: "Referencias comparativas de los indicadores",
      level: 2,
      kind: "table",
      table: {
        headers: ["Indicador", "Valor", "Granada", "Andalucía", "Escala"],
        rows: technicalSpace.comparativeReferences.map((r) => [
          r.indicatorTitle,
          r.value,
          r.provinceReference,
          r.andalusiaReference,
          r.scale,
        ]),
        nota:
          "Procedencia y cautelas completas por indicador en la capa de " +
          "referencias comparativas del expediente.",
      },
      paragraphs: [],
    });
  }

  if (technicalSpace.epistemicMatrix.length > 0) {
    sections.push({
      sectionId: "epistemic-matrix",
      title: "Matriz epistemológica",
      level: 2,
      kind: "table",
      table: {
        headers: ["Señal", "Escala", "Estatus causal", "Pregunta"],
        rows: technicalSpace.epistemicMatrix.map((f) => [
          f.senal,
          f.escala,
          f.estatusCausal,
          f.pregunta,
        ]),
      },
      paragraphs: [...technicalSpace.epistemicMatrixNotes],
    });
  }

  if (technicalSpace.knowledgeState !== null) {
    const ks = technicalSpace.knowledgeState;
    sections.push({
      sectionId: "knowledge-state",
      title: "Estado del conocimiento",
      level: 2,
      paragraphs: [
        `Interpretaciones activas: ${ks.interpretacionesActivas} ` +
          `(${ks.interpretacionesSuperadas} superadas). ` +
          `Hipótesis en estudio: ${ks.hipotesisActivas} ` +
          `(${ks.hipotesisResueltas} resueltas; ${ks.hipotesisDescartadas} descartadas). ` +
          `Preguntas abiertas: ${ks.preguntasAbiertas} ` +
          `(${ks.preguntasResueltas} resueltas).`,
        `Síntesis del equipo técnico: ${
          ks.tieneSintesis ? "incorporada a la lectura" : "no disponible"
        }.`,
      ],
    });
  }

  const t = metadata.traceability;
  sections.push({
    sectionId: "traceability",
    title: "Trazabilidad",
    level: 2,
    paragraphs: [
      `Hash del PSL fuente: ${t.sourceHash}.`,
      `Identificador del artefacto: ${t.artifactId}.`,
      `PSL fuente: ${t.sourcePSLId} (versión ${t.sourcePSLVersion}; ` +
        `evidencia ${t.sourcePSLEvidenceStoreVersion}).`,
      `Elementos de evidencia congelados: ${t.frozenEvidenceAtomCount}.`,
    ],
  });

  return {
    title: metadata.title,
    subtitle: metadata.subtitle,
    portada: metadata.portada,
    sections,
    fileName: metadata.fileName,
  };
}
