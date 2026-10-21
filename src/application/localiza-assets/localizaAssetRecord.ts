/**
 * Activo estructurado de Localiza Salud.
 *
 * El átomo de activo conserva la fila del listado como texto con campos
 * separados por tabulador. Este módulo la lee por posición (estructura
 * observada: nombre, descripción, acceso, población destinataria, temáticas,
 * municipio, localidad, enlace) y solo cuando la fila tiene exactamente esa
 * forma. No infiere ningún campo a partir del texto libre: lo que no encaja se
 * devuelve como no estructurado, con su motivo.
 *
 * Contrato: Art. 9 y 9 bis de CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.
 * Cabeceras del listado de Localiza Salud: no verificadas (la lectura es por
 * posición; la estructura procede de los registros de prueba del repositorio).
 */

import type { EvidenceAtom } from "../../domain/evidence";

export const LOCALIZA_ASSET_FIELD_COUNT = 8;

export interface LocalizaAssetRecord {
  atomId: string;
  nombre: string;
  descripcion: string;
  /** Requisito de acceso tal como consta (p. ej. «Cualquiera»). */
  acceso: string;
  /** Grupos de población destinatarios, tal como constan. */
  poblacionDestinataria: string[];
  /** Temáticas declaradas en Localiza Salud, tal como constan. */
  tematicas: string[];
  municipio: string;
  localidad: string;
  /** Estado en la cadena del Art. 9 bis: consta en Localiza Salud. */
  estado: "registrado-en-localiza";
}

export interface UnstructuredAsset {
  atomId: string;
  title: string;
  motivo: string;
}

export interface LocalizaAssetReading {
  records: LocalizaAssetRecord[];
  unstructured: UnstructuredAsset[];
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseLocalizaAssetAtom(
  atom: Pick<EvidenceAtom, "id" | "title" | "content">
): LocalizaAssetRecord | UnstructuredAsset {
  const fields = atom.content.split("\t");
  if (fields.length !== LOCALIZA_ASSET_FIELD_COUNT) {
    return {
      atomId: atom.id,
      title: atom.title,
      motivo: `La fila tiene ${fields.length} campos y se esperaban ${LOCALIZA_ASSET_FIELD_COUNT}.`,
    };
  }
  const [nombre, descripcion, acceso, poblacion, tematicas, municipio, localidad] =
    fields.map((f) => f.trim());
  return {
    atomId: atom.id,
    nombre,
    descripcion,
    acceso,
    poblacionDestinataria: splitList(poblacion),
    tematicas: splitList(tematicas),
    municipio,
    localidad,
    estado: "registrado-en-localiza",
  };
}

function isRecord(x: LocalizaAssetRecord | UnstructuredAsset): x is LocalizaAssetRecord {
  return "estado" in x;
}

/** Lee los átomos de tipo activo; los que no tienen la forma esperada quedan aparte. */
export function readLocalizaAssets(
  atoms: ReadonlyArray<Pick<EvidenceAtom, "id" | "kind" | "title" | "content">>
): LocalizaAssetReading {
  const records: LocalizaAssetRecord[] = [];
  const unstructured: UnstructuredAsset[] = [];
  for (const atom of atoms) {
    if (atom.kind !== "asset") continue;
    const parsed = parseLocalizaAssetAtom(atom);
    if (isRecord(parsed)) records.push(parsed);
    else unstructured.push(parsed);
  }
  return { records, unstructured };
}

/** Recuento de activos por temática declarada en Localiza (un activo cuenta en cada una de las suyas). */
export function countAssetsByTematica(
  records: ReadonlyArray<LocalizaAssetRecord>
): Array<{ tematica: string; count: number }> {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const tematica of new Set(record.tematicas)) {
      counts.set(tematica, (counts.get(tematica) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tematica, count]) => ({ tematica, count }))
    .sort((a, b) => b.count - a.count || a.tematica.localeCompare(b.tematica, "es"));
}
