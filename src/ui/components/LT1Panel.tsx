import { useState } from "react";
import type { LT1Result } from "../../application/lt1";
import type { EvidenceAtom, EvidenceConfidence, EvidenceOrigin } from "../../domain/evidence";

// ── Etiquetas institucionales ─────────────────────────────────────────────────

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
};

const CONFIDENCE_LABEL: Record<EvidenceConfidence, string> = {
  "not-evaluable": "No evaluable",
  high:   "Alta",
  medium: "Media",
  low:    "Baja",
};

// ── Sub-componente: tarjeta de átomo ──────────────────────────────────────────
// Muestra un EvidenceAtom con título, contenido truncado, confianza y origen.
// La truncación evita que átomos con contenido largo colapsen la vista.

const CONTENT_MAX = 220;

function AtomCard({ atom }: { atom: EvidenceAtom }) {
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = atom.content.length > CONTENT_MAX;
  const displayContent =
    needsTruncation && !expanded
      ? atom.content.slice(0, CONTENT_MAX).trimEnd() + "…"
      : atom.content;

  const originLabel =
    ORIGIN_LABEL[atom.provenance.origin as EvidenceOrigin] ??
    atom.provenance.origin;

  return (
    <div className={`lt1-atom lt1-atom--${atom.confidence}`}>
      <div className="lt1-atom__head">
        <p className="lt1-atom__title">{atom.title}</p>
        <span className={`lt1-atom__confidence lt1-atom__confidence--${atom.confidence}`}>
          {CONFIDENCE_LABEL[atom.confidence]}
          {atom.provenance.origin === "sam" && !atom.methodology.version && " (SAM histórico; pendiente de reevaluación)"}
        </span>
      </div>

      <p className="lt1-atom__content">{displayContent}</p>

      {needsTruncation && (
        <button
          className="lt1-atom__expand-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Mostrar menos" : "Leer más"}
        </button>
      )}

      <p className="lt1-atom__source">
        {atom.provenance.sourceLabel
          ? `${atom.provenance.sourceLabel} · ${originLabel}`
          : originLabel}
      </p>
    </div>
  );
}

// ── Sub-componente: sección colapsable de átomos ──────────────────────────────

function AtomSection({
  title,
  atoms,
  variant,
  defaultOpen = false,
}: {
  title: string;
  atoms: EvidenceAtom[];
  variant: "determinant" | "asset" | "indicator" | "qualitative" | "caution";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (atoms.length === 0) return null;

  return (
    <div className={`lt1-section lt1-section--${variant}`}>
      <button
        className="lt1-section__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="lt1-section__title">{title}</span>
        <span className="lt1-section__count">{atoms.length}</span>
        <span className="lt1-section__arrow" aria-hidden="true">
          {open ? "▲" : "▾"}
        </span>
      </button>

      {open && (
        <div className="lt1-section__body">
          {atoms.map((atom) => (
            <AtomCard key={atom.id} atom={atom} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

interface LT1PanelProps {
  lt1: LT1Result;
}

export function LT1Panel({ lt1 }: LT1PanelProps) {
  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Lectura territorial</p>
          <h2>Lectura territorial inicial</h2>
        </div>
        <p className="panel-note">
          Lectura preliminar, no causal y no priorizadora. Requiere validación
          técnica y comunitaria.
        </p>
      </div>

      {/* ── Síntesis narrativa ───────────────────────────────── */}
      <article className="card">
        <h3>Síntesis</h3>
        <p>{lt1.summary}</p>
      </article>

      {/* ── Contadores de resumen (se mantienen como estaban) ── */}
      <section className="grid">
        <article className="card">
          <h3>Determinantes</h3>
          <p>{lt1.determinants.length}</p>
        </article>
        <article className="card">
          <h3>Activos</h3>
          <p>{lt1.assets.length}</p>
        </article>
        <article className="card">
          <h3>Indicadores</h3>
          <p>{lt1.indicators.length}</p>
        </article>
        <article className="card">
          <h3>Cautelas</h3>
          <p>{lt1.methodologicalCautions.length}</p>
        </article>
      </section>

      {/* ── Contenido detallado por categoría ──────────────────
          Cada sección colapsa/expande de forma independiente.
          Por defecto colapsadas para no saturar la vista.    */}
      <AtomSection
        title="Determinantes de salud"
        atoms={lt1.determinants}
        variant="determinant"
      />
      <AtomSection
        title="Activos comunitarios"
        atoms={lt1.assets}
        variant="asset"
      />
      <AtomSection
        title="Indicadores disponibles"
        atoms={lt1.indicators}
        variant="indicator"
      />
      <AtomSection
        title="Hallazgos participativos y cualitativos"
        atoms={lt1.qualitativeFindings}
        variant="qualitative"
      />
      <AtomSection
        title="Cautelas metodológicas"
        atoms={lt1.methodologicalCautions}
        variant="caution"
      />

      {/* ── Oportunidades preliminares (se mantiene como estaba) */}
      {lt1.preliminaryOpportunities.length > 0 && (
        <div className="document-list">
          <h3>Orientaciones preliminares</h3>
          {lt1.preliminaryOpportunities.map((opportunity) => (
            <p key={opportunity}>{opportunity}</p>
          ))}
        </div>
      )}
    </section>
  );
}
