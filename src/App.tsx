import { readLocalizaAssets } from "./application/localiza-assets";
import { buildProfileUpdate, type ProfileUpdateKind } from "./application/health-profile/profileUpdater";
import { compareProfileUpdate, profileUpdateBaseline, canApplyProfilePreview } from "./application/health-profile/profileUpdateDelta";
import type { ProfileTextPackage } from "./application/health-profile/profileTextOperations";
import type { ProfileUpdateOutcome } from "./ui/components/ProfileUpdaterPanel";
import { appendExternalProfile } from "./application/health-profile/externalProfiles";
import { isTerritorialStatisticsSnapshot } from "./application/territorial-statistics/snapshots";
import type { TerritorialStatisticsSnapshot } from "./domain/territorial-statistics/TerritorialStatistics";
import { ExternalProfileDashboard } from "./ui/components/ExternalProfileDashboard";
import { TerritorialStatisticsPanel } from "./ui/components/TerritorialStatisticsPanel";
import type { ProfileResult } from "./domain/health-profile/ExternalHealthProfile";
import { EMPTY_PROFILE_LIBRARY, isExternalProfileLibrary } from "./application/health-profile/externalProfiles";
import type { ExternalProfileLibrary } from "./domain/health-profile/ExternalHealthProfile";
import { InitialLocalHealthPlanPanel } from "./ui/components/InitialLocalHealthPlanPanel";
import { DeleteWorkspaceDialog } from "./ui/components/DeleteWorkspaceDialog";
import { CompasCover, HomePortada, WorkspaceDisclosure } from "./ui/components/HomePortada";
import { DocumentArchiveManager } from "./ui/components/DocumentArchiveManager";
import { StrategicReferenceLibrary } from "./ui/components/StrategicReferenceLibrary";
import { CommonStrategicFramework } from "./ui/components/CommonStrategicFramework";
import { STRATEGIC_REFERENCES } from "./application/strategic-reference-library";
import { normalizeLojaMetadataRemotely } from "./application/workspace/normalizeLojaMetadataRemotely";
import { DocumentReviewInbox } from "./ui/components/DocumentReviewInbox";
import { DiagnosisControlRoom, DiagnosisModuleSection } from "./ui/components/DiagnosisControlRoom";
import { DuplicateDocumentsPanel } from "./ui/components/DuplicateDocumentsPanel";
import { findDuplicateGroups, findExistingCopy, retireDuplicateDocument } from "./application/document-ingestion/documentDuplicates";
import { sha256Hex } from "./application/document-ingestion/sha256";
import { canDeleteDocumentVersion, createDocumentRevision, PENDING_DOCUMENT_REVIEW } from "./application/document-files/documentRevisions";
import { MAX_WORKSPACE_ORIGINALS_BYTES, decideOriginalUpload, decodeDocumentOriginal, encodeDocumentOriginal, formatMegabytes, isDocumentFileName, mergeDocumentOriginals, mergeDocumentDerivatives, workspaceDocumentBytes, type StoredDocumentOriginal, type StoredDocumentDerivative } from "./application/document-files/documentOriginals";
import { buildDiagnosisControlSummary } from "./application/diagnosis/diagnosisControlSummary";
import { regroupZagraActionPlan } from "./application/workspace/regroupZagraActionPlan";
import { processPdfHealthReport } from './application/health-report/ProcessPdfHealthReport';
import { extractPdfText } from './infrastructure/pdf/extractPdfText';
import {
  loadOriginalFile,
  saveOriginalFile,
  deleteOriginalFile,
  deleteOriginalFilesForMunicipality,
} from './infrastructure/document-files/originalFiles';
import { bundledDocuments } from './ui/components/documentAccessUtils';
import { BackupPanel } from './ui/components/BackupPanel';
import { DocumentationProvider } from "./ui/components/Documentation";
import type { PlanPreparationDraft } from "./domain/action-plan-catalog/PlanPreparationDraft";
import { worksheetKey, type IndicatorWorksheet } from "./domain/action-plan-catalog/IndicatorWorksheet";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { type CycleConciliation, type AssetValidationDeclaration, type DocumentCycle, type DocumentKind, type DocumentTemporalMetadata, type MunicipalDocument, type MunicipalDocumentRepository, addMunicipalDocument, setMunicipalDocumentCycle, addCycleConciliation, addAssetValidation, removeAssetValidation, renameMunicipalDocument, removeCycleConciliation, setMunicipalDocumentTemporalMetadata } from "./domain/repository";
import { type MunicipalityWorkspace } from "./domain/workspace";
import { type QuestionnaireProject } from "./domain/questionnaire";
import { importProjectDataset } from "./application/questionnaire";
import { type CreateMunicipalityContextInput } from "./domain/municipality";
import {
  isEmptyWorkspaceForPersistenceGuard,
} from "./application/workspace";
import {
  loadOrCreateMunicipalityWorkspace,
  shouldSkipPersistence,
  shouldRestoreIndexedDbWorkspace,
  withCarriedDocumentOriginals,
  readActiveMunicipalityId,
  saveActiveMunicipalityId,
  ACTIVE_MUNICIPALITY_STORAGE_KEY,
  sanitizeCustomMunicipalities,
  mergeMunicipalityCatalog,
  type WorkspaceLoadResult,
} from "./appWorkspaceHydration";
import { createMunicipalityRuntime } from "./application/runtime";
import { ingestManualDocument, extractDocxText, removeEquivalentStrategicFramework } from "./application/document-ingestion";
import { registerHealthReport } from "./application/health-report/registerHealthReport";
import { activeStudyDocuments, replaceComplementaryStudy, STUDY_DOCUMENT_TAGS } from "./application/document-ingestion/studyDocuments";
import { createSerialQueue } from "./infrastructure/relas/serialQueue";
import { applyCurrentSourcesConsolidation, planCurrentSourcesConsolidation, retireCurrentPredecessors } from "./application/workspace/currentSources";
import { confirmsDocumentDeletion, deleteWorkspaceDocument } from "./application/document-files/deleteWorkspaceDocument";
import type { ComplementaryStudyKey } from "./domain/workspace/MunicipalityWorkspace";
import { assetEntriesOfDocument } from "./application/evidence-pipeline";
import {
  assignLibraryDocumentToWorkspace,
  collectCompasDocumentLibrary,
  libraryDocumentAssignmentId,
  type CompasLibraryDocument,
} from "./application/document-library";
import {
  createHealthReportDocumentFromDocx,
  createHealthReportDocumentFromPdf,
} from "./application/health-report";
import { ibseStudyToEvidenceAtoms } from "./application/ibse";
import { prepareIBSEImport, type IBSEAdjustmentTarget } from "./application/ibse/prepareIBSEImport";
import { ageBandsForMunicipality } from "./application/sam";
import { createIBSEStudy } from "./domain/ibse";
import { validateIBSESourceCSV } from "./application/ibse/validateIBSESourceCSV";
import { inferIBSESampleScope } from "./application/ibse/inferIBSESampleScope";
import { parseDUKECSV, dukeStudyToEvidenceAtoms } from "./application/duke";
import { createDUKEStudy } from "./domain/duke";
import { parsePREDIMEDCSV, predimedStudyToEvidenceAtoms } from "./application/predimed";
import { createPREDIMEDStudy } from "./domain/predimed";
import { parseSF12CSV, sf12StudyToEvidenceAtoms } from "./application/sf12";
import { createSF12Study } from "./domain/sf12";
import { parseSuenoCSV, suenoStudyToEvidenceAtoms } from "./application/sueno";
import { createSuenoStudy } from "./domain/sueno";
import { parseCAGECSV, cageStudyToEvidenceAtoms } from "./application/cage";
import { createCAGEStudy } from "./domain/cage";
import { parseAUDITCCSV, auditcStudyToEvidenceAtoms } from "./application/auditc";
import { createAUDITCStudy } from "./domain/auditc";
import { parseIPAQCSV, ipaqStudyToEvidenceAtoms } from "./application/ipaq";
import { createIPAQStudy } from "./domain/ipaq";
import { parseGHQ12CSV, ghq12StudyToEvidenceAtoms } from "./application/ghq12";
import { createGHQ12Study } from "./domain/ghq12";
import { parsePHQ9CSV, phq9StudyToEvidenceAtoms } from "./application/phq9";
import { createPHQ9Study } from "./domain/phq9";
import { parsePSQICSV, psqiStudyToEvidenceAtoms } from "./application/psqi";
import { createPSQIStudy } from "./domain/psqi";
import { parseFagerstromCSV, fagerstromStudyToEvidenceAtoms } from "./application/fagerstrom";
import { createFagerstromStudy } from "./domain/fagerstrom";
import { parseSBQCSV, sbqStudyToEvidenceAtoms } from "./application/sbq";
import { createSBQStudy } from "./domain/sbq";
import { stableAssetKey, upsertEvidenceAtom, evidenceHasDocument, type EvidenceAtom } from "./domain/evidence";
import {
  THEMATIC_TOPICS,
  MAX_SELECTED_TOPICS,
  createThematicPrioritisation,
} from "./domain/thematic-prioritisation";

import { parseThematicPrioritisationCSV, thematicPrioritisationToEvidenceAtoms } from "./application/thematic-prioritisation";
import { buildEstadoResumen } from "./application/territorial-interpretation";
import type { ThematicPrioritisationStudy } from "./domain/thematic-prioritisation";
import {
  parseWorkspaceJSON,
  saveWorkspaceToLocalStorage,
  clearWorkspaceFromLocalStorage,
} from "./infrastructure/persistence/local-storage";
import {
  loadWorkspaceFromIndexedDB,
  loadAllWorkspacesFromIndexedDB,
  saveWorkspaceToIndexedDB,
  clearWorkspaceFromIndexedDB,
} from "./infrastructure/persistence/indexed-db-workspace";
import { createBrowserRelasClient } from "./infrastructure/relas/BrowserRelasClient";
import {
  clearRemoteTombstone,
  deleteRemoteWorkspace,
  hasRemoteWorkspace,
  readRemoteTombstones,
  readRemoteWorkspace,
  readRemoteWorkspaceVersion,
  saveRemoteWorkspace,
  type RemoteSaveProgressListener,
  type RemoteWorkspaceRevision,
} from "./infrastructure/relas/RemoteWorkspace";
import { RemoteSyncPanel } from "./ui/components/RemoteSyncPanel";
import { CurrentSourcesPanel } from "./ui/components/CurrentSourcesPanel";
import { WorkspacePersistenceIndicator } from "./ui/components/WorkspacePersistenceIndicator";
import { profileSaveErrorMessage, profileSaveProgressMessage } from "./application/health-profile/profileSaveFeedback";
import { syncRemoteCatalog } from "./application/remote-catalog/syncRemoteCatalog";
import { loadLocalWorkspaces } from "./infrastructure/persistence/local-workspaces";
import { listTerritorialSpaces } from "./infrastructure/relas/AdminAccounts";
import { readAccessProfile, readMembership } from "./infrastructure/relas/RelasClient";
import { createDeliberativePrioritySelection } from "./domain/deliberative-prioritisation";
import {
  validateModuleReview,
  isModuleReviewStale,
  type MunicipalActionPlanModuleReview,
} from "./domain/action-plan-catalog";
import { LocalHealthPlanningCycle, DocumentIngestionPanel, DocumentRepositoryPanel, EvidenceStorePanel, HealthReportViewer, EstudiosComplementariosPanel, ActivosSaludPanel, ThematicPrioritisationPanel, CitizenParticipationSummary, ThematicPrioritisationModal, PipelineTracePanel, LT1Panel, OITPanel, ReconciliacionPanel, PrioritizationPanel, LecturaEstrategicaView, PAIView, DeliberativePrioritySelectionPanel, ActionPlanCatalogPanel, GESPanel, LocalHealthPlanOutline, AgendaBoard } from "./ui/components";
import type { AgendaActuation } from "./domain/agenda/AgendaActuation";
import { removeSupersededValidatedPlan, type PlanDocument } from "./domain/action-plan-catalog/PlanDocument";
import "./App.css";

// ── Tipos de ámbito territorial ──────────────────────────────

const TERRITORIAL_TYPE_OPTIONS = [
  { value: "municipio",    label: "Municipio" },
  { value: "mancomunidad", label: "Mancomunidad" },
  { value: "distrito",     label: "Distrito municipal" },
  { value: "otro",         label: "Otro ámbito" },
] as const;

const TERRITORIAL_TYPE_LABEL: Record<string, string> = {
  municipio:    "Municipio",
  mancomunidad: "Mancomunidad",
  distrito:     "Distrito municipal",
  otro:         "Otro ámbito",
};

// ── Municipios de demostración ───────────────────────────────

const DEMO_MUNICIPALITIES: CreateMunicipalityContextInput[] = [
  { id: "alfacar",        name: "Alfacar",              province: "Granada", ineCode: "18011", createdBy: "COMPÁS" },
  { id: "atarfe",         name: "Atarfe",              province: "Granada", ineCode: "18022", createdBy: "COMPÁS" },
  { id: "churriana",      name: "Churriana de la Vega", province: "Granada", ineCode: "18062", createdBy: "COMPÁS" },
  { id: "fuente-vaqueros", name: "Fuente Vaqueros",      province: "Granada", ineCode: "18079", createdBy: "COMPÁS" },
  { id: "loja",            name: "Loja",                  province: "Granada", ineCode: "18122", createdBy: "COMPÁS" },
  { id: "zagra",          name: "Zagra",               province: "Granada", ineCode: "18913", createdBy: "COMPÁS" },
];
const DEMO_MUNICIPALITY_IDS = DEMO_MUNICIPALITIES.map((municipality) => municipality.id);
/** Expedientes retirados de COMPÁS: no se ofrecen ni se abren, aunque quede una copia en el navegador o en Firebase. */
const RETIRED_MUNICIPALITY_IDS: readonly string[] = ["granada-zaidin"];

const CUSTOM_MUNICIPALITIES_KEY = "compas-ng:custom-municipalities";
const DELETED_MUNICIPALITIES_KEY = "compas-ng:deleted-municipalities";
function readDeletedMunicipalityIds(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(DELETED_MUNICIPALITIES_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
/** Sin ámbito por defecto: si no hay uno elegido en este navegador, se pide elegirlo al entrar. */
function hasChosenMunicipality(municipalities: readonly Pick<CreateMunicipalityContextInput, "id">[]): boolean {
  try {
    const stored = localStorage.getItem(ACTIVE_MUNICIPALITY_STORAGE_KEY)?.trim();
    return !!stored && municipalities.some((municipality) => municipality.id === stored);
  } catch { return false; }
}
const WORKSPACE_PERSISTENCE_FAILURE_MESSAGE =
  "No se pudo guardar el espacio de trabajo en este navegador. Descarga una copia de recuperación antes de recargar.";
const WORKSPACE_EXTENDED_STORAGE_MESSAGE =
  "Expediente guardado en almacenamiento ampliado de este navegador. Para abrirlo en otro equipo o conservarlo en el remoto, descarga una copia de recuperación o crea un seed.";

function readCustomMunicipalitiesFromLocalStorage(): CreateMunicipalityContextInput[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MUNICIPALITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? sanitizeCustomMunicipalities(
          parsed as CreateMunicipalityContextInput[],
          DEMO_MUNICIPALITY_IDS
        )
      : [];
  } catch {
    return [];
  }
}

function resolveInitialMunicipality(
  customMunicipalities: readonly CreateMunicipalityContextInput[]
): CreateMunicipalityContextInput {
  const municipalities = mergeMunicipalityCatalog(
    DEMO_MUNICIPALITIES,
    customMunicipalities
  ).filter((municipality) => !readDeletedMunicipalityIds().includes(municipality.id) && !RETIRED_MUNICIPALITY_IDS.includes(municipality.id));
  // Solo técnico: la aplicación necesita un expediente cargado; el selector se abre para elegir.
  const fallback = municipalities[0] ?? DEMO_MUNICIPALITIES[0];
  const activeId = readActiveMunicipalityId(municipalities, fallback.id);
  return municipalities.find((municipality) => municipality.id === activeId) ?? fallback;
}

function slugifyMunicipalityId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Tipos y constantes de módulo ─────────────────────────────

type AppView = "inicio" | "repositorio" | "analisis" | "psl" | "priorizacion" | "lectura" | "plan" | "plan-local" | "agenda" | "evaluacion" | "ges";

const NAV_ITEMS: { id: AppView; label: string; phase?: string }[] = [
  { id: "inicio",        label: "Inicio" },
  { id: "repositorio",   label: "Diagnóstico territorial", phase: "01" },
  { id: "psl",           label: "Perfil de Salud Local", phase: "02" },
  { id: "priorizacion",  label: "Priorización", phase: "03" },
  { id: "plan",          label: "Plan de Acción", phase: "04" },
  { id: "plan-local",    label: "Plan Local de Salud" },
  { id: "agenda",        label: "Implantación", phase: "05" },
  { id: "evaluacion",    label: "Evaluación", phase: "06" },
  { id: "ges",           label: "Gestor de Encuestas" },
];
type PlanSection = "lineas" | "resultante" | "lectura" | "prioridades" | "borrador";

/** En escritorio una etiqueta larga se parte en dos líneas por un punto fijo
 * («Perfil de / Salud Local»), nunca en tres; el texto accesible no cambia. */
const NAV_LABEL_BREAKS: Record<string, [string, string]> = {
  "Diagnóstico territorial": ["Diagnóstico", "territorial"],
  "Perfil de Salud Local": ["Perfil de", "Salud Local"],
  "Plan de Acción": ["Plan de", "Acción"],
  "Plan Local de Salud": ["Plan Local", "de Salud"],
  "Gestor de Encuestas": ["Gestor de", "Encuestas"],
};
function navLabelLines(label: string) {
  const parts = NAV_LABEL_BREAKS[label];
  if (!parts) return label;
  return <><span className="app-nav__label-line">{parts[0]}</span> <span className="app-nav__label-line">{parts[1]}</span></>;
}
// Vistas eliminadas de la navegación principal pero accesibles para desarrollo:
// "analisis" (D-002) y "lectura" (D-004).

/** Registra la huella del archivo en un documento ya creado por su cargador. */
function withContentSha256(repository: MunicipalDocumentRepository, documentId: string, contentSha256: string | undefined): MunicipalDocumentRepository {
  if (contentSha256 === undefined) return repository;
  return { ...repository, documents: repository.documents.map((d) => (d.id === documentId ? { ...d, contentSha256 } : d)) };
}

/** Secciones de detalle del diagnóstico. */
type DiagnosisSectionId = "health-report" | "studies" | "assets" | "documents" | "manual" | "evidence";

/** Opciones de los cargadores existentes cuando los invoca la bandeja de revisión. */
type LoaderOptions = {
  kind?: DocumentKind;
  declaresOpenAnswers?: boolean;
  temporal?: DocumentTemporalMetadata;
  /** Huella SHA-256 ya calculada por la bandeja; si falta, el cargador la calcula. */
  contentSha256?: string;
  activateHealthReportRevisionId?: string;
};

const DOCUMENT_KINDS: { value: DocumentKind; label: string }[] = [
  { value: "health-report",             label: "Informe de Salud" },
  { value: "complementary-study",       label: "Estudio complementario" },
  { value: "localiza-salud",            label: "Localiza Salud" },
  { value: "strategic-framework",       label: "Marco estratégico y normativo" },
  { value: "territorial-documentation", label: "Documentación Territorial de Contexto" },
  { value: "qualitative-material",      label: "Material Cualitativo y Participativo" },
  { value: "longitudinal-evidence",     label: "Evidencia longitudinal" },
];

const IBSE_DOCUMENT_TAG = "ibse";
const DUKE_DOCUMENT_TAG = "duke-eas";
const PREDIMED_DOCUMENT_TAG = "predimed-eas";
const SF12_DOCUMENT_TAG = "sf12-eas";
const SUENO_DOCUMENT_TAG = "sueno-eas";
const CAGE_DOCUMENT_TAG = "cage-eas";
const AUDITC_DOCUMENT_TAG = "auditc";
const IPAQ_DOCUMENT_TAG = "ipaq-eas";
const GHQ12_DOCUMENT_TAG = "ghq12";
const PHQ9_DOCUMENT_TAG = "phq9";
const PSQI_DOCUMENT_TAG = "psqi";
const FAGERSTROM_DOCUMENT_TAG = "fagerstrom";
const SBQ_DOCUMENT_TAG = "sbq";
const THEMATIC_PRIORITISATION_DOCUMENT_TAG = "thematic-prioritisation";

function hasDocumentTag(document: MunicipalDocument | undefined, tag: string): boolean {
  return document?.tags.includes(tag) === true;
}

function isThematicPrioritisationDocument(
  document: MunicipalDocument | undefined
): boolean {
  return hasDocumentTag(document, THEMATIC_PRIORITISATION_DOCUMENT_TAG);
}

function attachDocumentIdToAtoms(
  atoms: EvidenceAtom[],
  documentId: string
): EvidenceAtom[] {
  return atoms.map((atom) => ({
    ...atom,
    provenance: {
      ...atom.provenance,
      documentId,
    },
  }));
}

function loadPersistedWorkspacesForLibrary(
  activeWorkspace: MunicipalityWorkspace
): MunicipalityWorkspace[] {
  const byMunicipality = new Map<string, MunicipalityWorkspace>();
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key === null || !key.startsWith("compas-ng:workspace:")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = parseWorkspaceJSON(raw);
      if (parsed !== null) {
        byMunicipality.set(parsed.municipality.identity.id, parsed);
      }
    }
  } catch {
    // localStorage can be disabled; the active workspace remains authoritative.
  }
  byMunicipality.set(activeWorkspace.municipality.identity.id, activeWorkspace);
  return Array.from(byMunicipality.values());
}

// isEmptyWorkspaceForPersistenceGuard importada desde application/workspace
// WorkspaceLoadResult / loadOrCreateMunicipalityWorkspace / shouldSkipPersistence
// viven en ./appWorkspaceHydration (testables sin renderizar App).

// ── Componente principal ─────────────────────────────────────

export default function App() {
  const [view, setViewState] = useState<AppView>(() => {
    // Enlaces desde el Aula: abrir sólo una fase existente, sin seleccionar
    // ni reemplazar automáticamente el expediente municipal del usuario.
    const requested = new URLSearchParams(window.location.search).get("fase");
    return NAV_ITEMS.some(item => item.id === requested)
      ? requested as AppView
      : "inicio";
  });
  const [agendaFocusId, setAgendaFocusId] = useState<string | undefined>(undefined);
  const [planTab, setPlanTab] = useState<PlanSection | null>(null);
  const profileSaveInFlightRef = useRef(false);
  // Evita volver a escribir automáticamente el mismo expediente ya confirmado
  // por el guardado manual (incluidos todos los originales en base64).
  const lastExplicitProfileWorkspaceRef = useRef<MunicipalityWorkspace | null>(null);
  const preparationDirtyRef = useRef(false);
  const onPreparationDirtyChange = useCallback((dirty: boolean) => { preparationDirtyRef.current = dirty; }, []);
  function canLeavePreparation() {
    if (profileSaveInFlightRef.current) { setRemotePersistenceMessage("Espera a que termine el guardado del perfil en Firebase."); return false; }
    if (profileDirtyRef.current && !window.confirm("Hay cambios sin guardar en el Perfil. ¿Descartarlos y continuar?")) return false;
    return !preparationDirtyRef.current || window.confirm("Hay cambios sin guardar en la propuesta de recogida. ¿Quieres descartarlos y continuar?");
  }
  function setView(next: AppView) {
    if (next === view || !canLeavePreparation()) return;
    setViewState(next);
  }
  const remoteClient = useMemo(() => createBrowserRelasClient(), []);
  const reviewedRemoteRevisions = useRef(new Map<string, RemoteWorkspaceRevision>());
  const displayedWorkspaceRef = useRef<MunicipalityWorkspace | null>(null);
  // Los guardados en Firebase van en serie: cada uno lee la revisión que dejó el anterior.
  const remoteSaveQueue = useMemo(() => createSerialQueue(), []);
  const saveReviewedWorkspace = useCallback(async (
    next: MunicipalityWorkspace,
    onProgress: RemoteSaveProgressListener | undefined,
    base: MunicipalityWorkspace,
  ) => {
    if (displayedWorkspaceRef.current !== base) throw new Error("El expediente cambió durante la operación. Revisa los cambios antes de volver a guardar.");
    const id = next.municipality.identity.id;
    await remoteSaveQueue(async () => {
      const reviewed = reviewedRemoteRevisions.current.get(id);
      if (reviewed === undefined) throw new Error("Recupera el expediente compartido antes de guardarlo.");
      const saved = await saveRemoteWorkspace(remoteClient, next, onProgress, reviewed);
      if (reviewedRemoteRevisions.current.get(id) === reviewed) {
        reviewedRemoteRevisions.current.set(id, saved);
        lastExplicitProfileWorkspaceRef.current = next;
      }
    });
  }, [remoteClient, remoteSaveQueue]);
  const [remoteHydratedMunicipalityId, setRemoteHydratedMunicipalityId] =
    useState<string | null>(null);
  const [remotePersistenceMessage, setRemotePersistenceMessage] =
    useState<string | null>(null);
  // Sin ámbito por defecto: en la primera visita (o si el elegido se retiró) se abre el selector.
  const [municipalityChosen, setMunicipalityChosen] = useState(() =>
    hasChosenMunicipality(mergeMunicipalityCatalog(DEMO_MUNICIPALITIES, readCustomMunicipalitiesFromLocalStorage())
      .filter((municipality) => !RETIRED_MUNICIPALITY_IDS.includes(municipality.id))));
  const [showMunicipalitySelector, setShowMunicipalitySelector] = useState(() => !municipalityChosen);
  // La barra de navegación es fija, pero el selector de ámbito se abre al principio
  // de la vista: si la página está desplazada, se lleva el selector a la vista,
  // justo debajo de la barra.
  useEffect(() => {
    if (!showMunicipalitySelector) return;
    const frame = requestAnimationFrame(() => {
      const selector = document.querySelector<HTMLElement>(".municipality-selector");
      if (!selector) return;
      const navBottom = document.querySelector(".app-nav")?.getBoundingClientRect().bottom ?? 0;
      window.scrollTo({ top: Math.max(0, window.scrollY + selector.getBoundingClientRect().top - navBottom - 8) });
    });
    return () => cancelAnimationFrame(frame);
  }, [showMunicipalitySelector]);
  const [municipalityToDelete, setMunicipalityToDelete] = useState<CreateMunicipalityContextInput | null>(null);
  const [isThematicModalOpen, setIsThematicModalOpen] = useState(false);
  const [initialCustomMunicipalities] = useState<CreateMunicipalityContextInput[]>(
    readCustomMunicipalitiesFromLocalStorage
  );
  const [customMunicipalities, setCustomMunicipalities] = useState<CreateMunicipalityContextInput[]>(
    () => initialCustomMunicipalities
  );

  // El expediente completo puede sobrevivir en IndexedDB aunque la lista ligera
  // de ámbitos de localStorage falte. Reconstruir el selector evita que un ámbito
  // ya creado desaparezca al abrir otra pestaña o recargar la aplicación.
  useEffect(() => {
    let cancelled = false;
    void loadAllWorkspacesFromIndexedDB().then((storedWorkspaces) => {
      if (cancelled || storedWorkspaces.length === 0) return;
      setCustomMunicipalities((current) => {
        const byId = new Map(current.map((municipality) => [municipality.id, municipality]));
        for (const stored of storedWorkspaces) {
          const identity = stored.municipality.identity;
          if (readDeletedMunicipalityIds().includes(identity.id)) continue;
          if (DEMO_MUNICIPALITIES.some((municipality) => municipality.id === identity.id)) {
            continue;
          }
          byId.set(identity.id, {
            id: identity.id,
            name: identity.name,
            province: identity.province,
            ineCode: identity.ineCode,
            territorialType: identity.territorialType,
            createdBy: stored.municipality.metadata.createdBy ?? "Usuario",
          });
        }
        const recovered = sanitizeCustomMunicipalities(
          Array.from(byId.values()),
          DEMO_MUNICIPALITY_IDS
        );
        if (
          recovered.length === current.length &&
          recovered.every((municipality, index) => municipality.id === current[index]?.id)
        ) {
          return current;
        }
        try {
          localStorage.setItem(CUSTOM_MUNICIPALITIES_KEY, JSON.stringify(recovered));
        } catch {
          // IndexedDB sigue siendo la fuente de recuperación del catálogo.
        }
        return recovered;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [initialWorkspaceLoad] = useState<WorkspaceLoadResult>(() => {
    const initialMunicipality = resolveInitialMunicipality(initialCustomMunicipalities);
    return loadOrCreateMunicipalityWorkspace(
      initialMunicipality.id,
      initialMunicipality
    );
  });
  const [workspace, setWorkspace] = useState<MunicipalityWorkspace>(() => initialWorkspaceLoad.workspace);
  useLayoutEffect(() => { displayedWorkspaceRef.current = workspace; }, [workspace]);
  const protectedEmptyWorkspaceIdRef = useRef<string | null>(
    initialWorkspaceLoad.protectExistingStorage
      ? initialWorkspaceLoad.workspace.municipality.identity.id
      : null
  );
  const [pendingIndexedDbHydrationId, setPendingIndexedDbHydrationId] =
    useState<string | null>(
      initialWorkspaceLoad.workspace.municipality.identity.id
    );
  const locallyDeletedWorkspaceIdsRef = useRef<Set<string>>(new Set(readDeletedMunicipalityIds()));

  useEffect(() => {
    if (protectedEmptyWorkspaceIdRef.current === workspace.municipality.identity.id) return;
    setWorkspace(previous => regroupZagraActionPlan(previous));
  }, [workspace]);

  const [title, setTitle] = useState("");
  const [declaresOpenAnswers, setDeclaresOpenAnswers] = useState(false);
  const [plainText, setPlainText] = useState("");
  const [kind, setKind] = useState<DocumentKind>("territorial-documentation");
  // El diagnóstico comienza compacto; los módulos se despliegan a demanda.
  const [pendingStatisticsRevision, setPendingStatisticsRevision] = useState<{ municipalityId: string; results: ProfileResult[]; note: string } | null>(null);
  const [openDiagModules, setOpenDiagModules] = useState<ReadonlySet<DiagnosisSectionId>>(() => new Set());
  const toggleDiagnosisModule = useCallback((id: DiagnosisSectionId, open: boolean) => {
    setOpenDiagModules((previous) => {
      const next = new Set(previous);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  }, []);
  const openDiagnosisToolbox = useCallback(() => {
    const toolbox = document.getElementById("diagnosis-tools-drawer");
    if (toolbox instanceof HTMLDetailsElement) toolbox.open = true;
  }, []);
  // Huellas de los originales conservados en este navegador, para reconocer
  // copias de documentos anteriores a que se registrara contentSha256.
  const [documentWriteAllowed, setDocumentWriteAllowed] = useState(false);
  useEffect(() => {
    let active = true;
    const id = workspace.municipality.identity.id;
    setDocumentWriteAllowed(false);
    if (!remoteClient.auth.currentUser || remoteHydratedMunicipalityId !== id) return;
    void readMembership(remoteClient, id)
      .then(role => { if (active) setDocumentWriteAllowed(role !== "reader"); })
      .catch(() => { if (active) setDocumentWriteAllowed(false); });
    return () => { active = false; };
  }, [remoteClient, remoteHydratedMunicipalityId, workspace.municipality.identity.id]);

  const originalHashCache = useRef(new Map<string, string | null>());
  const [localOriginalHashes, setLocalOriginalHashes] = useState<Record<string, string>>({});
  // Incluye las huellas del expediente compartido, no solo la caché de este navegador.
  // Así un archivo idéntico no se vuelve a importar desde otro equipo.
  const knownOriginalHashes = {
    ...localOriginalHashes,
    ...(workspace.documentOriginals ?? []).reduce<Record<string, string>>((acc, original) => {
      acc[original.documentId] = original.sha256;
      return acc;
    }, {}),
  };
  useEffect(() => {
    let cancelled = false;
    const municipalityId = workspace.municipality.identity.id;
    const pending = workspace.repository.documents.filter(
      (d) => !d.contentSha256 && d.status !== "archived" && d.status !== "rejected"
    );
    void (async () => {
      for (const d of pending) {
        const key = `${municipalityId}:${d.id}`;
        if (originalHashCache.current.has(key)) continue;
        try {
          const original = await loadOriginalFile(municipalityId, d.id);
          originalHashCache.current.set(key, original ? await sha256Hex(original) : null);
        } catch {
          originalHashCache.current.set(key, null);
        }
        if (cancelled) return;
      }
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const d of pending) {
        const hash = originalHashCache.current.get(`${municipalityId}:${d.id}`);
        if (hash) next[d.id] = hash;
      }
      setLocalOriginalHashes((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    })();
    return () => { cancelled = true; };
  }, [workspace.repository.documents, workspace.municipality.identity.id]);

  // Originales del Diagnóstico en Firebase, con el mecanismo del Perfil externo:
  // bajada (expediente → IndexedDB, con comprobación de huella) y subida
  // (IndexedDB → expediente, dentro del presupuesto común de 40 MB). La subida
  // espera a que el expediente compartido esté recuperado, para no añadir
  // originales a una versión que luego se sustituye.
  const originalSyncSkip = useRef(new Set<string>());
  const [localOnlyOriginals, setLocalOnlyOriginals] = useState<Array<{ documentId: string; reason: "too-large" | "over-budget" | "different-hash" }>>([]);
  useEffect(() => {
    const municipalityId = workspace.municipality.identity.id;
    const signedIn = remoteClient.auth.currentUser !== null;
    if (pendingIndexedDbHydrationId === municipalityId) return;
    if (signedIn && remoteHydratedMunicipalityId !== municipalityId) return;
    let cancelled = false;
    const stored = workspace.documentOriginals ?? [];
    const documents = workspace.repository.documents;
    void (async () => {
      for (const original of stored) {
        const key = `down:${municipalityId}:${original.documentId}:${original.sha256}`;
        if (originalSyncSkip.current.has(key)) continue;
        try {
          const local = await loadOriginalFile(municipalityId, original.documentId);
          // Firebase es la fuente de verdad. Una caché antigua con el mismo ID
          // y bytes distintos debe actualizarse, no mantenerse indefinidamente.
          if (!local || await sha256Hex(local) !== original.sha256) {
            await saveOriginalFile(municipalityId, original.documentId, await decodeDocumentOriginal(original));
          }
        } catch (error) {
          console.error("[original-restore-error]", original.documentId, error);
        }
        if (cancelled) return;
        originalSyncSkip.current.add(key);
      }
      const storedIds = new Set(stored.map((o) => o.documentId));
      let used = workspaceDocumentBytes(workspace);
      const additions: StoredDocumentOriginal[] = [];
      const localOnly: typeof localOnlyOriginals = [];
      for (const d of documents) {
        if (storedIds.has(d.id) || d.status === "rejected") continue;
        const key = `up:${municipalityId}:${d.id}`;
        if (originalSyncSkip.current.has(key)) continue;
        const local = await loadOriginalFile(municipalityId, d.id).catch(() => undefined);
        if (cancelled) return;
        if (!local) { originalSyncSkip.current.add(key); continue; }
        const decision = decideOriginalUpload(local.size, used);
        if (decision !== "fits") { localOnly.push({ documentId: d.id, reason: decision }); continue; }
        const original = await encodeDocumentOriginal(d.id, local);
        if (d.contentSha256 && original.sha256 !== d.contentSha256) {
          localOnly.push({ documentId: d.id, reason: "different-hash" });
          continue;
        }
        additions.push(original);
        used += local.size;
        if (cancelled) return;
      }
      setLocalOnlyOriginals((previous) => (JSON.stringify(previous) === JSON.stringify(localOnly) ? previous : localOnly));
      if (additions.length === 0) return;
      setWorkspace((prev) => {
        if (prev.municipality.identity.id !== municipalityId) return prev;
        const next = mergeDocumentOriginals(prev.documentOriginals ?? [], additions.filter((a) => prev.repository.documents.some((d) => d.id === a.documentId)));
        return { ...prev, documentOriginals: next, updatedAt: new Date().toISOString() };
      });
    })();
    return () => { cancelled = true; };
  }, [workspace.repository.documents, workspace.documentOriginals, workspace.documentDerivedFiles, workspace.externalProfileLibrary, workspace.municipality.identity.id, remoteClient, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  const [lastProcessedDocument, setLastProcessedDocument] =
    useState<MunicipalDocument | null>(null);
  const [lastAtomCount, setLastAtomCount] = useState<number>(0);
  const reportProcessingAttempts = useRef(new Set<string>());
  const [isLoadingHealthReport, setIsLoadingHealthReport] = useState(false);
  const [lastHealthReportMessage, setLastHealthReportMessage] = useState<string | null>(null);
  const [isLoadingDocumentFile, setIsLoadingDocumentFile] = useState(false);
  const [documentFileMessage, setDocumentFileMessage] = useState<string | null>(null);
  const [documentLibraryMessage, setDocumentLibraryMessage] = useState<string | null>(null);
  const [isLoadingIBSE, setIsLoadingIBSE] = useState(false);
  const [ibseMessage, setIbseMessage] = useState<string | null>(null);
  const [isLoadingDUKE, setIsLoadingDUKE] = useState(false);
  const [dukeMessage, setDukeMessage] = useState<string | null>(null);
  const [isLoadingPREDIMED, setIsLoadingPREDIMED] = useState(false);
  const [predimedMessage, setPredimedMessage] = useState<string | null>(null);
  const [isLoadingSF12, setIsLoadingSF12] = useState(false);
  const [sf12Message, setSf12Message] = useState<string | null>(null);
  const [isLoadingSueno, setIsLoadingSueno] = useState(false);
  const [suenoMessage, setSuenoMessage] = useState<string | null>(null);
  const [isLoadingCAGE, setIsLoadingCAGE] = useState(false);
  const [cageMessage, setCageMessage] = useState<string | null>(null);
  const [isLoadingAUDITC, setIsLoadingAUDITC] = useState(false);
  const [auditcMessage, setAuditcMessage] = useState<string | null>(null);
  const [isLoadingIPAQ, setIsLoadingIPAQ] = useState(false);
  const [ipaqMessage, setIpaqMessage] = useState<string | null>(null);
  const [isLoadingGHQ12, setIsLoadingGHQ12] = useState(false);
  const [ghq12Message, setGhq12Message] = useState<string | null>(null);
  const [isLoadingPHQ9, setIsLoadingPHQ9] = useState(false);
  const [phq9Message, setPhq9Message] = useState<string | null>(null);
  const [isLoadingPSQI, setIsLoadingPSQI] = useState(false);
  const [psqiMessage, setPsqiMessage] = useState<string | null>(null);
  const [isLoadingFagerstrom, setIsLoadingFagerstrom] = useState(false);
  const [fagerstromMessage, setFagerstromMessage] = useState<string | null>(null);
  const [isLoadingSBQ, setIsLoadingSBQ] = useState(false);
  const [sbqMessage, setSbqMessage] = useState<string | null>(null);
  const [pendingTopics, setPendingTopics] = useState<string[]>(
    () => workspace.thematicPrioritisation?.selectedTopicIds ?? []
  );
  const [isImportingTP, setIsImportingTP] = useState(false);
  const [tpImportMessage, setTpImportMessage] = useState<string | null>(null);
  const [isImportingProjectDataset, setIsImportingProjectDataset] = useState(false);
  const [importProjectDatasetMessage, setImportProjectDatasetMessage] = useState<string | null>(null);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null);

  const [newMuniName, setNewMuniName] = useState("");
  const [newMuniProvince, setNewMuniProvince] = useState("");
  const [newMuniType, setNewMuniType] = useState("municipio");
  const [newMuniError, setNewMuniError] = useState<string | null>(null);

  useEffect(() => {
    if (locallyDeletedWorkspaceIdsRef.current.has(workspace.municipality.identity.id)) return;
    if (
      shouldSkipPersistence({
        workspaceMunicipalityId: workspace.municipality.identity.id,
        protectedEmptyWorkspaceId: protectedEmptyWorkspaceIdRef.current,
        isEmpty: isEmptyWorkspaceForPersistenceGuard(workspace),
      })
      || pendingIndexedDbHydrationId === workspace.municipality.identity.id
    ) {
      setPersistenceMessage(null);
      return;
    }

    protectedEmptyWorkspaceIdRef.current = null;
    const localSaved = saveWorkspaceToLocalStorage(workspace);
    let cancelled = false;
    void saveWorkspaceToIndexedDB(workspace).then((indexedDbSaved) => {
      if (cancelled) return;
      setPersistenceMessage(
        localSaved
          ? null
          : indexedDbSaved
            ? WORKSPACE_EXTENDED_STORAGE_MESSAGE
            : WORKSPACE_PERSISTENCE_FAILURE_MESSAGE
      );
    });
    return () => {
      cancelled = true;
    };
  }, [workspace, pendingIndexedDbHydrationId]);

  useEffect(() => {
    if (pendingIndexedDbHydrationId === null) return;
    const targetMunicipalityId = pendingIndexedDbHydrationId;
    let cancelled = false;
    void loadWorkspaceFromIndexedDB(targetMunicipalityId).then((stored) => {
      if (cancelled) return;
      if (stored !== null) {
        setWorkspace((current) => {
          if (!shouldRestoreIndexedDbWorkspace(current, stored)) return withCarriedDocumentOriginals(current, stored);
          queueMicrotask(() => {
            setPendingTopics([
              ...(stored.thematicPrioritisation?.selectedTopicIds ?? []),
            ]);
          });
          return stored;
        });
      }
      setPendingIndexedDbHydrationId((currentPending) =>
        currentPending === targetMunicipalityId ? null : currentPending
      );
    });
    return () => {
      cancelled = true;
    };
  }, [pendingIndexedDbHydrationId]);

  // Sincroniza una pestaña ya abierta con el expediente más reciente guardado por
  // otra pestaña o recuperado mediante una entrada directa. localStorage emite el
  // evento `storage`; IndexedDB no, por lo que también se comprueba al recuperar
  // el foco o volver a hacer visible la página.
  useEffect(() => {
    const targetMunicipalityId = workspace.municipality.identity.id;
    let cancelled = false;

    const refreshPersistedWorkspace = async (): Promise<void> => {
      let localWorkspace: MunicipalityWorkspace | null = null;
      try {
        const raw = localStorage.getItem(
          `compas-ng:workspace:${targetMunicipalityId}`
        );
        localWorkspace = raw ? parseWorkspaceJSON(raw) : null;
      } catch {
        localWorkspace = null;
      }
      const indexedWorkspace = await loadWorkspaceFromIndexedDB(
        targetMunicipalityId
      );
      if (cancelled) return;

      setWorkspace((current) => {
        if (current.municipality.identity.id !== targetMunicipalityId) {
          return current;
        }
        let newest = current;
        if (
          localWorkspace !== null &&
          shouldRestoreIndexedDbWorkspace(newest, localWorkspace)
        ) {
          newest = localWorkspace;
        }
        if (
          indexedWorkspace !== null &&
          shouldRestoreIndexedDbWorkspace(newest, indexedWorkspace)
        ) {
          newest = indexedWorkspace;
        }
        // La copia que se conserva recibe los originales que solo tenga otra.
        newest = withCarriedDocumentOriginals(withCarriedDocumentOriginals(newest, indexedWorkspace), localWorkspace);
        if (newest === current) return current;
        queueMicrotask(() => {
          setPendingTopics([
            ...(newest.thematicPrioritisation?.selectedTopicIds ?? []),
          ]);
        });
        return newest;
      });
    };

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === CUSTOM_MUNICIPALITIES_KEY) {
        setCustomMunicipalities(readCustomMunicipalitiesFromLocalStorage());
      }
      if (
        event.key === `compas-ng:workspace:${targetMunicipalityId}` ||
        event.key === CUSTOM_MUNICIPALITIES_KEY
      ) {
        void refreshPersistedWorkspace();
      }
    };
    const handleFocus = (): void => {
      void refreshPersistedWorkspace();
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void refreshPersistedWorkspace();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [workspace.municipality.identity.id]);

  // Catálogo de expedientes: al abrir con sesión de administración se descartan
  // los eliminados en otro equipo, se incorporan los que solo existen en Firebase
  // y se suben los de este navegador que Firebase aún no tiene.
  const catalogIdsRef = useRef<ReadonlySet<string>>(new Set());
  const activeIdRef = useRef("");
  useEffect(() => {
    if (remoteClient.auth.currentUser === null) return;
    let cancelled = false;
    void (async () => {
      const profile = await readAccessProfile(remoteClient);
      if (!profile.administrator || cancelled) return;
      const result = await syncRemoteCatalog({
        listScopes: () => listTerritorialSpaces(remoteClient),
        listTombstones: () => readRemoteTombstones(remoteClient),
        hasRemoteWorkspace: (id) => hasRemoteWorkspace(remoteClient, id),
        readRemoteContext: async (id) => {
          const remote = await readRemoteWorkspace(remoteClient, id);
          if (remote === null) return null;
          const identity = remote.municipality.identity;
          return {
            id: identity.id,
            name: identity.name,
            province: identity.province,
            ineCode: identity.ineCode,
            territorialType: identity.territorialType,
            createdBy: remote.municipality.metadata.createdBy,
          };
        },
        uploadWorkspace: async ws => { await saveRemoteWorkspace(remoteClient, ws, undefined, null); },
        localWorkspaces: async () => (await loadLocalWorkspaces())
          .filter(ws => ws.municipality.identity.id !== activeIdRef.current),
        localCatalogIds: () => catalogIdsRef.current,
        isEmptyWorkspace: isEmptyWorkspaceForPersistenceGuard,
        discardLocal: async (id) => {
          locallyDeletedWorkspaceIdsRef.current.add(id);
          localStorage.setItem(
            DELETED_MUNICIPALITIES_KEY,
            JSON.stringify([...locallyDeletedWorkspaceIdsRef.current])
          );
          clearWorkspaceFromLocalStorage(id);
          await clearWorkspaceFromIndexedDB(id);
          await deleteOriginalFilesForMunicipality(id).catch(() => 0);
        },
      });
      if (cancelled) return;
      if (result.discarded.includes(activeIdRef.current)) {
        window.location.reload();
        return;
      }
      if (result.discarded.length > 0 || result.adopted.length > 0) {
        setCustomMunicipalities((current) => {
          const next = sanitizeCustomMunicipalities(
            [
              ...current.filter((m) => !result.discarded.includes(m.id)),
              ...result.adopted,
            ],
            DEMO_MUNICIPALITY_IDS
          );
          try {
            localStorage.setItem(CUSTOM_MUNICIPALITIES_KEY, JSON.stringify(next));
          } catch {
            // El catálogo se reconstruye desde Firebase en la siguiente apertura.
          }
          return next;
        });
      }
      const parts = [
        result.uploaded.length > 0 && `subidos a Firebase: ${result.uploaded.join(", ")}`,
        result.adopted.length > 0 && `incorporados desde Firebase: ${result.adopted.map((m) => m.id).join(", ")}`,
        result.discarded.length > 0 && `retirados (eliminados en otro equipo): ${result.discarded.join(", ")}`,
        result.errors.length > 0 && `con error: ${result.errors.map((e) => `${e.id} (${e.message})`).join("; ")}`,
      ].filter(Boolean);
      if (parts.length > 0) {
        setRemotePersistenceMessage(`Sincronización con Firebase — ${parts.join(" · ")}.`);
      }
    })().catch((error: unknown) => {
      if (!cancelled) {
        setRemotePersistenceMessage(
          `No se pudo sincronizar el catálogo con Firebase: ${error instanceof Error ? error.message : "error desconocido"}`
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [remoteClient]);

  // En una sesión autenticada, Firestore es la copia compartida entre
  // navegadores y equipos. La comparación por updatedAt impide que una copia
  // remota antigua sustituya trabajo local más reciente.
  useEffect(() => {
    const municipalityId = workspace.municipality.identity.id;
    if (locallyDeletedWorkspaceIdsRef.current.has(municipalityId)) {
      setRemoteHydratedMunicipalityId(null);
      setRemotePersistenceMessage(
        "Expediente local eliminado. La copia compartida de Firebase no se modifica desde esta acción."
      );
      return;
    }
    const user = remoteClient.auth.currentUser;
    if (!user) {
      setRemoteHydratedMunicipalityId(municipalityId);
      setRemotePersistenceMessage(null);
      return;
    }
    let cancelled = false;
    reviewedRemoteRevisions.current.delete(municipalityId);
    setRemoteHydratedMunicipalityId(null);
    setRemotePersistenceMessage("Comprobando el expediente compartido…");
    void readRemoteWorkspaceVersion(remoteClient, municipalityId)
      .then((reviewed) => {
        if (cancelled) return;
        const remoteWorkspace = reviewed?.workspace ?? null;
        if (remoteWorkspace !== null) {
          // Nunca publicar silenciosamente un trabajo local que pueda
          // sobrescribir la versión compartida. El conflicto requiere recuperación
          // manual: ambos snapshots permanecen intactos.
          if (workspace.updatedAt > remoteWorkspace.updatedAt &&
              !isEmptyWorkspaceForPersistenceGuard(workspace)) {
            setRemotePersistenceMessage("Conflicto de versiones: el expediente local es posterior a Firebase. Se ha bloqueado el autoguardado remoto. Conserva una copia del navegador y concilia antes de continuar.");
            return;
          }
          lastExplicitProfileWorkspaceRef.current = remoteWorkspace;
          setWorkspace(() => withCarriedDocumentOriginals(remoteWorkspace, workspace));
          setPendingTopics([...(remoteWorkspace.thematicPrioritisation?.selectedTopicIds ?? [])]);
        }
        reviewedRemoteRevisions.current.set(municipalityId, reviewed?.revision ?? null);
        setRemoteHydratedMunicipalityId(municipalityId);
        setRemotePersistenceMessage(remoteWorkspace === null
          ? "No existe todavía una copia compartida; se creará con este expediente."
          : "Expediente compartido recuperado desde Firebase.");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Fallo de lectura: no liberar el autoguardado ni operaciones destructivas.
        setRemotePersistenceMessage(error instanceof Error
          ? `No se pudo recuperar Firebase: ${error.message}. El guardado remoto está bloqueado.`
          : "No se pudo recuperar Firebase. El guardado remoto está bloqueado.");
      });
    return () => {
      cancelled = true;
    };
  }, [remoteClient, workspace.municipality.identity.id]);

  useEffect(() => {
    const municipalityId = workspace.municipality.identity.id;
    if (
      !remoteClient.auth.currentUser ||
      remoteHydratedMunicipalityId !== municipalityId ||
      pendingIndexedDbHydrationId === municipalityId ||
            lastExplicitProfileWorkspaceRef.current === workspace
    ) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (profileSaveInFlightRef.current) return;
      setRemotePersistenceMessage("Guardando el expediente compartido…");
      void saveReviewedWorkspace(workspace, undefined, workspace)
        .then(() => {
          if (!cancelled) {
            setRemotePersistenceMessage(
              "Expediente compartido guardado en Firebase."
            );
          }
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setRemotePersistenceMessage(
            error instanceof Error
              ? `No se pudo guardar la copia compartida: ${error.message}`
              : "No se pudo guardar la copia compartida."
          );
        });
    }, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    pendingIndexedDbHydrationId,
    remoteClient, saveReviewedWorkspace,
    remoteHydratedMunicipalityId,
    workspace,
  ]);

  const runtime = useMemo(
    () => createMunicipalityRuntime({ workspace }),
    [workspace]
  );

  // ── Estado Territorial Evolutivo — historial acumulativo ────────────────
  // Appends a compact snapshot each time the evidence version changes.
  // Loop-safe: version = evidenceStore.updatedAt, which is NOT modified here.
  // Max 50 entries per municipality (oldest are dropped first).
  useEffect(() => {
    const version = runtime.mit.version;
    const last = (workspace.historialEstadosTerritorial ?? []).at(-1);
    if (runtime.mit.totalEvidencias > 0 && last?.version !== version) {
      const resumen = buildEstadoResumen(runtime.mit);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspace((prev) => ({
        ...prev,
        historialEstadosTerritorial: [
          ...(prev.historialEstadosTerritorial ?? []).slice(-49),
          resumen,
        ],
      }));
    }
  }, [runtime.mit.version]); // eslint-disable-line react-hooks/exhaustive-deps


  // runtime.psl is built inside MunicipalityRuntime as the canonical Nivel 2 → Nivel 3 bridge.

  const profileDirtyRef = useRef(false);
  const onProfileDirtyChange = useCallback((dirty: boolean) => { profileDirtyRef.current = dirty; }, []);
  const handleStoreDocumentOriginal = useCallback(async (documentId: string, file: File): Promise<void> => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser) throw new Error("Inicia sesión para conservar el original en Firebase.");
    if (remoteHydratedMunicipalityId !== municipalityId || pendingIndexedDbHydrationId) {
      throw new Error("Recupera primero el expediente compartido para evitar sobrescribir información.");
    }
    const doc = workspace.repository.documents.find(d => d.id === documentId);
    if (!doc) throw new Error("El documento ya no existe en este expediente.");
    const hash = await sha256Hex(await file.arrayBuffer());
    const previous = workspace.documentOriginals?.find(o => o.documentId === documentId);
    if (previous && previous.sha256 !== hash) {
      throw new Error("Este documento ya tiene un original diferente en Firebase. Incorpóralo como nueva versión documental, sin sustituir silenciosamente sus evidencias.");
    }
    if (doc.contentSha256 && doc.contentSha256 !== hash) {
      throw new Error("El archivo no coincide con la huella registrada para esta fuente. No se puede alterar su contenido sin una nueva versión documental.");
    }
    const other = workspace.repository.documents.find(d => d.id !== documentId && d.status !== "archived" && d.status !== "rejected" && (
      d.contentSha256 === hash || workspace.documentOriginals?.some(o => o.documentId === d.id && o.sha256 === hash)
    ));
    if (other) throw new Error(`Archivo idéntico ya registrado: «${other.title}». Utiliza el documento existente, sin crear un duplicado.`);
    if (previous) {
      await saveOriginalFile(municipalityId, documentId, file);
      return;
    }
    const used = workspaceDocumentBytes(workspace);
    const decision = decideOriginalUpload(file.size, used);
    if (decision !== "fits") {
      throw new Error(decision === "too-large" ? "El original supera el límite de 20 MB por archivo." : "Se supera el límite compartido de 40 MB de originales y perfiles.");
    }
    if (profileSaveInFlightRef.current) throw new Error("Hay otra operación documental guardándose en Firebase.");
    const original = await encodeDocumentOriginal(documentId, file);
    const next = {
      ...workspace,
      documentOriginals: mergeDocumentOriginals(workspace.documentOriginals ?? [], [original]),
      updatedAt: new Date().toISOString(),
    };
    profileSaveInFlightRef.current = true;
    setRemotePersistenceMessage("Guardando el archivo original en Firebase…");
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      setWorkspace(current => current.municipality.identity.id === municipalityId ? (current === workspace ? next : {
        ...current,
        documentOriginals: mergeDocumentOriginals(current.documentOriginals ?? [], [original]),
        updatedAt: next.updatedAt,
      }) : current);
      setRemotePersistenceMessage("Archivo original guardado en Firebase.");
      // IndexedDB es solamente una caché; un fallo local no revierte el guardado remoto.
      await saveOriginalFile(municipalityId, documentId, file).catch(error => {
        console.warn("[original-cache-error]", error);
      });
    } catch (error) {
      setRemotePersistenceMessage("El original no se ha guardado en Firebase.");
      throw error;
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  /** Los derivados son copias vinculadas: nunca se hacen pasar por el original. */
  const handleStoreDocumentDerivative = useCallback(async (
    documentId: string,
    file: File,
    provenance: StoredDocumentDerivative["provenance"],
  ): Promise<void> => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser || remoteHydratedMunicipalityId !== municipalityId || pendingIndexedDbHydrationId) {
      throw new Error("Inicia sesión y recupera el expediente compartido antes de añadir la copia.");
    }
    if (profileSaveInFlightRef.current) throw new Error("Ya hay otra operación documental en curso.");
    if (!workspace.repository.documents.some(d => d.id === documentId)) throw new Error("La ficha documental no existe en este municipio.");
    if (!isDocumentFileName(file.name)) throw new Error("Solo se admiten derivados PDF o DOCX.");
    if (provenance !== "transcription-reconstruction" && provenance !== "format-conversion") throw new Error("Indica la procedencia de la copia.");
    const original = await encodeDocumentOriginal(documentId, file);
    const existing = (workspace.documentDerivedFiles ?? []).filter(d => d.derivedFromDocumentId === documentId);
    if (existing.some(d => d.sha256 === original.sha256)) return;
    const extension = file.name.toLowerCase().endsWith(".pdf") ? ".pdf" : ".docx";
    if (existing.some(d => d.name.toLowerCase().endsWith(extension))) {
      throw new Error("Ya existe un derivado de este formato. Conserva la copia anterior: cualquier sustitución necesita una revisión documental.");
    }
    const used = workspaceDocumentBytes(workspace);
    const decision = decideOriginalUpload(file.size, used);
    if (decision !== "fits") throw new Error(decision === "too-large" ? "El fichero supera 20 MB." : "El expediente superaría el límite conjunto de 40 MB.");
    const derivative: StoredDocumentDerivative = {
      ...original,
      id: crypto.randomUUID(),
      derivedFromDocumentId: documentId,
      provenance,
      createdAt: new Date().toISOString(),
    };
    const next = {
      ...workspace,
      documentDerivedFiles: mergeDocumentDerivatives(workspace.documentDerivedFiles ?? [], [derivative]),
      updatedAt: new Date().toISOString(),
    };
    profileSaveInFlightRef.current = true;
    setRemotePersistenceMessage("Guardando copia derivada en Firebase…");
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      setWorkspace(current => current.municipality.identity.id === municipalityId ? (current === workspace ? next : {
        ...current,
        documentDerivedFiles: mergeDocumentDerivatives(current.documentDerivedFiles ?? [], [derivative]),
        updatedAt: next.updatedAt,
      }) : current);
      setRemotePersistenceMessage("Copia derivada guardada en el expediente compartido.");
    } catch (error) {
      setRemotePersistenceMessage("No se ha confirmado el guardado de la copia derivada.");
      throw error;
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  const handleCreateDocumentRevision = useCallback(async (documentId: string, file: File) => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser || remoteHydratedMunicipalityId !== municipalityId || pendingIndexedDbHydrationId) {
      throw new Error("Inicia sesión y recupera el expediente de Firebase antes de añadir una revisión.");
    }
    if (profileSaveInFlightRef.current) throw new Error("Otra operación documental está en curso.");
    const newId = crypto.randomUUID();
    const original = await encodeDocumentOriginal(newId, file);
    if (profileSaveInFlightRef.current) throw new Error("Otra operación documental está en curso.");
    const next = createDocumentRevision(workspace, documentId, original);
    profileSaveInFlightRef.current = true;
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      const revision = next.repository.documents.at(-1)!;
      setWorkspace(current => current.municipality.identity.id !== municipalityId ? current :
        current === workspace ? next : {
          ...current,
          repository: { ...current.repository, documents: [...current.repository.documents, revision], updatedAt: next.updatedAt },
          documentOriginals: mergeDocumentOriginals(current.documentOriginals ?? [], [original]),
          updatedAt: next.updatedAt,
        });
      setRemotePersistenceMessage("Nueva versión documental guardada. Sus evidencias están pendientes de revisión.");
      await saveOriginalFile(municipalityId, newId, file).catch(error => console.warn("[revision-cache]", error));
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  const handleArchiveDocument = useCallback(async (documentId: string) => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser || remoteHydratedMunicipalityId !== municipalityId || pendingIndexedDbHydrationId) {
      throw new Error("Inicia sesión y recupera el expediente de Firebase antes de archivar.");
    }
    if (profileSaveInFlightRef.current) throw new Error("Otra operación documental está en curso.");
    const exists = workspace.repository.documents.some(d => d.id === documentId);
    if (!exists) throw new Error("El documento ya no existe.");
    if (workspace.healthReport?.linkedDocumentId === documentId || Object.values(activeStudyDocuments(workspace)).includes(documentId)) {
      throw new Error("Incorpora primero la fuente que sustituirá al Informe o estudio activo.");
    }
    const now = new Date().toISOString();
    const archive = (current: MunicipalityWorkspace): MunicipalityWorkspace => ({
      ...current,
      repository: { ...current.repository, documents: current.repository.documents.map(d =>
        d.id === documentId ? { ...d, status: "archived" as const, updatedAt: now } : d
      ), updatedAt: now },
      evidenceStore: current.evidenceStore.atoms.some(atom => evidenceHasDocument(atom, documentId))
        ? { ...current.evidenceStore, updatedAt: now }
        : current.evidenceStore,
      updatedAt: now,
    });
    const next = archive(workspace);
    profileSaveInFlightRef.current = true;
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      setWorkspace(current => current.municipality.identity.id === municipalityId
        ? (current === workspace ? next : archive(current)) : current);
      setRemotePersistenceMessage("Documento archivado en Firebase. Se conservan el original y sus evidencias históricas.");
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  const handleSaveExternalProfiles = useCallback(async (library: ExternalProfileLibrary, onProgress?: (message: string) => void) => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser) throw new Error("Inicia sesión para guardar el perfil y sus archivos en Firebase.");
    if (pendingIndexedDbHydrationId || remoteHydratedMunicipalityId !== municipalityId) throw new Error("Espera a que termine la recuperación del expediente compartido.");
    const nextLibrary = { ...library, profiles: library.profiles.map(p => workspace.externalProfileLibrary?.profiles.some(old => old.id === p.id)
      ? p : { ...p, evidenceVersion: workspace.evidenceStore.updatedAt }) };
    if (!isExternalProfileLibrary(nextLibrary, municipalityId)) throw new Error("La versión del perfil no supera la comprobación de integridad.");
    const nextBytes = workspaceDocumentBytes({ ...workspace, externalProfileLibrary: nextLibrary });
    if (nextBytes > MAX_WORKSPACE_ORIGINALS_BYTES && nextBytes > workspaceDocumentBytes(workspace)) {
      throw new Error("Los originales y derivados superan el límite compartido de 40 MB.");
    }
    const now = new Date().toISOString();
    const next = { ...workspace, externalProfileLibrary: nextLibrary, updatedAt: now };
    setRemotePersistenceMessage("Guardando el perfil completo y sus archivos en Firebase…");
    if (profileSaveInFlightRef.current) throw new Error("Ya hay un perfil guardándose en Firebase.");
    profileSaveInFlightRef.current = true;
    try {
      await saveReviewedWorkspace(next, progress => {
        const message = profileSaveProgressMessage(progress);
        setRemotePersistenceMessage(message);
        onProgress?.(message);
      }, workspace);
    } catch (error) {
      const message = profileSaveErrorMessage(error);
      setRemotePersistenceMessage(message);
      throw new Error(message);
    } finally { profileSaveInFlightRef.current = false; }
    setWorkspace(prev => {
      if (prev.municipality.identity.id !== municipalityId) return prev;
      return prev === workspace ? next : { ...prev, externalProfileLibrary: nextLibrary, updatedAt: now };
    });
    setRemotePersistenceMessage("Perfil completo guardado y confirmado por Firebase.");
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  /** Guarda las descargas de estadística territorial (CONTRACT-TERRITORIAL-STATISTICS). */
  const handleSaveTerritorialStatistics = useCallback(async (snapshots: TerritorialStatisticsSnapshot[], onProgress?: (message: string) => void) => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser) throw new Error("Inicia sesión para guardar la descarga en el expediente compartido.");
    if (pendingIndexedDbHydrationId || remoteHydratedMunicipalityId !== municipalityId) throw new Error("Espera a que termine la recuperación del expediente compartido.");
    if (!snapshots.every(s => isTerritorialStatisticsSnapshot(s, municipalityId))) throw new Error("La descarga no supera la comprobación de integridad.");
    if (profileSaveInFlightRef.current) throw new Error("Ya hay un guardado del perfil en curso.");
    const now = new Date().toISOString();
    const next = { ...workspace, territorialStatistics: snapshots, updatedAt: now };
    profileSaveInFlightRef.current = true;
    try {
      await saveReviewedWorkspace(next, progress => {
        const message = profileSaveProgressMessage(progress);
        setRemotePersistenceMessage(message);
        onProgress?.(message);
      }, workspace);
    } catch (error) {
      const message = profileSaveErrorMessage(error);
      setRemotePersistenceMessage(message);
      throw new Error(message, { cause: error });
    } finally { profileSaveInFlightRef.current = false; }
    setWorkspace(prev => {
      if (prev.municipality.identity.id !== municipalityId) return prev;
      return prev === workspace ? next : { ...prev, territorialStatistics: snapshots, updatedAt: now };
    });
    setRemotePersistenceMessage("Estadística territorial guardada y confirmada por Firebase.");
  }, [workspace, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId, pendingIndexedDbHydrationId, setWorkspace]);

  const handleSaveDeliberativePrioritySelection = useCallback((input: {
    selectedScenarioIds: string[];
    catalogModuleLinks: Array<{ scenarioId: string; moduleId: string }>;
    deliberationRationale: string;
    citizenInfluenceStatement: string;
    decidedBy: string;
  }): readonly string[] => {
    if (runtime.lectura == null) {
      return ["G-DPS-1: la Lectura Estratégica no está disponible"];
    }
    const result = createDeliberativePrioritySelection({
      lectura: runtime.lectura,
      citizenPrioritisation: workspace.thematicPrioritisation,
      ...input,
    });
    if (!result.ok) return result.violations;

    setWorkspace((prev) => ({
      ...prev,
      deliberativePrioritySelection: result.selection,
      updatedAt: new Date().toISOString(),
    }));
    return [];
  }, [runtime.lectura, setWorkspace, workspace.thematicPrioritisation]);

  /**
   * A historical Plan may be retired only when Firebase confirms an updated
   * workspace manifest. Never remove the last validated version or RELAS audit.
   */
  const handleDeleteValidatedPlanVersion = useCallback(async (target: PlanDocument): Promise<boolean> => {
    const municipalityId = workspace.municipality.identity.id;
    if (!remoteClient.auth.currentUser || !documentWriteAllowed ||
        remoteHydratedMunicipalityId !== municipalityId ||
        pendingIndexedDbHydrationId === municipalityId) {
      throw new Error("Inicia sesión con permisos de edición y recupera el expediente compartido antes de eliminar versiones.");
    }
    if (profileSaveInFlightRef.current) {
      throw new Error("Hay otra escritura en curso. La versión permanece conservada.");
    }
    const validatedActionPlans = removeSupersededValidatedPlan(
      workspace.validatedActionPlans ?? [], municipalityId, target
    );
    const next: MunicipalityWorkspace = {
      ...workspace, validatedActionPlans, updatedAt: new Date().toISOString()
    };
    profileSaveInFlightRef.current = true;
    setRemotePersistenceMessage("Eliminando versión antigua del Plan en Firebase…");
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      lastExplicitProfileWorkspaceRef.current = next;
      setWorkspace(prev => prev.municipality.identity.id === municipalityId ? next : prev);
      setRemotePersistenceMessage("Versión del Plan eliminada y confirmada en Firebase.");
      return true;
    } catch(error) {
      setRemotePersistenceMessage("No se ha confirmado la eliminación de la versión del Plan en Firebase.");
      throw error;
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }, [workspace, documentWriteAllowed, remoteClient, saveReviewedWorkspace, remoteHydratedMunicipalityId,
      pendingIndexedDbHydrationId, setWorkspace]);

  const handlePlanPreparationChange = useCallback((draft: PlanPreparationDraft) => {
    setWorkspace(prev => {
      if (draft.municipalityId !== prev.municipality.identity.id) return prev;
      const prior = (prev.planPreparationDrafts ?? []).find(item =>
        item.moduleId === draft.moduleId && item.municipalityId === draft.municipalityId);
      const archivedOriginal = draft.migration?.draft;
      // Archive the exact predecessor once, before replacing it in the
      // shared workspace. Never trust an unrelated or stale migration blob.
      if (prior && prior.version !== draft.version &&
        (!archivedOriginal || archivedOriginal.municipalityId !== prior.municipalityId ||
          archivedOriginal.moduleId !== prior.moduleId ||
          archivedOriginal.version !== prior.version ||
          draft.migration?.replacementVersion !== draft.version ||
          JSON.stringify(archivedOriginal) !== JSON.stringify(prior))) {
        window.alert("La versión anterior no coincide con el original archivado. Recarga el expediente antes de transformar el Plan de Acción.");
        return prev;
      }
      const archive = prior && prior.version !== draft.version && archivedOriginal
        ? [{replacedAt: draft.migration!.replacedAt, replacementVersion: draft.version,
            draft: JSON.parse(JSON.stringify(prior)) as PlanPreparationDraft}]
        : [];
      return {
        ...prev,
        planPreparationDraftHistory: [...(prev.planPreparationDraftHistory ?? []), ...archive],
        planPreparationDrafts: [...(prev.planPreparationDrafts ?? []).filter(item =>
          item.moduleId !== draft.moduleId || item.municipalityId !== draft.municipalityId
        ), draft],
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleIndicatorWorksheetChange = useCallback((sheet: IndicatorWorksheet) => {
    setWorkspace((prev) => {
      if (sheet.context.municipalityId !== prev.municipality.identity.id) return prev;
      return { ...prev,
        indicatorWorksheets: [...(prev.indicatorWorksheets ?? []).filter((saved) => worksheetKey(saved.context) !== worksheetKey(sheet.context)), sheet],
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleActuationTemplatesChange = useCallback((next: import("./domain/agenda/ActuationTemplate").ActuationTemplate[]) => {
    setWorkspace((prev) => ({ ...prev, actuationTemplates: next, updatedAt: new Date().toISOString() }));
  }, [setWorkspace]);

  const handleAgendaChange = useCallback((next: AgendaActuation[]) => {
    setWorkspace((prev) => ({ ...prev, agendaActuations: next, updatedAt: new Date().toISOString() }));
  }, [setWorkspace]);

  const handleSaveActionPlanModuleReview = useCallback((review: MunicipalActionPlanModuleReview): readonly string[] => {
    if (runtime.lectura == null || workspace.deliberativePrioritySelection == null) {
      return ["G-PCM-0: la Lectura Estratégica y la selección deliberativa deben estar vigentes"];
    }
    const eligible = runtime.eligibleActionPlanModules.find(({ module }) => module.id === review.moduleId);
    if (eligible == null) {
      return ["G-PCM-0: el módulo no corresponde a una prioridad seleccionada por el Grupo Motor"];
    }
    if (
      review.municipalityId !== workspace.municipality.identity.id ||
      isModuleReviewStale(review, eligible, runtime.lectura, workspace.deliberativePrioritySelection)
    ) {
      return ["G-PCM-0: la revisión no corresponde al municipio, módulo o selección vigente"];
    }
    const violations = validateModuleReview(review, eligible.module);
    if (violations.length > 0) return violations;

    setWorkspace((prev) => ({
      ...prev,
      actionPlanModuleReviews: [
        ...(prev.actionPlanModuleReviews ?? []).filter((saved) => saved.moduleId !== review.moduleId),
        review,
      ],
      updatedAt: new Date().toISOString(),
    }));
    return [];
  }, [runtime.eligibleActionPlanModules, runtime.lectura, setWorkspace, workspace.deliberativePrioritySelection, workspace.municipality.identity.id]);

  // Pipeline en modo fallback cuando la única oportunidad OIT es "Ampliar la base"
  // (ocurre cuando hay activos pero no hay determinantes ni otros tipos de evidencia).
  // En ese caso, los motores generan contenido de plantilla sin valor real para el plan.
  const pipelineIsEmpty =
    runtime.workspace.evidenceStore.atoms.length === 0 ||
    (runtime.oit.opportunities.length === 1 &&
      runtime.oit.opportunities[0].id === "oit-expand-evidence-base");

  const municipality = runtime.workspace.municipality.identity;

  const allMunicipalities = useMemo(
    () => mergeMunicipalityCatalog(DEMO_MUNICIPALITIES, customMunicipalities)
      .filter((municipality) => !readDeletedMunicipalityIds().includes(municipality.id) && !RETIRED_MUNICIPALITY_IDS.includes(municipality.id)),
    [customMunicipalities]
  );

  /**
   * Actualizador de perfiles (CONTRACT-PROFILE-UPDATER): aplica los cambios elegidos
   * a los expedientes indicados. En modo de vista previa no guarda nada; al aplicar,
   * añade a cada expediente una revisión «en revisión» y la confirma en Firebase.
   */
  const handleProfileUpdates = useCallback(async (ids: string[], kinds: ProfileUpdateKind[], apply: boolean, onProgress: (message: string) => void, textPackage?: ProfileTextPackage, expectedBaselines?: Record<string,string>): Promise<ProfileUpdateOutcome[]> => {
    if (!remoteClient.auth.currentUser) throw new Error("Inicia sesión para leer y guardar los expedientes compartidos.");
    const out: ProfileUpdateOutcome[] = [];
    const currentId = workspace.municipality.identity.id;
    for (const id of ids) {
      const name = allMunicipalities.find(m => m.id === id)?.name ?? id;
      try {
        onProgress(`${name}: leyendo el expediente compartido…`);
        const reviewed = id === currentId ? undefined : await readRemoteWorkspaceVersion(remoteClient, id);
        const ws = id === currentId ? workspace : reviewed?.workspace;
        if (!ws) { out.push({ id, name, changes: [], blocked: "No hay expediente compartido en Firebase." }); continue; }
        const library = ws.externalProfileLibrary ?? { profiles: [], attachments: [] };
        const r = buildProfileUpdate({ library, snapshots: ws.territorialStatistics, kinds, textPackage, author: remoteClient.auth.currentUser?.displayName || remoteClient.auth.currentUser?.email || "", now: new Date(), newId: () => crypto.randomUUID() });
        if (!r.profile) { out.push({ id, name, changes: r.changes, blocked: r.blocked }); continue; }
        const baseline = r.base ? profileUpdateBaseline(r.base,ws.territorialStatistics) : undefined;
        if (apply && (!baseline || !canApplyProfilePreview(expectedBaselines?.[id],baseline))) {
          out.push({id,name,changes:[],blocked:"El Perfil cambió desde la vista previa o no existe una comparación previa válida. Vuelve a consultar la vista previa antes de guardar."});
          continue;
        }
        const outcome: ProfileUpdateOutcome = { id, name, changes: r.changes, from: r.base?.title, title: r.profile.title, profile: r.profile, delta: r.base ? compareProfileUpdate(r.base,r.profile) : undefined, baseline };
        if (apply) {
          onProgress(`${name}: guardando la revisión…`);
          const nextLibrary = appendExternalProfile(library, r.profile, [], id);
          const now = new Date().toISOString();
          const next = { ...ws, externalProfileLibrary: nextLibrary, updatedAt: now };
          const progress: RemoteSaveProgressListener = event => onProgress(name + ": " + profileSaveProgressMessage(event));
          if (reviewed) await saveRemoteWorkspace(remoteClient, next, progress, reviewed.revision);
          else await saveReviewedWorkspace(next, progress, ws);
          if (id === currentId) {
            setWorkspace(prev => prev.municipality.identity.id !== id ? prev :
              prev === ws ? next : { ...prev, externalProfileLibrary: nextLibrary, updatedAt: now });
          }
          outcome.saved = true;
        }
        out.push(outcome);
      } catch (error) {
        out.push({ id, name, changes: [], blocked: error instanceof Error ? error.message : String(error) });
      }
    }
    onProgress(apply ? "Actualización terminada." : "Vista previa terminada.");
    return out;
  }, [workspace, remoteClient, allMunicipalities, saveReviewedWorkspace, setWorkspace]);

  catalogIdsRef.current = new Set(allMunicipalities.map((m) => m.id));
  activeIdRef.current = municipality.id;
  const currentSourcesPlan = useMemo(() => planCurrentSourcesConsolidation(workspace), [workspace]);
  const compasDocumentLibrary = useMemo(
    () =>
      collectCompasDocumentLibrary(
        loadPersistedWorkspacesForLibrary(workspace),
        workspace.municipality.identity.id
      ),
    [workspace]
  );

  useEffect(() => {
    setDocumentLibraryMessage(null);
  }, [workspace.municipality.identity.id]);

  function handleProcessDocument() {
    const isLocaliza = kind === "localiza-salud";
    const oldLocaliza = workspace.repository.documents.filter(d => d.kind === "localiza-salud" && d.status !== "archived" && d.status !== "rejected");
    // Una sola versión vigente de Localiza Salud: la nueva carga sustituye a la anterior (currentSources).
    if (isLocaliza && oldLocaliza.length) {
      if (!window.confirm(
        "Ya hay un listado de Localiza Salud en este expediente.\n" +
        "El nuevo lo sustituirá: el anterior se eliminará del expediente y de Firebase, con sus fichas y su validación.\n" +
        "Los listados declarados de ciclo histórico se conservan.\n¿Continuar?"
      )) return;
    } else if (kind === "community-asset" && workspace.repository.documents.some(d=>d.kind==="community-asset" && d.status!=="archived")) {
      if (!window.confirm("Ya hay una fuente de activos comunitarios. La nueva se añadirá sin eliminar la anterior; revisa después los posibles registros repetidos. ¿Continuar?")) return;
    }
    const now = new Date().toISOString();
    const baseRepository = workspace.repository;
    const baseEvidence = workspace.evidenceStore;
    const result = ingestManualDocument({
      repository: baseRepository,
      evidenceStore: baseEvidence,
      kind,
      title,
      plainText,
      structure: declaresOpenAnswers ? "open-answers" : undefined,
    });
    if (result === null) return;
    // El acto explícito de cargar bajo «Localiza Salud» por el responsable
    // acredita la selección de las fichas incorporadas. No exigir otra validación.
    const nextRepository = isLocaliza
      ? addAssetValidation(result.repository, {
          id: crypto.randomUUID(),
          documentId: result.document.id,
          atomIds: result.evidenceStore.atoms
            .filter(a => evidenceHasDocument(a, result.document.id) && a.kind === "asset")
            .map(a => a.id),
          criteria: { title: "Selección expresa del inventario Activos Localiza Salud", version: "1" },
          declaredBy: remoteClient.auth.currentUser?.email || "Responsable del expediente",
          note: "Registro incorporado expresamente como listado de activos validados.",
        })
      : result.repository;
    setWorkspace(prev => {
      if (prev.municipality.identity.id !== workspace.municipality.identity.id) return prev;
      const next = { ...prev, repository: nextRepository, evidenceStore: result.evidenceStore, updatedAt: now };
      return isLocaliza ? retireCurrentPredecessors(next, { kind: "localiza-salud" }, result.document.id, now) : next;
    });
    setLastProcessedDocument(result.document);
    setLastAtomCount(result.atomsCreated);
    setTitle("");
    setPlainText("");
    setDeclaresOpenAnswers(false);
  }

  function handleRegisterDocumentReference() {
    const cleanTitle = title.trim();
    if (cleanTitle === "" || kind === "community-asset" || kind === "localiza-salud") return;
    const documentId = crypto.randomUUID();
    setWorkspace((prev) => ({
      ...prev,
      repository: addMunicipalDocument(prev.repository, {
        id: documentId,
        kind,
        title: cleanTitle,
        source: {
          system: "Registro manual — referencia sin texto",
          collectedAt: new Date().toISOString(),
        },
        canGenerateEvidence: false,
        contentMode: "reference-only",
        tags: [kind],
      }),
      updatedAt: new Date().toISOString(),
    }));
    setTitle("");
  }

  function handleSetDocumentCycle(documentId: string, cycle: DocumentCycle | undefined) {
    setWorkspace((prev) => ({
      ...prev,
      repository: setMunicipalDocumentCycle(prev.repository, documentId, cycle),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleAddConciliation(conciliation: Omit<CycleConciliation, "declaredAt">) {
    setWorkspace((prev) => ({
      ...prev,
      repository: addCycleConciliation(prev.repository, conciliation),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleRemoveConciliation(conciliationId: string) {
    setWorkspace((prev) => ({
      ...prev,
      repository: removeCycleConciliation(prev.repository, conciliationId),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleAddAssetValidation(validation: Omit<AssetValidationDeclaration, "declaredAt">) {
    setWorkspace((prev) => ({
      ...prev,
      repository: addAssetValidation(prev.repository, validation),
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleRemoveAssetValidation(validationId: string) {
    const record = workspace.repository.assetValidations?.find(v => v.id === validationId);
    if (!record) return;
    const municipalityId = workspace.municipality.identity.id;
    if (!documentWriteAllowed || !remoteClient.auth.currentUser ||
      remoteHydratedMunicipalityId !== municipalityId ||
      pendingIndexedDbHydrationId || profileSaveInFlightRef.current) {
      setRemotePersistenceMessage("No se puede retirar la validación: inicia sesión con permiso de edición y recupera el expediente de Firebase.");
      return;
    }
    if (!window.confirm(
      "Vas a retirar una declaración de validación de activos.\n" +
      "Documento: " + (workspace.repository.documents.find(d => d.id === record.documentId)?.title ?? record.documentId) + "\n" +
      "Criterio: " + record.criteria.title + " · " + record.criteria.version + "\n" +
      "Se conservarán las fichas y sus evidencias; cambiará la constancia formal de validación.\n" +
      "Aceptar: retirar la declaración · Cancelar: mantenerla."
    )) return;
    const next: MunicipalityWorkspace = {
      ...workspace,
      repository: removeAssetValidation(workspace.repository, validationId),
      updatedAt: new Date().toISOString(),
    };
    profileSaveInFlightRef.current = true;
    setRemotePersistenceMessage("Retirando declaración de validación en Firebase…");
    try {
      await saveReviewedWorkspace(next, undefined, workspace);
      setWorkspace(prev => prev.municipality.identity.id === municipalityId ? next : prev);
      let verified = false;
      try {
        const recovered = await readRemoteWorkspace(remoteClient, municipalityId);
        verified = Boolean(recovered && !(recovered.repository.assetValidations ?? []).some(v => v.id === validationId));
      } catch (verificationError) {
        console.warn("[asset-validation-remote-verification]", verificationError);
      }
      setRemotePersistenceMessage(verified
        ? "Declaración retirada y ausencia comprobada mediante lectura de Firebase."
        : "La retirada se escribió en Firebase, pero no se pudo comprobar mediante una nueva lectura. Recupera el expediente antes de seguir.");
    } catch (error) {
      setRemotePersistenceMessage("No se ha retirado la declaración de Firebase: " + (error as Error).message);
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }

  async function handleLoadHealthReport(file: File, options: LoaderOptions = {}): Promise<boolean> {
    // .doc binario (Word 97-2003) no soportado por mammoth.
    const isLegacyDoc = /\.doc$/i.test(file.name) && !/\.docx$/i.test(file.name);
    if (isLegacyDoc) {
      setLastHealthReportMessage(
        "El formato .doc (binario) no puede procesarse. Convierte el fichero a .docx y vuelve a cargarlo."
      );
      return false;
    }

    const isPdf = /\.pdf$/i.test(file.name);
    if (!isPdf && !/\.docx$/i.test(file.name)) { setLastHealthReportMessage("Sube un fichero PDF o DOCX."); return false; }

    setIsLoadingHealthReport(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const contentSha256 = options.contentSha256 ?? await sha256Hex(arrayBuffer);
      const existingCopy = findExistingCopy(workspace.repository, { sha256: contentSha256, name: file.name }, knownOriginalHashes);
      const pending = options.activateHealthReportRevisionId
        ? workspace.repository.documents.find(document => document.id === options.activateHealthReportRevisionId
          && document.kind === "health-report" && document.status !== "archived" && document.status !== "rejected"
          && document.tags.includes(PENDING_DOCUMENT_REVIEW) && document.contentSha256 === contentSha256)
        : undefined;
      if (options.activateHealthReportRevisionId && !pending) throw new Error("La revisión pendiente no coincide con este archivo.");
      if (!pending && existingCopy?.reason === "same-file") {
        setLastHealthReportMessage(`Este archivo ya está en el expediente como «${existingCopy.document.title}». Es el mismo archivo y no se incorpora de nuevo.`);
        return false;
      }
      const documentId = pending?.id ?? crypto.randomUUID();
      if (!pending) await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      // Normalizar título: quitar extensión y convertir guiones/subrayados a espacios
      const rawName = file.name
        .replace(/\.(docx?|pdf)$/i, "")
        .replace(/[-_]/g, " ");
      const docTitle = pending?.title ?? (rawName.charAt(0).toUpperCase() + rawName.slice(1));
      const municipalityId = workspace.municipality.identity.id;

      const newDocInput = {
        id: documentId,
        kind: "health-report" as const,
        title: docTitle,
        source: {
          system: "Carga directa de fuente documental primaria",
          collectedAt: new Date().toISOString(),
        },
        sourceFileName: file.name,
        tags: ["health-report", "primary-source"],
        ...(options.temporal !== undefined ? { temporal: options.temporal } : {}),
        contentSha256,
      };

      const healthReport = isPdf
        ? await processPdfHealthReport(createHealthReportDocumentFromPdf({
            arrayBuffer,
            municipalityId,
            linkedDocumentId: documentId,
            sourceFileName: file.name,
            title: docTitle,
            authors: [],
          }), arrayBuffer)
        : await createHealthReportDocumentFromDocx({
            arrayBuffer,
            municipalityId,
            linkedDocumentId: documentId,
            sourceFileName: file.name,
            title: docTitle,
            authors: [],
          });

      const now = new Date().toISOString();
      if (pending) {
        if (profileSaveInFlightRef.current) throw new Error("Hay otra operación documental en curso.");
        const next = registerHealthReport(workspace, healthReport, newDocInput, now);
        profileSaveInFlightRef.current = true;
        try {
          await saveReviewedWorkspace(next, undefined, workspace);
          setWorkspace(prev => prev.municipality.identity.id !== municipalityId ? prev :
            prev === workspace ? next : registerHealthReport(prev, healthReport, newDocInput, now));
          setRemotePersistenceMessage("Revisión del Informe guardada en Firebase. Se ha conservado el Informe anterior.");
        } finally {
          profileSaveInFlightRef.current = false;
        }
      } else {
        setWorkspace(prev => prev.municipality.identity.id !== municipalityId ? prev :
          registerHealthReport(prev, healthReport, newDocInput, now));
      }
      setLastHealthReportMessage(
        (healthReport.body.charCount > 0 ? `Informe procesado: ${healthReport.body.charCount.toLocaleString("es-ES")} caracteres disponibles para la lectura del Perfil. ` : "Sin texto extraíble; requiere transcripción u OCR. ") +
        storageSummary()
      );
      return true;
    } catch (err) {
      if (options.activateHealthReportRevisionId) throw err;
      console.error("[health-report-load-error]", err);
      setLastHealthReportMessage(
        isPdf
          ? "Error al procesar el PDF. Verifica que sea un PDF válido y no esté protegido."
          : "Error al cargar el informe. Si el documento procede de LibreOffice/OpenDocument, verifica que se haya exportado correctamente a .docx. Los ficheros muy grandes o con muchas imágenes pueden requerir más tiempo."
      );
      return false;
    } finally {
      setIsLoadingHealthReport(false);
    }
  }

  const handleProcessExistingHealthReport = useCallback(async (): Promise<void> => {
    const report = workspace.healthReport;
    if (!report || !/\.pdf$/i.test(report.sourceFileName)) return;
    const targetMunicipalityId = workspace.municipality.identity.id;
    setIsLoadingHealthReport(true); setLastHealthReportMessage("Extrayendo texto del informe incorporado…");
    try {
      let file: Blob | undefined = await loadOriginalFile(targetMunicipalityId, report.linkedDocumentId);
      if (!file) {
        const source = workspace.repository.documents.find(d => d.id === report.linkedDocumentId)?.source.url;
        if (source && Object.hasOwn(bundledDocuments, source)) {
          const response = await fetch(bundledDocuments[source]);
          if (!response.ok) throw new Error("No se pudo abrir el PDF incorporado.");
          file = await response.blob();
        }
      }
      if (!file) throw new Error("El original no está disponible en este navegador. Carga el archivo desde esta sección.");
      const processed = await processPdfHealthReport(report, await file.arrayBuffer());
      setWorkspace(prev => prev.municipality.identity.id !== targetMunicipalityId || prev.healthReport?.id !== report.id ? prev : ({
        ...prev, healthReport:processed,
        repository:{...prev.repository, documents:prev.repository.documents.map(d => d.id === report.linkedDocumentId ? {...d,sourceText:processed.body.originalText,updatedAt:processed.updatedAt} : d),updatedAt:processed.updatedAt},
        evidenceStore:{...prev.evidenceStore,updatedAt:processed.updatedAt},updatedAt:processed.updatedAt,
      }));
      setLastHealthReportMessage(processed.body.charCount > 0
        ? `Informe procesado: ${processed.pdfExtraction!.pageCount} páginas y ${processed.body.charCount.toLocaleString('es-ES')} caracteres. La lectura del borrador dispone del texto; los perfiles validados requieren revisión.`
        : "PDF conservado, sin texto extraíble. Necesita transcripción u OCR antes de alimentar la lectura del Perfil.");
    } catch(error) {setLastHealthReportMessage((error as Error).message);} finally {setIsLoadingHealthReport(false);}
  }, [setWorkspace, workspace.healthReport, workspace.municipality.identity.id, workspace.repository.documents]);

  // A bundled health-report PDF registered without text is processed once
  // when encountered; never replace later reports or validated snapshots.
  useEffect(() => {
    const report = workspace.healthReport;
    if (!report || report.body.charCount || report.pdfExtraction || isLoadingHealthReport) return;
    const source = workspace.repository.documents.find(d => d.id === report.linkedDocumentId)?.source.url;
    if (!source || !Object.hasOwn(bundledDocuments, source) || !/\.pdf$/i.test(report.sourceFileName)) return;
    const key = workspace.municipality.identity.id + ':' + report.id;
    if (reportProcessingAttempts.current.has(key)) return;
    reportProcessingAttempts.current.add(key);
    void handleProcessExistingHealthReport();
  }, [workspace.healthReport, workspace.municipality.identity.id, workspace.repository.documents, isLoadingHealthReport, handleProcessExistingHealthReport]);

  // ── Carga de archivo para tipos documentales con extracción de texto ─────────
  // Aplica a: strategic-framework, territorial-documentation, qualitative-material.
  // DOCX → extrae texto vía mammoth → genera EvidenceAtoms del tipo correspondiente.
  // PDF → extrae texto; si no lo hay, conserva la referencia e informa de la limitación.
  // D-HR-01 no aplica aquí: estos tipos SÍ pueden generar EvidenceAtoms.
  async function handleUseHealthReportRevision(documentId: string): Promise<void> {
    if (!documentWriteAllowed) throw new Error("Necesitas permiso de edición sobre este expediente.");
    const original = workspace.documentOriginals?.find(file => file.documentId === documentId);
    if (!original) throw new Error("No se ha recuperado el original de la revisión.");
    const file = await decodeDocumentOriginal(original);
    if (!await handleLoadHealthReport(file, { activateHealthReportRevisionId: documentId })) {
      throw new Error("No se ha podido procesar la revisión del Informe.");
    }
  }

  async function handleLoadDocumentFile(file: File, options: LoaderOptions = {}): Promise<boolean> {
    // La bandeja de revisión fija el tipo de forma explícita: no depende del
    // selector del bloque «Añadir o sustituir fuentes» ni de su estado previo.
    const effectiveKind = options.kind ?? kind;
    const structureDeclared = options.declaresOpenAnswers ?? declaresOpenAnswers;
    const isLegacyDoc = /\.doc$/i.test(file.name) && !/\.docx$/i.test(file.name);
    if (isLegacyDoc) {
      setDocumentFileMessage(
        "El formato .doc (binario) no puede procesarse. Convierte el fichero a .docx y vuelve a cargarlo."
      );
      return false;
    }

    const isDocx = /\.docx$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    if (!isDocx && !isPdf) {
      setDocumentFileMessage(
        "Formato no admitido. Sube un fichero .docx o .pdf."
      );
      return false;
    }

    const rawName = file.name
      .replace(/\.(docx?|pdf)$/i, "")
      .replace(/[-_]/g, " ");
    const docTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    setIsLoadingDocumentFile(true);
    setDocumentFileMessage(null);
    const targetMunicipalityId = workspace.municipality.identity.id;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const contentSha256 = options.contentSha256 ?? await sha256Hex(arrayBuffer);
      const existingCopy = findExistingCopy(workspace.repository, { sha256: contentSha256, name: file.name }, knownOriginalHashes);
      if (existingCopy?.reason === "same-file") {
        setDocumentFileMessage(`Este archivo ya está en el expediente como «${existingCopy.document.title}». Es el mismo archivo y no se incorpora de nuevo.`);
        return false;
      }
      const extractedText = isDocx ? await extractDocxText(arrayBuffer) : (await extractPdfText(arrayBuffer)).text;
      if (isDocx || extractedText.trim()) {
        const plainText = extractedText;

        if (plainText.trim().length === 0) {
          setDocumentFileMessage(
            "El fichero DOCX no contiene texto extraíble. Pega el contenido manualmente en el área de texto."
          );
          return false;
        }

        const documentId = crypto.randomUUID();
        await saveOriginalFile(workspace.municipality.identity.id, documentId, file);

        // La ingesta se calcula DENTRO del actualizador funcional, sobre prev:
        // tras los await, el workspace capturado por cierre puede estar obsoleto
        // y fusionarlo pisaría cambios intermedios de repositorio/evidencia.
        setWorkspace((prev) => {
          if (prev.municipality.identity.id !== targetMunicipalityId) return prev;
          // Un marco estratégico recargado sustituye a su versión anterior
          // (mismo fichero o mismo título): nunca se duplica.
          const replaced =
            effectiveKind === "strategic-framework"
              ? removeEquivalentStrategicFramework(prev.repository, {
                  title: docTitle,
                  sourceFileName: file.name,
                })
              : { repository: prev.repository, removedDocumentIds: [] };
          const baseStore =
            replaced.removedDocumentIds.length > 0
              ? {
                  ...prev.evidenceStore,
                  atoms: prev.evidenceStore.atoms.filter(
                    (a) =>
                      a.provenance.documentId === undefined ||
                      !replaced.removedDocumentIds.includes(a.provenance.documentId)
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : prev.evidenceStore;

          const result = ingestManualDocument({
            repository: replaced.repository,
            evidenceStore: baseStore,
            kind: effectiveKind,
            title: docTitle,
            plainText,
            sourceFileName: file.name,
            sourceSystem: isDocx ? "Archivo DOCX cargado" : "Texto extraído de PDF, con marcas de página",
            documentId,
            structure: structureDeclared ? "open-answers" : undefined,
            temporal: options.temporal,
            contentSha256,
          });

          if (result === null) return prev;

          queueMicrotask(() => {
            setLastProcessedDocument(result.document);
            setLastAtomCount(result.atomsCreated);
            setDocumentFileMessage(
              structureDeclared && result.atomsCreated === 0
                ? `«${docTitle}» se ha registrado desde el archivo, pero no se encontraron respuestas abiertas numeradas (1, 2, 3…) bajo una pregunta. No se ha creado ninguna unidad de evidencia; el texto se conserva íntegro.`
                : `Carga completada: «${docTitle}» se ha registrado desde el archivo. No necesitas rellenar el cuadro de texto. ${result.atomsCreated} unidades de evidencia extraídas.`
            );
          });

          return {
            ...prev,
            repository: result.repository,
            evidenceStore: result.evidenceStore,
            updatedAt: new Date().toISOString(),
          };
        });
      } else {
        // PDF: registrar como referencia sin extracción de texto.
        // El id se genera fuera para que sea estable; el repositorio se
        // deriva de prev dentro del actualizador (mismo motivo que en DOCX).
        const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
        setWorkspace((prev) => {
          if (prev.municipality.identity.id !== targetMunicipalityId) return prev;
          // Un marco estratégico recargado sustituye a su versión anterior
          // (mismo fichero o mismo título): nunca se duplica.
          const replaced =
            effectiveKind === "strategic-framework"
              ? removeEquivalentStrategicFramework(prev.repository, {
                  title: docTitle,
                  sourceFileName: file.name,
                })
              : { repository: prev.repository, removedDocumentIds: [] };

          const nextRepository = addMunicipalDocument(replaced.repository, {
            id: documentId,
            kind: effectiveKind as DocumentKind,
            title: docTitle,
            source: {
              system: "Archivo PDF — referencia documental",
              collectedAt: new Date().toISOString(),
            },
            sourceFileName: file.name,
            canGenerateEvidence: false,
            tags: [effectiveKind],
            ...(options.temporal !== undefined ? { temporal: options.temporal } : {}),
            contentSha256,
          });
          const registeredDoc = nextRepository.documents.find((d) => d.id === documentId);
          if (registeredDoc === undefined) return prev;

          // Si se sustituyó un marco previo cargado con texto, sus evidencias
          // derivadas se purgan junto con el documento.
          const nextStore =
            replaced.removedDocumentIds.length > 0
              ? {
                  ...prev.evidenceStore,
                  atoms: prev.evidenceStore.atoms.filter(
                    (a) =>
                      a.provenance.documentId === undefined ||
                      !replaced.removedDocumentIds.includes(a.provenance.documentId)
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : prev.evidenceStore;

          queueMicrotask(() => {
            setLastProcessedDocument(registeredDoc);
            setLastAtomCount(0);
            setDocumentFileMessage(
              `«${docTitle}» registrado como documento de referencia (PDF sin extracción de texto). ` +
              "Pega un extracto analítico en el área de texto inferior si deseas generar evidencias trazables."
            );
          });

          return {
            ...prev,
            repository: nextRepository,
            evidenceStore: nextStore,
            updatedAt: new Date().toISOString(),
          };
        });
      }
      return true;
    } catch (err) {
      console.error("[document-file-load-error]", err);
      setDocumentFileMessage(
        "Error al procesar el archivo. Verifica que sea un PDF o DOCX válido, no protegido ni dañado."
      );
      return false;
    } finally {
      setIsLoadingDocumentFile(false);
      setDeclaresOpenAnswers(false);
    }
  }

  /**
   * Dónde queda lo incorporado, sin prometer más de lo que ocurre: con sesión,
   * la ficha, el texto y las evidencias viajan en el expediente compartido de
   * Firebase para sesiones autenticadas; IndexedDB mantiene una copia local.
   * Sin autenticación, los archivos no se comparten con otros navegadores.
   */
  function storageSummary(): string {
    return remoteClient.auth.currentUser
      ? `La ficha, el texto, las evidencias, los originales y las copias derivadas se guardan en el expediente compartido de Firebase. Los archivos del Diagnóstico y del Perfil comparten un límite de ${formatMegabytes(MAX_WORKSPACE_ORIGINALS_BYTES)} por expediente; el que no quepa se conserva solo en este navegador y se avisa.`
      : "Sin sesión iniciada: todo se guarda solo en este navegador. Inicia sesión para guardar el expediente en Firebase.";
  }

  function handleRetireDuplicate(documentId: string, keptId: string): void {
    const target = workspace.repository.documents.find((d) => d.id === documentId);
    const kept = workspace.repository.documents.find((d) => d.id === keptId);
    if (!target || !kept) return;
    if (!window.confirm(`Se retirará «${target.title}» como copia de «${kept.title}». Quedará archivado, sin borrarse, y se quitarán sus evidencias derivadas. ¿Continuar?`)) return;
    const targetMunicipalityId = workspace.municipality.identity.id;
    setWorkspace((prev) => {
      if (prev.municipality.identity.id !== targetMunicipalityId) return prev;
      const result = retireDuplicateDocument(prev.repository, prev.evidenceStore, documentId, keptId);
      return result ? { ...prev, repository: result.repository, evidenceStore: result.evidenceStore, updatedAt: new Date().toISOString() } : prev;
    });
  }

  // ── Bandeja de revisión → cargadores CSV de estudios complementarios ──────
  // Clave = id del módulo metodológico (coincide con la etiqueta documental que
  // cada cargador usa para sustituir su estudio anterior). La bandeja solo
  // entrega el archivo; validación, indicadores y sustitución siguen siendo
  // responsabilidad del cargador específico.
  const studyCsvLoaders: Record<string, { load: (file: File) => Promise<boolean>; message: string | null; loading: boolean }> = {
    [IBSE_DOCUMENT_TAG]: { load: (file) => handleLoadIBSECSV(file), message: ibseMessage, loading: isLoadingIBSE },
    [DUKE_DOCUMENT_TAG]: { load: handleLoadDUKECSV, message: dukeMessage, loading: isLoadingDUKE },
    [PREDIMED_DOCUMENT_TAG]: { load: handleLoadPREDIMEDCSV, message: predimedMessage, loading: isLoadingPREDIMED },
    [SF12_DOCUMENT_TAG]: { load: handleLoadSF12CSV, message: sf12Message, loading: isLoadingSF12 },
    [SUENO_DOCUMENT_TAG]: { load: handleLoadSuenoCSV, message: suenoMessage, loading: isLoadingSueno },
    [CAGE_DOCUMENT_TAG]: { load: handleLoadCAGECSV, message: cageMessage, loading: isLoadingCAGE },
    [AUDITC_DOCUMENT_TAG]: { load: handleLoadAUDITCCSV, message: auditcMessage, loading: isLoadingAUDITC },
    [IPAQ_DOCUMENT_TAG]: { load: handleLoadIPAQCSV, message: ipaqMessage, loading: isLoadingIPAQ },
    [GHQ12_DOCUMENT_TAG]: { load: handleLoadGHQ12CSV, message: ghq12Message, loading: isLoadingGHQ12 },
    [PHQ9_DOCUMENT_TAG]: { load: handleLoadPHQ9CSV, message: phq9Message, loading: isLoadingPHQ9 },
    [PSQI_DOCUMENT_TAG]: { load: handleLoadPSQICSV, message: psqiMessage, loading: isLoadingPSQI },
    [FAGERSTROM_DOCUMENT_TAG]: { load: handleLoadFagerstromCSV, message: fagerstromMessage, loading: isLoadingFagerstrom },
    [SBQ_DOCUMENT_TAG]: { load: handleLoadSBQCSV, message: sbqMessage, loading: isLoadingSBQ },
  };

  async function handleInboxStudyCsv(file: File, studyId: string | undefined, temporal: DocumentTemporalMetadata | undefined, contentSha256?: string): Promise<boolean> {
    const loader = studyId !== undefined ? studyCsvLoaders[studyId] : undefined;
    if (studyId === undefined || loader === undefined) return false;
    const targetMunicipalityId = workspace.municipality.identity.id;
    const ok = await loader.load(file);
    if (ok && (temporal !== undefined || contentSha256 !== undefined)) {
      // Los cargadores de estudio no reciben temporalidad: se añade después al
      // documento que acaban de registrar (misma etiqueta y mismo archivo).
      setWorkspace((prev) => {
        if (prev.municipality.identity.id !== targetMunicipalityId) return prev;
        const registered = prev.repository.documents.find(
          (d) => d.tags.includes(studyId) && d.sourceFileName === file.name && d.status !== "archived"
        );
        if (registered === undefined) return prev;
        return {
          ...prev,
          repository: withContentSha256(
            temporal !== undefined ? setMunicipalDocumentTemporalMetadata(prev.repository, registered.id, temporal) : prev.repository,
            registered.id,
            contentSha256
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    }
    return ok;
  }

  function handleAssignLibraryDocument(item: CompasLibraryDocument): void {
    const targetMunicipalityId = workspace.municipality.identity.id;
    const targetDocumentId = libraryDocumentAssignmentId(
      item.sourceMunicipalityId,
      item.document.id
    );
    const result = assignLibraryDocumentToWorkspace({
      workspace,
      sourceMunicipalityId: item.sourceMunicipalityId,
      sourceMunicipalityName: item.sourceMunicipalityName,
      document: item.document,
      atoms: item.atoms,
    });

    if (result.status === "already-assigned") {
      setDocumentLibraryMessage("Ese documento ya está asignado a este expediente.");
      return;
    }

    if (result.status === "same-municipality") {
      setDocumentLibraryMessage("El documento ya pertenece al expediente activo.");
      return;
    }

    if (result.status === "not-assignable") {
      setDocumentLibraryMessage(
        "Este documento se puede consultar desde la biblioteca, pero no se asigna automáticamente como fuente reutilizable."
      );
      return;
    }

    setWorkspace(result.workspace);
    if (result.document) {
      setLastProcessedDocument(result.document);
      setLastAtomCount(result.atomsCreated.length);
    }
    setDocumentLibraryMessage(
      result.atomsCreated.length > 0
        ? `Copia asignada al expediente con ${result.atomsCreated.length} evidencias trazables.`
        : "Copia asignada al expediente como referencia documental trazable."
    );

    void loadOriginalFile(item.sourceMunicipalityId, item.document.id)
      .then((original) => {
        if (original === undefined) return undefined;
        return saveOriginalFile(targetMunicipalityId, targetDocumentId, original);
      })
      .catch((error) => {
        setDocumentLibraryMessage(
          "Copia asignada, pero no se pudo copiar el archivo original conservado en este navegador: " +
            (error as Error).message
        );
      });
  }

  async function handleLoadIBSECSV(file: File, target: IBSEAdjustmentTarget = "none"): Promise<boolean> {
    setIsLoadingIBSE(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings, ageSexObserved, strataCounts, demographicAdjustment } = await prepareIBSEImport(text, workspace.municipality.identity.id, target);
      validateIBSESourceCSV(text, aggregates.nValid);
      const existingStudy = workspace.ibseStudy;
      if (existingStudy && !window.confirm(
        `Se sustituirá el IBSE activo de ${workspace.municipality.identity.name} (${existingStudy.aggregates.nValid} válidos; ${existingStudy.aggregates.meanTotal}/100) por «${file.name}» (${aggregates.nValid} válidos; ${aggregates.meanTotal}/100). El estudio y las evidencias anteriores se guardarán en el historial y su ficha quedará archivada. Confirma solo si el CSV contiene respuestas individuales, no un diccionario.`
      )) {
        setIbseMessage("Importación cancelada. El IBSE anterior permanece intacto.");
        return false;
      }
      const existingBytes = workspaceDocumentBytes(workspace);
      const fits = decideOriginalUpload(file.size, existingBytes);
      if (fits !== "fits") throw new Error(fits === "too-large"
        ? "El CSV supera el límite de 20 MB por archivo."
        : "El expediente supera la capacidad documental de 40 MB. No se ha sustituido el IBSE.");
      const documentId = crypto.randomUUID();
      // Original verificable y compartible, además de copia de seguridad en IndexedDB.
      const original = await encodeDocumentOriginal(documentId, file);
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createIBSEStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        demographicAdjustment,
        strataCounts,
        sampleScope: inferIBSESampleScope(strataCounts),
        ageSexObserved:
          ageSexObserved === undefined
            ? undefined
            : {
                cells: ageSexObserved.cells,
                assignedCount: ageSexObserved.assignedCount,
                unassignableCount: ageSexObserved.unassignableCount,
              },
        methodologicalCautions,
      });
      const ibseAtoms = attachDocumentIdToAtoms(
        ibseStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        if (prev.municipality.identity.id !== study.municipalityId) return prev;
        // Una sola versión vigente: el IBSE anterior del proceso actual se elimina al final (currentSources).
        const repositoryWithoutPrior = prev.repository;
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "redcap-export",
          title: `IBSE - ${file.name}`,
          source: {
            system: "Importación REDCap IBSE",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["redcap-export", IBSE_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              atom.provenance.origin !== "ibse"
          ),
          updatedAt: now,
        };
        for (const atom of ibseAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return retireCurrentPredecessors({
          ...prev,
          repository: nextRepository,
          ibseStudy: study,
          studySourceDocumentIds: { ...prev.studySourceDocumentIds, ibseStudy: documentId },
          documentOriginals: mergeDocumentOriginals(prev.documentOriginals ?? [], [original]),
          evidenceStore: nextStore,
          updatedAt: now,
        }, { kind: "study", key: "ibseStudy" }, documentId, now);
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setIbseMessage(
        aggregates.nValid > 0
          ? `IBSE preparado: ${aggregates.nValid} registros válidos · Media total: ${aggregates.meanTotal} · ${ibseAtoms.length} indicadores. El estudio anterior se ha sustituido; confirma la sincronización del expediente en Firebase.${warn}`
          : `CSV procesado sin registros válidos.${warn}`
      );
      return true;
    } catch (error) {
      setIbseMessage((error as Error).message || "Error al procesar el CSV. Verifica que sea una exportación REDCap con respuestas válidas.");
      return false;
    } finally {
      setIsLoadingIBSE(false);
    }
  }

  async function handleLoadDUKECSV(file: File): Promise<boolean> {
    setIsLoadingDUKE(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseDUKECSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createDUKEStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const dukeAtoms = attachDocumentIdToAtoms(
        dukeStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "dukeStudy", DUKE_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `DUKE-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Apoyo social funcional (DUKE-UNC-11)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", DUKE_DOCUMENT_TAG, "eas"],
        }, dukeAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setDukeMessage(
        aggregates.nValidGlobal > 0
          ? `DUKE-EAS cargado: ${aggregates.nValidGlobal} registros globales validos de ${aggregates.n}. Apoyo bajo global: ${aggregates.lowGlobalPercentage.toFixed(1)} %. ${dukeAtoms.length} evidencias incorporadas.${warn}`
          : `CSV DUKE-EAS procesado sin registros globales completos.${warn}`
      );
      return true;
    } catch {
      setDukeMessage("Error al procesar el CSV. Verifica que incluya las columnas EAS P5701..P5711 con valores 1..5.");
      return false;
    } finally {
      setIsLoadingDUKE(false);
    }
  }

  async function handleLoadPREDIMEDCSV(file: File): Promise<boolean> {
    setIsLoadingPREDIMED(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parsePREDIMEDCSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createPREDIMEDStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const predimedAtoms = attachDocumentIdToAtoms(
        predimedStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "predimedStudy", PREDIMED_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `PREDIMED-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Adherencia dieta mediterránea (PREDIMED-14)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", PREDIMED_DOCUMENT_TAG, "eas"],
        }, predimedAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setPredimedMessage(
        aggregates.nValid > 0
          ? `PREDIMED-EAS cargado: ${aggregates.nValid} registros validos de ${aggregates.n}. Alta adherencia: ${aggregates.highPercentage.toFixed(1)} %. ${predimedAtoms.length} evidencias incorporadas.${warn}`
          : `CSV PREDIMED-EAS procesado sin registros completos.${warn}`
      );
      return true;
    } catch {
      setPredimedMessage("Error al procesar el CSV. Verifica que incluya la columna Predimed o P36BPD01_2023..P36BPD14_2023.");
      return false;
    } finally {
      setIsLoadingPREDIMED(false);
    }
  }

  async function handleLoadSF12CSV(file: File): Promise<boolean> {
    setIsLoadingSF12(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseSF12CSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createSF12Study({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const sf12Atoms = attachDocumentIdToAtoms(
        sf12StudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "sf12Study", SF12_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `SF-12 EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Salud percibida SF-12 (Vilagut et al. 2008)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", SF12_DOCUMENT_TAG, "eas"],
        }, sf12Atoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setSf12Message(
        aggregates.nValidPCS > 0
          ? `SF-12 EAS cargado: ${aggregates.nValidPCS} registros válidos de ${aggregates.n}. PCS media: ${aggregates.meanPCS.toFixed(1)} / MCS media: ${aggregates.meanMCS.toFixed(1)}. ${sf12Atoms.length} evidencias incorporadas.${warn}`
          : `CSV SF-12 EAS procesado sin registros válidos.${warn}`
      );
      return true;
    } catch {
      setSf12Message("Error al procesar el CSV. Verifica que incluya las columnas PCS12_SP y MCS12_SP.");
      return false;
    } finally {
      setIsLoadingSF12(false);
    }
  }

  async function handleLoadSuenoCSV(file: File): Promise<boolean> {
    setIsLoadingSueno(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseSuenoCSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createSuenoStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const suenoAtoms = attachDocumentIdToAtoms(
        suenoStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "suenoStudy", SUENO_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `Sueño EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Sueño (P33_R / P33A)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", SUENO_DOCUMENT_TAG, "eas"],
        }, suenoAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setSuenoMessage(
        aggregates.nValidP33R > 0
          ? `Sueño EAS cargado: ${aggregates.nValidP33R} registros P33_R válidos de ${aggregates.n}. Sueño insuficiente: ${aggregates.pctInsufficientSleep.toFixed(1)} %. ${suenoAtoms.length} evidencias incorporadas.${warn}`
          : `CSV Sueño EAS procesado sin registros P33_R válidos.${warn}`
      );
      return true;
    } catch {
      setSuenoMessage("Error al procesar el CSV. Verifica que incluya la columna P33_R.");
      return false;
    } finally {
      setIsLoadingSueno(false);
    }
  }

  async function handleLoadCAGECSV(file: File): Promise<boolean> {
    setIsLoadingCAGE(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseCAGECSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createCAGEStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const cageAtoms = attachDocumentIdToAtoms(
        cageStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "cageStudy", CAGE_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `CAGE-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Consumo de alcohol (CAGE_R / CAGE)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", CAGE_DOCUMENT_TAG, "eas"],
        }, cageAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setCageMessage(
        aggregates.nValidCAGER > 0
          ? `CAGE-EAS cargado: ${aggregates.nValidCAGER} registros CAGE_R válidos de ${aggregates.n}. Riesgo de alcoholismo: ${aggregates.pctRisk.toFixed(1)} % (n=${aggregates.nRisk}). ${cageAtoms.length} evidencias incorporadas.${warn}`
          : `CSV CAGE-EAS procesado sin registros CAGE_R válidos.${warn}`
      );
      return true;
    } catch {
      setCageMessage("Error al procesar el CSV. Verifica que incluya la columna CAGE_R.");
      return false;
    } finally {
      setIsLoadingCAGE(false);
    }
  }

  async function handleLoadAUDITCCSV(file: File): Promise<boolean> {
    setIsLoadingAUDITC(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseAUDITCCSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createAUDITCStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const auditcAtoms = attachDocumentIdToAtoms(
        auditcStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "auditcStudy", AUDITC_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "redcap-export",
          title: `AUDIT-C - ${file.name}`,
          source: {
            system: "Encuesta municipal propia — exportación REDCap",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", AUDITC_DOCUMENT_TAG],
        }, auditcAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setAuditcMessage(
        aggregates.nValid > 0
          ? `AUDIT-C cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Consumo de riesgo (≥4): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${auditcAtoms.length} evidencias incorporadas.${warn}`
          : `CSV AUDIT-C procesado sin registros con los 3 ítems completos.${warn}`
      );
      return true;
    } catch {
      setAuditcMessage("Error al procesar el CSV. Verifica que incluya las columnas auditc_q1, auditc_q2 y auditc_q3.");
      return false;
    } finally {
      setIsLoadingAUDITC(false);
    }
  }

  async function handleLoadIPAQCSV(file: File): Promise<boolean> {
    setIsLoadingIPAQ(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseIPAQCSV(text);
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createIPAQStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const ipaqAtoms = attachDocumentIdToAtoms(
        ipaqStudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "ipaqStudy", IPAQ_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "complementary-study",
          title: `IPAQ-EAS - ${file.name}`,
          source: {
            system: "Encuesta Andaluza de Salud — campos derivados oficiales",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", IPAQ_DOCUMENT_TAG],
        }, ipaqAtoms, new Date().toISOString(),
      ));
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setIpaqMessage(
        aggregates.nValidIPAQ > 0 || aggregates.nValidP34AR > 0
          ? `IPAQ-EAS cargado: ${aggregates.nValidIPAQ} válidos IPAQ_DICO · alta actividad ${aggregates.pctHigh.toFixed(1)} % (n=${aggregates.nHigh}). Inactividad tiempo libre: ${aggregates.pctInactive.toFixed(1)} %. ${ipaqAtoms.length} evidencias incorporadas.${warn}`
          : `CSV IPAQ procesado sin registros válidos en IPAQ_DICO ni P34A_R.${warn}`
      );
      return true;
    } catch {
      setIpaqMessage("Error al procesar el CSV. Verifica que incluya las columnas IPAQ_DICO y/o P34A_R.");
      return false;
    } finally {
      setIsLoadingIPAQ(false);
    }
  }

  async function handleLoadGHQ12CSV(file: File): Promise<boolean> {
    setIsLoadingGHQ12(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseGHQ12CSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setGhq12Message(`CSV GHQ-12 procesado sin registros con los 12 ítems completos.${warn}`);
        return false;
      }
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createGHQ12Study({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const ghq12Atoms = attachDocumentIdToAtoms(
        ghq12StudyToEvidenceAtoms(study),
        documentId
      );
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "ghq12Study", GHQ12_DOCUMENT_TAG, study,
        {
          id: documentId,
          kind: "redcap-export",
          title: `GHQ-12 - ${file.name}`,
          source: {
            system: "Encuesta municipal propia — exportación REDCap",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", GHQ12_DOCUMENT_TAG],
        }, ghq12Atoms, new Date().toISOString(),
      ));
      setGhq12Message(
        `GHQ-12 cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Probable malestar (≥3): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${ghq12Atoms.length} evidencias incorporadas.${warn}`
      );
      return true;
    } catch {
      setGhq12Message("Error al procesar el CSV. Verifica que incluya las columnas ghq12_q1 a ghq12_q12.");
      return false;
    } finally {
      setIsLoadingGHQ12(false);
    }
  }

  async function handleLoadPHQ9CSV(file: File): Promise<boolean> {
    setIsLoadingPHQ9(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parsePHQ9CSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setPhq9Message(`CSV PHQ-9 procesado sin registros con los 9 ítems completos.${warn}`);
        return false;
      }
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createPHQ9Study({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const phq9Atoms = attachDocumentIdToAtoms(phq9StudyToEvidenceAtoms(study), documentId);
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "phq9Study", PHQ9_DOCUMENT_TAG, study,
        {
          id: documentId, kind: "redcap-export",
          title: `PHQ-9 - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", PHQ9_DOCUMENT_TAG],
        }, phq9Atoms, new Date().toISOString(),
      ));
      setPhq9Message(
        `PHQ-9 cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Síntomas mod.+ (≥10): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${phq9Atoms.length} evidencias incorporadas.${warn}`
      );
      return true;
    } catch {
      setPhq9Message("Error al procesar el CSV. Verifica que incluya las columnas phq9_q1 a phq9_q9.");
      return false;
    } finally {
      setIsLoadingPHQ9(false);
    }
  }

  async function handleLoadPSQICSV(file: File): Promise<boolean> {
    setIsLoadingPSQI(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parsePSQICSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setPsqiMessage(`CSV PSQI procesado sin registros con los 7 componentes completos.${warn}`);
        return false;
      }
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createPSQIStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const psqiAtoms = attachDocumentIdToAtoms(psqiStudyToEvidenceAtoms(study), documentId);
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "psqiStudy", PSQI_DOCUMENT_TAG, study,
        {
          id: documentId, kind: "redcap-export",
          title: `PSQI - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", PSQI_DOCUMENT_TAG],
        }, psqiAtoms, new Date().toISOString(),
      ));
      setPsqiMessage(
        `PSQI cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Mal dormidor (&gt;5): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${psqiAtoms.length} evidencias incorporadas.${warn}`
      );
      return true;
    } catch {
      setPsqiMessage("Error al procesar el CSV. Verifica que incluya las columnas psqi_c1 a psqi_c7.");
      return false;
    } finally {
      setIsLoadingPSQI(false);
    }
  }

  async function handleLoadFagerstromCSV(file: File): Promise<boolean> {
    setIsLoadingFagerstrom(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseFagerstromCSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setFagerstromMessage(`CSV Fagerström procesado sin registros con los 6 ítems completos.${warn}`);
        return false;
      }
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createFagerstromStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const fagerstromAtoms = attachDocumentIdToAtoms(fagerstromStudyToEvidenceAtoms(study), documentId);
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "fagerstromStudy", FAGERSTROM_DOCUMENT_TAG, study,
        {
          id: documentId, kind: "redcap-export",
          title: `Fagerström - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", FAGERSTROM_DOCUMENT_TAG],
        }, fagerstromAtoms, new Date().toISOString(),
      ));
      setFagerstromMessage(
        `Fagerström cargado: ${aggregates.nValid} fumadores activos de ${aggregates.n}. Dep. mod.+ (≥5): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${fagerstromAtoms.length} evidencias incorporadas.${warn}`
      );
      return true;
    } catch {
      setFagerstromMessage("Error al procesar el CSV. Verifica que incluya las columnas ftnd_q1 a ftnd_q6.");
      return false;
    } finally {
      setIsLoadingFagerstrom(false);
    }
  }

  async function handleLoadSBQCSV(file: File): Promise<boolean> {
    setIsLoadingSBQ(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseSBQCSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setSbqMessage(`CSV SBQ procesado sin registros con los 9 ítems completos.${warn}`);
        return false;
      }
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createSBQStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
        methodologicalCautions,
        warnings,
      });
      const sbqAtoms = attachDocumentIdToAtoms(sbqStudyToEvidenceAtoms(study), documentId);
      setWorkspace(prev => prev.municipality.identity.id !== study.municipalityId ? prev : replaceComplementaryStudy(
        prev, "sbqStudy", SBQ_DOCUMENT_TAG, study,
        {
          id: documentId, kind: "redcap-export",
          title: `SBQ - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", SBQ_DOCUMENT_TAG],
        }, sbqAtoms, new Date().toISOString(),
      ));
      setSbqMessage(
        `SBQ cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Alt. sedentario (&gt;8h): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). Media: ${aggregates.meanHours.toFixed(2)} h/día. ${sbqAtoms.length} evidencias incorporadas.${warn}`
      );
      return true;
    } catch {
      setSbqMessage("Error al procesar el CSV. Verifica que incluya las columnas sbq_q1 a sbq_q9.");
      return false;
    } finally {
      setIsLoadingSBQ(false);
    }
  }

  function handleTopicToggle(topicId: string) {
    setPendingTopics((prev) => {
      if (prev.includes(topicId)) return prev.filter((id) => id !== topicId);
      if (prev.length >= MAX_SELECTED_TOPICS) return prev;
      return [...prev, topicId];
    });
  }

  function handleSaveThematicPrioritisation() {
    const prioritisation = createThematicPrioritisation(
      workspace.municipality.identity.id,
      pendingTopics
    );
    const existingDocument = workspace.repository.documents.find(
      (document) => isThematicPrioritisationDocument(document)
    );

    let nextRepository = workspace.repository;
    let documentId: string;

    if (existingDocument !== undefined) {
      documentId = existingDocument.id;
    } else {
      documentId = crypto.randomUUID();
      nextRepository = addMunicipalDocument(nextRepository, {
        id: documentId,
        kind: "other",
        title: "Priorización temática — Selección manual",
        source: {
          system: "Selección manual COMPÁS",
          collectedAt: new Date().toISOString(),
        },
        tags: [THEMATIC_PRIORITISATION_DOCUMENT_TAG],
      });
    }

    const tpAtoms = attachDocumentIdToAtoms(
      thematicPrioritisationToEvidenceAtoms(prioritisation, THEMATIC_TOPICS),
      documentId
    );

    const nextWorkspace = {
      ...workspace,
      repository: nextRepository,
      thematicPrioritisation: prioritisation,
      evidenceStore: {
        ...workspace.evidenceStore,
        atoms: [
          ...workspace.evidenceStore.atoms.filter(
            (a) => a.provenance.origin !== "citizen-participation"
          ),
          ...tpAtoms,
        ],
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    setWorkspace(nextWorkspace);
    setPendingTopics([...prioritisation.selectedTopicIds]);
    setPersistenceMessage(
      saveWorkspaceToLocalStorage(nextWorkspace)
        ? null
        : WORKSPACE_PERSISTENCE_FAILURE_MESSAGE
    );
    setIsThematicModalOpen(false);
  }

  function handleOpenThematicModal() {
    setPendingTopics([...(workspace.thematicPrioritisation?.selectedTopicIds ?? [])]);
    setTpImportMessage(null);
    setIsThematicModalOpen(true);
  }

  function handleCloseThematicModal() {
    setPendingTopics([...(workspace.thematicPrioritisation?.selectedTopicIds ?? [])]);
    setIsThematicModalOpen(false);
  }

  async function handleImportThematicCSV(file: File): Promise<void> {
    setIsImportingTP(true);
    try {
      const text = await file.text();
      // Bandas de edad para recoger la distribución edad×sexo del CSV: las del padrón del
      // municipio si existe; si no, las quinquenales estándar (solo descriptivas).
      const tpAgeBands = ageBandsForMunicipality(workspace.municipality.identity.id);
      const { partialStudy, warnings } = parseThematicPrioritisationCSV(
        text,
        file.name,
        { ageBands: tpAgeBands }
      );
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study: ThematicPrioritisationStudy = {
        ...partialStudy,
        municipalityId: workspace.municipality.identity.id,
        importedAt: new Date().toISOString(),
      };
      const importedPrioritisation =
        study.completeRecords > 0
          ? createThematicPrioritisation(workspace.municipality.identity.id, study.topFiveTopicIds)
          : null;
      const importedTpAtoms =
        importedPrioritisation !== null
          ? attachDocumentIdToAtoms(
              thematicPrioritisationToEvidenceAtoms(importedPrioritisation, THEMATIC_TOPICS),
              documentId
            )
          : null;
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const shouldRegisterDocument = study.completeRecords > 0;
        const nextRepository =
          shouldRegisterDocument
            ? addMunicipalDocument(
                prev.repository,
                {
                  id: documentId,
                  kind: "redcap-export",
                  title: `Priorización temática - ${file.name}`,
                  source: {
                    system: "Importación REDCap Priorización temática",
                    collectedAt: study.importedAt,
                  },
                  sourceFileName: file.name,
                  tags: ["redcap-export", THEMATIC_PRIORITISATION_DOCUMENT_TAG],
                }
              )
            : prev.repository;

        const imported: MunicipalityWorkspace = {
          ...prev,
          repository: nextRepository,
          thematicPrioritisationStudy: study,
          ...(importedPrioritisation !== null && {
            thematicPrioritisation: importedPrioritisation,
          }),
          ...(importedTpAtoms !== null && {
            evidenceStore: {
              ...prev.evidenceStore,
              atoms: [
                ...prev.evidenceStore.atoms.filter(
                  (atom) =>
                    atom.municipalityId !== prev.municipality.identity.id ||
                    atom.provenance.origin !== "citizen-participation"
                ),
                ...importedTpAtoms,
              ],
              updatedAt: now,
            },
          }),
          updatedAt: now,
        };
        return shouldRegisterDocument
          ? retireCurrentPredecessors(imported, { kind: "prioritisation" }, documentId, now)
          : imported;
      });
      if (study.completeRecords > 0) {
        setPendingTopics([...study.topFiveTopicIds]);
      }
      const warnText = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setTpImportMessage(
        study.completeRecords > 0
          ? `CSV importado: ${study.completeRecords} papeletas completas de ${study.totalRecords} registros. Top 5 aplicado automáticamente como selección temática.${warnText}`
          : `CSV procesado sin papeletas completas. No se ha aplicado selección temática.${warnText}`
      );
    } catch {
      setTpImportMessage("Error al procesar el CSV. Verifica que sea una exportación REDCap válida.");
    } finally {
      setIsImportingTP(false);
    }
  }

  function handleApplyTopFive(topicIds: string[]): void {
    setPendingTopics([...topicIds]);
  }

  // ── Handlers del Gestor de Encuestas (GES) ────────────────────────────────

  function handleAddQuestionnaireProject(project: QuestionnaireProject): void {
    setWorkspace((prev) => ({
      ...prev,
      questionnaireProjects: [...(prev.questionnaireProjects ?? []), project],
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleUpdateQuestionnaireProject(updated: QuestionnaireProject): void {
    setWorkspace((prev) => ({
      ...prev,
      questionnaireProjects: (prev.questionnaireProjects ?? []).map((p) =>
        p.id === updated.id ? updated : p
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleDeleteQuestionnaireProject(projectId: string): void {
    setWorkspace((prev) => ({
      ...prev,
      questionnaireProjects: (prev.questionnaireProjects ?? []).filter((p) => p.id !== projectId),
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleImportProjectDataset(
    file: File,
    project: QuestionnaireProject
  ): Promise<void> {
    setIsImportingProjectDataset(true);
    try {
      const csvText = await file.text();
      const result = importProjectDataset(
        csvText,
        project.questionnaire.methodologicalModules,
        workspace.municipality.identity.id,
        file.name,
        project.id,
        project.name,
      );
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      setWorkspace((prev) => {
        let next = { ...prev };
        for (const study of result.succeeded) {
          next = study.applyStudy(next);
        }
        return {
          ...next,
          repository: addMunicipalDocument(next.repository, {
            id: documentId, kind: 'redcap-export', title: file.name,
            sourceFileName: file.name, source: {system: 'Datos importados desde el gestor de encuestas'},
            canGenerateEvidence: false, tags: ['project-dataset'],
          }),
          projectDatasetImports: [...(next.projectDatasetImports ?? []), result.metadata],
          updatedAt: new Date().toISOString(),
        };
      });
      const { succeeded, skipped, failed, metadata } = result;
      const parts: string[] = [];
      if (succeeded.length > 0) {
        parts.push(`${succeeded.length} módulo${succeeded.length !== 1 ? "s" : ""} importado${succeeded.length !== 1 ? "s" : ""}: ${succeeded.map((s) => s.moduleId).join(", ")}`);
      }
      if (skipped.length > 0) parts.push(`${skipped.length} omitido${skipped.length !== 1 ? "s" : ""}`);
      if (failed.length > 0) parts.push(`${failed.length} fallido${failed.length !== 1 ? "s" : ""}`);
      setImportProjectDatasetMessage(
        parts.length > 0
          ? `${metadata.rowCount} fila${metadata.rowCount !== 1 ? "s" : ""} · ${parts.join(" · ")}.`
          : "CSV procesado sin módulos reconocidos."
      );
    } catch (err) {
      console.error("[import-project-dataset-error]", err);
      setImportProjectDatasetMessage("Error al procesar el CSV. Verifica que sea una exportación REDCap válida.");
    } finally {
      setIsImportingProjectDataset(false);
    }
  }

  function handleRenameDocument(documentId: string, title: string) {
    const previous = workspace.repository.documents.find((d) => d.id === documentId)?.title;
    const clean = title.trim();
    if (previous === undefined || clean === "" || clean === previous) return;
    setWorkspace((prev) => ({
      ...prev,
      repository: renameMunicipalDocument(prev.repository, documentId, clean),
      evidenceStore: {
        ...prev.evidenceStore,
        atoms: prev.evidenceStore.atoms.map((a) =>
          a.provenance?.documentId === documentId && a.provenance.sourceLabel === previous
            ? { ...a, provenance: { ...a.provenance, sourceLabel: clean } }
            : a
        ),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleDeleteDocument(documentId: string): Promise<boolean> {
    const municipalityId = workspace.municipality.identity.id;
    if (!workspace.repository.documents.some(d => d.id === documentId)) return false;
    if (!canDeleteDocumentVersion(workspace.repository.documents, documentId)) {
      window.alert("Este documento tiene versiones posteriores. No puede eliminarse sin romper la trazabilidad; puedes archivarlo o consultar sus revisiones.");
      return false;
    }
    if (!remoteClient.auth.currentUser) {
      window.alert("Inicia sesión: la eliminación debe confirmarse primero en Firebase.");
      return false;
    }
    if (remoteHydratedMunicipalityId !== municipalityId || pendingIndexedDbHydrationId || profileSaveInFlightRef.current) {
      window.alert("El expediente compartido no está listo o existe otra operación pendiente.");
      return false;
    }
    const now = new Date().toISOString();
    const { next: nextWorkspace, deletedStudyKey, deletesHealthReport, deletesThematicPrioritisation } =
      deleteWorkspaceDocument(workspace, documentId, now);

    profileSaveInFlightRef.current = true;
    setRemotePersistenceMessage("Eliminando documento y evidencias en Firebase…");
    try {
      // Retirar siempre desde la revisión exacta consultada, sin sobrescribir
      // cambios de otra sesión o equipo.
      await saveReviewedWorkspace(nextWorkspace, undefined, workspace);
      setWorkspace(current => {
        if (current.municipality.identity.id !== municipalityId || !current.repository.documents.some(doc => doc.id === documentId)) return current;
        return current === workspace ? nextWorkspace : deleteWorkspaceDocument(current, documentId, now).next;
      });
      // Un commit de Firebase no basta para declarar cerrado el ciclo:
      // leer de nuevo desde el servidor y comprobar ficha, originales y validaciones.
      let verified = false;
      try {
        const remote = await readRemoteWorkspace(remoteClient, municipalityId);
        verified = remote !== null && confirmsDocumentDeletion(remote, documentId);
      } catch (verificationError) {
        console.warn("[document-delete-remote-verification]", verificationError);
      }
      if (!verified) {
        setRemotePersistenceMessage("Eliminación escrita en Firebase, pero la lectura posterior no la ha verificado. Recupera el expediente antes de operar de nuevo.");
        return false;
      }
      setRemotePersistenceMessage("Eliminación comprobada mediante lectura de Firebase: ficha, original, evidencias y validaciones.");
      await deleteOriginalFile(municipalityId, documentId).catch(error => {
        console.warn("[original-cache-delete-error]", error);
        setRemotePersistenceMessage("Documento eliminado en Firebase; no se pudo limpiar su caché local.");
      });

    setLastProcessedDocument((prev) => (prev?.id === documentId ? null : prev));
    if (lastProcessedDocument?.id === documentId) {
      setLastAtomCount(0);
    }
    if (deletesHealthReport) {
      setLastHealthReportMessage(null);
      setIsLoadingHealthReport(false);
    }
    if (deletedStudyKey === "ibseStudy") {
      setIbseMessage(null);
      setIsLoadingIBSE(false);
    }
    if (deletedStudyKey === "dukeStudy") {
      setDukeMessage(null);
      setIsLoadingDUKE(false);
    }
    if (deletedStudyKey === "predimedStudy") {
      setPredimedMessage(null);
      setIsLoadingPREDIMED(false);
    }
    if (deletedStudyKey === "sf12Study") {
      setSf12Message(null);
      setIsLoadingSF12(false);
    }
    if (deletedStudyKey === "suenoStudy") {
      setSuenoMessage(null);
      setIsLoadingSueno(false);
    }
    if (deletedStudyKey === "cageStudy") {
      setCageMessage(null);
      setIsLoadingCAGE(false);
    }
    if (deletedStudyKey === "auditcStudy") {
      setAuditcMessage(null);
      setIsLoadingAUDITC(false);
    }
    if (deletedStudyKey === "ipaqStudy") {
      setIpaqMessage(null);
      setIsLoadingIPAQ(false);
    }
    if (deletedStudyKey === "ghq12Study") {
      setGhq12Message(null);
      setIsLoadingGHQ12(false);
    }
    if (deletedStudyKey === "phq9Study") {
      setPhq9Message(null);
      setIsLoadingPHQ9(false);
    }
    if (deletedStudyKey === "psqiStudy") {
      setPsqiMessage(null);
      setIsLoadingPSQI(false);
    }
    if (deletedStudyKey === "fagerstromStudy") {
      setFagerstromMessage(null);
      setIsLoadingFagerstrom(false);
    }
    if (deletedStudyKey === "sbqStudy") {
      setSbqMessage(null);
      setIsLoadingSBQ(false);
    }
    if (deletesThematicPrioritisation) {
      setTpImportMessage(null);
      setPendingTopics([]);
    }


      return true;
    } catch (error) {
      window.alert("No se ha eliminado el documento. Firebase no confirmó el cambio: " + (error as Error).message);
      setRemotePersistenceMessage("No se ha confirmado la eliminación del documento en Firebase.");
      return false;
    } finally {
      profileSaveInFlightRef.current = false;
    }
  }

  function switchToMunicipality(
    municipalityId: string,
    input: CreateMunicipalityContextInput,
    discardConfirmed = false
  ) {
    if (!discardConfirmed && !canLeavePreparation()) return;
    const nextWorkspaceLoad = loadOrCreateMunicipalityWorkspace(municipalityId, input);
    const nextWorkspace = nextWorkspaceLoad.workspace;
    protectedEmptyWorkspaceIdRef.current = nextWorkspaceLoad.protectExistingStorage
      ? municipalityId
      : null;
    // IndexedDB puede contener una copia más reciente cuando localStorage agotó
    // su cuota. Se consulta siempre antes de persistir el workspace cargado.
    setPendingIndexedDbHydrationId(municipalityId);
    saveActiveMunicipalityId(municipalityId);

    setWorkspace(nextWorkspace);
    setPendingTopics([...(nextWorkspace.thematicPrioritisation?.selectedTopicIds ?? [])]);
    setTitle("");
    setPlainText("");
    setKind("health-report");
    setLastProcessedDocument(null);
    setLastAtomCount(0);
    setLastHealthReportMessage(null);
    setIsLoadingHealthReport(false);
    setIbseMessage(null);
    setIsLoadingIBSE(false);
    setDukeMessage(null);
    setIsLoadingDUKE(false);
    setPredimedMessage(null);
    setIsLoadingPREDIMED(false);
    setSf12Message(null);
    setIsLoadingSF12(false);
    setSuenoMessage(null);
    setIsLoadingSueno(false);
    setCageMessage(null);
    setIsLoadingCAGE(false);
    setShowMunicipalitySelector(false);
    setIsThematicModalOpen(false);
    setIsImportingTP(false);
    setTpImportMessage(null);
  }

  function handleChangeMunicipality(municipalityId: string) {
    const muni = allMunicipalities.find((m) => m.id === municipalityId);
    if (muni === undefined) return;
    if (!municipalityChosen && municipalityId === workspace.municipality.identity.id) {
      // El expediente ya está cargado por razones técnicas: basta con registrar la elección.
      saveActiveMunicipalityId(municipalityId);
      setMunicipalityChosen(true);
      setShowMunicipalitySelector(false);
      return;
    }
    setMunicipalityChosen(true);
    switchToMunicipality(municipalityId, muni);
  }

  function handleAddMunicipality(name: string, province: string, type: string) {
    const id = slugifyMunicipalityId(name);
    localStorage.setItem(DELETED_MUNICIPALITIES_KEY, JSON.stringify(
      readDeletedMunicipalityIds().filter((deletedId) => deletedId !== id)
    ));
    locallyDeletedWorkspaceIdsRef.current.delete(id);
    if (remoteClient.auth.currentUser !== null) {
      void clearRemoteTombstone(remoteClient, id).catch(() => undefined);
    }

    const existing = allMunicipalities.find((m) => m.id === id);
    if (existing) {
      switchToMunicipality(id, existing);
      return;
    }

    const newMuni: CreateMunicipalityContextInput = {
      id,
      name: name.trim(),
      province: province.trim() || "Granada",
      territorialType: type || "municipio",
      createdBy: "Usuario",
    };

    const updatedCustom = sanitizeCustomMunicipalities(
      [...customMunicipalities, newMuni],
      DEMO_MUNICIPALITY_IDS
    );
    setCustomMunicipalities(updatedCustom);
    try {
      localStorage.setItem(CUSTOM_MUNICIPALITIES_KEY, JSON.stringify(updatedCustom));
    } catch {
      // localStorage lleno o deshabilitado
    }
    switchToMunicipality(id, newMuni);
  }

  async function handleDeleteMunicipality(
    municipalityId: string,
    input: CreateMunicipalityContextInput
  ) {
    if (allMunicipalities.length < 2) {
      throw new Error("Añade otro ámbito antes de eliminar el último expediente abierto.");
    }

    // Firebase es la copia de custodia: se elimina primero allí. Si falla, no se
    // toca nada en local y el expediente sigue completo.
    if (remoteClient.auth.currentUser === null) {
      throw new Error("Abre sesión para eliminar también la copia de Firebase.");
    }
    const remoteDeletion = await deleteRemoteWorkspace(remoteClient, municipalityId);

    locallyDeletedWorkspaceIdsRef.current.add(municipalityId);
    try {
      localStorage.setItem(DELETED_MUNICIPALITIES_KEY, JSON.stringify(
        [...locallyDeletedWorkspaceIdsRef.current]
      ));
    } catch {
      locallyDeletedWorkspaceIdsRef.current.delete(municipalityId);
      throw new Error("No se pudo registrar la eliminación. El expediente se conserva.");
    }
    clearWorkspaceFromLocalStorage(municipalityId);
    const indexedDbCleared = await clearWorkspaceFromIndexedDB(municipalityId);
    let deletedOriginals = 0;
    let originalsCleared = true;
    try {
      deletedOriginals = await deleteOriginalFilesForMunicipality(municipalityId);
    } catch {
      originalsCleared = false;
    }

    const nextCustomMunicipalities = sanitizeCustomMunicipalities(
      customMunicipalities.filter((municipality) => municipality.id !== municipalityId),
      DEMO_MUNICIPALITY_IDS
    );
    setCustomMunicipalities(nextCustomMunicipalities);
    try {
      localStorage.setItem(
        CUSTOM_MUNICIPALITIES_KEY,
        JSON.stringify(nextCustomMunicipalities)
      );
    } catch {
      // IndexedDB sigue conservando los demás expedientes recuperables.
    }

    const deletedCurrentMunicipality = workspace.municipality.identity.id === municipalityId;
    if (deletedCurrentMunicipality) {
      const nextCatalog = mergeMunicipalityCatalog(
        DEMO_MUNICIPALITIES,
        nextCustomMunicipalities
      );
      const fallback = nextCatalog.find((municipality) =>
        !locallyDeletedWorkspaceIdsRef.current.has(municipality.id) && !RETIRED_MUNICIPALITY_IDS.includes(municipality.id));
      if (fallback) switchToMunicipality(fallback.id, fallback, true);
    }

    setPersistenceMessage(
      indexedDbCleared && originalsCleared
        ? `Expediente de ${input.name} eliminado de Firebase${remoteDeletion.deleted ? "" : " (no había copia remota)"} y de este navegador. Originales locales borrados: ${deletedOriginals}.`
        : `El expediente de ${input.name} se ha retirado, pero su limpieza local está incompleta. Almacenamiento ampliado: ${indexedDbCleared ? "borrado" : "pendiente"}; originales: ${originalsCleared ? "borrados" : "pendientes"}.`
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <DocumentationProvider key={municipality.id} workspace={workspace} canWrite={documentWriteAllowed} onStoreOriginal={handleStoreDocumentOriginal} onStoreDerivative={handleStoreDocumentDerivative} onCreateRevision={handleCreateDocumentRevision} onUseHealthReportRevision={handleUseHealthReportRevision} onArchiveDocument={handleArchiveDocument} onDeleteDocument={documentWriteAllowed ? handleDeleteDocument : undefined}>
      {municipalityToDelete && <DeleteWorkspaceDialog
        name={municipalityToDelete.name}
        discardDraft={preparationDirtyRef.current && municipalityToDelete.id === municipality.id}
        remoteSession={remoteClient.auth.currentUser !== null}
        onCancel={() => setMunicipalityToDelete(null)}
        onConfirm={() => handleDeleteMunicipality(municipalityToDelete.id, municipalityToDelete)}
      />}
      {/* Barra de navegación con contexto municipal */}
      <nav className="app-nav app-nav--home">
        <div className="app-nav__bar" />
        <div className="app-nav__inner">
          <span className="app-nav__brand">
            COMPÁS
          </span>
          <div className="app-nav__tabs">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={view === item.id ? "page" : undefined}
                className={
                  view === item.id
                    ? "app-nav__tab app-nav__tab--active"
                    : "app-nav__tab"
                }
                onClick={() => { setAgendaFocusId(undefined); setView(item.id); window.scrollTo({top: 0, behavior: "auto"}); }}
              >
                {item.phase && <span className="app-nav__phase" aria-hidden="true">{item.phase}</span>}
                <span className="app-nav__label">{navLabelLines(item.label)}</span>
              </button>
            ))}
          </div>
          <label className="app-nav__menu">
            <span>Ir a</span>
            <select value={NAV_ITEMS.some(item => item.id === view) ? view : ""} onChange={event => {
              const next = NAV_ITEMS.find(item => item.id === event.currentTarget.value);
              if (next) { setAgendaFocusId(undefined); setView(next.id); window.scrollTo({ top: 0, behavior: "auto" }); }
            }}>
              {!NAV_ITEMS.some(item => item.id === view) && <option value="" disabled>Seleccionar pestaña</option>}
              {NAV_ITEMS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>

        {/* Referencia del expediente cargado también en Inicio. */}
        <div className="app-nav__municipality" aria-label="Expediente municipal seleccionado">
          <div className="app-nav__municipality-row">
            <span className="app-nav__context-label">Expediente cargado:</span>
            <span className="app-nav__municipality-name">
              {municipalityChosen ? municipality.name : "Elige un ámbito"}
            </span>
            {municipalityChosen && <>
            <span className="app-nav__municipality-sep">·</span>
            <span className="app-nav__secondary-context">{municipality.province}</span>
            {municipality.territorialType && municipality.territorialType !== "municipio" && (
              <>
                <span className="app-nav__municipality-sep">·</span>
                <span className="app-nav__secondary-context">{TERRITORIAL_TYPE_LABEL[municipality.territorialType] ?? municipality.territorialType}</span>
              </>
            )}
            <span className="app-nav__municipality-sep">·</span>
            <span className="app-nav__secondary-context">Plan Local de Salud 2027–2030</span>
            {municipality.ineCode && (
              <>
                <span className="app-nav__municipality-sep">·</span>
                <span className="app-nav__secondary-context">INE {municipality.ineCode}</span>
              </>
            )}
            </>}
            <button
              type="button"
              className="app-nav__municipality-btn"
              onClick={() => setShowMunicipalitySelector((v) => !v)}
            >
              {showMunicipalitySelector ? "Cerrar ▲" : "Cambiar ámbito ▾"}
            </button>
          </div>
        </div>
      </nav>

      {/* Ciclo de Planificación Local — visible en todas las vistas: Implantación (agenda) no exige datos previos */}
      {(
        <LocalHealthPlanningCycle
          healthReportLoaded={runtime.workspace.healthReport !== undefined}
          pslHasEvidence={!!workspace.externalProfileLibrary?.activeId || runtime.psl.totalEvidenceAtoms > 0}
          pslStatus={runtime.psl.status}
          pslIsStale={runtime.pslIsStale}
          pslCompiled={!!workspace.externalProfileLibrary?.activeId || (runtime.workspace.compiledProfiles?.length ?? 0) > 0}
          thematicPrioritisationDone={runtime.workspace.thematicPrioritisation !== undefined}
          {...(() => {
            const lib = workspace.externalProfileLibrary;
            const active = lib?.activeId ? lib.profiles.find((p) => p.id === lib.activeId) : undefined;
            const selection = runtime.workspace.deliberativePrioritySelection;
            const withoutParticipation =
              selection !== undefined &&
              runtime.workspace.thematicPrioritisation !== undefined &&
              selection.citizenTopicIds.length === 0;
            return {
              ...(active ? { externalProfileStatus: active.status === "validated" ? "validated" as const : "review" as const } : {}),
              prioritySelectionDone: selection !== undefined && !withoutParticipation,
              prioritySelectionWithoutParticipation: withoutParticipation,
            };
          })()}
          agendaCount={workspace.agendaActuations?.length ?? 0}
          validatedPlanPresent={(workspace.validatedActionPlans ?? []).some((plan) => plan.municipalityId === municipality.id && plan.status === "validated")}
          planWorkInProgress={(workspace.actionPlanModuleReviews?.length ?? 0) > 0 || (workspace.planPreparationDrafts?.length ?? 0) > 0}
          currentView={view}
          onNavigate={(v) => { setAgendaFocusId(undefined); setView(v as AppView); window.scrollTo({ top: 0, behavior: "auto" }); }}
        />
      )}

      <main className={`app-shell${view === "inicio" ? " app-shell--home" : " app-shell--workspace"}`}>
        {/* Selector de municipio (se muestra sobre cualquier vista) */}
        {showMunicipalitySelector && (
          <section className="municipality-selector">
            <p className="municipality-selector__warning">
              {municipalityChosen ? "" : "Elige el ámbito con el que vas a trabajar. "}
              Cada ámbito conserva su expediente en este navegador. Al cambiar,
              se carga el ámbito seleccionado. Descarga una copia para conservar
              el trabajo fuera de este equipo.
            </p>
            <div className="municipality-selector__options">
              {allMunicipalities.map((m) => (
                <div
                  key={m.id}
                  className={
                    municipalityChosen && municipality.id === m.id
                      ? "municipality-selector__option municipality-selector__option--active"
                      : "municipality-selector__option"
                  }
                >
                  <button
                    type="button"
                    className="municipality-selector__option-main"
                    onClick={() => handleChangeMunicipality(m.id)}
                  >
                    <span className="municipality-selector__option-name">{m.name}</span>
                    <span className="municipality-selector__option-meta">
                      {m.province}
                      {m.territorialType && m.territorialType !== "municipio"
                        ? ` · ${TERRITORIAL_TYPE_LABEL[m.territorialType] ?? m.territorialType}`
                        : ""}
                      {m.ineCode ? ` · INE ${m.ineCode}` : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="municipality-selector__delete"
                    aria-label={`Eliminar expediente de ${m.name}`}
                    onClick={() => setMunicipalityToDelete(m)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="municipality-selector__cancel"
                onClick={() => setShowMunicipalitySelector(false)}
              >
                Cancelar
              </button>
            </div>

            {/* Formulario de nuevo ámbito territorial */}
            <div className="municipality-add">
              <p className="municipality-add__label">Añadir ámbito territorial</p>
              <div className="municipality-add__row">
                <input
                  type="text"
                  className="municipality-add__input"
                  placeholder="Nombre del ámbito"
                  value={newMuniName}
                  onChange={(e) => {
                    setNewMuniName(e.target.value);
                    setNewMuniError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const name = newMuniName.trim();
                      if (!name) { setNewMuniError("Introduce un nombre."); return; }
                      handleAddMunicipality(name, newMuniProvince, newMuniType);
                      setNewMuniName("");
                      setNewMuniProvince("");
                      setNewMuniType("municipio");
                    }
                  }}
                />
                <input
                  type="text"
                  className="municipality-add__input municipality-add__input--sm"
                  placeholder="Provincia (Granada)"
                  value={newMuniProvince}
                  onChange={(e) => setNewMuniProvince(e.target.value)}
                />
                <select
                  className="municipality-add__input municipality-add__input--sm"
                  value={newMuniType}
                  onChange={(e) => setNewMuniType(e.target.value)}
                >
                  {TERRITORIAL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="municipality-add__btn"
                  onClick={() => {
                    const name = newMuniName.trim();
                    if (!name) { setNewMuniError("Introduce un nombre."); return; }
                    handleAddMunicipality(name, newMuniProvince, newMuniType);
                    setNewMuniName("");
                    setNewMuniProvince("");
                    setNewMuniType("municipio");
                  }}
                >
                  Añadir
                </button>
              </div>
              {newMuniError && (
                <p className="municipality-add__error">{newMuniError}</p>
              )}
            </div>
          </section>
        )}

        {/* ── ① Inicio — Portada institucional de COMPÁS, en una sola pantalla */}
        {view === "inicio" && <HomePortada onNavigate={(v) => setView(v)} municipality={{name:municipality.name, province:municipality.province, ineCode:municipality.ineCode}} onChangeMunicipality={() => setShowMunicipalitySelector(v => !v)} />}

        {/* ── ② Repositorio documental ─────────────────────── */}
        {view === "repositorio" && (
          <section className="hp diagnosis-page workspace-page" aria-labelledby="workspace-cover-title">
            {/* ── Sala de control: cabecera, resumen factual, matriz y línea temporal ── */}
            {(() => {
              const atoms = runtime.workspace.evidenceStore.atoms;
              const studies = [
                runtime.workspace.ibseStudy,
                runtime.workspace.dukeStudy,
                runtime.workspace.predimedStudy,
                runtime.workspace.sf12Study,
                runtime.workspace.suenoStudy,
                runtime.workspace.cageStudy,
                runtime.workspace.auditcStudy,
                runtime.workspace.ipaqStudy,
                runtime.workspace.ghq12Study,
                runtime.workspace.phq9Study,
                runtime.workspace.psqiStudy,
                runtime.workspace.fagerstromStudy,
                runtime.workspace.sbqStudy,
              ];
              const assetDocs = runtime.workspace.repository.documents.filter(
                (d) => (d.kind === "community-asset" || d.kind === "localiza-salud") && d.status !== "archived" && d.status !== "rejected"
              );
              const summary = buildDiagnosisControlSummary({
                repository: runtime.workspace.repository,
                evidenceCount: atoms.length,
                healthReportLoaded: runtime.workspace.healthReport !== undefined,
                studiesLoaded: studies.map(Boolean),
                studyEvidenceCount: atoms.filter(a => a.provenance.origin === "ibse" || a.provenance.origin === "complementary-study").length,
                assetCount: assetDocs.flatMap(assetEntriesOfDocument).length,
                ...((runtime.workspace.repository.assetValidations ?? []).length > 0
                  ? {
                      validatedAssetCount: readLocalizaAssets(
                        atoms.filter((a) => a.kind === "asset" && assetDocs.some((d) => d.id === a.provenance?.documentId)),
                        runtime.workspace.repository.assetValidations
                      ).records.filter((r) => r.estado === "validado").length,
                    }
                  : {}),
              });
              return (
                <DiagnosisControlRoom
                  municipalityName={municipality.name}
                  province={workspace.municipality.identity.province}
                  ineCode={workspace.municipality.identity.ineCode}
                  summary={summary}
                />
              );
            })()}

            {/* Punto único de control de todo el archivo documental, incluidos activos y CSV. */}
            <DocumentArchiveManager
              repository={runtime.workspace.repository}
              onSetDocumentCycle={documentWriteAllowed ? handleSetDocumentCycle : undefined}
              evidence={runtime.workspace.evidenceStore.atoms}
              originalIds={(runtime.workspace.documentOriginals ?? []).map(o => o.documentId)}
              originalCapacity={`${formatMegabytes(workspaceDocumentBytes(runtime.workspace))} / ${formatMegabytes(MAX_WORKSPACE_ORIGINALS_BYTES)}`}
              canWrite={documentWriteAllowed}
              persistence={remotePersistenceMessage ?? ""}
              onOpenUploader={() => { openDiagnosisToolbox(); requestAnimationFrame(() => document.getElementById("document-review-title")?.scrollIntoView({behavior:"smooth",block:"start"})); }}
              onOpenAssetValidations={() => { openDiagnosisToolbox(); toggleDiagnosisModule("documents", true); requestAnimationFrame(() => document.getElementById("diag-mod-documents")?.scrollIntoView({behavior:"smooth",block:"start"})); }}
            />

            {/* La estadística territorial es una fuente del diagnóstico.
                Su incorporación al Perfil genera siempre una revisión separada. */}
            <details className="diagnosis-territorial-statistics hp-phase hp-phase--3" data-testid="diagnosis-territorial-statistics">
              <summary><strong>Estadística territorial oficial · INE e IECA</strong><span>Indicadores y descargas</span></summary>
              <TerritorialStatisticsPanel
                key={workspace.municipality.identity.id}
                municipalityId={workspace.municipality.identity.id}
                municipalityName={municipality.name}
                ineCode={workspace.municipality.identity.ineCode}
                province={workspace.municipality.identity.province}
                snapshots={workspace.territorialStatistics}
                activeProfile={workspace.externalProfileLibrary?.profiles.find(p => p.id === workspace.externalProfileLibrary?.activeId)}
                authorName={remoteClient.auth.currentUser?.displayName || remoteClient.auth.currentUser?.email || ""}
                onSave={handleSaveTerritorialStatistics}
                onPrepareRevision={(results, note) => {
                  setPendingStatisticsRevision({municipalityId: municipality.id, results, note});
                  setView("psl");
                  window.scrollTo({top: 0, behavior: "auto"});
                }}
              />
            </details>

            {/* Marco estratégico común: el mismo en todos los expedientes; no es documentación municipal. */}
            <details className="diagnosis-common-framework hp-phase hp-phase--4" data-testid="diagnosis-common-framework">
              <summary><strong>Marco estratégico común</strong><span>{STRATEGIC_REFERENCES.length} documentos · iguales en todos los expedientes</span></summary>
              <div className="diagnosis-common-framework__body"><CommonStrategicFramework /></div>
            </details>

            <details id="diagnosis-tools-drawer" className="diagnosis-tools-drawer hp-phase hp-phase--5">
              <summary><strong>Otras herramientas del diagnóstico</strong><span>Bibliotecas, custodia y análisis</span></summary>
              <div className="diagnosis-tools-drawer__body">
            {/* Biblioteca de referencia institucional: no pertenece al expediente
                municipal y no alimenta el diagnóstico ni las evidencias. */}
            <StrategicReferenceLibrary
              workspace={workspace}
              onNormalizeLojaRemote={documentWriteAllowed && remoteHydratedMunicipalityId === "loja" && remoteClient.auth.currentUser
                ? async expectedWorkspace => {
                    let reviewedRevision: RemoteWorkspaceRevision = null;
                    const result = await normalizeLojaMetadataRemotely({
                      read: async id => {
                        const reviewed = await readRemoteWorkspaceVersion(remoteClient, id);
                        reviewedRevision = reviewed?.revision ?? null;
                        return reviewed?.workspace ?? null;
                      },
                      save: async updated => {
                        const revision = await saveRemoteWorkspace(remoteClient, updated, undefined, reviewedRevision);
                        reviewedRemoteRevisions.current.set(updated.municipality.identity.id, revision);
                      },
                    },expectedWorkspace);
                    if (result.status === "updated") {
                      lastExplicitProfileWorkspaceRef.current = result.workspace;
                      setWorkspace(current => current.municipality.identity.id === "loja" && JSON.stringify(current) === JSON.stringify(expectedWorkspace) ? result.workspace : current);
                      setRemotePersistenceMessage("Corrección documental de Loja guardada y comprobada en Firebase.");
                    }
                    return result.status;
                  }
                : undefined}
            />

            {/* ── Originales en el expediente compartido ── */}
            {(() => {
              const stored = runtime.workspace.documentOriginals ?? [];
              const used = workspaceDocumentBytes(runtime.workspace);
              const titleOf = (id: string) => runtime.workspace.repository.documents.find((d) => d.id === id)?.title ?? id;
              return (
                <section className="workspace-panel originals-status" aria-label="Originales en el expediente compartido">
                  <p className="originals-status__line">
                    <strong>Archivos en el expediente compartido:</strong> {stored.length} originales · {(runtime.workspace.documentDerivedFiles ?? []).length} derivados · {formatMegabytes(used)} de {formatMegabytes(MAX_WORKSPACE_ORIGINALS_BYTES)}, contando los del Perfil.
                    {remoteClient.auth.currentUser ? " Se guardan en Firebase con el expediente." : " Sin sesión iniciada, se guardan solo en este navegador."}
                  </p>
                  {localOnlyOriginals.length > 0 && (
                    <div role="alert" className="originals-status__warning">
                      <strong>Solo en este navegador:</strong>
                      <ul>
                        {localOnlyOriginals.map((o) => (
                          <li key={o.documentId}>{titleOf(o.documentId)} · {o.reason === "too-large" ? "supera los 20 MB por archivo" : o.reason === "different-hash" ? "no coincide con la huella de la ficha" : "no cabe en el límite del expediente"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* ── Documentos repetidos: detección y retirada confirmada ── */}
            {(() => {
              const atomCountByDocument: Record<string, number> = {};
              for (const atom of runtime.workspace.evidenceStore.atoms) {
                const ids = [atom.provenance.documentId, ...(atom.provenance.additionalDocuments ?? []).map(source => source.documentId)];
                for (const id of ids) if (id) atomCountByDocument[id] = (atomCountByDocument[id] ?? 0) + 1;
              }
              const protectedIds = new Set([
                ...Object.values(activeStudyDocuments(runtime.workspace)),
                ...(runtime.workspace.healthReport ? [runtime.workspace.healthReport.linkedDocumentId] : []),
              ]);
              const groups = findDuplicateGroups(runtime.workspace.repository, { localHashes: knownOriginalHashes, protectedIds, atomCountByDocument });
              return (
                <DuplicateDocumentsPanel
                  groups={groups}
                  kindLabels={DOCUMENT_KINDS}
                  atomCountByDocument={atomCountByDocument}
                  protectedIds={protectedIds}
                  onRetire={handleRetireDuplicate}
                />
              );
            })()}

            {/* ── Entrada universal: análisis, revisión e incorporación ── */}
            <DocumentReviewInbox
              key={runtime.workspace.municipality.identity.id}
              municipality={runtime.workspace.municipality.identity.name}
              repository={runtime.workspace.repository}
              declaredBy={remoteClient.auth.currentUser?.email || remoteClient.auth.currentUser?.displayName || ""}
              documentKinds={DOCUMENT_KINDS}
              isImporting={isLoadingHealthReport === true || isLoadingDocumentFile === true || Object.values(studyCsvLoaders).some((loader) => loader.loading)}
              connectedInstruments={Object.keys(studyCsvLoaders)}
              registeredHealthReport={runtime.workspace.healthReport ? { title: runtime.workspace.healthReport.title, sourceFileName: runtime.workspace.healthReport.sourceFileName } : undefined}
              storageNotice={storageSummary()}
              localHashes={knownOriginalHashes}
              getLoaderMessage={(route, studyId) =>
                route === "health-report" ? lastHealthReportMessage
                  : route === "document-file" ? documentFileMessage
                  : studyId !== undefined ? studyCsvLoaders[studyId]?.message : undefined
              }
              onImport={(file, request) =>
                request.route === "health-report"
                  ? handleLoadHealthReport(file, { temporal: request.temporal, contentSha256: request.contentSha256 })
                  : request.route === "study-csv"
                    ? handleInboxStudyCsv(file, request.studyId, request.temporal, request.contentSha256)
                    : handleLoadDocumentFile(file, { kind: request.kind, declaresOpenAnswers: false, temporal: request.temporal, contentSha256: request.contentSha256 })
              }
            />

            {/* ── Detalle por módulo: paneles existentes, plegados ── */}
            <DiagnosisModuleSection id="diag-mod-health-report" title="Informe de Salud" description="Visor del Informe incorporado" open={openDiagModules.has("health-report")} onToggle={(open) => toggleDiagnosisModule("health-report", open)}>
              <HealthReportViewer
                healthReport={runtime.workspace.healthReport}
                repository={runtime.workspace.repository}
              />
            </DiagnosisModuleSection>
            <DiagnosisModuleSection id="diag-mod-studies" title="Estudios complementarios" description="Carga por instrumento, ajuste IBSE y resultados" open={openDiagModules.has("studies")} onToggle={(open) => toggleDiagnosisModule("studies", open)}>
              <EstudiosComplementariosPanel
                municipalityName={municipality.name}
                ibseStudy={runtime.workspace.ibseStudy}
                isLoadingIBSE={isLoadingIBSE}
                ibseMessage={ibseMessage}
                onLoadIBSECSV={handleLoadIBSECSV}
                dukeStudy={runtime.workspace.dukeStudy}
                isLoadingDUKE={isLoadingDUKE}
                dukeMessage={dukeMessage}
                onLoadDUKECSV={handleLoadDUKECSV}
                predimedStudy={runtime.workspace.predimedStudy}
                isLoadingPREDIMED={isLoadingPREDIMED}
                predimedMessage={predimedMessage}
                onLoadPREDIMEDCSV={handleLoadPREDIMEDCSV}
                sf12Study={runtime.workspace.sf12Study}
                isLoadingSF12={isLoadingSF12}
                sf12Message={sf12Message}
                onLoadSF12CSV={handleLoadSF12CSV}
                suenoStudy={runtime.workspace.suenoStudy}
                isLoadingSueno={isLoadingSueno}
                suenoMessage={suenoMessage}
                onLoadSuenoCSV={handleLoadSuenoCSV}
                cageStudy={runtime.workspace.cageStudy}
                isLoadingCAGE={isLoadingCAGE}
                cageMessage={cageMessage}
                onLoadCAGECSV={handleLoadCAGECSV}
                auditcStudy={runtime.workspace.auditcStudy}
                isLoadingAUDITC={isLoadingAUDITC}
                auditcMessage={auditcMessage}
                onLoadAUDITCCSV={handleLoadAUDITCCSV}
                ipaqStudy={runtime.workspace.ipaqStudy}
                isLoadingIPAQ={isLoadingIPAQ}
                ipaqMessage={ipaqMessage}
                onLoadIPAQCSV={handleLoadIPAQCSV}
                ghq12Study={runtime.workspace.ghq12Study}
                isLoadingGHQ12={isLoadingGHQ12}
                ghq12Message={ghq12Message}
                onLoadGHQ12CSV={handleLoadGHQ12CSV}
                phq9Study={runtime.workspace.phq9Study}
                isLoadingPHQ9={isLoadingPHQ9}
                phq9Message={phq9Message}
                onLoadPHQ9CSV={handleLoadPHQ9CSV}
                psqiStudy={runtime.workspace.psqiStudy}
                isLoadingPSQI={isLoadingPSQI}
                psqiMessage={psqiMessage}
                onLoadPSQICSV={handleLoadPSQICSV}
                fagerstromStudy={runtime.workspace.fagerstromStudy}
                isLoadingFagerstrom={isLoadingFagerstrom}
                fagerstromMessage={fagerstromMessage}
                onLoadFagerstromCSV={handleLoadFagerstromCSV}
                sbqStudy={runtime.workspace.sbqStudy}
                isLoadingSBQ={isLoadingSBQ}
                sbqMessage={sbqMessage}
                onLoadSBQCSV={handleLoadSBQCSV}
                repository={runtime.workspace.repository}
                activeStudySourceIds={Object.fromEntries(
                  Object.entries(activeStudyDocuments(runtime.workspace))
                    .map(([key, id]) => [STUDY_DOCUMENT_TAGS[key as ComplementaryStudyKey], id])
                )}
                onDeleteDocument={handleDeleteDocument}
              />
            </DiagnosisModuleSection>
            <DiagnosisModuleSection id="diag-mod-assets" title="Activos para la salud" description="Activos identificados y su procedencia" open={openDiagModules.has("assets")} onToggle={(open) => toggleDiagnosisModule("assets", open)}>
              <ActivosSaludPanel
                repository={runtime.workspace.repository}
                atoms={runtime.workspace.evidenceStore.atoms}
                onDeleteDocument={handleDeleteDocument}
                onRenameDocument={handleRenameDocument}
              />
            </DiagnosisModuleSection>
            <DiagnosisModuleSection id="diag-mod-documents" title="Validaciones documentales y biblioteca" description="Conciliaciones, validación de activos y referencias transversales; el catálogo de archivos se consulta arriba" open={openDiagModules.has("documents")} onToggle={(open) => toggleDiagnosisModule("documents", open)}>
              <DocumentRepositoryPanel
                repository={runtime.workspace.repository}
                hideRepeatedListings
                onDelete={documentWriteAllowed ? handleDeleteDocument : undefined}
                libraryDocuments={compasDocumentLibrary}
                libraryMessage={documentLibraryMessage}
                onAssignLibraryDocument={handleAssignLibraryDocument}
                onSetDocumentCycle={handleSetDocumentCycle}
                onAddConciliation={handleAddConciliation}
                onRemoveConciliation={handleRemoveConciliation}
                onAddAssetValidation={handleAddAssetValidation}
                onRemoveAssetValidation={handleRemoveAssetValidation}
                assetResources={runtime.workspace.evidenceStore.atoms
                  .filter((a) => a.kind === "asset")
                  .map((a) => ({ id: a.id, title: a.title, documentId: a.provenance.documentId ?? "" }))}
              />
            </DiagnosisModuleSection>
            <DiagnosisModuleSection id="diag-mod-manual" title="Carga manual por tipo" description="Vía clásica: texto pegado, referencias y formularios por tipo documental" open={openDiagModules.has("manual")} onToggle={(open) => toggleDiagnosisModule("manual", open)}>
              <DocumentIngestionPanel
                documentKinds={DOCUMENT_KINDS}
                kind={kind}
                title={title}
                plainText={plainText}
                lastProcessedDocument={lastProcessedDocument}
                atomsCreated={lastAtomCount}
                isLoadingHealthReport={isLoadingHealthReport}
                healthReportMessage={lastHealthReportMessage}
                onKindChange={setKind}
                onTitleChange={setTitle}
                onPlainTextChange={setPlainText}
                onProcessDocument={handleProcessDocument}
                onRegisterReference={handleRegisterDocumentReference}
                declaresOpenAnswers={declaresOpenAnswers}
                onDeclaresOpenAnswersChange={setDeclaresOpenAnswers}
                onLoadHealthReport={handleLoadHealthReport}
                onLoadDocumentFile={handleLoadDocumentFile}
                isLoadingDocumentFile={isLoadingDocumentFile}
                documentFileMessage={documentFileMessage}
              />
            </DiagnosisModuleSection>
            <DiagnosisModuleSection id="diag-mod-evidence" title="Evidencias incorporadas al análisis" description="Unidades trazables por fuente" open={openDiagModules.has("evidence")} onToggle={(open) => toggleDiagnosisModule("evidence", open)}>
              <EvidenceStorePanel
                evidenceStore={runtime.workspace.evidenceStore}
                defaultOpen={false}
              />
            </DiagnosisModuleSection>

              </div>
            </details>
          </section>
        )}

        {/* ── ⑦ Plan de Acción: portada común y una columna por sección, como Diagnóstico ── */}
        {view === "plan" && (() => {
          const catalog = (section: "lineas" | "resultante") => (
            <ActionPlanCatalogPanel
              section={section}
              municipalityId={workspace.municipality.identity.id}
              municipalityName={municipality.name}
              lectura={runtime.lectura ?? undefined}
              selection={runtime.lectura ? workspace.deliberativePrioritySelection : undefined}
              eligibleModules={runtime.lectura ? runtime.eligibleActionPlanModules : []}
              reviews={workspace.actionPlanModuleReviews ?? []}
              validatedActionPlans={workspace.validatedActionPlans ?? []}
              onDeletePlanVersion={documentWriteAllowed ? handleDeleteValidatedPlanVersion : undefined}
              onValidatePlan={(document) => {
                if (document.municipalityId !== workspace.municipality.identity.id) return false;
                const next = {...workspace, validatedActionPlans: [...(workspace.validatedActionPlans ?? []), document], updatedAt: new Date().toISOString()};
                if (!saveWorkspaceToLocalStorage(next)) return false;
                setWorkspace(next);
                return true;
              }}
              drafts={workspace.planPreparationDrafts ?? []}
              onDraftChange={handlePlanPreparationChange}
              worksheets={workspace.indicatorWorksheets ?? []}
              onWorksheetChange={handleIndicatorWorksheetChange}
              onSave={handleSaveActionPlanModuleReview}
            />
          );
          const validated = (workspace.validatedActionPlans ?? []).length;
          const sections: { id: PlanSection; title: string; summary: string; body: () => ReactNode }[] = [
            { id: "lineas", title: "Líneas e indicadores", summary: "Catálogo RELAS · selección y redacción del territorio", body: () => catalog("lineas") },
            { id: "resultante", title: "Plan resultante", summary: validated === 0 ? "Ninguna versión validada" : validated === 1 ? "1 versión validada" : `${validated} versiones validadas`, body: () => catalog("resultante") },
          ];
          if (runtime.lectura) {
            const lectura = runtime.lectura;
            sections.push(
              { id: "lectura", title: "Lectura estratégica", summary: "Lectura Estratégica Local del Perfil vigente", body: () => <LecturaEstrategicaView lectura={lectura} /> },
              { id: "prioridades", title: "Participación y prioridades", summary: "Encuesta ciudadana y selección del Grupo Motor", body: () => (
                <>
                  <ThematicPrioritisationPanel
                    savedIds={runtime.workspace.thematicPrioritisation?.selectedTopicIds ?? []}
                    onOpen={handleOpenThematicModal}
                  />
                  <CitizenParticipationSummary
                    study={runtime.workspace.thematicPrioritisationStudy}
                    municipalityId={runtime.workspace.municipality.identity.id}
                    municipalityName={runtime.workspace.municipality.identity.name}
                  />
                  <DeliberativePrioritySelectionPanel
                    key={`${lectura.id}-${workspace.deliberativePrioritySelection?.id ?? "pending"}`}
                    lectura={lectura}
                    citizenPrioritisation={workspace.thematicPrioritisation}
                    selection={workspace.deliberativePrioritySelection}
                    isStale={runtime.prioritySelectionIsStale}
                    onSave={handleSaveDeliberativePrioritySelection}
                  />
                </>
              ) },
              { id: "borrador", title: "Borrador de actuaciones", summary: runtime.pai ? "Borrador automático disponible" : "Requiere una selección vigente del Grupo Motor", body: () => runtime.pai
                ? <PAIView pai={runtime.pai} />
                : <p className="panel-note">El borrador automático de actuaciones se genera cuando el Grupo Motor registra una selección vigente. La edición directa de objetivos e indicadores se guarda en «Líneas e indicadores».</p> },
            );
          }
          return (
            <section key="plan" className="hp plan-page workspace-page" aria-labelledby="workspace-cover-title" style={{"--plan-cols": sections.length} as CSSProperties}>
              <CompasCover
                title="Plan de Acción"
                context="04 · Planificar"
                subtitle={<><strong>{municipality.name}</strong>{municipality.province && ` · ${municipality.province}`}{municipality.ineCode && ` · INE ${municipality.ineCode}`}</>}
                side={<p className="hp-cover__mission">{runtime.lectura
                  ? "COMPÁS aporta candidaturas desde la Lectura Estratégica Local y la selección del Grupo Motor; no selecciona prioridades ni adopta compromisos municipales."
                  : "Edición territorial directa: al elegir Modificar, la redacción queda guardada en este expediente sin revisión administrativa intermedia."}</p>}
              />
              {sections.map((section, index) => (
                <details
                  key={section.id}
                  className={`plan-page__section hp-phase hp-phase--${index + 1}`}
                  data-plan-section={section.id}
                  open={planTab === section.id}
                  onToggle={event => {
                    const isOpen = event.currentTarget.open;
                    setPlanTab(current => isOpen ? section.id : current === section.id ? null : current);
                  }}
                >
                  <summary><strong>{section.title}</strong><span>{section.summary}</span></summary>
                  {planTab === section.id && <div className="plan-page__body">{section.body()}</div>}
                </details>
              ))}
            </section>
          );
        })()}

        {/* ── Perfil de Salud Local: portada común y una columna por espacio, como Diagnóstico ── */}
        {view === "psl" && (() => {
          const library = workspace.externalProfileLibrary;
          const active = library?.profiles.find(p => p.id === library.activeId);
          const pending = (library?.profiles ?? []).filter(p => p.id !== library?.activeId && p.status === "review" && !p.archivedAt).length;
          return (
            <section key="psl" className="hp profile-page workspace-page" aria-labelledby="workspace-cover-title">
              <CompasCover
                title="Perfil de Salud Local"
                context="02 · Perfilar"
                subtitle={<><strong>{municipality.name}</strong>{municipality.province && ` · ${municipality.province}`}{municipality.ineCode && ` · INE ${municipality.ineCode}`}</>}
                side={<p className="hp-cover__mission">{active
                  ? <>Vigente: <strong>{active.title}</strong>{active.period && ` · ${active.period}`} · {active.status === "validated" ? "validada" : "en revisión"}{pending > 0 && ` · ${pending} ${pending === 1 ? "revisión pendiente" : "revisiones pendientes"}`}</>
                  : "Ningún Perfil incorporado. El Perfil se elabora fuera de COMPÁS y condiciona la priorización y el Plan de Acción."}</p>}
              />
              <ExternalProfileDashboard
                compact
                key={workspace.municipality.identity.id}
                municipalityId={workspace.municipality.identity.id}
                municipalityName={municipality.name}
                library={workspace.externalProfileLibrary ?? EMPTY_PROFILE_LIBRARY}
                authorName={remoteClient.auth.currentUser?.displayName || remoteClient.auth.currentUser?.email || ""}
                legacyProfiles={workspace.compiledProfiles}
                legacyText={workspace.validatedPSL?.conclusiones.content}
                onSave={handleSaveExternalProfiles}
                incomingTerritorialRevision={pendingStatisticsRevision?.municipalityId === municipality.id ? pendingStatisticsRevision : undefined}
                onIncomingTerritorialRevisionConsumed={() => setPendingStatisticsRevision(null)}
                updaterMunicipalities={allMunicipalities.filter(m => m.territorialType === undefined || m.territorialType === "municipio").map(m => ({ id: m.id, name: m.name }))}
                onRunProfileUpdates={handleProfileUpdates}
                onDirtyChange={onProfileDirtyChange}
              />
            </section>
          );
        })()}

        {view !== "inicio" && view !== "repositorio" && view !== "plan" && view !== "psl" && (
          <section key={view} className="hp workspace-page" aria-labelledby="workspace-cover-title">
            <CompasCover
              title={NAV_ITEMS.find(item => item.id === view)?.label ?? (view === "analisis" ? "Análisis territorial" : "Lectura Estratégica Local")}
              context="COMPÁS · Planificación Local de Salud"
              subtitle={<><strong>{municipality.name}</strong>{municipality.province && ` · ${municipality.province}`}{municipality.ineCode && ` · INE ${municipality.ineCode}`}</>}
            />
        {/* ── ③ Análisis territorial — interpretación territorial (Nivel 2) ── */}
        {/* Orden: resultados (B) → explicabilidad (C) → estado del proceso (A) */}
        {view === "analisis" && (
          <>
            <WorkspaceDisclosure title="Resultados del análisis"><LT1Panel lt1={runtime.lt1} /><OITPanel oit={runtime.oit} /></WorkspaceDisclosure>
            <WorkspaceDisclosure title="Conciliación y trazabilidad"><ReconciliacionPanel reconciliacion={runtime.reconciliacion} /><PipelineTracePanel pipeline={runtime.pipeline} /></WorkspaceDisclosure>
          </>
        )}

        {/* Perfil de Salud Local: páginas de datos, lectura y versiones del Perfil guardado en Firebase. */}
        {/* ── ⑤ Priorizaciones — técnica y participativa ──────── */}
        {view === "priorizacion" && (
          <>
            <WorkspaceDisclosure title="Candidaturas técnicas">
            <PrioritizationPanel
              prioritization={runtime.prioritization}
              externalSource={(() => {
                const library = workspace.externalProfileLibrary;
                const active = library?.profiles.find(p => p.id === library.activeId && p.municipalityId === municipality.id);
                return active ? { id: active.id, title: active.title, status: active.status, limitations: active.limitations } : undefined;
              })()}
              pslStatus={runtime.psl.status}
              pslIsStale={runtime.pslIsStale}
              hasInsufficientEvidence={pipelineIsEmpty}
            />
            </WorkspaceDisclosure>
            <WorkspaceDisclosure title="Participación ciudadana">
            <ThematicPrioritisationPanel
              savedIds={
                runtime.workspace.thematicPrioritisation?.selectedTopicIds ?? []
              }
              onOpen={handleOpenThematicModal}
            />
            <CitizenParticipationSummary
              study={runtime.workspace.thematicPrioritisationStudy}
              municipalityId={runtime.workspace.municipality.identity.id}
              municipalityName={runtime.workspace.municipality.identity.name}
            />
            </WorkspaceDisclosure>
          </>
        )}

        {/* ── ⑥ Lectura Estratégica Local + PAI ───────────────── */}
        {view === "lectura" && (
          <WorkspaceDisclosure title="Lectura y propuesta técnica">
          {runtime.lectura ? (
            <>
              <LecturaEstrategicaView lectura={runtime.lectura} />
              {runtime.pai && <PAIView pai={runtime.pai} />}
            </>
          ) : (
            <section className="workspace-panel">
              <p className="eyebrow">Producto 5 · Motor de Traducción Estratégica</p>
              <h2>Lectura Estratégica Local</h2>
              <p className="panel-note">
                La Lectura Estratégica Local se genera automáticamente a partir del Perfil de Salud
                Local vigente. Si el Perfil está sustituido o archivado, o aún no hay evidencia
                suficiente, no se genera.
              </p>
              <p className="panel-note" role="status">
                Criterio de calidad «Perfil validado»: {runtime.profileValidation.met ? "cumplido" : "no cumplido"}.{" "}
                {runtime.profileValidation.detail}
              </p>
            </section>
          )}
          </WorkspaceDisclosure>
        )}

        {/* ── ⑧ Plan Local de Salud — esbozo previo a las actuaciones ── */}
        {view === "plan-local" && (
          <>
          <WorkspaceDisclosure title="Documento del Plan Local de Salud">
            <InitialLocalHealthPlanPanel workspace={workspace} pslIsStale={runtime.pslIsStale} />
          </WorkspaceDisclosure>
          <WorkspaceDisclosure title="Estructura y contenido del Plan">
          <LocalHealthPlanOutline
            municipalityId={workspace.municipality.identity.id}
            municipalityName={municipality.name}
            province={municipality.province}
            healthReportTitle={workspace.healthReport?.title}
            pslStatus={runtime.psl.status}
            pslCompiled={!!workspace.externalProfileLibrary?.activeId || (workspace.compiledProfiles?.length ?? 0) > 0}
            selectedPriorities={THEMATIC_TOPICS
              .filter((topic) => workspace.thematicPrioritisation?.selectedTopicIds.includes(topic.id))
              .map((topic) => topic.label)}
            drafts={workspace.planPreparationDrafts ?? []}
            agendaActuations={workspace.agendaActuations ?? []}
          />
          </WorkspaceDisclosure>
          </>
        )}

        {/* ── Agenda de actuaciones por entornos (registro de trabajo; sin condicionar a PSL validado: decisión provisional) */}
        {view === "agenda" && (
          <WorkspaceDisclosure title="Agenda de actuaciones" open={agendaFocusId ? true : undefined}>
          <AgendaBoard
            key={`${municipality.id}-${agendaFocusId ?? ""}`}
            municipalityId={municipality.id}
            municipalityName={municipality.name}
            actuations={workspace.agendaActuations ?? []}
            worksheets={workspace.indicatorWorksheets ?? []}
            onChange={handleAgendaChange}
            templates={workspace.actuationTemplates ?? []}
            onTemplatesChange={handleActuationTemplatesChange}
            focusId={agendaFocusId}
            onGoToPlan={() => setView("plan")}
          />
          </WorkspaceDisclosure>
        )}

        {/* ── ⑨ Evaluación — espacio canónico (pendiente de implementación) */}
        {view === "evaluacion" && (
          <WorkspaceDisclosure title="Seguimiento e informe de evaluación">
          <section className="workspace-panel">
            <p className="eyebrow">Evaluación del Plan · {municipality.name}</p>
            <h2>Evaluación del Plan Local de Salud</h2>
            <p className="panel-note">
              El Informe de Evaluación valora el grado de cumplimiento del Plan Local de Salud,
              los resultados alcanzados y las recomendaciones para el ciclo siguiente. Puede
              realizarse de forma anual, bianual, trianual o como evaluación final del plan.
            </p>
            <p className="panel-note">
              Este espacio estará disponible cuando el Plan Local de Salud se encuentre en
              fase de seguimiento y evaluación.
            </p>
          </section>
          </WorkspaceDisclosure>
        )}

        {/* ── Gestor de Encuestas de Salud (GES) */}
        {view === "ges" && (
          <WorkspaceDisclosure title="Proyectos de encuesta">
          <GESPanel
            key={municipality.id}
            onPreparationDirtyChange={onPreparationDirtyChange}
            projects={workspace.questionnaireProjects ?? []}
            projectDatasetImports={workspace.projectDatasetImports}
            municipalityName={municipality.name}
            onAddProject={handleAddQuestionnaireProject}
            onUpdateProject={handleUpdateQuestionnaireProject}
            onDeleteProject={handleDeleteQuestionnaireProject}
            onImportProjectDataset={handleImportProjectDataset}
            isImportingProjectDataset={isImportingProjectDataset}
            importProjectDatasetMessage={importProjectDatasetMessage}
          />
          </WorkspaceDisclosure>
        )}

          </section>
        )}
      </main>

      <footer className="app-persistence-footer" aria-label="Herramientas de custodia del expediente">
        <WorkspacePersistenceIndicator
          localMessage={persistenceMessage}
          remoteMessage={remotePersistenceMessage}
          signedIn={remoteClient.auth.currentUser !== null}
        >
          <BackupPanel workspace={workspace} ready />
          <CurrentSourcesPanel
            plan={currentSourcesPlan}
            municipalityName={municipality.name}
            disabled={remoteHydratedMunicipalityId !== workspace.municipality.identity.id}
            onApply={() => {
              const now = new Date().toISOString();
              setWorkspace(prev => prev.municipality.identity.id !== workspace.municipality.identity.id
                ? prev
                : applyCurrentSourcesConsolidation(prev, planCurrentSourcesConsolidation(prev), now));
            }}
          />
          <RemoteSyncPanel client={remoteClient} />
        </WorkspacePersistenceIndicator>
      </footer>

      <ThematicPrioritisationModal
        isOpen={isThematicModalOpen}
        topics={THEMATIC_TOPICS}
        selectedIds={pendingTopics}
        savedIds={runtime.workspace.thematicPrioritisation?.selectedTopicIds ?? []}
        study={runtime.workspace.thematicPrioritisationStudy}
        isImporting={isImportingTP}
        importMessage={tpImportMessage}
        onToggle={handleTopicToggle}
        onSave={handleSaveThematicPrioritisation}
        onClose={handleCloseThematicModal}
        onImportCSV={handleImportThematicCSV}
        onApplyTopFive={handleApplyTopFive}
      />
    </DocumentationProvider>
  );
}
