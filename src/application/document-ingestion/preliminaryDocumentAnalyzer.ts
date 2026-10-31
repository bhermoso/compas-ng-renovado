import type { DocumentKind } from "../../domain/repository";
import { identifyMethodologicalHeaders, type MethodologicalMatch } from "./identifyMethodologicalHeaders";

export type InspectedFormat = "pdf" | "docx" | "doc" | "zip" | "csv" | "xlsx" | "xls" | "png" | "jpeg" | "unknown";
export interface ArchiveEntry { path: string; size: number; compressedSize: number; encrypted: boolean; unsafe: boolean; format: InspectedFormat; suggestedKind?: DocumentKind | "undetermined" }
export interface PreliminaryAnalysis {
  format: InspectedFormat;
  proposedKind: DocumentKind | "undetermined";
  reasons: string[];
  warnings: string[];
  methodologicalMatches?: MethodologicalMatch[];
  fingerprint?: string;
  archiveEntries?: ArchiveEntry[];
}
const MAX_INPUT = 40 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 500;
const MAX_ZIP_UNCOMPRESSED = 100 * 1024 * 1024;

function formatFromName(name: string): InspectedFormat {
  const extension = name.toLowerCase().split(".").pop();
  const known: Record<string, InspectedFormat> = { pdf:"pdf", docx:"docx", doc:"doc", zip:"zip", csv:"csv", xlsx:"xlsx", xls:"xls", png:"png", jpg:"jpeg", jpeg:"jpeg" };
  return known[extension ?? ""] ?? "unknown";
}
function u16(v: DataView, i: number) { return v.getUint16(i, true); }
function u32(v: DataView, i: number) { return v.getUint32(i, true); }
function detectFormat(bytes: Uint8Array, name: string): InspectedFormat {
  const starts = (...b: number[]) => b.every((v,i) => bytes[i] === v);
  if (starts(0x25,0x50,0x44,0x46,0x2d)) return "pdf";
  if (starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)) return "png";
  if (starts(0xff,0xd8,0xff)) return "jpeg";
  if (starts(0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1)) return formatFromName(name) === "xls" ? "xls" : "doc";
  if (starts(0x50,0x4b,0x03,0x04) || starts(0x50,0x4b,0x05,0x06)) {
    const ext = formatFromName(name);
    return ext === "docx" || ext === "xlsx" ? ext : "zip";
  }
  // CSV carece de firma binaria; tipo tentativo y nunca equivalente a validación del contenido.
  if (formatFromName(name) === "csv" && !bytes.slice(0,1024).some(b => b === 0)) return "csv";
  return "unknown";
}

function inspectZip(buffer: ArrayBuffer): { entries: ArchiveEntry[]; warnings: string[] } {
  const view = new DataView(buffer), length = view.byteLength, warnings: string[] = [];
  // EOCD en los últimos 65557 bytes, con soporte solo para ZIP clásico de un disco.
  let eocd = -1;
  for (let i = length - 22; i >= Math.max(0, length - 65557); i--) {
    if (u32(view,i) === 0x06054b50 && i + 22 + u16(view,i+20) <= length) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP sin directorio central reconocible.");
  const disk = u16(view,eocd+4), count = u16(view,eocd+10), offset = u32(view,eocd+16);
  const total = u32(view,eocd+12);
  if (disk !== 0 || u16(view,eocd+6) !== 0 || count === 0xffff || offset === 0xffffffff || total === 0xffffffff) throw new Error("ZIP multidisco o ZIP64 no admitido.");
  if (count > MAX_ZIP_ENTRIES) throw new Error("ZIP con demasiadas entradas.");
  if (offset > eocd || offset + 46 > eocd) throw new Error("Directorio ZIP fuera de límites.");
  const entries: ArchiveEntry[] = [];
  let cursor = offset, totalSize = 0;
  for (let i=0;i<count;i++) {
    if (cursor + 46 > length || u32(view,cursor) !== 0x02014b50) throw new Error("Directorio ZIP inconsistente.");
    const flags=u16(view,cursor+8), method=u16(view,cursor+10), compressedSize=u32(view,cursor+20), size=u32(view,cursor+24);
    const nameLength=u16(view,cursor+28), extraLength=u16(view,cursor+30), commentLength=u16(view,cursor+32);
    const localOffset=u32(view,cursor+42);
    if (size === 0xffffffff || compressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error("Entrada ZIP64 no admitida.");
    if (localOffset + 30 > offset || u32(view,localOffset) !== 0x04034b50) throw new Error("Cabecera local ZIP ausente o inválida.");
    const dataStart=localOffset+30+u16(view,localOffset+26)+u16(view,localOffset+28);
    if (dataStart > offset || compressedSize > offset - dataStart) throw new Error("Datos ZIP fuera de límites.");
    const end=cursor+46+nameLength+extraLength+commentLength;
    if (end > length) throw new Error("Entrada ZIP truncada.");
    const path=new TextDecoder("utf-8", {fatal:false}).decode(new Uint8Array(buffer,cursor+46,nameLength));
    const unsafe=path.startsWith("/") || path.includes("\\") || path.split("/").includes("..") || /^[a-zA-Z]:/.test(path) || path.includes("\u0000");
    totalSize += size;
    if (totalSize > MAX_ZIP_UNCOMPRESSED) throw new Error("ZIP supera el límite de tamaño descomprimido declarado.");
    const encrypted=(flags & 1) !== 0;
    if (encrypted || unsafe || (method!==0 && method!==8)) warnings.push("Entrada bloqueada o no admitida: "+path);
    if (compressedSize > 0 && size / compressedSize > 200) warnings.push("Compresión inusualmente alta: "+path);
    if (path.toLowerCase().endsWith(".zip")) warnings.push("ZIP anidado: revisión obligatoria: "+path);
    entries.push({path,size,compressedSize,encrypted,unsafe,format:formatFromName(path),suggestedKind:"undetermined"});
    cursor=end;
  }
  if (cursor > eocd) throw new Error("Directorio ZIP solapado.");
  return {entries,warnings};
}
function csvProposal(text: string): {kind: DocumentKind | "undetermined"; reason?: string} {
  const header = text.split(/\r?\n/,1)[0]?.toLowerCase() ?? "";
  const cells = header.split(/[;,\t]/).map(s => s.trim().replace(/^"|"$/g,""));
  if (cells.includes("record_id") && cells.some(s=>/^temas___\d+$/.test(s))) return {kind:"redcap-export",reason:"Cabecera compatible con priorización temática REDCap; requiere validación del esquema."};
  if (cells.includes("record_id") && cells.some(s=>/^\w+___\d+$/.test(s))) return {kind:"redcap-export",reason:"Cabecera compatible con casillas REDCap, sin identificar instrumento ni destino."};
  return {kind:"undetermined"};
}
export async function analyzeDocument(file: File): Promise<PreliminaryAnalysis> {
  if (file.size > MAX_INPUT) throw new Error("Archivo superior al límite de análisis preliminar (40 MiB).");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const format = detectFormat(bytes,file.name);
  const warnings: string[] = [], reasons: string[] = [];
  if (format === "unknown") warnings.push("Formato sin firma reconocida o no admitido.");
  const expected = formatFromName(file.name);
  if (expected !== "unknown" && format !== expected) warnings.push("La extensión no coincide con la firma detectada.");
  let proposedKind: DocumentKind | "undetermined" = "undetermined";
  let archiveEntries: ArchiveEntry[] | undefined;
  let methodologicalMatches: MethodologicalMatch[] | undefined;
  if (format === "zip") {
    const result = inspectZip(buffer);
    archiveEntries=result.entries;
    warnings.push(...result.warnings);
    reasons.push("Inventario ZIP: solo listado del directorio; no se ha extraído ni abierto ningún fichero interno.");
  } else if (format === "csv") {
    const sample = new TextDecoder("utf-8").decode(bytes.slice(0,Math.min(bytes.length,16384)));
    methodologicalMatches = identifyMethodologicalHeaders(sample.split(/\r?\n/,1)[0] ?? "");
    if (methodologicalMatches.length) reasons.push("Coincidencias con esquemas metodológicos canónicos: requieren validación por parser y equipo técnico.");
    const suggestion = csvProposal(sample);
    proposedKind=suggestion.kind;
    if (suggestion.reason) reasons.push(suggestion.reason);
  }
  const digest=await crypto.subtle.digest("SHA-256",buffer);
  const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  return { format,proposedKind,reasons,warnings,fingerprint,archiveEntries,methodologicalMatches };
}
