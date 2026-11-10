import { useState } from "react";
import { DocumentReference } from "./Documentation";
import { LocalizaAssetPreview } from "./LocalizaAssetPreview";
import type { MunicipalDocumentRepository } from "../../domain/repository";
import type { EvidenceAtom } from "../../domain/evidence";
import { readLocalizaAssets } from "../../application/localiza-assets";
import { assetEntriesOfDocument } from "../../application/evidence-pipeline/DocumentToEvidencePipeline";

interface ActivosSaludPanelProps {
  repository: MunicipalDocumentRepository;
  onDeleteDocument?: (documentId: string) => void;
  /** Cambia el título de una fuente de activos (por ejemplo, para no llamar «activos validados» a un listado de recursos). */
  onRenameDocument?: (documentId: string, title: string) => void;
  /** Átomos del expediente: permiten leer cada activo de Localiza por separado. */
  atoms?: ReadonlyArray<EvidenceAtom>;
}

export function ActivosSaludPanel({ repository, onDeleteDocument, onRenameDocument, atoms = [] }: ActivosSaludPanelProps) {
  const [showList, setShowList] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const assetDocs = repository.documents.filter(
    (d) => (d.kind === "community-asset" || d.kind === "localiza-salud") && d.status !== "archived" && d.status !== "rejected"
  );
  const assetNames = assetDocs.flatMap(assetEntriesOfDocument);
  const hasValidations = (repository.assetValidations ?? []).some((v) => assetDocs.some((d) => d.id === v.documentId));
  const validatedCount = hasValidations
    ? readLocalizaAssets(
        atoms.filter((a) => assetDocs.some((d) => d.id === a.provenance?.documentId)),
        repository.assetValidations
      ).records.filter((r) => r.estado === "validado").length
    : undefined;

  return (
    <section className="workspace-panel activos-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Diagnóstico territorial</p>
          <h2>Activos para la salud</h2>
        </div>
        <p className="panel-note">
          Activos para la salud seleccionados e incorporados por la persona responsable del expediente. La identificación y el control de duplicidades se realizan antes de su incorporación.
        </p>
      </div>

      <LocalizaAssetPreview repository={repository} />

      {assetDocs.some((d) => d.kind === "localiza-salud") && (
        <p className="study-institutional-note">
          Los activos incorporados deliberadamente desde Localiza Salud se consideran seleccionados por la persona responsable. Las declaraciones formales de validación, cuando constan, se conservan por separado.
          En ámbitos inframunicipales —distritos o barrios—, los recursos identificados pueden pertenecer
          al ámbito o a su entorno funcional y requieren validación territorial antes de ser
          interpretados como activos propios del ámbito.
        </p>
      )}
      {assetNames.length === 0 ? (
        <p className="empty-state">
          No se han incorporado activos comunitarios para la salud.
          Pueden registrarse a través de Localiza Salud u otras fuentes de inventario comunitario.
        </p>
      ) : (
        <div className="activos-body">
          <div className="activos-summary">
            <span className="activos-summary__count">
              {validatedCount !== undefined
                ? <><strong>{assetNames.length}</strong> recursos incorporados · <strong>{validatedCount}</strong> validados como activos</>
                : <><strong>{assetNames.length}</strong> activos incorporados</>}
            </span>
            <button
              type="button"
              className="activos-summary__toggle"
              onClick={() => setShowList((v) => !v)}
              aria-expanded={showList}
            >
              {showList ? "Ocultar activos ▲" : "Ver activos ▾"}
            </button>
          </div>

          {showList && (
            <ul className="activos-list">
              {assetNames.slice(0, 12).map((name, i) => (
                <li key={i} className="activos-list__item">{name}</li>
              ))}
              {assetNames.length > 12 && (
                <li className="activos-list__more">
                  y {assetNames.length - 12} más…
                </li>
              )}
            </ul>
          )}

          {assetDocs.map((doc) => {
            const structured = readLocalizaAssets(
              atoms.filter((a) => a.provenance?.documentId === doc.id),
              repository.assetValidations
            ).records;
            return (
            <div key={doc.id} className="activos-source">
              {structured.length > 0 && (
                <ul className="activos-list">
                  {structured.map((r) => (
                    <li key={r.atomId} className="activos-list__item">
                      <strong>{r.nombre}</strong>
                      {" · "}
                      {r.estado === "validado" ? "Validado (declarado por el equipo técnico)" : "Incorporado desde Localiza Salud"}
                      {r.tematicas.length > 0 && <> · Temáticas: {r.tematicas.join(", ")}</>}
                      {r.poblacionDestinataria.length > 0 && <> · Población: {r.poblacionDestinataria.join(", ")}</>}
                    </li>
                  ))}
                </ul>
              )}
              {renaming?.id === doc.id ? (
                <span className="activos-source__label">
                  <label>
                    Título de la fuente
                    <input
                      type="text"
                      value={renaming.title}
                      onChange={(e) => setRenaming({ id: doc.id, title: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={renaming.title.trim() === "" || renaming.title.trim() === doc.title}
                    onClick={() => { onRenameDocument?.(doc.id, renaming.title); setRenaming(null); }}
                  >
                    Guardar título
                  </button>
                  <button type="button" onClick={() => setRenaming(null)}>Cancelar</button>
                </span>
              ) : (
                <span className="activos-source__label">
                  Fuente: <DocumentReference documentId={doc.id}>{doc.title}</DocumentReference>
                  {onRenameDocument && (
                    <>
                      {" "}
                      <button type="button" className="activos-source__rename" onClick={() => setRenaming({ id: doc.id, title: doc.title })}>
                        Cambiar título
                      </button>
                    </>
                  )}
                </span>
              )}
              {onDeleteDocument && (
                <button
                  type="button"
                  className="activos-source__delete"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar los activos de «${doc.title}»?\nSe borrarán también sus evidencias derivadas.`
                      )
                    ) {
                      onDeleteDocument(doc.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
