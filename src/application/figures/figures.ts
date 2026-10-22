/**
 * Cifras con procedencia (CONTRACT-LHPM v1.7, Art. 8 ter, paso «describir»).
 * Este módulo valida e importa cifras literales y las agrupa para la lectura. No
 * calcula, no redondea y no estima: cada valor es el de la fuente.
 */

import type { FigureRecord, FigureScale } from "../../domain/repository";
import { KNOWN_INFORME_DIMENSIONS } from "../localiza-assets/readingAxes";

export const FIGURE_SCALES: readonly FigureScale[] = ["municipio", "distrito", "provincia", "andalucia", "espana", "otra"];
const FIGURE_SOURCES = ["informe-de-salud", "ieca-badea", "ieca-sima", "ine", "otra"] as const;

const SCALE_LABEL: Record<FigureScale, string> = {
  municipio: "municipio",
  distrito: "distrito",
  provincia: "provincia",
  andalucia: "Andalucía",
  espana: "España",
  otra: "otro ámbito",
};

// Un valor aproximado no es una cifra de la fuente.
const APPROXIMATE = /^\s*(≈|~|aprox|c\.|ca\.|alrededor|unos\b|unas\b|cerca de|en torno)|aproximadamente/i;

export type FigureInput = Omit<FigureRecord, "importedAt">;

/** Problemas que impiden importar la cifra; vacío = admisible. */
export function validateFigure(f: FigureInput): string[] {
  const p: string[] = [];
  const id = f.id?.trim() ?? "";
  const tag = id === "" ? "(sin id)" : id;
  if (id === "") p.push("Falta el identificador de la cifra.");
  if ((f.indicador ?? "").trim() === "") p.push(`${tag}: falta el indicador.`);
  if ((f.valor ?? "").trim() === "") p.push(`${tag}: falta el valor literal.`);
  else if (APPROXIMATE.test(f.valor)) p.push(`${tag}: el valor es aproximado; una cifra consta tal como la da la fuente.`);
  if ((f.anio ?? "").trim() === "") p.push(`${tag}: falta el año («no consta» si la fuente no lo da).`);
  if ((f.territorio ?? "").trim() === "") p.push(`${tag}: falta el territorio.`);
  if (!FIGURE_SCALES.includes(f.escala)) p.push(`${tag}: escala no válida.`);
  if (f.fuente === undefined || (f.fuente.titulo ?? "").trim() === "") p.push(`${tag}: falta la fuente.`);
  else if (!FIGURE_SOURCES.includes(f.fuente.tipo)) p.push(`${tag}: tipo de fuente no válido.`);
  else if (f.fuente.tipo === "informe-de-salud" && (f.fuente.pagina ?? "").trim() === "") {
    p.push(`${tag}: una cifra del Informe lleva su página.`);
  }
  if (f.dimension !== undefined && !KNOWN_INFORME_DIMENSIONS.includes(f.dimension)) {
    p.push(`${tag}: «${f.dimension}» no es una dimensión del Informe que la lectura detecte.`);
  }
  if ((f.importedBy ?? "").trim() === "") p.push(`${tag}: falta la autoría de la importación.`);
  return p;
}

/** Lee un JSON (lista de cifras) y devuelve las cifras y todos los problemas; si hay alguno no se importa nada. */
export function parseFigures(
  json: string,
  importedBy: string
): { figures: FigureInput[]; problems: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { figures: [], problems: ["El texto no es JSON válido."] };
  }
  if (!Array.isArray(raw)) return { figures: [], problems: ["Se espera una lista de cifras."] };
  const figures = raw.map((r) => ({ ...(r as object), importedBy })) as FigureInput[];
  const problems = figures.flatMap(validateFigure);
  const seen = new Set<string>();
  for (const f of figures) {
    if (seen.has(f.id)) problems.push(`${f.id}: identificador repetido en la lista.`);
    seen.add(f.id);
  }
  return { figures: problems.length === 0 ? figures : [], problems };
}

export interface FigureGroup {
  indicador: string;
  /** Texto de lectura: valores con territorio, año y rótulo «referencia no local». */
  texto: string;
  fuentes: string[];
}

const sourceLabel = (f: FigureRecord): string => {
  const parts = [f.fuente.titulo];
  if (f.fuente.consulta !== undefined) parts.push(`consulta ${f.fuente.consulta}`);
  if (f.fuente.pagina !== undefined) parts.push(`pág. ${f.fuente.pagina}`);
  return parts.join(", ");
};

/** Agrupa las cifras que se muestran juntas; conserva el orden de importación. */
export function groupFigures(figures: ReadonlyArray<FigureRecord>): FigureGroup[] {
  const groups = new Map<string, FigureRecord[]>();
  for (const f of figures) {
    const key = f.grupo ?? f.id;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()].map((items) => {
    const value = (f: FigureRecord) => `${f.valor}${f.unidad !== undefined && f.unidad !== "" ? ` ${f.unidad}` : ""}`;
    const who = (f: FigureRecord) =>
      f.escala === "municipio" ? f.territorio : `${f.territorio} (referencia no local, ${SCALE_LABEL[f.escala]})`;
    const texto = items.map((f) => `${who(f)} ${value(f)} (${f.anio})`).join("; ");
    const notas = items.flatMap((f) => (f.nota !== undefined ? [f.nota] : []));
    return {
      indicador: items[0]!.indicador,
      texto: notas.length > 0 ? `${texto}. Nota de la fuente: ${[...new Set(notas)].join(" ")}` : texto,
      fuentes: [...new Set(items.map(sourceLabel))],
    };
  });
}
