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
 /** Archiving is reversible by a separate explicit revision; it retains all files. */
 archivedAt?: string;
 archivedBy?: string;
 summary: string;
 /** Literal imported text or manually edited content, never an automatic diagnosis. */
 text: string;
 results: ProfileResult[];
 findings: string[];
 limitations: string[];
 areas: Array<{ id: string; title: string; rationale: string }>;
 attachmentIds: string[];
 evidenceVersion?: string;
 /** Cifras de las conclusiones enlazadas a indicadores de la estadística territorial (CONTRACT-PROFILE-UPDATER §6). */
 bindings?: ProfileBinding[];
 /** Condiciones que sostienen cada conclusión; si dejan de cumplirse, la conclusión se marca para revisar. */
 conditions?: ProfileCondition[];
 /** Conclusiones y recomendaciones marcadas para revisar en esta revisión. No forman parte del texto publicado. */
 reviewFlags?: ProfileReviewFlag[];
 /**
  * Elección del equipo técnico sobre las conclusiones y recomendaciones de esta
  * revisión (Art. 16 ter; CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY §7). Una
  * revisión nueva no hereda las elecciones de la anterior.
  */
 choices?: ProfileChoice[];
}

/** Decisión registrada sobre una conclusión («C3») o una recomendación («R2»). */
export interface ProfileChoice {
 target: string;
 decision: 'chosen' | 'discarded';
 by: string;
 at: string;
 /** Motivo del descarte, si se da. */
 reason?: string;
}

/** Referencia a un valor de la estadística territorial: indicador del catálogo y ámbito. */
export interface ProfileValueRef { indicatorId: string; level: 'municipio' | 'seccion' | 'provincia' | 'andalucia' | 'espana'; territoryCode?: string }
export interface ProfileBinding {
 /** «C14», o «LECTURA» para la lectura de conjunto. */
 target: string;
 ref: ProfileValueRef;
 /** «value» enlaza la cifra; «period», el año. */
 field: 'value' | 'period';
 /** Texto exacto con el que aparece ahora en el párrafo («28,3», «2024»). */
 literal: string;
 /** Si el mismo texto aparece varias veces en el párrafo, cuál es (1 = el primero). */
 occurrence?: number;
}
export interface ProfileCondition {
 target: string;
 /** Enunciado legible: «el Gini municipal es inferior al provincial». */
 statement: string;
 left: ProfileValueRef;
 op: '<' | '>' | '<=' | '>=';
 right: ProfileValueRef | { value: number };
}
export interface ProfileReviewFlag {
 target: string;
 reason: string;
 /** Permite sustituir la marca al volver a comprobar su causa. Las marcas antiguas pueden carecer de esta referencia. */
 check?: { kind: "binding" | "condition" | "recommendation"; key: string };
}
export interface ExternalProfileLibrary {
 profiles: ExternalHealthProfile[];
 attachments: ProfileAttachment[];
 activeId?: string;
}
