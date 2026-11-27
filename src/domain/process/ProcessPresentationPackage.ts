interface PresentationPage {
  title: string;
  source: string;
  introduction?: string;
}

export type ProcessPresentationPage = PresentationPage & (
  | { kind: "notes"; entries: Array<{ heading: string; text: string }> }
  | { kind: "table"; columns: string[]; rows: string[][] }
);

export interface ProcessPresentationPackage {
  schema: "compas-process-presentation/v1";
  municipalityId: string;
  profileTitle: string;
  pages: ProcessPresentationPage[];
}

export interface StoredProcessPresentation extends ProcessPresentationPackage {
  profileId: string;
}

export const MAX_PROCESS_PRESENTATION_BYTES = 64 * 1024;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength && value.trim().length > 0;
}

function isPage(value: unknown): value is ProcessPresentationPage {
  if (!object(value) || !isText(value.title, 85) || !isText(value.source, 180) ||
    (value.introduction !== undefined && !isText(value.introduction, 190))) return false;

  if (value.kind === "notes") {
    return Array.isArray(value.entries) && value.entries.length > 0 && value.entries.length <= 5 &&
      value.entries.every(entry => object(entry) && isText(entry.heading, 46) && isText(entry.text, 175));
  }

  if (value.kind === "table") {
    const columns = value.columns;
    return Array.isArray(columns) && columns.length >= 2 && columns.length <= 4 &&
      columns.every(column => isText(column, 32)) && Array.isArray(value.rows) &&
      value.rows.length > 0 && value.rows.length <= 5 &&
      value.rows.every(row => Array.isArray(row) && row.length === columns.length && row.every(cell => isText(cell, 42)));
  }

  return false;
}

export function isProcessPresentationPackage(value: unknown): value is ProcessPresentationPackage {
  return object(value) && value.schema === "compas-process-presentation/v1" &&
    isText(value.municipalityId, 100) && isText(value.profileTitle, 240) &&
    Array.isArray(value.pages) && value.pages.length > 0 && value.pages.length <= 12 &&
    value.pages.every(isPage);
}

export function isStoredProcessPresentation(value: unknown): value is StoredProcessPresentation {
  return object(value) && isText(value.profileId, 140) && isProcessPresentationPackage(value);
}

export function readProcessPresentationPackage(raw: string): ProcessPresentationPackage {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("El archivo de presentación no contiene JSON válido.");
  }
  if (!isProcessPresentationPackage(value)) {
    throw new Error("El archivo no tiene el formato de presentación de Proceso de COMPÁS.");
  }
  const { schema, municipalityId, profileTitle, pages } = value;
  return {
    schema, municipalityId, profileTitle,
    pages: pages.map(page => {
      const { title, source, introduction } = page;
      const common = { title, source, ...(introduction ? { introduction } : {}) };
      return page.kind === "notes"
        ? { kind: page.kind, ...common, entries: page.entries.map(({ heading, text }) => ({ heading, text })) }
        : { kind: page.kind, ...common, columns: page.columns, rows: page.rows };
    }),
  };
}
