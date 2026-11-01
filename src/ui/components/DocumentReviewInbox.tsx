import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { proposeDocumentDestinations } from "../../application/document-ingestion/proposeDocumentDestinations";
import {
  buildInboxTemporalMetadata,
  planInboxImport,
  type InboxImportKind,
  type InboxImportRoute,
} from "../../application/document-ingestion/planInboxImport";
import type {
  DocumentKind,
  DocumentTemporalMetadata,
  MunicipalDocumentRepository,
  TemporalScope,
} from "../../domain/repository";
import { analyzeDocument, inspectArchiveMember, type PreliminaryAnalysis } from "../../application/document-ingestion/preliminaryDocumentAnalyzer";

export interface PendingDocumentReview {
  id: string;
  name: string;
  size: number;
  proposedKind: DocumentKind | "undetermined";
  kind: DocumentKind | "undetermined";
  municipality: string;
  documentDate: string;
  observedPeriod: string;
  temporalScope: TemporalScope;
  analysis?: PreliminaryAnalysis;
  analysisError?: string;
  inspectedMembers?: Record<string, PreliminaryAnalysis>;
  approved?: boolean;
  /** Confirmación específica cuando la incorporación sustituye documentos existentes. */
  replacementAcknowledged?: boolean;
  /** Confirmación expresa de que no es una copia, cuando el nombre coincide con uno existente. */
  sameNameAcknowledged?: boolean;
  /** Resultado de la incorporación mediante el cargador existente. */
  importResult?: { ok: boolean; route: InboxImportRoute; studyId?: string; at: string };
}

export interface InboxImportRequest {
  route: InboxImportRoute;
  kind: InboxImportKind;
  /** Ruta de estudios: id del módulo metodológico cuyo cargador recibe el CSV. */
  studyId?: string;
  temporal?: DocumentTemporalMetadata;
  /** Huella SHA-256 del archivo, para registrarla en el documento. */
  contentSha256?: string;
}

interface DocumentReviewInboxProps {
  municipality: string;
  repository: MunicipalDocumentRepository;
  /** Identidad de la sesión: firma la declaración temporal. Vacía: no se declara. */
  declaredBy: string;
  documentKinds?: ReadonlyArray<{ value: DocumentKind; label: string }>;
  isImporting?: boolean;
  /** Mensaje del cargador existente, para mostrar el resultado real de la carga. */
  getLoaderMessage?: (route: InboxImportRoute, studyId?: string) => string | null | undefined;
  /** Instrumentos con cargador CSV conectado (ids de módulo metodológico). */
  connectedInstruments?: readonly string[];
  /** Informe de Salud registrado en el expediente, conste o no su ficha documental. */
  registeredHealthReport?: { title: string; sourceFileName?: string };
  /** Dónde queda guardado lo que se incorpora; se muestra antes de confirmar. */
  storageNotice?: string;
  /** Huellas de los originales conservados en este navegador, por documento. */
  localHashes?: Readonly<Record<string, string>>;
  /** Entrega el archivo revisado al cargador existente; resuelve true si la carga se completó. */
  onImport?: (file: File, request: InboxImportRequest) => Promise<boolean>;
}

const KIND_OPTIONS: Array<{ value: DocumentKind | "undetermined"; label: string }> = [
  { value: "undetermined", label: "Sin clasificar" },
  { value: "health-report", label: "Informe de Salud" },
  { value: "complementary-study", label: "Estudio complementario" },
  { value: "redcap-export", label: "Exportación REDCap" },
  { value: "localiza-salud", label: "Localiza Salud" },
  { value: "strategic-framework", label: "Marco normativo" },
  { value: "territorial-documentation", label: "Documentación territorial" },
  { value: "qualitative-material", label: "Material cualitativo" },
  { value: "longitudinal-evidence", label: "Evidencia longitudinal" },
  { value: "other", label: "Otra fuente" },
];

const SCOPE_LABELS: Record<TemporalScope, string> = {
  undetermined: "por determinar",
  current: "actual",
  historical: "histórico",
  mixed: "mixto",
};

/**
 * Bandeja de revisión previa. Analiza en el navegador y, solo tras confirmación
 * explícita, entrega el mismo archivo revisado al cargador existente: no hay
 * que volver a seleccionarlo ni existe un importador paralelo.
 */
export function DocumentReviewInbox({
  municipality,
  repository,
  declaredBy,
  documentKinds = [],
  isImporting = false,
  getLoaderMessage,
  connectedInstruments = [],
  registeredHealthReport,
  storageNotice,
  localHashes,
  onImport,
}: DocumentReviewInboxProps) {
  const [items, setItems] = useState<PendingDocumentReview[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [lastImportId, setLastImportId] = useState<string | null>(null);
  const active = items.find((item) => item.id === selected);
  const pendingCount = items.filter(item => !item.importResult?.ok).length;
  const analyzedCount = items.filter(item => item.analysis !== undefined).length;
  const duplicates = active?.analysis?.fingerprint ? items.filter((item) => item.id !== active.id && item.analysis?.fingerprint === active.analysis?.fingerprint) : [];
  const labelOf = (kind: DocumentKind) =>
    documentKinds.find((entry) => entry.value === kind)?.label ?? KIND_OPTIONS.find((entry) => entry.value === kind)?.label ?? kind;

  function update(id: string, patch: Partial<PendingDocumentReview>) {
    setItems((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function addFromInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    void addFiles(files);
  }
  function addFromDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  }
  async function addFiles(files: File[]) {
    if (!files.length) return;
    const additions = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      proposedKind: "undetermined" as const,
      kind: "undetermined" as const,
      municipality,
      documentDate: "",
      observedPeriod: "",
      temporalScope: "undetermined" as const,
    }));
    additions.forEach((entry,index)=>filesRef.current.set(entry.id,files[index]));
    setItems((before) => [...before, ...additions]);
    setSelected(additions[0].id);
    setMessage("Analizando archivos en este navegador; no se envían a ningún servidor.");
    await Promise.all(additions.map(async (entry, index) => {
      try {
        const analysis = await analyzeDocument(files[index]);
        update(entry.id, { analysis, proposedKind: analysis.proposedKind });
      } catch (error) {
        update(entry.id, { analysisError: error instanceof Error ? error.message : "Error de análisis" });
      }
    }));
    setMessage("Análisis completado. Ningún archivo se ha incorporado todavía al expediente.");
  }
  async function inspectMember(id: string, path: string) {
    const archive = filesRef.current.get(id);
    if (!archive) return;
    try {
      const {analysis} = await inspectArchiveMember(archive,path);
      setItems(previous => previous.map(item => item.id === id ? {...item,inspectedMembers:{...item.inspectedMembers,[path]:analysis}} : item));
    } catch(error) { setMessage(error instanceof Error ? error.message : "Error al inspeccionar entrada ZIP"); }
  }

  const plan = active?.analysis
    ? planInboxImport({
        kind: active.kind,
        format: active.analysis.format,
        fileName: active.name,
        repository,
        methodologicalMatches: active.analysis.methodologicalMatches,
        connectedInstruments,
        registeredHealthReport,
        fingerprint: active.analysis.fingerprint,
        localHashes,
      })
    : undefined;
  const importPlan = plan && !("blocked" in plan) ? plan : undefined;
  const temporalPreview = active
    ? buildInboxTemporalMetadata({
        documentDate: active.documentDate,
        observedPeriod: active.observedPeriod,
        temporalScope: active.temporalScope,
        declaredBy,
        now: new Date().toISOString(),
      })
    : undefined;
  const temporalError = temporalPreview && "error" in temporalPreview ? temporalPreview.error : undefined;
  const alreadyImported = active?.importResult?.ok === true;
  const destinationLabel = (p: { kind: InboxImportKind; instrument?: { label: string } }) =>
    p.instrument ? `${labelOf(p.kind)} · ${p.instrument.label}` : labelOf(p.kind);
  const canImport =
    !!active && !!importPlan && !!onImport && active.approved === true && duplicates.length === 0 &&
    !temporalError && !alreadyImported && !isImporting &&
    (importPlan.effect === "create" || active.replacementAcknowledged === true) &&
    (importPlan.sameFileName.length === 0 || active.sameNameAcknowledged === true);

  async function importActive() {
    if (!active || !importPlan || !onImport || !canImport) return;
    const file = filesRef.current.get(active.id);
    if (!file) { setMessage("El archivo ya no está disponible en esta sesión. Vuelve a añadirlo a la bandeja."); return; }
    const temporal = buildInboxTemporalMetadata({
      documentDate: active.documentDate,
      observedPeriod: active.observedPeriod,
      temporalScope: active.temporalScope,
      declaredBy,
      now: new Date().toISOString(),
    });
    if ("error" in temporal) { setMessage(temporal.error); return; }
    const id = active.id;
    setLastImportId(id);
    const destination = destinationLabel(importPlan);
    const studyId = importPlan.instrument?.moduleId;
    setMessage(`Incorporando «${active.name}» con el cargador de ${destination}…`);
    let ok: boolean;
    try {
      ok = await onImport(file, { route: importPlan.route, kind: importPlan.kind, studyId, temporal: temporal.temporal, contentSha256: active.analysis?.fingerprint });
    } catch {
      ok = false;
    }
    update(id, { importResult: { ok, route: importPlan.route, studyId, at: new Date().toISOString() } });
    setMessage(ok
      ? `«${active.name}» se ha entregado al cargador de ${destination}. Revisa abajo el resultado de la carga.`
      : `No se ha incorporado «${active.name}». Revisa el motivo indicado por el cargador.`);
  }

  return (
    <section className="workspace-panel document-review-inbox" aria-labelledby="document-review-title">
      <div className="gradient-bar" aria-hidden="true" />
      <div className="panel-header">
        <div><p className="eyebrow">Entrada universal · Revisión previa e incorporación</p><h2 id="document-review-title">Incorporar documentación</h2></div>
        <p className="panel-note">Analiza firmas, huellas SHA-256 y cabeceras CSV; en ZIP permite inspeccionar entradas una a una con comprobación CRC-32. Tras tu confirmación, el mismo archivo se entrega al cargador existente de COMPÁS, sin volver a seleccionarlo. Nada se incorpora sin confirmación explícita.</p>
      </div>
      <label
        className={`document-review-inbox__upload${dragActive ? " document-review-inbox__upload--active" : ""}`}
        onDragOver={(event) => { event.preventDefault(); if (!dragActive) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={addFromDrop}
      >
        <span className="document-review-inbox__upload-title">Arrastra aquí los archivos o selecciónalos</span>
        <span className="document-review-inbox__upload-hint">PDF, DOCX, CSV, Excel, imágenes o ZIP. Se analizan en este navegador; nada se incorpora sin tu confirmación.</span>
        <input type="file" multiple accept=".pdf,.doc,.docx,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.zip" onChange={addFromInput} />
      </label>
      <p className="panel-note" role="status">{message || "Sin archivos pendientes en esta sesión."}</p>
      {items.length > 0 && <><p className="panel-note">{items.length} archivos seleccionados · {analyzedCount} analizados · {pendingCount} sin incorporar.</p><div className="document-review-inbox__layout">
        <ul className="document-review-inbox__list" aria-label="Archivos en revisión">
          {items.map((item) => <li key={item.id}>
            <button type="button" aria-current={item.id === selected ? "true" : undefined} onClick={() => setSelected(item.id)}>
              <strong>{item.name}</strong><span>{Math.round(item.size / 1024)} KB · {item.importResult?.ok ? "Incorporado al expediente" : item.temporalScope === "undetermined" ? "Temporalidad por declarar" : "Clasificación provisional"}</span>
            </button>
          </li>)}
        </ul>
        {active && <div className="document-review-inbox__editor">
          <h3>Ficha de revisión</h3>
          {active.analysisError && <p role="alert">{active.analysisError}</p>}
          {duplicates.length > 0 && <p role="alert"><strong>Duplicado binario en esta bandeja:</strong> {duplicates.map((item) => item.name).join(", ")}. Descarta una de las copias antes de incorporar.</p>}
          {active.analysis && <div className="ingestion-hint"><strong>Formato detectado:</strong> {active.analysis.format} · <strong>SHA-256:</strong> <code>{active.analysis.fingerprint?.slice(0,16)}…</code>
          {active.analysis.proposedKind !== "undetermined" && <p>Propuesta: {labelOf(active.analysis.proposedKind)} (sin validar).</p>}
          {active.analysis.reasons.map((reason,i)=><p key={i}>{reason}</p>)}
          {(active.analysis.methodologicalMatches ?? []).map(match => <p key={match.moduleId+match.adapter}>Posible instrumento: <strong>{match.label}</strong> · {match.matched}/{match.expected} columnas ({match.adapter}; {match.confidence === "strong" ? "esquema coincidente" : "coincidencia parcial"}). No validado.</p>)}
          {active.analysis.warnings.map((warning,i)=><p key={i} role="alert">{warning}</p>)}
          {active.analysis.archiveEntries && <details><summary>Entradas ZIP ({active.analysis.archiveEntries.length})</summary><ul>{active.analysis.archiveEntries.map((entry,i)=><li key={i}>{entry.path} · {entry.format} · {entry.size} bytes {entry.unsafe || entry.encrypted ? "· bloqueada" : ""} {!entry.unsafe && !entry.encrypted && !entry.path.endsWith("/") && <button type="button" onClick={()=>void inspectMember(active.id,entry.path)}>Analizar entrada</button>}{active.inspectedMembers?.[entry.path] && <span> · Firma: {active.inspectedMembers[entry.path].format} · SHA-256: {active.inspectedMembers[entry.path].fingerprint?.slice(0,12)}…</span>}</li>)}</ul></details>}</div>}
          {active.analysis && <div className="ingestion-hint"><strong>Destinos propuestos</strong><ul>{proposeDocumentDestinations(active.analysis, active.kind).map(proposal => <li key={proposal.target}><strong>{proposal.label}</strong> — {proposal.basis} Confirmación humana obligatoria.</li>)}</ul></div>}
          <p className="panel-note">Ámbito de trabajo: <strong>{active.municipality}</strong>. Confirma que corresponde a este expediente.</p>
          <fieldset disabled={alreadyImported} className="document-review-inbox__fields">
          <label>Tipo documental
            <select value={active.kind} onChange={(e) => update(active.id, { kind: e.target.value as PendingDocumentReview["kind"], approved:false, replacementAcknowledged:false, sameNameAcknowledged:false })}>
              {KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Fecha del documento (declaración manual)
            <input type="text" placeholder="AAAA, AAAA-MM o AAAA-MM-DD" value={active.documentDate} onChange={(e) => update(active.id, { documentDate: e.target.value })} />
          </label>
          {temporalError && <p role="alert">{temporalError}</p>}
          <label>Período observado
            <input type="text" placeholder="Ej. 2015–2016; no equivale a fecha de carga" value={active.observedPeriod} onChange={(e) => update(active.id, { observedPeriod: e.target.value })} />
          </label>
          <label>Alcance temporal
            <select value={active.temporalScope} onChange={(e) => update(active.id, { temporalScope: e.target.value as TemporalScope, approved:false })}>
              <option value="undetermined">Por determinar</option><option value="current">Actual</option><option value="historical">Histórico</option><option value="mixed">Mixto</option>
            </select>
          </label>
          <label><input type="checkbox" checked={active.approved === true} onChange={e => update(active.id,{approved:e.target.checked && !!active.analysis && active.kind !== "undetermined" && duplicates.length === 0, replacementAcknowledged:false})} /> He revisado la clasificación y confirmo que el archivo corresponde a este expediente.</label>
          </fieldset>

          {active.analysis && active.kind === "undetermined" && (active.analysis.methodologicalMatches?.length ?? 0) > 0 && <p className="ingestion-hint">Para incorporar este CSV con el cargador del instrumento, elige el tipo «Estudio complementario».</p>}
          {active.analysis && active.kind !== "undetermined" && plan && "blocked" in plan && <p className="ingestion-hint">{plan.reason}</p>}
          {importPlan && !alreadyImported && <div className="document-review-inbox__import" aria-label="Incorporación al expediente">
            <h4>Incorporación al expediente</h4>
            <p><strong>Destino:</strong> {destinationLabel(importPlan)} · <strong>Efecto:</strong> {importPlan.effect === "replace" ? "sustitución" : "nuevo documento"}</p>
            <p>{importPlan.consequence}</p>
            {importPlan.notes?.map((note) => <p key={note} className="panel-note">{note}</p>)}
            {importPlan.affected.length > 0 && <div role="alert"><strong>Documentos afectados:</strong><ul>{importPlan.affected.map(doc => <li key={doc.id}>{doc.title}{doc.sourceFileName ? ` (${doc.sourceFileName})` : ""}</li>)}</ul></div>}
            {importPlan.sameFileName.length > 0 && <p role="alert"><strong>Posible duplicado en el repositorio:</strong> ya existe {importPlan.sameFileName.map(doc => `«${doc.title}» (${labelOf(doc.kind)})`).join(", ")} con el mismo nombre de archivo, aunque no es el mismo archivo. Si incorporas este, quedarán ambos.</p>}
            {importPlan.sameFileName.length > 0 && <label><input type="checkbox" checked={active.sameNameAcknowledged === true} disabled={active.approved !== true} onChange={e => update(active.id, { sameNameAcknowledged: e.target.checked })} /> Es un documento distinto: incorporarlo igualmente.</label>}
            <p className="panel-note">
              Temporalidad: {temporalPreview && "temporal" in temporalPreview && temporalPreview.temporal?.declaration
                ? `se declarará alcance ${SCOPE_LABELS[active.temporalScope]}, firmado por ${declaredBy}.`
                : active.temporalScope !== "undetermined" && !declaredBy
                  ? "no hay sesión identificada; los datos se guardan sin declaración y el documento seguirá pendiente de revisión temporal."
                  : "sin declaración; el documento seguirá pendiente de revisión temporal."}
            </p>
            {storageNotice && <p className="panel-note"><strong>Dónde se guarda:</strong> {storageNotice}</p>}
            {importPlan.effect === "replace" && <label><input type="checkbox" checked={active.replacementAcknowledged === true} disabled={active.approved !== true} onChange={e => update(active.id, { replacementAcknowledged: e.target.checked })} /> Confirmo la sustitución descrita.</label>}
            <button type="button" disabled={!canImport} onClick={() => void importActive()}>
              {isImporting && lastImportId === active.id ? "Incorporando…" : importPlan.effect === "replace" ? "Sustituir e incorporar" : "Incorporar al expediente"}
            </button>
            {!active.approved && <p className="ingestion-hint">Marca la confirmación de revisión para habilitar la incorporación.</p>}
          </div>}
          {active.importResult && <div className="ingestion-hint" role="status">
            <strong>{active.importResult.ok ? "Incorporado al expediente" : "Incorporación no completada"}</strong>
            {lastImportId === active.id && getLoaderMessage?.(active.importResult.route, active.importResult.studyId) && <p>{getLoaderMessage(active.importResult.route, active.importResult.studyId)}</p>}
          </div>}
          <button type="button" onClick={() => { filesRef.current.delete(active.id); setItems((before) => before.filter((item) => item.id !== active.id)); setSelected(null); setMessage(alreadyImported ? "Ficha retirada de la bandeja. El documento incorporado permanece en el expediente." : "Ficha descartada. No se han modificado documentos."); }}>{alreadyImported ? "Retirar de la bandeja" : "Descartar ficha"}</button>
        </div>}
      </div></>}
    </section>
  );
}
