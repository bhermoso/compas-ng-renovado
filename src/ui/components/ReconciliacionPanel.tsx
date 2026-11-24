import { useState } from "react";
import type {
  ReconciliacionResult,
  TensionAnalizada,
  ConflictoInterpretativo,
  TipoConflicto,
} from "../../application/reconciliation";

// ── Etiquetas institucionales ─────────────────────────────────────────────────

const TIPO_CONFLICTO_LABEL: Record<TipoConflicto, string> = {
  tendencia:      "Tendencia",
  fuente:         "Fuente",
  escala:         "Escala",
  temporal:       "Temporal",
  interpretativo: "Interpretativo",
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

// Visualización compacta de criterios de relevancia/escalado.
// Muestra puntos rellenos (cumplido) o vacíos (no cumplido).
function CriteriaDots({ values, title }: { values: boolean[]; title: string }) {
  return (
    <span className="reco-criteria" title={title} aria-label={title}>
      {values.map((v, i) => (
        <span
          key={i}
          className={`reco-criterion ${v ? "reco-criterion--met" : "reco-criterion--unmet"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// Sección colapsable con badge de count
function ReconciliacionSection({
  title,
  count,
  variant,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  variant: "escalada" | "no-escalada" | "conflicto" | "ruido";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className={`reco-section reco-section--${variant}`}>
      <button
        className="reco-section__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="reco-section__title">{title}</span>
        <span className="reco-section__count">{count}</span>
        <span className="reco-section__arrow" aria-hidden="true">
          {open ? "▲" : "▾"}
        </span>
      </button>

      {open && <div className="reco-section__body">{children}</div>}
    </div>
  );
}

// ── Tarjeta de tensión ────────────────────────────────────────────────────────

function TensionCard({ tension }: { tension: TensionAnalizada }) {
  const relevValues = [
    tension.relevancia.impactoEstructuralPotencial,
    tension.relevancia.persistenciaInterpretativa,
    tension.relevancia.divergenciaFuenteSignificativa,
  ];
  const relevTitle =
    `Impacto estructural: ${tension.relevancia.impactoEstructuralPotencial ? "sí" : "no"} · ` +
    `Persistencia interpretativa: ${tension.relevancia.persistenciaInterpretativa ? "sí" : "no"} · ` +
    `Divergencia de fuente: ${tension.relevancia.divergenciaFuenteSignificativa ? "sí" : "no"}`;

  const escalValues = tension.criterios
    ? [
        tension.criterios.persistenciaTemporal,
        tension.criterios.convergenciaFuentes,
        tension.criterios.coherenciaEstructural,
      ]
    : null;
  const escalTitle = tension.criterios
    ? `Persistencia temporal: ${tension.criterios.persistenciaTemporal ? "sí" : "no"} · ` +
      `Convergencia de fuentes: ${tension.criterios.convergenciaFuentes ? "sí" : "no"} · ` +
      `Coherencia estructural: ${tension.criterios.coherenciaEstructural ? "sí" : "no"}`
    : "";

  return (
    <div className={`reco-tension-card reco-tension-card--${tension.clasificacion}`}>
      <p className="reco-tension-card__text">{tension.tension}</p>
      <div className="reco-tension-card__meta">
        <span className="reco-tension-card__meta-label">Relevancia</span>
        <CriteriaDots values={relevValues} title={relevTitle} />
        <span className="reco-tension-card__criteria-count">
          {tension.relevancia.criteriosCumplidos}/3
        </span>
        {escalValues !== null && (
          <>
            <span className="reco-tension-card__meta-sep" aria-hidden="true">·</span>
            <span className="reco-tension-card__meta-label">Escalado</span>
            <CriteriaDots values={escalValues} title={escalTitle} />
          </>
        )}
        {tension.clasificacion === "escalada" && (
          <span className="reco-tension-card__outcome">→ área de intervención</span>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de conflicto ──────────────────────────────────────────────────────

function ConflictoCard({ conflicto }: { conflicto: ConflictoInterpretativo }) {
  return (
    <div className="reco-conflicto-card">
      <div className="reco-conflicto-card__head">
        <span className="reco-conflicto-card__tipo">
          {TIPO_CONFLICTO_LABEL[conflicto.tipo]}
        </span>
        <span className="reco-conflicto-card__no-resuelta">no resuelto</span>
      </div>
      <p className="reco-conflicto-card__desc">{conflicto.descripcion}</p>
      {conflicto.fuentesImplicadas.length > 0 && (
        <p className="reco-conflicto-card__fuentes">
          Fuentes implicadas: {conflicto.fuentesImplicadas.join(", ")}
        </p>
      )}
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

interface ReconciliacionPanelProps {
  reconciliacion: ReconciliacionResult;
}

export function ReconciliacionPanel({ reconciliacion }: ReconciliacionPanelProps) {
  const {
    tensionesEscaladas,
    tensionesNoEscaladas,
    conflictos,
    ruidoEstructural,
  } = reconciliacion;

  const totalSignificativo =
    tensionesEscaladas.length + tensionesNoEscaladas.length + conflictos.length;

  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Explicabilidad</p>
          <h2>Análisis de tensiones y conflictos</h2>
        </div>
        <p className="panel-note">
          Cómo el sistema ha clasificado las tensiones detectadas: cuáles
          escalaron a áreas de intervención, cuáles permanecen como señales
          pendientes y qué conflictos entre fuentes no han podido resolverse.
        </p>
      </div>

      {/* ── Resumen de counts ───────────────────────────────── */}
      <div className="reco-summary-row">
        {tensionesEscaladas.length > 0 && (
          <span className="reco-summary-chip reco-summary-chip--escalada">
            {tensionesEscaladas.length} escalada{tensionesEscaladas.length !== 1 ? "s" : ""}
          </span>
        )}
        {tensionesNoEscaladas.length > 0 && (
          <span className="reco-summary-chip reco-summary-chip--no-escalada">
            {tensionesNoEscaladas.length} pendiente{tensionesNoEscaladas.length !== 1 ? "s" : ""}
          </span>
        )}
        {conflictos.length > 0 && (
          <span className="reco-summary-chip reco-summary-chip--conflicto">
            {conflictos.length} conflicto{conflictos.length !== 1 ? "s" : ""} sin resolver
          </span>
        )}
        {ruidoEstructural.length > 0 && (
          <span className="reco-summary-chip reco-summary-chip--ruido">
            {ruidoEstructural.length} descartado{ruidoEstructural.length !== 1 ? "s" : ""} como ruido
          </span>
        )}
        {totalSignificativo === 0 && ruidoEstructural.length === 0 && (
          <span className="reco-summary-chip reco-summary-chip--empty">
            Sin tensiones ni conflictos detectados
          </span>
        )}
      </div>

      {totalSignificativo === 0 && ruidoEstructural.length === 0 && (
        <p className="reco-empty-note">
          El estado territorial es homogéneo: no se han detectado tensiones
          entre fuentes ni conflictos interpretativos que requieran atención.
        </p>
      )}

      {/* ── Tensiones escaladas ──────────────────────────────── */}
      <ReconciliacionSection
        title="Tensiones escaladas a área de intervención"
        count={tensionesEscaladas.length}
        variant="escalada"
        defaultOpen={false}
      >
        <p className="reco-section__desc">
          Estas tensiones superaron los criterios de relevancia y de escalado.
          Cada una derivó en un área de intervención territorial visible en el
          análisis OIT.
        </p>
        {tensionesEscaladas.map((t, i) => (
          <TensionCard key={i} tension={t} />
        ))}
      </ReconciliacionSection>

      {/* ── Tensiones no escaladas ──────────────────────────── */}
      <ReconciliacionSection
        title="Tensiones relevantes no escaladas"
        count={tensionesNoEscaladas.length}
        variant="no-escalada"
        defaultOpen={false}
      >
        <p className="reco-section__desc">
          Estas tensiones superaron el filtro de relevancia (≥2 criterios) pero
          no cumplieron los tres criterios de escalado. Se registran como señales
          pendientes de seguimiento técnico.
        </p>
        {tensionesNoEscaladas.map((t, i) => (
          <TensionCard key={i} tension={t} />
        ))}
      </ReconciliacionSection>

      {/* ── Conflictos interpretativos ───────────────────────── */}
      <ReconciliacionSection
        title="Conflictos interpretativos"
        count={conflictos.length}
        variant="conflicto"
        defaultOpen={false}
      >
        <p className="reco-section__desc">
          Contradicciones detectadas entre fuentes o estados del territorio. El
          sistema los registra y estructura; no los resuelve. Requieren
          deliberación técnica.
        </p>
        {conflictos.map((c) => (
          <ConflictoCard key={c.id} conflicto={c} />
        ))}
      </ReconciliacionSection>

      {/* ── Ruido estructural ────────────────────────────────── */}
      <ReconciliacionSection
        title="Ruido estructural descartado"
        count={ruidoEstructural.length}
        variant="ruido"
        defaultOpen={false}
      >
        <p className="reco-section__desc">
          Tensiones detectadas que no superaron el filtro de relevancia (&lt;2
          criterios). Se registran como contexto informativo y no condicionan la
          planificación.
        </p>
        {ruidoEstructural.map((t, i) => (
          <TensionCard key={i} tension={t} />
        ))}
      </ReconciliacionSection>
    </section>
  );
}
