import { useState } from "react";
import type { AuthoredProposal, FigureRecord, ProposalDecision, ReadingAxisDeclaration, RelationDeclaration } from "../../domain/repository";
import { resolveProposals, type Proposal } from "../../application/proposals";
import { AuthoredProposalPanel } from "./AuthoredProposalPanel";
import { ProposalMenuPanel } from "./ProposalMenuPanel";
import { FigureImportPanel } from "./FigureImportPanel";
import type { FigureInput } from "../../application/figures";
import { ReadingAxisPanel } from "./ReadingAxisPanel";
import { RelationTablePanel } from "./RelationTablePanel";

interface ProposalReviewModeProps {
  proposals: ReadonlyArray<Proposal>;
  authored: ReadonlyArray<AuthoredProposal>;
  decisions: ReadonlyArray<ProposalDecision>;
  onDecide: (decision: ProposalDecision) => void;
  onAdd: (proposal: Omit<AuthoredProposal, "authoredAt">) => void;
  onRemove: (proposalId: string) => void;
  relations: ReadonlyArray<RelationDeclaration>;
  figures: ReadonlyArray<FigureRecord>;
  onImportFigures: (figures: FigureInput[]) => void;
  axes: ReadonlyArray<ReadingAxisDeclaration>;
  onDeclareAxis: (axis: Omit<ReadingAxisDeclaration, "version" | "declaredAt">) => void;
  onDeclareRelation: (relation: Omit<RelationDeclaration, "version" | "declaredAt">) => void;
  /** Para pruebas de renderizado: el modo arranca abierto. */
  initiallyOpen?: boolean;
}

/**
 * Modo de revisión del Perfil (CONTRACT-LHPM v1.7, Art. 16 ter 8). No es un
 * documento aparte: se sitúa al final del propio Perfil, junto a las conclusiones
 * y orientaciones que ya figuran en él. Los controles son interfaz y no contenido:
 * abrir o cerrar el modo no cambia el texto del documento (Art. 17 bis).
 */
export function ProposalReviewMode({
  proposals,
  authored,
  decisions,
  onDecide,
  onAdd,
  onRemove,
  relations,
  figures,
  onImportFigures,
  axes,
  onDeclareAxis,
  onDeclareRelation,
  initiallyOpen = false,
}: ProposalReviewModeProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const r = resolveProposals(proposals, decisions);
  return (
    <section className="workspace-panel" aria-labelledby="review-mode-title">
      <h2 id="review-mode-title">Revisión de conclusiones y recomendaciones</h2>
      <p>
        El documento muestra solo lo elegido. Estado: {r.elegidas.length} elegidas · {r.descartadas.length}{" "}
        descartadas · {r.pendientes.length} pendientes. La versión institucional exige que no quede
        ninguna pendiente.
      </p>
      <button type="button" aria-pressed={open} onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar el modo de revisión" : "Abrir el modo de revisión"}
      </button>
      {open && (
        <>
          <ProposalMenuPanel proposals={proposals} decisions={decisions} onDecide={onDecide} />
          <FigureImportPanel figures={figures} onImport={onImportFigures} />
          <ReadingAxisPanel history={axes} onDeclare={onDeclareAxis} />
          <RelationTablePanel history={relations} onDeclare={onDeclareRelation} />
          <AuthoredProposalPanel proposals={authored} relations={relations} onAdd={onAdd} onRemove={onRemove} />
        </>
      )}
    </section>
  );
}
