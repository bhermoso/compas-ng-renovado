import type { ExternalHealthProfile, ProfileResult } from '../../domain/health-profile/ExternalHealthProfile';

/**
 * Extracción literal de la fuente histórica «Perfil de Salud Local Zagra»
 * (RELAS, 52 páginas). NO son tasas actualizadas a 2026.
 * Referencia verificable: pp. 29, 32 y 33 del PDF histórico.
 */
const SOURCE = 'Perfil de Salud Local de Zagra (RELAS), diagnóstico histórico, pp. 29, 32–33';
const chronicCaution = 'Dato histórico publicado para 2015. Denominador y ajuste por edad no declarados; no extrapolar a 2026 ni interpretar como diferencias ajustadas.';
type Entry = { id: string; title: string; zagra: number; district: number };
const CHRONIC: readonly Entry[] = [
  {id:'diabetes',title:'Diabetes',zagra:10.36,district:7.01},
  {id:'demencia',title:'Demencia',zagra:4.39,district:3.7},
  {id:'insuficiencia-cardiaca',title:'Insuficiencia cardíaca',zagra:0.44,district:4.84},
  {id:'epoc',title:'EPOC',zagra:4.39,district:3.99},
  {id:'hipertension',title:'Hipertensión arterial',zagra:27.56,district:12.32},
  {id:'tao',title:'Pacientes en anticoagulación (TAO)',zagra:44.8,district:23.3},
];
export const ZAGRA_HISTORICAL_RESULTS: readonly ProfileResult[] = [
  ...CHRONIC.map((r):ProfileResult=>({
    id:'zagra-relas-2015-'+r.id, title:r.title, value:String(r.zagra).replace('.',','), unit:'%',
    source:SOURCE, page:'33', period:'2015',
    caution:r.id==='tao'
      ? chronicCaution+' La población de referencia de TAO es especialmente incierta; NO interpretar como porcentaje de habitantes.'
      : chronicCaution,
    topic:'Morbilidad',scale:'Zagra',temporalContext:'historical',chartValue:r.zagra,
    comparisons:[{label:'Distrito Granada Metropolitano',value:r.district}],
  })),
  {id:'zagra-relas-2015-defunciones',title:'Defunciones',value:'17',unit:'personas',
    source:SOURCE,page:'29',period:'2015',
    caution:'Recuento anual pequeño (9 hombres, 8 mujeres); no inferir tendencia de mortalidad actual.',
    topic:'Mortalidad',scale:'Zagra',temporalContext:'historical',chartValue:17},
  {id:'zagra-relas-2015-tbm',title:'Tasa bruta de mortalidad publicada',value:'18,9',unit:'‰',
    source:SOURCE,page:'29',period:'2015',
    caution:'Tasa bruta no ajustada por edad. La fuente publica Andalucía 8,58 ‰; las poblaciones tienen estructuras distintas.',
    topic:'Mortalidad',scale:'Zagra',temporalContext:'historical',chartValue:18.9,
    comparisons:[{label:'Andalucía',value:8.58}]},
  {id:'zagra-relas-2008-2012-cancer',title:'Incidencia estandarizada de todos los cánceres',
    value:'277,1',unit:'casos por 100.000 habitantes',source:SOURCE,page:'32',
    period:'2008–2012',
    caution:'Serie histórica y población pequeña; no extrapolar a la incidencia actual.',
    topic:'Cáncer',scale:'Zagra',temporalContext:'historical',chartValue:277.1,
    comparisons:[{label:'Provincia de Granada',value:459.3}]},
];

export function prepareZagraHistoricalRevision(
  current: ExternalHealthProfile,
  revisionId: string,
  createdAt: string,
): ExternalHealthProfile {
  if (current.municipalityId.toLowerCase() !== 'zagra')
    throw new Error('La extracción RELAS solo corresponde a Zagra.');
  const existing = new Set(current.results.map(r=>r.id));
  const additions = ZAGRA_HISTORICAL_RESULTS.filter(r=>!existing.has(r.id));
  return {
    ...current,
    id:revisionId,
    createdAt,
    revisionOf:current.id,
    status:'review',
    validatedBy:undefined,
    validatedAt:undefined,
    archivedAt:undefined,
    archivedBy:undefined,
    title:current.title+' · revisión con indicadores históricos RELAS',
    results:[...current.results,...additions],
    limitations:[...new Set([...current.limitations,
      'Indicadores RELAS 2008–2015: evidencia histórica; denominadores de prevalencias no explicitados. No son cifras actuales ni sustituyen un Informe de Salud reciente.'])],
  };
}
