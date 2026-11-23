import type { MunicipalityWorkspace } from '../../domain/workspace';
import { buildWorkspaceStorageKey, parseWorkspaceJSON } from '../persistence/local-storage';
import { listOriginalFiles, addOriginalFiles, type OriginalEntry } from '../document-files/originalFiles';
import { ACTIVE_MUNICIPALITY_STORAGE_KEY } from '../../appWorkspaceHydration';

export interface StoredValue { key: string; value: string }
interface PackedFile { municipalityId: string; documentId: string; name: string; type: string; lastModified: number; size: number; sha256: string; base64: string }
export interface BackupPayload { createdAt: string; storage: StoredValue[]; preservedStorage: StoredValue[]; files: PackedFile[]; notices: string[] }
export interface BrowserBackup { format: 'compas-ng-browser-backup'; version: 1; sha256: string; payload: BackupPayload }
export interface CheckedBackup { backup: BrowserBackup; originals: OriginalEntry[]; conflicts: string[]; workspaces: string[] }
export interface CheckedWorkspaceImport { workspace: MunicipalityWorkspace; name: string; conflict?: string }
/** Claves de expedientes retirados de COMPÁS: no se copian y, si llegan en una copia antigua, se ignoran. */
const RETIRED_STORAGE_KEYS = new Set(['compas-ng:workspace:granada-zaidin', 'compas-ng:demo:coordinacion-zaidin:v1']);
const isRetiredKey = (key: string) => RETIRED_STORAGE_KEYS.has(key);
const allowedKey = (key: string) => !isRetiredKey(key) && (key.startsWith('compas-ng:workspace:') || key === 'compas-ng:custom-municipalities');
const idOf = (entry: {municipalityId: string; documentId: string}) => JSON.stringify([entry.municipalityId, entry.documentId]);
export async function digest(bytes: BufferSource) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join(''); }
const textDigest = (text: string) => digest(new TextEncoder().encode(text));
async function pack(entry: OriginalEntry): Promise<PackedFile> {
  const bytes = new Uint8Array(await entry.file.arrayBuffer()); let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { municipalityId: entry.municipalityId, documentId: entry.documentId, name: entry.file.name, type: entry.file.type, lastModified: entry.file.lastModified, size: bytes.length, sha256: await digest(bytes), base64: btoa(binary) };
}
export async function createBackup(current?: MunicipalityWorkspace, bundled: Record<string, string> = {}): Promise<BrowserBackup> {
  const storage: StoredValue[] = [];
  for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i)!; if (allowedKey(key)) storage.push({key, value: localStorage.getItem(key)!}); }
  const preservedStorage = storage.map(entry => ({...entry}));
  // Capture the active in-memory version too, including fields omitted by routine persistence.
  if (current) { const key = buildWorkspaceStorageKey(current.municipality.identity.id); const index = storage.findIndex(s => s.key === key); const entry = {key, value: JSON.stringify(current)}; if (index < 0) storage.push(entry); else storage[index] = entry; }
  const originals = await listOriginalFiles(); const ids = new Set(originals.map(idOf)); const notices: string[] = [];
  const downloads = new Map<string, Promise<Blob>>();
  for (const entry of storage.filter(s => s.key.startsWith('compas-ng:workspace:'))) {
    try {
      const raw = JSON.parse(entry.value); const municipalityId = raw.municipality.identity.id;
      if (!parseWorkspaceJSON(entry.value)) notices.push(`${entry.key}: expediente no compatible; se conserva el texto sin modificar.`);
      for (const doc of raw.repository.documents) {
        const identity = {municipalityId, documentId: doc.id}; if (ids.has(idOf(identity))) continue;
        const source = doc.source?.url;
        if (typeof source === 'string' && Object.hasOwn(bundled, source)) {
          try {
            if (!downloads.has(source)) downloads.set(source, fetch(bundled[source]).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); }));
            const blob = await downloads.get(source)!;
            originals.push({...identity, file: new File([blob], source.split('/').pop()!, {type: blob.type, lastModified: 0})}); ids.add(idOf(identity));
          } catch { notices.push(`${doc.title}: no se pudo incluir el PDF distribuido con la aplicación.`); }
        } else notices.push(`${doc.title}: original no conservado; se incluye su referencia y el texto disponible.`);
      }
    } catch { notices.push(`${entry.key}: no se ha podido leer; su contenido se conserva íntegro en la copia.`); }
  }
  const files: PackedFile[] = []; for (const entry of originals) files.push(await pack(entry));
  const payload = {createdAt: new Date().toISOString(), storage, preservedStorage, files, notices};
  return {format:'compas-ng-browser-backup', version:1, sha256:await textDigest(JSON.stringify(payload)), payload};
}
function validateStorage(entry: StoredValue): string | undefined {
  if (entry && typeof entry.key === 'string' && isRetiredKey(entry.key)) return undefined;
  if (!entry || typeof entry.key !== 'string' || !allowedKey(entry.key) || typeof entry.value !== 'string') throw new Error('La copia contiene una clave de almacenamiento no admitida.');
  const raw = JSON.parse(entry.value);
  if (entry.key.startsWith('compas-ng:workspace:')) {
    const workspace = parseWorkspaceJSON(entry.value);
    if (!workspace || entry.key !== buildWorkspaceStorageKey(workspace.municipality.identity.id)) throw new Error('Expediente incompatible o ámbito incoherente: ' + entry.key);
    return raw.municipality.identity.name ?? raw.municipality.identity.id;
  }
  if (entry.key === 'compas-ng:custom-municipalities') {
    if (!Array.isArray(raw) || raw.some(m => !m || typeof m.id !== 'string' || typeof m.name !== 'string' || typeof m.province !== 'string')) throw new Error('Lista de ámbitos no válida.');
  }
}
export async function inspectBackup(text: string): Promise<CheckedBackup> {
  const backup: BrowserBackup = JSON.parse(text);
  if (backup?.format !== 'compas-ng-browser-backup' || backup.version !== 1) throw new Error('Formato de copia no compatible. Conserva el archivo original; no se ha modificado ningún dato.');
  const p = backup.payload;
  if (!p || !Array.isArray(p.storage) || !Array.isArray(p.preservedStorage) || !Array.isArray(p.files) || !Array.isArray(p.notices) || p.notices.some(n => typeof n !== 'string') || typeof p.createdAt !== 'string' || !Number.isFinite(Date.parse(p.createdAt))) throw new Error('Copia incompleta.');
  if (await textDigest(JSON.stringify(p)) !== backup.sha256) throw new Error('La huella de la copia no coincide: el archivo está alterado o incompleto.');
  for (const entry of p.preservedStorage) if (!entry || typeof entry.key !== 'string' || !(allowedKey(entry.key) || isRetiredKey(entry.key)) || typeof entry.value !== 'string') throw new Error('Copia del almacenamiento previo no válida.');
  const keys = new Set<string>(); const workspaces: string[] = []; const conflicts: string[] = [];
  for (const entry of p.storage) {
    if (entry && typeof entry.key === 'string' && isRetiredKey(entry.key)) continue;
    const name = validateStorage(entry); if (name) workspaces.push(name);
    if (keys.has(entry.key)) throw new Error('Clave duplicada en la copia.'); keys.add(entry.key);
    const local = localStorage.getItem(entry.key); if (local !== null && local !== entry.value) conflicts.push(entry.key);
  }
  const originals: OriginalEntry[] = []; const ids = new Set<string>();
  const existing = new Map((await listOriginalFiles()).map(e => [idOf(e), e.file]));
  for (const f of p.files) {
    if (!f || typeof f.municipalityId !== 'string' || !f.municipalityId || typeof f.documentId !== 'string' || !f.documentId || typeof f.name !== 'string' || typeof f.type !== 'string' || !Number.isSafeInteger(f.size) || f.size < 0 || !Number.isFinite(f.lastModified) || typeof f.base64 !== 'string') throw new Error('Metadatos de archivo no válidos.');
    const id = idOf(f); if (ids.has(id)) throw new Error('Original duplicado en la copia.'); ids.add(id);
    const binary = atob(f.base64); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    if (btoa(binary) !== f.base64 || bytes.length !== f.size || await digest(bytes) !== f.sha256) throw new Error('Original alterado o incompleto: ' + f.name);
    const file = new File([bytes], f.name, {type:f.type, lastModified:f.lastModified}); originals.push({municipalityId:f.municipalityId, documentId:f.documentId, file});
    const old = existing.get(id);
    if (old && (old.name !== f.name || old.type !== f.type || old.lastModified !== f.lastModified || await digest(await old.arrayBuffer()) !== f.sha256)) conflicts.push('Original: ' + f.name + ' · ' + f.municipalityId);
  }
  return {backup, originals, conflicts, workspaces};
}
export async function restoreBackup(text: string): Promise<CheckedBackup> {
  // Revalidate at the moment of writing, not just when displaying the preview.
  const checked = await inspectBackup(text);
  if (checked.conflicts.length) throw new Error('Hay versiones diferentes en este navegador. No se ha sobrescrito ningún dato. Recupera la copia en un perfil de navegador vacío desde el enlace de recuperación.');
  // add() is atomic across the new originals and cannot overwrite a concurrently added file.
  await addOriginalFiles(checked.originals);
  const written: StoredValue[] = [];
  try {
    for (const entry of checked.backup.payload.storage) {
      if (isRetiredKey(entry.key)) continue;
      const old = localStorage.getItem(entry.key);
      if (old !== null && old !== entry.value) throw new Error('El expediente ha cambiado durante la recuperación.');
      if (old === null) { localStorage.setItem(entry.key, entry.value); written.push(entry); }
    }
  } catch (error) {
    for (const entry of written) if (localStorage.getItem(entry.key) === entry.value) localStorage.removeItem(entry.key);
    throw new Error('No se pudo completar la recuperación: ' + (error as Error).message + ' Los expedientes anteriores se conservan. Los originales ya copiados permanecen disponibles; conserva la copia y vuelve a intentarlo con espacio suficiente.', { cause: error });
  }
  return checked;
}


const CUSTOM_MUNICIPALITIES_KEY = 'compas-ng:custom-municipalities';
const BUILT_IN_MUNICIPALITY_IDS = new Set(['atarfe','alfacar','churriana','zagra']);

function readCustomMunicipalitiesForImport(): Array<{id:string; name:string; province:string; ineCode?:string; territorialType?:string; createdBy?:string}> {
  const text = localStorage.getItem(CUSTOM_MUNICIPALITIES_KEY);
  if (text === null) return [];
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.province !== 'string')) {
    throw new Error('La lista de ámbitos guardada en este navegador no es válida.');
  }
  return parsed;
}

export function inspectWorkspaceImport(text: string): CheckedWorkspaceImport {
  const workspace = parseWorkspaceJSON(text);
  if (!workspace) throw new Error('El archivo no es una copia completa ni un expediente COMPÁS compatible.');
  const municipality = workspace.municipality.identity;
  const key = buildWorkspaceStorageKey(municipality.id);
  const existing = localStorage.getItem(key);
  return {
    workspace,
    name: municipality.name,
    conflict: existing !== null && existing !== JSON.stringify(workspace)
      ? `Ya existe una versión diferente del expediente de ${municipality.name} en este navegador.`
      : undefined,
  };
}

export function restoreWorkspaceImport(text: string): CheckedWorkspaceImport {
  const checked = inspectWorkspaceImport(text);
  if (checked.conflict) throw new Error(checked.conflict + ' No se ha sobrescrito ningún dato.');
  const workspace = checked.workspace;
  const municipality = workspace.municipality.identity;
  const key = buildWorkspaceStorageKey(municipality.id);
  const workspaceJSON = JSON.stringify(workspace);
  const previousWorkspace = localStorage.getItem(key);
  const previousCustom = localStorage.getItem(CUSTOM_MUNICIPALITIES_KEY);
  const previousActive = localStorage.getItem(ACTIVE_MUNICIPALITY_STORAGE_KEY);
  const custom = readCustomMunicipalitiesForImport();
  const registered = custom.find(item => item.id === municipality.id);
  if (registered && (registered.name !== municipality.name || registered.province !== municipality.province)) {
    throw new Error('Ya existe un ámbito con el mismo identificador y otra identidad territorial.');
  }
  const shouldRegister = !BUILT_IN_MUNICIPALITY_IDS.has(municipality.id) && !registered;
  const nextCustom = shouldRegister
    ? [...custom, {
        id: municipality.id,
        name: municipality.name,
        province: municipality.province,
        ineCode: municipality.ineCode,
        territorialType: municipality.territorialType,
        createdBy: workspace.municipality.metadata.createdBy,
      }]
    : custom;
  try {
    if (previousWorkspace === null) localStorage.setItem(key, workspaceJSON);
    if (shouldRegister) localStorage.setItem(CUSTOM_MUNICIPALITIES_KEY, JSON.stringify(nextCustom));
    localStorage.setItem(ACTIVE_MUNICIPALITY_STORAGE_KEY, municipality.id);
  } catch (error) {
    if (previousWorkspace === null) localStorage.removeItem(key);
    if (previousCustom === null) localStorage.removeItem(CUSTOM_MUNICIPALITIES_KEY);
    else localStorage.setItem(CUSTOM_MUNICIPALITIES_KEY, previousCustom);
    if (previousActive === null) localStorage.removeItem(ACTIVE_MUNICIPALITY_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_MUNICIPALITY_STORAGE_KEY, previousActive);
    throw new Error('No se pudo importar el expediente. No se ha sobrescrito ningún dato.', {cause:error});
  }
  return checked;
}
