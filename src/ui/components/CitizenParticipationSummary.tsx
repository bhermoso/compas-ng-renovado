import type { ThematicPrioritisationStudy } from "../../domain/thematic-prioritisation";
import { SamObservedAssessment } from "./SamObservedAssessment";
import { getPopulationReferenceSet } from "../../application/sam/populationReferenceRegistry";
import "./CitizenParticipationSummary.css";

/**
 * Resumen de la participación ciudadana importada de REDCap (priorización temática):
 * temas por porcentaje de papeletas, quién participó por edad y sexo, y calidad de
 * la muestra (SAM). Presenta; no calcula ni decide. La priorización la decide el
 * proceso deliberativo, no este resumen.
 */

export interface CitizenParticipationSummaryProps {
  study?: ThematicPrioritisationStudy;
  municipalityId: string;
  municipalityName?: string;
}

const fmtInt = (n: number) => n.toLocaleString("es-ES");
const fmtPct = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function CitizenParticipationSummary({
  study,
  municipalityId,
  municipalityName,
}: CitizenParticipationSummaryProps) {
  if (!study || study.completeRecords === 0) return null;

  const mun = municipalityName ?? "el municipio";
  const maxPct = Math.max(...study.ranking.map((r) => r.pct), 1);
  const observed = study.ageSexObserved;
  const hasReference = getPopulationReferenceSet(municipalityId).allAges !== undefined;
  const bandsWithPeople = observed?.cells.filter((c) => c.male + c.female > 0) ?? [];

  return (
    <section className="citizen-summary" aria-label="Resumen de la participación ciudadana">
      <h3>Resumen de la participación ciudadana en {mun}</h3>
      <p className="citizen-summary__meta">
        {fmtInt(study.completeRecords)} papeletas completas de {fmtInt(study.totalRecords)} registros · {study.sourceFileName}
      </p>

      <h4>Temas marcados</h4>
      <p className="citizen-summary__hint">
        Porcentaje de papeletas completas que marcaron cada tema. Cada persona podía marcar hasta cinco.
      </p>
      <ol className="citizen-summary__ranking">
        {study.ranking.map((r) => (
          <li key={r.topicId}>
            <span className="citizen-summary__rank">{r.rank}</span>
            <span className="citizen-summary__label">{r.label}</span>
            <span className="citizen-summary__track" aria-hidden="true">
              <span className="citizen-summary__bar" style={{ width: `${(r.pct / maxPct) * 100}%` }} />
            </span>
            <span className="citizen-summary__value">
              {fmtPct(r.pct)} % <span className="citizen-summary__votes">({fmtInt(r.votes)})</span>
            </span>
          </li>
        ))}
      </ol>

      <h4>Quién participó</h4>
      {observed === undefined ? (
        <p className="citizen-summary__empty" role="status">
          El CSV importado no incluía las columnas «sexo» y «edad», o no se pudieron leer. No se describe quién participó ni se evalúa la representatividad.
        </p>
      ) : hasReference ? (
        <SamObservedAssessment
          municipalityId={municipalityId}
          instrumentId="priorizacion-tematica"
          title={`Priorización temática — ${mun}`}
          observed={observed.cells}
          missingReason="La priorización no conserva la edad y el sexo de las personas participantes."
        />
      ) : (
        <>
          <p className="citizen-summary__empty" role="status">
            No evaluable: no hay padrón por edad y sexo verificado para este municipio. Se muestra solo el recuento de participantes; SAM no estima la población.
          </p>
          <div className="citizen-summary__table-wrap">
            <table className="citizen-summary__table">
              <caption>Participantes por banda de edad y sexo</caption>
              <thead>
                <tr><th scope="col">Edad</th><th scope="col">Hombres</th><th scope="col">Mujeres</th></tr>
              </thead>
              <tbody>
                {bandsWithPeople.map((c) => (
                  <tr key={c.ageBand}>
                    <th scope="row">{c.ageBand}</th>
                    <td>{fmtInt(c.male)}</td>
                    <td>{fmtInt(c.female)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {observed.unassignableCount > 0 && (
            <p className="citizen-summary__hint">
              {observed.unassignableCount === 1
                ? "1 papeleta no se puede asignar a una celda"
                : `${fmtInt(observed.unassignableCount)} papeletas no se pueden asignar a una celda`}{" "}
              (sexo o edad no reconocibles) y no figuran en la tabla. No se imputan.
            </p>
          )}
        </>
      )}

      {study.methodologicalCautions.length > 0 && (
        <ul className="citizen-summary__cautions">
          {study.methodologicalCautions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      <p className="citizen-summary__note">
        Requiere validación humana. Este resumen describe lo que marcaron las personas participantes; la priorización la decide el proceso deliberativo del equipo técnico.
      </p>
    </section>
  );
}
