// Resultado estadístico de un proceso de participación ciudadana (REDCap).
// Es independiente de ThematicPrioritisation (la decisión técnica).
// La decisión técnica puede derivarse del estudio, pero no está acoplada a él.

export interface ThematicTopicVoteResult {
  topicId: string;        // ID del catálogo COMPÁS NG (ej. "bienestar-emocional")
  redcapColumn: string;   // Columna REDCap (ej. "temas___3")
  label: string;          // Etiqueta del formulario
  votes: number;          // Papeletas con al menos un voto temático que lo marcaron
  pct: number;            // Porcentaje sobre papeletas con alguna temática seleccionada (1 decimal)
  rank: number;           // Posición en el ranking (1 = más votado)
}

/**
 * Distribución observada edad×sexo de las papeletas completas, solo cuando el
 * export aporta las columnas `sexo` y `edad`. Nunca se deriva ni se imputa.
 */
export interface ThematicAgeSexObserved {
  cells: Array<{ ageBand: string; male: number; female: number }>;
  assignedCount: number;
  unassignableCount: number;
}

export interface ThematicPrioritisationStudy {
  municipalityId: string;
  sourceFileName: string;
  importedAt: string;             // ISO timestamp
  totalRecords: number;           // Todos los registros del CSV
  completeRecords: number;        // Solo papeleta_pri_tematica_complete === "2"; análisis de registros completos
  validVoteRecords: number;       // Cualquier papeleta con al menos una temática seleccionada, aunque sea parcial
  ranking: ThematicTopicVoteResult[];  // 10 temas ordenados de más a menos votado
  topFiveTopicIds: string[];      // IDs de los 5 temas más votados
  ageSexObserved?: ThematicAgeSexObserved;  // Edad×sexo de las papeletas completas, si el export lo aporta
  methodologicalCautions: string[];
}
