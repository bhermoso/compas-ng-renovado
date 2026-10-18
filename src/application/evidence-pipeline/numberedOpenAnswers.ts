/**
 * Respuestas abiertas numeradas de un cuestionario.
 *
 * Reconoce una estructura, no un contenido: una pregunta (línea con «¿…?» o un
 * epígrafe numerado tipo «3.1 …») seguida de respuestas numeradas 1, 2, 3… Cada
 * respuesta completa es una unidad. No clasifica por temas ni por palabras
 * clave. Si el texto no tiene esa estructura, devuelve `null` y no se usa.
 */

export interface OpenAnswer {
  /** Número de la respuesta dentro de su pregunta, tal como figura en el documento. */
  number: number;
  /** Texto literal de la respuesta, con las líneas de continuación unidas. */
  text: string;
  /** Página donde empieza la respuesta, si el texto trae marcas «[Página N]». */
  page?: number;
}

export interface OpenAnswerGroup {
  /** Línea de pregunta o epígrafe que precede a la serie de respuestas. */
  question: string;
  answers: OpenAnswer[];
}

export interface NumberedOpenAnswers {
  groups: OpenAnswerGroup[];
  totalAnswers: number;
}

/** Mínimo de respuestas consecutivas para considerar que hay una serie. */
export const MIN_ANSWERS_PER_RUN = 5;

const PAGE_MARK = /^\[Página (\d+)\]\s*$/;
const ANSWER_LINE = /^(\d{1,3})\.\s+(\S.*)$/;
const HEADING_LINE = /^\d+\.\d+\s+\S/;

function isQuestionLine(line: string): boolean {
  return (line.includes("¿") && line.includes("?")) || HEADING_LINE.test(line);
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function extractNumberedOpenAnswers(plainText: string): NumberedOpenAnswers | null {
  const lines = plainText.split(/\r?\n/).map((l) => l.trim());
  const groups: OpenAnswerGroup[] = [];

  let page: number | undefined;
  let lastQuestion: string | null = null;
  let current: OpenAnswerGroup | null = null;
  let open: OpenAnswer | null = null;

  const closeRun = (): void => {
    if (current !== null && current.answers.length >= MIN_ANSWERS_PER_RUN) groups.push(current);
    current = null;
    open = null;
  };

  for (const line of lines) {
    if (line === "") continue;
    const mark = PAGE_MARK.exec(line);
    if (mark !== null) {
      page = Number(mark[1]);
      continue;
    }
    if (isQuestionLine(line)) {
      closeRun();
      lastQuestion = line;
      continue;
    }
    const m = ANSWER_LINE.exec(line);
    if (m !== null) {
      const n = Number(m[1]);
      if (current === null && n === 1 && lastQuestion !== null) {
        current = { question: clip(lastQuestion, 240), answers: [] };
      }
      if (current !== null) {
        const expected: number = current.answers.length + 1;
        if (n === expected) {
          open = { number: n, text: m[2], ...(page !== undefined ? { page } : {}) };
          current.answers.push(open);
          continue;
        }
        if (n === 1) {
          // Nueva serie bajo la misma pregunta anterior: se cierra la actual.
          closeRun();
          current = { question: clip(lastQuestion ?? "", 240), answers: [] };
          open = { number: 1, text: m[2], ...(page !== undefined ? { page } : {}) };
          current.answers.push(open);
          continue;
        }
      }
    }
    // Línea de continuación de la respuesta abierta.
    if (open !== null) open.text = `${open.text} ${line}`;
  }
  closeRun();

  const totalAnswers = groups.reduce((acc, g) => acc + g.answers.length, 0);
  return groups.length > 0 ? { groups, totalAnswers } : null;
}
