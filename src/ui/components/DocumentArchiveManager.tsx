import { useMemo, useState } from "react";
import type { MunicipalDocumentRepository, MunicipalDocument } from "../../domain/repository";
import type { EvidenceAtom } from "../../domain/evidence";
import { DocumentReference } from "./Documentation";
import { getCategory, KIND_LABEL } from "./documentRepositoryCategorization";
import "./DocumentArchiveManager.css";

interface Props {
  repository: MunicipalDocumentRepository;
  evidence: readonly EvidenceAtom[];
  originalIds: readonly string[];
  canWrite: boolean;
  persistence: string;
  onOpenUploader: () => void;
}

type Scope = "all" | "active" | "archived" | "assets" | "studies";
const isActive = (d: MunicipalDocument) => d.status !== "archived" && d.status !== "rejected";

/** Un punto de acceso a TODA la documentación, no solamente a las fuentes 'otras'. */
export function DocumentArchiveManager({ repository, evidence, originalIds, canWrite, persistence, onOpenUploader }: Props) {
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
        <div><p className="eyebrow">Archivo documental · Control de cargas</p><h2 id="dam-title">Gestionar el archivo del expediente</h2></div>
        <p className="panel-note">Localiza cualquier documento o fuente de activos, consulta sus dependencias y accede desde una sola ficha a su original, versiones, archivo y retirada.</p>
      </div>
      <div className="dam__summary">
        <span><strong>{archive.length}</strong> fichas</span>
        <span><strong>{archive.filter(isActive).length}</strong> activas</span>
        <span><strong>{originalCount}</strong> originales compartidos</span>
        <span><strong>{(repository.assetValidations ?? []).length}</strong> declaraciones de validación de activos</span>
      </div>
      <div className="dam__controls">
        <button type="button" onClick={onOpenUploader}>Cargar otro documento</button>
        <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? "Ocultar archivo" : "Buscar, sustituir o retirar documentos"}</button>
      </div>
      <p className="dam__persistence" role="status">Persistencia: {persistence || "sin confirmación reciente"}. {canWrite ? "Las operaciones documentales se confirman en Firebase desde cada ficha." : "Las operaciones de escritura no están disponibles en esta sesión."}</p>
      {open && <>
        <div className="dam__filters">
          <label>Buscar por título, original o categoría<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Informe, CSV, Localiza, activos…" /></label>
          <label>Mostrar<select value={scope} onChange={e => setScope(e.target.value as Scope)}>
            <option value="all">Todos</option><option value="active">Activos</option><option value="archived">Archivados o rechazados</option><option value="assets">Activos para la salud</option><option value="studies">Estudios y CSV</option>
          </select></label>
        </div>
        <p className="dam__count">{filtered.length} documentos encontrados. Una ficha archivada conserva la documentación; eliminar retira su registro y evidencias, con confirmación.</p>
        <div className="dam__table-scroll"><table className="dam__table"><thead><tr><th>Documento</th><th>Tipo</th><th>Estado</th><th>Original</th><th>Dependencias</th><th>Gestión</th></tr></thead>
          <tbody>{filtered.map(d => <tr key={d.id}>
            <th scope="row"><strong>{d.title}</strong><small>{d.sourceFileName || "Sin nombre de archivo"}</small></th>
            <td>{KIND_LABEL[d.kind] ?? d.kind}</td>
            <td>{d.status === "archived" ? "Archivado" : d.status === "validated" ? "Validado" : d.status === "rejected" ? "Rechazado" : "Registrado"}</td>
            <td>{originals.has(d.id) ? "Guardado en expediente" : "No consta original compartido"}</td>
            <td>{countOf(d.id)} evidencias{validationCount(d.id) ? ` · ${validationCount(d.id)} validaciones de activos` : ""}{d.revisionOf ? " · revisión" : ""}</td>
            <td><DocumentReference documentId={d.id}>Abrir ficha y operaciones</DocumentReference></td>
          </tr>)}</tbody>
        </table></div>
        {!filtered.length && <p>No hay documentos con ese criterio.</p>}
        <p className="dam__foot">Desde «Abrir ficha y operaciones» puedes descargar o reponer el original, incorporar una versión nueva, archivar o eliminar con confirmación, según permisos. Para cargas nuevas utiliza «Cargar otro documento».</p>
      </>}
    </section>
  );
}
