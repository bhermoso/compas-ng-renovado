/**
 * Archivo del expediente: todo lo cargado, en un solo sitio y con las acciones a la vista.
 * Documentos (con su archivo), estadística territorial y Perfil.
 */
import { useMemo, useState, type ReactNode } from "react";
import type { DocumentCycle, MunicipalDocument } from "../../domain/repository";
import type { MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import type { ProfileAttachment } from "../../domain/health-profile/ExternalHealthProfile";
import {
  archiveDocumentRows, documentChangeWarnings, territorialSnapshotDeletionBlock, type ArchiveDocumentRow,
} from "../../application/document-files/expedienteArchive";
import { decodeDocumentOriginal, formatMegabytes, workspaceDocumentBytes, MAX_WORKSPACE_ORIGINALS_BYTES } from "../../application/document-files/documentOriginals";
import { organizeMunicipalDocuments, municipalDocumentSection } from "../../application/municipal-document-organization";
import { profileAttachmentBlob } from "../../application/health-profile/externalProfiles";
import { provenanceCsv } from "../../application/territorial-statistics";
import { loadOriginalFile } from "../../infrastructure/document-files/originalFiles";
import { DocumentReference } from "./Documentation";
import { DocumentCycleControl } from "./DocumentCycleControl";
import { KIND_LABEL } from "./documentRepositoryCategorization";
import { documentAccessUrl } from "./documentAccessUtils";
import "./ExpedienteArchive.css";

interface Props {
  workspace: MunicipalityWorkspace;
  canWrite: boolean;
  persistence: string;
  localOnly: ReadonlyArray<{ documentId: string; reason: "too-large" | "over-budget" | "different-hash" }>;
  /** Entrada universal de carga (revisión previa de cada archivo). */
  uploader: ReactNode;
  onStoreOriginal: (documentId: string, file: File) => Promise<void>;
  onCreateRevision: (documentId: string, file: File) => Promise<void>;
  onArchiveDocument: (documentId: string) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<boolean>;
  onSetDocumentCycle?: (documentId: string, cycle: DocumentCycle | undefined) => void;
  onDeleteTerritorialSnapshot?: (snapshotId: string) => Promise<void>;
  onOpenProfile: () => void;
  onOpenTerritorialStatistics: () => void;
  onOpenAssetValidations: () => void;
}

const ACCEPT = ".pdf,.docx,.doc,.odt,.csv,.xlsx,.xls,.txt,.json,.zip";
const LOCAL_ONLY_REASON = { "too-large": "supera 20 MB", "over-budget": "no cabe en los 40 MB del expediente", "different-hash": "no coincide con la huella de la ficha" } as const;
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const when = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = href; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function typeLabel(d: MunicipalDocument): string {
  const section = municipalDocumentSection(d);
  if (section === "plans") return "Plan de Acción municipal";
  if (section === "prioritization") return "Priorización";
  return KIND_LABEL[d.kind] ?? d.kind;
}

function FileButton({ label, onFile, disabled }: { label: string; onFile: (file: File) => void; disabled?: boolean }) {
  return <label className={`ea-act${disabled ? " ea-act--off" : ""}`}>{label}
    <input type="file" hidden accept={ACCEPT} disabled={disabled} aria-label={label} onChange={e => {
      const file = e.currentTarget.files?.[0]; e.currentTarget.value = "";
      if (file) onFile(file);
    }} />
  </label>;
}

export function ExpedienteArchive(props: Props) {
  const { workspace, canWrite, persistence, localOnly, uploader } = props;
  const [query, setQuery] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const localReason = useMemo(() => new Map(localOnly.map(o => [o.documentId, o.reason])), [localOnly]);
  const rows = useMemo(() => archiveDocumentRows(workspace, localOnly.map(o => o.documentId)), [workspace, localOnly]);
  const shown = rows.filter(r => !query.trim() || normalize(`${r.document.title} ${r.fileName ?? ""} ${typeLabel(r.document)}`).includes(normalize(query.trim())));
  const active = shown.filter(r => r.active);
  const retired = shown.filter(r => !r.active);
  const withoutFile = rows.filter(r => r.active && r.file === "none").length;
  const snapshots = [...(workspace.territorialStatistics ?? [])].sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
  const library = workspace.externalProfileLibrary;
  const profiles = (library?.profiles ?? []).filter(p => !p.archivedAt);

  async function run(label: string, task: () => Promise<unknown>, done: string) {
    setBusy(true); setMessage(label);
    try { const result = await task(); setMessage(result === false ? "No se ha confirmado la operación en Firebase." : done); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function download(row: ArchiveDocumentRow) {
    try {
      const original = workspace.documentOriginals?.find(o => o.documentId === row.document.id);
      const file = original ? await decodeDocumentOriginal(original) : await loadOriginalFile(row.document.municipalityId, row.document.id);
      if (!file) throw new Error("El archivo no está en este navegador.");
      saveBlob(file, file.name);
    } catch (error) { setMessage((error as Error).message); }
  }

  async function downloadAttachment(a: ProfileAttachment) {
    try { saveBlob(await profileAttachmentBlob(a), a.name); } catch (error) { setMessage((error as Error).message); }
  }

  function confirmChange(row: ArchiveDocumentRow, question: string) {
    const warnings = documentChangeWarnings(workspace, row);
    return window.confirm([question, ...warnings].join("\n\n"));
  }

  const renderRow = (row: ArchiveDocumentRow) => {
    const d = row.document;
    const link = row.file === "none" ? documentAccessUrl(d.source.url) : undefined;
    return <tr key={d.id}>
      <th scope="row"><strong>{d.title}</strong><small>{typeLabel(d)}{row.evidenceCount ? ` · ${row.evidenceCount} evidencias` : ""}{d.status === "archived" ? " · archivado" : d.status === "rejected" ? " · rechazado" : ""}</small></th>
      <td className="ea-file">
        {row.file === "stored" && <>{row.fileName}{row.fileSize !== undefined && <small>{formatMegabytes(row.fileSize)}</small>}</>}
        {row.file === "local-only" && <>{row.fileName ?? "Archivo"}<small className="ea-warn">Solo en este navegador: {LOCAL_ONLY_REASON[localReason.get(d.id)!]}</small></>}
        {row.file === "none" && <span className="ea-none">Sin archivo</span>}
      </td>
      <td className="ea-actions">
        <DocumentReference documentId={d.id}>Ver</DocumentReference>
        {row.file !== "none" && <button type="button" className="ea-act" onClick={() => void download(row)}>Descargar</button>}
        {link && <a className="ea-act" href={link} target="_blank" rel="noopener noreferrer">Abrir fuente</a>}
        {canWrite && row.file === "none" && <FileButton label="Adjuntar archivo" disabled={busy} onFile={file => void run(`Guardando «${file.name}» en Firebase…`, () => props.onStoreOriginal(d.id, file), `Archivo adjuntado a «${d.title}».`)} />}
        {canWrite && row.active && <FileButton label="Nueva versión" disabled={busy} onFile={file => {
          if (!confirmChange(row, `¿Cargar «${file.name}» como nueva versión de «${d.title}»? La versión actual se conserva hasta que revises la nueva.`)) return;
          void run("Guardando la nueva versión en Firebase…", () => props.onCreateRevision(d.id, file), "Nueva versión guardada; queda pendiente de revisión.");
        }} />}
        {canWrite && !row.hasLaterVersions && <button type="button" className="ea-act ea-act--danger" disabled={busy} onClick={() => {
          if (!confirmChange(row, `¿Eliminar «${d.title}»${row.file === "stored" ? " y su archivo" : ""} del expediente? No se puede deshacer.`)) return;
          void run("Eliminando en Firebase…", () => props.onDeleteDocument(d.id), `«${d.title}» eliminado.`);
        }}>Eliminar</button>}
        {canWrite && row.hasLaterVersions && row.active && <button type="button" className="ea-act" disabled={busy} onClick={() => {
          if (!confirmChange(row, `«${d.title}» tiene versiones posteriores y no se puede eliminar. ¿Archivarlo? Se conserva con su archivo y deja de usarse en el diagnóstico.`)) return;
          void run("Archivando en Firebase…", () => props.onArchiveDocument(d.id), `«${d.title}» archivado.`);
        }}>Archivar</button>}
        {canWrite && row.active && props.onSetDocumentCycle && <details className="ea-cycle"><summary>Ciclo</summary><DocumentCycleControl cycle={d.cycle} onChange={cycle => props.onSetDocumentCycle!(d.id, cycle)} /></details>}
      </td>
    </tr>;
  };

  const table = (list: ArchiveDocumentRow[]) => <div className="ea-scroll"><table className="ea-table">
    <thead><tr><th>Documento</th><th>Archivo</th><th>Acciones</th></tr></thead>
    <tbody>{organizeMunicipalDocuments(list.map(r => r.document)).filter(s => s.documents.length > 0).flatMap(section => [
      <tr key={`s-${section.id}`} className="ea-section"><th colSpan={3} scope="colgroup">{section.label.replace(/^\d+ · /, "")}</th></tr>,
      ...section.documents.map(doc => renderRow(list.find(r => r.document.id === doc.id)!)),
    ])}</tbody>
  </table></div>;

  return <section className="ea hp-phase hp-phase--2" aria-labelledby="ea-title">
    <details className="dam__disclosure ea-disclosure" open>
      <summary className="dam__disclosure-summary">
        <strong id="ea-title">Archivo del expediente</strong>
        <span>{rows.filter(r => r.active).length} documentos{withoutFile ? ` · ${withoutFile} sin archivo` : ""} · {snapshots.length} descargas estadísticas · {profiles.length} Perfil{profiles.length === 1 ? "" : "es"}</span>
      </summary>
      <div className="ea-body">
        <div className="ea-bar">
          {canWrite && <button type="button" className="ep-primary" aria-expanded={showUploader} onClick={() => setShowUploader(v => !v)}>{showUploader ? "Cerrar la carga" : "Cargar archivos"}</button>}
          <label className="ea-search">Buscar<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Título, archivo o tipo" /></label>
          <span className="ea-capacity">Archivos guardados: {formatMegabytes(workspaceDocumentBytes(workspace))} de {formatMegabytes(MAX_WORKSPACE_ORIGINALS_BYTES)}</span>
        </div>
        {!canWrite && <p className="ea-note">Inicia sesión y recupera el expediente para cargar, adjuntar o eliminar.</p>}
        {showUploader && <div className="ea-uploader">{uploader}</div>}
        {message && <p className="ea-message" role="status">{message}</p>}

        <h3 className="ea-h">Documentos</h3>
        {active.length ? table(active) : <p className="ea-note">{query ? "Ningún documento coincide con la búsqueda." : "El expediente no tiene documentos."}</p>}
        {retired.length > 0 && <details className="ea-retired"><summary>Archivados o rechazados · {retired.length}</summary>{table(retired)}</details>}

        <h3 className="ea-h">Estadística territorial</h3>
        {snapshots.length === 0 ? <p className="ea-note">No hay ninguna descarga guardada. <button type="button" className="ea-act" onClick={props.onOpenTerritorialStatistics}>Descargar del INE y el IECA</button></p> : <>
          <div className="ea-scroll"><table className="ea-table"><thead><tr><th>Descarga</th><th>Contenido</th><th>Acciones</th></tr></thead><tbody>
            {snapshots.map((s, i) => {
              const block = territorialSnapshotDeletionBlock(workspace, s.id);
              return <tr key={s.id}>
                <th scope="row"><strong>{when(s.retrievedAt)}</strong><small>{i === 0 ? "En uso" : "Anterior: se retira al guardar la próxima"}{s.retrievedBy ? ` · ${s.retrievedBy}` : ""}</small></th>
                <td className="ea-file">{s.observations.length} valores de {s.sources.length} tablas<small>INE {s.ineCode} · catálogo {s.catalogVersion}</small></td>
                <td className="ea-actions">
                  <button type="button" className="ea-act" onClick={props.onOpenTerritorialStatistics}>Ver</button>
                  <button type="button" className="ea-act" onClick={() => saveBlob(new Blob([provenanceCsv(s)], { type: "text/csv;charset=utf-8" }), `estadistica-territorial-${s.ineCode}-${s.retrievedAt.slice(0, 10)}.csv`)}>Descargar CSV</button>
                  {canWrite && props.onDeleteTerritorialSnapshot && <button type="button" className="ea-act ea-act--danger" disabled={busy || !!block} title={block} onClick={() => {
                    if (!window.confirm(`¿Eliminar la descarga del ${when(s.retrievedAt)}? No se puede deshacer.`)) return;
                    void run("Eliminando la descarga en Firebase…", () => props.onDeleteTerritorialSnapshot!(s.id), "Descarga eliminada.");
                  }}>Eliminar</button>}
                </td>
              </tr>;
            })}
          </tbody></table></div>
          {snapshots.some(s => territorialSnapshotDeletionBlock(workspace, s.id)) && <p className="ea-note">{territorialSnapshotDeletionBlock(workspace, snapshots[0].id)}</p>}
        </>}

        <h3 className="ea-h">Perfil de Salud Local</h3>
        {profiles.length === 0 ? <p className="ea-note">No hay ningún Perfil cargado. <button type="button" className="ea-act" onClick={props.onOpenProfile}>Cargar el Perfil</button></p> :
          <div className="ea-scroll"><table className="ea-table"><thead><tr><th>Perfil</th><th>Archivos</th><th>Acciones</th></tr></thead><tbody>
            {profiles.map(p => <tr key={p.id}>
              <th scope="row"><strong>{p.title}</strong><small>{p.id === library?.activeId ? "Vigente" : "Otra revisión"} · {p.status === "validated" ? "validado" : "en revisión"}{p.period ? ` · ${p.period}` : ""}</small></th>
              <td className="ea-file">{p.attachmentIds.length ? (library?.attachments ?? []).filter(a => p.attachmentIds.includes(a.id)).map(a => <span key={a.id} className="ea-attachment">{a.name} <button type="button" className="ea-act" onClick={() => void downloadAttachment(a)}>Descargar</button></span>) : <span className="ea-none">Sin archivo</span>}</td>
              <td className="ea-actions"><button type="button" className="ea-act" onClick={props.onOpenProfile}>Ver</button></td>
            </tr>)}
          </tbody></table></div>}
        <p className="ea-note">Para sustituir o archivar el Perfil, usa su biblioteca: archivar se puede deshacer. Eliminar documentos o cargar otros no cambia el texto del Perfil.</p>

        <p className="ea-foot"><button type="button" className="ea-act" onClick={props.onOpenAssetValidations}>Validaciones de activos</button> · {persistence || "Sin guardado reciente"}</p>
      </div>
    </details>
  </section>;
}
