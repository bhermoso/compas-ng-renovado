import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { MunicipalityWorkspace } from '../../domain/workspace/MunicipalityWorkspace';
import type { DocumentKind, MunicipalDocument } from '../../domain/repository';
import { DocumentAccess } from './DocumentAccess.tsx';
import { DocumentOriginalManagementContext } from './DocumentOriginalManagement';
import { resolveDocumentReference, type DocumentReferenceTarget } from './documentReferenceResolver';

type Reference = DocumentReferenceTarget & { kinds?: DocumentKind[] };
/** Abre la ficha si hay un único documento o el listado cuando existen varias versiones. */
export function DocumentCollectionReference({ children, kinds, className }: { children: ReactNode; kinds: DocumentKind[]; className?: string }) {
  const open = useContext(DocumentationContext);
  if (!open) return <>{children}</>;
  return <button type="button" className={className ?? 'document-reference'} onClick={() => open({ kinds })}>{children}</button>;
}
const DocumentationContext = createContext<((reference: Reference) => void) | null>(null);

export function DocumentReference({ children, documentId, fileName }: Reference & { children: ReactNode }) {
  const open = useContext(DocumentationContext);
  if (!open) return <>{children}</>;
  return <button type="button" className="document-reference" onClick={() => open({ documentId, fileName })}>{children}</button>;
}

export function DocumentationProvider({ workspace, children, canWrite = false, onStoreOriginal, onCreateRevision, onArchiveDocument, onDeleteDocument }: { workspace: MunicipalityWorkspace; children: ReactNode; canWrite?: boolean; onStoreOriginal?: (documentId: string, file: File) => Promise<void>; onCreateRevision?: (documentId: string, file: File) => Promise<void>; onArchiveDocument?: (documentId: string) => Promise<void>; onDeleteDocument?: (documentId: string) => Promise<boolean> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reference, setReference] = useState<Reference | null>(null);
  const [query, setQuery] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const documents = workspace.repository.documents;
  const matches = reference?.kinds?.length
    ? documents.filter(d => reference.kinds!.includes(d.kind))
    : reference ? resolveDocumentReference(documents, reference) : [];
  const selected = matches.length === 1 ? matches[0] : undefined;
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchable = reference?.kinds?.length ? matches : documents;
  const filtered = searchable.filter(d => normalize(`${d.title} ${d.sourceFileName ?? ''} ${d.source.system ?? ''}`).includes(normalize(query)));
  const categoryLabel = reference?.kinds?.length ? `Documentos de esta categoría: ${matches.length}` : '';
  function open(next: Reference | null) { setReference(next); setQuery(''); setOperationMessage(''); if (!dialog.current?.open) dialog.current?.showModal(); }
  const revisionFamily = selected ? documents.filter(d => {
    const lineage = (candidate: MunicipalDocument): string => {
      let current = candidate;
      const seen = new Set<string>();
      while (current.revisionOf && !seen.has(current.revisionOf)) {
        seen.add(current.id);
        const parent = documents.find(d => d.id === current.revisionOf);
        if (!parent) break;
        current = parent;
      }
      return current.id;
    };
    return lineage(d) === lineage(selected);
  }).sort((a,b) => (a.revisionNumber ?? 1) - (b.revisionNumber ?? 1)) : [];
  const dependencyCount = selected ? workspace.evidenceStore.atoms.filter(atom => atom.provenance.documentId === selected.id).length : 0;
  const historical = selected && workspace.previousHealthReports?.find(r => r.linkedDocumentId === selected.id);
  return <DocumentOriginalManagementContext.Provider value={canWrite && onStoreOriginal && onCreateRevision && onArchiveDocument && onDeleteDocument ? { originals: workspace.documentOriginals ?? [], storeOriginal: onStoreOriginal, createRevision: onCreateRevision, archiveDocument: onArchiveDocument, deleteDocument: onDeleteDocument } : null}><DocumentationContext.Provider value={open}>
    {children}
    <button type="button" className="documentation-launcher" onClick={() => open(null)}>Consultar documentación ({documents.length})</button>
    <dialog ref={dialog} className="documentation-dialog" aria-labelledby="documentation-title">
      <header><h2 id="documentation-title">{selected ? selected.title : categoryLabel || 'Documentación del expediente'}</h2><button type="button" autoFocus onClick={() => dialog.current?.close()}>Cerrar</button></header>
      {selected ? <>
        <p><strong>Archivo de referencia:</strong> {selected.sourceFileName ?? 'Nombre no registrado'}</p>
        <p>{selected.source.system}</p>
        <dl className="documentation-metadata">
          <div><dt>Estado</dt><dd>{selected.status}</dd></div>
          <div><dt>Incorporación</dt><dd>{selected.createdAt}</dd></div>
          <div><dt>SHA-256</dt><dd>{selected.contentSha256 ?? 'No registrado'}</dd></div>
          <div><dt>Evidencias vinculadas</dt><dd>{dependencyCount}</dd></div>
          <div><dt>Original compartido</dt><dd>{workspace.documentOriginals?.some(o=>o.documentId===selected.id) ? 'Disponible en expediente Firebase' : 'No incorporado al expediente compartido'}</dd></div>
        </dl>
        {revisionFamily.length > 1 && <section aria-label="Versiones del documento"><h3>Versiones · {revisionFamily.length}</h3><ul>{revisionFamily.map(d=><li key={d.id}><DocumentReference documentId={d.id}>{d.title} · versión {d.revisionNumber ?? 1}</DocumentReference><small>{d.sourceFileName ?? 'Sin original'} · {d.status}</small></li>)}</ul></section>}
        {canWrite && <div className="documentation-operations">
          <label>Incorporar nueva versión (sin modificar los indicadores anteriores)
            <input type="file" aria-label="Crear nueva versión documental" onChange={async e => {
              const file=e.currentTarget.files?.[0];e.currentTarget.value='';
              if(!file || !onCreateRevision) return;
              if(!window.confirm('Se creará otra ficha y se conservarán las evidencias anteriores. La nueva versión requerirá revisión técnica. ¿Continuar?')) return;
              try { setOperationMessage('Guardando nueva versión en Firebase…'); await onCreateRevision(selected.id,file); setOperationMessage('Versión incorporada; revisa y valida sus evidencias.'); }
              catch(error) { setOperationMessage((error as Error).message); }
            }}/>
          </label>
          {selected.status !== 'archived' && <button type="button" onClick={async()=>{
            if(!onArchiveDocument || !window.confirm('¿Archivar este documento conservando su original y sus evidencias?')) return;
            try { setOperationMessage('Archivando en Firebase…'); await onArchiveDocument(selected.id); setOperationMessage('Documento archivado.'); }
            catch(error) { setOperationMessage((error as Error).message); }
          }}>Archivar</button>}
          <button type="button" onClick={async()=>{
            if(!onDeleteDocument || !window.confirm(`¿Eliminar «${selected.title}» de Firebase y del navegador, incluyendo sus ${dependencyCount} evidencias directas? Los perfiles ya generados pueden requerir revisión.`)) return;
            try {setOperationMessage('Eliminando en Firebase…'); const deleted=await onDeleteDocument(selected.id); if(deleted) {setReference(null); setOperationMessage('Documento eliminado.');} else setOperationMessage('No se ha confirmado la eliminación en Firebase.');}
            catch(error) {setOperationMessage((error as Error).message);}
          }}>Eliminar documento</button>
        </div>}
        {operationMessage && <p role="status">{operationMessage}</p>}

        <DocumentAccess key={selected.id} document={selected} />
        {historical?.body.originalText && !selected.sourceText && <details><summary>Consultar texto de la conversión histórica</summary><p className="documentation-text">{historical.body.originalText}</p></details>}
        <p><button type="button" onClick={() => setReference(null)}>Ver toda la documentación</button></p>
      </> : <>
        {reference && !reference.kinds?.length && <p role="status"><strong>{matches.length ? 'Hay varias referencias con ese nombre.' : 'No se ha localizado el documento en este expediente.'}</strong> {reference.fileName ?? reference.documentId}. {matches.length ? 'Selecciona el documento correspondiente.' : 'Puedes buscarlo en el catálogo. Una mención no acredita que el archivo esté disponible.'}</p>}
        {reference?.kinds?.length && <p role="status">{matches.length} documentos registrados en esta categoría, incluidos los archivados. Selecciona un documento para consultar sus originales y sus datos de procedencia.</p>}
        <label>Buscar por título o nombre de archivo<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <ul>{(matches.length > 1 && !query ? matches : filtered).map(d => <li key={d.id}><DocumentReference documentId={d.id}>{d.title}</DocumentReference><small>{d.sourceFileName ?? 'Sin nombre de archivo'}{d.status === 'archived' ? ' · Referencia histórica' : ''}</small></li>)}</ul>
        {!filtered.length && <p>No hay documentos que coincidan con la búsqueda.</p>}
      </>}
    </dialog>
  </DocumentationContext.Provider></DocumentOriginalManagementContext.Provider>;
}
