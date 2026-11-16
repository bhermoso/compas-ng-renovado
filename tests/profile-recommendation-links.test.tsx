import {describe,it,expect} from 'vitest';
import {parseProfileStructure} from '../src/application/health-profile/profileStructure';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProfileResultsDashboard} from '../src/ui/components/ProfileResultsDashboard';
import {externalProfileFixture} from './helpers/externalProfileFixture';
const text=(reco:string)=>'1. Punto de partida\n\nContexto.\n\n2. Conclusiones\n\nC1. Salud y participación local.\n\nC2. Recursos comunitarios disponibles.\n\n5. Recomendaciones\n\n'+reco;
describe('Vínculos explícitos de recomendaciones externas',()=>{
 it('reconoce Fundamento y el tipo declarado en el párrafo de desarrollo',()=>{
  const s=parseProfileStructure(text('R1. Bienestar emocional\n\nAbordar. Considerar el bienestar emocional en la priorización.\n\nFundamento: C1, C2.'));
  expect(s.recommendations).toHaveLength(1);expect(s.recommendations[0]).toMatchObject({id:'R1',type:'Abordar',derivesFrom:'C1, C2'});
  expect(s.recommendations[0].text).toContain('Considerar el bienestar emocional');expect(s.recommendations[0].text).not.toContain('Fundamento:');
  const p=externalProfileFixture('alfacar');p.text=text('R1. Bienestar emocional\n\nAbordar. Considerar el bienestar emocional en la priorización.\n\nFundamento: C1, C2.');
  const html=renderToStaticMarkup(<ProfileResultsDashboard profile={p} municipalityName="Alfacar" structure={s}/>);
  expect(html).toContain('R1 · Abordar');expect(html).not.toContain('No consta recomendación vinculada expresamente.');
 });
 it('reconoce el tipo y Deriva de dentro de una recomendación en una sola línea',()=>{
  const s=parseProfileStructure(text('R1. Contrastar. Recoger la perspectiva de jóvenes. Deriva de C1, C2.'));
  expect(s.recommendations[0]).toMatchObject({type:'Contrastar',derivesFrom:'C1, C2',text:'Recoger la perspectiva de jóvenes.'});
 });
 it('no convierte una mera cita de C1 en una derivación declarada',()=>{
  const s=parseProfileStructure(text('R1. Recoger las aportaciones locales.\n\nUna nota menciona [C1] sin declarar un vínculo.'));
  expect(s.recommendations[0].derivesFrom).toBeUndefined();
 });
});
