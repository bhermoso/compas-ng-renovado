/**
 * Unidades de lectura derivadas del expediente (Art. 4 bis del contrato
 * metodológico).
 *
 * Una unidad existe solo si una fuente del expediente la sostiene: una
 * prioridad ciudadana (voz) o un activo de Localiza con correspondencia
 * validada (capacidad). Los temas sin ninguna fuente no generan unidad: se
 * devuelven como lagunas.
 *
 * Esta versión cruza dos planos, capacidad y voz. El plano de necesidad
 * documentada (Informe y estudios) queda declarado como pendiente: sus temas
 * no tienen todavía tabla de correspondencia, y sin ella no se emparejan. Por
 * eso aquí no se emite ninguno de los cuatro patrones del Art. 9 bis, que
 * requieren los tres planos; se emite el cruce de los dos disponibles.
 *
 * Sin umbrales ni puntuaciones. Solo se cuentan correspondencias validadas.
 */

import {
  THEMATIC_TOPICS,
  type ThematicPrioritisationStudy,
} from "../../domain/thematic-prioritisation";
import type { LocalizaAssetRecord } from "./localizaAssetRecord";
import { validatedCorrespondence } from "./topicCorrespondence";

export type CapacityVoiceCrossing =
  | "voz-y-activo-registrado"
  | "voz-sin-activo-registrado"
  | "activo-registrado-sin-voz";

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
  assets: Array<{ atomId: string; nombre: string; tematicas: string[] }>;
}

export interface ReadingUnit {
  topicId: string;
  label: string;
  voice: ReadingUnitVoice | null;
  capacity: ReadingUnitCapacity;
  crossing: CapacityVoiceCrossing;
  /** El plano de necesidad documentada aún no se cruza (sin tabla del Informe). */
  documentedNeed: "pendiente-de-correspondencia-con-el-informe";
}

export interface ReadingUnitsDerivation {
  units: ReadingUnit[];
  /** Temas de la papeleta sin voz ni activo con correspondencia validada: lagunas, no unidades. */
  topicsWithoutSource: string[];
  /** Activos cuyas temáticas no tienen correspondencia validada: no cuentan en ninguna unidad. */
  assetsWithoutValidatedCorrespondence: Array<{ atomId: string; nombre: string; tematicas: string[] }>;
  /** Si no hay estudio de priorización, el plano de voz es una laguna del expediente. */
  voiceSourceAvailable: boolean;
}

export function deriveReadingUnits(input: {
  assets: ReadonlyArray<LocalizaAssetRecord>;
  study?: ThematicPrioritisationStudy | null;
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
      list.push({ atomId: asset.atomId, nombre: asset.nombre, tematicas: asset.tematicas });
      capacityByTopic.set(id, list);
    }
  }

  const study = input.study ?? null;
  const voiceByTopic = new Map(study?.ranking.map((r) => [r.topicId, r]) ?? []);

  const units: ReadingUnit[] = [];
  const topicsWithoutSource: string[] = [];

  for (const topic of THEMATIC_TOPICS) {
    const vote = voiceByTopic.get(topic.id);
    const assets = capacityByTopic.get(topic.id) ?? [];
    const hasVoice = vote !== undefined && vote.votes > 0;
    if (!hasVoice && assets.length === 0) {
      topicsWithoutSource.push(topic.id);
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
      documentedNeed: "pendiente-de-correspondencia-con-el-informe",
    });
  }

  return {
    units,
    topicsWithoutSource,
    assetsWithoutValidatedCorrespondence: withoutCorrespondence,
    voiceSourceAvailable: study !== null,
  };
}
