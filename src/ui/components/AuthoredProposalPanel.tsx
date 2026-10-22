import { useState } from "react";
import type { AuthoredProposal } from "../../domain/repository";
import { tipoForAuthored, validateAuthoredProposal } from "../../application/proposals";
import { STEP_ALLOWED_TYPES, type StatementType } from "../../domain/statements/statementTypes";

const TYPE_LABEL: Record<StatementType, string> = {
  hecho: "Hecho",
  interpretacion: "Interpretación",
  hipotesis: "Hipótesis",
  orientacion: "Orientación técnica",
  percepcion: "Percepción",
  cautela: "Cautela",
  laguna: "Laguna",
  "decision-posterior": "Decisión posterior",
};

interface AuthoredProposalPanelProps {
  proposals: ReadonlyArray<AuthoredProposal>;
  onAdd: (proposal: Omit<AuthoredProposal, "authoredAt">) => void;
  onRemove: (proposalId: string) => void;
}

/**
 * Cierre interpretativo del equipo técnico (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis):
 * el equipo redacta conclusiones y orientaciones citando la evidencia. Registrar una
 * propuesta no la elige: pasa al menú, donde se elige o se descarta.
 */
export function AuthoredProposalPanel({ proposals, onAdd, onRemove }: AuthoredProposalPanelProps) {
  const [id, setId] = useState("");
  const [kind, setKind] = useState<"conclusion" | "orientation">("conclusion");
  const [tipo, setTipo] = useState<"" | StatementType>("");
  const [text, setText] = useState("");
  const [evidence, setEvidence] = useState("");
  const [conclusionIds, setConclusionIds] = useState<string[]>([]);
  const [sustento, setSustento] = useState<"" | "1" | "2" | "3">("");
  const [cautelas, setCautelas] = useState("");
  const [author, setAuthor] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const conclusions = proposals.filter((p) => p.kind === "conclusion");

  function submit() {
    const candidate: Omit<AuthoredProposal, "authoredAt"> = {
      id: id.trim(),
      kind,
      ...(tipoForAuthored(kind, tipo) !== undefined ? { tipo: tipoForAuthored(kind, tipo) } : {}),
      text: text.trim(),
      evidence: evidence.split("\n").map((l) => l.trim()).filter((l) => l !== ""),
      ...(kind === "orientation" ? { conclusionIds } : {}),
      ...(sustento !== "" ? { sustento: Number(sustento) as 1 | 2 | 3 } : {}),
      ...(cautelas.trim() !== "" ? { cautelas: cautelas.trim() } : {}),
      authoredBy: author.trim(),
    };
    const found = validateAuthoredProposal(candidate, proposals);
    setProblems(found);
    if (found.length > 0) return;
    onAdd(candidate);
    setId("");
    setText("");
    setTipo("");
    setEvidence("");
    setConclusionIds([]);
    setSustento("");
    setCautelas("");
  }

  return (
    <section className="workspace-panel" aria-labelledby="authored-proposals-title">
      <h2 id="authored-proposals-title">Cierre interpretativo del equipo técnico</h2>
      <p>
        Redacta conclusiones y orientaciones que no salen de la lectura por tema. Cada una cita su
        evidencia. Registrar una propuesta no la elige: pasa al menú de propuestas, donde se elige o se
        descarta. Una orientación deriva de conclusiones registradas, declara el grado de sustento de su
        relación y no fija responsable, plazo, recurso ni indicador de ejecución.
      </p>
      <label>
        Identificador (p. ej. C1, O1)
        <input type="text" value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <label>
        Tipo
        <select value={kind} onChange={(e) => setKind(e.target.value as "conclusion" | "orientation")}>
          <option value="conclusion">Conclusión</option>
          <option value="orientation">Orientación técnica</option>
        </select>
      </label>
      {kind === "conclusion" && (
        <label>
          Tipo de afirmación (Art. 8)
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "" | StatementType)}>
            <option value="">Sin clasificar</option>
            {STEP_ALLOWED_TYPES.concluir
              .filter((t) => t !== "cautela")
              .map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
          </select>
        </label>
      )}
      <label>
        Texto
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label>
        Evidencia citada (una por línea: documento y localización)
        <textarea rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
      </label>
      {kind === "orientation" && (
        <fieldset>
          <legend>Conclusiones de las que deriva</legend>
          {conclusions.length === 0 && <p>No hay conclusiones registradas.</p>}
          {conclusions.map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={conclusionIds.includes(c.id)}
                onChange={(e) =>
                  setConclusionIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                }
              />
              {c.id}: {c.text.slice(0, 80)}
            </label>
          ))}
        </fieldset>
      )}
      <label>
        Grado de sustento de la relación (Art. 8 bis)
        <select value={sustento} onChange={(e) => setSustento(e.target.value as "" | "1" | "2" | "3")}>
          <option value="">No se apoya en una relación</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3 (no sostiene orientación)</option>
        </select>
      </label>
      <label>
        Salvedades (opcional)
        <textarea rows={2} value={cautelas} onChange={(e) => setCautelas(e.target.value)} />
      </label>
      <label>
        Autoría
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      {problems.map((m) => (
        <p key={m} role="alert">{m}</p>
      ))}
      <button type="button" onClick={submit}>Registrar propuesta</button>
      {proposals.length > 0 && (
        <ul className="document-list">
          {proposals.map((p) => (
            <li key={p.id} className="document-row">
              <div>
                <p className="document-kind">
                  {p.id} · {p.kind === "conclusion" ? "Conclusión" : "Orientación técnica"} · {p.tipo !== undefined ? TYPE_LABEL[p.tipo] : "sin tipo"} · {p.authoredBy} ·{" "}
                  {p.authoredAt.slice(0, 10)}
                </p>
                <p>{p.text}</p>
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => onRemove(p.id)}>Retirar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
