export type { BuildLocalHealthProfileInput } from "./buildLocalHealthProfile";
export {
  ANTECEDENTS_TITLE,
  buildAntecedents,
  excludeHistoricalSources,
  isHistoricalDocument,
} from "./antecedents";
export type { AntecedentSource, CanonicalAntecedents } from "./antecedents";
export { buildLocalHealthProfile, hasPSLHumanContent } from "./buildLocalHealthProfile";

export { populatePSLFromPerfil } from "./populatePSLFromPerfil";

export type {
  AddInterpretationInput,
  UpdateInterpretationInput,
  AddHypothesisInput,
  UpdateHypothesisInput,
  AddOpenQuestionInput,
  UpdateOpenQuestionInput,
  PerfilSpaceCoverage,
  PerfilAlertaTipo,
  PerfilAlertaMetodologica,
  PerfilSpaceEstado,
  PerfilEstadoGlobal,
  PerfilEstadoNivel,
  CriterioEstructural,
  EstadoDelConocimiento,
  PerfilEpistemicMetrics,
} from "./profileOperations";
export {
  createPerfilLocalDeSalud,
  addInterpretation,
  updateInterpretation,
  supersedeInterpretation,
  addHypothesis,
  updateHypothesis,
  resolveHypothesisAsInterpretation,
  discardHypothesis,
  addOpenQuestion,
  updateOpenQuestion,
  resolveOpenQuestion,
  updateSynthesis,
  computePerfilEstadoGlobal,
  computeEstadoDelConocimiento,
  computePerfilEpistemicMetrics,
} from "./profileOperations";
export type { NarrativeChapter, NarrativeChaptersInput } from "./narrativeChapters";
export {
  buildNarrativeChapters,
  renderNarrativeChapters,
  NARRATIVE_CHAPTER_TITLES,
  NARRATIVE_GENERATOR_VERSION,
} from "./narrativeChapters";
export { parseNarrativeChapters } from "./narrativeChapters";
export type {
  InstitutionalProfileViewModel,
  ContrastTopic,
} from "./institutionalProfileModel";
export {
  buildInstitutionalProfileViewModel,
  INSTITUTIONAL_NAV,
  CONTRAST_TOPICS_LABEL,
  PENDING_CONTRAST_LABEL,
} from "./institutionalProfileModel";
export type {
  DiagnosticAnswers,
  DiagnosticDeterminantReading,
  DeterminantReadingKind,
  HealthReportReading,
  SalutogenicReading,
  SalutogenicGroup,
  SpaceKnowledge,
} from "./diagnosticAnswers";
export {
  buildDiagnosticAnswers,
  inferSocialEpidemiologyDeterminants,
  buildSalutogenicReading,
} from "./diagnosticAnswers";
export {
  serializeValidatedAnswers,
  parseValidatedAnswersSnapshot,
} from "./validatedAnswersSnapshot";
export {
  selectDocumentPreviewContext,
  type DocumentPreviewContext,
} from "./documentPreviewContext";
export type {
  HealthReportSanitaryReading,
  HealthReportSanitarySignal,
} from "./healthReportSanitaryReading";
export {
  buildHealthReportSanitaryReading,
  institutionalHealthReportTitle,
  sanitizeHealthReportTitleInText,
} from "./healthReportSanitaryReading";
export type {
  CausalStatus,
  ScientificPrinciple,
} from "./profileScientificFramework";
export {
  SCIENTIFIC_PRINCIPLES,
  CAUSAL_STATUS_LABEL,
} from "./profileScientificFramework";
export type {
  IntegratedHealthProfileSignal,
  IntegratedMatrixRow,
  IntegratedSignalSet,
  DistribucionDesigualdad,
} from "./integratedProfileSignals";
export {
  buildIntegratedProfileSignals,
  buildIntegratedMatrix,
  buildIntegratedSignalSets,
} from "./integratedProfileSignals";
export type {
  IntegratedInterpretation,
  IntegratedInterpretationUnit,
  IntegratedInterpretationStatus,
  InterpretationSignalRef,
  InterpretationTraceability,
  SanitaryAgendaPresence,
  EpidemiologicalCoverage,
} from "./integratedInterpretation";
export { buildIntegratedInterpretation } from "./integratedInterpretation";
export type {
  VisualForm,
  VisualContractRule,
  VisualProhibition,
} from "./profileVisualContract";
export {
  VISUAL_CONTRACT_RULES,
  VISUAL_PROHIBITIONS,
  visualCaption,
} from "./profileVisualContract";
export type {
  ProfileSynthesis,
  SynthesisMessage,
  SenalPrincipalRow,
  MatrizAnexo,
  MatrizAnexoFila,
  AntiTemplateViolation,
} from "./profileSynthesisView";
export {
  buildProfileSynthesis,
  buildMatrizAnexo,
  checkSynthesisAntiTemplate,
} from "./profileSynthesisView";
export type {
  EvidenceVariant,
  BarChartItem,
  DiagnosticBarChart,
  TrazadorRow,
  GrupoMotorCard,
  DiagnosticVisuals,
} from "./profileDiagnosticVisuals";
export {
  buildDiagnosticVisuals,
  EVIDENCE_VARIANT_LABEL,
} from "./profileDiagnosticVisuals";
export type {
  ProfileIntegratedEditorialView,
  ProfileIntegratedEditorialHeader,
  ProfileIntegratedEditorialOverviewMessage,
  ProfileIntegratedEditorialSourceBlock,
  ProfileIntegratedEditorialReadingBlock,
  ProfileIntegratedEditorialClosingColumn,
  ProfileIntegratedDiagnosticSynthesis,
  ProfileIntegratedEditorialTechnicalAnnex,
  BuildProfileIntegratedEditorialViewOptions,
} from "./profileIntegratedEditorialView";
export {
  buildProfileIntegratedEditorialView,
} from "./profileIntegratedEditorialView";
export type { WritingContractViolation } from "./profileWritingContract";
export {
  checkProfileWritingContract,
  PROFILE_READING_DIMENSIONS,
  DIAGNOSTIC_ENGINE_QUESTIONS,
  POSITIVE_WRITING_CRITERIA,
  LOCAL_PRIMACY_RULE,
  SANITARY_THREAD_RULE,
} from "./profileWritingContract";
export type {
  ComplementaryStudiesReading,
  ComplementaryStudyDiagnosticBlock,
} from "./complementaryStudiesReading";
export {
  buildComplementaryStudiesReading,
  DIAGNOSTIC_BLOCK_TITLES,
  HIPOTESIS_PSICOSOCIAL,
  HIPOTESIS_ENTORNO_URBANO,
  HIPOTESIS_CONSUMOS,
} from "./complementaryStudiesReading";
export type {
  IndicatorComparisonReference,
  IndicatorReferencesCoverage,
  ComplementaryIndicatorReferencesReading,
} from "./complementaryIndicatorReferences";
export {
  buildIndicatorComparisonReferences,
  interpretIndicatorComparison,
  formatIndicatorValue,
} from "./complementaryIndicatorReferences";
export type {
  PSLCReadingStatus,
  PSLCReadingContext,
  PSLCCanonicalDocumentProvenance,
  CanonicalProfileDocument,
  CanonicalEditorialView,
  CanonicalTechnicalSpace,
  CanonicalBuildContext,
  CanonicalReadingCounters,
  CanonicalAuthoredClosing,
  CanonicalInstitutionalBoundary,
  CanonicalDocumentaryBase,
  CanonicalMethodologicalCaution,
  CanonicalKnowledgeState,
  CanonicalComparativeReference,
  CanonicalEpistemicMatrixRow,
  CanonicalReadingSectionId,
  CanonicalTechnicalSectionId,
  SealedCanonicalProfileDocumentV2,
  NormalizedCanonicalProfileDocument,
  LegacyEditorialView,
  CanonicalNormalizationResult,
  BuildPSLCCanonicalDocumentInput,
  BuildCanonicalBuildContextInput,
} from "./canonicalProfileDocument";
export {
  PSLC_CANONICAL_SCHEMA_VERSION,
  PRIORITIZATION_PENDING_DECLARATION,
  CANONICAL_FRONTIER_STATEMENT,
  CANONICAL_INSTITUTIONAL_CAUTION_NOTE,
  CANONICAL_READING_ORDER,
  CANONICAL_TECHNICAL_ORDER,
  pslStatusLabel,
  formatCanonicalDate,
  buildCanonicalBuildContext,
  buildCanonicalEditorialView,
  buildCanonicalTechnicalSpace,
  assembleCanonicalProfileDocument,
  buildCanonicalProfileDocumentFromPSL,
  buildPSLCCanonicalDocument,
  buildAuthoredClosing,
  buildInstitutionalBoundary,
  buildMethodologicalCautions,
  buildDocumentaryBase,
  buildKnowledgeState,
  sealCanonicalProfileDocument,
  buildSealedCanonicalProfileDocument,
  readSealedCanonicalDocument,
  normalizeSealedCanonicalProfileDocument,
  isLegacyEditorialView,
} from "./canonicalProfileDocument";
