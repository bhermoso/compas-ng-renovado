import type { ExternalHealthProfile, ExternalProfileLibrary, ProfileAttachment, ProfileResult } from '../../domain/health-profile/ExternalHealthProfile';

export const MAX_PROFILE_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PROFILE_LIBRARY_BYTES = 40 * 1024 * 1024;
export const EMPTY_PROFILE_LIBRARY: ExternalProfileLibrary = { profiles: [], attachments: [] };
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const string = (x: unknown): x is string => typeof x === 'string';
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every(string);
const textFields = (x: Record<string, unknown>, keys: string[]) => keys.every(k => string(x[k]));

export function isProfileResult(x: unknown): x is ProfileResult {
 if (!object(x) || !textFields(x, ['id','title','value','unit','source','page','period','caution'])) return false;
 if (['topic','scale','denominator'].some(k => x[k] !== undefined && !string(x[k]))) return false;
 if (x.temporalContext !== undefined && !['current','historical','not-stated'].includes(x.temporalContext as string)) return false;
 if (x.chartValue !== undefined && (typeof x.chartValue !== 'number' || !Number.isFinite(x.chartValue))) return false;
 return x.comparison === undefined || (object(x.comparison) && string(x.comparison.label) && typeof x.comparison.value === 'number' && Number.isFinite(x.comparison.value));
}
export function isExternalProfileLibrary(value: unknown, municipalityId: string): value is ExternalProfileLibrary {
 if (!object(value) || !Array.isArray(value.profiles) || !Array.isArray(value.attachments)) return false;
 const attachments = value.attachments;
 if (!attachments.every(a => object(a) && textFields(a,['id','name','mimeType','sha256','base64']) &&
  typeof a.size === 'number' && Number.isInteger(a.size) && a.size >= 0 && a.size <= MAX_PROFILE_FILE_BYTES &&
  /^[a-f0-9]{64}$/.test(a.sha256 as string) && (a.base64 as string).length % 4 === 0 && !/[^A-Za-z0-9+/=]/.test(a.base64 as string) &&
  !/=[^=]|={3}/.test(a.base64 as string) && ((a.base64 as string).indexOf('=') === -1 || (a.base64 as string).indexOf('=') >= (a.base64 as string).length - 2) &&
  (a.base64 as string).length / 4 * 3 - ((a.base64 as string).endsWith('==') ? 2 : (a.base64 as string).endsWith('=') ? 1 : 0) === a.size)) return false;
 if (attachments.reduce((s,a) => s + a.size,0) > MAX_PROFILE_LIBRARY_BYTES) return false;
 const fileIds = new Set(attachments.map(a => a.id));
 if (fileIds.size !== attachments.length) return false;
 const profiles = value.profiles;
 if (!profiles.every(p => object(p) && p.schema === 'compas-external-profile/v1' && p.municipalityId === municipalityId &&
  textFields(p,['id','title','period','author','createdAt','summary','text']) && !!p.id && !!p.title &&
  Number.isFinite(Date.parse(p.createdAt as string)) && ['review','validated'].includes(p.status as string) &&
  (p.status !== 'validated' || (string(p.validatedBy) && !!p.validatedBy.trim() && string(p.validatedAt) && Number.isFinite(Date.parse(p.validatedAt)))) &&
  strings(p.attachmentIds) && p.attachmentIds.every(id => fileIds.has(id)) && strings(p.findings) && strings(p.limitations) &&
  Array.isArray(p.results) && p.results.every(isProfileResult) && Array.isArray(p.areas) && p.areas.every(a => object(a) && textFields(a,['id','title','rationale'])) &&
  (p.evidenceVersion === undefined || string(p.evidenceVersion)) && (p.revisionOf === undefined || string(p.revisionOf)) && (p.validatedBy === undefined || string(p.validatedBy)) && (p.validatedAt === undefined || string(p.validatedAt)))) return false;
 const ids = new Set(profiles.map(p => p.id));
 return ids.size === profiles.length && profiles.every(p => !p.revisionOf || (p.revisionOf !== p.id && ids.has(p.revisionOf))) &&
  (value.activeId === undefined || (string(value.activeId) && ids.has(value.activeId)));
}

export function appendExternalProfile(library: ExternalProfileLibrary, profile: ExternalHealthProfile, attachments: ProfileAttachment[], municipalityId: string): ExternalProfileLibrary {
 if (profile.municipalityId !== municipalityId || library.profiles.some(p => p.id === profile.id)) throw new Error('El perfil no pertenece a este ámbito o su versión ya existe.');
 const next = { profiles: [...library.profiles, profile], attachments: [...library.attachments, ...attachments], activeId: profile.id };
 if (!isExternalProfileLibrary(next, municipalityId)) throw new Error('El perfil contiene datos incompatibles o supera el límite de 40 MB de archivos por expediente.');
 return next;
}

/** Strict data import; never takes authority/validation or executable HTML from a package. */
export function readExternalProfilePackage(raw: string, municipalityId: string): Pick<ExternalHealthProfile, 'title'|'period'|'author'|'summary'|'text'|'results'|'findings'|'limitations'|'areas'> {
 const p: unknown = JSON.parse(raw);
 if (!object(p) || p.schema !== 'compas-profile-package/v1' || p.municipalityId !== municipalityId ||
  !textFields(p,['title','period','author','summary','text']) || !(p.title as string).trim() ||
  !strings(p.findings) || !strings(p.limitations) || !Array.isArray(p.results) || !p.results.every(isProfileResult) ||
  !Array.isArray(p.areas) || !p.areas.every(a => object(a) && textFields(a,['id','title','rationale']))) {
  throw new Error('El paquete del perfil no es compatible o pertenece a otro municipio.');
 }
 return {title:p.title as string,period:p.period as string,author:p.author as string,summary:p.summary as string,text:p.text as string,
  results:p.results as ProfileResult[], findings:p.findings,limitations:p.limitations,areas:p.areas as ExternalHealthProfile['areas']};
}

export async function importProfileFile(file: File, municipalityId: string): Promise<{ attachment: ProfileAttachment; content: ReturnType<typeof readExternalProfilePackage>; notice?: string }> {
 if (file.size === 0 || file.size > MAX_PROFILE_FILE_BYTES) throw new Error('Selecciona un archivo no vacío de hasta 20 MB.');
 const extension = file.name.split('.').pop()?.toLowerCase();
 const types: Record<string,string> = {pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain',md:'text/markdown',json:'application/json'};
 if (!extension || !types[extension]) throw new Error('Formatos admitidos: PDF, DOCX, TXT, Markdown o paquete JSON del perfil.');
 const buffer = await file.arrayBuffer(); const bytes = new Uint8Array(buffer);
 if ((extension === 'pdf' && new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') ||
  (extension === 'docx' && (bytes[0] !== 80 || bytes[1] !== 75))) throw new Error('El contenido del archivo no corresponde a su formato.');
 let binary = ''; for (let i=0;i<bytes.length;i+=32768) binary += String.fromCharCode(...bytes.subarray(i,i+32768));
 const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), n => n.toString(16).padStart(2,'0')).join('');
 const attachment: ProfileAttachment = {id:crypto.randomUUID(),name:file.name,mimeType:types[extension],size:file.size,sha256,base64:btoa(binary)};
 let text = ''; let notice: string | undefined;
 if (extension === 'json') return {attachment, content:readExternalProfilePackage(new TextDecoder().decode(bytes),municipalityId)};
 if (extension === 'txt' || extension === 'md') text = new TextDecoder().decode(bytes);
 else try {
  if (extension === 'docx') text = await (await import('../document-ingestion/extractDocxText')).extractDocxText(buffer);
  else text = (await (await import('../../infrastructure/pdf/extractPdfText')).extractPdfText(buffer)).text;
 } catch { notice = 'El original se conserva completo, pero no se pudo extraer su texto. Puedes consultarlo o añadir una transcripción.'; }
 if (!text && !notice) notice = 'Original conservado. No contiene texto extraíble; puedes añadir una transcripción, sin perder el archivo.';
 return {attachment, notice, content:{title:file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g,' '),period:'',author:'',summary:'',text,results:[],findings:[],limitations:[],areas:[]}};
}

export async function profileAttachmentBlob(file: ProfileAttachment): Promise<Blob> {
 const binary = atob(file.base64); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
 const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), n => n.toString(16).padStart(2,'0')).join('');
 if (bytes.length !== file.size || hash !== file.sha256) throw new Error('El archivo no supera la comprobación de integridad.');
 return new Blob([bytes],{type:file.mimeType});
}
