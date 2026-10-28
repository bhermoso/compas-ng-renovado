import { DocumentReference } from "./Documentation";
import { useEffect, useState } from "react";
import type { IBSEAdjustmentTarget } from "../../application/ibse/prepareIBSEImport";
import {
  loadGranadaTerritorialReferences,
  type GranadaTerritorialReferences,
  type TerritorialComparison as TerritorialComparisonModel,
} from "../../application/complementary-studies";
import { ANDALUSIA_REFERENCE_VALUE_BY_INDICATOR } from "../../application/eas-references";
import type { IBSEStudy } from "../../domain/ibse";
import type { DUKEStudy } from "../../domain/duke";
import type { PREDIMEDStudy } from "../../domain/predimed";
import type { SF12Study } from "../../domain/sf12";
import type { SuenoStudy } from "../../domain/sueno";
import type { CAGEStudy } from "../../domain/cage";
import type { AUDITCStudy } from "../../domain/auditc";
import type { IPAQStudy } from "../../domain/ipaq";
import type { GHQ12Study } from "../../domain/ghq12";
import type { PHQ9Study } from "../../domain/phq9";
import type { PSQIStudy } from "../../domain/psqi";
import type { FagerstromStudy } from "../../domain/fagerstrom";
import type { SBQStudy } from "../../domain/sbq";
import type { MunicipalDocumentRepository } from "../../domain/repository";
import { IBSEPanel } from "./IBSEPanel";
import { DUKEPanel } from "./DUKEPanel";
import { PREDIMEDPanel } from "./PREDIMEDPanel";
import { SF12Panel } from "./SF12Panel";
import { SuenoPanel } from "./SuenoPanel";
import { CAGEPanel } from "./CAGEPanel";
import { AUDITCPanel } from "./AUDITCPanel";
import { IPAQPanel } from "./IPAQPanel";
import { GHQ12Panel } from "./GHQ12Panel";
import { PHQ9Panel } from "./PHQ9Panel";
import { PSQIPanel } from "./PSQIPanel";
import { FagerstromPanel } from "./FagerstromPanel";
import { SBQPanel } from "./SBQPanel";
import { TerritorialComparison } from "./TerritorialComparison";

// ── Fila de instrumento ───────────────────────────────────────────────────────
// Lista fija y ordenada. El botón de carga es siempre visible.
// El input de fichero siempre está en el DOM — no se oculta nunca.
// Los detalles del estudio se muestran inline cuando está cargado.

interface StudyRowProps {
  name: string;
  subtitle: string;
  group: string;
  inputId: string;
  loaded: boolean;
  isLoading?: boolean;
  recordSummary?: string;
  sourceFileName?: string;
  message?: string | null;
  onLoadCSV?: (file: File) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  comparison?: TerritorialComparisonModel;
}

function StudyRow({
  name,
  subtitle,
  group,
  inputId,
  loaded,
  isLoading,
  recordSummary,
  sourceFileName,
  message,
  onLoadCSV,
  onDelete,
  children,
  comparison,
}: StudyRowProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className={`ec-study-row${loaded ? " ec-study-row--loaded" : ""}`}
      data-group={group.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}
      data-study={inputId.replace("-csv-input", "")}
    >
      <div className="ec-study-row__header">
        <span
          className={`ec-study-row__dot${loaded ? " ec-study-row__dot--loaded" : ""}`}
          aria-hidden="true"
        />
        <div className="ec-study-row__meta">
          <span className="ec-study-row__group">{group}</span>
          <span className="ec-study-row__name">{name}</span>
          <span className="ec-study-row__subtitle">{subtitle}</span>
        </div>
        <div className="ec-study-row__summary">
          {loaded ? (
            <>
              <span className="ec-study-row__record">{recordSummary ?? "Cargado"}</span>
              {sourceFileName && (
                <span className="ec-study-row__file"><DocumentReference fileName={sourceFileName}>{sourceFileName}</DocumentReference></span>
              )}
            </>
          ) : (
            <span className="ec-study-row__empty">Sin datos</span>
          )}
        </div>
        <div className="ec-study-row__actions">
          {/* Input siempre en el DOM — accesible vía label aunque invisible */}
          <label
            htmlFor={inputId}
            className={`ec-study-row__upload${isLoading ? " ec-study-row__upload--loading" : ""}`}
            aria-disabled={isLoading === true}
          >
            {isLoading
              ? "Procesando…"
              : loaded
              ? "Sustituir CSV"
              : "Cargar CSV"}
          </label>
          <input
            id={inputId}
            type="file"
            accept=".csv"
            disabled={isLoading === true}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file !== undefined && onLoadCSV !== undefined) onLoadCSV(file);
              e.target.value = "";
            }}
            className="ec-study-row__input"
          />
          {loaded && onDelete && (
            <button
              type="button"
              className="ec-study-row__delete"
              onClick={() => {
                if (window.confirm(`¿Eliminar ${name}?\nSe borrarán también sus evidencias derivadas.`)) {
                  onDelete();
                }
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      {message !== undefined && message !== null && !isLoading && (
        <p className="ec-study-row__message">{message}</p>
      )}
      {loaded && children && (
        <>
          <button
            type="button"
            className="ec-study-row__detail-toggle"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
          >
            {showDetail ? "Ocultar detalle ▲" : "Ver detalle ▾"}
          </button>
          {showDetail && (
            <div className="ec-study-row__detail">
              {comparison && <TerritorialComparison comparison={comparison} />}
              {children}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Props del panel principal ─────────────────────────────────────────────────

interface EstudiosComplementariosPanelProps {
  municipalityName?: string;

  ibseStudy?: IBSEStudy;
  isLoadingIBSE?: boolean;
  ibseMessage?: string | null;
  onLoadIBSECSV?: (file: File, target?: IBSEAdjustmentTarget) => void;

  dukeStudy?: DUKEStudy;
  isLoadingDUKE?: boolean;
  dukeMessage?: string | null;
  onLoadDUKECSV?: (file: File) => void;

  predimedStudy?: PREDIMEDStudy;
  isLoadingPREDIMED?: boolean;
  predimedMessage?: string | null;
  onLoadPREDIMEDCSV?: (file: File) => void;

  sf12Study?: SF12Study;
  isLoadingSF12?: boolean;
  sf12Message?: string | null;
  onLoadSF12CSV?: (file: File) => void;

  suenoStudy?: SuenoStudy;
  isLoadingSueno?: boolean;
  suenoMessage?: string | null;
  onLoadSuenoCSV?: (file: File) => void;

  cageStudy?: CAGEStudy;
  isLoadingCAGE?: boolean;
  cageMessage?: string | null;
  onLoadCAGECSV?: (file: File) => void;

  auditcStudy?: AUDITCStudy;
  isLoadingAUDITC?: boolean;
  auditcMessage?: string | null;
  onLoadAUDITCCSV?: (file: File) => void;

  ipaqStudy?: IPAQStudy;
  isLoadingIPAQ?: boolean;
  ipaqMessage?: string | null;
  onLoadIPAQCSV?: (file: File) => void;

  ghq12Study?: GHQ12Study;
  isLoadingGHQ12?: boolean;
  ghq12Message?: string | null;
  onLoadGHQ12CSV?: (file: File) => void;

  phq9Study?: PHQ9Study;
  isLoadingPHQ9?: boolean;
  phq9Message?: string | null;
  onLoadPHQ9CSV?: (file: File) => void;

  psqiStudy?: PSQIStudy;
  isLoadingPSQI?: boolean;
  psqiMessage?: string | null;
  onLoadPSQICSV?: (file: File) => void;

  fagerstromStudy?: FagerstromStudy;
  isLoadingFagerstrom?: boolean;
  fagerstromMessage?: string | null;
  onLoadFagerstromCSV?: (file: File) => void;

  sbqStudy?: SBQStudy;
  isLoadingSBQ?: boolean;
  sbqMessage?: string | null;
  onLoadSBQCSV?: (file: File) => void;

  // Repositorio y callback de borrado para el botón Eliminar
  repository?: MunicipalDocumentRepository;
  onDeleteDocument?: (documentId: string) => void;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function EstudiosComplementariosPanel({
  municipalityName,
  ibseStudy,
  isLoadingIBSE,
  ibseMessage,
  onLoadIBSECSV,
  dukeStudy,
  isLoadingDUKE,
  dukeMessage,
  onLoadDUKECSV,
  predimedStudy,
  isLoadingPREDIMED,
  predimedMessage,
  onLoadPREDIMEDCSV,
  sf12Study,
  isLoadingSF12,
  sf12Message,
  onLoadSF12CSV,
  suenoStudy,
  isLoadingSueno,
  suenoMessage,
  onLoadSuenoCSV,
  cageStudy,
  isLoadingCAGE,
  cageMessage,
  onLoadCAGECSV,
  auditcStudy,
  isLoadingAUDITC,
  auditcMessage,
  onLoadAUDITCCSV,
  ipaqStudy,
  isLoadingIPAQ,
  ipaqMessage,
  onLoadIPAQCSV,
  ghq12Study,
  isLoadingGHQ12,
  ghq12Message,
  onLoadGHQ12CSV,
  phq9Study,
  isLoadingPHQ9,
  phq9Message,
  onLoadPHQ9CSV,
  psqiStudy,
  isLoadingPSQI,
  psqiMessage,
  onLoadPSQICSV,
  fagerstromStudy,
  isLoadingFagerstrom,
  fagerstromMessage,
  onLoadFagerstromCSV,
  sbqStudy,
  isLoadingSBQ,
  sbqMessage,
  onLoadSBQCSV,
  repository,
  onDeleteDocument,
}: EstudiosComplementariosPanelProps) {
  const studySlots = [ibseStudy, dukeStudy, predimedStudy, sf12Study, suenoStudy, cageStudy, auditcStudy, ipaqStudy, ghq12Study, phq9Study, psqiStudy, fagerstromStudy, sbqStudy];
  const loadedCount = studySlots.filter(Boolean).length;
  const [granadaReferences, setGranadaReferences] = useState<GranadaTerritorialReferences>();
  const [ibseAdjustmentTarget, setIBSEAdjustmentTarget] = useState<IBSEAdjustmentTarget>("none");

  useEffect(() => {
    let active = true;
    loadGranadaTerritorialReferences()
      .then((references) => {
        if (active) setGranadaReferences(references);
      })
      .catch(() => {
        if (active) setGranadaReferences(undefined);
      });
    return () => { active = false; };
  }, []);

  const municipality = municipalityName ?? "Municipio";
  const easSource = "microdatos EAS de Granada (PROV=18), agregados con el parser canónico";
  const anda = ANDALUSIA_REFERENCE_VALUE_BY_INDICATOR;
  const noComparatorTerritorial =
    "Instrumento de administración propia (muestra local). Sin referencia provincial ni autonómica equivalente.";

  const buildComparison = (
    metrics: TerritorialComparisonModel["metrics"],
    source: string | null,
    methodologicalNote?: string,
  ): TerritorialComparisonModel => ({ municipalityName: municipality, metrics, source, methodologicalNote });

  // metric() admite un quinto arg opcional para el valor de Andalucía.
  const metric = (
    label: string,
    municipalityValue: number,
    granadaValue: number | null,
    unit: string,
    direction: "higher-is-favourable" | "lower-is-favourable",
    andaluciaValue: number | null = null,
  ) => ({ label, municipalityValue, granadaValue, andaluciaValue, unit, direction });

  const comparisons = {
    ibse: ibseStudy && buildComparison(
      [metric("Índice IBSE", ibseStudy.aggregates.meanTotal, granadaReferences?.ibse.meanTotal ?? null, "/100", "higher-is-favourable")],
      "monitor IBSE provincial de Granada, agregado con el parser canónico",
      "Referencia contextual provincial; no procede de la EAS ni constituye una estimación poblacional. Sin equivalente autonómico EAS.",
    ),
    duke: dukeStudy && buildComparison(
      [metric("Apoyo social global", dukeStudy.aggregates.meanGlobal, granadaReferences?.duke.meanGlobal ?? null, "/55", "higher-is-favourable", anda["duke-apoyo-global"] ?? null)],
      easSource,
    ),
    predimed: predimedStudy && buildComparison(
      [metric("Adherencia mediterránea", predimedStudy.aggregates.meanScore, granadaReferences?.predimed.meanScore ?? null, "/14", "higher-is-favourable", anda["predimed-adherencia"] ?? null)],
      easSource,
    ),
    sf12: sf12Study && buildComparison([
      metric("Salud física percibida (PCS)", sf12Study.aggregates.meanPCS, granadaReferences?.sf12.meanPCS ?? null, "/100", "higher-is-favourable", anda["sf12-pcs"] ?? null),
      metric("Salud mental percibida (MCS)", sf12Study.aggregates.meanMCS, granadaReferences?.sf12.meanMCS ?? null, "/100", "higher-is-favourable", anda["sf12-mcs"] ?? null),
    ], easSource),
    sueno: suenoStudy && buildComparison([
      metric("Sueño insuficiente", suenoStudy.aggregates.pctInsufficientSleep, granadaReferences?.sueno.pctInsufficientSleep ?? null, " %", "lower-is-favourable", anda["sueno-insuficiente"] ?? null),
      metric("Descanso insuficiente", suenoStudy.aggregates.pctNoRest, granadaReferences?.sueno.pctNoRest ?? null, " %", "lower-is-favourable", anda["sueno-no-descansa"] ?? null),
    ], easSource),
    cage: cageStudy && buildComparison(
      [metric("Riesgo CAGE", cageStudy.aggregates.pctRisk, granadaReferences?.cage.pctRisk ?? null, " %", "lower-is-favourable", anda["cage-riesgo"] ?? null)],
      easSource,
    ),
    ipaq: ipaqStudy && buildComparison([
      metric("Actividad física alta", ipaqStudy.aggregates.pctHigh, granadaReferences?.ipaq.pctHigh ?? null, " %", "higher-is-favourable", anda["ipaq-alta"] ?? null),
      metric("Inactividad en tiempo libre", ipaqStudy.aggregates.pctInactive, granadaReferences?.ipaq.pctInactive ?? null, " %", "lower-is-favourable", anda["ipaq-inactividad"] ?? null),
    ], easSource),
    auditc: auditcStudy && buildComparison(
      [metric("Cribado AUDIT-C positivo", auditcStudy.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
    ghq12: ghq12Study && buildComparison(
      [metric("Cribado GHQ-12 positivo", ghq12Study.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
    phq9: phq9Study && buildComparison(
      [metric("Síntomas depresivos moderados o superiores", phq9Study.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
    psqi: psqiStudy && buildComparison(
      [metric("Mala calidad del sueño", psqiStudy.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
    fagerstrom: fagerstromStudy && buildComparison(
      [metric("Dependencia moderada o superior", fagerstromStudy.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
    sbq: sbqStudy && buildComparison(
      [metric("Sedentarismo elevado", sbqStudy.aggregates.pctPositive, null, " %", "lower-is-favourable")],
      null, noComparatorTerritorial,
    ),
  };

  // Busca el documentId de un estudio por su tag en el repositorio
  function docIdByTag(tag: string): string | undefined {
    return repository?.documents.find((d) => d.tags.includes(tag))?.id;
  }

  function makeDeleteHandler(tag: string) {
    const id = docIdByTag(tag);
    if (id === undefined || onDeleteDocument === undefined) return undefined;
    return () => onDeleteDocument(id);
  }

  return (
    <section className="workspace-panel ec-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Estudios complementarios</p>
          <h2>Estudios Complementarios</h2>
        </div>
        <p className="panel-note">
          Instrumentos de medición sobre bienestar, apoyo social, alimentación y
          conductas de salud, aplicados sobre microdatos de la Encuesta Andaluza de Salud.{" "}
          {loadedCount > 0
            ? `${loadedCount} de ${studySlots.length} disponibles en este espacio de trabajo.`
            : "Ningún estudio cargado en este espacio de trabajo."}
        </p>
      </div>

      <div className="ec-studies">
        <label>
          Población objetivo del ajuste IBSE
          <select value={ibseAdjustmentTarget} disabled={isLoadingIBSE} onChange={(event) => setIBSEAdjustmentTarget(event.target.value as IBSEAdjustmentTarget)}>
            <option value="none">Sin ajuste demográfico</option>
            <option value="15-plus">Población municipal de 15 años y más</option>
          </select>
        </label>
        <StudyRow
          name="IBSE"
          subtitle="Índice de bienestar socioemocional"
          group="Bienestar"
          comparison={comparisons.ibse}
          inputId="ibse-csv-input"
          loaded={ibseStudy !== undefined}
          isLoading={isLoadingIBSE}
          recordSummary={ibseStudy ? `${ibseStudy.aggregates.nValid} válidos · media ${ibseStudy.aggregates.meanTotal}` : undefined}
          sourceFileName={ibseStudy?.sourceFileName}
          message={ibseMessage}
          onLoadCSV={(file) => onLoadIBSECSV?.(file, ibseAdjustmentTarget)}
          onDelete={makeDeleteHandler("ibse")}
        >
          <IBSEPanel ibseStudy={ibseStudy} isLoading={isLoadingIBSE} message={ibseMessage} onLoadCSV={onLoadIBSECSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="DUKE-EAS"
          subtitle="Apoyo social funcional"
          group="Apoyo social"
          comparison={comparisons.duke}
          inputId="duke-csv-input"
          loaded={dukeStudy !== undefined}
          isLoading={isLoadingDUKE}
          recordSummary={dukeStudy ? `${dukeStudy.aggregates.nValidGlobal} válidos · media ${dukeStudy.aggregates.meanGlobal}/55` : undefined}
          sourceFileName={dukeStudy?.sourceFileName}
          message={dukeMessage}
          onLoadCSV={onLoadDUKECSV}
          onDelete={makeDeleteHandler("duke-eas")}
        >
          <DUKEPanel dukeStudy={dukeStudy} isLoading={isLoadingDUKE} message={dukeMessage} onLoadCSV={onLoadDUKECSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="PREDIMED-EAS"
          subtitle="Adherencia a dieta mediterránea"
          group="Alimentación"
          comparison={comparisons.predimed}
          inputId="predimed-csv-input"
          loaded={predimedStudy !== undefined}
          isLoading={isLoadingPREDIMED}
          recordSummary={predimedStudy ? `${predimedStudy.aggregates.nValid} válidos · media ${predimedStudy.aggregates.meanScore}` : undefined}
          sourceFileName={predimedStudy?.sourceFileName}
          message={predimedMessage}
          onLoadCSV={onLoadPREDIMEDCSV}
          onDelete={makeDeleteHandler("predimed-eas")}
        >
          <PREDIMEDPanel predimedStudy={predimedStudy} isLoading={isLoadingPREDIMED} message={predimedMessage} onLoadCSV={onLoadPREDIMEDCSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="SF-12 EAS"
          subtitle="Salud percibida (PCS / MCS)"
          group="Bienestar"
          comparison={comparisons.sf12}
          inputId="sf12-csv-input"
          loaded={sf12Study !== undefined}
          isLoading={isLoadingSF12}
          recordSummary={sf12Study ? `${sf12Study.aggregates.nValidPCS} válidos · PCS ${sf12Study.aggregates.meanPCS.toFixed(1)} / MCS ${sf12Study.aggregates.meanMCS.toFixed(1)}` : undefined}
          sourceFileName={sf12Study?.sourceFileName}
          message={sf12Message}
          onLoadCSV={onLoadSF12CSV}
          onDelete={makeDeleteHandler("sf12-eas")}
        >
          <SF12Panel sf12Study={sf12Study} isLoading={isLoadingSF12} message={sf12Message} onLoadCSV={onLoadSF12CSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="Sueño EAS"
          subtitle="Duración y calidad subjetiva del sueño"
          group="Sueño"
          comparison={comparisons.sueno}
          inputId="sueno-csv-input"
          loaded={suenoStudy !== undefined}
          isLoading={isLoadingSueno}
          recordSummary={suenoStudy ? `${suenoStudy.aggregates.nValidP33R} válidos P33_R · ${suenoStudy.aggregates.pctInsufficientSleep.toFixed(1)} % insuficiente` : undefined}
          sourceFileName={suenoStudy?.sourceFileName}
          message={suenoMessage}
          onLoadCSV={onLoadSuenoCSV}
          onDelete={makeDeleteHandler("sueno-eas")}
        >
          <SuenoPanel suenoStudy={suenoStudy} isLoading={isLoadingSueno} message={suenoMessage} onLoadCSV={onLoadSuenoCSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="CAGE-EAS"
          subtitle="Riesgo de alcoholismo"
          group="Alcohol"
          comparison={comparisons.cage}
          inputId="cage-csv-input"
          loaded={cageStudy !== undefined}
          isLoading={isLoadingCAGE}
          recordSummary={cageStudy ? `${cageStudy.aggregates.nValidCAGER} válidos CAGE_R · riesgo ${cageStudy.aggregates.pctRisk.toFixed(1)} %` : undefined}
          sourceFileName={cageStudy?.sourceFileName}
          message={cageMessage}
          onLoadCSV={onLoadCAGECSV}
          onDelete={makeDeleteHandler("cage-eas")}
        >
          <CAGEPanel cageStudy={cageStudy} isLoading={isLoadingCAGE} message={cageMessage} onLoadCSV={onLoadCAGECSV} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="AUDIT-C"
          subtitle="Consumo de riesgo de alcohol (REDCap)"
          group="Alcohol"
          comparison={comparisons.auditc}
          inputId="auditc-csv-input"
          loaded={auditcStudy !== undefined}
          isLoading={isLoadingAUDITC}
          recordSummary={auditcStudy ? `${auditcStudy.aggregates.nValid} válidos · riesgo ${auditcStudy.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={auditcStudy?.sourceFileName}
          message={auditcMessage}
          onLoadCSV={onLoadAUDITCCSV}
          onDelete={makeDeleteHandler("auditc")}
        >
          <AUDITCPanel auditcStudy={auditcStudy} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="IPAQ-EAS"
          subtitle="Actividad física (EAS oficial)"
          group="Actividad física"
          comparison={comparisons.ipaq}
          inputId="ipaq-csv-input"
          loaded={ipaqStudy !== undefined}
          isLoading={isLoadingIPAQ}
          recordSummary={ipaqStudy ? `${ipaqStudy.aggregates.nValidIPAQ} válidos IPAQ_DICO · alta actividad ${ipaqStudy.aggregates.pctHigh.toFixed(1)} %` : undefined}
          sourceFileName={ipaqStudy?.sourceFileName}
          message={ipaqMessage}
          onLoadCSV={onLoadIPAQCSV}
          onDelete={makeDeleteHandler("ipaq-eas")}
        >
          <IPAQPanel ipaqStudy={ipaqStudy} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="GHQ-12"
          subtitle="Malestar psicológico (REDCap)"
          group="Bienestar"
          comparison={comparisons.ghq12}
          inputId="ghq12-csv-input"
          loaded={ghq12Study !== undefined}
          isLoading={isLoadingGHQ12}
          recordSummary={ghq12Study ? `${ghq12Study.aggregates.nValid} válidos · probable malestar ${ghq12Study.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={ghq12Study?.sourceFileName}
          message={ghq12Message}
          onLoadCSV={onLoadGHQ12CSV}
          onDelete={makeDeleteHandler("ghq12")}
        >
          <GHQ12Panel ghq12Study={ghq12Study} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="PHQ-9"
          subtitle="Síntomas depresivos (REDCap)"
          group="Bienestar"
          comparison={comparisons.phq9}
          inputId="phq9-csv-input"
          loaded={phq9Study !== undefined}
          isLoading={isLoadingPHQ9}
          recordSummary={phq9Study ? `${phq9Study.aggregates.nValid} válidos · síntomas mod.+ ${phq9Study.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={phq9Study?.sourceFileName}
          message={phq9Message}
          onLoadCSV={onLoadPHQ9CSV}
          onDelete={makeDeleteHandler("phq9")}
        >
          <PHQ9Panel phq9Study={phq9Study} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="PSQI"
          subtitle="Calidad del sueño (REDCap)"
          group="Sueño"
          comparison={comparisons.psqi}
          inputId="psqi-csv-input"
          loaded={psqiStudy !== undefined}
          isLoading={isLoadingPSQI}
          recordSummary={psqiStudy ? `${psqiStudy.aggregates.nValid} válidos · mal dormidor ${psqiStudy.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={psqiStudy?.sourceFileName}
          message={psqiMessage}
          onLoadCSV={onLoadPSQICSV}
          onDelete={makeDeleteHandler("psqi")}
        >
          <PSQIPanel psqiStudy={psqiStudy} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="Fagerström (FTND)"
          subtitle="Dependencia a la nicotina (REDCap)"
          group="Tabaco"
          comparison={comparisons.fagerstrom}
          inputId="fagerstrom-csv-input"
          loaded={fagerstromStudy !== undefined}
          isLoading={isLoadingFagerstrom}
          recordSummary={fagerstromStudy ? `${fagerstromStudy.aggregates.nValid} fumadores · dep. mod.+ ${fagerstromStudy.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={fagerstromStudy?.sourceFileName}
          message={fagerstromMessage}
          onLoadCSV={onLoadFagerstromCSV}
          onDelete={makeDeleteHandler("fagerstrom")}
        >
          <FagerstromPanel fagerstromStudy={fagerstromStudy} municipalityName={municipalityName} />
        </StudyRow>

        <StudyRow
          name="SBQ"
          subtitle="Comportamiento sedentario (REDCap)"
          group="Sedentarismo"
          comparison={comparisons.sbq}
          inputId="sbq-csv-input"
          loaded={sbqStudy !== undefined}
          isLoading={isLoadingSBQ}
          recordSummary={sbqStudy ? `${sbqStudy.aggregates.nValid} válidos · alt. sedentario ${sbqStudy.aggregates.pctPositive.toFixed(1)} %` : undefined}
          sourceFileName={sbqStudy?.sourceFileName}
          message={sbqMessage}
          onLoadCSV={onLoadSBQCSV}
          onDelete={makeDeleteHandler("sbq")}
        >
          <SBQPanel sbqStudy={sbqStudy} municipalityName={municipalityName} />
        </StudyRow>
      </div>
    </section>
  );
}
