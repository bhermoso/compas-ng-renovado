import { useEffect, useState } from "react";
import type { SampleQualityAssessment } from "../../domain/sam";
import { buildSamTriPyramidRows, type SamTriPyramidRow as Row } from "./samTriPyramidRows";
import "./SamTriPyramid.css";

/**
 * Tripirámide SAM: población, afijación ideal (Hamilton) y muestra conseguida,
 * superpuestas en una sola pirámide por banda de edad y sexo. Solo presentación: no calcula representatividad,
 * la consume de `SampleQualityAssessment.representativeness`.
 *
 * Si falta el padrón por edad y sexo, o la muestra no tiene edad y sexo,
 * muestra "No evaluable" con el motivo. No rellena ni aproxima nada.
 */

export interface SamTriPyramidProps {
  assessment?: SampleQualityAssessment | null;
}

const fmtInt = (n: number) => n.toLocaleString("es-ES");
const fmtPct = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtPp = (n: number | null) => {
  if (n === null) return "no evaluable";
  const abs = Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rounded = Math.round(Math.abs(n) * 10) / 10;
  const sign = rounded === 0 ? "" : n > 0 ? "+" : "−";
  return `${sign}${abs} pp`;
};

const QUALITY_LABEL = { alta: "alta", moderada: "moderada", baja: "baja" } as const;

type Phase = "static" | "reset" | "play";

/** La animación se omite si la persona usuaria pide menos movimiento. */
function canAnimate(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Una sola pirámide con tres capas superpuestas por fila: población (trama),
 * afijación ideal (translúcida) y muestra conseguida (sólida). Cada capa se
 * dibuja como porcentaje de su propio total. Al mostrarse, las capas crecen en
 * ese orden; sin movimiento reducido, se muestran ya completas.
 */
function SuperposedPyramid({ rows, max, progress }: { rows: Row[]; max: number; progress: number }) {
  const [phase, setPhase] = useState<Phase>(() => (canAnimate() ? "reset" : "static"));

  useEffect(() => {
    if (phase !== "reset") return;
    const id = window.requestAnimationFrame(() => setPhase("play"));
    return () => window.cancelAnimationFrame(id);
  }, [phase]);

  const grow = (pct: number) => (phase === "reset" ? 0 : (pct / max) * 100);
  // La afijación ideal se muestra a la medida del recuento: ideal × (n / N).
  const layer = (kind: "pop" | "ideal" | "achieved", rawPct: number, side: "male" | "female", index: number) => {
    const pct = kind === "ideal" ? rawPct * progress : rawPct;
    return (
    <span
      className={`sam-tripyramid__layer sam-tripyramid__layer--${kind} sam-tripyramid__layer--${side}`}
      data-animated={phase === "play" ? "true" : undefined}
      style={{
        width: `${grow(pct)}%`,
        ...(phase === "play"
          ? { transitionDelay: `${(kind === "pop" ? 0 : kind === "ideal" ? 1 : 2) * 450 + index * 40}ms` }
          : {}),
      }}
    />
    );
  };

  return (
    <figure className="sam-tripyramid__pyramid">
      <figcaption>Población, afijación ideal y muestra conseguida</figcaption>
      <ul className="sam-tripyramid__legend" aria-label="Capas de la pirámide">
        <li><span className="sam-tripyramid__swatch sam-tripyramid__swatch--pop" aria-hidden="true" /> Población (trama)</li>
        <li><span className="sam-tripyramid__swatch sam-tripyramid__swatch--ideal" aria-hidden="true" /> Afijación ideal (translúcida)</li>
        <li><span className="sam-tripyramid__swatch sam-tripyramid__swatch--achieved" aria-hidden="true" /> Muestra conseguida (sólida)</li>
      </ul>
      <div className="sam-tripyramid__axis" aria-hidden="true">
        <span>Hombres</span>
        <span>Mujeres</span>
      </div>
      <ol className="sam-tripyramid__bars">
        {[...rows].reverse().map((r, index) => (
          <li
            key={r.ageBand}
            aria-label={
              `${r.ageBand} años. Hombres: población ${fmtInt(r.popMale)}, ideal ${fmtInt(r.idealMale)}, ` +
              `conseguida ${fmtPct(r.pctAchieved.male)} %. Mujeres: población ${fmtInt(r.popFemale)}, ideal ${fmtInt(r.idealFemale)}, ` +
              `conseguida ${fmtPct(r.pctAchieved.female)} %.`
            }
          >
            <span className="sam-tripyramid__side sam-tripyramid__side--male">
              {layer("pop", r.pctPop.male, "male", index)}
              {layer("ideal", r.pctIdeal.male, "male", index)}
              {layer("achieved", r.pctAchieved.male, "male", index)}
            </span>
            <span className="sam-tripyramid__band">{r.ageBand}</span>
            <span className="sam-tripyramid__side sam-tripyramid__side--female">
              {layer("pop", r.pctPop.female, "female", index)}
              {layer("ideal", r.pctIdeal.female, "female", index)}
              {layer("achieved", r.pctAchieved.female, "female", index)}
            </span>
          </li>
        ))}
      </ol>
      {canAnimate() && (
        <button type="button" className="sam-tripyramid__replay" onClick={() => setPhase("reset")}>
          Repetir animación
        </button>
      )}
    </figure>
  );
}

export function SamTriPyramid({ assessment }: SamTriPyramidProps) {
  const heading = "Tripirámide muestral (SAM)";

  if (!assessment) {
    return (
      <section className="sam-tripyramid" aria-label={heading}>
        <h3>{heading}</h3>
        <p className="sam-tripyramid__empty" role="status">
          No evaluable: no hay evaluación de calidad muestral para este estudio.
        </p>
      </section>
    );
  }

  const built = buildSamTriPyramidRows(assessment);
  if ("notEvaluable" in built) {
    return (
      <section className="sam-tripyramid" aria-label={heading}>
        <h3>{heading}</h3>
        <p className="sam-tripyramid__empty" role="status">
          {built.notEvaluable}
        </p>
      </section>
    );
  }

  const { rows } = built;
  const rep = assessment.representativeness!;
  const max = Math.max(
    ...rows.flatMap((r) => [
      r.pctPop.male, r.pctPop.female, r.pctIdeal.male, r.pctIdeal.female,
      r.pctAchieved.male, r.pctAchieved.female,
    ])
  );
  const ref = assessment.populationReference;
  const progress = assessment.nTheoretical > 0 ? Math.min(assessment.nObserved / assessment.nTheoretical, 1) : 1;

  return (
    <section className="sam-tripyramid" aria-label={heading}>
      <h3>{heading}</h3>
      <p className="sam-tripyramid__source">
        Población: {ref.source}. Muestra teórica: {fmtInt(assessment.nTheoretical)}; muestra conseguida:{" "}
        {fmtInt(assessment.nObserved)}. Cada capa muestra el porcentaje de cada celda sobre su propio total.
      </p>
      <div className="sam-tripyramid__progress">
        <progress
          value={Math.round(progress * 100)}
          max={100}
          aria-label="Avance del recuento sobre la muestra teórica"
        />
        <span data-sam-progress-text>
          Recuento: {fmtInt(assessment.nObserved)} de {fmtInt(assessment.nTheoretical)}{" "}
          ({Math.round(progress * 100)} %). La afijación ideal se dibuja a la medida del recuento.
        </span>
      </div>
      <SuperposedPyramid rows={rows} max={max} progress={progress} />

      <p className="sam-tripyramid__summary">
        Error absoluto medio: {fmtPp(rep.maePp).replace(/^\+/, "")}. Celdas dentro de ±{fmtPp(rep.tolerancePp).replace(/^\+/, "")}:{" "}
        {fmtPct(rep.pctWithinTolerance)} %. Representatividad demográfica: {QUALITY_LABEL[rep.qualityLabel]}.
      </p>
      <p className="sam-tripyramid__note">
        La etiqueta de representatividad es una convención parametrizable, no un umbral canónico.
      </p>

      <div className="sam-tripyramid__table-wrap">
        <table className="sam-tripyramid__table">
          <caption>Detalle por banda de edad y sexo</caption>
          <thead>
            <tr>
              <th scope="col">Edad</th>
              <th scope="col">Población H / M</th>
              <th scope="col">Ideal H / M</th>
              <th scope="col">Desviación H</th>
              <th scope="col">Desviación M</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ageBand}>
                <th scope="row">{r.ageBand}</th>
                <td>{fmtInt(r.popMale)} / {fmtInt(r.popFemale)}</td>
                <td>{fmtInt(r.idealMale)} / {fmtInt(r.idealFemale)}</td>
                <td>{fmtPp(r.diff.male)}</td>
                <td>{fmtPp(r.diff.female)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sam-tripyramid__note">
        Requiere validación humana. La decisión territorial corresponde siempre al equipo técnico.
      </p>
    </section>
  );
}
