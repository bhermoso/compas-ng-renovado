/**
 * pslcPdf
 *
 * Serialización PDF del modelo documental institucional del PSL-C.
 * La estructura y el contenido proceden ÍNTEGRAMENTE de
 * buildPSLCDocumentModel (la misma capa pura que alimenta el DOCX):
 * aquí solo se maqueta con paginación básica y numeración de páginas.
 *
 * PDF institucional sobrio: A4, tipografía estándar, portada + secciones.
 * No usa el DOM como fuente; no exporta nada que no esté en el modelo.
 */

import { jsPDF } from "jspdf";
import type { LocalHealthProfileArtifact } from "../../domain/health-profile-artifact";
import type {
  PSLCDocumentModel,
  PSLCDocumentSection,
  PSLCRankingItem,
  PSLCTableData,
} from "./pslcDocumentModel";
import { buildPSLCDocumentModel, pslcDocxFileName } from "./pslcDocumentModel";

// ── Nombre de archivo estable ─────────────────────────────────────────────────

export function pslcPdfFileName(artifact: LocalHealthProfileArtifact): string {
  return pslcDocxFileName(artifact).replace(/\.docx$/, ".pdf");
}

// ── Maquetación ───────────────────────────────────────────────────────────────

const PAGE = { width: 210, height: 297 };       // A4 en mm
const MARGIN = { top: 22, bottom: 20, left: 22, right: 22 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const FOOTER_Y = PAGE.height - 10;

// Las fuentes estándar del PDF usan WinAnsi (CP1252): los caracteres del
// español y «» — · caben; se sustituyen los símbolos matemáticos frecuentes
// de las cautelas metodológicas que quedan fuera.
function toWinAnsi(text: string): string {
  return text
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≈/g, "~")
    .replace(/\u00a0/g, " ");
}

interface Cursor {
  y: number;
}

function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > PAGE.height - MARGIN.bottom) {
    doc.addPage();
    cursor.y = MARGIN.top;
  }
}

function addText(
  doc: jsPDF,
  cursor: Cursor,
  text: string,
  opts: {
    size: number;
    bold?: boolean;
    italic?: boolean;
    align?: "left" | "center";
    spacingAfter?: number;
  }
): void {
  const style = opts.bold ? "bold" : opts.italic ? "italic" : "normal";
  doc.setFont("helvetica", style);
  doc.setFontSize(opts.size);
  const lineHeight = opts.size * 0.47; // mm por línea, aproximación sobria
  const lines: string[] = doc.splitTextToSize(toWinAnsi(text), CONTENT_WIDTH);
  const x = opts.align === "center" ? PAGE.width / 2 : MARGIN.left;
  // A paragraph can exceed one page (documentary passages and traceability).
  // Paginate its lines instead of moving an oversized block onto a fresh page.
  for (const line of lines) {
    ensureSpace(doc, cursor, lineHeight);
    doc.text(line, x, cursor.y, {
      align: opts.align ?? "left",
      baseline: "top",
    });
    cursor.y += lineHeight;
  }
  cursor.y += opts.spacingAfter ?? 2;
}

// ── Secciones estructuradas (contrato visual) ─────────────────────────────────

// Ranking del Informe: la visualización compacta obligada del PDF.
// Barras horizontales reales (rectángulos rellenos) proporcionales al peso
// textual; nunca porcentajes ni prevalencia.
function addRanking(
  doc: jsPDF,
  cursor: Cursor,
  items: PSLCRankingItem[]
): void {
  const labelWidth = 62;
  const barMax = CONTENT_WIDTH - labelWidth - 16;
  const rowH = 6;
  for (const item of items) {
    ensureSpace(doc, cursor, rowH + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const label = doc.splitTextToSize(toWinAnsi(item.etiqueta), labelWidth - 2);
    doc.text(label[0] ?? "", MARGIN.left, cursor.y + 3.4);
    const barW = Math.max(1.5, (item.valor / Math.max(1, item.max)) * barMax);
    doc.setFillColor(90, 105, 120);
    doc.rect(MARGIN.left + labelWidth, cursor.y + 0.6, barW, 3.6, "F");
    doc.text(
      String(item.valor),
      MARGIN.left + labelWidth + barW + 2,
      cursor.y + 3.4
    );
    cursor.y += rowH;
  }
  cursor.y += 2;
}

// Tabla sobria con anchos ponderados por contenido y salto de página por fila.
function addTable(doc: jsPDF, cursor: Cursor, table: PSLCTableData): void {
  const fontSize = 7;
  const lineH = 2.9;
  const padding = 1.2;
  const cols = table.headers.length;
  const pesos = table.headers.map((h, c) => {
    let max = h.length;
    for (const row of table.rows) {
      max = Math.max(max, Math.min((row[c] ?? "").length, 60));
    }
    return Math.max(8, max);
  });
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const widths = pesos.map((p) =>
    Math.max(14, (p / sumaPesos) * CONTENT_WIDTH)
  );
  const factor = CONTENT_WIDTH / widths.reduce((a, b) => a + b, 0);
  for (let c = 0; c < cols; c++) widths[c] *= factor;

  const rowHeight = (cells: string[]): number =>
    Math.max(0, ...cells.map((cell, c) =>
      doc.splitTextToSize(toWinAnsi(cell ?? ""), widths[c] - padding * 2).length
    )) * lineH + padding * 2;
  const drawRow = (cells: string[], bold: boolean): void => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const wrapped = cells.map((cell, c) =>
      doc.splitTextToSize(toWinAnsi(cell ?? ""), widths[c] - padding * 2)
    );
    const rowH =
      Math.max(...wrapped.map((w) => w.length)) * lineH + padding * 2;
    if (!bold && cursor.y + rowH + 1 > PAGE.height - MARGIN.bottom) {
      doc.addPage();
      cursor.y = MARGIN.top;
      drawRow(table.headers, true);
      doc.setFont("helvetica", "normal");
    }
    ensureSpace(doc, cursor, rowH + 1);
    let x = MARGIN.left;
    for (let c = 0; c < cols; c++) {
      doc.text(wrapped[c], x + padding, cursor.y + padding, {
        baseline: "top",
      });
      x += widths[c];
    }
    cursor.y += rowH;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.15);
    doc.line(MARGIN.left, cursor.y, MARGIN.left + CONTENT_WIDTH, cursor.y);
    cursor.y += 0.8;
  };

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  ensureSpace(doc, cursor, rowHeight(table.headers) + rowHeight(table.rows[0] ?? []) + 3);
  drawRow(table.headers, true);
  for (const row of table.rows) drawRow(row, false);
  if (table.nota !== undefined) {
    addText(doc, cursor, table.nota, { size: 7.5, italic: true, spacingAfter: 3 });
  }
  cursor.y += 2;
}

function addStructuredSection(
  doc: jsPDF,
  cursor: Cursor,
  section: PSLCDocumentSection
): void {
  switch (section.kind ?? "text") {
    case "summaryCards": {
      for (const card of section.cards ?? []) {
        addText(doc, cursor, card.texto, {
          size: card.destacado ? 10.5 : 9,
          bold: card.destacado,
          spacingAfter: 2.5,
        });
      }
      break;
    }
    case "table": {
      if (section.table !== undefined) addTable(doc, cursor, section.table);
      break;
    }
    case "barRanking": {
      addRanking(doc, cursor, section.ranking ?? []);
      break;
    }
    case "compactSignalList": {
      for (const item of section.signalList ?? []) {
        addText(doc, cursor, item.grupo, {
          size: 9,
          bold: true,
          spacingAfter: 0.5,
        });
        addText(doc, cursor, `${item.senal} (${item.fuente})`, {
          size: 9,
          spacingAfter: 0.5,
        });
        addText(doc, cursor, item.pregunta, {
          size: 9,
          italic: true,
          spacingAfter: 2.5,
        });
      }
      break;
    }
    case "groupMotorAgenda": {
      for (const entrada of section.agenda ?? []) {
        addText(doc, cursor, entrada.tema, {
          size: 10,
          bold: true,
          spacingAfter: 1,
        });
        addText(doc, cursor, `Señal: ${entrada.senal}`, {
          size: 9,
          spacingAfter: 0.5,
        });
        addText(doc, cursor, `Mecanismo plausible: ${entrada.mecanismo}`, {
          size: 9,
          spacingAfter: 0.5,
        });
        addText(doc, cursor, `Quién puede quedar fuera: ${entrada.oculto}`, {
          size: 9,
          spacingAfter: 0.5,
        });
        addText(doc, cursor, entrada.pregunta, {
          size: 9,
          italic: true,
          spacingAfter: 3,
        });
      }
      break;
    }
    default:
      break;
  }
}

export function buildPSLCPdf(model: PSLCDocumentModel): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor: Cursor = { y: MARGIN.top + 30 };

  // ── Portada institucional ─────────────────────────────────────────────────
  addText(doc, cursor, model.title, {
    size: 18,
    bold: true,
    align: "center",
    spacingAfter: 4,
  });
  addText(doc, cursor, model.subtitle, {
    size: 12,
    italic: true,
    align: "center",
    spacingAfter: 10,
  });
  for (const p of model.portada) {
    addText(doc, cursor, p, { size: 9, align: "center", spacingAfter: 3 });
  }

  // ── Secciones: capítulos I–VI y bloques institucionales ──────────────────
  doc.addPage();
  cursor.y = MARGIN.top;
  for (const section of model.sections) {
    ensureSpace(doc, cursor, section.table ? 60 : 18);
    cursor.y += 4;
    addText(doc, cursor, section.title, {
      size: section.level === 1 ? 13 : 11,
      bold: true,
      spacingAfter: 3,
    });
    addStructuredSection(doc, cursor, section);
    for (const p of section.paragraphs) {
      addText(doc, cursor, p, { size: 10, spacingAfter: 2.5 });
    }
  }

  // ── Numeración de páginas ─────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${page} / ${total}`, PAGE.width / 2, FOOTER_Y, {
      align: "center",
    });
  }

  return doc;
}

// ── API de exportación ────────────────────────────────────────────────────────

/** Serializa el artefacto congelado a un Blob PDF (navegador). */
export async function exportPSLCArtifactToPdfBlob(
  artifact: LocalHealthProfileArtifact
): Promise<{ blob: Blob; fileName: string }> {
  const model = buildPSLCDocumentModel(artifact);
  const doc = buildPSLCPdf(model);
  const blob = doc.output("blob");
  return { blob, fileName: pslcPdfFileName(artifact) };
}

/** Serializa el artefacto congelado a Uint8Array (Node: tests, scripts). */
export async function exportPSLCArtifactToPdfBuffer(
  artifact: LocalHealthProfileArtifact
): Promise<Uint8Array> {
  const model = buildPSLCDocumentModel(artifact);
  const doc = buildPSLCPdf(model);
  return new Uint8Array(doc.output("arraybuffer"));
}
