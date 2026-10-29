import type {
  ThematicPrioritisationStudy,
  ThematicTopicVoteResult,
} from "../../domain/thematic-prioritisation";
import { splitRow } from "../csv-utils/splitRow";
import {
  buildAgeSexObserved,
  type AgeBand,
} from "../sam/buildAgeSexObserved";

// Mapeo canónico columna REDCap → ID del dominio COMPÁS NG.
// Fuente: PriorizacinCiudadanaZagra_DataDictionary_2026-06-20.csv
const COLUMN_MAP: { column: string; topicId: string; label: string }[] = [
  { column: "temas___1",  topicId: "alimentacion",          label: "Alimentación" },
  { column: "temas___2",  topicId: "actividad-fisica",      label: "Actividad física" },
  { column: "temas___3",  topicId: "bienestar-emocional",   label: "Bienestar emocional y salud mental" },
  { column: "temas___4",  topicId: "pantallas-redes",       label: "Uso de pantallas y redes sociales" },
  { column: "temas___5",  topicId: "sueno-descanso",        label: "Sueño y descanso" },
  { column: "temas___6",  topicId: "tabaco-alcohol-drogas", label: "Tabaco, vapeadores, alcohol y otras drogas" },
  { column: "temas___7",  topicId: "sexualidad-salud",      label: "Sexualidad y salud" },
  { column: "temas___8",  topicId: "violencia-genero",      label: "Violencia de género" },
  { column: "temas___9",  topicId: "medioambiente",         label: "Medioambiente y municipio" },
  { column: "temas___10", topicId: "accidentes",            label: "Accidentes en el hogar y la vía pública" },
];

const COMPLETE_COL = "papeleta_pri_tematica_complete";
const COMPLETE_VAL = "2";

/**
 * Opciones demográficas opcionales. Las columnas `sexo` y `edad` se leen por nombre
 * de cabecera. Sin opciones o sin esas columnas, la salida no incluye `ageSexObserved`.
 */
export interface ThematicPrioritisationCSVParseOptions {
  ageBands: AgeBand[];
}

export interface ThematicPrioritisationCSVParseResult {
  // Todos los campos excepto municipalityId e importedAt, que se asignan en App
  partialStudy: Omit<ThematicPrioritisationStudy, "municipalityId" | "importedAt">;
  warnings: string[];
}

export function parseThematicPrioritisationCSV(
  csvText: string,
  sourceFileName: string,
  options?: ThematicPrioritisationCSVParseOptions
): ThematicPrioritisationCSVParseResult {
  const text = csvText.replace(/^\uFEFF/, ""); // eliminar BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      partialStudy: emptyPartialStudy(sourceFileName),
      warnings: ["CSV vacío o sin registros de datos."],
    };
  }

  const warnings: string[] = [];
  const header = splitRow(lines[0]);

  const completeIdx = header.indexOf(COMPLETE_COL);
  if (completeIdx === -1) {
    warnings.push(`Columna '${COMPLETE_COL}' no encontrada. No se pueden filtrar registros completos.`);
  }

  const colIndices = COLUMN_MAP.map(({ column, topicId, label }) => ({
    topicId,
    label,
    column,
    index: header.indexOf(column),
  }));

  const missing = colIndices.filter((c) => c.index === -1).map((c) => c.column);
  if (missing.length > 0) {
    warnings.push(`Columnas no encontradas: ${missing.join(", ")}.`);
  }

  if (colIndices.every((c) => c.index === -1)) {
    return {
      partialStudy: emptyPartialStudy(sourceFileName),
      warnings: [
        "El CSV no contiene ninguna de las columnas de votación esperadas " +
          "(temas___1…temas___10). Verifica que sea la exportación del formulario " +
          "papeleta_pri_tematica y no otro instrumento REDCap.",
      ],
    };
  }

  const idxSexo = header.indexOf("sexo");
  const idxEdad = header.indexOf("edad");
  const hasDemographics = idxSexo !== -1 && idxEdad !== -1;
  const demographicRows: Array<{ sex?: string; age?: number }> = [];

  let total = 0;
  let complete = 0;
  let validVoteRecords = 0;
  const voteCounts: Record<string, number> = {};
  for (const { column } of COLUMN_MAP) voteCounts[column] = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    total++;

    const isComplete = completeIdx === -1 || row[completeIdx] === COMPLETE_VAL;
    if (isComplete) complete++;

    if (isComplete && hasDemographics && options?.ageBands) {
      const rawEdad = row[idxEdad]?.trim();
      const parsedAge = rawEdad ? parseInt(rawEdad, 10) : undefined;
      demographicRows.push({
        sex: row[idxSexo]?.trim() || undefined,
        age: parsedAge !== undefined && Number.isFinite(parsedAge) ? parsedAge : undefined,
      });
    }

    let hasVote = false;
    for (const { column, index } of colIndices) {
      if (index !== -1 && row[index]?.trim() === "1") {
        voteCounts[column]++;
        hasVote = true;
      }
    }
    if (hasVote) validVoteRecords++;
  }

  const rankingUnsorted: ThematicTopicVoteResult[] = colIndices.map(
    ({ topicId, label, column }) => ({
      topicId,
      redcapColumn: column,
      label,
      votes: voteCounts[column] ?? 0,
      pct:
        validVoteRecords > 0
          ? Math.round(((voteCounts[column] ?? 0) / validVoteRecords) * 1000) / 10
          : 0,
      rank: 0,
    })
  );

  const ranking: ThematicTopicVoteResult[] = rankingUnsorted
    .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label, "es"))
    .map((item, i) => ({ ...item, rank: i + 1 }));

  const topFiveTopicIds = ranking.slice(0, 5).map((r) => r.topicId);

  const cautions: string[] = [];
  if (validVoteRecords === 0) {
    cautions.push("No se encontraron papeletas con alguna temática seleccionada. Verifica el formato del CSV.");
  } else {
    if (validVoteRecords < 50) {
      cautions.push(
        `Muestra pequeña (${validVoteRecords} papeletas con selección temática). Interpretar con precaución.`
      );
    }
    const withoutVote = total - validVoteRecords;
    if (withoutVote > 0) {
      cautions.push(`${withoutVote} registros sin selección temática, excluidos solo del recuento de votos.`);
    }
    if (complete < validVoteRecords) {
      cautions.push("Las tablas de edad y sexo usan únicamente registros completos con variables demográficas interpretables; el ranking incluye también papeletas parciales con votos.");
    }
    cautions.push(
      "Los resultados reflejan las preferencias de las personas participantes, no de la población general."
    );
  }

  let ageSexObserved: ThematicPrioritisationStudy["ageSexObserved"];
  if (hasDemographics && options?.ageBands && demographicRows.length > 0) {
    const observed = buildAgeSexObserved(demographicRows, 0, options.ageBands);
    ageSexObserved = {
      cells: observed.cells,
      assignedCount: observed.assignedCount,
      unassignableCount: observed.unassignableCount,
    };
    if (observed.unassignableCount > 0) {
      const b = observed.unassignableBreakdown;
      const parts: string[] = [];
      if (b.noSex > 0) parts.push(`${b.noSex} sin sexo reconocible`);
      if (b.noAge + b.noBirthYear > 0) parts.push(`${b.noAge + b.noBirthYear} sin edad`);
      if (b.outOfBand > 0) parts.push(`${b.outOfBand} con edad fuera de bandas`);
      warnings.push(
        `Distribución edad×sexo: ${observed.unassignableCount} de ${demographicRows.length} papeletas no asignadas a celda (${parts.join("; ")}).`
      );
    }
  }

  return {
    partialStudy: {
      sourceFileName,
      totalRecords: total,
      completeRecords: complete,
      validVoteRecords,
      ranking,
      topFiveTopicIds,
      ...(ageSexObserved !== undefined && { ageSexObserved }),
      methodologicalCautions: cautions,
    },
    warnings,
  };
}

function emptyPartialStudy(
  sourceFileName: string
): Omit<ThematicPrioritisationStudy, "municipalityId" | "importedAt"> {
  return {
    sourceFileName,
    totalRecords: 0,
    completeRecords: 0,
    validVoteRecords: 0,
    ranking: [],
    topFiveTopicIds: [],
    methodologicalCautions: [],
  };
}

