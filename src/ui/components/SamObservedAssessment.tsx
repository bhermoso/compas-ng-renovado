import { useState } from "react";
import type { AgeSexCell } from "../../domain/sam/PopulationReference";
import { assessSample, parseAgeBandLabel, type SampleAssessmentResult } from "../../application/sam/assessSample";
import { getPopulationReferenceSet } from "../../application/sam/populationReferenceRegistry";
import { SamAssessmentPanel } from "./SamAssessmentPanel";
import "./SamObservedAssessment.css";

/**
 * SAM sobre un recuento ya agregado por edad y sexo (p. ej. el de un estudio
 * importado). La persona usuaria elige el rango de edad del padrón con el que se
 * compara la muestra: ese rango define el universo y no lo decide SAM.
 */

export interface SamObservedAssessmentProps {
  municipalityId: string;
  instrumentId: string;
  title: string;
  /** Recuento observado por banda de edad y sexo. Si falta, se explica por qué. */
  observed?: ReadonlyArray<AgeSexCell>;
  /** Motivo que se muestra cuando falta `observed`. */
  missingReason: string;
  /** Edad mínima con la que se propone empezar el rango (por defecto, la primera banda). */
  defaultFromAge?: number;
}

export function SamObservedAssessment({
  municipalityId,
  instrumentId,
  title,
  observed,
  missingReason,
  defaultFromAge = 0,
}: SamObservedAssessmentProps) {
  const reference = getPopulationReferenceSet(municipalityId).allAges;
  const labels = (reference?.ageSexMatrix ?? []).map((c) => c.ageBand);
  const firstDefault =
    labels.find((l) => (parseAgeBandLabel(l)?.min ?? 0) >= defaultFromAge) ?? labels[0] ?? "";
  const [from, setFrom] = useState<string>(firstDefault);
  const [to, setTo] = useState<string>(labels[labels.length - 1] ?? "");

  if (!observed || labels.length === 0) {
    return (
      <SamAssessmentPanel
        title={title}
        result={{
          status: "not-evaluable",
          reasons: [
            !observed
              ? missingReason
              : "No hay padrón por edad y sexo verificado para este municipio. SAM no estima la población.",
          ],
        }}
      />
    );
  }

  const fromBand = parseAgeBandLabel(from);
  const toBand = parseAgeBandLabel(to);
  const rangeValid = fromBand !== null && toBand !== null && fromBand.min <= toBand.min;

  const result: SampleAssessmentResult = rangeValid
    ? assessSample({
        instrumentId,
        municipalityId,
        observedCells: observed,
        ageRange: { min: fromBand.min, max: toBand.max },
      })
    : {
        status: "not-evaluable",
        reasons: ["El rango de edad elegido no es válido: la banda inicial debe ser anterior o igual a la final."],
      };

  return (
    <div className="sam-observed">
      <div className="sam-observed__range">
        <span className="sam-observed__legend">Rango de edad del padrón con el que se compara la muestra</span>
        <label>
          Desde
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {labels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Hasta
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {labels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <span className="sam-observed__hint">
          Elija el rango que corresponde al universo de la muestra. Los participantes de bandas fuera del rango se declaran y no entran en el dictamen.
        </span>
      </div>
      <SamAssessmentPanel title={title} result={result} />
    </div>
  );
}
