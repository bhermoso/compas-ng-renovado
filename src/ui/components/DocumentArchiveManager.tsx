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
const normalized = (value: string) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s+/g, " ").trim();
type Coincidence = { documents: MunicipalDocument[]; reason: "hash" | "title" };
/** Hash identical => same bytes; identical title/type => review candidate, never an automatic deletion. */
export function documentCoincidences(documents: readonly MunicipalDocument[]): Coincidence[] {
  const hashes = new Map<string, MunicipalDocument[]>();
  const titles = new Map<string, MunicipalDocument[]>();
  for (const d of documents) {
    if (d.contentSha256 && /^[a-f0-9]{64}$/i.test(d.contentSha256)) {
      const key = d.contentSha256.toLowerCase();
      hashes.set(key, [...(hashes.get(key) ?? []), d]);
    }
    const title = normalized(d.title);
    if (title) {
      const key = d.kind + ":" + title;
      titles.set(key, [...(titles.get(key) ?? []), d]);
    }
  }
  const results: Coincidence[] = [];
  const exactPairs = new Set<string>();
  for (const group of hashes.values()) {
    if (group.length < 2) continue;
    results.push({ documents: group, reason: "hash" });
    for (const a of group) for (const b of group) if (a.id !== b.id) exactPairs.add([a.id,b.id].sort().join("\\u0000"));
  }
  for (const group of titles.values()) {
    if (group.length < 2) continue;
    // Skip title candidates only if every pair already shares an identical verified hash.
    if (group.every((a,i) => group.slice(i+1).every(b => exactPairs.has([a.id,b.id].sort().join("\\u0000"))))) continue;
    results.push({ documents: group, reason: "title" });
  }
  return results;
}

/** Un punto de acceso a TODA la documentación, no solamente a las fuentes 'otras'. */
export function DocumentArchiveManager({ repository, evidence, originalIds, canWrite, persistence, originalCapacity, onOpenUploader, onOpenAssetValidations, onSetDocumentCycle }: Props) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [open, setOpen] = useState(true);
  const [onlyCoincidences, setOnlyCoincidences] = useState(false);
  const coincidences = useMemo(() => documentCoincidences(repository.documents), [repository.documents]);
  const coincidentIds = useMemo(() => new Set(coincidences.flatMap(g => g.documents.map(d => d.id))), [coincidences]);
  const originals = useMemo(() => new Set(originalIds), [originalIds]);
  const archive = repository.documents;
  const filtered = useMemo(() => archive.filter((d) => {
    if (onlyCoincidences && !coincidentIds.has(d.id)) return false;
    if (scope === "active" && !isActive(d)) return false;
    if (scope === "archived" && isActive(d)) return false;
    if (scope === "assets" && d.kind !== "community-asset" && d.kind !== "localiza-salud") return false;
    if (scope === "studies" && d.kind !== "complementary-study" && d.kind !== "redcap-export") return false;
    return (d.title + " " + (d.sourceFileName ?? "") + " " + (KIND_LABEL[d.kind] ?? "")).normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim());
  }), [archive, query, scope, onlyCoincidences, coincidentIds]);
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
        <span><strong>{coincidences.length}</strong> grupos que revisar</span>
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
        <section aria-label="Revisión de documentos coincidentes" className="dam__duplicates">
          <h3>Posibles documentos repetidos · {coincidences.length} grupos</h3>
          <p>Se distinguen archivos con la misma huella SHA-256 y fichas del mismo tipo con igual título. Un título repetido no demuestra que los archivos sean idénticos; pueden ser versiones distintas.</p>
          {coincidences.length === 0 ? <p>No se han detectado coincidencias con los metadatos registrados. Esto no descarta duplicados con títulos o huellas diferentes.</p> : <div>
            {coincidences.map((group,index) => <details key={index}>
              <summary><strong>{group.reason === "hash" ? "Mismo contenido (SHA-256)" : "Mismo título: comprobar versiones"}</strong> · {group.documents.length} fichas · {group.documents[0].title}</summary>
              <ul>{group.documents.map(d => <li key={d.id}>
                <DocumentReference documentId={d.id}>{d.title}</DocumentReference>
                {" · "}{d.sourceFileName ?? "sin nombre de archivo"}
                {" · "}{d.revisionNumber ? `v${d.revisionNumber}` : "versión sin numerar"}
                {" · "}{d.status === "archived" ? "archivado" : "activo o en revisión"}
                {" · "}{countOf(d.id)} evidencias
                {" · ID: "}{d.id}
              </li>)}</ul>
              <p>Consulta cada ficha antes de archivar o eliminar. No se ha eliminado ni fusionado ningún archivo.</p>
            </details>)}
          </div>}
        </section>
        <div className="dam__filters">
          <label>Buscar por título, original o categoría<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Informe, CSV, Localiza, activos…" /></label>
          <label><input type="checkbox" checked={onlyCoincidences} onChange={e => setOnlyCoincidences(e.target.checked)} /> Solo documentos coincidentes</label>
          <label>Mostrar<select value={scope} onChange={e => setScope(e.target.value as Scope)}>
            <option value="all">Todos</option><option value="active">Activos</option><option value="archived">Archivados o rechazados</option><option value="assets">Activos para la salud</option><option value="studies">Estudios y CSV</option>
          </select></label>
        </div>
        <p className="dam__count">{filtered.length} documentos encontrados. Una ficha archivada conserva la documentación; eliminar retira su registro y evidencias, con confirmación.</p>
        <div className="dam__table-scroll"><table className="dam__table"><thead><tr><th>Documento</th><th>Tipo</th><th>Estado</th><th>Original y texto</th><th>Versión y procedencia</th><th>Dependencias</th><th>Gestión</th></tr></thead>
          <tbody>{filtered.map(d => <tr key={d.id}>
            <th scope="row"><strong>{d.title}</strong>{coincidentIds.has(d.id) && <small>Coincidencia: revisar</small>}<small>{d.sourceFileName || "Sin nombre de archivo"}</small></th>
            <td>{KIND_LABEL[d.kind] ?? d.kind}</td>
            <td>{d.status === "archived" ? "Archivado" : d.status === "validated" ? "Validado" : d.status === "rejected" ? "Rechazado" : "Registrado"}</td>
            <td>{originals.has(d.id) ? "Original registrado en expediente" : "Original no acreditado en expediente"}{d.sourceText?.trim() ? " · Texto conservado (no es el original)" : " · Sin texto conservado"}</td>
            <td><strong>{d.revisionNumber ? `v${d.revisionNumber}` : "Versión sin numerar"}</strong><small>{d.revisionOf ? `Revisión de ${d.revisionOf}` : "Sin revisión anterior declarada"}</small><small>{d.contentSha256 ? `SHA-256 ${d.contentSha256.slice(0,12)}…` : "Sin huella de original registrada"}</small><small>{d.source.organization || d.source.system || "Origen institucional no declarado"}</small></td>
            <td>{countOf(d.id)} evidencias{validationCount(d.id) ? ` · ${validationCount(d.id)} validaciones de activos` : ""}{d.revisionOf ? " · revisión" : ""}</td>
            <td><DocumentReference documentId={d.id}>Abrir ficha</DocumentReference>{onSetDocumentCycle && canWrite && <details className="dam__cycle"><summary>Declarar ciclo</summary><DocumentCycleControl cycle={d.cycle} onChange={cycle=>onSetDocumentCycle(d.id,cycle)}/></details>}</td>
          </tr>)}</tbody>
        </table></div>
        {!filtered.length && <p>No hay documentos con ese criterio.</p>}
        
      </>}
    </section>
  );
}
