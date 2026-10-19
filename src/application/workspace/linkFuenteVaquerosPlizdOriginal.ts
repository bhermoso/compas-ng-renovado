import type { MunicipalityWorkspace } from '../../domain/workspace';

export const FV_PLIZD_DOCUMENT_ID = 'doc-territorial-fuente-vaqueros-plizd-2024';
export const FV_PLIZD_PDF_SOURCE = 'docs/source-material/territorial-documentation/PLIZD_FUENTE_VAQUEROS_2024.pdf';

/** Enlaza el PDF original (252 páginas) al documento ya cargado. No altera texto, ciclo ni estado. */
export function linkFuenteVaquerosPlizdOriginal(workspace: MunicipalityWorkspace): MunicipalityWorkspace {
  if (workspace.municipality.identity.id !== 'fuente-vaqueros') return workspace;
  const doc = workspace.repository.documents.find(d => d.id === FV_PLIZD_DOCUMENT_ID);
  if (!doc || doc.source?.url === FV_PLIZD_PDF_SOURCE) return workspace;
  return {
    ...workspace,
    repository: {
      ...workspace.repository,
      documents: workspace.repository.documents.map(d =>
        d.id === FV_PLIZD_DOCUMENT_ID ? { ...d, source: { ...d.source, url: FV_PLIZD_PDF_SOURCE } } : d),
    },
  };
}
