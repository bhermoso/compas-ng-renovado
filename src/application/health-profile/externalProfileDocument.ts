import type { ExternalHealthProfile } from '../../domain/health-profile/ExternalHealthProfile';
import type { PSLCDocumentModel, PSLCDocumentSection } from '../psl-c-export/pslcDocumentModel';
import { parseProfileStructure } from './profileStructure';

/** Mechanical layout of supplied content. No diagnostic inference or generated narrative. */
export function externalProfileDocument(profile: ExternalHealthProfile, municipalityName: string): PSLCDocumentModel {
 const sections: PSLCDocumentSection[] = [];
 if (profile.summary) sections.push({title:'Lectura de conjunto',level:1,paragraphs:[profile.summary]});
 if (profile.findings.some(Boolean)) sections.push({title:'Principales hallazgos',level:1,paragraphs:profile.findings.filter(Boolean)});
 for (const result of profile.results) sections.push({title:result.title,level:2,paragraphs:[
  `${result.value} ${result.unit}`.trim(),
  `Fuente: ${result.source}${result.page ? ` · ${result.page}` : ''}`,
  `Periodo: ${result.period || 'No indicado'} · Ámbito: ${result.scale || 'No indicado'}${result.denominator ? ` · Base: ${result.denominator}` : ''}`,
  ...(result.comparison ? [`Referencia ${result.comparison.label}: ${result.comparison.value} ${result.unit}`] : []),
  ...(result.caution ? [result.caution] : []),
 ]});
 if (profile.text) {
  // El texto se maqueta por sus apartados reconocidos; si no hay estructura, en un único bloque.
  const structure = parseProfileStructure(profile.text);
  const titled = structure.sections.filter(s => s.title !== 'Inicio');
  if (titled.length >= 2) {
   sections.push({title:'Texto del perfil · esta revisión',level:1,paragraphs:structure.sections.find(s => s.title === 'Inicio')?.paragraphs ?? []});
   for (const s of titled) sections.push({title:s.title,level:2,paragraphs:s.paragraphs});
  } else sections.push({title:'Texto del perfil · esta revisión',level:1,paragraphs:profile.text.split(/\n\s*\n/).filter(Boolean)});
 }
 if (profile.limitations.some(Boolean)) sections.push({title:'Limitaciones y cautelas',level:1,paragraphs:profile.limitations.filter(Boolean)});
 if (profile.areas.length) sections.push({title:'Áreas propuestas para la deliberación',level:1,paragraphs:profile.areas.flatMap(a=>[a.title,...(a.rationale?[a.rationale]:[])])});
 return {title:profile.title,subtitle:`Perfil de Salud Local · ${municipalityName}`,portada:[
  profile.period || 'Periodo no declarado',`Autoría del contenido: ${profile.author || 'No declarada'}`,
  `Versión: ${profile.id} · ${profile.createdAt}`,
  profile.status === 'validated' ? `Validación técnica: ${profile.validatedBy} · ${profile.validatedAt}` : 'En revisión · sin validación técnica registrada',
  'Contenido elaborado fuera de COMPÁS. Maquetación de esta revisión; los archivos originales se conservan por separado.',
 ],sections,fileName:`perfil-${profile.municipalityId.replace(/[^a-z0-9-]/gi,'-')}-${profile.id.replace(/[^a-z0-9-]/gi,'-')}.docx`};
}
