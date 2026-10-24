/**
 * Cuerpo del Perfil (CONTRACT-LHPM v2.1.0, Art. 16 quater): apartados 3, 6 y 7
 * y los textos de apartado vacío. Funciones puras que generan las mismas líneas
 * para la pantalla y para el documento exportado (Art. 17 bis).
 */

import type { CanonicalReadingUnits } from "../localiza-assets";
import type { CanonicalChosenClosing } from "../proposals/chosenClosing";
import { splitChosenConclusions, visibleLabel } from "../proposals/chosenClosing";
import type { CanonicalAuthoredClosing, CanonicalInstitutionalBoundary } from "./canonicalProfileDocument";

export const BODY_TITLES = {
  startingPoint: "1. Punto de partida",
  conclusions: "2. Conclusiones",
  convergences: "3. Convergencias y divergencias",
  unknowns: "4. Lo que no sabemos",
  recommendations: "5. Recomendaciones del Perfil",
  handover: "6. Paso al Plan de Acción",
  authorship: "7. Autoría y validación",
  annex: "Anexo compilado",
} as const;

export const ANNEX_INTRO =
  "Lo genera el sistema a partir del expediente y no admite edición manual. Recoge la evidencia " +
  "por fuente, por tema y por cifra, la lectura integrada y las cautelas: es el único lugar del " +
  "documento donde figura la evidencia completa, y sostiene el cuerpo sin formar parte de él.";

export const EMPTY_CONCLUSIONS =
  "El equipo técnico no ha elegido todavía ninguna conclusión. Las propuestas están en el modo de revisión.";
export const EMPTY_UNKNOWNS =
  "El equipo técnico no ha elegido todavía ninguna laguna. Las ausencias generales constan en el punto de partida.";
export const EMPTY_RECOMMENDATIONS =
  "El equipo técnico no ha elegido todavía ninguna recomendación.";

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/**
 * Convergencias y divergencias (Art. 14) a partir de los planos de cada tema:
 * voz ciudadana, recursos de Localiza e Informe. Coincidir en un tema es
 * presencia compartida, no magnitud ni relación entre fuentes.
 */
export function convergenceLines(units: CanonicalReadingUnits | undefined): string[] {
  if (units === undefined) return [];
  const withPlanes = units.units.filter((u) => u.planes !== undefined);
  const voiceAvailable = withPlanes.some((u) => u.planes!.voz);
  const convergen: string[] = [];
  const divergen: string[] = [];
  for (const u of withPlanes) {
    const p = u.planes!;
    const fuentes = [
      p.voz ? "la priorización ciudadana" : null,
      p.informe ? "el Informe de Salud" : null,
      p.recursos > 0 ? `Localiza Salud (${plural(p.recursos, "recurso", "recursos")})` : null,
    ].filter((x): x is string => x !== null);
    if (fuentes.length >= 2) {
      convergen.push(`${u.label}: coinciden ${fuentes.slice(0, -1).join(", ")} y ${fuentes[fuentes.length - 1]}.`);
    }
    if (p.voz && !p.informe) {
      divergen.push(`${u.label}: la ciudadanía lo señala y el Informe no lo trata.`);
    } else if (voiceAvailable && !p.voz && p.informe) {
      divergen.push(`${u.label}: el Informe lo trata y la ciudadanía no lo señaló.`);
    }
  }
  if (convergen.length === 0 && divergen.length === 0) return [];
  return [
    "Coincidir en un tema es presencia compartida entre fuentes: no mide la magnitud del problema ni prueba una relación entre ellas.",
    ...(convergen.length > 0 ? ["Temas en los que coinciden dos o más fuentes:", ...convergen] : []),
    ...(divergen.length > 0 ? ["Temas en los que las fuentes no coinciden:", ...divergen] : []),
    ...(!voiceAvailable ? ["No consta priorización ciudadana: no puede declararse convergencia ni divergencia con la voz de la comunidad."] : []),
  ];
}

/** Paso al Plan de Acción (Art. 16 bis): qué recibe el Plan y quién decide. */
export function handoverLines(
  boundary: CanonicalInstitutionalBoundary,
  cc: CanonicalChosenClosing | undefined
): string[] {
  const split = cc !== undefined ? splitChosenConclusions(cc) : { cuerpo: [], lagunas: [] };
  const orient = cc?.orientations ?? [];
  const lista = (items: typeof orient): string => {
    const labels = items.map((i) => visibleLabel(i)).filter((l): l is string => l !== null);
    return labels.length > 0 ? ` (${labels.join(", ")})` : "";
  };
  return [
    boundary.statement,
    `El Plan de Acción recibe ${plural(split.cuerpo.length, "conclusión", "conclusiones")}${lista(split.cuerpo)}, ` +
      `${plural(orient.length, "recomendación", "recomendaciones")}${lista(orient)} y ` +
      `${plural(split.lagunas.length, "laguna", "lagunas")}${lista(split.lagunas)}.`,
    ...(boundary.candidaturas.length > 0
      ? [`Candidaturas técnicas preparadas para la deliberación: ${boundary.candidaturas.join("; ")}.`]
      : []),
    `Consenso del Grupo Motor documentado: ${boundary.consensoDocumentado ? "sí" : "no"}.`,
  ];
}

/**
 * Autoría y validación (Art. 17): qué compila el sistema, qué elige el equipo y
 * qué redacta. El texto de partida del cierre interpretativo, generado por el
 * sistema, no se presenta como autoría humana.
 */
export function authorshipLines(
  human: CanonicalAuthoredClosing | null,
  cc: CanonicalChosenClosing | undefined
): string[] {
  const elegidas = cc !== undefined ? [...cc.conclusions, ...cc.orientations] : [];
  const quien = [...new Set(elegidas.map((e) => e.elegidaPor).filter((x) => x !== ""))];
  const fechas = elegidas.map((e) => e.elegidaEl).filter((x) => x !== "").sort();
  const redactado = human !== null && human.authoringStatus !== "scaffold" && human.content.trim() !== "";
  return [
    "Compilado por el sistema: punto de partida, convergencias y divergencias, y anexo compilado.",
    elegidas.length > 0
      ? `Elegido por el equipo técnico: ${plural(elegidas.length, "propuesta", "propuestas")}` +
        (quien.length > 0 ? `, por ${quien.join("; ")}` : "") +
        (fechas.length > 0 ? `, entre el ${fechas[0]} y el ${fechas[fechas.length - 1]}` : "") +
        "."
      : "Elegido por el equipo técnico: ninguna propuesta todavía.",
    redactado
      ? `Cierre interpretativo redactado por el equipo técnico${human!.authorLabel !== null ? ` (${human!.authorLabel})` : ""}:`
      : "Cierre interpretativo del equipo técnico: no redactado.",
    ...(redactado ? human!.content.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p !== "") : []),
  ];
}
