import type { SampleQualityAssessment } from "../../domain/sam";
import { buildSamTriPyramidRows, type SamTriPyramidRow as Row } from "./samTriPyramidRows";
import "./SamTriPyramid.css";

/**
 * Tripirámide SAM: población, afijación ideal (Hamilton) y muestra conseguida,
 * por banda de edad y sexo. Solo presentación: no calcula representatividad,
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
const fmtPp = (n: number | null) =>
  n === null
    ? "no evaluable"
    : `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} pp`;

const QUALITY_LABEL = { alta: "alta", moderada: "moderada", baja: "baja" } as const;

function Pyramid({
  title,
  rows,
  pick,
  max,
  kind,
}: {
  title: string;
  rows: Row[];
  pick: (r: Row) => { male: number; female: number };
  max: number;
  kind: "pop" | "ideal" | "achieved";
}) {
  return (
    <figure className={`sam-tripyramid__pyramid sam-tripyramid__pyramid--${kind}`}>
      <figcaption>{title}</figcaption>
      <div className="sam-tripyramid__axis" aria-hidden="true">
        <span>Hombres</span>
        <span>Mujeres</span>
      </div>
      <ol className="sam-tripyramid__bars">
        {[...rows].reverse().map((r) => {
          const v = pick(r);
          return (
            <li
              key={r.ageBand}
              aria-label={`${r.ageBand} años: hombres ${fmtPct(v.male)} %, mujeres ${fmtPct(v.female)} %`}
            >
              <span className="sam-tripyramid__side sam-tripyramid__side--male">
                <span className="sam-tripyramid__bar" style={{ width: `${(v.male / max) * 100}%` }} />
              </span>
              <span className="sam-tripyramid__band">{r.ageBand}</span>
              <span className="sam-tripyramid__side sam-tripyramid__side--female">
                <span className="sam-tripyramid__bar" style={{ width: `${(v.female / max) * 100}%` }} />
              </span>
            </li>
          );
        })}
      </ol>
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

  return (
    <section className="sam-tripyramid" aria-label={heading}>
      <h3>{heading}</h3>
      <p className="sam-tripyramid__source">
        Población: {ref.source}. Muestra teórica: {fmtInt(assessment.nTheoretical)}; muestra conseguida:{" "}
        {fmtInt(assessment.nObserved)}. Cada pirámide muestra el porcentaje de cada celda sobre su propio total.
      </p>
      <div className="sam-tripyramid__pyramids">
        <Pyramid title="Población" rows={rows} pick={(r) => r.pctPop} max={max} kind="pop" />
        <Pyramid title="Afijación ideal" rows={rows} pick={(r) => r.pctIdeal} max={max} kind="ideal" />
        <Pyramid title="Muestra conseguida" rows={rows} pick={(r) => r.pctAchieved} max={max} kind="achieved" />
      </div>

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
