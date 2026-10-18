import type { SampleAssessmentResult } from "../../application/sam/assessSample";
import { SamTriPyramid } from "./SamTriPyramid";
import "./SamAssessmentPanel.css";

/**
 * Panel reutilizable de SAM: se monta allí donde haya una muestra.
 * Recibe el resultado de `assessSample` y lo presenta; no calcula nada.
 */

export interface SamAssessmentPanelProps {
  result: SampleAssessmentResult;
  /** Nombre de la muestra, tal como lo ve la persona usuaria (p. ej. «IBSE 2026»). */
  title?: string;
}

const QUALITY = { high: "alta", medium: "media", low: "baja" } as const;
const fmtInt = (n: number) => n.toLocaleString("es-ES");
const fmtPct = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function SamAssessmentPanel({ result, title }: SamAssessmentPanelProps) {
  const heading = title ? `Calidad muestral (SAM) — ${title}` : "Calidad muestral (SAM)";

  if (result.status === "not-evaluable") {
    return (
      <section className="sam-panel" aria-label={heading}>
        <h2>{heading}</h2>
        <p className="sam-panel__status" role="status">No evaluable</p>
        <ul className="sam-panel__reasons">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="sam-panel__note">
          SAM no estima ni sustituye datos que faltan. La decisión territorial corresponde siempre al equipo técnico.
        </p>
      </section>
    );
  }

  const a = result.assessment;
  return (
    <section className="sam-panel" aria-label={heading}>
      <h2>{heading}</h2>
      <dl className="sam-panel__figures">
        <div><dt>Población de referencia</dt><dd>{fmtInt(a.populationReference.populationTotal)}</dd></div>
        <div><dt>Muestra teórica</dt><dd>{fmtInt(a.nTheoretical)}</dd></div>
        <div><dt>Muestra conseguida</dt><dd>{fmtInt(a.nObserved)}</dd></div>
        <div><dt>Cobertura</dt><dd>{fmtPct(a.coverageGlobal)} %</dd></div>
        <div><dt>Calidad por tamaño</dt><dd>{QUALITY[a.sampleQuality]}</dd></div>
      </dl>
      <p className="sam-panel__rationale">{a.sampleQualityRationale}</p>

      {result.representativenessNote ? (
        <p className="sam-panel__status" role="status">{result.representativenessNote}</p>
      ) : (
        <SamTriPyramid assessment={a} />
      )}

      {result.notes.length > 0 && (
        <ul className="sam-panel__reasons">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <details className="sam-panel__cautions">
        <summary>Cautelas metodológicas</summary>
        <ul>
          {a.methodologicalCautions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>
      <p className="sam-panel__note">
        Requiere validación humana. La calidad muestral informa y no modifica los resultados del estudio. La decisión territorial corresponde siempre al equipo técnico.
      </p>
    </section>
  );
}
