import { describe, expect, it } from 'vitest';
import { parseThematicPrioritisationCSV } from '../src/application/thematic-prioritisation/ThematicPrioritisationCSVParser';

describe('Priorización ciudadana: papeletas parciales', () => {
  it('cuenta cualquier papeleta con al menos una temática, sin exigir cierre REDCap ni edad/sexo', () => {
    const csv = [
      'record_id,papeleta_pri_tematica_complete,sexo,edad,temas___1,temas___2,temas___3',
      '1,2,1,40,1,0,1',
      '2,0,,,1,0,0',
      '3,1,,,0,1,0',
      '4,0,,,0,0,0',
      '5,2,2,50,0,0,1',
    ].join('\n');
    const { partialStudy: result } = parseThematicPrioritisationCSV(csv, 'zagra.csv');
    expect(result.totalRecords).toBe(5);
    expect(result.completeRecords).toBe(2);
    expect(result.validVoteRecords).toBe(4);
    expect(result.ranking.find(x => x.topicId === 'alimentacion')).toMatchObject({ votes: 2, pct: 50 });
    expect(result.ranking.find(x => x.topicId === 'actividad-fisica')).toMatchObject({ votes: 1, pct: 25 });
    expect(result.ranking.find(x => x.topicId === 'bienestar-emocional')).toMatchObject({ votes: 2, pct: 50 });
  });
});

describe('Regresión de priorización — integridad de agregados', () => {
  it('preserva el ranking y los porcentajes históricos cuando todas las papeletas tienen votos y están completas', () => {
    const csv = [
      'record_id,papeleta_pri_tematica_complete,temas___1,temas___2,temas___3',
      '1,2,1,0,1',
      '2,2,0,1,1',
      '3,2,1,0,0',
    ].join('\n');
    const { partialStudy: result } = parseThematicPrioritisationCSV(csv, 'historico.csv');
    expect(result.totalRecords).toBe(3);
    expect(result.completeRecords).toBe(3);
    expect(result.validVoteRecords).toBe(3);
    expect(result.ranking.find(x => x.topicId === 'alimentacion')).toMatchObject({ votes: 2, pct: 66.7 });
    expect(result.ranking.find(x => x.topicId === 'bienestar-emocional')).toMatchObject({ votes: 2, pct: 66.7 });
    expect(result.ranking.find(x => x.topicId === 'actividad-fisica')).toMatchObject({ votes: 1, pct: 33.3 });
  });

  it('no convierte registros sin selección en papeletas válidas', () => {
    const csv = [
      'record_id,papeleta_pri_tematica_complete,temas___1,temas___2',
      '1,2,0,0',
      '2,0,0,0',
    ].join('\n');
    const { partialStudy: result } = parseThematicPrioritisationCSV(csv, 'sin-votos.csv');
    expect(result.totalRecords).toBe(2);
    expect(result.completeRecords).toBe(1);
    expect(result.validVoteRecords).toBe(0);
    expect(result.ranking.every(x => x.votes === 0 && x.pct === 0)).toBe(true);
    expect(result.methodologicalCautions.join(' ')).toContain('No se encontraron papeletas');
  });

  it('no confunde suma de selecciones con número de papeletas', () => {
    const csv = [
      'record_id,papeleta_pri_tematica_complete,temas___1,temas___2',
      '1,2,1,1',
      '2,0,1,1',
    ].join('\n');
    const { partialStudy: result } = parseThematicPrioritisationCSV(csv, 'multiseleccion.csv');
    expect(result.validVoteRecords).toBe(2);
    expect(result.ranking.find(x => x.topicId === 'alimentacion')?.pct).toBe(100);
    expect(result.ranking.find(x => x.topicId === 'actividad-fisica')?.pct).toBe(100);
  });
});
