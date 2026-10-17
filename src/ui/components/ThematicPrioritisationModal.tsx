import { useEffect } from "react";
import type { ThematicTopic } from "../../domain/thematic-prioritisation";
import {
  MAX_SELECTED_TOPICS,
  type ThematicPrioritisationStudy,
} from "../../domain/thematic-prioritisation";

interface ThematicPrioritisationModalProps {
  isOpen: boolean;
  topics: readonly ThematicTopic[];
  selectedIds: string[];
  savedIds: string[];
  study?: ThematicPrioritisationStudy;
  isImporting: boolean;
  importMessage: string | null;
  onToggle: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
  onImportCSV: (file: File) => void;
  onApplyTopFive: (topicIds: string[]) => void;
}

function sameSelection(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

export function ThematicPrioritisationModal({
  isOpen,
  topics,
  selectedIds,
  savedIds,
  study,
  isImporting,
  importMessage,
  onToggle,
  onSave,
  onClose,
  onImportCSV,
  onApplyTopFive,
}: ThematicPrioritisationModalProps) {
  const count = selectedIds.length;
  const atMax = count >= MAX_SELECTED_TOPICS;

  const hasChanges = !sameSelection(selectedIds, savedIds);
  const topFiveMatchesSelection =
    study !== undefined &&
    study.completeRecords > 0 &&
    sameSelection(study.topFiveTopicIds, selectedIds);
  const canApplyTopFive =
    study !== undefined &&
    study.completeRecords > 0 &&
    study.topFiveTopicIds.length > 0 &&
    !topFiveMatchesSelection;

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="tp-modal-backdrop" onClick={handleBackdrop} role="presentation">
      <div
        className="tp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tp-modal-title"
      >
        {/* ── Cabecera ─────────────────────────────────────── */}
        <div className="tp-modal__header">
          <div className="tp-modal__header-text">
            <p className="eyebrow">Participación ciudadana · Resultados REDCap</p>
            <h2 id="tp-modal-title" className="tp-modal__title">
              Temáticas ciudadanas incorporadas a la priorización
            </h2>
            <p className="tp-modal__desc">
              Registra hasta <strong>{MAX_SELECTED_TOPICS} temáticas</strong> procedentes
              de la encuesta REDCap o de una transcripción técnica validada. Su valor
              es informativo para la deliberación; no sustituye la votación ciudadana.
            </p>
          </div>
          <button
            type="button"
            className="tp-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* ── Contador ─────────────────────────────────────── */}
        <div className="tp-modal__counter-bar">
          <span
            className={`tp-modal__counter-pill${atMax ? " tp-modal__counter-pill--full" : ""}`}
          >
            {count} / {MAX_SELECTED_TOPICS}
          </span>
          <span className="tp-modal__counter-label">
            {atMax
              ? "Límite alcanzado · Deselecciona una para cambiar"
              : count === 0
              ? "Ninguna seleccionada aún"
              : `${MAX_SELECTED_TOPICS - count} más disponible${MAX_SELECTED_TOPICS - count !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Cuadrícula de temas ───────────────────────────── */}
        <div className="tp-modal__grid">
          {topics.map((topic, index) => {
            const isSelected = selectedIds.includes(topic.id);
            const isDisabled = !isSelected && atMax;
            return (
              <button
                key={topic.id}
                type="button"
                className={[
                  "tp-card",
                  isSelected ? "tp-card--selected" : "",
                  isDisabled ? "tp-card--disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => !isDisabled && onToggle(topic.id)}
                aria-pressed={isSelected}
                disabled={isDisabled}
              >
                <span className="tp-card__num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {isSelected && (
                  <span className="tp-card__check" aria-hidden="true">✓</span>
                )}
                <span className="tp-card__label">{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Importar REDCap ───────────────────────────────── */}
        <div className="tp-modal__import">
          <p className="tp-modal__import-title">
            Importar resultados de participación ciudadana (REDCap)
          </p>
          <p className="tp-modal__import-desc">
            Carga la exportación CSV del formulario{" "}
            <code>papeleta_pri_tematica</code>. COMPÁS calculará el
            ranking y propondrá el Top&nbsp;5 como lectura informativa.
          </p>

          <div className="tp-import-zone">
            <label className="tp-import-zone__label" htmlFor="tp-redcap-input">
              Seleccionar fichero REDCap (.csv)
            </label>
            <input
              id="tp-redcap-input"
              type="file"
              accept=".csv"
              disabled={isImporting}
              className="tp-import-zone__input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file !== undefined) onImportCSV(file);
                e.target.value = "";
              }}
            />
          </div>

          {isImporting && (
            <p className="tp-import-zone__hint">Procesando CSV…</p>
          )}
          {importMessage !== null && !isImporting && (
            <p className="tp-import-zone__hint">{importMessage}</p>
          )}

          {/* Resultado del estudio */}
          {study !== undefined && (
            <div className="tp-study">
              <div className="tp-study__meta">
                <span className="tp-study__file">{study.sourceFileName}</span>
                <span className="tp-study__counts">
                  {study.completeRecords} papeletas completas de{" "}
                  {study.totalRecords} · Importado{" "}
                  {new Date(study.importedAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              <ol className="tp-ranking">
                {study.ranking.map((r) => (
                  <li
                    key={r.topicId}
                    className={`tp-ranking__row${r.rank <= 5 ? " tp-ranking__row--top5" : ""}`}
                  >
                    <span className="tp-ranking__pos">{r.rank}</span>
                    <span className="tp-ranking__label">{r.label}</span>
                    <span className="tp-ranking__bar-wrap">
                      <span
                        className="tp-ranking__bar"
                        style={{ width: `${r.pct}%` }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="tp-ranking__votes">
                      {r.votes} <span className="tp-ranking__pct">({r.pct}%)</span>
                    </span>
                  </li>
                ))}
              </ol>

              {study.methodologicalCautions.length > 0 && (
                <ul className="tp-study__cautions">
                  {study.methodologicalCautions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}

              {topFiveMatchesSelection && (
                <p className="tp-study__status">
                  Top 5 incorporado. No hay cambios pendientes que guardar.
                </p>
              )}

              <button
                type="button"
                className={`tp-apply-btn${
                  topFiveMatchesSelection ? " tp-apply-btn--applied" : ""
                }`}
                onClick={() => onApplyTopFive(study.topFiveTopicIds)}
                disabled={!canApplyTopFive}
              >
                {topFiveMatchesSelection
                  ? "Top 5 incorporado como resultado informativo"
                  : selectedIds.length > 0
                    ? "Restaurar Top 5 como resultado informativo"
                    : "Incorporar Top 5 como resultado informativo"}
              </button>
            </div>
          )}
        </div>

        {/* ── Pie ──────────────────────────────────────────── */}
        <div className="tp-modal__footer">
          <button type="button" className="tp-modal__btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="tp-modal__btn-save"
            onClick={onSave}
            disabled={!hasChanges}
          >
            {hasChanges ? "Guardar resultado" : "Resultado guardado"}
          </button>
        </div>
      </div>
    </div>
  );
}
