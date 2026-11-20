import type { MunicipalDocumentRepository } from "../domain/repository";
import { createMunicipalDocumentRepository } from "../domain/repository";
import { createEvidenceStore } from "../domain/evidence";
import { createMunicipalityWorkspace, type MunicipalityWorkspace } from "../domain/workspace";

/**
 * Preparación de un expediente de ensayo en memoria.
 * No guarda, no borra, no modifica la fuente ni reutiliza sus originales.
 * Conserva el código INE para comparación, pero cambia el ID y el nombre
 * del ámbito para que una importación no sobrescriba el municipio original.
 * Es un escenario de ENSAYO, no una fuente municipal canónica.
 */
export function createCleanWorkspaceExample(source: MunicipalityWorkspace): MunicipalityWorkspace {
  const originalId = source.municipality.identity.id;
  const id = `ensayo-${originalId}`;
  const municipality = structuredClone(source.municipality);
  municipality.identity.id = id;
  municipality.identity.name = `${source.municipality.identity.name} · ensayo limpio`;
  return createMunicipalityWorkspace(
    municipality,
    createMunicipalDocumentRepository({ municipalityId: id }),
    createEvidenceStore(id),
  );
}

export interface WorkspaceSeparationPreview {
  municipalityId: string;
  municipalDocuments: number;
  strategicCopies: number;
  diagnosticDocuments: number;
  evidenceAtoms: number;
  originals: number;
  profiles: number;
  validatedPlans: number;
  strategicTitles: string[];
}

/** Clasifica sin trasladar ni eliminar: incluso los marcos municipales
 * deben comprobarse antes de promoverlos al catálogo compartido. */
export function inspectWorkspaceSeparation(source: MunicipalityWorkspace): WorkspaceSeparationPreview {
  const repository: MunicipalDocumentRepository = source.repository;
  const strategic = repository.documents.filter(d => d.kind === "strategic-framework");
  return {
    municipalityId: source.municipality.identity.id,
    municipalDocuments: repository.documents.length,
    strategicCopies: strategic.length,
    diagnosticDocuments: repository.documents.length - strategic.length,
    evidenceAtoms: source.evidenceStore.atoms.length,
    originals: source.documentOriginals?.length ?? 0,
    profiles: source.externalProfileLibrary?.profiles.length ?? 0,
    validatedPlans: source.validatedActionPlans?.length ?? 0,
    strategicTitles: strategic.map(d => d.title),
  };
}
