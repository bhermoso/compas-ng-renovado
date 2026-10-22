import { useState } from "react";
import type { ProposalDecision } from "../../domain/repository";
import {
  resolveProposals,
  validateDecision,
  type Proposal,
  type ResolvedProposal,
} from "../../application/proposals";

interface ProposalMenuPanelProps {
  proposals: ReadonlyArray<Proposal>;
  decisions: ReadonlyArray<ProposalDecision>;
  onDecide: (decision: ProposalDecision) => void;
}

const STATE_LABEL = { pendiente: "Pendiente", elegida: "Elegida", descartada: "Descartada" } as const;

/**
 * Menú de conclusiones propuestas (CONTRACT-LHPM v1.5, Art. 16 ter). El sistema
 * propone y no elige: cada propuesta la elige o descarta una persona del equipo
 * técnico. Por ahora el documento del Perfil no se filtra con estas decisiones;
 * queda registrada la elección, con su autoría y fecha.
 */
export function ProposalMenuPanel({ proposals, decisions, onDecide }: ProposalMenuPanelProps) {
  const [author, setAuthor] = useState("");
  const [problems, setProblems] = useState<Record<string, string[]>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [motives, setMotives] = useState<Record<string, string>>({});

  if (proposals.length === 0) return null;
  const resolution = resolveProposals(proposals, decisions);
  const all: ResolvedProposal[] = proposals.map(
    (p) =>
      [...resolution.elegidas, ...resolution.descartadas, ...resolution.pendientes].find(
        (r) => r.proposal.id === p.id
      ) as ResolvedProposal
  );

  function decide(r: ResolvedProposal, decision: "elegida" | "descartada") {
    const id = r.proposal.id;
    const adjusted = (texts[id] ?? "").trim();
    const motivo = (motives[id] ?? "").trim();
    const candidate = {
      decision,
      decidedBy: author,
      ...(adjusted !== "" && adjusted !== r.proposal.text ? { textoAjustado: adjusted } : {}),
    };
    const found = validateDecision(r.proposal, candidate);
    setProblems((prev) => ({ ...prev, [id]: found }));
    if (found.length > 0) return;
    onDecide({
      proposalId: id,
      decision,
      decidedBy: author.trim(),
      decidedAt: new Date().toISOString(),
      ...(motivo !== "" ? { motivo } : {}),
      ...(candidate.textoAjustado !== undefined ? { textoAjustado: candidate.textoAjustado } : {}),
    });
  }

  return (
    <section className="workspace-panel" aria-labelledby="proposal-menu-title">
      <h2 id="proposal-menu-title">Conclusiones propuestas</h2>
      <p>
        Cada propuesta deriva de la «Lectura por tema». El sistema no elige ninguna: elige o descarta
        cada una una persona del equipo técnico, con su autoría y fecha. Las descartadas se conservan en
        el registro. Estado: {resolution.elegidas.length} elegidas · {resolution.descartadas.length}{" "}
        descartadas · {resolution.pendientes.length} pendientes. La versión institucional exige que no
        quede ninguna pendiente.
      </p>
      <label>
        Persona que decide
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      <ul className="document-list">
        {all.map((r) => {
          const id = r.proposal.id;
          return (
            <li key={id} className="document-row">
              <div>
                <p className="document-kind">{STATE_LABEL[r.state]}</p>
                <label>
                  Redacción
                  <textarea
                    rows={3}
                    value={texts[id] ?? r.finalText}
                    onChange={(e) => setTexts((p) => ({ ...p, [id]: e.target.value }))}
                  />
                </label>
                <label>
                  Motivo (opcional)
                  <input
                    type="text"
                    value={motives[id] ?? r.decision?.motivo ?? ""}
                    onChange={(e) => setMotives((p) => ({ ...p, [id]: e.target.value }))}
                  />
                </label>
                {r.decision !== undefined && (
                  <p>
                    {STATE_LABEL[r.state]} por {r.decision.decidedBy} · {r.decision.decidedAt.slice(0, 10)}
                  </p>
                )}
                {(problems[id] ?? []).map((m) => (
                  <p key={m} role="alert">{m}</p>
                ))}
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => decide(r, "elegida")}>Elegir</button>
                <button type="button" onClick={() => decide(r, "descartada")}>Descartar</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
