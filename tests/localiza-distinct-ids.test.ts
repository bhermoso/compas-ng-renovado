import { describe,expect,it } from 'vitest';
import { createEvidenceStore } from '../src/domain/evidence';
import { createMunicipalDocumentRepository,addMunicipalDocument } from '../src/domain/repository';
import { transformDocumentToEvidence,localizaSaludResourceLines } from '../src/application/evidence-pipeline/DocumentToEvidencePipeline';
import { readLocalizaAssets } from '../src/application/localiza-assets';

describe('Localiza Salud: una ficha, un activo, aunque coincida el nombre',()=>{
 it('conserva las dos fichas del CPA y el taller de sueño como tres átomos diferentes',()=>{
  const municipio='atarfe-test';
  const lines=[
   ['Centro de Participación Activa de Atarfe','Actividades del registro 61585','Cualquiera','Mayores de 64 años','Envejecimiento activo','Granada','Atarfe','https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61585'].join('\t'),
   ['Centro de Participación Activa de Atarfe','Actividades del registro 61419','Cualquiera','Otros','Cultura y ocio','Granada','Atarfe','https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61419'].join('\t'),
   ['Taller de sueño saludable','Talleres de sueño','Cualquiera','Población adulta','Bienestar emocional','Granada','Atarfe','https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=63552'].join('\t'),
  ];
  const repository=addMunicipalDocument(createMunicipalDocumentRepository({municipalityId:municipio}),{
   id:'inventario',kind:'localiza-salud',title:'Activos de Atarfe',sourceText:lines.join('\n')
  });
  const document=repository.documents[0];
  const result=transformDocumentToEvidence({store:createEvidenceStore(municipio),document,plainText:lines.join('\n')});
  expect(localizaSaludResourceLines(document.sourceText??'')).toHaveLength(3);
  expect(result.store.atoms).toHaveLength(3);
  expect(result.store.atoms.map(a=>a.id)).toEqual(['inventario-atom-1','inventario-atom-2','inventario-atom-3']);
  const parsed=readLocalizaAssets(result.store.atoms);
  expect(parsed.records).toHaveLength(3);
  expect(parsed.records[0].nombre).toBe(parsed.records[1].nombre);
  expect(parsed.records[0].descripcion).not.toBe(parsed.records[1].descripcion);
 });
});
