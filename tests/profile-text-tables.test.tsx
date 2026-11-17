import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { profileTextBlocks } from '../src/application/health-profile/profileTextBlocks';
import { ProfileText } from '../src/ui/components/ProfileText';

describe('Tablas literales de perfiles externos',()=>{
 it('conserva orden, cifras y citas en filas consecutivas separadas por párrafos',()=>{
  const lines=['Contexto [1].','Indicador | Valor | Periodo','Asma | 1.508,96 | 2024','Renta | 9.290 | 2024','Nota de la fuente.'];
  const blocks=profileTextBlocks(lines);
  expect(blocks).toEqual([{kind:'paragraph',text:lines[0]},{kind:'table',rows:[['Indicador','Valor','Periodo'],['Asma','1.508,96','2024'],['Renta','9.290','2024']]},{kind:'paragraph',text:lines[4]}]);
  const html=renderToStaticMarkup(<ProfileText paragraphs={lines}/>);
  expect(html).toContain('<th scope="col">Periodo</th>');expect(html).toMatch(/<td[^>]*>1\.508,96<\/td>/);expect(html).toContain('Contexto [1].');
 });
 it('reconoce filas separadas por líneas vacías dentro de un bloque del perfil',()=>{
  const text='Sección | Renta por persona | Mediana | Bajo umbral | Unipersonales\n\n01001 | 12.907 | 17.150 | 23,6 | 27,4\n\n01002 | 11.847 | 16.450 | 26,1 | 23,8\n\nFuente: Atlas de Renta 2024.';
  const html=renderToStaticMarkup(<ProfileText paragraphs={[text]}/>);
  expect(html).toContain('<th scope="col">Sección</th>');
  expect(html).toMatch(/<td[^>]*>01001<\/td>/);expect(html).toMatch(/<td[^>]*>23,6<\/td>/);
  expect(html).toContain('Fuente: Atlas de Renta 2024.');
  expect(html).not.toContain('01001 | 12.907');
 });
 it('no inventa columnas para prosa, filas desiguales o una sola línea',()=>{
  expect(profileTextBlocks(['Una nota | una alternativa','Texto normal','A | B','1 | 2 | 3'])).toEqual(['Una nota | una alternativa','Texto normal','A | B','1 | 2 | 3'].map(text=>({kind:'paragraph',text})));
 });
 it('admite filas multilínea y separador Markdown sin perder celdas vacías ni interpretar HTML',()=>{
  const html=renderToStaticMarkup(<ProfileText paragraphs={['| Fuente | Valor |\n| --- | ---: |\n| <script> |  |']}/>);
  expect(html).toContain('&lt;script&gt;');expect(html).toMatch(/<td[^>]*><\/td>/);expect(html).not.toContain('<script>');expect(html).not.toContain('---:');
 });
});
