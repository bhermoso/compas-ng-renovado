/**
 * Fecha de un documento del expediente, para ordenar el archivo del más
 * reciente al más antiguo y mostrar su fecha.
 *
 * La fecha declarada (temporal.documentDate) prevalece. Si no la hay, se toma
 * la que figura en el título y se muestra como tal («según el título»): es una
 * lectura del título, no una declaración. La fecha de carga no se usa como
 * fecha del documento.
 */
import type { MunicipalDocument } from "../../domain/repository";
import type { DocumentTemporalMetadata, TemporalPrecision } from "../../domain/repository/documentTemporalMetadata";

export interface DocumentDate {
  /** ISO a la precisión expresada: 2019, 2019-05 o 2019-05-12. */
  value: string;
  precision: Exclude<TemporalPrecision, "unknown">;
  source: "declared" | "title";
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const pad = (n: number) => String(n).padStart(2, "0");

function validDay(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Lee «2019», «2019-05» o «2019-05-12»; devuelve undefined si no es una fecha válida. */
export function parseDeclaredDate(input: string): Omit<DocumentDate, "source"> | undefined {
  const t = input.trim();
  let m = /^(\d{4})$/.exec(t);
  if (m) return { value: m[1], precision: "year" };
  m = /^(\d{4})-(\d{1,2})$/.exec(t);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { value: `${m[1]}-${pad(+m[2])}`, precision: "month" };
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m && validDay(+m[1], +m[2], +m[3])) return { value: `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`, precision: "day" };
  return undefined;
}

/**
 * Fecha que figura en un título: una fecha completa («2017 03 30», «14 12 2010»)
 * o, si no la hay, el año más reciente que no sea posterior al actual.
 */
export function dateFromTitle(title: string, currentYear = new Date().getFullYear()): Omit<DocumentDate, "source"> | undefined {
  const ok = (y: number) => y >= 1950 && y <= currentYear;
  const ymd = /(?<!\d)(\d{4})[ ._/-](\d{1,2})[ ._/-](\d{1,2})(?!\d)/.exec(title);
  if (ymd && ok(+ymd[1]) && validDay(+ymd[1], +ymd[2], +ymd[3])) return { value: `${ymd[1]}-${pad(+ymd[2])}-${pad(+ymd[3])}`, precision: "day" };
  const dmy = /(?<!\d)(\d{1,2})[ ._/-](\d{1,2})[ ._/-](\d{4})(?!\d)/.exec(title);
  if (dmy && ok(+dmy[3]) && validDay(+dmy[3], +dmy[2], +dmy[1])) return { value: `${dmy[3]}-${pad(+dmy[2])}-${pad(+dmy[1])}`, precision: "day" };
  const years = [...title.matchAll(/(?<!\d)(19\d{2}|20\d{2})(?!\d)/g)].map(x => +x[1]).filter(ok);
  return years.length ? { value: String(Math.max(...years)), precision: "year" } : undefined;
}

export function documentDate(document: Pick<MunicipalDocument, "title" | "temporal">): DocumentDate | undefined {
  const declared = document.temporal?.documentDate;
  if (declared?.value && declared.precision !== "unknown") {
    const parsed = parseDeclaredDate(declared.value);
    if (parsed) return { ...parsed, source: "declared" };
  }
  const fromTitle = dateFromTitle(document.title);
  return fromTitle ? { ...fromTitle, source: "title" } : undefined;
}

export function formatDocumentDate(date: Pick<DocumentDate, "value" | "precision">): string {
  const [y, m, d] = date.value.split("-");
  if (date.precision === "year") return y;
  if (date.precision === "month") return `${MONTHS[+m - 1]} ${y}`;
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
}

/** Del más reciente al más antiguo; los documentos sin fecha, al final y por título. */
export function compareDocumentsByDateDesc(
  a: Pick<MunicipalDocument, "title" | "temporal">,
  b: Pick<MunicipalDocument, "title" | "temporal">,
): number {
  const da = documentDate(a)?.value;
  const db = documentDate(b)?.value;
  if (da && db && da !== db) {
    // «2019-05» va antes que «2019»: a igual año, la fecha más precisa no es anterior.
    return db.localeCompare(da);
  }
  if (da && !db) return -1;
  if (!da && db) return 1;
  return a.title.localeCompare(b.title, "es");
}

/** Metadatos temporales con la fecha del documento declarada o retirada. */
export function withDocumentDate(
  temporal: DocumentTemporalMetadata | undefined,
  date: Omit<DocumentDate, "source"> | undefined,
): DocumentTemporalMetadata | undefined {
  const { documentDate: _previous, ...rest } = temporal ?? {};
  void _previous;
  const next: DocumentTemporalMetadata = date ? { ...rest, documentDate: { value: date.value, precision: date.precision } } : rest;
  return Object.keys(next).length ? next : undefined;
}
