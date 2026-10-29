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
