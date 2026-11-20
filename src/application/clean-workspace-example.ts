import type { MunicipalDocumentRepository } from "../domain/repository";
import { createMunicipalDocumentRepository } from "../domain/repository";
import { createEvidenceStore } from "../domain/evidence";
import { createMunicipalityWorkspace, type MunicipalityWorkspace } from "../domain/workspace";

/**
 * Preparación de un expediente de ensayo en memoria.
 * No guarda, no borra, no modifica la fuente ni reutiliza sus originales.
 * El mismo municipio y código INE permiten comparar el escenario limpio.
 * No exportar como fuente canónica ni importar en una sesión con datos reales.
 */
export function createCleanWorkspaceExample(source: MunicipalityWorkspace): MunicipalityWorkspace {
  const id = source.municipality.identity.id;
  return createMunicipalityWorkspace(
    structuredClone(source.municipality),
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
