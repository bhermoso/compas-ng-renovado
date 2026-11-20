import { useMemo, useState } from "react";
import type { MunicipalDocumentRepository, MunicipalDocument, DocumentCycle } from "../../domain/repository";
import type { EvidenceAtom } from "../../domain/evidence";
import { DocumentReference } from "./Documentation";
import { DocumentCycleControl } from "./DocumentCycleControl";
import { KIND_LABEL } from "./documentRepositoryCategorization";
import "./DocumentArchiveManager.css";

interface Props {
  repository: MunicipalDocumentRepository;
  evidence: readonly EvidenceAtom[];
  originalIds: readonly string[];
  canWrite: boolean;
  persistence: string;
  originalCapacity: string;
  onSetDocumentCycle?: (documentId: string, cycle: DocumentCycle | undefined) => void;
  onOpenUploader: () => void;
  onOpenAssetValidations: () => void;
}

type Scope = "all" | "active" | "archived" | "assets" | "studies";
const isActive = (d: MunicipalDocument) => d.status !== "archived" && d.status !== "rejected";

/** Un punto de acceso a TODA la documentación, no solamente a las fuentes 'otras'. */
export function DocumentArchiveManager({ repository, evidence, originalIds, canWrite, persistence, originalCapacity, onOpenUploader, onOpenAssetValidations, onSetDocumentCycle }: Props) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [open, setOpen] = useState(false);
  const originals = useMemo(() => new Set(originalIds), [originalIds]);
  const archive = repository.documents;
  const filtered = useMemo(() => archive.filter((d) => {
    if (scope === "active" && !isActive(d)) return false;
    if (scope === "archived" && isActive(d)) return false;
    if (scope === "assets" && d.kind !== "community-asset" && d.kind !== "localiza-salud") return false;
    if (scope === "studies" && d.kind !== "complementary-study" && d.kind !== "redcap-export") return false;
    return (d.title + " " + (d.sourceFileName ?? "") + " " + (KIND_LABEL[d.kind] ?? "")).normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim());
  }), [archive, query, scope]);
  const countOf = (id: string) => evidence.filter(a => a.provenance.documentId === id).length;
  const validationCount = (id: string) => (repository.assetValidations ?? []).filter(v => v.documentId === id).length;
  const originalCount = archive.filter(d => originals.has(d.id)).length;
  return (
    <section className="workspace-panel dam" aria-labelledby="dam-title">
      <div className="panel-header dam__head">
        <div><p className="eyebrow">Diagnóstico · Fuente documental única</p><h2 id="dam-title">Gestor documental del expediente</h2></div>
        <p className="panel-note">Un único índice para informes, PDF, DOCX, estudios CSV y activos. Cada ficha muestra su procedencia, el texto conservado y la disponibilidad del archivo; los paneles metodológicos presentan resultados, no nuevos originales.</p>
      </div>
      <div className="dam__summary">
        <span><strong>{archive.length}</strong> fichas</span>
        <span><strong>{archive.filter(isActive).length}</strong> activas</span>
        <span><strong>{originalCount}</strong> originales registrados · {originalCapacity}</span>
        <span><strong>{(repository.assetValidations ?? []).length}</strong> declaraciones de validación de activos</span>
      </div>
      <div className="dam__controls">
        <button type="button" onClick={onOpenUploader}>Incorporar PDF, DOCX o CSV (revisión previa)</button>
        <button type="button" onClick={onOpenAssetValidations}>Revisar validaciones de activos</button>
        <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? "Contraer catálogo" : "Mostrar catálogo y buscar"}</button>
      </div>
      <details className="dam__limits"><summary>Capacidad y custodia documental</summary><p>20 MB por archivo y 40 MB compartidos con el Perfil. Una transcripción o reconstrucción no acredita el original.</p></details>
      <p className="dam__persistence" role="status">Persistencia: {persistence || "sin confirmación reciente"}. {canWrite ? "Las operaciones documentales se confirman en Firebase desde cada ficha." : "Las operaciones de escritura no están disponibles en esta sesión."}</p>
      {open && <>
        <div className="dam__filters">
          <label>Buscar por título, original o categoría<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Informe, CSV, Localiza, activos…" /></label>
          <label>Mostrar<select value={scope} onChange={e => setScope(e.target.value as Scope)}>
            <option value="all">Todos</option><option value="active">Activos</option><option value="archived">Archivados o rechazados</option><option value="assets">Activos para la salud</option><option value="studies">Estudios y CSV</option>
          </select></label>
        </div>
        <p className="dam__count">{filtered.length} documentos encontrados. Una ficha archivada conserva la documentación; eliminar retira su registro y evidencias, con confirmación.</p>
        <div className="dam__table-scroll"><table className="dam__table"><thead><tr><th>Documento</th><th>Tipo</th><th>Estado</th><th>Original y texto</th><th>Versión y procedencia</th><th>Dependencias</th><th>Gestión</th></tr></thead>
          <tbody>{filtered.map(d => <tr key={d.id}>
            <th scope="row"><strong>{d.title}</strong><small>{d.sourceFileName || "Sin nombre de archivo"}</small></th>
            <td>{KIND_LABEL[d.kind] ?? d.kind}</td>
            <td>{d.status === "archived" ? "Archivado" : d.status === "validated" ? "Validado" : d.status === "rejected" ? "Rechazado" : "Registrado"}</td>
            <td>{originals.has(d.id) ? "Original registrado en el expediente (pendiente de cotejo remoto)" : "Original no acreditado en el expediente"}{d.sourceText?.trim() ? " · Texto conservado (no es el original)" : " · Sin texto conservado"}</td>
            <td className="dam__provenance"><strong>{d.revisionNumber ? `v${d.revisionNumber}` : "Sin número de versión"}</strong><small>{d.revisionOf ? `Revisión de ${d.revisionOf}` : "Sin predecesora declarada"}</small><small>{d.contentSha256 ? `Huella declarada SHA-256: ${d.contentSha256.slice(0, 12)}…` : "Sin huella registrada"}</small><small>{d.source.organization || d.source.system || "Origen no declarado"}</small></td>
            <td>{countOf(d.id)} evidencias{validationCount(d.id) ? ` · ${validationCount(d.id)} validaciones de activos` : ""}{d.revisionOf ? " · revisión" : ""}</td>
            <td><DocumentReference documentId={d.id}>Abrir ficha</DocumentReference>{onSetDocumentCycle && canWrite && <details className="dam__cycle"><summary>Declarar ciclo</summary><DocumentCycleControl cycle={d.cycle} onChange={cycle=>onSetDocumentCycle(d.id,cycle)}/></details>}</td>
          </tr>)}</tbody>
        </table></div>
        {!filtered.length && <p>No hay documentos con ese criterio.</p>}
        
      </>}
    </section>
  );
}
