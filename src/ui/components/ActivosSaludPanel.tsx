import { useState } from "react";
import type { MunicipalDocumentRepository } from "../../domain/repository";
import type { EvidenceAtom } from "../../domain/evidence";
import { readLocalizaAssets } from "../../application/localiza-assets";
import { assetEntriesOfDocument } from "../../application/evidence-pipeline/DocumentToEvidencePipeline";

interface ActivosSaludPanelProps {
  repository: MunicipalDocumentRepository;
  onDeleteDocument?: (documentId: string) => void;
  /** Átomos del expediente: permiten leer cada activo de Localiza por separado. */
  atoms?: ReadonlyArray<EvidenceAtom>;
}

export function ActivosSaludPanel({ repository, onDeleteDocument, atoms = [] }: ActivosSaludPanelProps) {
  const [showList, setShowList] = useState(false);

  const assetDocs = repository.documents.filter(
    (d) => d.kind === "community-asset" || d.kind === "localiza-salud"
  );
  const assetNames = assetDocs.flatMap(assetEntriesOfDocument);

  return (
    <section className="workspace-panel activos-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Diagnóstico territorial</p>
          <h2>Activos para la salud</h2>
        </div>
        <p className="panel-note">
          Recursos comunitarios, equipamientos y redes del territorio que contribuyen
          a la salud de la población.
        </p>
      </div>

      {assetDocs.some((d) => d.kind === "localiza-salud") && (
        <p className="study-institutional-note">
          Los activos incorporados desde Localiza Salud se añaden como base de trabajo para el equipo técnico.
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
              <strong>{assetNames.length}</strong> activos comunitarios incorporados
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
                      {r.estado === "validado" ? "Validado (declarado por el equipo técnico)" : "Registrado en Localiza"}
                      {r.tematicas.length > 0 && <> · Temáticas: {r.tematicas.join(", ")}</>}
                      {r.poblacionDestinataria.length > 0 && <> · Población: {r.poblacionDestinataria.join(", ")}</>}
                    </li>
                  ))}
                </ul>
              )}
              <span className="activos-source__label">
                Fuente: {doc.title}
              </span>
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
