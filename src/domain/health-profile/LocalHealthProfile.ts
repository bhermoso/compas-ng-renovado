import type { MunicipalityId } from "../municipality";

// ── Estado del ciclo de vida ──────────────────────────────────────────────────

export type LocalHealthProfileStatus =
  | "generated"   // generado automáticamente; sin revisión humana
  | "review"      // en revisión técnica activa
  | "validated"   // validado técnicamente (bloques diagnósticos completos)
  | "approved"    // aprobado institucionalmente (deliberación y consenso documentados)
  | "superseded"  // sustituido por versión posterior para el mismo municipio
  | "archived";   // retirado por cierre, obsolescencia o decisión técnica

// ── Tipos snapshot propios del dominio PSL ────────────────────────────────────
// No importan de la capa de aplicación para evitar dependencias cruzadas.
// El builder (capa de aplicación) mapea desde los tipos de aplicación a estos.

export type PSLConflictoTipo =
  | "tendencia"
  | "fuente"
  | "escala"
  | "temporal"
  | "interpretativo";

export interface PSLConflicto {
  id: string;
  tipo: PSLConflictoTipo;
  descripcion: string;
  fuentesImplicadas: string[];
  resolucion: "no-resuelta";   // invariante: el sistema detecta, no resuelve
}

export type PSLTensionClasificacion =
  | "escalada"
  | "no-escalada"
  | "ruido-estructural";

export interface PSLTension {
  descripcion: string;
  clasificacion: PSLTensionClasificacion;
  criteriosCumplidos: number;  // 0–3; de la regla de relevancia
}

export interface PSLAreaIntervencion {
  id: string;
  title: string;
  rationale: string;
  relatedEvidenceIds: string[];
  cautions: string[];
  isAnalyticalGap?: boolean;  // true = vacío o cautela metodológica, no área territorial real
}

// ── Bloques de texto institucional: documento del Perfil y cierre ───────────────────────
// El sistema genera un andamiaje; la autoría definitiva es siempre humana.

export type PSLChapterStatus = "scaffold" | "review" | "authored";

export interface PSLScaffoldChapter {
  content: string;          // texto orientativo generado por el sistema
  status: PSLChapterStatus;
  authorshipNote: string;   // recordatorio de autoría humana requerida
}

// ── Bloque de priorización (preparación deliberativa) scaffold ────────────────────────────

export interface PSLCandidaturaPriorizacion {
  id: string;
  title: string;
  rationale: string;
  relatedEvidenceIds: string[];
}

export type PSLPriorizacionStatus =
  | "scaffold"   // sin candidaturas técnicas ni selección participativa
  | "partial"    // tiene candidaturas técnicas Y/O selección participativa
  | "complete";  // deliberación y consenso documentados (autoría humana)

export interface PSLPriorizacion {
  // Priorización técnica (generada por el sistema a partir del OIT)
  candidaturasTecnicas: PSLCandidaturaPriorizacion[];
  hasTechnicalCandidatures: boolean;

  // Priorización participativa (proceso ciudadano vía REDCap / deliberación)
  tematicasSeleccionadasIds: string[];
  tematicasSeleccionadasLabels: string[];
  hasParticipatorySelection: boolean;

  // Deliberación y consenso — solo de autoría humana; nunca generados
  deliberacionNota: string;    // scaffold: señala la obligación de deliberación
  consensoDocumentado: boolean;
}

// ── LocalHealthProfile ────────────────────────────────────────────────────────

export interface LocalHealthProfile {

  // ── Identidad ─────────────────────────────────────────────────────────────
  id: string;
  municipalityId: MunicipalityId;
  status: LocalHealthProfileStatus;
  version: string;                // ISO timestamp del momento de generación
  evidenceStoreVersion: string;   // = evidenceStore.updatedAt en el momento de captura;
                                  // detecta si la evidencia ha cambiado desde la validación
  narrativeGeneratorVersion?: string; // versión del generador narrativo en el momento
                                      // de la generación; ausente en PSL anteriores.
                                      // Detecta narrativa obsoleta sin sobrescribirla.

  // ── Bloque: Marco Estratégico ─────────────────────────────────────────
  // Referencia los IDs de sección del StrategicFramework canónico.
  // El contenido narrativo permanece en su objeto; el PSL no lo duplica.
  strategicFrameworkSectionIds: string[];

  // ── Bloque: Informe de Salud ─────────────────────────────────────────
  // Invariante PSL-I1: el PSL referencia el Informe de Salud; no lo contiene.
  // healthReportDocumentId = linkedDocumentId del HealthReportDocument
  //                        = id del MunicipalDocument en el repositorio.
  healthReportDocumentId?: string;
  /** Change-detection fingerprint, not a cryptographic authenticity guarantee. */
  healthReportFingerprint?: string;
  healthReportTitle?: string;
  healthReportSectionCount: number;   // secciones parsadas del documento fuente
  healthReportAtomCount: number;      // EvidenceAtoms generados del informe

  // ── Bloque: Diagnóstico integrado ───────────────────────────────────
  totalEvidenceAtoms: number;
  integrityErrors: number;
  integrityWarnings: number;
  atomsByOrigin: Record<string, number>;   // snapshot estadístico por origen
  atomsByKind: Record<string, number>;     // snapshot estadístico por tipo
  evidenceAtomIds: string[];              // IDs de los átomos activos; sin duplicar contenido
  originsSummary: string[];               // orígenes presentes ordenados
  ibsePresent: boolean;
  dukePresent: boolean;
  predimedPresent: boolean;
  sf12Present: boolean;
  suenoPresent: boolean;
  cagePresent: boolean;
  auditcPresent?: boolean;
  ipaqPresent?: boolean;
  ghq12Present?: boolean;
  phq9Present?: boolean;
  psqiPresent?: boolean;
  fagerstromPresent?: boolean;
  sbqPresent?: boolean;
  thematicPrioritisationPresent: boolean;
  complementaryStudyCount: number;

  // ── Bloque: Interpretación territorial ───────────────────────────────
  territorialSummary: string;
  determinantCount: number;
  assetCount: number;
  indicatorCount: number;
  qualitativeFindingCount: number;
  methodologicalCautionCount: number;
  preliminaryOpportunities: string[];
  longitudinalActive: boolean;
  longitudinalNote: string;
  longitudinalEvidenceCount: number;
  marcosAplicados: ReadonlyArray<{ framework: string; elementCount: number }>;
  tensionesEstructurales: string[];
  limitacionesDiagnosticas?: string[];  // observaciones metodológicas (no áreas de intervención)
  conflictos: PSLConflicto[];
  tensionesEscaladas: PSLTension[];
  tensionesNoEscaladas: PSLTension[];
  ruidoEstructural: PSLTension[];
  areasDeIntervencion: PSLAreaIntervencion[];

  // ── Documento del Perfil: conclusiones (seis capítulos narrativos) ──────────────────────────────────────────────
  // Borrador sustantivo: síntesis del estado de salud y funcionamiento del
  // territorio. El equipo técnico lo revisa y valida antes de la validación.
  conclusiones: PSLScaffoldChapter;

  // ── Bloque: Cierre interpretativo (no capitular) ───────────────────────────────────
  // Alcance, limitaciones metodológicas y síntesis del diagnóstico.
  // No prescribe acciones. El equipo técnico lo revisa y valida.
  cierreInterpretativo: PSLScaffoldChapter;

  // ── Bloque: Priorización — preparación deliberativa ─────────────────────────────────
  // Scaffold: priorización técnica + participativa. Deliberación: solo humana.
  // Condición necesaria para transición a estado "approved".
  priorizacion: PSLPriorizacion;
  priorizacionStatus: PSLPriorizacionStatus;

  // ── Metadatos del ciclo de vida ───────────────────────────────────────────
  generatedAt: string;
  reviewStartedAt?: string;
  validatedAt?: string;
  validatedBy?: string;       // perfil técnico (texto libre)
  approvedAt?: string;
  approvedBy?: string;
  supersededById?: string;    // ID del PSL posterior que lo sustituyó
  archivedAt?: string;
  archivedReason?: string;

  requiresHumanValidation: true;
}
