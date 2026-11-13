import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { profileTextBlocks } from '../src/application/health-profile/profileTextBlocks';
import { ProfileText } from '../src/ui/components/ProfileText';
import { ProfileResultsDashboard } from '../src/ui/components/ProfileResultsDashboard';
import { externalProfileFixture } from './helpers/externalProfileFixture';
import { parseProfileStructure } from '../src/application/health-profile/profileStructure';

describe('Tablas literales de perfiles externos',()=>{
 it('conserva orden, cifras y citas en filas consecutivas separadas por párrafos',()=>{
  const lines=['Contexto [1].','Indicador | Valor | Periodo','Asma | 1.508,96 | 2024','Renta | 9.290 | 2024','Nota de la fuente.'];
  const blocks=profileTextBlocks(lines);
  expect(blocks).toEqual([{kind:'paragraph',text:lines[0]},{kind:'table',rows:[['Indicador','Valor','Periodo'],['Asma','1.508,96','2024'],['Renta','9.290','2024']]},{kind:'paragraph',text:lines[4]}]);
  const html=renderToStaticMarkup(<ProfileText paragraphs={lines}/>);
  expect(html).toContain('<th scope="col">Periodo</th>');expect(html).toContain('<td>1.508,96</td>');expect(html).toContain('Contexto [1].');
 });
 it('no inventa columnas para prosa, filas desiguales o una sola línea',()=>{
  expect(profileTextBlocks(['Una nota | una alternativa','Texto normal','A | B','1 | 2 | 3'])).toEqual(['Una nota | una alternativa','Texto normal','A | B','1 | 2 | 3'].map(text=>({kind:'paragraph',text})));
 });
 it('admite filas multilínea y separador Markdown sin perder celdas vacías ni interpretar HTML',()=>{
  const html=renderToStaticMarkup(<ProfileText paragraphs={['| Fuente | Valor |\n| --- | ---: |\n| <script> |  |']}/>);
  expect(html).toContain('&lt;script&gt;');expect(html).toContain('<td></td>');expect(html).not.toContain('<script>');expect(html).not.toContain('---:');
 });
 it('no atribuye al comparador de hombres la unidad por mujeres ni lo denomina antes',()=>{
  const p=externalProfileFixture('atarfe');
  p.text='Atarfe en datos\n\nResumen. Datos [1].\n\nComunidad. Recursos [1].\n\nSalud. Salud [1].\n\nDesigualdades. Datos [1].\n\nQuién vive aquí\n\nPoblación [1].\n\nPanel de salud\n\nSalud [1].\n\nDesigualdad\n\nDatos [1].';
  p.results=[{id:'ansiedad-m',title:'Ansiedad mujeres',value:'1.522,92',unit:'casos por 10.000 mujeres',chartValue:1522.92,source:'Informe',page:'Tabla 6',period:'2024',caution:'',comparisons:[{label:'Atarfe, hombres',value:726.08}]}];
  const html=renderToStaticMarkup(<ProfileResultsDashboard profile={p} municipalityName="Atarfe" structure={parseProfileStructure(p.text)}/>);
  expect(html).toContain('Atarfe, hombres: 726,08');expect(html).not.toContain('726,08 casos por 10.000 mujeres');expect(html).not.toContain('>Antes<');expect(html).toContain('Otras referencias');
 });
});
