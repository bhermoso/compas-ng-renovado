import { DocumentReference } from "./Documentation";
import { useState } from "react";
import type {
  EvidenceStore,
  EvidenceAtomKind,
  EvidenceConfidence,
  EvidenceOrigin,
} from "../../domain/evidence";

const KIND_LABEL: Record<EvidenceAtomKind, string> = {
  "indicator":               "Indicador",
  "determinant":             "Determinante",
  "asset":                   "Activo comunitario",
  "participation":           "Participación ciudadana",
  "qualitative-observation": "Observación cualitativa",
  "territorial-context":     "Contexto territorial",
  "sample-quality":          "Calidad muestral",
  "longitudinal-snapshot":   "Registro longitudinal",
  "strategic-priority":      "Prioridad estratégica",
  "methodological-caution":  "Cautela metodológica",
  "other":                   "Evidencia",
};

const ORIGIN_LABEL: Partial<Record<EvidenceOrigin, string>> = {
  "health-report":         "Informe de Salud",
  "ibse":                  "IBSE",
  "citizen-participation": "Participación ciudadana",
  "community-assets":      "Activos comunitarios",
  "localiza-salud":        "Localiza Salud",
  "complementary-study":   "Estudio complementario",
  "eas":                   "EAS",
  "cmi":                   "CMI",
  "redcap":                "REDCap",
  "longi":                 "Longitudinal",
  "manual-entry":          "Entrada manual",
  "other":                 "Otras fuentes",
};

const CONFIDENCE_LABEL: Record<EvidenceConfidence, string> = {
  "not-evaluable": "No evaluable",
  "low":    "Confianza baja",
  "medium": "Confianza media",
  "high":   "Confianza alta",
};

interface EvidenceStorePanelProps {
  evidenceStore: EvidenceStore;
  defaultOpen?: boolean;
}

export function EvidenceStorePanel({ evidenceStore, defaultOpen = true }: EvidenceStorePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const atoms = evidenceStore.atoms;
  const byOrigin = new Map<string, number>();
  for (const atom of atoms) {
    const label = ORIGIN_LABEL[atom.provenance.origin as EvidenceOrigin] ?? atom.provenance.origin;
    byOrigin.set(label, (byOrigin.get(label) ?? 0) + 1);
  }

  return (
    <section className="workspace-panel ev-store-panel">
      <button
        type="button"
        className="ev-store-panel__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="ev-store-panel__toggle-label">
          Evidencias derivadas
          {atoms.length > 0 && (
            <span className="doc-repo__count">{atoms.length}</span>
          )}
        </span>
        <span className="ev-store-panel__toggle-sub">
          Representaciones estructuradas de la documentación municipal
        </span>
        <span className="ev-store-panel__toggle-arrow" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="ev-store-panel__body">
          {atoms.length === 0 ? (
            <p className="empty-state">
              Todavía no hay evidencias estructuradas. Añade documentación en el
              Repositorio para generar las primeras unidades de evidencia.
            </p>
          ) : (
            <>
              {/* Resumen por origen */}
              <div className="ev-store__summary">
                {[...byOrigin.entries()].map(([label, count]) => (
                  <span key={label} className="ev-store__origin-chip">
                    {label} <strong>{count}</strong>
                  </span>
                ))}
              </div>

              {/* Lista de átomos */}
              <div className="document-list">
                {atoms.map((atom) => (
                  <article className="document-row" key={atom.id}>
                    <div>
                      <p className="document-kind">
                        {KIND_LABEL[atom.kind] ?? atom.kind}
                      </p>
                      <h3>{atom.title}</h3>
                      <p className="evidence-atom__content">{atom.content}</p>
                      <p className="panel-note">
                        Fuente: {atom.provenance.documentId ? <DocumentReference documentId={atom.provenance.documentId}>{ORIGIN_LABEL[atom.provenance.origin as EvidenceOrigin] ?? atom.provenance.origin}</DocumentReference> : (ORIGIN_LABEL[atom.provenance.origin as EvidenceOrigin] ?? atom.provenance.origin)}
                      </p>
                    </div>
                    <span className="status-pill">
                      {CONFIDENCE_LABEL[atom.confidence] ?? atom.confidence}
                      {atom.provenance.origin === "sam" && !atom.methodology.version && " (SAM histórico; pendiente de reevaluación)"}
                    </span>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
