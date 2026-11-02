/** Authored outside COMPÁS. Files are JSON-safe so the entire record travels to Firebase. */
export interface ProfileAttachment {
 id: string;
 name: string;
 mimeType: string;
 size: number;
 sha256: string;
 base64: string;
}
export interface ProfileResult {
 id: string;
 title: string;
 value: string;
 unit: string;
 source: string;
 page: string;
 period: string;
 caution: string;
 topic?: string;
 scale?: string;
 denominator?: string;
 temporalContext?: 'current' | 'historical' | 'not-stated';
 chartValue?: number;
 /** IDs C1, C2… explicitly linked to this indicator in the authored package. Never inferred. */
 supportsConclusions?: string[];
 /** Optional, explicitly supplied comparison. No score or quality thresholds. */
 comparison?: { label: string; value: number };
 /**
  * Varios ámbitos de comparación explícitos (Distrito, provincia, Andalucía…),
  * cuando la fuente los publica. Si existe, prevalece sobre `comparison`.
  */
 comparisons?: Array<{ label: string; value: number }>;
}
export interface ExternalHealthProfile {
 schema: 'compas-external-profile/v1';
 id: string;
 municipalityId: string;
 title: string;
 period: string;
 author: string;
 createdAt: string;
 revisionOf?: string;
 status: 'review' | 'validated';
 validatedBy?: string;
 validatedAt?: string;
 summary: string;
 /** Literal imported text or manually edited content, never an automatic diagnosis. */
 text: string;
 results: ProfileResult[];
 findings: string[];
 limitations: string[];
 areas: Array<{ id: string; title: string; rationale: string }>;
 attachmentIds: string[];
 evidenceVersion?: string;
}
export interface ExternalProfileLibrary {
 profiles: ExternalHealthProfile[];
 attachments: ProfileAttachment[];
 activeId?: string;
}
