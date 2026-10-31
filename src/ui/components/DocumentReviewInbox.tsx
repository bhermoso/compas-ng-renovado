import { useState } from "react";
import type { ChangeEvent } from "react";
import type { DocumentKind, TemporalScope } from "../../domain/repository";

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

function proposeKind(name: string): DocumentKind | "undetermined" {
  const lower = name.toLowerCase();
  if (/\.(zip|png|jpe?g)$/i.test(lower)) return "undetermined";
  if (/\.csv$/i.test(lower)) return "undetermined"; // No inferir REDCap por extensión.
  return "undetermined"; // Nunca inferir naturaleza de la fuente por el nombre.
}

/** Bandeja preliminar, sin escritura ni lectura de contenido; no sustituye a los adaptadores. */
export function DocumentReviewInbox({ municipality }: { municipality: string }) {
  const [items, setItems] = useState<PendingDocumentReview[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const active = items.find((item) => item.id === selected);
  function update(id: string, patch: Partial<PendingDocumentReview>) {
    setItems((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    const additions = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      proposedKind: proposeKind(file.name),
      kind: "undetermined" as const,
      municipality,
      documentDate: "",
      observedPeriod: "",
      temporalScope: "undetermined" as const,
    }));
    setItems((before) => [...before, ...additions]);
    setSelected(additions[0].id);
    setMessage("Archivos añadidos solo a la bandeja temporal. No se han abierto, extraído, subido ni guardado.");
  }
  return (
    <section className="workspace-panel document-review-inbox" aria-labelledby="document-review-title">
      <div className="gradient-bar" aria-hidden="true" />
      <div className="panel-header">
        <div><p className="eyebrow">Revisión previa · Prototipo sin persistencia</p><h2 id="document-review-title">Bandeja de documentación</h2></div>
        <p className="panel-note">Prepara la clasificación y la declaración temporal antes de importar. Esta bandeja no analiza archivos, descomprime ZIP, guarda originales ni modifica evidencias.</p>
      </div>
      <label className="document-review-inbox__upload">
        Seleccionar archivos para revisión (sin subida)
        <input type="file" multiple accept=".pdf,.doc,.docx,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.zip" onChange={addFiles} />
      </label>
      <p className="panel-note" role="status">{message || "Sin archivos pendientes en esta sesión."}</p>
      {items.length > 0 && <div className="document-review-inbox__layout">
        <ul className="document-review-inbox__list" aria-label="Archivos pendientes">
          {items.map((item) => <li key={item.id}>
            <button type="button" aria-current={item.id === selected ? "true" : undefined} onClick={() => setSelected(item.id)}>
              <strong>{item.name}</strong><span>{Math.round(item.size / 1024)} KB · {item.temporalScope === "undetermined" ? "Temporalidad por declarar" : "Clasificación provisional"}</span>
            </button>
          </li>)}
        </ul>
        {active && <div className="document-review-inbox__editor">
          <h3>Ficha de revisión</h3>
          <p className="panel-note">Ámbito de trabajo: <strong>{active.municipality}</strong>. Confirma que corresponde a este expediente.</p>
          <label>Tipo documental
            <select value={active.kind} onChange={(e) => update(active.id, { kind: e.target.value as PendingDocumentReview["kind"] })}>
              {KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Fecha del documento (declaración manual)
            <input type="text" placeholder="AAAA, AAAA-MM o AAAA-MM-DD" value={active.documentDate} onChange={(e) => update(active.id, { documentDate: e.target.value })} />
          </label>
          <label>Período observado
            <input type="text" placeholder="Ej. 2015–2016; no equivale a fecha de carga" value={active.observedPeriod} onChange={(e) => update(active.id, { observedPeriod: e.target.value })} />
          </label>
          <label>Alcance temporal (pendiente de validación técnica)
            <select value={active.temporalScope} onChange={(e) => update(active.id, { temporalScope: e.target.value as TemporalScope })}>
              <option value="undetermined">Por determinar</option><option value="current">Actual</option><option value="historical">Histórico</option><option value="mixed">Mixto</option>
            </select>
          </label>
          <p className="ingestion-hint">Las selecciones son provisionales: no constituyen una declaración técnica firmada y no se incorporan al expediente.</p>
          <button type="button" onClick={() => { setItems((before) => before.filter((item) => item.id !== active.id)); setSelected(null); setMessage("Ficha descartada. No se han modificado documentos."); }}>Descartar ficha</button>
        </div>}
      </div>}
    </section>
  );
}
