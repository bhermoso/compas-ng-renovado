import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import {
  ACTUATION_STATUS_LABEL, AGENDA_SETTING_LABEL, NEXT_CYCLE_DECISION_LABEL,
  type AgendaActuation,
} from "../../domain/agenda/AgendaActuation";
import { readActuation } from "../../application/agenda/agendaActuations";

interface Props {
  actuations: readonly AgendaActuation[];
  worksheets: readonly IndicatorWorksheet[];
  onOpen: (id: string) => void;
}

/** Lectura de solo consulta del bloque de resultados de la agenda. No duplica datos: lee de las fichas. */
export function AgendaResultSummary({ actuations, worksheets, onOpen }: Props) {
  if (actuations.length === 0) {
    return <p className="panel-note">La agenda aún no tiene actuaciones. Las fichas se crean en la vista Agenda.</p>;
  }
  return (
    <div className="agenda-results" style={{ overflowX: "auto" }}>
      <table>
        <caption>Resultados registrados en la agenda (solo lectura; se editan en cada ficha)</caption>
        <thead>
          <tr><th>Actuación</th><th>Entorno</th><th>Estado</th><th>Valor alcanzado</th><th>Resultado observado</th><th>Ciclo siguiente</th><th /></tr>
        </thead>
        <tbody>
          {actuations.map((a) => {
            const r = readActuation(a, worksheets);
            const observed = a.result.observedResult || r.consolidatedResult;
            return (
              <tr key={a.id}>
                <td>{r.name}</td>
                <td>{a.setting ? AGENDA_SETTING_LABEL[a.setting] : "Sin asignar"}</td>
                <td>{ACTUATION_STATUS_LABEL[a.tracking.status]}</td>
                <td>{a.result.indicatorValueReached || "No registrado"}</td>
                <td>{observed || "No registrado"}</td>
                <td>{NEXT_CYCLE_DECISION_LABEL[a.result.nextCycleDecision]}</td>
                <td><button type="button" onClick={() => onOpen(a.id)}>Abrir ficha</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
