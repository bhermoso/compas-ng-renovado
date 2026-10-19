/**
 * Antecedentes de ciclos anteriores.
 *
 * Las fuentes cuyo ciclo el equipo técnico ha declarado «histórico» no entran en
 * la lectura actual del Perfil: se presentan aparte, con su ciclo y la cautela de
 * brecha temporal. Este módulo no compara con el presente ni infiere el ciclo de
 * una fuente a partir de su texto.
 */

import type { EvidenceAtom } from "../../domain/evidence";
import {
  describeDocumentCycle,
  type ConciliationRelation,
  type CycleConciliation,
  type MunicipalDocument,
} from "../../domain/repository";
import type { MunicipalityWorkspace } from "../../domain/workspace";

export interface AntecedentSource {
  documentId: string;
  title: string;
  /** Ciclo declarado, p. ej. «Ciclo histórico · 2022». */
  cycleLabel: string;
  referenceYear: number | null;
  /** Lo que el expediente conserva de la fuente, descrito sin interpretarlo. */
  items: string[];
  /** Lo que la fuente no permite afirmar. */
  gaps: string[];
}

/** Conciliación declarada por el equipo técnico, ya resuelta a texto. */
export interface AntecedentConciliation {
  id: string;
  topic: string;
  relationLabel: string;
  historical: { sourceTitle: string; cycleLabel: string; statement: string };
  current: { sourceTitle: string; cycleLabel: string; statement: string };
  note?: string;
}

export interface CanonicalAntecedents {
  kind: "antecedents";
  title: string;
  temporalCaution: string;
  sources: AntecedentSource[];
  /** Ausente mientras el equipo técnico no declare conciliaciones válidas. */
  conciliations?: AntecedentConciliation[];
}

const RELATION_LABEL: Record<ConciliationRelation, string> = {
  convergence: "Convergencia declarada por el equipo técnico",
  divergence: "Divergencia declarada por el equipo técnico, sin resolver",
  "not-comparable": "Declarada no comparable por el equipo técnico",
};

/** Texto único de una conciliación: pantalla, DOCX y PDF lo comparten. */
export function conciliationParagraph(c: AntecedentConciliation): string {
  return (
    `${c.topic}. ${c.relationLabel}. ` +
    `${c.historical.sourceTitle} (${c.historical.cycleLabel}): ${c.historical.statement} ` +
    `${c.current.sourceTitle} (${c.current.cycleLabel}): ${c.current.statement}` +
    (c.note !== undefined && c.note.trim().length > 0 ? ` Nota del equipo técnico: ${c.note.trim()}` : "")
  );
}

function resolveConciliations(
  documents: readonly MunicipalDocument[],
  conciliations: readonly CycleConciliation[]
): { valid: AntecedentConciliation[]; omitted: number } {
  const byId = new Map(documents.map((d) => [d.id, d] as const));
  const valid: AntecedentConciliation[] = [];
  let omitted = 0;
  for (const c of conciliations) {
    const h = byId.get(c.historical.documentId);
    const a = byId.get(c.current.documentId);
    if (
      h === undefined ||
      a === undefined ||
      h.cycle?.status !== "historical" ||
      a.cycle?.status !== "current" ||
      c.topic.trim() === "" ||
      c.historical.statement.trim() === "" ||
      c.current.statement.trim() === ""
    ) {
      omitted += 1;
      continue;
    }
    valid.push({
      id: c.id,
      topic: c.topic.trim(),
      relationLabel: RELATION_LABEL[c.relation],
      historical: {
        sourceTitle: h.title,
        cycleLabel: describeDocumentCycle(h.cycle),
        statement: c.historical.statement.trim(),
      },
      current: {
        sourceTitle: a.title,
        cycleLabel: describeDocumentCycle(a.cycle),
        statement: c.current.statement.trim(),
      },
      ...(c.note !== undefined && c.note.trim() !== "" ? { note: c.note.trim() } : {}),
    });
  }
  return { valid, omitted };
}

export const ANTECEDENTS_TITLE = "Antecedentes de ciclos anteriores";

export function isHistoricalDocument(document: MunicipalDocument): boolean {
  return document.cycle?.status === "historical";
}

/**
 * Copia del expediente sin las fuentes históricas ni los átomos que derivan de
 * ellas. Si no hay ninguna, devuelve el mismo objeto: el comportamiento sin ciclo
 * declarado no cambia.
 */
export function excludeHistoricalSources(
  workspace: MunicipalityWorkspace
): MunicipalityWorkspace {
  const historicalIds = new Set(
    workspace.repository.documents.filter(isHistoricalDocument).map((d) => d.id)
  );
  if (historicalIds.size === 0) return workspace;
  return {
    ...workspace,
    repository: {
      ...workspace.repository,
      documents: workspace.repository.documents.filter((d) => !historicalIds.has(d.id)),
    },
    evidenceStore: {
      ...workspace.evidenceStore,
      atoms: workspace.evidenceStore.atoms.filter(
        (a) => a.provenance.documentId === undefined || !historicalIds.has(a.provenance.documentId)
      ),
    },
  };
}

function pageRange(atoms: EvidenceAtom[]): string {
  const pages = atoms
    .map((a) => a.provenance.page)
    .filter((p): p is number => p !== undefined);
  if (pages.length === 0) return "";
  const min = Math.min(...pages);
  const max = Math.max(...pages);
  return min === max ? ` (pág. ${min})` : ` (págs. ${min}–${max})`;
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function describeSource(document: MunicipalDocument, atoms: EvidenceAtom[]): AntecedentSource {
  const items: string[] = [];
  const gaps: string[] = [];

  const openAnswers = atoms.filter((a) => a.tags.includes("open-answer"));
  const others = atoms.filter(
    (a) => !a.tags.includes("open-answer") && a.kind !== "methodological-caution"
  );

  if (openAnswers.length > 0) {
    const byQuestion = new Map<string, EvidenceAtom[]>();
    for (const atom of openAnswers) {
      const question = atom.provenance.field ?? "pregunta sin identificar";
      byQuestion.set(question, [...(byQuestion.get(question) ?? []), atom]);
    }
    for (const [question, group] of byQuestion) {
      items.push(
        `«${clip(question, 140)}»: ${group.length} ${group.length === 1 ? "respuesta abierta" : "respuestas abiertas"}${pageRange(group)}.`
      );
    }
    gaps.push(
      "El texto conservado no incluye la muestra; no puede declararse la representatividad de las respuestas."
    );
  }

  if (others.length > 0) {
    items.push(
      `${others.length} ${others.length === 1 ? "unidad de texto extraída" : "unidades de texto extraídas"} por línea. Su tipo lo asignó una regla automática y no está validado.`
    );
  }

  if (items.length === 0) {
    items.push(
      (document.sourceText ?? "").trim().length > 0
        ? "Texto conservado en el documento, sin unidades de evidencia extraídas."
        : "Registrado como referencia; el expediente no conserva su texto."
    );
  }

  return {
    documentId: document.id,
    title: document.title,
    cycleLabel: describeDocumentCycle(document.cycle),
    referenceYear: document.cycle?.referenceYear ?? null,
    items,
    gaps,
  };
}

function yearsLabel(documents: MunicipalDocument[]): string {
  const years = [
    ...new Set(
      documents
        .map((d) => d.cycle?.referenceYear)
        .filter((y): y is number => y !== undefined)
    ),
  ].sort((a, b) => a - b);
  const undeclared = documents.some((d) => d.cycle?.referenceYear === undefined);
  const parts = years.map(String);
  if (undeclared) parts.push("año no declarado");
  return parts.join(", ");
}

export function buildAntecedents(
  documents: readonly MunicipalDocument[],
  atoms: readonly EvidenceAtom[],
  declaredConciliations: readonly CycleConciliation[] = []
): CanonicalAntecedents | undefined {
  const historical = documents.filter(isHistoricalDocument);
  if (historical.length === 0) return undefined;

  const current = documents.filter((d) => d.cycle?.status === "current");
  const currentClause =
    current.length > 0
      ? `El diagnóstico actual se apoya en ${current.map((d) => `${d.title}${d.cycle?.referenceYear !== undefined ? ` (${d.cycle.referenceYear})` : ""}`).join("; ")}.`
      : "No hay ninguna fuente de ciclo actual declarada en el expediente.";

  const sources = [...historical]
    .sort(
      (a, b) =>
        (a.cycle?.referenceYear ?? 0) - (b.cycle?.referenceYear ?? 0) ||
        a.title.localeCompare(b.title, "es")
    )
    .map((doc) =>
      describeSource(
        doc,
        atoms.filter((a) => a.provenance.documentId === doc.id)
      )
    );

  const { valid, omitted } = resolveConciliations(documents, declaredConciliations);
  const comparisonClause =
    valid.length > 0
      ? "Las comparaciones con el ciclo actual que figuran abajo las declaró el equipo técnico; el Perfil no las genera."
      : "Este apartado no compara con el ciclo actual.";
  const omittedClause =
    omitted > 0
      ? ` ${omitted} ${omitted === 1 ? "conciliación declarada no se muestra" : "conciliaciones declaradas no se muestran"} porque el ciclo de alguna de sus fuentes ya no coincide con el declarado al registrarla.`
      : "";

  return {
    kind: "antecedents",
    title: ANTECEDENTS_TITLE,
    temporalCaution:
      `Las fuentes de este apartado pertenecen a un ciclo anterior (${yearsLabel(historical)}). ` +
      `${currentClause} Lo que recogen no describe la situación presente. ${comparisonClause}${omittedClause}`,
    sources,
    ...(valid.length > 0 ? { conciliations: valid } : {}),
  };
}
