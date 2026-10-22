/**
 * Unidades de lectura derivadas del expediente (Art. 4 bis del contrato
 * metodológico).
 *
 * Una unidad existe solo si una fuente del expediente la sostiene: una
 * prioridad ciudadana (voz) o un activo de Localiza con correspondencia
 * validada (capacidad). Los temas sin ninguna fuente no generan unidad: se
 * devuelven como lagunas.
 *
 * Cruza capacidad y voz, y añade el plano del Informe cuando consta. Una
 * dimensión del Informe solo se asocia a un tema por una correspondencia
 * validada. Sin lectura estructurada de autoría, el Informe consta por
 * presencia textual (recuento de términos), que no es necesidad documentada ni
 * prevalencia ni prioridad: por eso aquí no se emite ninguno de los cuatro
 * patrones del Art. 9 bis, que requieren necesidad documentada. El Informe no
 * crea unidades por sí solo: un tema tratado solo por el Informe se devuelve
 * aparte.
 *
 * Sin umbrales ni puntuaciones. Solo se cuentan correspondencias validadas.
 */

import {
  THEMATIC_TOPICS,
  type ThematicPrioritisationStudy,
} from "../../domain/thematic-prioritisation";
import type { LocalizaAssetRecord } from "./localizaAssetRecord";
import { validatedInformeCorrespondence } from "./informeTopicCorrespondence";
import { validatedCorrespondence } from "./topicCorrespondence";
import { axisTopicId } from "./readingAxes";
import type { ReadingAxisDeclaration } from "../../domain/repository";

export type CapacityVoiceCrossing =
  | "voz-y-activo-registrado"
  | "voz-sin-activo-registrado"
  | "activo-registrado-sin-voz"
  | "eje-con-activo-registrado"
  | "eje-sin-activo-registrado";

export interface ReadingUnitVoice {
  votes: number;
  pct: number;
  rank: number;
  inTopFive: boolean;
  /** Papeletas completas sobre las que se calculan los porcentajes. */
  completeRecords: number;
}

export interface ReadingUnitCapacity {
  /** Activos de Localiza con correspondencia validada a este tema. */
  assets: Array<{ atomId: string; nombre: string; tematicas: string[]; estado: LocalizaAssetRecord["estado"] }>;
}

export interface ReadingUnitInforme {
  /** Dimensiones del Informe con correspondencia validada a este tema. */
  dimensions: Array<{ dimension: string; menciones: number }>;
  /** Estatuto del plano: solo presencia textual. */
  status: "presencia-textual";
}

export interface ReadingUnit {
  topicId: string;
  label: string;
  voice: ReadingUnitVoice | null;
  capacity: ReadingUnitCapacity;
  crossing: CapacityVoiceCrossing;
  /** El Informe trata el tema (presencia textual), o null si no consta. */
  informe: ReadingUnitInforme | null;
  /** Eje de lectura declarado por una persona (Art. 4 ter); ausente en las unidades de tema. */
  axis?: { definition: string; declaredBy: string; declaredOn: string; version: number };
  /** Necesidad documentada: pendiente mientras el Informe conste solo por presencia textual. */
  documentedNeed: "no-disponible-solo-presencia-textual";
}

export interface ReadingUnitsDerivation {
  units: ReadingUnit[];
  /** Temas de la papeleta sin voz ni activo con correspondencia validada: lagunas, no unidades. */
  topicsWithoutSource: string[];
  /** Activos cuyas temáticas no tienen correspondencia validada: no cuentan en ninguna unidad. */
  assetsWithoutValidatedCorrespondence: Array<{ atomId: string; nombre: string; tematicas: string[] }>;
  /** Temas que solo trata el Informe (presencia textual): no generan unidad. */
  topicsOnlyInInforme: string[];
  /** Ejes declarados sin ninguna fuente en el expediente (ni Informe ni activos): no generan unidad (Art. 4 bis.1). */
  axesWithoutSource: string[];
  /** Si no hay estudio de priorización, el plano de voz es una laguna del expediente. */
  voiceSourceAvailable: boolean;
}

export function deriveReadingUnits(input: {
  assets: ReadonlyArray<LocalizaAssetRecord>;
  study?: ThematicPrioritisationStudy | null;
  /** Señales de la lectura del Informe (`HealthReportSanitaryReading.senales`). */
  informeSignals?: ReadonlyArray<{ dimension: string; menciones: number }>;
  /** Ejes de lectura vigentes declarados por el equipo técnico (Art. 4 ter). */
  axes?: ReadonlyArray<ReadingAxisDeclaration>;
}): ReadingUnitsDerivation {
  const topicsByTematica = new Map<string, readonly string[]>(
    validatedCorrespondence().map((e) => [e.localizaTematica, e.topicIds])
  );

  const capacityByTopic = new Map<string, ReadingUnitCapacity["assets"]>();
  const withoutCorrespondence: ReadingUnitsDerivation["assetsWithoutValidatedCorrespondence"] = [];

  for (const asset of input.assets) {
    const topics = new Set<string>();
    for (const t of asset.tematicas) for (const id of topicsByTematica.get(t) ?? []) topics.add(id);
    if (topics.size === 0) {
      withoutCorrespondence.push({ atomId: asset.atomId, nombre: asset.nombre, tematicas: asset.tematicas });
      continue;
    }
    for (const id of topics) {
      const list = capacityByTopic.get(id) ?? [];
      list.push({ atomId: asset.atomId, nombre: asset.nombre, tematicas: asset.tematicas, estado: asset.estado });
      capacityByTopic.set(id, list);
    }
  }

  const mencionesPorDimension = new Map((input.informeSignals ?? []).map((s) => [s.dimension, s.menciones]));
  const informeByTopic = new Map<string, Array<{ dimension: string; menciones: number }>>();
  for (const e of validatedInformeCorrespondence()) {
    const menciones = mencionesPorDimension.get(e.informeDimension);
    if (menciones === undefined) continue;
    for (const id of e.topicIds) {
      const list = informeByTopic.get(id) ?? [];
      list.push({ dimension: e.informeDimension, menciones });
      informeByTopic.set(id, list);
    }
  }

  const study = input.study ?? null;
  const voiceByTopic = new Map(study?.ranking.map((r) => [r.topicId, r]) ?? []);

  const units: ReadingUnit[] = [];
  const topicsWithoutSource: string[] = [];
  const topicsOnlyInInforme: string[] = [];

  for (const topic of THEMATIC_TOPICS) {
    const vote = voiceByTopic.get(topic.id);
    const assets = capacityByTopic.get(topic.id) ?? [];
    const hasVoice = vote !== undefined && vote.votes > 0;
    const informeDims = informeByTopic.get(topic.id) ?? [];
    if (!hasVoice && assets.length === 0) {
      (informeDims.length > 0 ? topicsOnlyInInforme : topicsWithoutSource).push(topic.id);
      continue;
    }
    const crossing: CapacityVoiceCrossing = hasVoice
      ? assets.length > 0
        ? "voz-y-activo-registrado"
        : "voz-sin-activo-registrado"
      : "activo-registrado-sin-voz";
    units.push({
      topicId: topic.id,
      label: topic.label,
      voice:
        hasVoice && study
          ? {
              votes: vote.votes,
              pct: vote.pct,
              rank: vote.rank,
              inTopFive: study.topFiveTopicIds.includes(topic.id),
              completeRecords: study.completeRecords,
            }
          : null,
      capacity: { assets },
      crossing,
      informe: informeDims.length > 0 ? { dimensions: informeDims, status: "presencia-textual" } : null,
      documentedNeed: "no-disponible-solo-presencia-textual",
    });
  }

  const axesWithoutSource: string[] = [];
  for (const axis of input.axes ?? []) {
    const tematicas = new Set(axis.localizaTematicas);
    const assets = input.assets
      .filter((a) => a.tematicas.some((t) => tematicas.has(t)))
      .map((a) => ({ atomId: a.atomId, nombre: a.nombre, tematicas: a.tematicas, estado: a.estado }));
    const dimensions = axis.informeDimensions.flatMap((d) => {
      const menciones = mencionesPorDimension.get(d);
      return menciones === undefined ? [] : [{ dimension: d, menciones }];
    });
    if (assets.length === 0 && dimensions.length === 0) {
      axesWithoutSource.push(axis.label);
      continue;
    }
    units.push({
      topicId: axisTopicId(axis.id),
      label: axis.label,
      voice: null,
      capacity: { assets },
      crossing: assets.length > 0 ? "eje-con-activo-registrado" : "eje-sin-activo-registrado",
      informe: dimensions.length > 0 ? { dimensions, status: "presencia-textual" } : null,
      axis: {
        definition: axis.definition,
        declaredBy: axis.declaredBy,
        declaredOn: axis.declaredAt.slice(0, 10),
        version: axis.version,
      },
      documentedNeed: "no-disponible-solo-presencia-textual",
    });
  }

  return {
    units,
    axesWithoutSource,
    topicsWithoutSource,
    topicsOnlyInInforme,
    assetsWithoutValidatedCorrespondence: withoutCorrespondence,
    voiceSourceAvailable: study !== null,
  };
}
