import type { ConsolidationPlan } from "../../application/workspace/currentSources";

function day(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Deja un solo ejemplar de cada fuente del proceso actual (informe de salud,
 * estudios complementarios, Localiza Salud y priorización). Muestra antes qué se
 * conserva y qué se elimina; los documentos de ciclo histórico no se tocan.
 */
export function CurrentSourcesPanel({
  plan,
  municipalityName,
  disabled = false,
  onApply,
}: {
  plan: ConsolidationPlan;
  municipalityName: string;
  disabled?: boolean;
  onApply: () => void;
}) {
  if (plan.isEmpty) {
    return (
      <section className="backup-panel" aria-label="Versiones vigentes de las fuentes">
        <h2>Versiones vigentes de las fuentes</h2>
        <p>{municipalityName} tiene un solo ejemplar de cada fuente del proceso actual.</p>
      </section>
    );
  }
  const removeCount = plan.entries.reduce((sum, entry) => sum + entry.remove.length, 0);
  return (
    <section className="backup-panel" aria-label="Versiones vigentes de las fuentes">
      <h2>Versiones vigentes de las fuentes</h2>
      <p>
        En el proceso actual solo debe quedar el último ejemplar de cada fuente. {municipalityName} tiene
        versiones anteriores que se eliminarían del expediente y de Firebase, con sus originales y evidencias.
        Los documentos declarados de ciclo histórico se conservan.
      </p>
      <ul>
        {plan.entries.map(entry => (
          <li key={entry.label}>
            <strong>{entry.label}.</strong>{" "}
            {entry.keep
              ? <>Se conserva «{entry.keep.title}» ({day(entry.keep.createdAt)}).</>
              : <>No hay una versión vigente identificable.</>}{" "}
            Se eliminan: {entry.remove.map(document => `«${document.title}» (${day(document.createdAt)})`).join("; ")}.
          </li>
        ))}
        {plan.replacedCopies > 0 && (
          <li>Se eliminan también las copias internas que COMPÁS guardaba de sustituciones anteriores.</li>
        )}
      </ul>
      <p>Antes de continuar, descarga una copia del expediente con el botón de arriba.</p>
      <div className="backup-panel__actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const message = removeCount > 0
              ? `Se eliminarán ${removeCount} documento(s) de versiones anteriores de ${municipalityName}, también en Firebase. No se puede deshacer salvo con una copia descargada. ¿Continuar?`
              : `Se eliminarán las copias internas de sustituciones anteriores de ${municipalityName}, también en Firebase. ¿Continuar?`;
            if (window.confirm(message)) onApply();
          }}
        >
          Dejar solo la última versión
        </button>
      </div>
    </section>
  );
}
