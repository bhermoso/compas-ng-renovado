import { FrameworkReference } from "./FrameworkReference";
import { DocumentReference } from "./Documentation";
import type {
  DocumentCycle,
  MunicipalDocument,
  MunicipalDocumentRepository,
} from "../../domain/repository";
import { DocumentCycleControl } from "./DocumentCycleControl";
import {
  libraryDocumentAssignmentId,
  type CompasLibraryDocument,
} from "../../application/document-library";
import { DocumentAccess } from './DocumentAccess.tsx';
import { getCategory, KIND_LABEL, STUDY_LABEL_BY_TAG } from "./documentRepositoryCategorization";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Cargado",
  validated: "Validado",
  rejected: "Rechazado",
  archived: "Archivado",
};

function getDocumentKindLabel(document: MunicipalDocument): string {
  if (document.kind === 'territorial-documentation' && document.sourceText?.includes('VIGILANCIA INTEGRAL DE LA SALUD')) return 'Informe de Vigilancia Integral de la Salud · UGC';
  const studyTag = document.tags.find((tag) => STUDY_LABEL_BY_TAG[tag] !== undefined);
  if (studyTag !== undefined) {
    return `${STUDY_LABEL_BY_TAG[studyTag]} · ${KIND_LABEL[document.kind]}`;
  }
  return KIND_LABEL[document.kind] ?? document.kind;
}

const STUDY_TAG_ORDER: Record<string, number> = {
  ibse: 0,
  "duke-eas": 1,
  "predimed-eas": 2,
  "sf12-eas": 3,
  "sueno-eas": 4,
  "cage-eas": 5,
  auditc: 6,
  "ipaq-eas": 7,
  ghq12: 8,
  phq9: 9,
  psqi: 10,
  fagerstrom: 11,
  sbq: 12,
};

function sortWithinCategory(docs: MunicipalDocument[]): MunicipalDocument[] {
  return [...docs].sort((a, b) => {
    const ta = Math.min(...a.tags.map((t) => STUDY_TAG_ORDER[t] ?? 99));
    const tb = Math.min(...b.tags.map((t) => STUDY_TAG_ORDER[t] ?? 99));
    return ta - tb;
  });
}

interface DocumentRepositoryPanelProps {
  repository: MunicipalDocumentRepository;
  onDelete?: (documentId: string) => void;
  libraryDocuments?: CompasLibraryDocument[];
  libraryMessage?: string | null;
  onAssignLibraryDocument?: (document: CompasLibraryDocument) => void;
  onSetDocumentCycle?: (documentId: string, cycle: DocumentCycle | undefined) => void;
}

function DocumentRow({
  document,
  onDelete,
  onSetCycle,
}: {
  document: MunicipalDocument;
  onDelete?: (documentId: string) => void;
  onSetCycle?: (documentId: string, cycle: DocumentCycle | undefined) => void;
}) {
  return (
    <article
      className="document-row"
      data-document-kind={document.kind}
      data-document-tags={document.tags.join(" ")}
    >
      <div>
        <p className="document-kind">
          {getDocumentKindLabel(document)}
        </p>
        <h3><DocumentReference documentId={document.id}>{document.title}</DocumentReference></h3>
        {document.source.system && (
          <p className="doc-repo__source">{document.source.system}</p>
        )}
        {onSetCycle && (
          <DocumentCycleControl
            cycle={document.cycle}
            onChange={(cycle) => onSetCycle(document.id, cycle)}
          />
        )}
      </div>
      <div className="doc-repo__actions">
        <span className="status-pill">
          {document.status === 'uploaded' ? 'Registrado' : STATUS_LABEL[document.status] ?? document.status}
        </span>
        {onDelete && (
          <button
            type="button"
            className="doc-repo__delete"
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar «${document.title}»?\nSe borrarán también sus evidencias derivadas.`
                )
              ) {
                onDelete(document.id);
              }
            }}
          >
            Eliminar
          </button>
        )}
      </div>
      <DocumentAccess document={document} />
    </article>
  );
}

function LibraryDocumentRow({
  item,
  onAssign,
  onRemove,
}: {
  item: CompasLibraryDocument;
  onAssign?: (document: CompasLibraryDocument) => void;
  onRemove?: (document: CompasLibraryDocument) => void;
}) {
  const status = item.alreadyAssigned
    ? "Asignado"
    : item.canAssign
      ? "Disponible"
      : "Consulta";

  return (
    <article
      className="document-row document-row--library"
      data-document-kind={item.document.kind}
      data-document-tags={item.document.tags.join(" ")}
      data-source-municipality={item.sourceMunicipalityId}
    >
      <div>
        <p className="document-kind">{getDocumentKindLabel(item.document)}</p>
        <h3>{item.document.title}</h3>
        <p className="doc-repo__source">
          Guardado en COMPÁS desde: {item.sourceMunicipalityName}
          {item.document.source.system ? ` · ${item.document.source.system}` : ""}
        </p>
      </div>
      <div className="doc-repo__actions">
        <span className="status-pill">{status}</span>
        {item.canAssign && onAssign && (
          <button
            type="button"
            className="doc-repo__assign"
            onClick={() => onAssign(item)}
          >
            Asignar copia
          </button>
        )}
        {item.alreadyAssigned && onRemove && (
          <button
            type="button"
            className="doc-repo__delete"
            onClick={() => {
              if (
                window.confirm(
                  `¿Retirar «${item.document.title}» de este expediente?\nSe eliminarán la copia asignada y sus evidencias derivadas. El documento del expediente de origen se conservará.`
                )
              ) {
                onRemove(item);
              }
            }}
          >
            Retirar copia
          </button>
        )}
        {!item.canAssign && !item.alreadyAssigned && (
          <span className="doc-repo__scope-note">Solo consulta</span>
        )}
      </div>
      <DocumentAccess document={item.document} />
    </article>
  );
}

export function DocumentRepositoryPanel({
  repository,
  onDelete,
  libraryDocuments,
  libraryMessage,
  onAssignLibraryDocument,
  onSetDocumentCycle,
}: DocumentRepositoryPanelProps) {
  // Solo muestra "otras fuentes documentales" — las capas 1–3 (Informe de Salud,
  // Estudios complementarios, Activos para la salud) tienen sus propios paneles.
  const otherDocs = sortWithinCategory(
    repository.documents.filter((d) => getCategory(d) === "other-source")
  );

  // Los marcos estratégicos y normativos se muestran aparte: son base de la
  // fase de Plan de Acción / Plan Local de Salud, no evidencia diagnóstica.
  const strategicDocs = sortWithinCategory(
    repository.documents.filter((d) => getCategory(d) === "strategic-input")
  );
  // Cada documento aparece en un solo lugar: el catálogo recoge solo los que no
  // se listan en "Otras fuentes documentales" ni en "Marcos estratégicos".
  const catalogDocs = repository.documents.filter((d) => {
    const category = getCategory(d);
    return category !== "other-source" && category !== "strategic-input";
  });
  const libraryGroups = new Map<string, CompasLibraryDocument[]>();
  for (const item of libraryDocuments ?? []) {
    const key = item.sourceMunicipalityName;
    libraryGroups.set(key, [...(libraryGroups.get(key) ?? []), item]);
  }

  return (
    <>
      {catalogDocs.length > 0 && (
        <section className="workspace-panel">
          <h2>Informe, estudios y activos del expediente</h2>
          <p>Consulta los originales, el texto conservado y las referencias del informe de salud, los estudios y los activos. Las demás fuentes y los marcos estratégicos se listan en sus apartados, más abajo. <strong>Registrar un documento no implica conservar su archivo ni aprobarlo.</strong></p>
          <p>Los archivos que incorpores se conservan en este navegador. <strong>Para trasladarlos a otro equipo,</strong> utiliza «Copias y recuperación del trabajo» y descarga la copia con originales.</p>
          <details><summary>Abrir catálogo · {catalogDocs.length} {catalogDocs.length === 1 ? "documento" : "documentos"}</summary>
            <div className="document-list">{catalogDocs.map(document=><DocumentRow key={document.id} document={document} onDelete={onDelete} onSetCycle={onSetDocumentCycle}/>)}</div>
          </details>
        </section>
      )}

      {libraryDocuments !== undefined && libraryDocuments.length > 0 && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Biblioteca documental COMPÁS</p>
              <h2>
                Marcos estratégicos reutilizables
                {libraryDocuments.length > 0 && (
                  <span className="doc-repo__count">{libraryDocuments.length}</span>
                )}
              </h2>
            </div>
            <p className="panel-note">
              Consulta la documentación transversal acumulada en COMPÁS y asigna al expediente activo
              una copia trazable de los marcos reutilizables.
            </p>
          </div>
          {libraryMessage && (
            <p className="doc-repo__library-message" role="status">
              {libraryMessage}
            </p>
          )}
          {libraryDocuments.length === 0 ? (
            <p className="empty-state">
              No hay marcos estratégicos reutilizables guardados en otros expedientes de este navegador.
            </p>
          ) : (
            <details>
              <summary>Abrir biblioteca · {libraryDocuments.length} documentos</summary>
              {Array.from(libraryGroups.entries()).map(([sourceName, items]) => (
                <div className="doc-repo__group" key={sourceName}>
                  <p className="doc-repo__group-label">{sourceName}</p>
                  <div className="document-list">
                    {items.map((item) => (
                      <LibraryDocumentRow
                        key={item.id}
                        item={item}
                        onAssign={onAssignLibraryDocument}
                        onRemove={
                          onDelete
                            ? (assignedItem) =>
                                onDelete(
                                  libraryDocumentAssignmentId(
                                    assignedItem.sourceMunicipalityId,
                                    assignedItem.document.id
                                  )
                                )
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </details>
          )}
        </section>
      )}

      <section className="workspace-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Diagnóstico territorial</p>
            <h2>
              Otras fuentes documentales
              {otherDocs.length > 0 && (
                <span className="doc-repo__count">{otherDocs.length}</span>
              )}
            </h2>
          </div>
          <p className="panel-note">
            Memorias, planes, diagnósticos sectoriales, encuestas y otros documentos
            incorporados al análisis territorial del ámbito.
          </p>
        </div>

        {otherDocs.length === 0 ? (
          <p className="empty-state">
            No hay fuentes documentales adicionales registradas.
            Puedes incorporar memorias de actividades, planes locales, diagnósticos de
            barrio u otros documentos de contexto desde el formulario inferior.
          </p>
        ) : (
          <div className="document-list">
            {otherDocs.map((document) => (
              <DocumentRow key={document.id} document={document} onDelete={onDelete} onSetCycle={onSetDocumentCycle} />
            ))}
          </div>
        )}
      </section>

      {strategicDocs.length > 0 && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Bases para la planificación</p>
              <h2>
                Marcos estratégicos para Plan de Acción
                <span className="doc-repo__count">{strategicDocs.length}</span>
              </h2>
            </div>
            <p className="panel-note">
              Marcos estratégicos y normativos de referencia (<FrameworkReference name="epvsa" />, <FrameworkReference name="esca" />, planes
              autonómicos). Sirven como base para la fase de Plan de Acción / Plan Local
              de Salud: no forman parte de la evidencia diagnóstica del Perfil ni
              generan conclusiones o recomendaciones dentro de él.
            </p>
          </div>
          <div className="document-list">
            {strategicDocs.map((document) => (
              <DocumentRow key={document.id} document={document} onDelete={onDelete} onSetCycle={onSetDocumentCycle} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
