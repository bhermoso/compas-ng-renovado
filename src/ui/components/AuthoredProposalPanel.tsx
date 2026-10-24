import { useState } from "react";
import type { AuthoredProposal, RelationDeclaration } from "../../domain/repository";
import { currentRelations } from "../../application/relations";
import { draftOrientationFromRelation } from "../../application/proposals";
import { tipoForAuthored, validateAuthoredProposal } from "../../application/proposals";
import {
  RECOMMENDATION_KINDS,
  RECOMMENDATION_LABEL,
  STEP_ALLOWED_TYPES,
  type RecommendationKind,
  type StatementType,
} from "../../domain/statements/statementTypes";

const TYPE_LABEL: Record<StatementType, string> = {
  hecho: "Hecho",
  interpretacion: "Interpretación",
  hipotesis: "Hipótesis",
  orientacion: "Recomendación del Perfil",
  percepcion: "Percepción",
  cautela: "Cautela",
  laguna: "Laguna",
  "decision-posterior": "Decisión posterior",
};

interface AuthoredProposalPanelProps {
  proposals: ReadonlyArray<AuthoredProposal>;
  relations?: ReadonlyArray<RelationDeclaration>;
  onAdd: (proposal: Omit<AuthoredProposal, "authoredAt">) => void;
  onRemove: (proposalId: string) => void;
}

/**
 * Cierre interpretativo del equipo técnico (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis):
 * el equipo redacta conclusiones y recomendaciones del Perfil citando la evidencia. Registrar una
 * propuesta no la elige: pasa al menú, donde se elige o se descarta.
 */
export function AuthoredProposalPanel({ proposals, relations = [], onAdd, onRemove }: AuthoredProposalPanelProps) {
  const [id, setId] = useState("");
  const [kind, setKind] = useState<"conclusion" | "orientation">("conclusion");
  const [tipo, setTipo] = useState<"" | StatementType>("");
  const [recomendacion, setRecomendacion] = useState<"" | RecommendationKind>("");
  const [text, setText] = useState("");
  const [evidence, setEvidence] = useState("");
  const [conclusionIds, setConclusionIds] = useState<string[]>([]);
  const [relationId, setRelationId] = useState("");
  const [sustento, setSustento] = useState<"" | "1" | "2" | "3">("");
  const [cautelas, setCautelas] = useState("");
  const [datoQueLaCierra, setDatoQueLaCierra] = useState("");
  const [condiciona, setCondiciona] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const conclusions = proposals.filter((p) => p.kind === "conclusion");
  const esLaguna = kind === "conclusion" && tipo === "laguna";

  function submit() {
    const candidate: Omit<AuthoredProposal, "authoredAt"> = {
      id: id.trim(),
      kind,
      ...(tipoForAuthored(kind, tipo) !== undefined ? { tipo: tipoForAuthored(kind, tipo) } : {}),
      text: text.trim(),
      evidence: evidence.split("\n").map((l) => l.trim()).filter((l) => l !== ""),
      ...(kind === "orientation" ? { conclusionIds } : {}),
      ...(kind === "orientation" && recomendacion !== "" ? { recomendacion } : {}),
      ...(kind === "orientation" && relationId !== "" ? { relationId } : {}),
      ...(sustento !== "" ? { sustento: Number(sustento) as 1 | 2 | 3 } : {}),
      ...(cautelas.trim() !== "" ? { cautelas: cautelas.trim() } : {}),
      ...(esLaguna && datoQueLaCierra.trim() !== "" ? { datoQueLaCierra: datoQueLaCierra.trim() } : {}),
      ...(esLaguna && condiciona.length > 0 ? { condiciona } : {}),
      authoredBy: author.trim(),
    };
    const found = validateAuthoredProposal(candidate, proposals, relations);
    setProblems(found);
    if (found.length > 0) return;
    onAdd(candidate);
    setId("");
    setText("");
    setTipo("");
    setRecomendacion("");
    setEvidence("");
    setConclusionIds([]);
    setSustento("");
    setRelationId("");
    setCautelas("");
    setDatoQueLaCierra("");
    setCondiciona([]);
  }

  return (
    <section className="workspace-panel" aria-labelledby="authored-proposals-title">
      <h2 id="authored-proposals-title">Cierre interpretativo del equipo técnico</h2>
      <p>
        Redacta conclusiones y recomendaciones del Perfil que no salen de la lectura por tema. Cada una
        cita su evidencia. Registrar una propuesta no la elige: pasa al menú de propuestas, donde se elige
        o se descarta. Una recomendación deriva de conclusiones registradas, es de tipo Conocer, Contrastar
        o Abordar, y no fija responsable, plazo, recurso, indicador de ejecución, prioridad ni línea
        estratégica. Abordar exige una relación de grado 1 o 2.
      </p>
      <label>
        Identificador (p. ej. C1, O1)
        <input type="text" value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <label>
        Tipo
        <select value={kind} onChange={(e) => setKind(e.target.value as "conclusion" | "orientation")}>
          <option value="conclusion">Conclusión</option>
          <option value="orientation">Recomendación del Perfil</option>
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
      {esLaguna && (
        <label>
          Dato que la cerraría (qué dato, de qué fuente y a qué escala)
          <textarea rows={2} value={datoQueLaCierra} onChange={(e) => setDatoQueLaCierra(e.target.value)} />
        </label>
      )}
      {esLaguna && (
        <fieldset>
          <legend>Conclusiones que condiciona (opcional)</legend>
          {conclusions.filter((c) => c.tipo !== "laguna").length === 0 && <p>No hay conclusiones registradas.</p>}
          {conclusions
            .filter((c) => c.tipo !== "laguna")
            .map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={condiciona.includes(c.id)}
                  onChange={(e) =>
                    setCondiciona((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                  }
                />
                {c.id}: {c.text.slice(0, 80)}
              </label>
            ))}
        </fieldset>
      )}
      <label>
        Evidencia citada (una por línea: documento y localización)
        <textarea rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
      </label>
      {kind === "orientation" && (
        <label>
          Tipo de recomendación (Art. 8 quater)
          <select value={recomendacion} onChange={(e) => setRecomendacion(e.target.value as "" | RecommendationKind)}>
            <option value="">Sin elegir</option>
            {RECOMMENDATION_KINDS.map((k) => (
              <option key={k} value={k}>{RECOMMENDATION_LABEL[k]}</option>
            ))}
          </select>
        </label>
      )}
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
      {kind === "orientation" && (
        <label>
          Relación de la tabla en que se apoya
          <select
            value={relationId}
            onChange={(e) => {
              setRelationId(e.target.value);
              const r = currentRelations(relations).find((x) => x.id === e.target.value);
              if (r !== undefined) setSustento(String(r.grade) as "1" | "2" | "3");
            }}
          >
            <option value="">Ninguna (declaro el grado a mano)</option>
            {currentRelations(relations).map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} · grado {r.grade} · {r.status}
              </option>
            ))}
          </select>
          {relationId !== "" && draftOrientationFromRelation(relations, relationId) !== null && (
            <button
              type="button"
              onClick={() => {
                const d = draftOrientationFromRelation(relations, relationId);
                if (d === null) return;
                setText(d.text);
                if (evidence.trim() === "") setEvidence(d.evidence.join("\n"));
              }}
            >
              Partir del borrador de la relación
            </button>
          )}
        </label>
      )}
      <label>
        Grado de sustento de la relación (Art. 8 bis)
        <select value={sustento} onChange={(e) => setSustento(e.target.value as "" | "1" | "2" | "3")}>
          <option value="">No se apoya en una relación</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3 (no sostiene «Abordar»)</option>
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
                  {p.id} · {p.kind === "conclusion" ? "Conclusión" : `Recomendación del Perfil${p.recomendacion !== undefined ? ` (${RECOMMENDATION_LABEL[p.recomendacion]})` : ""}`} · {p.tipo !== undefined ? TYPE_LABEL[p.tipo] : "sin tipo"} · {p.authoredBy} ·{" "}
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
