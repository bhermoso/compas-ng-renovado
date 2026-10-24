import { useState } from "react";
import type {
  AssetValidationDeclaration,
  MunicipalDocumentRepository,
} from "../../domain/repository";

/** Documento de criterios aplicado por la persona validadora. */
export const ASSET_CRITERIA = {
  title: "Criterios para el registro y validación de activos para la salud en Andalucía",
  version: "Versión 9 de junio de 2026",
} as const;

/** Recurso de Localiza leído en el expediente (átomo de tipo activo). */
export interface AssetResource {
  id: string;
  title: string;
  documentId: string;
}

interface AssetValidationPanelProps {
  repository: MunicipalDocumentRepository;
  /** Recursos del expediente; si se pasan, se puede validar recurso a recurso. */
  resources?: ReadonlyArray<AssetResource>;
  onAdd: (validation: Omit<AssetValidationDeclaration, "declaredAt">) => void;
  onRemove: (validationId: string) => void;
}

/**
 * Declaración de activos validados. Localiza Salud no exporta el estado de
 * validación; lo declara la persona con perfil validador, con el documento de
 * criterios aplicado (apartado 4: campos, criterios de registro, participación
 * ciudadana). El sistema no valida ni comprueba los criterios.
 */
export function AssetValidationPanel({ repository, resources = [], onAdd, onRemove }: AssetValidationPanelProps) {
  const sources = repository.documents.filter(
    (d) => d.kind === "localiza-salud" || d.kind === "community-asset"
  );
  const [documentId, setDocumentId] = useState("");
  const [declaredBy, setDeclaredBy] = useState("");
  const [validatedOn, setValidatedOn] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const docResources = resources.filter((r) => r.documentId === documentId);
  const visible = docResources.filter((r) => r.title.toLowerCase().includes(filter.trim().toLowerCase()));

  if (sources.length === 0) return null;

  const titleOf = (id: string): string =>
    repository.documents.find((d) => d.id === id)?.title ?? "Documento no encontrado";
  const canAdd = documentId !== "" && declaredBy.trim() !== "";

  function submit() {
    if (!canAdd) return;
    onAdd({
      id: `val-${Date.now().toString(36)}`,
      documentId,
      ...(selected.length > 0 ? { atomIds: [...selected] } : {}),
      criteria: { ...ASSET_CRITERIA },
      declaredBy: declaredBy.trim(),
      ...(validatedOn !== "" ? { validatedOn } : {}),
      ...(note.trim() !== "" ? { note: note.trim() } : {}),
    });
    setNote("");
    setSelected([]);
  }

  return (
    <section className="workspace-panel" aria-labelledby="asset-validation-title">
      <h2 id="asset-validation-title">Activos validados</h2>
      <p>
        Declara aquí que los activos de un documento de Localiza Salud han sido validados por una persona con
        perfil validador, con el documento «{ASSET_CRITERIA.title}» ({ASSET_CRITERIA.version}).
        El sistema no comprueba los criterios: registra la declaración y el Perfil la cita como tal. Las
        temáticas de Localiza no se modifican.
      </p>
      {(repository.assetValidations ?? []).length > 0 && (
        <ul className="document-list">
          {(repository.assetValidations ?? []).map((v) => (
            <li key={v.id} className="document-row">
              <div>
                <h3>{titleOf(v.documentId)}</h3>
                <p>
                  {v.atomIds === undefined
                    ? "Todos los recursos del documento."
                    : `${v.atomIds.length} ${v.atomIds.length === 1 ? "recurso" : "recursos"}: ${v.atomIds
                        .map((id) => resources.find((r) => r.id === id)?.title ?? id)
                        .join("; ")}.`}
                </p>
                <p>
                  Validado por {v.declaredBy}
                  {v.validatedOn !== undefined ? ` · ${v.validatedOn}` : ""} · {v.criteria.version}
                </p>
                {v.note !== undefined && <p>Nota: {v.note}</p>}
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => onRemove(v.id)}>
                  Retirar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="doc-cycle__fields">
        <label>
          Documento de activos
          <select value={documentId} onChange={(e) => { setDocumentId(e.target.value); setSelected([]); }}>
            <option value="">Elegir documento</option>
            {sources.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </label>
        <label>
          Persona validadora
          <input type="text" value={declaredBy} onChange={(e) => setDeclaredBy(e.target.value)} />
        </label>
        <label>
          Fecha de validación (opcional)
          <input type="date" value={validatedOn} onChange={(e) => setValidatedOn(e.target.value)} />
        </label>
      </div>
      {docResources.length > 0 && (
        <fieldset>
          <legend>
            Recursos validados como activos ({selected.length} de {docResources.length}). Si no marcas ninguno, la
            declaración vale para todos los recursos del documento.
          </legend>
          <label>
            Buscar recurso
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
          {visible.map((r) => (
            <label key={r.id}>
              <input
                type="checkbox"
                checked={selected.includes(r.id)}
                onChange={(e) =>
                  setSelected((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)))
                }
              />
              {r.title}
            </label>
          ))}
        </fieldset>
      )}
      <label>
        Nota (opcional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button type="button" onClick={submit} disabled={!canAdd}>
        Declarar activos validados
      </button>
    </section>
  );
}
