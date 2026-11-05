import {describe,expect,it} from 'vitest';
import type {MunicipalityWorkspace} from '../src/domain/workspace';
import {inspectProfilePackage} from '../src/application/health-profile/profilePackageReadiness';
import {externalProfileFixture} from './helpers/externalProfileFixture';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';

function fixture(){
 const workspace=structuredClone(seed) as unknown as MunicipalityWorkspace;
 workspace.municipality.identity.id='prueba';
 return workspace;
}

describe('suficiencia documental de perfiles externos, sin inferencias',()=>{
 it('un expediente con IBSE pero sin perfil no se interpreta como expediente vacío',()=>{
  const w=fixture();
  w.externalProfileLibrary=undefined;
  w.ibseStudy={id:'ibse-de-prueba'} as MunicipalityWorkspace['ibseStudy'];
  const result=inspectProfilePackage(w);
  expect(result.stage).toBe('sin-perfil');
  expect(result.studiesLoaded).toContain('IBSE');
  expect(result.indicators).toBe(0);
 });
 it('perfil documental sin resultados mantiene la lectura y declara la limitación',()=>{
  const w=fixture();
  const p={...externalProfileFixture('prueba'),results:[]};
  w.externalProfileLibrary={profiles:[p],attachments:[],activeId:p.id};
  const result=inspectProfilePackage(w);
  expect(result.stage).toBe('documental');
  expect(result.hasText).toBe(true);
  expect(result.hasFourDataPages).toBe(false);
  expect(result.warnings.join(' ')).toContain('indicadores estructurados');
 });
 it('un perfil con resultados estructurados no requiere inventar cuatro páginas',()=>{
  const w=fixture(),p=externalProfileFixture('prueba');
  w.externalProfileLibrary={profiles:[p],attachments:[],activeId:p.id};
  const result=inspectProfilePackage(w);
  expect(result.stage).toBe('estructurado');
  expect(result.indicators).toBe(3);
  expect(result.numericIndicators).toBe(1);
  expect(result.withComparators).toBe(1);
  expect(result.hasFourDataPages).toBe(false);
 });
});
