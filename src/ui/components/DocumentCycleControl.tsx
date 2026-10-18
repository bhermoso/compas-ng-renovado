import type { DocumentCycle, DocumentCycleStatus } from "../../domain/repository";
import { describeDocumentCycle } from "../../domain/repository";

interface DocumentCycleControlProps {
  cycle: DocumentCycle | undefined;
  onChange: (cycle: DocumentCycle | undefined) => void;
}

/**
 * Declara a qué ciclo diagnóstico pertenece una fuente. El año lo escribe el
 * equipo técnico; no se deduce del texto del documento.
 */
export function DocumentCycleControl({ cycle, onChange }: DocumentCycleControlProps) {
  const value = cycle?.status ?? "";
  return (
    <div className="doc-cycle">
      <p className="doc-cycle__label">{describeDocumentCycle(cycle)}</p>
      <div className="doc-cycle__fields">
        <select
          aria-label="Ciclo de la fuente"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "") onChange(undefined);
            else
              onChange({
                status: next as DocumentCycleStatus,
                ...(cycle?.referenceYear !== undefined ? { referenceYear: cycle.referenceYear } : {}),
              });
          }}
        >
          <option value="">Ciclo no declarado</option>
          <option value="current">Ciclo actual</option>
          <option value="historical">Ciclo histórico</option>
        </select>
        {cycle !== undefined && (
          <input
            type="number"
            aria-label="Año de referencia de la fuente"
            placeholder="Año"
            min={1900}
            max={2100}
            defaultValue={cycle.referenceYear ?? ""}
            onBlur={(event) => {
              const raw = event.target.value.trim();
              const year = Number(raw);
              const valid = raw !== "" && Number.isInteger(year) && year >= 1900 && year <= 2100;
              if (raw !== "" && !valid) return;
              const { referenceYear: _drop, ...rest } = cycle;
              void _drop;
              onChange(valid ? { ...rest, referenceYear: year } : rest);
            }}
          />
        )}
      </div>
    </div>
  );
}
