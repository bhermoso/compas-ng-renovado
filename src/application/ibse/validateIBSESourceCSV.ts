/**
 * Control previo a cualquier mutación documental. El diccionario REDCap describe
 * variables; no representa participantes. Un CSV sin índices válidos tampoco es
 * un resultado 0/100. Ambos deben rechazarse antes de guardar el fichero o de
 * reemplazar el estudio y sus evidencias.
 */
export function validateIBSESourceCSV(text: string, nValid: number): void {
  const header = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0]?.toLowerCase() ?? "";
  const normalized = header.split(/[,;\t]/).map(col=>col.trim().replace(/^"|"$/g,""));
  const names = new Set(normalized);
  if (names.has("field_name") && (names.has("field_type") || names.has("field_label"))) {
    throw new Error("Este CSV es un diccionario de variables REDCap, no un archivo con respuestas IBSE. No se ha sustituido el estudio existente.");
  }
  if (nValid === 0) {
    throw new Error("El CSV no contiene respuestas IBSE válidas. Importación cancelada: el estudio y sus indicadores anteriores se han conservado.");
  }
}
