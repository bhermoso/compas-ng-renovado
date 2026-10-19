import { useState } from "react";
import type {
  ConciliationRelation,
  CycleConciliation,
  MunicipalDocument,
  MunicipalDocumentRepository,
} from "../../domain/repository";
import { describeDocumentCycle } from "../../domain/repository";

const RELATION_OPTIONS: Array<{ value: ConciliationRelation; label: string }> = [
  { value: "convergence", label: "Convergencia" },
  { value: "divergence", label: "Divergencia (se declara, no se resuelve)" },
  { value: "not-comparable", label: "No comparable" },
];

const RELATION_SHORT: Record<ConciliationRelation, string> = {
  convergence: "Convergencia",
  divergence: "Divergencia",
  "not-comparable": "No comparable",
};

interface CycleConciliationPanelProps {
  repository: MunicipalDocumentRepository;
  onAdd: (conciliation: Omit<CycleConciliation, "declaredAt">) => void;
  onRemove: (conciliationId: string) => void;
}

/**
 * Registro de conciliaciones entre una fuente histórica y una actual. Solo se
 * ofrece cuando el equipo técnico ha declarado el ciclo de ambas. Cada entrada la
 * redacta una persona: el sistema no empareja ni propone coincidencias.
 */
export function CycleConciliationPanel({ repository, onAdd, onRemove }: CycleConciliationPanelProps) {
  const historical = repository.documents.filter((d) => d.cycle?.status === "historical");
  const current = repository.documents.filter((d) => d.cycle?.status === "current");
  const [topic, setTopic] = useState("");
  const [relation, setRelation] = useState<ConciliationRelation>("convergence");
  const [historicalId, setHistoricalId] = useState("");
  const [historicalStatement, setHistoricalStatement] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [currentStatement, setCurrentStatement] = useState("");
  const [note, setNote] = useState("");

  if (historical.length === 0 || current.length === 0) return null;

  const titleOf = (id: string): string =>
    repository.documents.find((d) => d.id === id)?.title ?? "Documento no encontrado";

  const canAdd =
    topic.trim() !== "" &&
    historicalId !== "" &&
    currentId !== "" &&
    historicalStatement.trim() !== "" &&
    currentStatement.trim() !== "";

  function submit() {
    if (!canAdd) return;
    onAdd({
      id: `conc-${Date.now().toString(36)}`,
      topic: topic.trim(),
      relation,
      historical: { documentId: historicalId, statement: historicalStatement.trim() },
      current: { documentId: currentId, statement: currentStatement.trim() },
      ...(note.trim() !== "" ? { note: note.trim() } : {}),
    });
    setTopic("");
    setHistoricalStatement("");
    setCurrentStatement("");
    setNote("");
  }

  const option = (d: MunicipalDocument) => (
    <option key={d.id} value={d.id}>
      {d.title} · {describeDocumentCycle(d.cycle)}
    </option>
  );

  return (
    <section className="workspace-panel" aria-labelledby="conciliation-title">
      <h2 id="conciliation-title">Conciliación entre ciclos</h2>
      <p>
        Registra aquí solo lo que una fuente histórica y una actual dicen sobre la misma pregunta o el mismo
        indicador. Cada entrada la redacta el equipo técnico; el sistema no propone coincidencias. Las
        entradas aparecen en «Antecedentes de ciclos anteriores» del Perfil.
      </p>
      {(repository.conciliations ?? []).length > 0 && (
        <ul className="document-list">
          {(repository.conciliations ?? []).map((c) => (
            <li key={c.id} className="document-row">
              <div>
                <p className="document-kind">{RELATION_SHORT[c.relation]}</p>
                <h3>{c.topic}</h3>
                <p>{titleOf(c.historical.documentId)}: {c.historical.statement}</p>
                <p>{titleOf(c.current.documentId)}: {c.current.statement}</p>
                {c.note !== undefined && <p>Nota: {c.note}</p>}
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => onRemove(c.id)}>
                  Retirar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="doc-cycle__fields">
        <label>
          Pregunta o indicador compartido
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </label>
        <label>
          Relación
          <select value={relation} onChange={(e) => setRelation(e.target.value as ConciliationRelation)}>
            {RELATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="doc-cycle__fields">
        <label>
          Fuente histórica
          <select value={historicalId} onChange={(e) => setHistoricalId(e.target.value)}>
            <option value="">Elegir fuente</option>
            {historical.map(option)}
          </select>
        </label>
        <label>
          Qué dice la fuente histórica
          <textarea value={historicalStatement} onChange={(e) => setHistoricalStatement(e.target.value)} rows={2} />
        </label>
      </div>
      <div className="doc-cycle__fields">
        <label>
          Fuente actual
          <select value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
            <option value="">Elegir fuente</option>
            {current.map(option)}
          </select>
        </label>
        <label>
          Qué dice la fuente actual
          <textarea value={currentStatement} onChange={(e) => setCurrentStatement(e.target.value)} rows={2} />
        </label>
      </div>
      <label>
        Nota del equipo técnico (opcional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button type="button" onClick={submit} disabled={!canAdd}>
        Registrar conciliación
      </button>
    </section>
  );
}
