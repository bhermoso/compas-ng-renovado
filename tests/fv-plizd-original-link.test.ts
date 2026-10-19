import { describe, expect, it } from 'vitest';
import { linkFuenteVaquerosPlizdOriginal, FV_PLIZD_DOCUMENT_ID, FV_PLIZD_PDF_SOURCE } from '../src/application/workspace/linkFuenteVaquerosPlizdOriginal';
import { bundledDocuments } from '../src/ui/components/documentAccessUtils';

const ws = (id: string, url?: string): any => ({
  municipality: { identity: { id } },
  repository: { documents: [{ id: FV_PLIZD_DOCUMENT_ID, title: 't', source: { organization: 'Diputación de Granada', url } }] },
});

describe('PLIZD Fuente Vaqueros: enlace al original', () => {
  it('enlaza el original y conserva el resto', () => {
    const out = linkFuenteVaquerosPlizdOriginal(ws('fuente-vaqueros'));
    expect(out.repository.documents[0].source.url).toBe(FV_PLIZD_PDF_SOURCE);
    expect(out.repository.documents[0].source.organization).toBe('Diputación de Granada');
  });
  it('es idempotente y no toca otros municipios', () => {
    const once = linkFuenteVaquerosPlizdOriginal(ws('fuente-vaqueros'));
    expect(linkFuenteVaquerosPlizdOriginal(once)).toBe(once);
    const other = ws('atarfe');
    expect(linkFuenteVaquerosPlizdOriginal(other)).toBe(other);
  });
  it('el PDF está registrado como documento empaquetado', () => {
    expect(bundledDocuments[FV_PLIZD_PDF_SOURCE]).toBeTruthy();
  });
});
