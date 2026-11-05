import {describe,expect,it} from 'vitest';
import type {ExternalHealthProfile} from '../src/domain/health-profile/ExternalHealthProfile';
import {prepareZagraHistoricalRevision,ZAGRA_HISTORICAL_RESULTS} from '../src/application/health-profile/zagraHistoricalEvidence';

const current:ExternalHealthProfile = {
 schema:'compas-external-profile/v1',id:'perfil-actual',municipalityId:'zagra',
 title:'Perfil de Zagra',period:'2026',author:'Equipo',createdAt:'2026-10-26T00:00:00Z',
 status:'validated',validatedBy:'Administrador',validatedAt:'2026-10-27T00:00:00Z',
 summary:'Perfil existente',text:'Narrativa vigente',results:[],findings:[],limitations:[],
 areas:[],attachmentIds:[],
};
describe('Revisión documentada RELAS Zagra sin sustitución',()=>{
 it('conserva la versión original, la narrativa y la validación precedente',()=>{
  const copy=structuredClone(current);
  const next=prepareZagraHistoricalRevision(current,'revision-1','2026-11-05T00:00:00Z');
  expect(current).toEqual(copy);
  expect(next.id).toBe('revision-1');
  expect(next.revisionOf).toBe(current.id);
  expect(next.status).toBe('review');
  expect(next.validatedAt).toBeUndefined();
  expect(next.text).toBe(current.text);
  expect(next.results).toHaveLength(9);
 });
 it('es idempotente por identificador y no mezcla indicadores ajenos',()=>{
  const once=prepareZagraHistoricalRevision(current,'revision-1','2026-11-05T00:00:00Z');
  const twice=prepareZagraHistoricalRevision(once,'revision-2','2026-11-05T00:00:00Z');
  expect(twice.results).toHaveLength(9);
  expect(()=>prepareZagraHistoricalRevision({...current,municipalityId:'loja'},'x','2026-11-05T00:00:00Z')).toThrow();
 });
 it('todos los indicadores indican periodo y página, sin declararse actuales',()=>{
  expect(ZAGRA_HISTORICAL_RESULTS).toHaveLength(9);
  expect(ZAGRA_HISTORICAL_RESULTS.every(r=>r.source.includes('Zagra')&&r.page&&r.period&&r.caution&&r.temporalContext==='historical')).toBe(true);
  expect(ZAGRA_HISTORICAL_RESULTS.find(r=>r.id.endsWith('tao'))?.caution).toContain('NO interpretar');
 });
});
