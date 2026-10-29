import type { MunicipalityId } from "../municipality";
import type { DocumentId } from "../repository";

export type EvidenceAtomId = string;

export type EvidenceAtomKind =
  | "indicator"
  | "determinant"
  | "asset"
  | "participation"
  | "qualitative-observation"
  | "territorial-context"
  | "sample-quality"
  | "longitudinal-snapshot"
  | "strategic-priority"
  | "methodological-caution"
  | "other";

export type EvidenceOrigin =
  | "health-report"
  | "complementary-study"
  | "eas"
  | "cmi"
  | "ibse"
  | "sam"
  | "redcap"
  | "localiza-salud"
  | "community-assets"
  | "citizen-participation"
  | "longi"
  | "manual-entry"
  | "legacy-compas"
  | "territorial-documentation"
  | "qualitative-material"
  | "strategic-framework"
  | "other";

export type EvidenceConfidence =
  | "not-evaluable"
  | "low"
  | "medium"
  | "high";

export interface EvidenceMethodology {
  version?: string;
  description: string;
  limitations: string[];
  requiresHumanValidation: boolean;
}

export interface EvidenceAtomProvenance {
  origin: EvidenceOrigin;
  documentId?: DocumentId;
  sourceLabel?: string;
  field?: string;
  page?: number;
  extractedAt: string;
}

export interface EvidenceAtom {
  id: EvidenceAtomId;
  municipalityId: MunicipalityId;
  kind: EvidenceAtomKind;
  title: string;
  content: string;
  confidence: EvidenceConfidence;
  provenance: EvidenceAtomProvenance;
  methodology: EvidenceMethodology;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvidenceAtomInput {
  id: EvidenceAtomId;
  municipalityId: MunicipalityId;
  kind: EvidenceAtomKind;
  title: string;
  content: string;
  confidence?: EvidenceConfidence;
  provenance: EvidenceAtomProvenance;
  methodology?: Partial<EvidenceMethodology>;
  tags?: string[];
}

export function createEvidenceAtom(input: CreateEvidenceAtomInput): EvidenceAtom {
  const now = new Date().toISOString();

  return {
    id: input.id,
    municipalityId: input.municipalityId,
    kind: input.kind,
    title: input.title,
    content: input.content,
    confidence: input.confidence ?? "medium",
    provenance: input.provenance,
    methodology: {
      ...(input.methodology?.version ? { version: input.methodology.version } : {}),
      description:
        input.methodology?.description ??
        "Evidencia registrada para análisis territorial integrado.",
      limitations: input.methodology?.limitations ?? [],
      requiresHumanValidation:
        input.methodology?.requiresHumanValidation ?? true,
    },
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}
