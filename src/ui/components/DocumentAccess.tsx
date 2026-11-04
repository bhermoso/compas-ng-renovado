import { useEffect,useState } from 'react';
import type { MunicipalDocument } from '../../domain/repository';
import { loadOriginalFile } from '../../infrastructure/document-files/originalFiles';
import { decodeDocumentOriginal } from '../../application/document-files/documentOriginals';
import { useDocumentOriginalManagement } from './DocumentOriginalManagement';
import { documentAccessUrl, documentDownloadFileName, isPdfDocumentAccess } from './documentAccessUtils';

export function DocumentAccess({document:doc,documentLabel,retainedTextAvailable=false,showManagementActions=true}:{document:MunicipalDocument;documentLabel?:string;retainedTextAvailable?:boolean;showManagementActions?:boolean}){
 const contextualLabel=documentLabel?.trim();
 const context=useDocumentOriginalManagement();
 // Never present active-municipality write operations on a document from the
 // cross-municipality read-only library.
 const management=context?.municipalityId===doc.municipalityId ? context : null;
 const remoteOriginal=management?.originals.find(o=>o.documentId===doc.id);
 const [file,setFile]=useState<File>();const [message,setMessage]=useState('');
 const [loading,setLoading]=useState(true);
 // La consulta IndexedDB depende del documento; el reset evita mostrar un original anterior.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let active=true;setFile(undefined);setLoading(true);setMessage('');
 (remoteOriginal ? decodeDocumentOriginal(remoteOriginal) : loadOriginalFile(doc.municipalityId,doc.id)).then(f=>{if(active)setFile(f);}).catch(e=>{if(active)setMessage(e.message);}).finally(()=>{if(active)setLoading(false);});
 return ()=>{active=false;};},[doc.id,doc.municipalityId,remoteOriginal?.sha256]);
 // The stored original is authoritative. An external URL may point to an
 // older revision and must not be presented as this file's original.
 const url=remoteOriginal ? undefined : documentAccessUrl(doc.source.url);
 function openOriginal(){
  if(!file) return;
  if(file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { download(); return; }
  const href=URL.createObjectURL(file);
  window.open(href,'_blank','noopener,noreferrer');
  setTimeout(()=>URL.revokeObjectURL(href),60000);
 }
 function download(){
  if(!file)return;
  const href=URL.createObjectURL(file);const a=window.document.createElement('a');
  a.href=href;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 }
 return <div className="document-access">
  {url && isPdfDocumentAccess(doc.source.url) && <div className="document-access__links">
   <a className="doc-repo__open" href={url} download={doc.sourceFileName ?? documentDownloadFileName(doc.source.url, doc.title)} aria-label={`${contextualLabel ? `Descargar ${contextualLabel}` : "Descargar PDF original"}: ${doc.title}`}>{contextualLabel ? `Descargar ${contextualLabel}` : "Descargar PDF original"}</a>
   <a className="doc-repo__open doc-repo__open--secondary" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${contextualLabel ? `Abrir ${contextualLabel} en nueva pestaña` : "Abrir PDF en nueva pestaña"}: ${doc.title}`}>{contextualLabel ? `Abrir ${contextualLabel} en nueva pestaña` : "Abrir en nueva pestaña"}</a>
   <p className="document-access__notice">Si el visor integrado muestra una pestaña vacía, usa la descarga {contextualLabel ? `del ${contextualLabel}` : "del PDF original"}.</p>
  </div>}
  {url && !isPdfDocumentAccess(doc.source.url) && <a className="doc-repo__open" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir documento: ${doc.title} (nueva pestaña)`}>Abrir documento ↗</a>}
  {file && <p><button type="button" onClick={openOriginal}>Abrir original</button> <button type="button" onClick={download}>Descargar original · {file.name}</button> <small>{remoteOriginal ? 'Original guardado en el expediente compartido.' : 'Original solo en este navegador; pendiente de sincronizar.'}</small></p>}
  {!loading && !file && !url && <p><strong>Archivo original no disponible.</strong> {retainedTextAvailable ? 'Existe una transcripción sanitaria vinculada; no equivale al DOCX original.' : doc.sourceText?.trim() ? 'Puedes consultar el texto conservado.' : 'Solo se conserva la referencia o los datos derivados.'}</p>}
  {doc.sourceText?.trim() && <details><summary>Consultar texto conservado</summary><p style={{whiteSpace:'pre-wrap'}}>{doc.sourceText}</p></details>}
  {management && <label className="document-access__attach">{file ? 'Verificar o reponer original' : 'Adjuntar el archivo original'}
   <input type="file" aria-label={`Adjuntar original: ${doc.title}`} onChange={async e=>{
    const input=e.currentTarget;const next=input.files?.[0];if(!next)return;
    if(!window.confirm(`¿Vincular «${next.name}» a «${doc.title}»? Comprueba que corresponde a este documento. Si el contenido difiere del original existente debes importar una versión nueva; no se alterarán en silencio las evidencias.`)){input.value='';return;}
    try {
      if (!management) throw new Error('El expediente compartido no permite guardar originales desde esta vista.');
      setMessage('Comprobando archivo y guardando en Firebase…');
      await management.storeOriginal(doc.id,next);
      setFile(next);
      setMessage('Original verificado y guardado en Firebase. La copia del navegador es una caché.');
    } catch(error) {
      setMessage('No se ha confirmado el guardado en Firebase: '+(error as Error).message);
    }
    input.value='';
   }}/>
  </label>}
  {management && showManagementActions && <div className="document-access__manage" aria-label={`Gestión documental de ${doc.title}`}>
    <label>Crear nueva versión
      <input type="file" aria-label={`Sustituir mediante nueva versión: ${doc.title}`} onChange={async e=>{
        const input=e.currentTarget, replacement=input.files?.[0];if(!replacement)return;
        input.value='';
        if(!window.confirm(`¿Crear una nueva versión de «${doc.title}» con «${replacement.name}»? El documento anterior y todas sus evidencias seguirán conservados.`))return;
        try{setMessage('Guardando nueva versión en Firebase…');await management.createRevision(doc.id,replacement);setMessage('Nueva versión guardada; el documento original permanece conservado.');}
        catch(error){setMessage('No se ha guardado la nueva versión: '+(error as Error).message);}
      }}/>
    </label>
    {doc.status!=='archived'&&<button type="button" onClick={async()=>{
      if(!window.confirm(`¿Archivar «${doc.title}» sin eliminar su archivo ni sus evidencias?`))return;
      try{setMessage('Archivando en Firebase…');await management.archiveDocument(doc.id);setMessage('Documento archivado y conservado en Firebase.');}
      catch(error){setMessage('No se ha podido archivar: '+(error as Error).message);}
    }}>Archivar documento</button>}
    <button type="button" onClick={async()=>{
      if(!window.confirm(`¿Eliminar definitivamente «${doc.title}» de Firebase y retirar sus evidencias derivadas? Esta acción no equivale a archivar y no se puede deshacer.`))return;
      try{setMessage('Eliminando en Firebase…');const deleted=await management.deleteDocument(doc.id);setMessage(deleted?'Eliminación confirmada por Firebase.':'Firebase no ha confirmado la eliminación.');}
      catch(error){setMessage('No se ha podido eliminar: '+(error as Error).message);}
    }}>Eliminar documento</button>
  </div>}
  {message && <p role="status">{message}</p>}
 </div>;
}
