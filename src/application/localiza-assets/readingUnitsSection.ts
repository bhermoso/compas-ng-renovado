/**
 * Sección «Lectura por tema» del documento canónico del Perfil.
 *
 * Proyección textual de `deriveReadingUnits`: cada frase enuncia un hecho del
 * expediente (cuántas papeletas, cuántos activos, qué dimensión del Informe) o
 * una laguna. No valora la importancia de un tema ni recomienda actuaciones, y
 * el Informe consta por presencia textual, no como necesidad documentada.
 *
 * La clave es opcional en el documento: si no hay ninguna unidad, no existe, de
 * modo que los documentos y sellos de expedientes sin estas fuentes no cambian.
 */

import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";
import type { CapacityVoiceCrossing, ReadingUnitsDerivation } from "./readingUnits";
import { groupFigures } from "../figures";

export const READING_UNITS_TITLE = "Lectura por tema: capacidad, voz e Informe";

export const READING_UNITS_INTRO =
  "Cada tema figura porque al menos una fuente del expediente lo sostiene. Se cruzan lo que consta en Localiza Salud, " +
  "lo que la ciudadanía señaló en la priorización temática y lo que trata el Informe de Salud. El cruce describe qué " +
  "fuentes hay y cuáles faltan; no valora la importancia de cada tema ni recomienda actuaciones.";

export interface CanonicalReadingUnit {
  topicId: string;
  label: string;
  crossing: CapacityVoiceCrossing;
  /** Qué dice cada fuente sobre el tema, en frases de hecho. */
  lines: string[];
  /** Eje de lectura declarado: quién lo declaró y su definición (Art. 4 ter). */
  axis?: { definition: string; declaredBy: string; declaredOn: string; version: number };
  /** Qué fuentes se cruzan en esta unidad y qué significa el cruce. */
  crossingStatement: string;
}

export interface CanonicalReadingUnits {
  title: string;
  intro: string;
  /** Recuento total de activos de Localiza leídos en el expediente. */
  assetsSummary?: string;
  units: CanonicalReadingUnit[];
  /** Lagunas y exclusiones declaradas. */
  gaps: string[];
}

const MAX_NAMED_ASSETS = 5;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const decimal = (n: number) => String(n).replace(".", ",");
const labelOf = (id: string) => THEMATIC_TOPICS.find((t) => t.id === id)?.label ?? id;

/** Recuento con el estado declarado: «validado» solo si el equipo técnico lo declaró. */
function assetCountLabel(assets: ReadonlyArray<{ estado: string }>): string {
  const validated = assets.filter((a) => a.estado === "validado").length;
  // Un registro de Localiza es un recurso; solo es activo cuando consta su validación (Art. 9 bis).
  if (validated === 0) return plural(assets.length, "recurso", "recursos");
  if (validated === assets.length) {
    return plural(assets.length, "activo validado", "activos validados");
  }
  return `${plural(assets.length, "recurso", "recursos")} (${plural(validated, "activo validado", "activos validados")})`;
}

function crossingStatement(crossing: CapacityVoiceCrossing, voiceSourceAvailable: boolean): string {
  switch (crossing) {
    case "voz-y-activo-registrado":
      return "La ciudadanía lo señaló y Localiza registra recursos con temática correspondiente a este tema.";
    case "voz-sin-activo-registrado":
      return "La ciudadanía lo señaló y Localiza no registra recursos con temática correspondiente a este tema: es una laguna del mapa de Localiza, no la ausencia del recurso.";
    case "eje-con-activo-registrado":
      return "Eje declarado por el equipo técnico: Localiza registra recursos con las temáticas que el equipo conectó con el eje. La priorización ciudadana no recoge este eje.";
    case "eje-sin-activo-registrado":
      return "Eje declarado por el equipo técnico: el Informe trata sus dimensiones y Localiza no registra recursos con las temáticas que el equipo conectó con el eje: es una laguna del mapa de Localiza, no la ausencia del recurso. La priorización ciudadana no recoge este eje.";
    case "activo-registrado-sin-voz":
      return voiceSourceAvailable
        ? "Localiza registra recursos con temática correspondiente y la ciudadanía no marcó este tema en la priorización."
        : "Localiza registra recursos con temática correspondiente; no consta priorización ciudadana temática.";
  }
}

export function buildCanonicalReadingUnits(
  derivation: ReadingUnitsDerivation,
  unstructuredAssets: number,
  validatedAssets = 0
): CanonicalReadingUnits | undefined {
  if (derivation.units.length === 0) return undefined;

  const units: CanonicalReadingUnit[] = derivation.units.map((u) => {
    const lines: string[] = [];
    if (u.axis !== undefined) {
      lines.push(
        `Eje de lectura declarado por ${u.axis.declaredBy} el ${u.axis.declaredOn} (versión ${u.axis.version}): ${u.axis.definition}`
      );
    }
    if (u.voice !== null) {
      lines.push(
        `Priorización ciudadana: ${u.voice.votes} de ${u.voice.completeRecords} papeletas completas ` +
          `(${decimal(u.voice.pct)} %), posición ${u.voice.rank} de ${THEMATIC_TOPICS.length}.`
      );
    }
    const assets = u.capacity.assets;
    if (assets.length > 0) {
      const named = assets.slice(0, MAX_NAMED_ASSETS).map((a) => a.nombre).join("; ");
      const more = assets.length > MAX_NAMED_ASSETS ? ` y ${assets.length - MAX_NAMED_ASSETS} más` : "";
      lines.push(
        `Localiza Salud: ${assetCountLabel(assets)} con temática correspondiente a este tema (${named}${more}).`
      );
    }
    lines.push(
      u.informe !== null
        ? `Informe de Salud: trata el tema por presencia textual (${u.informe.dimensions
            .map((d) => `${d.dimension}: ${plural(d.menciones, "mención", "menciones")}`)
            .join("; ")}); no equivale a necesidad documentada ni a prevalencia.`
        : u.axis !== undefined
          ? "Informe de Salud: ninguna de las dimensiones del eje consta en la lectura del Informe."
          : "Informe de Salud: ninguna dimensión con correspondencia validada a este tema."
    );
    for (const g of groupFigures(u.cifras)) {
      lines.push(`Cifra, ${g.indicador}: ${g.texto.replace(/[.\s]+$/, "")}. Fuente: ${g.fuentes.join("; ")}.`);
    }
    return {
      topicId: u.topicId,
      label: u.label,
      crossing: u.crossing,
      ...(u.axis !== undefined ? { axis: u.axis } : {}),
      lines,
      crossingStatement: crossingStatement(u.crossing, derivation.voiceSourceAvailable),
    };
  });

  const gaps: string[] = [];
  if (derivation.figuresWithoutUnit.length > 0) {
    gaps.push(
      `Cifras importadas que no corresponden a ninguna unidad y no se muestran: ${derivation.figuresWithoutUnit
        .map((g) => `${g.dimension} (${plural(g.n, "cifra", "cifras")})`)
        .join("; ")}. Para mostrarlas, el equipo técnico puede declarar un eje de lectura (Art. 4 ter).`
    );
  }
  if (derivation.axesWithoutSource.length > 0) {
    gaps.push(`Ejes declarados sin ninguna fuente en el expediente, sin unidad propia: ${derivation.axesWithoutSource.join("; ")}.`);
  }
  if (!derivation.voiceSourceAvailable) {
    gaps.push("No consta priorización ciudadana temática en el expediente: el plano de voz es una laguna (Art. 10).");
  }
  if (derivation.topicsOnlyInInforme.length > 0) {
    gaps.push(
      `Temas que solo trata el Informe (presencia textual), sin unidad propia: ${derivation.topicsOnlyInInforme.map(labelOf).join("; ")}.`
    );
  }
  if (derivation.topicsWithoutSource.length > 0) {
    gaps.push(`Temas sin fuente en el expediente: ${derivation.topicsWithoutSource.map(labelOf).join("; ")}.`);
  }
  const sinCorrespondencia = derivation.assetsWithoutValidatedCorrespondence;
  if (sinCorrespondencia.length > 0) {
    gaps.push(
      `${plural(sinCorrespondencia.length, "recurso", "recursos")} de Localiza cuya temática no corresponde a ningún tema de la priorización ` +
        `(${sinCorrespondencia.map((a) => `${a.nombre}: ${a.tematicas.join(", ") || "sin temática"}`).join("; ")}): ` +
        `no cuenta${sinCorrespondencia.length === 1 ? "" : "n"} en ninguna unidad.`
    );
  }
  if (unstructuredAssets > 0) {
    gaps.push(
      `${plural(unstructuredAssets, "recurso", "recursos")} sin la estructura de una fila de Localiza: no se cruza${unstructuredAssets === 1 ? "" : "n"}.`
    );
  }

  const leidos = new Set<string>([
    ...derivation.units.flatMap((u) => u.capacity.assets.map((a) => a.atomId)),
    ...derivation.assetsWithoutValidatedCorrespondence.map((a) => a.atomId),
  ]).size;
  const assetsSummary =
    leidos > 0
      ? `Localiza Salud: ${plural(leidos, "recurso leído", "recursos leídos")} en el expediente` +
        (validatedAssets > 0
          ? `, de los cuales ${validatedAssets} ${validatedAssets === 1 ? "consta declarado" : "constan declarados"} como activo${validatedAssets === 1 ? "" : "s"} validado${validatedAssets === 1 ? "" : "s"} por el equipo técnico con los criterios de registro y validación de activos para la salud en Andalucía. `
          : `; ninguno consta declarado como activo validado. `) +
        `Un recurso cuenta en cada tema que le corresponda según sus temáticas de Localiza, por lo que los recuentos por tema no se suman.`
      : undefined;

  return {
    title: READING_UNITS_TITLE,
    intro: READING_UNITS_INTRO,
    ...(assetsSummary !== undefined ? { assetsSummary } : {}),
    units,
    gaps,
  };
}
