import { authoredToProposals, buildReadingUnitProposals } from "./application/proposals";
import { InitialLocalHealthPlanPanel } from "./ui/components/InitialLocalHealthPlanPanel";
import { DeleteWorkspaceDialog } from "./ui/components/DeleteWorkspaceDialog";
import { InstitutionalLogoBand } from "./ui/components/InstitutionalLogoBand";
import { replaceZaidinFinalDraft } from "./application/workspace/replaceZaidinFinalDraft";
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
import { profileSourceChanged } from './application/health-profile/profileSourceChanged';
import { DocumentAccess } from './ui/components/DocumentAccess.tsx';
import type { PlanPreparationDraft } from "./domain/action-plan-catalog/PlanPreparationDraft";
import { worksheetKey, type IndicatorWorksheet } from "./domain/action-plan-catalog/IndicatorWorksheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CycleConciliation,
  type AssetValidationDeclaration,
  type ProposalDecision,
  type AuthoredProposal,
  type DocumentCycle,
  type DocumentKind,
  type MunicipalDocument,
  type MunicipalDocumentRepository,
  addMunicipalDocument,
  setMunicipalDocumentCycle,
  addCycleConciliation,
  addAssetValidation,
  addProposalDecision,
  addAuthoredProposal,
  removeAuthoredProposal,
  removeAssetValidation,
  removeCycleConciliation,
  replaceMunicipalDocumentByKind,
  removeMunicipalDocument,
} from "./domain/repository";
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
  shouldReplaceWithSeed,
  shouldRestoreIndexedDbWorkspace,
  applySeedDocumentMigration,
  backfillSeedMigrationMarker,
  resolveSeedMigration,
  readActiveMunicipalityId,
  saveActiveMunicipalityId,
  sanitizeCustomMunicipalities,
  mergeMunicipalityCatalog,
  type WorkspaceLoadResult,
  type SeedDocumentMigration,
} from "./appWorkspaceHydration";
import { createMunicipalityRuntime } from "./application/runtime";
import { ingestManualDocument, extractDocxText, removeEquivalentStrategicFramework } from "./application/document-ingestion";
import { assetEntriesOfDocument } from "./application/evidence-pipeline";
import {
  assignLibraryDocumentToWorkspace,
  collectCompasDocumentLibrary,
  libraryDocumentAssignmentId,
  type CompasLibraryDocument,
} from "./application/document-library";
// buildLocalHealthProfile is now called inside MunicipalityRuntime — not needed here.
import {
  computePerfilEpistemicMetrics,
  buildDiagnosticAnswers,
  excludeHistoricalSources,
  serializeValidatedAnswers,
  parseValidatedAnswersSnapshot,
  selectDocumentPreviewContext,
} from "./application/health-profile";
import type { DiagnosticAnswers } from "./application/health-profile";
import type { PerfilLocalDeSalud } from "./domain/health-profile";

/**
 * DiagnosticAnswers desde el workspace, con la convención ÚNICA de derivación del
 * expediente: `determinantTitles` de los átomos `determinant` y `assets` de los
 * átomos `asset`. Helper puro compartido por el flujo de compilación
 * (`handleCompilePSL`) y por la vista viva (`LocalHealthProfileView`), para que
 * ambos alimenten exactamente los mismos answers y el artefacto congelado reciba
 * `canonicalDocument`/`readingStatus`.
 */
function buildWorkspaceDiagnosticAnswers(
  workspace: MunicipalityWorkspace
): DiagnosticAnswers {
  // Las listas salen solo de las fuentes del ciclo actual; los antecedentes los
  // calcula buildDiagnosticAnswers con el expediente completo.
  const current = excludeHistoricalSources(workspace);
  return buildDiagnosticAnswers({
    workspace,
    determinantTitles: current.evidenceStore.atoms
      .filter((a) => a.kind === "determinant")
      .map((a) => a.title),
    assets: current.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
}
import {
  createHealthReportDocumentFromDocx,
  createHealthReportDocumentFromPdf,
} from "./application/health-report";
import { parseIBSECSV, ibseStudyToEvidenceAtoms } from "./application/ibse";
import { ageBandsForMunicipality } from "./application/sam";
import { createIBSEStudy } from "./domain/ibse";
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
import { stableAssetKey, upsertEvidenceAtom, type EvidenceAtom } from "./domain/evidence";
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
import { loadMunicipalitySeed } from "./infrastructure/seeds";
import { createBrowserRelasClient } from "./infrastructure/relas/BrowserRelasClient";
import {
  clearRemoteTombstone,
  deleteRemoteWorkspace,
  hasRemoteWorkspace,
  readRemoteTombstones,
  readRemoteWorkspace,
  saveRemoteWorkspace,
} from "./infrastructure/relas/RemoteWorkspace";
import { RemoteSyncPanel } from "./ui/components/RemoteSyncPanel";
import { syncRemoteCatalog } from "./application/remote-catalog/syncRemoteCatalog";
import { loadLocalWorkspaces } from "./infrastructure/persistence/local-workspaces";
import { listTerritorialSpaces } from "./infrastructure/relas/AdminAccounts";
import { readAccessProfile } from "./infrastructure/relas/RelasClient";

import { compileLocalHealthProfile } from "./application/health-profile-compiler";
import { readSealedCanonicalDocument } from "./application/psl-c-canonical";
import { approvePSL, invalidatePSL } from "./application/institutional-lifecycle";
import { createDeliberativePrioritySelection } from "./domain/deliberative-prioritisation";
import {
  validateModuleReview,
  isModuleReviewStale,
  type MunicipalActionPlanModuleReview,
} from "./domain/action-plan-catalog";

import {
  LocalHealthPlanningCycle,
  DocumentIngestionPanel,
  DocumentRepositoryPanel,
  EvidenceStorePanel,
  HealthReportViewer,
  EstudiosComplementariosPanel,
  ActivosSaludPanel,
  ProposalReviewMode,
  LocalHealthProfileView,
  ThematicPrioritisationPanel,
  CitizenParticipationSummary,
  ThematicPrioritisationModal,
  PipelineTracePanel,
  LT1Panel,
  OITPanel,
  ReconciliacionPanel,
  PrioritizationPanel,
  NHSHealthProfileView,
  LecturaEstrategicaView,
  PAIView,
  DeliberativePrioritySelectionPanel,
  ActionPlanCatalogPanel,
  GESPanel,
  PerfilLocalDeSaludPanel,
  PerfilFuentesPanel,
  LocalHealthPlanOutline,
  AgendaBoard,
} from "./ui/components";
import type { AgendaActuation } from "./domain/agenda/AgendaActuation";
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
  // Distrito inframunicipal — sin código INE propio. BADEA solo como contexto de Granada capital (18087).
  { id: "granada-zaidin", name: "Granada-Zaidín",       province: "Granada", territorialType: "distrito", createdBy: "COMPÁS" },
  { id: "loja",            name: "Loja",                  province: "Granada", ineCode: "18122", createdBy: "COMPÁS" },
  { id: "zagra",          name: "Zagra",               province: "Granada", ineCode: "18913", createdBy: "COMPÁS" },
];
const DEMO_MUNICIPALITY_IDS = DEMO_MUNICIPALITIES.map((municipality) => municipality.id);

const CUSTOM_MUNICIPALITIES_KEY = "compas-ng:custom-municipalities";
const DELETED_MUNICIPALITIES_KEY = "compas-ng:deleted-municipalities";
function readDeletedMunicipalityIds(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(DELETED_MUNICIPALITIES_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
const DEFAULT_MUNICIPALITY_ID = "granada-zaidin";
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
  ).filter((municipality) => !readDeletedMunicipalityIds().includes(municipality.id));
  const fallback =
    municipalities.find((municipality) => municipality.id === DEFAULT_MUNICIPALITY_ID) ??
    municipalities[0] ?? DEMO_MUNICIPALITIES[0];
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
// Vistas eliminadas de la navegación principal pero accesibles para desarrollo:
// "analisis" (D-002) y "lectura" (D-004).

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

function isIBSEDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, IBSE_DOCUMENT_TAG);
}

function isDUKEDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, DUKE_DOCUMENT_TAG);
}

function isPREDIMEDDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, PREDIMED_DOCUMENT_TAG);
}

function isSF12Document(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, SF12_DOCUMENT_TAG);
}

function isSuenoDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, SUENO_DOCUMENT_TAG);
}

function isCAGEDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, CAGE_DOCUMENT_TAG);
}

function isAUDITCDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, AUDITC_DOCUMENT_TAG);
}

function isIPAQDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, IPAQ_DOCUMENT_TAG);
}

function isGHQ12Document(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, GHQ12_DOCUMENT_TAG);
}

function isPHQ9Document(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, PHQ9_DOCUMENT_TAG);
}

function isPSQIDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, PSQI_DOCUMENT_TAG);
}

function isFagerstromDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, FAGERSTROM_DOCUMENT_TAG);
}

function isSBQDocument(document: MunicipalDocument | undefined): boolean {
  return hasDocumentTag(document, SBQ_DOCUMENT_TAG);
}

function isThematicPrioritisationDocument(
  document: MunicipalDocument | undefined
): boolean {
  return hasDocumentTag(document, THEMATIC_PRIORITISATION_DOCUMENT_TAG);
}

function removeDocumentsByTag(
  repository: MunicipalDocumentRepository,
  tag: string
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  return {
    ...repository,
    documents: repository.documents.filter((document) => !document.tags.includes(tag)),
    updatedAt: now,
  };
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
  const [planTab, setPlanTab] = useState<"lineas" | "resultante" | "lectura" | "prioridades" | "borrador">("lineas");
  const preparationDirtyRef = useRef(false);
  const onPreparationDirtyChange = useCallback((dirty: boolean) => { preparationDirtyRef.current = dirty; }, []);
  function canLeavePreparation() {
    return !preparationDirtyRef.current || window.confirm("Hay cambios sin guardar en la propuesta de recogida. ¿Quieres descartarlos y continuar?");
  }
  function setView(next: AppView) {
    if (next === view || !canLeavePreparation()) return;
    setViewState(next);
  }
  const remoteClient = useMemo(() => createBrowserRelasClient(), []);
  const [remoteHydratedMunicipalityId, setRemoteHydratedMunicipalityId] =
    useState<string | null>(null);
  const [remotePersistenceMessage, setRemotePersistenceMessage] =
    useState<string | null>(null);
  const [showMunicipalitySelector, setShowMunicipalitySelector] = useState(false);
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
  const [workspace, setWorkspace] = useState<MunicipalityWorkspace>(() =>
    // `backfill-marker` es local y determinista: se aplica de forma síncrona en la
    // carga, sin descargar el seed. `download-and-merge` viaja en `pendingMigration`.
    initialWorkspaceLoad.seedMigration.kind === "backfill-marker"
      ? backfillSeedMigrationMarker(
          initialWorkspaceLoad.workspace,
          initialWorkspaceLoad.seedMigration.migration
        )
      : initialWorkspaceLoad.workspace
  );
  // Migración incremental pendiente de descarga+fusión para el municipio actual
  // (p. ej. añadir doc-localiza-atarfe y sus 5 átomos a un Atarfe ya persistido).
  const [pendingMigration, setPendingMigration] = useState<SeedDocumentMigration | null>(
    initialWorkspaceLoad.seedMigration.kind === "download-and-merge"
      ? initialWorkspaceLoad.seedMigration.migration
      : null
  );
  const protectedEmptyWorkspaceIdRef = useRef<string | null>(
    initialWorkspaceLoad.protectExistingStorage
      ? initialWorkspaceLoad.workspace.municipality.identity.id
      : null
  );
  // Municipio cuyo expediente se está hidratando de forma asíncrona desde su seed
  // canónico. Mientras esté fijado, el placeholder vacío NO se persiste.
  const [pendingSeedId, setPendingSeedId] = useState<string | null>(
    initialWorkspaceLoad.seedPending
      ? initialWorkspaceLoad.workspace.municipality.identity.id
      : null
  );
  const [pendingIndexedDbHydrationId, setPendingIndexedDbHydrationId] =
    useState<string | null>(
      initialWorkspaceLoad.workspace.municipality.identity.id
    );
  const locallyDeletedWorkspaceIdsRef = useRef<Set<string>>(new Set(readDeletedMunicipalityIds()));

  useEffect(() => {
    if (pendingSeedId || protectedEmptyWorkspaceIdRef.current === workspace.municipality.identity.id) return;
    setWorkspace(previous => replaceZaidinFinalDraft(previous));
  }, [workspace, pendingSeedId]);

  const [title, setTitle] = useState("");
  const [declaresOpenAnswers, setDeclaresOpenAnswers] = useState(false);
  const [plainText, setPlainText] = useState("");
  const [kind, setKind] = useState<DocumentKind>("territorial-documentation");
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
    // Carrera de hidratación: mientras se carga el seed del municipio, NO se
    // persiste el placeholder vacío. Si se guardara, la comprobación "no hay
    // expediente local" fallaría y el seed nunca se cargaría, dejando el
    // expediente vacío de forma permanente.
    if (locallyDeletedWorkspaceIdsRef.current.has(workspace.municipality.identity.id)) return;
    if (
      shouldSkipPersistence({
        workspaceMunicipalityId: workspace.municipality.identity.id,
        pendingSeedId,
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
  }, [workspace, pendingSeedId, pendingIndexedDbHydrationId]);

  useEffect(() => {
    if (pendingIndexedDbHydrationId === null) return;
    const targetMunicipalityId = pendingIndexedDbHydrationId;
    let cancelled = false;
    void loadWorkspaceFromIndexedDB(targetMunicipalityId).then((stored) => {
      if (cancelled) return;
      if (stored !== null) {
        setWorkspace((current) => {
          if (!shouldRestoreIndexedDbWorkspace(current, stored)) return current;
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
        uploadWorkspace: (ws) => saveRemoteWorkspace(remoteClient, ws),
        localWorkspaces: loadLocalWorkspaces,
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
    setRemoteHydratedMunicipalityId(null);
    setRemotePersistenceMessage("Comprobando el expediente compartido…");
    void readRemoteWorkspace(remoteClient, municipalityId)
      .then((remoteWorkspace) => {
        if (cancelled) return;
        if (remoteWorkspace !== null) {
          setWorkspace((current) => {
            if (!shouldRestoreIndexedDbWorkspace(current, remoteWorkspace)) {
              return current;
            }
            queueMicrotask(() => {
              setPendingTopics([
                ...(remoteWorkspace.thematicPrioritisation?.selectedTopicIds ?? []),
              ]);
            });
            return remoteWorkspace;
          });
        }
        setRemotePersistenceMessage(
          remoteWorkspace === null
            ? "No existe todavía una copia compartida; se creará con este expediente."
            : "Expediente compartido recuperado."
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRemotePersistenceMessage(
          error instanceof Error
            ? `No se pudo recuperar la copia compartida: ${error.message}`
            : "No se pudo recuperar la copia compartida."
        );
      })
      .finally(() => {
        if (!cancelled) setRemoteHydratedMunicipalityId(municipalityId);
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
      pendingSeedId === municipalityId
    ) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setRemotePersistenceMessage("Guardando el expediente compartido…");
      void saveRemoteWorkspace(remoteClient, workspace)
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
    pendingSeedId,
    remoteClient,
    remoteHydratedMunicipalityId,
    workspace,
  ]);

  // Hidratación asíncrona del expediente municipal desde su seed canónico. Solo se
  // activa cuando `pendingSeedId` está fijado (no había expediente local y existe
  // seed). Nunca sobreescribe trabajo del usuario ni un expediente local existente.
  useEffect(() => {
    if (pendingSeedId === null) return;
    const seedMunicipalityId = pendingSeedId;
    let cancelled = false;
    void loadMunicipalitySeed(seedMunicipalityId, {
      baseUrl: import.meta.env.BASE_URL,
    }).then((seedWorkspace) => {
      if (cancelled) return;
      if (seedWorkspace !== null) {
        // No sobreescribir contenido real: solo sustituir un placeholder VACÍO del
        // mismo municipio. Cubre tanto el placeholder recién creado en memoria como
        // el placeholder de la versión anterior ya persistido en localStorage
        // (migración): en ambos casos el workspace en memoria está vacío.
        setWorkspace((current) => {
          if (shouldReplaceWithSeed(current, seedMunicipalityId)) {
            return seedWorkspace;
          }
          if (current.municipality.identity.id !== seedMunicipalityId) {
            return current;
          }
          const migration = resolveSeedMigration(current);
          if (
            migration.kind === "download-and-merge" &&
            migration.migration.municipalityId === seedMunicipalityId
          ) {
            return applySeedDocumentMigration(
              current,
              seedWorkspace,
              migration.migration
            );
          }
          if (
            migration.kind === "backfill-marker" &&
            migration.migration.municipalityId === seedMunicipalityId
          ) {
            return backfillSeedMigrationMarker(current, migration.migration);
          }
          return current;
        });
      }
      // Éxito o fallo, la hidratación termina: se libera el guard de persistencia.
      // Si falló (municipio sin seed real), el placeholder vacío pasará a guardarse.
      setPendingSeedId((currentPending) =>
        currentPending === seedMunicipalityId ? null : currentPending
      );
    });
    return () => {
      cancelled = true;
    };
  }, [pendingSeedId]);

  // Migración incremental (`download-and-merge`): descarga el seed del municipio y
  // añade ÚNICAMENTE el documento de la migración y sus átomos derivados, con la
  // marca versionada, sin reemplazar el expediente ni tocar el trabajo del usuario.
  // Se activa solo cuando `pendingMigration` está fijado. Si la descarga falla, NO
  // se estampa la marca: se reintentará en la próxima carga del municipio.
  useEffect(() => {
    if (pendingMigration === null) return;
    const migration = pendingMigration;
    let cancelled = false;
    void loadMunicipalitySeed(migration.municipalityId, {
      baseUrl: import.meta.env.BASE_URL,
    }).then((seedWorkspace) => {
      if (cancelled) return;
      if (seedWorkspace !== null) {
        setWorkspace((current) =>
          current.municipality.identity.id === migration.municipalityId
            ? applySeedDocumentMigration(current, seedWorkspace, migration)
            : current
        );
      }
      // Éxito o fallo, la migración termina. Si falló (seed inaccesible), la marca
      // no se estampó y `resolveSeedMigration` volverá a proponerla más adelante.
      setPendingMigration((currentPending) =>
        currentPending === migration ? null : currentPending
      );
    });
    return () => {
      cancelled = true;
    };
  }, [pendingMigration]);

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

  // ── PSL lifecycle actions ────────────────────────────────────────────────────

  const handleValidatePSL = useCallback((validatedBy: string) => {
    const now = new Date().toISOString();
    const validatedPSL = {
      ...runtime.psl,
      status: "validated" as const,
      validatedAt: now,
      validatedBy: validatedBy.trim() || "Equipo técnico",
    };
    setWorkspace((prev) => ({
      ...prev,
      validatedPSL,
      // CONV-A · congela ATÓMICAMENTE el snapshot de answers (payload opaco) junto
      // al PSL validado, para que preview y compilación consuman el mismo snapshot
      // semántico (psl + answers) y no se recombine con answers vivos.
      validatedAnswersSnapshot: serializeValidatedAnswers(
        buildWorkspaceDiagnosticAnswers(prev)
      ),
      updatedAt: now,
    }));
  }, [runtime.psl, setWorkspace]);

  const handleInvalidatePSL = useCallback(() => {
    const current = workspace.validatedPSL;
    if (current === undefined || current.status !== "validated") return;
    if (
      !window.confirm(
        "La validación técnica se retirará y el Perfil volverá a revisión.\n\n" +
        "Se conservarán íntegramente las conclusiones, el cierre interpretativo, " +
        "la deliberación y los documentos compilados anteriores. Para volver a usar " +
        "el Perfil como versión vigente habrá que validarlo de nuevo.\n\n" +
        "¿Retirar la validación técnica?"
      )
    ) {
      return;
    }
    setWorkspace((prev) => {
      if (prev.validatedPSL === undefined) return prev;
      const result = invalidatePSL({ psl: prev.validatedPSL });
      if (!result.ok) return prev;
      return {
        ...prev,
        validatedPSL: result.reviewedPSL,
        updatedAt: result.invalidatedAt,
      };
    });
  }, [setWorkspace, workspace.validatedPSL]);

  const handleEditPSLConclusion = useCallback((content: string) => {
    setWorkspace((prev) => {
      if (!prev.validatedPSL) return prev;
      return {
        ...prev,
        validatedPSL: {
          ...prev.validatedPSL,
          conclusiones: { ...prev.validatedPSL.conclusiones, content, status: "authored" as const },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleEditPSLCierreInterpretativo = useCallback((content: string) => {
    setWorkspace((prev) => {
      if (!prev.validatedPSL) return prev;
      return {
        ...prev,
        validatedPSL: {
          ...prev.validatedPSL,
          cierreInterpretativo: { ...prev.validatedPSL.cierreInterpretativo, content, status: "authored" as const },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleDocumentarDeliberacion = useCallback((nota: string) => {
    setWorkspace((prev) => {
      if (!prev.validatedPSL) return prev;
      const consenso = nota.trim().length > 0;
      return {
        ...prev,
        validatedPSL: {
          ...prev.validatedPSL,
          priorizacion: {
            ...prev.validatedPSL.priorizacion,
            deliberacionNota: nota,
            consensoDocumentado: consenso,
          },
          priorizacionStatus: consenso ? "complete" as const : prev.validatedPSL.priorizacionStatus,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleCompilePSL = useCallback(() => {
    setWorkspace((prev) => {
      const psl = prev.validatedPSL;
      // CONV-A · la compilación consume el MISMO snapshot deserializado que la
      // preview (no answers vivos). Sin PSL validado o con payload
      // ausente/ilegible/inválido no se compila: revalidación requerida.
      const answers = parseValidatedAnswersSnapshot(prev.validatedAnswersSnapshot);
      if (!psl || answers === null || profileSourceChanged(psl, prev)) return prev;
      const result = compileLocalHealthProfile({
        psl,
        // Puente del espacio de conocimiento: sin él, el artefacto congelado
        // no registra EKC, hipótesis ni preguntas abiertas del técnico.
        perfil: prev.perfilLocalDeSalud,
        municipalityName: prev.municipality.identity.name,
        municipalityProvince: prev.municipality.identity.province,
        existingArtifactCount: prev.compiledProfiles?.length ?? 0,
        // Congela el documento canónico (esquema 2) desde el snapshot validado:
        // vivo ≡ sellado por construcción (mismo psl + answers que la preview).
        diagnosticAnswers: answers,
      });
      if (!result.ok) return prev;
      return {
        ...prev,
        compiledProfiles: [...(prev.compiledProfiles ?? []), result.artifact],
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleApprovePSL = useCallback((
    approvedBy: string,
    approvedByRole: "coordination" | "group-motor",
    approvingBody: string,
  ) => {
    setWorkspace((prev) => {
      const psl = prev.validatedPSL;
      if (!psl || profileSourceChanged(psl, prev)) return prev;
      const result = approvePSL({ psl, approvedBy, approvedByRole, approvingBody });
      if (!result.ok) return prev;
      return {
        ...prev,
        validatedPSL: result.approvedPSL,
        pslApproval: result.approvalRecord,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [setWorkspace]);

  const handleUpdatePerfilLocalDeSalud = useCallback((perfil: PerfilLocalDeSalud) => {
    setWorkspace(prev => ({ ...prev, perfilLocalDeSalud: perfil }));
  }, [setWorkspace]);

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

  const handlePlanPreparationChange = useCallback((draft: PlanPreparationDraft) => {
    setWorkspace(prev => draft.municipalityId !== prev.municipality.identity.id ? prev : ({...prev,
      planPreparationDrafts: [...(prev.planPreparationDrafts ?? []).filter(item =>
        item.moduleId !== draft.moduleId || item.municipalityId !== draft.municipalityId
      ), draft],
      updatedAt: new Date().toISOString(),
    }));
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
      .filter((municipality) => !readDeletedMunicipalityIds().includes(municipality.id)),
    [customMunicipalities]
  );
  catalogIdsRef.current = new Set(allMunicipalities.map((m) => m.id));
  activeIdRef.current = municipality.id;
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
    // community-asset es un tipo canónico: una sola versión activa por municipio.
    // Se eliminan entradas previas del mismo tipo antes de registrar la nueva.
    // community-asset y localiza-salud son tipos canónicos: una sola versión activa por municipio.
    // Se eliminan entradas y átomos previos del mismo tipo antes de registrar la nueva.
    const repositoryForIngestion =
      kind === "community-asset" || kind === "localiza-salud"
        ? {
            ...workspace.repository,
            documents: workspace.repository.documents.filter(
              (d) => d.kind !== kind
            ),
          }
        : workspace.repository;

    const evidenceStoreForIngestion =
      kind === "community-asset"
        ? {
            ...workspace.evidenceStore,
            atoms: workspace.evidenceStore.atoms.filter(
              (a) => a.provenance.origin !== "community-assets"
            ),
            updatedAt: new Date().toISOString(),
          }
        : kind === "localiza-salud"
        ? {
            ...workspace.evidenceStore,
            atoms: workspace.evidenceStore.atoms.filter(
              (a) => a.provenance.origin !== "localiza-salud"
            ),
            updatedAt: new Date().toISOString(),
          }
        : workspace.evidenceStore;

    const result = ingestManualDocument({
      repository: repositoryForIngestion,
      evidenceStore: evidenceStoreForIngestion,
      kind,
      title,
      plainText,
      structure: declaresOpenAnswers ? "open-answers" : undefined,
    });

    if (result === null) return;

    setWorkspace((prev) => ({
      ...prev,
      repository: result.repository,
      evidenceStore: result.evidenceStore,
      updatedAt: new Date().toISOString(),
    }));
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

  function handleAddAuthoredProposal(proposal: Omit<AuthoredProposal, "authoredAt">) {
    setWorkspace((prev) => ({
      ...prev,
      repository: addAuthoredProposal(prev.repository, { ...proposal, authoredAt: new Date().toISOString() }),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleRemoveAuthoredProposal(proposalId: string) {
    setWorkspace((prev) => ({
      ...prev,
      repository: removeAuthoredProposal(prev.repository, proposalId),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleProposalDecision(decision: ProposalDecision) {
    setWorkspace((prev) => ({
      ...prev,
      repository: addProposalDecision(prev.repository, decision),
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

  function handleRemoveAssetValidation(validationId: string) {
    setWorkspace((prev) => ({
      ...prev,
      repository: removeAssetValidation(prev.repository, validationId),
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleLoadHealthReport(file: File): Promise<void> {
    // .doc binario (Word 97-2003) no soportado por mammoth.
    const isLegacyDoc = /\.doc$/i.test(file.name) && !/\.docx$/i.test(file.name);
    if (isLegacyDoc) {
      setLastHealthReportMessage(
        "El formato .doc (binario) no puede procesarse. Convierte el fichero a .docx y vuelve a cargarlo."
      );
      return;
    }

    const isPdf = /\.pdf$/i.test(file.name);
    if (!isPdf && !/\.docx$/i.test(file.name)) { setLastHealthReportMessage("Sube un fichero PDF o DOCX."); return; }

    setIsLoadingHealthReport(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      // Normalizar título: quitar extensión y convertir guiones/subrayados a espacios
      const rawName = file.name
        .replace(/\.(docx?|pdf)$/i, "")
        .replace(/[-_]/g, " ");
      const docTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);
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

      // D-HR-01: health-report nunca genera EvidenceAtom, ni DOCX ni PDF.
      // El EvidenceStore se limpia de átomos residuales de versiones anteriores.
      setWorkspace((prev) => prev.municipality.identity.id !== municipalityId ? prev : ({
        ...prev,
        previousHealthReports: prev.healthReport ? [...(prev.previousHealthReports ?? []),prev.healthReport] : prev.previousHealthReports,
        repository: replaceMunicipalDocumentByKind({...prev.repository, documents: prev.repository.documents.map(d => d.kind === "health-report" ? {...d,kind:"other" as const,status:"archived" as const} : d)}, newDocInput),
        healthReport,
        evidenceStore: {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (a) => a.provenance.origin !== "health-report"
          ),
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      }));
      setLastHealthReportMessage(
        (healthReport.body.charCount > 0 ? `Informe procesado: ${healthReport.body.charCount.toLocaleString("es-ES")} caracteres disponibles para la lectura del Perfil. ` : "Original conservado, sin texto extraíble; requiere transcripción u OCR. ") +
        "Preservado en el Repositorio documental. " +
        "Puedes descargar el original desde el catálogo completo de documentos de este navegador."
      );
    } catch (err) {
      console.error("[health-report-load-error]", err);
      setLastHealthReportMessage(
        isPdf
          ? "Error al procesar el PDF. Verifica que sea un PDF válido y no esté protegido."
          : "Error al cargar el informe. Si el documento procede de LibreOffice/OpenDocument, verifica que se haya exportado correctamente a .docx. Los ficheros muy grandes o con muchas imágenes pueden requerir más tiempo."
      );
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

  // The bundled Zaidín PDF was previously registered without text. Process it once
  // when encountered; never replace later reports or validated snapshots.
  useEffect(() => {
    const report = workspace.healthReport;
    if (!report || report.body.charCount || report.pdfExtraction || isLoadingHealthReport || pendingSeedId) return;
    const source = workspace.repository.documents.find(d => d.id === report.linkedDocumentId)?.source.url;
    if (!source || !Object.hasOwn(bundledDocuments, source) || !/\.pdf$/i.test(report.sourceFileName)) return;
    const key = workspace.municipality.identity.id + ':' + report.id;
    if (reportProcessingAttempts.current.has(key)) return;
    reportProcessingAttempts.current.add(key);
    void handleProcessExistingHealthReport();
  }, [workspace.healthReport, workspace.municipality.identity.id, workspace.repository.documents, pendingSeedId, isLoadingHealthReport, handleProcessExistingHealthReport]);

  // ── Carga de archivo para tipos documentales con extracción de texto ─────────
  // Aplica a: strategic-framework, territorial-documentation, qualitative-material.
  // DOCX → extrae texto vía mammoth → genera EvidenceAtoms del tipo correspondiente.
  // PDF → extrae texto; si no lo hay, conserva la referencia e informa de la limitación.
  // D-HR-01 no aplica aquí: estos tipos SÍ pueden generar EvidenceAtoms.
  async function handleLoadDocumentFile(file: File): Promise<void> {
    const isLegacyDoc = /\.doc$/i.test(file.name) && !/\.docx$/i.test(file.name);
    if (isLegacyDoc) {
      setDocumentFileMessage(
        "El formato .doc (binario) no puede procesarse. Convierte el fichero a .docx y vuelve a cargarlo."
      );
      return;
    }

    const isDocx = /\.docx$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    if (!isDocx && !isPdf) {
      setDocumentFileMessage(
        "Formato no admitido. Sube un fichero .docx o .pdf."
      );
      return;
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
      const extractedText = isDocx ? await extractDocxText(arrayBuffer) : (await extractPdfText(arrayBuffer)).text;
      if (isDocx || extractedText.trim()) {
        const plainText = extractedText;

        if (plainText.trim().length === 0) {
          setDocumentFileMessage(
            "El fichero DOCX no contiene texto extraíble. Pega el contenido manualmente en el área de texto."
          );
          return;
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
            kind === "strategic-framework"
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
            kind,
            title: docTitle,
            plainText,
            sourceFileName: file.name,
            sourceSystem: isDocx ? "Archivo DOCX cargado" : "Texto extraído de PDF, con marcas de página",
            documentId,
            structure: declaresOpenAnswers ? "open-answers" : undefined,
          });

          if (result === null) return prev;

          queueMicrotask(() => {
            setLastProcessedDocument(result.document);
            setLastAtomCount(result.atomsCreated);
            setDocumentFileMessage(
              declaresOpenAnswers && result.atomsCreated === 0
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
            kind === "strategic-framework"
              ? removeEquivalentStrategicFramework(prev.repository, {
                  title: docTitle,
                  sourceFileName: file.name,
                })
              : { repository: prev.repository, removedDocumentIds: [] };

          const nextRepository = addMunicipalDocument(replaced.repository, {
            id: documentId,
            kind: kind as DocumentKind,
            title: docTitle,
            source: {
              system: "Archivo PDF — referencia documental",
              collectedAt: new Date().toISOString(),
            },
            sourceFileName: file.name,
            canGenerateEvidence: false,
            tags: [kind],
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
    } catch (err) {
      console.error("[document-file-load-error]", err);
      setDocumentFileMessage(
        "Error al procesar el archivo. Verifica que sea un PDF o DOCX válido, no protegido ni dañado."
      );
    } finally {
      setIsLoadingDocumentFile(false);
      setDeclaresOpenAnswers(false);
    }
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

  async function handleLoadIBSECSV(file: File): Promise<void> {
    setIsLoadingIBSE(true);
    try {
      const text = await file.text();
      // Bandas de edad para recoger la distribución edad×sexo del CSV: las del padrón del
      // municipio si existe; si no, las quinquenales estándar (solo descriptivas).
      const sexAgeBands = ageBandsForMunicipality(workspace.municipality.identity.id);
      const { aggregates, methodologicalCautions, warnings, ageSexObserved } = parseIBSECSV(
        text,
        { ageBands: sexAgeBands }
      );
      const documentId = crypto.randomUUID();
      await saveOriginalFile(workspace.municipality.identity.id, documentId, file);
      const study = createIBSEStudy({
        municipalityId: workspace.municipality.identity.id,
        sourceFileName: file.name,
        aggregates,
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
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          IBSE_DOCUMENT_TAG
        );
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
        return {
          ...prev,
          repository: nextRepository,
          ibseStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setIbseMessage(
        aggregates.nValid > 0
          ? `IBSE cargado: ${aggregates.nValid} registros válidos · Media total: ${aggregates.meanTotal} · ${ibseAtoms.length} indicadores incorporados al análisis territorial.${warn}`
          : `CSV procesado sin registros válidos.${warn}`
      );
    } catch {
      setIbseMessage("Error al procesar el CSV. Verifica que sea una exportación REDCap válida.");
    } finally {
      setIsLoadingIBSE(false);
    }
  }

  async function handleLoadDUKECSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          DUKE_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `DUKE-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Apoyo social funcional (DUKE-UNC-11)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", DUKE_DOCUMENT_TAG, "eas"],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(DUKE_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of dukeAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          dukeStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setDukeMessage(
        aggregates.nValidGlobal > 0
          ? `DUKE-EAS cargado: ${aggregates.nValidGlobal} registros globales validos de ${aggregates.n}. Apoyo bajo global: ${aggregates.lowGlobalPercentage.toFixed(1)} %. ${dukeAtoms.length} evidencias incorporadas.${warn}`
          : `CSV DUKE-EAS procesado sin registros globales completos.${warn}`
      );
    } catch {
      setDukeMessage("Error al procesar el CSV. Verifica que incluya las columnas EAS P5701..P5711 con valores 1..5.");
    } finally {
      setIsLoadingDUKE(false);
    }
  }

  async function handleLoadPREDIMEDCSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          PREDIMED_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `PREDIMED-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Adherencia dieta mediterránea (PREDIMED-14)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", PREDIMED_DOCUMENT_TAG, "eas"],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(PREDIMED_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of predimedAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          predimedStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setPredimedMessage(
        aggregates.nValid > 0
          ? `PREDIMED-EAS cargado: ${aggregates.nValid} registros validos de ${aggregates.n}. Alta adherencia: ${aggregates.highPercentage.toFixed(1)} %. ${predimedAtoms.length} evidencias incorporadas.${warn}`
          : `CSV PREDIMED-EAS procesado sin registros completos.${warn}`
      );
    } catch {
      setPredimedMessage("Error al procesar el CSV. Verifica que incluya la columna Predimed o P36BPD01_2023..P36BPD14_2023.");
    } finally {
      setIsLoadingPREDIMED(false);
    }
  }

  async function handleLoadSF12CSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          SF12_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `SF-12 EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Salud percibida SF-12 (Vilagut et al. 2008)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", SF12_DOCUMENT_TAG, "eas"],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(SF12_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of sf12Atoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          sf12Study: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setSf12Message(
        aggregates.nValidPCS > 0
          ? `SF-12 EAS cargado: ${aggregates.nValidPCS} registros válidos de ${aggregates.n}. PCS media: ${aggregates.meanPCS.toFixed(1)} / MCS media: ${aggregates.meanMCS.toFixed(1)}. ${sf12Atoms.length} evidencias incorporadas.${warn}`
          : `CSV SF-12 EAS procesado sin registros válidos.${warn}`
      );
    } catch {
      setSf12Message("Error al procesar el CSV. Verifica que incluya las columnas PCS12_SP y MCS12_SP.");
    } finally {
      setIsLoadingSF12(false);
    }
  }

  async function handleLoadSuenoCSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          SUENO_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `Sueño EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Sueño (P33_R / P33A)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", SUENO_DOCUMENT_TAG, "eas"],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(SUENO_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of suenoAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          suenoStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setSuenoMessage(
        aggregates.nValidP33R > 0
          ? `Sueño EAS cargado: ${aggregates.nValidP33R} registros P33_R válidos de ${aggregates.n}. Sueño insuficiente: ${aggregates.pctInsufficientSleep.toFixed(1)} %. ${suenoAtoms.length} evidencias incorporadas.${warn}`
          : `CSV Sueño EAS procesado sin registros P33_R válidos.${warn}`
      );
    } catch {
      setSuenoMessage("Error al procesar el CSV. Verifica que incluya la columna P33_R.");
    } finally {
      setIsLoadingSueno(false);
    }
  }

  async function handleLoadCAGECSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          CAGE_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `CAGE-EAS - ${file.name}`,
          source: {
            system: "EAS microdatos — Consumo de alcohol (CAGE_R / CAGE)",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", CAGE_DOCUMENT_TAG, "eas"],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(CAGE_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of cageAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          cageStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setCageMessage(
        aggregates.nValidCAGER > 0
          ? `CAGE-EAS cargado: ${aggregates.nValidCAGER} registros CAGE_R válidos de ${aggregates.n}. Riesgo de alcoholismo: ${aggregates.pctRisk.toFixed(1)} % (n=${aggregates.nRisk}). ${cageAtoms.length} evidencias incorporadas.${warn}`
          : `CSV CAGE-EAS procesado sin registros CAGE_R válidos.${warn}`
      );
    } catch {
      setCageMessage("Error al procesar el CSV. Verifica que incluya la columna CAGE_R.");
    } finally {
      setIsLoadingCAGE(false);
    }
  }

  async function handleLoadAUDITCCSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          AUDITC_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "redcap-export",
          title: `AUDIT-C - ${file.name}`,
          source: {
            system: "Encuesta municipal propia — exportación REDCap",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", AUDITC_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(AUDITC_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of auditcAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          auditcStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setAuditcMessage(
        aggregates.nValid > 0
          ? `AUDIT-C cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Consumo de riesgo (≥4): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${auditcAtoms.length} evidencias incorporadas.${warn}`
          : `CSV AUDIT-C procesado sin registros con los 3 ítems completos.${warn}`
      );
    } catch {
      setAuditcMessage("Error al procesar el CSV. Verifica que incluya las columnas auditc_q1, auditc_q2 y auditc_q3.");
    } finally {
      setIsLoadingAUDITC(false);
    }
  }

  async function handleLoadIPAQCSV(file: File): Promise<void> {
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          IPAQ_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "complementary-study",
          title: `IPAQ-EAS - ${file.name}`,
          source: {
            system: "Encuesta Andaluza de Salud — campos derivados oficiales",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", IPAQ_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(IPAQ_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of ipaqAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          ipaqStudy: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      setIpaqMessage(
        aggregates.nValidIPAQ > 0 || aggregates.nValidP34AR > 0
          ? `IPAQ-EAS cargado: ${aggregates.nValidIPAQ} válidos IPAQ_DICO · alta actividad ${aggregates.pctHigh.toFixed(1)} % (n=${aggregates.nHigh}). Inactividad tiempo libre: ${aggregates.pctInactive.toFixed(1)} %. ${ipaqAtoms.length} evidencias incorporadas.${warn}`
          : `CSV IPAQ procesado sin registros válidos en IPAQ_DICO ni P34A_R.${warn}`
      );
    } catch {
      setIpaqMessage("Error al procesar el CSV. Verifica que incluya las columnas IPAQ_DICO y/o P34A_R.");
    } finally {
      setIsLoadingIPAQ(false);
    }
  }

  async function handleLoadGHQ12CSV(file: File): Promise<void> {
    setIsLoadingGHQ12(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseGHQ12CSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setGhq12Message(`CSV GHQ-12 procesado sin registros con los 12 ítems completos.${warn}`);
        return;
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(
          prev.repository,
          GHQ12_DOCUMENT_TAG
        );
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId,
          kind: "redcap-export",
          title: `GHQ-12 - ${file.name}`,
          source: {
            system: "Encuesta municipal propia — exportación REDCap",
            collectedAt: study.createdAt,
          },
          sourceFileName: file.name,
          tags: ["complementary-study", GHQ12_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) =>
              atom.municipalityId !== prev.municipality.identity.id ||
              !(
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(GHQ12_DOCUMENT_TAG)
              )
          ),
          updatedAt: now,
        };
        for (const atom of ghq12Atoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return {
          ...prev,
          repository: nextRepository,
          ghq12Study: study,
          evidenceStore: nextStore,
          updatedAt: now,
        };
      });
      setGhq12Message(
        `GHQ-12 cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Probable malestar (≥3): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${ghq12Atoms.length} evidencias incorporadas.${warn}`
      );
    } catch {
      setGhq12Message("Error al procesar el CSV. Verifica que incluya las columnas ghq12_q1 a ghq12_q12.");
    } finally {
      setIsLoadingGHQ12(false);
    }
  }

  async function handleLoadPHQ9CSV(file: File): Promise<void> {
    setIsLoadingPHQ9(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parsePHQ9CSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setPhq9Message(`CSV PHQ-9 procesado sin registros con los 9 ítems completos.${warn}`);
        return;
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(prev.repository, PHQ9_DOCUMENT_TAG);
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId, kind: "redcap-export",
          title: `PHQ-9 - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", PHQ9_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) => atom.municipalityId !== prev.municipality.identity.id ||
              !(atom.provenance.origin === "complementary-study" && atom.tags.includes(PHQ9_DOCUMENT_TAG))
          ),
          updatedAt: now,
        };
        for (const atom of phq9Atoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return { ...prev, repository: nextRepository, phq9Study: study, evidenceStore: nextStore, updatedAt: now };
      });
      setPhq9Message(
        `PHQ-9 cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Síntomas mod.+ (≥10): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${phq9Atoms.length} evidencias incorporadas.${warn}`
      );
    } catch {
      setPhq9Message("Error al procesar el CSV. Verifica que incluya las columnas phq9_q1 a phq9_q9.");
    } finally {
      setIsLoadingPHQ9(false);
    }
  }

  async function handleLoadPSQICSV(file: File): Promise<void> {
    setIsLoadingPSQI(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parsePSQICSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setPsqiMessage(`CSV PSQI procesado sin registros con los 7 componentes completos.${warn}`);
        return;
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(prev.repository, PSQI_DOCUMENT_TAG);
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId, kind: "redcap-export",
          title: `PSQI - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", PSQI_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) => atom.municipalityId !== prev.municipality.identity.id ||
              !(atom.provenance.origin === "complementary-study" && atom.tags.includes(PSQI_DOCUMENT_TAG))
          ),
          updatedAt: now,
        };
        for (const atom of psqiAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return { ...prev, repository: nextRepository, psqiStudy: study, evidenceStore: nextStore, updatedAt: now };
      });
      setPsqiMessage(
        `PSQI cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Mal dormidor (&gt;5): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${psqiAtoms.length} evidencias incorporadas.${warn}`
      );
    } catch {
      setPsqiMessage("Error al procesar el CSV. Verifica que incluya las columnas psqi_c1 a psqi_c7.");
    } finally {
      setIsLoadingPSQI(false);
    }
  }

  async function handleLoadFagerstromCSV(file: File): Promise<void> {
    setIsLoadingFagerstrom(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseFagerstromCSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setFagerstromMessage(`CSV Fagerström procesado sin registros con los 6 ítems completos.${warn}`);
        return;
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(prev.repository, FAGERSTROM_DOCUMENT_TAG);
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId, kind: "redcap-export",
          title: `Fagerström - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", FAGERSTROM_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) => atom.municipalityId !== prev.municipality.identity.id ||
              !(atom.provenance.origin === "complementary-study" && atom.tags.includes(FAGERSTROM_DOCUMENT_TAG))
          ),
          updatedAt: now,
        };
        for (const atom of fagerstromAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return { ...prev, repository: nextRepository, fagerstromStudy: study, evidenceStore: nextStore, updatedAt: now };
      });
      setFagerstromMessage(
        `Fagerström cargado: ${aggregates.nValid} fumadores activos de ${aggregates.n}. Dep. mod.+ (≥5): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). ${fagerstromAtoms.length} evidencias incorporadas.${warn}`
      );
    } catch {
      setFagerstromMessage("Error al procesar el CSV. Verifica que incluya las columnas ftnd_q1 a ftnd_q6.");
    } finally {
      setIsLoadingFagerstrom(false);
    }
  }

  async function handleLoadSBQCSV(file: File): Promise<void> {
    setIsLoadingSBQ(true);
    try {
      const text = await file.text();
      const { aggregates, methodologicalCautions, warnings } = parseSBQCSV(text);
      const warn = warnings.length > 0 ? ` Avisos: ${warnings.join(" ")}` : "";
      if (aggregates.nValid === 0) {
        setSbqMessage(`CSV SBQ procesado sin registros con los 9 ítems completos.${warn}`);
        return;
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
      setWorkspace((prev) => {
        const now = new Date().toISOString();
        const repositoryWithoutPrior = removeDocumentsByTag(prev.repository, SBQ_DOCUMENT_TAG);
        const nextRepository = addMunicipalDocument(repositoryWithoutPrior, {
          id: documentId, kind: "redcap-export",
          title: `SBQ - ${file.name}`,
          source: { system: "Encuesta municipal propia — exportación REDCap", collectedAt: study.createdAt },
          sourceFileName: file.name,
          tags: ["complementary-study", SBQ_DOCUMENT_TAG],
        });
        let nextStore = {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) => atom.municipalityId !== prev.municipality.identity.id ||
              !(atom.provenance.origin === "complementary-study" && atom.tags.includes(SBQ_DOCUMENT_TAG))
          ),
          updatedAt: now,
        };
        for (const atom of sbqAtoms) {
          const key = stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title);
          nextStore = upsertEvidenceAtom(nextStore, atom, key);
        }
        return { ...prev, repository: nextRepository, sbqStudy: study, evidenceStore: nextStore, updatedAt: now };
      });
      setSbqMessage(
        `SBQ cargado: ${aggregates.nValid} registros válidos de ${aggregates.n}. Alt. sedentario (&gt;8h): ${aggregates.pctPositive.toFixed(1)} % (n=${aggregates.nPositive}). Media: ${aggregates.meanHours.toFixed(2)} h/día. ${sbqAtoms.length} evidencias incorporadas.${warn}`
      );
    } catch {
      setSbqMessage("Error al procesar el CSV. Verifica que incluya las columnas sbq_q1 a sbq_q9.");
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
                removeDocumentsByTag(
                  prev.repository,
                  THEMATIC_PRIORITISATION_DOCUMENT_TAG
                ),
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

        return {
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

  function handleDeleteDocument(documentId: string) {
    void deleteOriginalFile(workspace.municipality.identity.id, documentId).catch(error => {
      window.alert('El registro se ha eliminado, pero no se pudo borrar su archivo original: ' + (error as Error).message);
    });
    const deletedDocument = workspace.repository.documents.find((d) => d.id === documentId);

    setLastProcessedDocument((prev) => (prev?.id === documentId ? null : prev));
    if (lastProcessedDocument?.id === documentId) {
      setLastAtomCount(0);
    }
    if (deletedDocument?.kind === "health-report") {
      setLastHealthReportMessage(null);
      setIsLoadingHealthReport(false);
    }
    if (isIBSEDocument(deletedDocument)) {
      setIbseMessage(null);
      setIsLoadingIBSE(false);
    }
    if (isDUKEDocument(deletedDocument)) {
      setDukeMessage(null);
      setIsLoadingDUKE(false);
    }
    if (isPREDIMEDDocument(deletedDocument)) {
      setPredimedMessage(null);
      setIsLoadingPREDIMED(false);
    }
    if (isSF12Document(deletedDocument)) {
      setSf12Message(null);
      setIsLoadingSF12(false);
    }
    if (isSuenoDocument(deletedDocument)) {
      setSuenoMessage(null);
      setIsLoadingSueno(false);
    }
    if (isCAGEDocument(deletedDocument)) {
      setCageMessage(null);
      setIsLoadingCAGE(false);
    }
    if (isAUDITCDocument(deletedDocument)) {
      setAuditcMessage(null);
      setIsLoadingAUDITC(false);
    }
    if (isIPAQDocument(deletedDocument)) {
      setIpaqMessage(null);
      setIsLoadingIPAQ(false);
    }
    if (isGHQ12Document(deletedDocument)) {
      setGhq12Message(null);
      setIsLoadingGHQ12(false);
    }
    if (isPHQ9Document(deletedDocument)) {
      setPhq9Message(null);
      setIsLoadingPHQ9(false);
    }
    if (isPSQIDocument(deletedDocument)) {
      setPsqiMessage(null);
      setIsLoadingPSQI(false);
    }
    if (isFagerstromDocument(deletedDocument)) {
      setFagerstromMessage(null);
      setIsLoadingFagerstrom(false);
    }
    if (isSBQDocument(deletedDocument)) {
      setSbqMessage(null);
      setIsLoadingSBQ(false);
    }
    if (isThematicPrioritisationDocument(deletedDocument)) {
      setTpImportMessage(null);
      setPendingTopics([]);
    }

    setWorkspace((prev) => {
      const doc = prev.repository.documents.find((d) => d.id === documentId);
      const municipalityId = prev.municipality.identity.id;
      const deletesHealthReport = doc?.kind === "health-report";
      const deletesCommunityAssets = doc?.kind === "community-asset";
      const deletesIBSE = isIBSEDocument(doc);
      const deletesDUKE = isDUKEDocument(doc);
      const deletesPREDIMED = isPREDIMEDDocument(doc);
      const deletesSF12 = isSF12Document(doc);
      const deletesSueno = isSuenoDocument(doc);
      const deletesCAGE = isCAGEDocument(doc);
      const deletesAUDITC = isAUDITCDocument(doc);
      const deletesIPAQ = isIPAQDocument(doc);
      const deletesGHQ12 = isGHQ12Document(doc);
      const deletesPHQ9 = isPHQ9Document(doc);
      const deletesPSQI = isPSQIDocument(doc);
      const deletesFagerstrom = isFagerstromDocument(doc);
      const deletesSBQ = isSBQDocument(doc);
      const deletesThematicPrioritisation = isThematicPrioritisationDocument(doc);

      return {
        ...prev,
        repository: removeMunicipalDocument(prev.repository, documentId),
        evidenceStore: {
          ...prev.evidenceStore,
          atoms: prev.evidenceStore.atoms.filter(
            (atom) => {
              if (atom.municipalityId !== municipalityId) return true;
              if (atom.provenance.documentId === documentId) return false;
              if (deletesHealthReport && atom.provenance.origin === "health-report") return false;
              if (deletesCommunityAssets && atom.provenance.origin === "community-assets") return false;
              if (deletesIBSE && atom.provenance.origin === "ibse") return false;
              if (
                deletesDUKE &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(DUKE_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesPREDIMED &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(PREDIMED_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesSF12 &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(SF12_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesSueno &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(SUENO_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesCAGE &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(CAGE_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesAUDITC &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(AUDITC_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesIPAQ &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(IPAQ_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesGHQ12 &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(GHQ12_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesPHQ9 &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(PHQ9_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesPSQI &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(PSQI_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesFagerstrom &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(FAGERSTROM_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesSBQ &&
                atom.provenance.origin === "complementary-study" &&
                atom.tags.includes(SBQ_DOCUMENT_TAG)
              ) {
                return false;
              }
              if (
                deletesThematicPrioritisation &&
                atom.provenance.origin === "citizen-participation"
              ) {
                return false;
              }
              return true;
            }
          ),
          updatedAt: new Date().toISOString(),
        },
        healthReport: deletesHealthReport ? undefined : prev.healthReport,
        ibseStudy: deletesIBSE ? undefined : prev.ibseStudy,
        dukeStudy: deletesDUKE ? undefined : prev.dukeStudy,
        predimedStudy: deletesPREDIMED ? undefined : prev.predimedStudy,
        sf12Study: deletesSF12 ? undefined : prev.sf12Study,
        suenoStudy: deletesSueno ? undefined : prev.suenoStudy,
        cageStudy: deletesCAGE ? undefined : prev.cageStudy,
        auditcStudy: deletesAUDITC ? undefined : prev.auditcStudy,
        ipaqStudy: deletesIPAQ ? undefined : prev.ipaqStudy,
        ghq12Study: deletesGHQ12 ? undefined : prev.ghq12Study,
        phq9Study: deletesPHQ9 ? undefined : prev.phq9Study,
        psqiStudy: deletesPSQI ? undefined : prev.psqiStudy,
        fagerstromStudy: deletesFagerstrom ? undefined : prev.fagerstromStudy,
        sbqStudy: deletesSBQ ? undefined : prev.sbqStudy,
        thematicPrioritisation: deletesThematicPrioritisation
          ? undefined
          : prev.thematicPrioritisation,
        thematicPrioritisationStudy: deletesThematicPrioritisation
          ? undefined
          : prev.thematicPrioritisationStudy,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function switchToMunicipality(
    municipalityId: string,
    input: CreateMunicipalityContextInput,
    discardConfirmed = false
  ) {
    if (!discardConfirmed && !canLeavePreparation()) return;
    const nextWorkspaceLoad = loadOrCreateMunicipalityWorkspace(municipalityId, input);
    // `backfill-marker` se aplica de forma síncrona (local); `download-and-merge`
    // viaja en `pendingMigration` y lo resuelve el efecto asíncrono.
    const nextWorkspace =
      nextWorkspaceLoad.seedMigration.kind === "backfill-marker"
        ? backfillSeedMigrationMarker(
            nextWorkspaceLoad.workspace,
            nextWorkspaceLoad.seedMigration.migration
          )
        : nextWorkspaceLoad.workspace;
    protectedEmptyWorkspaceIdRef.current = nextWorkspaceLoad.protectExistingStorage
      ? municipalityId
      : null;
    // IndexedDB puede contener una copia más reciente cuando localStorage agotó
    // su cuota. Se consulta siempre antes de persistir el workspace cargado.
    setPendingIndexedDbHydrationId(municipalityId);
    // Activa (o limpia) la hidratación asíncrona del seed para el nuevo municipio.
    setPendingSeedId(nextWorkspaceLoad.seedPending ? municipalityId : null);
    // Activa (o limpia) la migración incremental pendiente del nuevo municipio.
    setPendingMigration(
      nextWorkspaceLoad.seedMigration.kind === "download-and-merge"
        ? nextWorkspaceLoad.seedMigration.migration
        : null
    );
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
        !locallyDeletedWorkspaceIdsRef.current.has(municipality.id));
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
    <DocumentationProvider key={municipality.id} workspace={workspace}>
      {municipalityToDelete && <DeleteWorkspaceDialog
        name={municipalityToDelete.name}
        discardDraft={preparationDirtyRef.current && municipalityToDelete.id === municipality.id}
        remoteSession={remoteClient.auth.currentUser !== null}
        onCancel={() => setMunicipalityToDelete(null)}
        onConfirm={() => handleDeleteMunicipality(municipalityToDelete.id, municipalityToDelete)}
      />}
      {/* Barra de navegación con contexto municipal */}
      <nav className={view === "inicio" ? "app-nav app-nav--home" : "app-nav"}>
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
                className={
                  view === item.id
                    ? "app-nav__tab app-nav__tab--active"
                    : "app-nav__tab"
                }
                onClick={() => { setAgendaFocusId(undefined); setView(item.id); }}
              >
                {item.phase && <span className="app-nav__phase" aria-hidden="true">{item.phase}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Franja de contexto municipal — oculta en inicio, visible en vistas operativas */}
        {view !== "inicio" && <div className="app-nav__municipality">
          <div className="app-nav__municipality-row">
            <span className="app-nav__municipality-name">
              {municipality.name}
            </span>
            <span className="app-nav__municipality-sep">·</span>
            <span>{municipality.province}</span>
            {municipality.territorialType && municipality.territorialType !== "municipio" && (
              <>
                <span className="app-nav__municipality-sep">·</span>
                <span>{TERRITORIAL_TYPE_LABEL[municipality.territorialType] ?? municipality.territorialType}</span>
              </>
            )}
            <span className="app-nav__municipality-sep">·</span>
            <span>Plan Local de Salud 2027–2030</span>
            {municipality.ineCode && (
              <>
                <span className="app-nav__municipality-sep">·</span>
                <span>INE {municipality.ineCode}</span>
              </>
            )}
            {DEMO_MUNICIPALITIES.some((m) => m.id === municipality.id) && (
              <span className="app-nav__municipality-badge">Demostración</span>
            )}
            <button
              type="button"
              className="app-nav__municipality-btn"
              onClick={() => setShowMunicipalitySelector((v) => !v)}
            >
              {showMunicipalitySelector ? "Cerrar ▲" : "Cambiar ámbito ▾"}
            </button>
          </div>
        </div>}
      </nav>

      {/* Ciclo de Planificación Local — visible en todas las vistas: Implantación (agenda) no exige datos previos */}
      {(
        <LocalHealthPlanningCycle
          healthReportLoaded={runtime.workspace.healthReport !== undefined}
          pslHasEvidence={runtime.psl.totalEvidenceAtoms > 0}
          pslStatus={runtime.psl.status}
          pslIsStale={runtime.pslIsStale}
          pslCompiled={(runtime.workspace.compiledProfiles?.length ?? 0) > 0}
          thematicPrioritisationDone={runtime.workspace.thematicPrioritisation !== undefined}
          agendaCount={workspace.agendaActuations?.length ?? 0}
          onNavigate={(v) => setView(v as AppView)}
        />
      )}

      <main className="app-shell">
        <div className="app-status-strip">
        <details className="app-status-strip__tool"><summary>Copias y recuperación del trabajo</summary><BackupPanel workspace={workspace} ready={pendingSeedId === null && pendingMigration === null} /></details>
        {persistenceMessage !== null && (
          <div className="app-persistence-warning" role="alert">
            {persistenceMessage}
          </div>
        )}
        {remotePersistenceMessage !== null && (
          <div className="app-persistence-warning" role="status">
            {remotePersistenceMessage}
          </div>
        )}
        <RemoteSyncPanel client={remoteClient} />
        </div>

        {/* Selector de municipio (se muestra sobre cualquier vista) */}
        {showMunicipalitySelector && (
          <section className="municipality-selector">
            <p className="municipality-selector__warning">
              Cada ámbito conserva su expediente en este navegador. Al cambiar,
              se carga el ámbito seleccionado. Descarga una copia para conservar
              el trabajo fuera de este equipo.
            </p>
            <div className="municipality-selector__options">
              {allMunicipalities.map((m) => (
                <div
                  key={m.id}
                  className={
                    municipality.id === m.id
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

        {/* ── ① Inicio — Portada institucional de COMPÁS */}
        {view === "inicio" && (
          <>
            {/* ═══ CUBIERTA — identidad COMPÁS NG ═══ */}
            <div className="home-cover">
              <div className="home-cover__stripe" />
              <div className="home-cover__inner">
                {/* Marco de referencia — sin atribución oficial */}
                <div className="home-cover__chain">
                  <span className="home-cover__chain-level">Marco de referencia</span>
                  <span className="home-cover__chain-sep">·</span>
                  <span className="home-cover__chain-level">RELAS</span>
                  <span className="home-cover__chain-sep">·</span>
                  <span className="home-cover__chain-level">Planificación Local de Salud</span>
                  <span className="home-cover__chain-sep">·</span>
                  <span className="home-cover__chain-level">Salud pública municipal</span>
                  <span className="home-cover__chain-sep">·</span>
                  <span className="home-cover__chain-level">Andalucía</span>
                </div>

                {/* Marca — el único foco visual */}
                <div className="home-cover__brand">
                  <h1 className="home-cover__wordmark">COMPÁS</h1>
                </div>

                {/* Regla de identidad — franja canónica bajo la marca */}
                <hr className="home-cover__rule" />

                {/* Subtítulo */}
                <p className="home-cover__subtitle">
                  Herramienta en desarrollo para la planificación local en salud
                </p>

                {/* Franja de logos institucionales */}
                <InstitutionalLogoBand
                  variant="cover"
                  ids={["consejeria", "distrito-sanitario", "relas", "violencia-genero", "rasselh"]}
                />
              </div>
            </div>

            {/* ═══ MISIÓN — qué es y para qué sirve ═══ */}
            <section className="home-mission">
              <div className="home-mission__inner">
                <p className="home-mission__statement">
                  Prototipo metodológico orientado a apoyar la elaboración de Planes Locales
                  de Salud municipales, tomando como referencia el marco RELAS y la experiencia
                  acumulada de <strong>COMPÁS</strong>.
                </p>
                <div className="home-mission__context">
                  <p className="home-mission__context-label">Marco de referencia</p>
                  <ul className="home-mission__context-list">
                    <li className="home-mission__context-item">Marco RELAS · Planificación Local de Salud</li>
                    <li className="home-mission__context-item">Salud pública municipal · Andalucía</li>
                    <li className="home-mission__context-item">Experiencia histórica de COMPÁS</li>
                    <li className="home-mission__context-item">Herramienta en desarrollo — no desplegada oficialmente</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ═══ PROCESO — cómo trabaja ═══ */}
            <section className="home-process">
              <div className="home-process__inner">
                <p className="home-section-eyebrow">Proceso</p>
                <h2 className="home-process__heading">El ciclo de planificación local en salud</h2>
                <div className="home-process__cycle">
                  <div className="home-process__phase home-process__phase--1">
                    <span className="home-process__ordinal">01</span>
                    <span className="home-process__verb">Diagnosticar</span>
                    <p className="home-process__desc">
                      Informe de salud, estudios complementarios y activos comunitarios
                      organizados y analizados.
                    </p>
                  </div>
                  <div className="home-process__phase home-process__phase--2">
                    <span className="home-process__ordinal">02</span>
                    <span className="home-process__verb">Perfilar</span>
                    <p className="home-process__desc">
                      Perfil de Salud Local: síntesis interpretativa validada técnicamente
                      por el equipo.
                    </p>
                  </div>
                  <div className="home-process__phase home-process__phase--3">
                    <span className="home-process__ordinal">03</span>
                    <span className="home-process__verb">Priorizar</span>
                    <p className="home-process__desc">
                      Selección técnica y participativa de las áreas de actuación
                      prioritarias.
                    </p>
                  </div>
                  <div className="home-process__phase home-process__phase--4">
                    <span className="home-process__ordinal">04</span>
                    <span className="home-process__verb">Planificar</span>
                    <p className="home-process__desc">
                      Plan de Acción: líneas de actuación, objetivos e indicadores
                      trazados al diagnóstico.
                    </p>
                  </div>
                  <div className="home-process__phase home-process__phase--5">
                    <span className="home-process__ordinal">05</span>
                    <span className="home-process__verb">Implantar</span>
                    <p className="home-process__desc">
                      Agenda de actuaciones del plan, organizadas por entorno
                      y con ficha propia.
                    </p>
                    <button
                      type="button"
                      className="home-process__open"
                      onClick={() => setView("agenda")}
                    >
                      Abrir la agenda
                    </button>
                  </div>
                  <div className="home-process__phase home-process__phase--6">
                    <span className="home-process__ordinal">06</span>
                    <span className="home-process__verb">Evaluar</span>
                    <p className="home-process__desc">
                      Grado de cumplimiento del plan, resultados alcanzados y
                      recomendaciones para el ciclo siguiente.
                    </p>
                  </div>
                </div>
                <p className="home-process__note">
                  Las decisiones sobre el diagnóstico, la priorización y el plan corresponden
                  al equipo técnico, a la ciudadanía y a la autoridad competente.
                  COMPÁS organiza la información y apoya el proceso; no sustituye la deliberación
                  institucional.
                </p>
              </div>
            </section>

            {/* ═══ FLUJO — entradas y salidas de COMPÁS ═══ */}
            <section className="home-products">
              <div className="home-products__inner">

                {/* Zona 1: Fuentes — entran en COMPÁS, no las genera */}
                <div className="home-sources">
                  <p className="home-section-eyebrow">Fuentes para el diagnóstico</p>
                  <p className="home-sources__note">
                    Documentos elaborados fuera de COMPÁS e incorporados al proceso diagnóstico.
                  </p>
                  <div className="home-sources__list">
                    <div className="home-source">
                      <p className="home-source__name">Informe de Salud</p>
                      <p className="home-source__desc">
                        Documento fuente elaborado fuera de COMPÁS e incorporado
                        al proceso diagnóstico.
                      </p>
                    </div>
                    <div className="home-source">
                      <p className="home-source__name">Estudios complementarios</p>
                      <p className="home-source__desc">
                        Información recogida mediante estudios específicos que
                        complementa el diagnóstico territorial.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conector — COMPÁS transforma las fuentes */}
                <div className="home-transform">
                  <span className="home-transform__arrow">↓</span>
                  <span className="home-transform__label">COMPÁS analiza y transforma</span>
                </div>

                {/* Zona 2: Salidas — documentos que genera COMPÁS */}
                <div className="home-outputs">
                  <p className="home-section-eyebrow">Documentos que produce COMPÁS</p>
                  <div className="home-products__list">
                    <div className="home-product home-product--1">
                      <p className="home-product__name">Perfil de Salud Local</p>
                      <p className="home-product__desc">
                        Síntesis interpretativa del diagnóstico territorial validada
                        técnicamente. Documento base para la planificación.
                      </p>
                    </div>
                    <div className="home-product home-product--3">
                      <p className="home-product__name">Plan de Acción Local en Salud</p>
                      <p className="home-product__desc">
                        Líneas estratégicas, objetivos, indicadores, programas y actuaciones
                        construidos a partir del diagnóstico y la priorización.
                      </p>
                    </div>
                    <div className="home-product home-product--4">
                      <p className="home-product__name">Plan Local de Salud</p>
                      <p className="home-product__desc">
                        Documento institucional que integra diagnóstico, priorización,
                        plan de acción, seguimiento y evaluación.
                      </p>
                    </div>
                    <div className="home-product home-product--5">
                      <p className="home-product__name">Informe de Evaluación</p>
                      <p className="home-product__desc">
                        Documento de evaluación anual, bianual, trianual o final
                        del Plan Local de Salud.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </>
        )}

        {/* ── ② Repositorio documental ─────────────────────── */}
        {view === "repositorio" && (
          <>
            {/* ── BLOQUE 1+2: Cabecera del diagnóstico territorial ── */}
            {(() => {
              const hrLoaded = runtime.workspace.healthReport !== undefined;
              const atoms = runtime.workspace.evidenceStore.atoms;
              const atomCount = atoms.length;
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
              const studiesLoaded = studies.filter(Boolean).length;
              const ibseAtoms = atoms.filter(a => a.provenance.origin === "ibse").length;
              const studyAtoms = atoms.filter(a => a.provenance.origin === "complementary-study").length;

              // Capa 3: Activos para la salud
              const docs = runtime.workspace.repository.documents;
              const assetDocs = docs.filter(
                (d) => d.kind === "community-asset" || d.kind === "localiza-salud"
              );
              const assetNames = assetDocs.flatMap(assetEntriesOfDocument);
              const assetCount = assetNames.length;

              // Capa 4: Otras fuentes documentales (excluye capas 1–3).
              // Los marcos estratégicos y normativos (strategic-framework) se
              // excluyen también: son base del Plan de Acción / Plan Local de
              // Salud, no fuente diagnóstica del Perfil.
              const STUDY_TAGS = ["ibse", "duke-eas", "predimed-eas", "sf12-eas", "sueno-eas", "cage-eas", "auditc", "ipaq-eas", "ghq12", "phq9", "psqi", "fagerstrom", "sbq"];
              const otherDocCount = docs.filter(
                (d) =>
                  d.kind !== "health-report" &&
                  d.kind !== "community-asset" &&
                  d.kind !== "localiza-salud" &&
                  d.kind !== "complementary-study" &&
                  d.kind !== "strategic-framework" &&
                  !(d.kind === "redcap-export" && d.tags.some((t) => STUDY_TAGS.includes(t)))
              ).length;

              type DiagState = "ready" | "partial" | "empty";
              const diagState: DiagState =
                hrLoaded && atomCount > 0 ? "ready"
                : (hrLoaded || atomCount > 0 || docs.length > 0) ? "partial"
                : "empty";

              const conclusionMsg: Record<DiagState, string> = {
                ready:   "Diagnóstico con evidencia complementaria disponible para revisar el Perfil de Salud Local.",
                partial: "Diagnóstico en elaboración. Incorpora el Informe de Salud y fuentes complementarias para enriquecer el análisis territorial.",
                empty:   "El diagnóstico está vacío. Comienza incorporando el Informe de Salud del ámbito territorial.",
              };

              return (
                <section className="diag-header workspace-panel">
                  <div className="diag-header__title-row">
                    <div>
                      <p className="eyebrow">Diagnóstico territorial</p>
                      <h2 className="diag-header__municipality">{municipality.name}</h2>
                      <p className="diag-header__subtitle">
                        Estado metodológico del diagnóstico del ámbito territorial.
                      </p>
                    </div>
                  </div>

                  <div className="diag-status">
                    <p className="diag-status__heading">Estado del diagnóstico</p>
                    <ul className="diag-status__list">
                      <li className={`diag-status__item diag-status__item--${hrLoaded ? "ok" : "missing"}`}>
                        <span className="diag-status__label">Informe de Salud</span>
                        <span className="diag-status__value">
                          {hrLoaded ? "Fuente primaria disponible" : "No incorporado"}
                        </span>
                      </li>
                      <li className={`diag-status__item diag-status__item--${studiesLoaded > 0 ? "ok" : "pending"}`}>
                        <span className="diag-status__label">Estudios complementarios</span>
                        <span className="diag-status__value">
                          {studiesLoaded > 0
                            ? `${studiesLoaded} de 13 · ${ibseAtoms + studyAtoms} evidencias`
                            : "Ninguno incorporado"}
                        </span>
                      </li>
                      <li className={`diag-status__item diag-status__item--${assetCount > 0 ? "ok" : "pending"}`}>
                        <span className="diag-status__label">Activos para la salud</span>
                        <span className="diag-status__value">
                          {assetCount > 0 ? `${assetCount} activos incorporados` : "Sin activos registrados"}
                        </span>
                      </li>
                      <li className={`diag-status__item diag-status__item--${otherDocCount > 0 ? "ok" : "pending"}`}>
                        <span className="diag-status__label">Otras fuentes documentales</span>
                        <span className="diag-status__value">
                          {otherDocCount > 0 ? `${otherDocCount} registradas` : "Ninguna registrada"}
                        </span>
                      </li>
                    </ul>

                    <div className={`diag-status__conclusion diag-status__conclusion--${diagState}`}>
                      {conclusionMsg[diagState]}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ── Capas del diagnóstico ── */}
            <HealthReportViewer
              healthReport={runtime.workspace.healthReport}
              repository={runtime.workspace.repository}
            />
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
              onDeleteDocument={handleDeleteDocument}
            />
            <ActivosSaludPanel
              repository={runtime.workspace.repository}
              atoms={runtime.workspace.evidenceStore.atoms}
              onDeleteDocument={handleDeleteDocument}
            />
            <DocumentRepositoryPanel
              repository={runtime.workspace.repository}
              onDelete={handleDeleteDocument}
              libraryDocuments={compasDocumentLibrary}
              libraryMessage={documentLibraryMessage}
              onAssignLibraryDocument={handleAssignLibraryDocument}
              onSetDocumentCycle={handleSetDocumentCycle}
              onAddConciliation={handleAddConciliation}
              onRemoveConciliation={handleRemoveConciliation}
              onAddAssetValidation={handleAddAssetValidation}
              onRemoveAssetValidation={handleRemoveAssetValidation}
            />

            {/* ── BLOQUE 4: Añadir o sustituir fuentes ── */}
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

            {/* ── BLOQUE 5: Evidencias incorporadas al análisis ── */}
            <EvidenceStorePanel
              evidenceStore={runtime.workspace.evidenceStore}
              defaultOpen={false}
            />

            {/* ── BLOQUE 6: Continuación del proceso ── */}
            <section className="diag-continue workspace-panel">
              <div className="diag-continue__inner">
                <div>
                  <p className="diag-continue__label">Siguiente paso</p>
                  <p className="diag-continue__text">
                    Revisar el diagnóstico e iniciar la elaboración del Perfil de Salud Local
                  </p>
                </div>
                <button
                  type="button"
                  className="diag-continue__btn"
                  onClick={() => setView("psl")}
                >
                  Ir al Perfil de Salud Local →
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── ③ Análisis territorial — interpretación territorial (Nivel 2) ── */}
        {/* Orden: resultados (B) → explicabilidad (C) → estado del proceso (A) */}
        {view === "analisis" && (
          <>
            <LT1Panel lt1={runtime.lt1} />
            <OITPanel oit={runtime.oit} />
            <ReconciliacionPanel reconciliacion={runtime.reconciliacion} />
            <PipelineTracePanel pipeline={runtime.pipeline} />
          </>
        )}

        {/* ── ④ Perfil de Salud Local ──────────────────────── */}
        {view === "psl" && (
          <>
            <section className="workspace-panel">
              <h2>Informe de Salud que sirve de fuente al Perfil</h2>
              <p><strong>Documento fuente:</strong> {workspace.healthReport?.title ?? 'Sin informe registrado'}</p>
              <p>El archivo disponible en este bloque es el Informe de Salud original. El Perfil de Salud Local es el documento interpretativo que se revisa, valida y compila en los apartados siguientes.</p>
              {workspace.repository.documents.filter(d => d.id === workspace.healthReport?.linkedDocumentId).map(d => <DocumentAccess key={d.id} document={d} documentLabel="Informe de Salud original" />)}
              {runtime.pslIsStale && <p role="alert"><strong>Perfil pendiente de revisión.</strong> Han cambiado las fuentes o la evidencia desde su validación. El perfil anterior y sus documentos compilados se conservan como antecedentes; sus conclusiones requieren contraste antes de volver a validarse.</p>}
              {workspace.healthReport?.body.format === 'plain' && <p><strong>El PDF está disponible para consulta.</strong> Su incorporación no equivale a haber revisado ni actualizado las conclusiones del Perfil. Comprueba las fechas, la escala territorial y las páginas que sustentan cada conclusión.</p>}
              <p>Los informes de Vigilancia Integral de la Salud de las UGC son fuentes complementarias y deben interpretarse según su ámbito asistencial.</p>
            </section>
            {(() => {
              // CONV-A · selección del snapshot semántico que gobierna la
              // previsualización documental. Solo se considera VALIDADA cuando
              // existen atómicamente `validatedPSL` Y un payload de answers
              // deserializable y válido; en cualquier otro caso, borrador vivo no
              // institucional (nunca se recombina validatedPSL con answers vivos).
              // Preview y compilación consumen el MISMO snapshot deserializado.
              const previewContext = selectDocumentPreviewContext({
                validatedPSL: workspace.validatedPSL,
                validatedAnswersSnapshot: workspace.validatedAnswersSnapshot,
                livePSL: runtime.psl,
                liveAnswers: buildWorkspaceDiagnosticAnswers(workspace),
              });
              return (
                <>
                <LocalHealthProfileView
                  reviewSlot={
                    <ProposalReviewMode
                      proposals={[
                        ...buildReadingUnitProposals(previewContext.previewAnswers.lecturaPorTema),
                        ...authoredToProposals(workspace.repository.authoredProposals ?? []),
                      ]}
                      authored={workspace.repository.authoredProposals ?? []}
                      decisions={workspace.repository.proposalDecisions ?? []}
                      onDecide={handleProposalDecision}
                      onAdd={handleAddAuthoredProposal}
                      onRemove={handleRemoveAuthoredProposal}
                    />
                  }
                  psl={runtime.psl}
                  previewPSL={previewContext.previewPSL}
                  isValidatedPreview={previewContext.isValidatedPreview}
                  pslIsStale={runtime.pslIsStale}
                  municipalityName={municipality.name}
                  indicatorReferences={
                    previewContext.previewAnswers.referencias.references
                  }
                  epistemicMetrics={
                    workspace.perfilLocalDeSalud !== undefined
                      ? computePerfilEpistemicMetrics(workspace.perfilLocalDeSalud)
                      : undefined
                  }
                  diagnosticAnswers={previewContext.previewAnswers}
                  compiledProfiles={workspace.compiledProfiles}
                  onValidate={handleValidatePSL}
                  onInvalidate={handleInvalidatePSL}
                  onEditConclusion={handleEditPSLConclusion}
                  onEditCierreInterpretativo={handleEditPSLCierreInterpretativo}
                  onDocumentarDeliberacion={handleDocumentarDeliberacion}
                  onCompile={handleCompilePSL}
                  onApprove={handleApprovePSL}
                />
                </>
              );
            })()}
            {/* Representación derivada breve (GOV-P4-01 · PR-E): dentro del único
                espacio «Perfil de Salud Local», proyectada del documento canónico. */}
            <NHSHealthProfileView
              id="perfil-health-profile-visual"
              document={(() => {
                const compiled = workspace.compiledProfiles ?? [];
                const last = compiled[compiled.length - 1];
                return last?.canonicalDocument !== undefined
                  ? readSealedCanonicalDocument(last.canonicalDocument)
                  : null;
              })()}
            />
            <PerfilFuentesPanel workspace={workspace} onProcessReport={handleProcessExistingHealthReport} processing={isLoadingHealthReport} message={lastHealthReportMessage}>
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
            </PerfilFuentesPanel>
            <PerfilLocalDeSaludPanel
              perfil={workspace.perfilLocalDeSalud}
              municipalityId={municipality.id}
              municipalityName={municipality.name}
              onUpdatePerfil={handleUpdatePerfilLocalDeSalud}
            />
          </>
        )}

        {/* ── ⑤ Priorizaciones — técnica y participativa ──────── */}
        {view === "priorizacion" && (
          <>
            <section className="workspace-panel">
              <p className="eyebrow">Plan Local de Salud 2027–2030</p>
              <h2>Priorización territorial</h2>
              <p className="panel-note">
                COMPÁS organiza información para la deliberación: áreas candidatas
                derivadas del Perfil de Salud Local y resultados de la encuesta
                ciudadana en REDCap. No recoge votos dentro de la aplicación ni
                sustituye la encuesta; interpreta sus resultados cuando se importa
                el CSV del proyecto participativo.
              </p>
            </section>
            {/* Candidaturas técnicas — derivadas del PSL */}
            <PrioritizationPanel
              prioritization={runtime.prioritization}
              pslStatus={runtime.psl.status}
              pslIsStale={runtime.pslIsStale}
              hasInsufficientEvidence={pipelineIsEmpty}
            />
            {/* Participación ciudadana — proceso independiente de selección temática */}
            <div className="repo-section-divider">
              <span className="repo-section-divider__text">Participación ciudadana</span>
            </div>
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
          </>
        )}

        {/* ── ⑥ Lectura Estratégica Local + PAI ───────────────── */}
        {view === "lectura" && (
          runtime.lectura ? (
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
          )
        )}

        {/* ── ⑦ Plan de Acción — MTE + selección deliberativa + PAI ── */}
        {view === "plan" && (
          runtime.lectura ? (
            <>
            <section className="workspace-panel">
              <p className="eyebrow">Plan Local de Salud 2027–2030</p>
              <h2>Plan de Acción</h2>
              <details className="pcm-help-fold"><summary>Cadena canónica</summary>
              <p className="panel-note">
                Lectura Estratégica Local, selección deliberativa del
                Grupo Motor y propuesta técnica del Plan de Acción. El sistema aporta candidaturas;
                no selecciona prioridades ni adopta compromisos municipales.
              </p>
              </details>
            </section>
            <div className="plan-tabs" role="tablist" aria-label="Secciones del Plan de Acción">
              {([
                ["lineas", "Líneas e indicadores"],
                ["resultante", "Plan resultante"],
                ["lectura", "Lectura estratégica"],
                ["prioridades", "Participación y prioridades"],
                ["borrador", "Borrador de actuaciones"],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={planTab === id}
                  className={`plan-tabs__tab${planTab === id ? " plan-tabs__tab--active" : ""}`}
                  onClick={() => setPlanTab(id)}>{label}</button>
              ))}
            </div>
            {planTab === "lineas" && (
            <>
            <ActionPlanCatalogPanel
              section="lineas"
              municipalityId={workspace.municipality.identity.id}
              lectura={runtime.lectura}
              selection={workspace.deliberativePrioritySelection}
              eligibleModules={runtime.eligibleActionPlanModules}
              reviews={workspace.actionPlanModuleReviews ?? []}
              validatedActionPlans={workspace.validatedActionPlans ?? []}
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
            </>
            )}
            {planTab === "resultante" && (
            <>
            <ActionPlanCatalogPanel
              section="resultante"
              municipalityId={workspace.municipality.identity.id}
              lectura={runtime.lectura}
              selection={workspace.deliberativePrioritySelection}
              eligibleModules={runtime.eligibleActionPlanModules}
              reviews={workspace.actionPlanModuleReviews ?? []}
              validatedActionPlans={workspace.validatedActionPlans ?? []}
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
            </>
            )}
            {planTab === "lectura" && (
            <>
            <LecturaEstrategicaView lectura={runtime.lectura} />
            </>
            )}
            {planTab === "prioridades" && (
            <>
            <div className="repo-section-divider">
              <span className="repo-section-divider__text">Participación ciudadana</span>
            </div>
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
            <DeliberativePrioritySelectionPanel
              key={`${runtime.lectura.id}-${workspace.deliberativePrioritySelection?.id ?? "pending"}`}
              lectura={runtime.lectura}
              citizenPrioritisation={workspace.thematicPrioritisation}
              selection={workspace.deliberativePrioritySelection}
              isStale={runtime.prioritySelectionIsStale}
              onSave={handleSaveDeliberativePrioritySelection}
            />
            </>
            )}
            {planTab === "borrador" && (
            <>
            {runtime.pai ? (
              <PAIView pai={runtime.pai} />
            ) : (
              <section className="workspace-panel">
                <div className="phase-blocked-notice">
                  <strong>Borrador automático de actuaciones no disponible</strong>
                  <p>
                    La edición directa de objetivos e indicadores se guarda arriba en el expediente territorial.
                    Para generar automáticamente actuaciones, el Grupo Motor debe registrar una selección vigente.
                  </p>
                </div>
              </section>
            )}
            </>
            )}
            </>
          ) : (
            <>
              <section className="workspace-panel">
                <p className="eyebrow">Plan Local de Salud 2027–2030</p>
                <h2>Plan de Acción · edición directa</h2>
                <div className="phase-blocked-notice">
                  <strong>Edición territorial disponible</strong>
                  <p>
                    Puedes seleccionar, excluir y modificar líneas, objetivos e indicadores. Al elegir Modificar,
                    la nueva redacción se guarda en este expediente territorial sin revisión administrativa intermedia.
                  </p>
                </div>
              </section>
              <div className="plan-tabs" role="tablist" aria-label="Secciones del Plan de Acción">
                {([["lineas", "Líneas e indicadores"], ["resultante", "Plan resultante"]] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={(planTab === "resultante" ? "resultante" : "lineas") === id}
                    className={`plan-tabs__tab${(planTab === "resultante" ? "resultante" : "lineas") === id ? " plan-tabs__tab--active" : ""}`}
                    onClick={() => setPlanTab(id)}>{label}</button>
                ))}
              </div>
              <ActionPlanCatalogPanel
                section={planTab === "resultante" ? "resultante" : "lineas"}
                municipalityId={workspace.municipality.identity.id}
                eligibleModules={[]}
                reviews={workspace.actionPlanModuleReviews ?? []}
              validatedActionPlans={workspace.validatedActionPlans ?? []}
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
            </>
          )
        )}

        {/* ── ⑧ Plan Local de Salud — esbozo previo a las actuaciones ── */}
        {view === "plan-local" && (
          <>
          <InitialLocalHealthPlanPanel workspace={workspace} pslIsStale={runtime.pslIsStale} />
          <LocalHealthPlanOutline
            municipalityId={workspace.municipality.identity.id}
            municipalityName={municipality.name}
            province={municipality.province}
            healthReportTitle={workspace.healthReport?.title}
            pslStatus={runtime.psl.status}
            pslCompiled={(workspace.compiledProfiles?.length ?? 0) > 0}
            selectedPriorities={THEMATIC_TOPICS
              .filter((topic) => workspace.thematicPrioritisation?.selectedTopicIds.includes(topic.id))
              .map((topic) => topic.label)}
            drafts={workspace.planPreparationDrafts ?? []}
            agendaActuations={workspace.agendaActuations ?? []}
          />
          </>
        )}

        {/* ── Agenda de actuaciones por entornos (registro de trabajo; sin condicionar a PSL validado: decisión provisional) */}
        {view === "agenda" && (
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
        )}

        {/* ── ⑨ Evaluación — espacio canónico (pendiente de implementación) */}
        {view === "evaluacion" && (
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
        )}

        {/* ── Gestor de Encuestas de Salud (GES) */}
        {view === "ges" && (
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
        )}

      </main>

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
