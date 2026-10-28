import { useMemo } from "react";
import { AGENDA_SETTING_LABEL, ACTUATION_STATUS_LABEL, type AgendaActuation } from "../../domain/agenda/AgendaActuation";
import { LOCAL_HEALTH_PLAN_OUTLINE_STATUS } from "../../domain/health-plan";
import { ACTION_PLAN_CATALOG } from "../../domain/action-plan-catalog";
import { municipalActionPlanModule } from "../../domain/action-plan-catalog/MunicipalActionPlanModule";
import {
  buildDefinitiveActionPlanProjection,
  resolvedPlanDecisionText,
} from "../../domain/action-plan-catalog/DefinitiveActionPlanProjection";
import {
  ZAIDIN_AGING_PROPOSAL,
  createZaidinFinalActionPlanDraft,
  thematicBlockNameFor,
  type PlanPreparationDraft,
} from "../../domain/action-plan-catalog/PlanPreparationDraft";

interface LocalHealthPlanOutlineProps {
  municipalityId: string;
  municipalityName: string;
  province: string;
  healthReportTitle?: string;
  pslStatus: string;
  pslCompiled: boolean;
  selectedPriorities?: string[];
  drafts?: PlanPreparationDraft[];
  /** Actuaciones registradas en la agenda de Implantación (registro de trabajo, no validado). */
  agendaActuations?: readonly AgendaActuation[];
}

const PSL_STATUS_LABEL: Record<string, string> = {
  draft: "Perfil en elaboración",
  generated: "Perfil generado, sin revisión humana",
  review: "Perfil en revisión técnica",
  superseded: "Perfil sustituido por una versión posterior",
  archived: "Perfil archivado",
  validated: "Perfil validado técnicamente",
  approved: "Perfil aprobado institucionalmente",
};

export function LocalHealthPlanOutline({
  municipalityId,
  municipalityName,
  province,
  healthReportTitle,
  pslStatus,
  pslCompiled,
  selectedPriorities = [],
  drafts = [],
  agendaActuations = [],
}: LocalHealthPlanOutlineProps) {
  const modules = useMemo(
    () => ACTION_PLAN_CATALOG.map((module) => municipalActionPlanModule(municipalityId, module)),
    [municipalityId]
  );
  const effectiveDrafts = useMemo(() => {
    if (municipalityId !== "granada-zaidin") return drafts;
    const current = drafts.find((draft) => draft.moduleId === ZAIDIN_AGING_PROPOSAL.id && draft.version === ZAIDIN_AGING_PROPOSAL.version);
    if (current) return drafts;
    const previous = drafts.find((draft) => draft.moduleId === ZAIDIN_AGING_PROPOSAL.id);
    return [...drafts.filter((draft) => draft.moduleId !== ZAIDIN_AGING_PROPOSAL.id), createZaidinFinalActionPlanDraft(previous)];
  }, [municipalityId, drafts]);
  const active = useMemo(
    () => buildDefinitiveActionPlanProjection(municipalityId, modules, effectiveDrafts),
    [municipalityId, modules, effectiveDrafts]
  );
  const selectedObjectives = active.reduce((total, item) => total + item.rows.length, 0);
  const selectedIndicators = active.reduce(
    (total, item) => total + item.rows.filter((row) => row.indicatorIncluded).length,
    0
  );

  return (
    <article className="workspace-panel psl-outline" aria-labelledby="pls-outline-title">
      <header className="pcm-module__header">
        <div>
          <p className="eyebrow">Esbozo de trabajo · Plan Local de Salud 2027–2030</p>
          <h2 id="pls-outline-title">Plan Local de Salud del Distrito {municipalityName.replace(/^Granada-/, "")}</h2>
          <p className="panel-note">{municipalityName} · {province}</p>
        </div>
        <span className="status-pill" data-outline-status={LOCAL_HEALTH_PLAN_OUTLINE_STATUS}>Borrador evolutivo</span>
      </header>

      <div className="phase-blocked-notice">
        <strong>Disponible antes de registrar actuaciones</strong>
        <p>
          Este esbozo reúne el diagnóstico y la arquitectura estratégica ya seleccionada.
          Las actuaciones, sus fichas, responsables, plazos y recursos se incorporarán después.
          Su ausencia no impide consultar este borrador, pero sí cerrar y aprobar el Plan definitivo.
        </p>
      </div>

      <section className="pie-doc-section">
        <h3>1. Identidad y alcance</h3>
        <p>
          Documento de trabajo para ordenar el ciclo de planificación local en salud del
          Distrito {municipalityName.replace(/^Granada-/, "")} durante 2027–2030.
        </p>
      </section>

      <section className="pie-doc-section">
        <h3>2. Diagnóstico territorial</h3>
        <p><strong>Estado:</strong> {PSL_STATUS_LABEL[pslStatus] ?? pslStatus}.</p>
        <p><strong>Perfil compilado:</strong> {pslCompiled ? "Disponible como PSL-C." : "Pendiente de compilación como PSL-C."}</p>
        <p><strong>Informe de Salud de referencia:</strong> {healthReportTitle ?? "No registrado."}</p>
        <p className="panel-note">
          El Perfil de Salud Local constituye la base diagnóstica de este esbozo; el Informe
          de Salud es una de sus fuentes.
        </p>
      </section>

      <section className="pie-doc-section">
        <h3>3. Prioridades para la planificación</h3>
        {selectedPriorities.length > 0 ? (
          <ul>{selectedPriorities.map((priority) => <li key={priority}>{priority}</li>)}</ul>
        ) : (
          <p className="panel-note">La selección participativa de prioridades está pendiente de incorporarse.</p>
        )}
      </section>

      <section className="pie-doc-section">
        <h3>4. Arquitectura estratégica del Plan de Acción</h3>
        <p>
          {selectedObjectives} objetivos específicos y {selectedIndicators} indicadores
          forman parte de la selección territorial actual.
        </p>
        {active.length > 0 ? active.map(({ module, moduleDecision, rows }) => rows.length > 0 && (
          <div key={module.id} className="pcm-module">
            <h4>{module.title}</h4>
            <p><strong>Objetivo estratégico:</strong> {resolvedPlanDecisionText(moduleDecision, module.strategicObjective)}</p>
            {module.generalObjectives.map((general) => {
              const group = rows.filter((row) => row.general.code === general.code);
              if (!group.length) return null;
              const generalDecision = group[0].generalDecision;
              return (
                <div key={general.code} className="pcm-specific">
                  <p><strong>Bloque temático · {thematicBlockNameFor(general.code) ?? general.code}</strong> · {resolvedPlanDecisionText(generalDecision, general.title)}</p>
                  <ul>
                    {group.map((row) => (
                      <li key={row.specific.code}>
                        <strong>Objetivo específico · {row.specific.displayCode ?? row.specific.code}</strong> · {resolvedPlanDecisionText(row.objectiveDecision, row.specific.title)}
                        {row.indicatorIncluded && (
                          <> — <strong>{row.specific.indicator.code}</strong> · {resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title)}</>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )) : (
          <p className="panel-note">Todavía no se han incorporado líneas, objetivos e indicadores al esbozo.</p>
        )}
      </section>

      <section className="pie-doc-section">
        <h3>5. Actuaciones y agenda de implementación</h3>
        {agendaActuations.length === 0 ? (
          <>
            <p><strong>Actuaciones pendientes de registro.</strong></p>
            <p className="panel-note">
              En la fase siguiente se recogerán las actuaciones reales y se vincularán con los
              indicadores, objetivos y líneas correspondientes. A partir de ellas se completarán
              responsables, calendario, recursos y agenda anual.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>{agendaActuations.length} {agendaActuations.length === 1 ? "actuación registrada" : "actuaciones registradas"}</strong>{" "}
              en la agenda de Implantación. Es un registro de trabajo del equipo: no está validado ni vinculado todavía a objetivos e indicadores del Plan de Acción.
            </p>
            <ul>
              {[...agendaActuations].sort((a, b) => (a.setting ?? "~").localeCompare(b.setting ?? "~") || a.order - b.order).map((a) => (
                <li key={a.id}>
                  {a.name ?? "Actuación vinculada al Plan de Acción"} · {a.setting ? AGENDA_SETTING_LABEL[a.setting] : "Sin entorno asignado"} · {ACTUATION_STATUS_LABEL[a.tracking.status]}
                  {a.identification.year ? ` · ${a.identification.quarter && a.identification.quarter !== "anual" ? `${a.identification.quarter} ` : ""}${a.identification.year}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="pie-doc-section">
        <h3>6. Seguimiento, evaluación y aprobación</h3>
        <p className="panel-note">
          El marco de seguimiento, la evaluación y la aprobación institucional se completarán
          cuando el Plan de Acción y su agenda estén cerrados. Hasta entonces este documento
          seguirá siendo un esbozo de trabajo y no un compromiso institucional definitivo.
        </p>
      </section>
    </article>
  );
}
