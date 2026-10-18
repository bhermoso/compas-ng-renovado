import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import { documentAccessUrl, documentDownloadFileName, isPdfDocumentAccess } from '../src/ui/components/documentAccessUtils';
import { DocumentRepositoryPanel } from '../src/ui/components/DocumentRepositoryPanel';
import { DocumentAccess } from '../src/ui/components/DocumentAccess';
import type { MunicipalDocumentRepository } from '../src/domain/repository';

describe('Acceso a documentos del repositorio', () => {
 const repository = seed.repository as MunicipalDocumentRepository;
 it('ofrece acceso a los tres PDF ya referenciados en los expedientes', () => {
  const documents = repository.documents.filter(d => d.kind === 'strategic-framework');
  expect(documents).toHaveLength(3);
  for (const document of documents) {
   expect(documentAccessUrl(document.source.url)).toMatch(/\.pdf/);
   expect(isPdfDocumentAccess(document.source.url)).toBe(true);
  }
  const html = renderToStaticMarkup(<DocumentRepositoryPanel repository={repository}/>);
  expect(html.match(/Descargar PDF original/g)?.length).toBeGreaterThanOrEqual(4);
  expect(html).toContain('Abrir en nueva pestaña');
  expect(html).not.toContain('Todos los documentos del expediente');
  expect(html).toContain('Otras fuentes documentales');
 });
 it('lista cada documento en un solo lugar',()=>{
  const html = renderToStaticMarkup(<DocumentRepositoryPanel repository={repository}/>);
  for (const document of repository.documents) expect(html.split(`>${document.title}</h3>`).length - 1).toBe(1);
 });
 it('nombra de forma inequívoca el Informe de Salud descargable desde el Perfil', () => {
  const report = repository.documents.find(d => d.kind === 'health-report')!;
  const html = renderToStaticMarkup(<DocumentAccess document={report} documentLabel="Informe de Salud original"/>);
  expect(html).toContain('Descargar Informe de Salud original');
  expect(html).toContain('Abrir Informe de Salud original en nueva pestaña');
  expect(html).toContain('descarga del Informe de Salud original');
  expect(html).not.toContain('>Descargar PDF original<');
 });
 it('no convierte rutas desconocidas o esquemas ejecutables en enlaces', () => {
  for(const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/a.pdf', 'docs/desconocido.pdf', '__proto__', undefined]) expect(documentAccessUrl(url)).toBeUndefined();
  expect(documentAccessUrl('https://example.org/doc.pdf')).toBe('https://example.org/doc.pdf');
  expect(isPdfDocumentAccess('https://example.org/doc.pdf')).toBe(true);
  expect(documentDownloadFileName('docs/source-material/health-reports/informe.pdf', 'Informe')).toBe('informe.pdf');
 });
 it('distingue una referencia sin archivo y permite leer texto conservado', () => {
  const doc = {...repository.documents.find(d => d.kind === 'strategic-framework')!,source:{},sourceText:'Texto de referencia'};
  const html = renderToStaticMarkup(<DocumentRepositoryPanel repository={{...repository,documents:[doc]}}/>);
  expect(html).toContain('Adjuntar el archivo original');
  expect(html).toContain('Consultar texto conservado');
  expect(html).not.toContain('doc-repo__open');
 });
});
