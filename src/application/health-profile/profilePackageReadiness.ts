/**
 * Diagnóstico de suficiencia del paquete del Perfil de Salud Local.
 * Solo lectura: no convierte ausencia en cero, no deriva indicadores
 * epidemiológicos de textos y no aprueba contenido automáticamente.
 */
import type { MunicipalityWorkspace } from '../../domain/workspace';
import { parseProfileStructure } from './profileStructure';

export type ProfilePackageStage = 'sin-perfil' | 'documental' | 'estructurado';
export interface ProfilePackageReadiness {
 stage: ProfilePackageStage;
 hasOriginal: boolean;
 originalFormats: string[];
 hasPackageJson: boolean;
 hasText: boolean;
 hasFourDataPages: boolean;
 indicators: number;
 numericIndicators: number;
 withSource: number;
 withPeriod: number;
 withPage: number;
 withDenominator: number;
 withComparators: number;
 studiesLoaded: string[];
 prioritisationStudy: boolean;
 prioritisationAdopted: boolean;
 warnings: string[];
}
const STUDIES = [
 ['ibseStudy','IBSE'],['dukeStudy','DUKE'],['predimedStudy','PREDIMED'],
 ['sf12Study','SF-12'],['suenoStudy','Sueño'],['cageStudy','CAGE'],
 ['auditcStudy','AUDIT-C'],['ipaqStudy','IPAQ'],['ghq12Study','GHQ-12'],
 ['phq9Study','PHQ-9'],['psqiStudy','PSQI'],['fagerstromStudy','Fagerström'],
 ['sbqStudy','SBQ'],
] as const;

export function inspectProfilePackage(workspace: MunicipalityWorkspace): ProfilePackageReadiness {
 const lib = workspace.externalProfileLibrary;
 const profile = lib?.profiles.find(p=>p.id===lib.activeId);
 const originals = (profile?.attachmentIds??[]).flatMap(id=>{
  const f=lib?.attachments.find(a=>a.id===id);
  return f?[f]:[];
 });
 const originalFormats=originals.filter(f=>!(/\.json$/i.test(f.name)||f.mimeType==='application/json'))
  .map(f=>f.name.split('.').pop()?.toUpperCase()||'OTRO');
 const text=profile?.text.trim()??'';
 const indicators=profile?.results??[];
 const structure=text?parseProfileStructure(text):undefined;
 const data=structure?.dataPages;
 const hasFourDataPages=Boolean(data && data.cover.length && data.whoLivesHere.length &&
  data.healthPanel.length && (data.inequality.intro.length||data.inequality.blocks.length));
 const studiesLoaded=STUDIES.filter(([key])=>Boolean(workspace[key])).map(([,label])=>label);
 const hasPackageJson=originals.some(f=>f.mimeType==='application/json');
 const hasOriginal=originalFormats.length>0;
 const warnings:string[]=[];
 if(!profile) warnings.push('No hay un perfil externo vigente. No equivale a ausencia de fuentes diagnósticas.');
 else {
  if(!hasOriginal)warnings.push('La versión no vincula documento original PDF, DOCX, TXT o Markdown.');
  if(!hasPackageJson)warnings.push('No se conserva archivo JSON de paquete; los resultados pueden existir internamente.');
  if(!text)warnings.push('La versión no conserva texto para lectura narrativa.');
  if(!indicators.length)warnings.push('No hay indicadores estructurados para representar tablas o gráficos.');
  if(indicators.length&&!hasFourDataPages)warnings.push('Las cuatro páginas de datos no están reconocidas completamente en el texto; se presenta el modo alternativo.');
  if(indicators.some(r=>!r.source.trim()||!r.period.trim()))warnings.push('Algunos indicadores carecen de fuente o periodo declarados.');
 }
 return {
  stage:!profile?'sin-perfil':indicators.length?'estructurado':'documental',
  hasOriginal,originalFormats,hasPackageJson,hasText:Boolean(text),hasFourDataPages,
  indicators:indicators.length,
  numericIndicators:indicators.filter(r=>r.chartValue!==undefined).length,
  withSource:indicators.filter(r=>Boolean(r.source.trim())).length,
  withPeriod:indicators.filter(r=>Boolean(r.period.trim())).length,
  withPage:indicators.filter(r=>Boolean(r.page.trim())).length,
  withDenominator:indicators.filter(r=>Boolean(r.denominator?.trim())).length,
  withComparators:indicators.filter(r=>Boolean(r.comparison||r.comparisons?.length)).length,
  studiesLoaded,
  prioritisationStudy:Boolean(workspace.thematicPrioritisationStudy),
  prioritisationAdopted:Boolean(workspace.thematicPrioritisation),
  warnings,
 };
}
