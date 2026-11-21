import { describe, it, expect } from 'vitest';
import { PLANNING_INSTRUMENTS } from '../src/domain/action-plan-catalog/PlanningInstruments';
import { ZAIDIN_AGING_PROPOSAL } from '../src/domain/action-plan-catalog/PlanPreparationDraft';
import { EMOTIONAL_WELLBEING_MODULE } from '../src/domain/action-plan-catalog/ActionPlanCatalog';
describe('Catálogo de preparación de instrumentos',()=>{
 it('cubre todos los objetivos y no introduce referencias inexistentes',()=>{
  const objectives=ZAIDIN_AGING_PROPOSAL.generalObjectives.flatMap(g=>g.specificObjectives.map(o=>o.code));
  // Envejecimiento: el catálogo cubre todos sus objetivos específicos.
  const covered=new Set(PLANNING_INSTRUMENTS.flatMap(i=>i.objectives).filter(code=>code.startsWith('ENV-')));
  expect([...covered].sort()).toEqual([...objectives].sort());
  // Bienestar emocional: solo cita objetivos que existen en su módulo.
  const bem=new Set(EMOTIONAL_WELLBEING_MODULE.generalObjectives.flatMap(g=>g.specificObjectives.map(o=>o.code)));
  for(const code of PLANNING_INSTRUMENTS.flatMap(i=>i.objectives).filter(code=>code.startsWith('BEM-'))) expect(bem.has(code)).toBe(true);
  expect(PLANNING_INSTRUMENTS.flatMap(i=>i.objectives).every(code=>code.startsWith('ENV-')||code.startsWith('BEM-'))).toBe(true);
  expect(new Set(PLANNING_INSTRUMENTS.map(i=>i.id)).size).toBe(PLANNING_INSTRUMENTS.length);
 });
 it('identifica procedencia y limitaciones sin incorporar datos ni puntuaciones',()=>{
  for(const instrument of PLANNING_INSTRUMENTS){
   expect(instrument.population).toBeTruthy();expect(instrument.limitation).toBeTruthy();
   if(instrument.kind!=='Registro o preguntas por desarrollar') expect(instrument.reference).toMatch(/^https:\/\//);
   if(instrument.kind==='Instrumento de la estrategia') expect(instrument.evidence).toMatch(/^(PESMA-A|EPVSA), (OE|indicador)/);
   expect(instrument).not.toHaveProperty('responses');expect(instrument).not.toHaveProperty('score');
  }
 });
});
