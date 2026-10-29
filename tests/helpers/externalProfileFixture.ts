import type { ExternalHealthProfile } from '../../src/domain/health-profile/ExternalHealthProfile';

/** Fictional values for UI and persistence tests only; never a municipal seed. */
export function externalProfileFixture(municipalityId = 'profile-test'): ExternalHealthProfile {
 return {schema:'compas-external-profile/v1',id:'profile-test-v1',municipalityId,
  title:'Perfil de salud · demostración de pruebas',period:'2026',author:'Equipo de pruebas',createdAt:'2026-10-29T09:00:00Z',status:'review',
  summary:'Documento ficticio para comprobar la presentación, sus fuentes y la conservación de las revisiones.',
  text:'Contenido literal aportado por el equipo.\n\nEste municipio y sus cifras son una prueba de funcionamiento.',
  findings:['La consulta recoge preferencias, sin estimar prevalencias.','Los antecedentes se muestran con su fecha original.'],
  limitations:['Ejemplo ficticio. No representa un diagnóstico ni una población real.'],
  results:[
   {id:'population',title:'Población de referencia',value:'840',unit:'personas',source:'Tabla ficticia de pruebas',page:'Tabla 1',period:'2025',caution:'Ejemplo ficticio.',scale:'Municipal',topic:'Población',temporalContext:'current'},
   {id:'income',title:'Renta media por persona',value:'10.000',unit:'€',source:'Atlas ficticio de pruebas',page:'Tabla 2',period:'2024',caution:'No mezclar años ni escalas.',scale:'Municipal',topic:'Condiciones de vida',chartValue:10000,comparison:{label:'Provincia · ejemplo ficticio',value:13000}},
   {id:'history',title:'Indicador sanitario histórico',value:'12',unit:'%',source:'Informe ficticio antiguo',page:'p. 4',period:'2015',caution:'Denominador no documentado; no es una estimación actual.',scale:'Municipal',topic:'Antecedentes',temporalContext:'historical'},
  ],areas:[{id:'area-test',title:'Propuesta aportada para deliberación',rationale:'Texto de la propuesta del equipo; sin aprobación institucional.'}],attachmentIds:[]};
}
