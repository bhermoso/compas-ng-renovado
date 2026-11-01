import { useState } from "react";
import type { DocumentId, DocumentKind } from "../../domain/repository";
import { DUPLICATE_REASON_LABEL, type DuplicateGroup } from "../../application/document-ingestion/documentDuplicates";

const REASON_HINT = {
  "same-file": "Son el mismo archivo: coincide su huella digital.",
  "same-text": "Tienen exactamente el mismo texto, aunque el archivo difiera.",
  "same-name": "Tienen el mismo nombre o título. Comprueba que sean el mismo documento antes de retirar.",
} as const;

interface Props {
  groups: DuplicateGroup[];
  kindLabels?: ReadonlyArray<{ value: DocumentKind; label: string }>;
  atomCountByDocument: Readonly<Record<DocumentId, number>>;
  protectedIds: ReadonlySet<DocumentId>;
  onRetire: (documentId: DocumentId, keptId: DocumentId) => void;
}

/** Documentos repetidos del expediente, agrupados por el motivo de la coincidencia. */
export function DuplicateDocumentsPanel({ groups, kindLabels = [], atomCountByDocument, protectedIds, onRetire }: Props) {
  const [keepOverride, setKeepOverride] = useState<Record<string, DocumentId>>({});
  if (groups.length === 0) return null;
  const copies = groups.reduce((sum, g) => sum + g.documents.length - 1, 0);
  const labelOf = (kind: DocumentKind) => kindLabels.find((k) => k.value === kind)?.label ?? kind;
  return (
    <section className="workspace-panel duplicate-documents" aria-labelledby="duplicate-documents-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Documentos repetidos</p>
          <h2 id="duplicate-documents-title">{copies === 1 ? "1 copia sobrante" : `${copies} copias sobrantes`} en {groups.length === 1 ? "1 grupo" : `${groups.length} grupos`}</h2>
        </div>
        <p className="panel-note">Retirar una copia la archiva, sin borrarla, y quita sus evidencias, que repiten las de la copia que se conserva. Nada se retira sin tu confirmación.</p>
      </div>
      <ol className="duplicate-documents__groups">
        {groups.map((group) => {
          const groupKey = group.documents.map((d) => d.id).sort().join("|");
          const lockedInGroup = group.documents.find((d) => protectedIds.has(d.id));
          const keepId = lockedInGroup?.id ?? keepOverride[groupKey] ?? group.suggestedKeepId;
          return (
          <li key={groupKey} className={`duplicate-documents__group duplicate-documents__group--${group.reason}`}>
            <p className="duplicate-documents__reason"><strong>{DUPLICATE_REASON_LABEL[group.reason]}</strong> · {REASON_HINT[group.reason]}</p>
            <ul>
              {group.documents.map((d) => {
                const keep = d.id === keepId;
                const locked = protectedIds.has(d.id);
                return (
                  <li key={d.id} className={keep ? "duplicate-documents__doc duplicate-documents__doc--keep" : "duplicate-documents__doc"}>
                    <div>
                      <strong>{d.title}</strong>
                      <span>{labelOf(d.kind)}{d.sourceFileName ? ` · ${d.sourceFileName}` : ""} · incorporado el {new Date(d.createdAt).toLocaleDateString("es-ES")} · {atomCountByDocument[d.id] ?? 0} evidencias{d.status === "validated" ? " · validado" : ""}</span>
                    </div>
                    {keep ? (
                      <span className="duplicate-documents__keep">Se conserva{locked ? " (vinculado al Informe o a un estudio vigente)" : ""}</span>
                    ) : locked ? (
                      <span className="duplicate-documents__keep">Vinculado al Informe o a un estudio vigente</span>
                    ) : (
                      <span className="duplicate-documents__actions">
                        {!lockedInGroup && <button type="button" className="duplicate-documents__secondary" onClick={() => setKeepOverride((prev) => ({ ...prev, [groupKey]: d.id }))}>Conservar esta</button>}
                        <button type="button" onClick={() => onRetire(d.id, keepId)}>Retirar copia</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
          );
        })}
      </ol>
    </section>
  );
}
