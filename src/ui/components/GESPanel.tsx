/**
 * GESPanel — Gestor de Encuestas de Salud
 *
 * Producto institucional construido sobre el subsistema questionnaire existente.
 * No introduce nueva arquitectura. Reutiliza íntegramente:
 *   - createQuestionnaire, generateRedcapDictionaryArtifact, generateMethodologicalSpecArtifact
 *   - getAllMethodologicalModules, getAllClassificationBlocks
 *   - QuestionnaireProject (persistido en workspace.questionnaireProjects)
 */

import { CollectionPreparation, COLLECTION_PREPARATION_KEY } from "./CollectionPreparation";
import { useState, useMemo } from "react";
import type {
  QuestionnaireProject,
  QuestionnaireProjectStatus,
  ClassificationBlockId,
  ProjectDatasetImport,
} from "../../domain/questionnaire";
import { getAllClassificationBlocks } from "../../domain/questionnaire";
import { getAllMethodologicalModules } from "../../domain/methodology";
import type { MethodologicalModule } from "../../domain/methodology";
import {
  createQuestionnaire,
  generateRedcapDictionaryArtifact,
  generateMethodologicalSpecArtifact,
} from "../../application/questionnaire";
import { generateThematicPrioritisationRedcapDictionaryArtifact } from "../../application/thematic-prioritisation";
import { MAX_SELECTED_TOPICS, THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";

// ── Mapeos estáticos de producto ──────────────────────────────────────────────

const STUDY_LABEL: Readonly<Record<string, string>> = {
  "ibse":         "Bienestar socioemocional escolar (IBSE)",
  "duke-eas":     "Apoyo social funcional (DUKE-EAS)",
  "predimed-eas": "Adherencia mediterránea (PREDIMED-EAS)",
  "sf12-eas":     "Salud percibida PCS/MCS (SF-12 EAS)",
  "sueno-eas":    "Sueño — duración y calidad (Sueño EAS)",
  "cage-eas":     "Riesgo de alcoholismo (CAGE-EAS)",
  "auditc":       "Consumo de riesgo de alcohol (AUDIT-C)",
  "ipaq-eas":     "Actividad física (IPAQ-EAS)",
  "ghq12":        "Malestar psicológico (GHQ-12)",
  "phq9":         "Síntomas depresivos (PHQ-9)",
  "psqi":         "Calidad del sueño (PSQI)",
  "fagerstrom":   "Dependencia a la nicotina (Fagerström)",
  "sbq":          "Comportamiento sedentario (SBQ)",
};

const STUDY_ATOMS: Readonly<Record<string, number>> = {
  "ibse": 6, "duke-eas": 4, "predimed-eas": 2, "sf12-eas": 3, "sueno-eas": 3, "cage-eas": 3,
  "auditc": 2, "ipaq-eas": 3, "ghq12": 2, "phq9": 2, "psqi": 2, "fagerstrom": 2, "sbq": 2,
};

// Estimaciones de tiempo (min-max minutos) — orientativas para el técnico
const TIME_ESTIMATES: Readonly<Record<string, [number, number]>> = {
  "ibse": [5, 8], "duke-eas": [4, 6], "predimed-eas": [5, 7], "sf12-eas": [3, 5],
  "sueno-eas": [1, 2], "cage-eas": [1, 2], "auditc": [1, 2], "ipaq-eas": [0, 0],
  "ghq12": [4, 6], "phq9": [3, 5], "psqi": [3, 5], "fagerstrom": [2, 3], "sbq": [3, 5],
};

// Instrumentos EAS: no son ítems de cuestionario propio sino campos derivados de microdatos
const EAS_DERIVED = new Set(["duke-eas", "predimed-eas", "sf12-eas", "sueno-eas", "cage-eas", "ipaq-eas"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso.slice(0, 10); }
}

function downloadText(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function statusLabel(status: QuestionnaireProjectStatus): string {
  if (status === "draft")    return "Borrador";
  if (status === "ready")    return "Listo";
  if (status === "archived") return "Archivado";
  return status;
}

function moduleStatus(status: string): string {
  if (status === "draft")    return "Draft";
  if (status === "validated") return "Validado";
  if (status === "deprecated") return "Deprecado";
  return status;
}

function timeLabel(moduleId: string): string {
  const t = TIME_ESTIMATES[moduleId];
  if (!t) return "—";
  if (t[0] === 0 && t[1] === 0) return "Microdatos EAS";
  return `${t[0]}–${t[1]} min`;
}

function totalTime(moduleIds: string[]): string {
  let min = 0, max = 0;
  for (const id of moduleIds) {
    const t = TIME_ESTIMATES[id];
    if (t && !(t[0] === 0 && t[1] === 0)) { min += t[0]; max += t[1]; }
  }
  return min === 0 ? "—" : `${min}–${max} min`;
}

function totalItems(modules: MethodologicalModule[]): number {
  return modules.reduce((s, m) => s + m.items.length, 0);
}

// ── Tipos de vista interna ────────────────────────────────────────────────────

type GESSection = "projects" | "library";
type ProjectView = "list" | "create" | "edit" | "detail";

interface FormState {
  name:        string;
  description: string;
  modules:     string[];
  blocks:      ClassificationBlockId[];
  status:      QuestionnaireProjectStatus;
}

const EMPTY_FORM: FormState = { name: "", description: "", modules: [], blocks: [], status: "draft" };

// ── Props ─────────────────────────────────────────────────────────────────────

interface GESPanelProps {
  onPreparationDirtyChange?: (dirty: boolean) => void;
  projects:                      QuestionnaireProject[];
  projectDatasetImports?:        ProjectDatasetImport[];
  municipalityName?:             string;
  onAddProject:                  (project: QuestionnaireProject) => void;
  onUpdateProject:               (project: QuestionnaireProject) => void;
  onDeleteProject:               (projectId: string) => void;
  onImportProjectDataset?:       (file: File, project: QuestionnaireProject) => Promise<void>;
  isImportingProjectDataset?:    boolean;
  importProjectDatasetMessage?:  string | null;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function GESPanel({
  projects: allProjects,
  onPreparationDirtyChange,
  projectDatasetImports,
  municipalityName,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onImportProjectDataset,
  isImportingProjectDataset,
  importProjectDatasetMessage,
}: GESPanelProps) {
  const preparations = allProjects.filter(p => p.metadata?.[COLLECTION_PREPARATION_KEY]);
  const projects = allProjects.filter(p => !p.metadata?.[COLLECTION_PREPARATION_KEY]);
  const [section,    setSection]    = useState<GESSection>("projects");
  const [projView,   setProjView]   = useState<ProjectView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [libSearch,  setLibSearch]  = useState("");

  const allModules = useMemo(() => getAllMethodologicalModules(), []);
  const allBlocks  = useMemo(() => getAllClassificationBlocks(), []);
  const mun        = municipalityName ?? "el municipio";

  // ── Navegación ──────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM);
    setProjView("create");
  }

  function openEdit(project: QuestionnaireProject) {
    setForm({
      name:        project.name,
      description: project.description ?? "",
      modules:     [...project.questionnaire.methodologicalModules],
      blocks:      [...project.questionnaire.classificationBlocks],
      status:      project.status,
    });
    setSelectedId(project.id);
    setProjView("edit");
  }

  function openDetail(project: QuestionnaireProject) {
    setSelectedId(project.id);
    setProjView("detail");
  }

  function backToList() {
    setSelectedId(null);
    setProjView("list");
  }

  // ── Formulario ──────────────────────────────────────────────────────────────

  function toggleModule(id: string) {
    setForm(f => ({
      ...f,
      modules: f.modules.includes(id) ? f.modules.filter(m => m !== id) : [...f.modules, id],
    }));
  }

  function toggleBlock(id: ClassificationBlockId) {
    setForm(f => ({
      ...f,
      blocks: f.blocks.includes(id) ? f.blocks.filter(b => b !== id) : [...f.blocks, id],
    }));
  }

  function saveProject() {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();

    if (projView === "create") {
      const id = crypto.randomUUID();
      const project: QuestionnaireProject = {
        id,
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
        questionnaire: createQuestionnaire({
          id,
          name:                  form.name.trim(),
          description:           form.description.trim() || undefined,
          methodologicalModules: form.modules,
          classificationBlocks:  form.blocks,
          outputs:               ["redcap"],
        }),
        requestedOutputs: ["redcap"],
        createdAt: now,
        updatedAt: now,
      };
      onAddProject(project);
      setSelectedId(id);
      setProjView("detail");
    } else if (projView === "edit" && selectedId) {
      const existing = projects.find(p => p.id === selectedId);
      if (!existing) return;
      const updated: QuestionnaireProject = {
        ...existing,
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
        questionnaire: createQuestionnaire({
          id:                    existing.questionnaire.id,
          name:                  form.name.trim(),
          description:           form.description.trim() || undefined,
          methodologicalModules: form.modules,
          classificationBlocks:  form.blocks,
          outputs:               existing.questionnaire.outputs,
        }),
        updatedAt: now,
      };
      onUpdateProject(updated);
      setProjView("detail");
    }
  }

  function deleteProject(id: string) {
    if (!window.confirm("¿Eliminar este proyecto de encuesta? La acción no se puede deshacer.")) return;
    onDeleteProject(id);
    backToList();
  }

  // ── Descargas ────────────────────────────────────────────────────────────────

  function downloadREDCap(project: QuestionnaireProject) {
    const artifact = generateRedcapDictionaryArtifact(project);
    downloadText(artifact.content, artifact.name, artifact.mimeType);
  }

  function downloadSpec(project: QuestionnaireProject) {
    const artifact = generateMethodologicalSpecArtifact(project);
    downloadText(artifact.content, artifact.name, artifact.mimeType);
  }

  function downloadPrioritisationREDCap() {
    const artifact = generateThematicPrioritisationRedcapDictionaryArtifact();
    downloadText(artifact.content, artifact.name, artifact.mimeType);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const selectedProject = selectedId ? projects.find(p => p.id === selectedId) : undefined;

  const formModuleObjects = useMemo(
    () => allModules.filter(m => form.modules.includes(m.identity.id)),
    [allModules, form.modules]
  );

  const filteredLibModules = useMemo(() => {
    if (!libSearch.trim()) return allModules;
    const q = libSearch.toLowerCase();
    return allModules.filter(m =>
      m.identity.name.toLowerCase().includes(q) ||
      m.identity.shortName.toLowerCase().includes(q) ||
      m.identity.purpose.toLowerCase().includes(q) ||
      m.identity.category.includes(q)
    );
  }, [allModules, libSearch]);

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <section className="workspace-panel">
      <CollectionPreparation onDirtyChange={onPreparationDirtyChange} projects={preparations} onSave={project => allProjects.some(p => p.id === project.id) ? onUpdateProject(project) : onAddProject(project)} />

      {/* Cabecera */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Encuestas de Salud · {mun}</p>
          <h2>Gestor de Encuestas de Salud</h2>
        </div>
        <p className="panel-note">
          Diseña encuestas de salud, genera diccionarios REDCap y especificaciones metodológicas
          a partir de los instrumentos del catálogo COMPÁS.
        </p>
      </div>

      {/* Tabs de sección */}
      <div className="ges-tabs">
        <button
          type="button"
          className={`ges-tab${section === "projects" ? " ges-tab--active" : ""}`}
          onClick={() => { setSection("projects"); }}
        >
          Proyectos
          {projects.length > 0 && (
            <span className="ges-tab__count">{projects.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`ges-tab${section === "library" ? " ges-tab--active" : ""}`}
          onClick={() => setSection("library")}
        >
          Biblioteca metodológica
          <span className="ges-tab__count">{allModules.length}</span>
        </button>
      </div>

      {/* ── SECCIÓN: PROYECTOS ──────────────────────────────────────────────── */}
      {section === "projects" && (

        <>
          <section className="ges-detail__section">
            <p className="ges-detail__section-title">Priorización ciudadana REDCap</p>
            <div className="ges-export-card">
              <p className="ges-export-card__name">Diccionario REDCap · papeleta_pri_tematica</p>
              <p className="ges-export-card__desc">
                Formulario de selección temática para REDCap: {THEMATIC_TOPICS.length} temáticas,
                límite de {MAX_SELECTED_TOPICS} elecciones mediante @MAXCHECKED y campo exportable
                como temas___1…temas___10 para su importación posterior en COMPÁS.
              </p>
              <button
                type="button"
                className="ges-btn ges-btn--primary"
                onClick={downloadPrioritisationREDCap}
              >
                Descargar diccionario de priorización
              </button>
            </div>
          </section>

          {/* ── Vista: LISTA ─────────────────────────────────────────────── */}
          {projView === "list" && (
            <div className="ges-projects">
              <div className="ges-projects__toolbar">
                <button type="button" className="ges-btn ges-btn--primary" onClick={openCreate}>
                  + Nuevo proyecto
                </button>
              </div>

              {projects.length === 0 ? (
                <p className="empty-state">
                  Ningún proyecto creado todavía. Crea un proyecto para diseñar una encuesta
                  y generar el diccionario REDCap o la especificación metodológica.
                </p>
              ) : (
                <ul className="ges-project-list">
                  {projects.map(project => {
                    const modCount = project.questionnaire.methodologicalModules.length;
                    return (
                      <li key={project.id} className="ges-project-card">
                        <div className="ges-project-card__header">
                          <span className={`ges-status-badge ges-status-badge--${project.status}`}>
                            {statusLabel(project.status)}
                          </span>
                          <h3 className="ges-project-card__name">{project.name}</h3>
                        </div>
                        {project.description && (
                          <p className="ges-project-card__desc">{project.description}</p>
                        )}
                        <p className="ges-project-card__meta">
                          {modCount === 0
                            ? "Sin instrumentos seleccionados"
                            : `${modCount} instrumento${modCount !== 1 ? "s" : ""} · ${totalTime(project.questionnaire.methodologicalModules)}`}
                          {" · "}Creado el {formatDate(project.createdAt)}
                        </p>
                        {modCount > 0 && (
                          <p className="ges-project-card__modules">
                            {project.questionnaire.methodologicalModules
                              .map(id => allModules.find(m => m.identity.id === id)?.identity.shortName ?? id)
                              .join(" · ")}
                          </p>
                        )}
                        <div className="ges-project-card__actions">
                          <button type="button" className="ges-btn ges-btn--secondary" onClick={() => openDetail(project)}>
                            Ver detalle
                          </button>
                          <button type="button" className="ges-btn ges-btn--secondary" onClick={() => openEdit(project)}>
                            Editar
                          </button>
                          <button type="button" className="ges-btn ges-btn--danger" onClick={() => deleteProject(project.id)}>
                            Eliminar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ── Vista: CREAR / EDITAR ─────────────────────────────────────── */}
          {(projView === "create" || projView === "edit") && (
            <div className="ges-form">
              <h3 className="ges-form__title">
                {projView === "create" ? "Nuevo proyecto de encuesta" : `Editar: ${selectedProject?.name ?? ""}`}
              </h3>

              {/* Nombre */}
              <div className="ges-form__field">
                <label className="ges-form__label" htmlFor="ges-name">
                  Nombre del proyecto <span className="ges-form__required">*</span>
                </label>
                <input
                  id="ges-name"
                  type="text"
                  className="ges-form__input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ej. Encuesta de Salud Municipal 2026"
                  maxLength={120}
                />
              </div>

              {/* Descripción */}
              <div className="ges-form__field">
                <label className="ges-form__label" htmlFor="ges-desc">
                  Descripción <span className="ges-form__optional">(opcional)</span>
                </label>
                <textarea
                  id="ges-desc"
                  className="ges-form__textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Objetivo, población diana, contexto del estudio…"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Estado */}
              <div className="ges-form__field">
                <label className="ges-form__label" htmlFor="ges-status">Estado</label>
                <select
                  id="ges-status"
                  className="ges-form__select"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as QuestionnaireProjectStatus }))}
                >
                  <option value="draft">Borrador</option>
                  <option value="ready">Listo para administrar</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              {/* Bloque sociodemográfico */}
              <div className="ges-form__field">
                <p className="ges-form__label">Bloque de clasificación</p>
                <ul className="ges-block-list">
                  {allBlocks.map(block => (
                    <li key={block.id} className="ges-block-item">
                      <label className="ges-checkbox-label">
                        <input
                          type="checkbox"
                          className="ges-checkbox"
                          checked={form.blocks.includes(block.id)}
                          disabled={block.status === "planned"}
                          onChange={() => block.status !== "planned" && toggleBlock(block.id)}
                        />
                        <span className="ges-block-name">{block.name}</span>
                        <span className={`ges-badge ges-badge--status-${block.status}`}>
                          {block.status === "draft" ? "Disponible" : "Previsto"}
                        </span>
                      </label>
                      {block.status === "draft" && (
                        <span className="ges-block-note">{block.source}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instrumentos metodológicos */}
              <div className="ges-form__field">
                <p className="ges-form__label">
                  Instrumentos metodológicos
                  {form.modules.length > 0 && (
                    <span className="ges-form__count"> — {form.modules.length} seleccionados · {totalTime(form.modules)}</span>
                  )}
                </p>

                <div className="ges-module-selector">
                  {/* Columna: escalas validadas para REDCap */}
                  <div className="ges-module-col">
                    <p className="ges-module-col__title">Escalas validadas (REDCap propio)</p>
                    {allModules
                      .filter(m => !EAS_DERIVED.has(m.identity.id))
                      .map(mod => (
                        <ModuleCheckRow
                          key={mod.identity.id}
                          mod={mod}
                          checked={form.modules.includes(mod.identity.id)}
                          onToggle={() => toggleModule(mod.identity.id)}
                        />
                      ))}
                  </div>

                  {/* Columna: campos derivados EAS */}
                  <div className="ges-module-col">
                    <p className="ges-module-col__title">Campos derivados EAS (microdatos)</p>
                    {allModules
                      .filter(m => EAS_DERIVED.has(m.identity.id))
                      .map(mod => (
                        <ModuleCheckRow
                          key={mod.identity.id}
                          mod={mod}
                          checked={form.modules.includes(mod.identity.id)}
                          onToggle={() => toggleModule(mod.identity.id)}
                        />
                      ))}
                    <p className="ges-module-col__note">
                      Los instrumentos EAS no generan ítems en el cuestionario REDCap.
                      Sus datos provienen de los microdatos de la Encuesta Andaluza de Salud.
                    </p>
                  </div>
                </div>

                {/* Resumen de composición */}
                {form.modules.length > 0 && (
                  <div className="ges-composition-summary">
                    <p className="ges-composition-summary__title">Resumen de composición</p>
                    <ul className="ges-composition-list">
                      {form.blocks.includes("eas-sociodemographic") && (
                        <li className="ges-composition-item">
                          <strong>Bloque sociodemográfico</strong>
                          <span>6 variables · 2–3 min</span>
                        </li>
                      )}
                      {formModuleObjects.map(mod => {
                        const t = timeLabel(mod.identity.id);
                        const study = STUDY_LABEL[mod.identity.id];
                        const atoms = STUDY_ATOMS[mod.identity.id];
                        return (
                          <li key={mod.identity.id} className="ges-composition-item">
                            <strong>{mod.identity.shortName}</strong>
                            <span>
                              {mod.items.length > 0
                                ? `${mod.items.length} ítems · ${t}`
                                : `Campos EAS derivados · ${t}`}
                            </span>
                            {study && (
                              <span className="ges-composition-item__study">
                                → {study}
                                {atoms !== undefined && ` (${atoms} átomos)`}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="ges-composition-summary__total">
                      Total: {totalItems(formModuleObjects)} ítems propios · {totalTime(form.modules)} administración estimada
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones del formulario */}
              <div className="ges-form__actions">
                <button type="button" className="ges-btn ges-btn--secondary" onClick={backToList}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="ges-btn ges-btn--primary"
                  disabled={!form.name.trim()}
                  onClick={saveProject}
                >
                  {projView === "create" ? "Crear proyecto" : "Guardar cambios"}
                </button>
              </div>
            </div>
          )}

          {/* ── Vista: DETALLE ────────────────────────────────────────────── */}
          {projView === "detail" && selectedProject && (
            <div className="ges-detail">
              <button type="button" className="ges-btn ges-btn--back" onClick={backToList}>
                ← Todos los proyectos
              </button>

              {/* Cabecera del proyecto */}
              <div className="ges-detail__header">
                <span className={`ges-status-badge ges-status-badge--${selectedProject.status}`}>
                  {statusLabel(selectedProject.status)}
                </span>
                <h3 className="ges-detail__name">{selectedProject.name}</h3>
                {selectedProject.description && (
                  <p className="ges-detail__desc">{selectedProject.description}</p>
                )}
                <p className="ges-detail__meta">
                  Creado el {formatDate(selectedProject.createdAt)}
                  {selectedProject.updatedAt !== selectedProject.createdAt && (
                    <> · Modificado el {formatDate(selectedProject.updatedAt)}</>
                  )}
                </p>
              </div>

              {/* Instrumentos seleccionados */}
              {selectedProject.questionnaire.methodologicalModules.length === 0 ? (
                <p className="empty-state">Este proyecto no tiene instrumentos seleccionados. Edítalo para añadir módulos.</p>
              ) : (
                <section className="ges-detail__section">
                  <p className="ges-detail__section-title">Instrumentos y estudios complementarios</p>
                  <ul className="ges-instrument-list">
                    {selectedProject.questionnaire.classificationBlocks.includes("eas-sociodemographic") && (
                      <li className="ges-instrument-item ges-instrument-item--block">
                        <span className="ges-instrument-item__name">Bloque sociodemográfico EAS</span>
                        <span className="ges-instrument-item__meta">6 variables · 2–3 min</span>
                      </li>
                    )}
                    {selectedProject.questionnaire.methodologicalModules.map(modId => {
                      const mod  = allModules.find(m => m.identity.id === modId);
                      const study  = STUDY_LABEL[modId];
                      const atoms  = STUDY_ATOMS[modId];
                      const isEAS  = EAS_DERIVED.has(modId);
                      return (
                        <li key={modId} className="ges-instrument-item">
                          <div className="ges-instrument-item__row">
                            <span className="ges-instrument-item__name">
                              {mod ? `${mod.identity.shortName} — ${mod.identity.name}` : modId}
                            </span>
                            <span className="ges-instrument-item__meta">
                              {mod && mod.items.length > 0
                                ? `${mod.items.length} ítems · ${timeLabel(modId)}`
                                : isEAS ? `Microdatos EAS` : `—`}
                            </span>
                          </div>
                          {study && (
                            <p className="ges-instrument-item__study">
                              Genera: {study}{atoms !== undefined && ` · ${atoms} EvidenceAtoms`}
                            </p>
                          )}
                          {mod?.identity.status === "draft" && (
                            <p className="ges-instrument-item__warning">⚠ Módulo en estado draft — pendiente de validación</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="ges-detail__total">
                    {(() => {
                      const mods = allModules.filter(m =>
                        selectedProject.questionnaire.methodologicalModules.includes(m.identity.id)
                      );
                      const items = totalItems(mods);
                      const time  = totalTime(selectedProject.questionnaire.methodologicalModules);
                      const atoms = selectedProject.questionnaire.methodologicalModules
                        .reduce((s, id) => s + (STUDY_ATOMS[id] ?? 0), 0);
                      return `Total: ${items} ítems propios · ${time} estimados · ${atoms} EvidenceAtoms al importar`;
                    })()}
                  </p>
                </section>
              )}

              {/* Exportaciones — Fase 4 */}
              <section className="ges-detail__section">
                <p className="ges-detail__section-title">Exportaciones</p>
                <div className="ges-exports">
                  <div className="ges-export-card">
                    <p className="ges-export-card__name">Diccionario REDCap (CSV)</p>
                    <p className="ges-export-card__desc">
                      Importa este fichero en REDCap para crear el instrumento de recogida de datos.
                      Contiene las columnas canónicas del Data Dictionary de REDCap.
                    </p>
                    <button
                      type="button"
                      className="ges-btn ges-btn--primary"
                      onClick={() => downloadREDCap(selectedProject)}
                      disabled={selectedProject.questionnaire.methodologicalModules.length === 0 && !selectedProject.questionnaire.classificationBlocks.includes("eas-sociodemographic")}
                    >
                      Descargar CSV REDCap
                    </button>
                  </div>

                  <div className="ges-export-card">
                    <p className="ges-export-card__name">Especificación metodológica (TXT)</p>
                    <p className="ges-export-card__desc">
                      Documento de referencia con instrumentos, tiempos estimados, advertencias
                      metodológicas, bibliografía y compatibilidad con COMPÁS.
                    </p>
                    <button
                      type="button"
                      className="ges-btn ges-btn--secondary"
                      onClick={() => downloadSpec(selectedProject)}
                    >
                      Descargar Especificación
                    </button>
                  </div>
                </div>
              </section>

              {/* Importar resultados del proyecto */}
              {onImportProjectDataset && (
                <section className="ges-detail__section">
                  <p className="ges-detail__section-title">Importar resultados del proyecto</p>
                  <p className="ges-detail__note">
                    Importa una exportación CSV de REDCap con los resultados del proyecto completo.
                    El sistema detecta automáticamente los módulos presentes y aplica sus parsers.
                    Los módulos EAS se omiten (sus datos provienen de microdatos EAS).
                  </p>
                  <div className="ges-import-project">
                    <label className={`ges-btn ges-btn--primary ges-import-project__label${isImportingProjectDataset ? " ges-btn--disabled" : ""}`}>
                      {isImportingProjectDataset ? "Procesando…" : "Seleccionar CSV REDCap del proyecto…"}
                      <input
                        type="file"
                        accept=".csv"
                        className="ges-import-project__input"
                        disabled={!!isImportingProjectDataset}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void onImportProjectDataset(file, selectedProject);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {importProjectDatasetMessage && (
                      <p className="ges-import-project__msg">{importProjectDatasetMessage}</p>
                    )}
                  </div>

                  {/* Historial de importaciones de este proyecto */}
                  {(() => {
                    const history = (projectDatasetImports ?? []).filter(
                      (imp) => imp.projectId === selectedProject.id
                    );
                    if (history.length === 0) return null;
                    return (
                      <div className="ges-import-history">
                        <p className="ges-lib-label">Historial de importaciones</p>
                        <ul className="ges-import-history-list">
                          {history.map((imp) => (
                            <li key={imp.id} className="ges-import-history-item">
                              <span className="ges-import-history-item__file">{imp.fileName}</span>
                              <span className="ges-import-history-item__date">{formatDate(imp.importedAt)}</span>
                              <span className="ges-import-history-item__stats">
                                {imp.rowCount} fila{imp.rowCount !== 1 ? "s" : ""}
                                {imp.processedModules.length > 0 && (
                                  <> · {imp.processedModules.length} módulo{imp.processedModules.length !== 1 ? "s" : ""}: {imp.processedModules.join(", ")}</>
                                )}
                                {imp.skippedModules.length > 0 && (
                                  <> · {imp.skippedModules.length} omitido{imp.skippedModules.length !== 1 ? "s" : ""}</>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </section>
              )}

              {/* Acciones */}
              <div className="ges-detail__actions">
                <button type="button" className="ges-btn ges-btn--secondary" onClick={() => openEdit(selectedProject)}>
                  Editar proyecto
                </button>
                <button type="button" className="ges-btn ges-btn--danger" onClick={() => deleteProject(selectedProject.id)}>
                  Eliminar proyecto
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SECCIÓN: BIBLIOTECA METODOLÓGICA — Fase 2 ──────────────────────── */}
      {section === "library" && (
        <div className="ges-library">
          <div className="ges-library__search-bar">
            <input
              type="search"
              className="ges-form__input"
              placeholder="Buscar instrumento…"
              value={libSearch}
              onChange={e => setLibSearch(e.target.value)}
            />
            <span className="ges-library__count">
              {filteredLibModules.length} de {allModules.length} instrumentos
            </span>
          </div>

          <ul className="ges-library-list">
            {filteredLibModules.map(mod => (
              <LibraryCard key={mod.identity.id} mod={mod} />
            ))}
          </ul>
        </div>
      )}

    </section>
  );
}

// ── Subcomponentes internos ───────────────────────────────────────────────────

interface ModuleCheckRowProps {
  mod:      MethodologicalModule;
  checked:  boolean;
  onToggle: () => void;
}

function ModuleCheckRow({ mod, checked, onToggle }: ModuleCheckRowProps) {
  const study = STUDY_LABEL[mod.identity.id];
  const time  = timeLabel(mod.identity.id);
  const isEAS = EAS_DERIVED.has(mod.identity.id);

  return (
    <label className={`ges-module-row${checked ? " ges-module-row--checked" : ""}`}>
      <input type="checkbox" className="ges-checkbox" checked={checked} onChange={onToggle} />
      <div className="ges-module-row__body">
        <div className="ges-module-row__header">
          <span className="ges-module-row__short">{mod.identity.shortName}</span>
          <span className="ges-module-row__name">{mod.identity.name}</span>
          <span className={`ges-badge ges-badge--status-${mod.identity.status}`}>
            {moduleStatus(mod.identity.status)}
          </span>
        </div>
        <p className="ges-module-row__purpose">{mod.identity.purpose.split(".")[0]}.</p>
        <div className="ges-module-row__meta">
          {!isEAS && mod.items.length > 0 && (
            <span>{mod.items.length} ítems · {time}</span>
          )}
          {isEAS && <span className="ges-badge ges-badge--eas">EAS</span>}
          {study && (
            <span className="ges-module-row__study">→ {study}</span>
          )}
        </div>
      </div>
    </label>
  );
}

interface LibraryCardProps {
  mod: MethodologicalModule;
}

function LibraryCard({ mod }: LibraryCardProps) {
  const [open, setOpen] = useState(false);
  const study = STUDY_LABEL[mod.identity.id];
  const atoms = STUDY_ATOMS[mod.identity.id];
  const isEAS = EAS_DERIVED.has(mod.identity.id);
  const ref   = mod.bibliography[0];

  return (
    <li className="ges-lib-card">
      <button
        type="button"
        className="ges-lib-card__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="ges-lib-card__header">
          <span className="ges-lib-card__short">{mod.identity.shortName}</span>
          <span className="ges-lib-card__name">{mod.identity.name}</span>
          <div className="ges-lib-card__badges">
            <span className={`ges-badge ges-badge--status-${mod.identity.status}`}>
              {moduleStatus(mod.identity.status)}
            </span>
            {isEAS && <span className="ges-badge ges-badge--eas">EAS</span>}
            <span className="ges-badge ges-badge--cat">{mod.identity.category}</span>
          </div>
        </div>
        <p className="ges-lib-card__purpose">{mod.identity.purpose.split(".")[0]}.</p>
        <div className="ges-lib-card__summary">
          {mod.identity.targetPopulation && (
            <span>Población: {mod.identity.targetPopulation}</span>
          )}
          {mod.items.length > 0 && <span>{mod.items.length} ítems</span>}
          {study && (
            <span className="ges-lib-card__study">
              Genera: {study}{atoms !== undefined && ` · ${atoms} átomos`}
            </span>
          )}
        </div>
        <span className="ges-lib-card__chevron">{open ? "▲" : "▾"}</span>
      </button>

      {open && (
        <div className="ges-lib-card__body">

          {/* Finalidad */}
          <div className="ges-lib-section">
            <p className="ges-lib-label">Finalidad</p>
            <p>{mod.identity.purpose}</p>
          </div>

          {/* Dimensiones / Índices */}
          {mod.dimensions.length > 0 && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">Dimensiones e índices</p>
              <ul className="ges-lib-list">
                {mod.dimensions.map(d => (
                  <li key={d.id}>
                    <strong>{d.name}</strong>
                    {d.description && ` — ${d.description}`}
                    {d.isComposite && " (índice compuesto)"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Escala e interpretación */}
          {mod.interpretation && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">Escala e interpretación</p>
              <p>
                Rango: {mod.interpretation.scale.min}–{mod.interpretation.scale.max}
                {" · "}
                {mod.interpretation.scale.direction === "higher-is-better"
                  ? "Mayor puntuación = mejor resultado"
                  : mod.interpretation.scale.direction === "lower-is-better"
                  ? "Menor puntuación = mejor resultado"
                  : "Escala neutral"}
              </p>
              {mod.interpretation.thresholds && mod.interpretation.thresholds.length > 0 && (
                <ul className="ges-lib-list">
                  {mod.interpretation.thresholds.map((t, i) => (
                    <li key={i}>{t.min}–{t.max}: <strong>{t.label}</strong>{t.description && ` — ${t.description}`}</li>
                  ))}
                </ul>
              )}
              {mod.interpretation.referenceValues && (
                <p className="ges-lib-note">
                  Referencia: {mod.interpretation.referenceValues.population}
                  {mod.interpretation.referenceValues.mean !== undefined && ` — media ${mod.interpretation.referenceValues.mean}`}
                  {" ("}fuente: {mod.interpretation.referenceValues.source}{")"}
                </p>
              )}
            </div>
          )}

          {/* Ítems (primeros 5) */}
          {mod.items.length > 0 && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">
                Ítems ({mod.items.length}){mod.items.length > 5 && " — mostrando primeros 5"}
              </p>
              <ul className="ges-lib-list">
                {mod.items.slice(0, 5).map(item => (
                  <li key={item.id}>
                    <code className="ges-lib-var">{item.id}</code>
                    {" — "}
                    {item.text}
                    {item.reverseScored && " (inversa)"}
                  </li>
                ))}
                {mod.items.length > 5 && (
                  <li className="ges-lib-more">… y {mod.items.length - 5} ítems más</li>
                )}
              </ul>
            </div>
          )}

          {/* Advertencias metodológicas */}
          {mod.limitations.length > 0 && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">Cautelas metodológicas</p>
              <ul className="ges-lib-list ges-lib-list--caution">
                {mod.limitations.slice(0, 3).map((l, i) => <li key={i}>{l}</li>)}
                {mod.limitations.length > 3 && (
                  <li className="ges-lib-more">… y {mod.limitations.length - 3} cautelas más</li>
                )}
              </ul>
            </div>
          )}

          {/* Estudio complementario */}
          {study && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">Estudio complementario en COMPÁS</p>
              <p>
                {study}
                {atoms !== undefined && ` · Genera ${atoms} EvidenceAtom${atoms !== 1 ? "s" : ""} al importar`}
              </p>
            </div>
          )}

          {/* Bibliografía */}
          {ref && (
            <div className="ges-lib-section">
              <p className="ges-lib-label">Fundamento científico</p>
              <p className="ges-lib-bib">
                {ref.authors}
                {ref.year && ` (${ref.year})`}
                {ref.title && `. ${ref.title}`}
                {ref.source && `. ${ref.source}`}
                {ref.doi && `. DOI: ${ref.doi}`}
                {ref.notes && ` — ${ref.notes}`}
              </p>
              <p className="ges-lib-note">Estado del módulo: {moduleStatus(mod.identity.status)}</p>
            </div>
          )}

        </div>
      )}
    </li>
  );
}
