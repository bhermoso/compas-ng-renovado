/**
 * Punto de partida del Perfil (CONTRACT-LHPM v2.0.0, Art. 16 quater, apartado 1).
 *
 * Declara una sola vez de qué se parte: municipio, población con fuente y año,
 * fuentes del expediente con año y escala, estudios y activos incorporados, ejes
 * de lectura declarados y lo que no consta. Es la única declaración de ausencias
 * generales del Perfil. Capa pura: no infiere años, escalas ni cifras del texto
 * de los documentos; lo que no está declarado se dice así.
 */

import type { DocumentKind, MunicipalDocument, ReadingAxisDeclaration } from "../../domain/repository";
import type { BadeaMunicipalContext } from "../badea";

export interface CanonicalStartingPointSource {
  titulo: string;
  tipo: string;
  /** Año de referencia declarado por el equipo técnico, o «año no declarado». */
  anio: string;
  /** Escala territorial declarada, o «escala no declarada». */
  escala: string;
  /** Ciclo declarado: actual, histórico o no declarado. */
  ciclo: string;
}

export interface CanonicalStartingPoint {
  municipio: string;
  /** Recursos de Localiza leídos y, de ellos, activos con validación declarada. */
  recursos: number;
  activosValidados: number;
  /** Población con fuente y año, o la declaración de que no consta. */
  poblacion: string;
  /** Contexto oficial verificado del ámbito (BADEA/IECA), con fuente y año. */
  contexto: string[];
  fuentes: CanonicalStartingPointSource[];
  /** Estudios, activos y priorización incorporados. */
  incorporado: string[];
  ejes: string[];
  noConsta: string[];
}

export interface BuildStartingPointInput {
  municipalityName: string;
  province: string;
  ineCode?: string;
  documents: ReadonlyArray<MunicipalDocument>;
  badea?: BadeaMunicipalContext;
  /** Referencia poblacional verificada del registro (todas las edades). */
  population?: { total: number; source: string; year: number };
  /** Instrumentos estructurados incorporados (IBSE, Duke, …). */
  structuredStudies: string[];
  assetsTotal: number;
  assetsValidated: number;
  hasThematicPrioritisation: boolean;
  axes: ReadonlyArray<ReadingAxisDeclaration>;
}

const KIND: Record<DocumentKind, string> = {
  "health-report": "Informe de Salud",
  "localiza-salud": "Localiza Salud",
  "strategic-framework": "Marco estratégico y normativo",
  "complementary-study": "Estudio complementario",
  "eas-variable": "Variable EAS",
  "cmi-indicator": "Indicador CMI",
  "community-asset": "Activo comunitario",
  "redcap-export": "Exportación REDCap",
  "territorial-documentation": "Documentación territorial",
  "qualitative-material": "Material cualitativo",
  "longitudinal-evidence": "Evidencia longitudinal",
  other: "Otro documento",
};

const SCALE: Record<string, string> = {
  "unidad-gestion-clinica": "unidad de gestión clínica",
  distrito: "distrito",
  municipio: "municipio",
};

const KIND_ORDER: DocumentKind[] = [
  "health-report",
  "complementary-study",
  "localiza-salud",
  "community-asset",
  "qualitative-material",
  "territorial-documentation",
  "strategic-framework",
  "cmi-indicator",
  "eas-variable",
  "redcap-export",
  "longitudinal-evidence",
  "other",
];

function formatValue(v: number | string, unidad?: string): string {
  if (typeof v === "string") return v;
  const n = v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return unidad !== undefined ? `${n} ${unidad}` : n;
}

export function buildStartingPoint(input: BuildStartingPointInput): CanonicalStartingPoint {
  const municipio =
    `${input.municipalityName} (${input.province}` +
    (input.ineCode !== undefined && input.ineCode !== "" ? `; código INE ${input.ineCode})` : ")");

  const vigentes = input.documents.filter((d) => d.status !== "archived" && d.status !== "rejected");
  const fuentes = [...vigentes]
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.title.localeCompare(b.title, "es"))
    .map((d) => ({
      titulo: d.title,
      tipo: KIND[d.kind],
      anio: d.cycle?.referenceYear !== undefined ? String(d.cycle.referenceYear) : "año no declarado",
      escala:
        d.territorialScale !== undefined && SCALE[d.territorialScale] !== undefined
          ? SCALE[d.territorialScale]!
          : "escala no declarada",
      ciclo:
        d.cycle?.status === "current" ? "ciclo actual" : d.cycle?.status === "historical" ? "ciclo histórico" : "ciclo no declarado",
    }));

  const b = input.badea;
  const contexto =
    b === undefined || b.indicadores.length === 0
      ? []
      : [
          `Contexto oficial (${b.indicadores[0]!.fuente}, consulta ${b.indicadores[0]!.consulta}, ${b.anio}` +
            (b.esProxyMunicipioMatriz ? `; referencia de ${b.territorio}, no del ámbito` : "") +
            "): " +
            b.indicadores.map((i) => `${i.indicador.charAt(0).toLowerCase()}${i.indicador.slice(1)}, ${formatValue(i.valor, i.unidad)}`).join("; ") +
            ".",
        ];

  const incorporado: string[] = [];
  incorporado.push(
    input.structuredStudies.length > 0
      ? `Estudios complementarios estructurados: ${input.structuredStudies.join(", ")}.`
      : "Estudios complementarios estructurados: ninguno."
  );
  const textuales = vigentes.filter(
    (d) => d.kind === "complementary-study" && d.contentMode === "full-text-non-atomized"
  ).length;
  if (textuales > 0) {
    incorporado.push(
      `Documentos de estudio en texto: ${textuales}. Están en el expediente, pero no aportan indicadores estructurados a la lectura.`
    );
  }
  incorporado.push(
    input.assetsTotal > 0
      ? `Recursos de Localiza Salud: ${input.assetsTotal}, de los que ${input.assetsValidated} ${input.assetsValidated === 1 ? "consta como activo validado" : "constan como activos validados"}.`
      : "Recursos de Localiza Salud: ninguno."
  );
  incorporado.push(
    input.hasThematicPrioritisation
      ? "Priorización ciudadana temática: incorporada."
      : "Priorización ciudadana temática: no incorporada."
  );

  const ejes = input.axes.map((a) => `${a.label} (declarado por ${a.declaredBy})`);

  const noConsta: string[] = [];
  if (!input.documents.some((d) => d.kind === "health-report" && d.status !== "archived")) {
    noConsta.push("Informe de Salud vigente.");
  }
  if (input.structuredStudies.length === 0) noConsta.push("Estudios complementarios con indicadores estructurados.");
  if (!input.hasThematicPrioritisation) noConsta.push("Priorización ciudadana temática.");
  if (input.assetsTotal > 0 && input.assetsValidated === 0) {
    noConsta.push("Activos validados entre los recursos de Localiza Salud.");
  }
  if (input.axes.length === 0) noConsta.push("Ejes de lectura declarados por el equipo técnico.");
  const sinAnio = fuentes.filter((f) => f.anio === "año no declarado").length;
  if (sinAnio > 0) noConsta.push(`Año de referencia de ${sinAnio} de las ${fuentes.length} fuentes.`);
  noConsta.push("Desagregación interna por sexo, edad, renta o zona.");

  return {
    municipio,
    recursos: input.assetsTotal,
    activosValidados: input.assetsValidated,
    poblacion:
      input.population !== undefined
        ? `${input.population.total.toLocaleString("es-ES")} habitantes (${input.population.source}).`
        : "no consta una referencia poblacional verificada con fuente y año.",
    contexto,
    fuentes,
    incorporado,
    ejes,
    noConsta,
  };
}

function sourceLine(f: CanonicalStartingPointSource): string {
  const declarado: string[] = [];
  const falta: string[] = [];
  if (f.anio === "año no declarado") falta.push("año");
  else declarado.push(f.anio);
  if (f.escala === "escala no declarada") falta.push("escala");
  else declarado.push(`escala ${f.escala}`);
  if (f.ciclo === "ciclo no declarado") falta.push("ciclo");
  else declarado.push(f.ciclo);
  const sinDeclarar =
    falta.length === 0 ? "" : `${falta.length === 1 ? falta[0] : falta.slice(0, -1).join(", ") + " y " + falta[falta.length - 1]} sin declarar`;
  return `${f.titulo} (${f.tipo}): ${[...declarado, ...(sinDeclarar !== "" ? [sinDeclarar] : [])].join("; ")}.`;
}

/** Líneas de texto del apartado, idénticas en pantalla y documento (Art. 17 bis). */
export function startingPointParagraphs(sp: CanonicalStartingPoint): string[] {
  return [
    `Ámbito: ${sp.municipio}.`,
    `Población: ${sp.poblacion}`,
    ...sp.contexto,
    `Fuentes del expediente (${sp.fuentes.length}):`,
    ...sp.fuentes.map(sourceLine),
    ...sp.incorporado,
    sp.ejes.length > 0 ? `Ejes de lectura declarados: ${sp.ejes.join("; ")}.` : "Ejes de lectura declarados: ninguno.",
    `No consta: ${sp.noConsta.join(" ")}`,
  ];
}
