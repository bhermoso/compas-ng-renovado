import { describeSAM } from "../../application/sam/describeSAM";
import type { IBSEStudy } from "../../domain/ibse";
import { describeIBSESampleScope, validateIBSEStrataCounts } from "../../domain/ibse";
import { IBSE_MODULE } from "../../domain/methodology/definitions/ibse";
import {
  assessIBSEStudySAM,
  getPopulationReferenceSet,
} from "../../application/sam";
import { SamObservedAssessment } from "./SamObservedAssessment";
import type { SampleQualityAssessment } from "../../domain/sam";

interface IBSEPanelProps {
  ibseStudy?: IBSEStudy;
  isLoading?: boolean;
  message?: string | null;
  onLoadCSV?: (file: File) => void;
  municipalityName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso.slice(0, 10); }
}

// [Regla del sistema] Umbrales heurísticos — no normativos ni clínicos.
function getIBSELevel(value: number): "alto" | "medio" | "medio-bajo" | "bajo" {
  if (value >= 75) return "alto";
  if (value >= 60) return "medio";
  if (value >= 50) return "medio-bajo";
  return "bajo";
}

const IBSE_FACTORS: Array<{
  label: string;
  field: keyof Pick<IBSEStudy["aggregates"],
    "meanTotal" | "meanFactorVinculo" | "meanFactorSituacion" | "meanFactorControl" | "meanFactorPersona">;
  isTotal?: boolean;
}> = [
  { label: "Índice total IBSE", field: "meanTotal", isTotal: true },
  { label: "Vínculo",     field: "meanFactorVinculo" },
  { label: "Situación",   field: "meanFactorSituacion" },
  { label: "Control",     field: "meanFactorControl" },
  { label: "Persona",     field: "meanFactorPersona" },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function IBSEPanel({ ibseStudy, municipalityName }: IBSEPanelProps) {
  if (ibseStudy === undefined) return null;

  const module = IBSE_MODULE;
  const note = module.institutionalNote;
  const mun = municipalityName ?? "el municipio";
  const { aggregates: agg } = ibseStudy;

  // Descripción del universo etario DERIVADA del discriminador de la muestra. Para
  // una muestra mixta, la descripción distingue si hay un desglose etario completo
  // y válido (recuentos que cuadran con los totales) o no: así la UI no afirma "no
  // permite desglosar" cuando de hecho muestra ambos dictámenes por estrato.
  const hasValidBreakdown =
    ibseStudy.sampleScope === "mixed" &&
    validateIBSEStrataCounts(ibseStudy.strataCounts, ibseStudy.aggregates).valid;
  const scopeDesc = describeIBSESampleScope(ibseStudy.sampleScope, { hasValidBreakdown });

  const totalLevel = getIBSELevel(agg.meanTotal);

  // Dictamen SAM gobernado por el discriminador de muestra. Una muestra mixta sin
  // desglose etario válido NO produce dictamen por estrato (no evaluable). Cuando
  // una muestra mixta SÍ tiene desglose válido, se muestran AMBOS dictámenes.
  const popRefs = getPopulationReferenceSet(ibseStudy.municipalityId);
  const sam = assessIBSEStudySAM(ibseStudy, { adult: popRefs.adult, minor: popRefs.minor });
  // Todos los dictámenes disponibles, cada uno con su etiqueta de estrato. No se
  // colapsa a uno solo (nada de `plus16 ?? under16`).
  const samStrata: Array<{ key: string; label: string; a: SampleQualityAssessment }> = [
    ...(sam.under16 ? [{ key: "menores", label: "Menores de 16", a: sam.under16 }] : []),
    ...(sam.plus16 ? [{ key: "16plus", label: "16 años o más", a: sam.plus16 }] : []),
  ];
  const samSummaryNote = samStrata.length > 0
    ? samStrata
        .map(
          (s) =>
            `SAM ${s.label}: ${describeSAM(s.a)}`
        )
        .join(" ")
    : `SAM por estrato: ${sam.notEvaluableReason ?? "sin referencia poblacional verificada para este municipio."}`;

  // Dispersión interfactorial
  const factorValues = [
    agg.meanFactorVinculo, agg.meanFactorSituacion,
    agg.meanFactorControl, agg.meanFactorPersona,
  ];
  const minFactor = Math.min(...factorValues);
  const maxFactor = Math.max(...factorValues);
  const dispersion = Math.round((maxFactor - minFactor) * 10) / 10;
  const dispLevel: "alta" | "moderada" | "baja" =
    dispersion > 20 ? "alta" : dispersion > 10 ? "moderada" : "baja";

  const factorNames = [
    { value: agg.meanFactorVinculo, label: "Vínculo" },
    { value: agg.meanFactorSituacion, label: "Situación" },
    { value: agg.meanFactorControl, label: "Control" },
    { value: agg.meanFactorPersona, label: "Persona" },
  ];
  const lowestFactor = factorNames.reduce((a, b) => a.value < b.value ? a : b);

  const executiveSummary: string[] = [
    scopeDesc.sampleSentence,
    `La muestra municipal participante de ${mun} obtiene un Índice IBSE de ${agg.meanTotal}/100 — nivel ${totalLevel} (umbrales heurísticos del sistema, no normativos).`,
    `El factor con menor puntuación es ${lowestFactor.label} (${lowestFactor.value}/100), que señala la dimensión más vulnerable del bienestar socioemocional en la muestra.`,
    dispLevel === "alta"
      ? `La dispersión interfactorial es alta (${dispersion} puntos): el índice total puede no representar adecuadamente la diversidad de dimensiones. Se recomienda el análisis por factor.`
      : `La dispersión interfactorial es ${dispLevel} (${dispersion} puntos). Los factores presentan un perfil relativamente homogéneo.`,
    samSummaryNote,
  ];

  const pslParagraph =
    `En ${mun}, el Índice de Bienestar Socioemocional (IBSE) de la muestra municipal participante ` +
    `(n = ${agg.nValid} registros válidos) es de ${agg.meanTotal}/100 — nivel ${totalLevel}. ` +
    `El factor ${lowestFactor.label} (${lowestFactor.value}/100) es la dimensión con menor puntuación. ` +
    `La dispersión interfactorial es ${dispLevel} (${dispersion} puntos). ` +
    `Este resultado aporta evidencia sobre el bienestar subjetivo de la muestra municipal participante ` +
    `para el capítulo de Diagnóstico de Salud del Perfil de Salud Local.`;

  return (
    <div className="study-report">

      {/* CABECERA */}
      <header className="study-report__header">
        <div className="study-report__header-identity">
          <span className="study-report__label">Estudio complementario</span>
          <h3 className="study-report__name">{module.identity.name}</h3>
          <p className="study-report__constructo">
            {module.identity.purpose.split(".")[0]}.
          </p>
        </div>
        <div className="study-report__header-meta">
          <span className="study-report__tag">REDCap municipal</span>
          <span className="study-report__tag">{scopeDesc.shortLabel}</span>
          <span className="study-report__meta-date">Importado el {formatDate(ibseStudy.createdAt)}</span>
          <span className="study-report__meta-n">{agg.nValid} registros válidos</span>
        </div>
      </header>

      {/* UNIVERSO DE LA MUESTRA (derivado del discriminador) */}
      <section className="study-report__section">
        <p className="study-report__section-title">Universo de la muestra</p>
        <p className="study-report__interpretation" data-sample-scope={ibseStudy.sampleScope}>
          {scopeDesc.sampleSentence}
        </p>
      </section>

      {/* EN SÍNTESIS */}
      <section className="study-report__section">
        <p className="study-report__section-title">En síntesis</p>
        <ul className="study-report__summary-list">
          {executiveSummary.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      {/* RESULTADOS */}
      <section className="study-report__section">
        <p className="study-report__section-title">Resultados en {mun}</p>
        <div className="study-bar-section">
          {/* Escala de referencia */}
          <div className="study-bar-scale">
            <span style={{ left: "50%" }} className="study-bar-scale__mark" title="50">50</span>
            <span style={{ left: "60%" }} className="study-bar-scale__mark" title="60">60</span>
            <span style={{ left: "75%" }} className="study-bar-scale__mark" title="75">75</span>
            <span style={{ left: "100%" }} className="study-bar-scale__mark study-bar-scale__mark--end" title="100">100</span>
          </div>
          <table className="study-bar-table">
            <tbody>
              {IBSE_FACTORS.map(({ label, field, isTotal }) => {
                const value = agg[field];
                const level = getIBSELevel(value);
                return (
                  <tr key={field} className={`study-bar-row${isTotal ? " study-bar-row--total" : ""}`}>
                    <td className="study-bar-row__label">{label}</td>
                    <td className="study-bar-row__track-cell">
                      <div className="study-bar-track">
                        <div className="study-bar-fill"
                          style={{ width: `${value}%` }}
                          aria-label={`${value} sobre 100`}
                        />
                        <span className="study-bar-mark study-bar-mark--50" title="Umbral medio-bajo (50)" />
                        <span className="study-bar-mark study-bar-mark--60" title="Umbral medio (60)" />
                        <span className="study-bar-mark study-bar-mark--75" title="Umbral alto (75)" />
                      </div>
                    </td>
                    <td className="study-bar-row__value">{value}</td>
                    <td className="study-bar-row__level" data-level={level}>{level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leyenda de umbrales */}
        <p className="study-threshold-legend">
          Umbrales del sistema (heurísticos, no normativos):
          {" "}<span className="study-threshold-badge" data-level="bajo">bajo &lt;50</span>
          {" "}<span className="study-threshold-badge" data-level="medio-bajo">medio-bajo 50–59</span>
          {" "}<span className="study-threshold-badge" data-level="medio">medio 60–74</span>
          {" "}<span className="study-threshold-badge" data-level="alto">alto ≥75</span>
        </p>

        {/* Dispersión interfactorial */}
        <p className={`study-dispersion study-dispersion--${dispLevel}`}>
          Dispersión interfactorial: {dispersion} puntos ({dispLevel}).
          {dispLevel === "alta" && (
            <> El índice total puede no representar adecuadamente la diversidad
            de dimensiones. Revisar cada factor de forma independiente.
            <em> [Regla del sistema]</em></>
          )}
        </p>

        {/* Muestra */}
        <p className="study-report__footnote">
          n válido = {agg.nValid} · n bruto = {agg.n}
          {agg.n > 0 && (
            <> · Incompletos: {(((agg.n - agg.nValid) / agg.n) * 100).toFixed(1)} %</>
          )}
        </p>
      </section>

      {/* INTERPRETACIÓN */}
      {note && (
        <section className="study-report__section">
          <p className="study-report__section-title">Interpretación para el diagnóstico municipal</p>
          <p className="study-report__interpretation">{note.diagnosticInterpretation}</p>
        </section>
      )}

      {/* CALIDAD */}
      <section className="study-report__section">
        <p className="study-report__section-title">Calidad de la evidencia</p>
        <div className="study-report__quality-grid">
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Registros válidos</span>
            <span className="study-report__quality-value">{agg.nValid}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Registros brutos</span>
            <span className="study-report__quality-value">{agg.n}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Dispersión</span>
            <span className="study-report__quality-value">{dispLevel}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Valoración</span>
            {samStrata.length > 0 ? (
              <span className="study-report__quality-value">SAM por estrato</span>
            ) : (
              <span className="study-report__quality-value">No evaluable</span>
            )}
          </div>
        </div>

        {/* Dictámenes SAM por estrato — se muestran TODOS los disponibles. */}
        {samStrata.length > 0 ? (
          samStrata.map((s) => (
            <p key={s.key} className="study-report__quality-note" data-sam-stratum={s.key}>
              <strong>SAM — {s.label}:</strong>{" "}
              {s.a.sampleQualityRationale}{" "}
              N observado: {s.a.nObserved} · N teórico Cochran: {s.a.nTheoretical} ·
              Porcentaje del tamaño teórico: {s.a.coverageGlobal.toFixed(1)} %
              (referencia: {s.a.populationReference.ageGroupLabel} — {s.a.populationReference.source}, {s.a.populationReference.year}).
            </p>
          ))
        ) : (
          <p className="study-report__quality-note">
            SAM por estrato: {sam.notEvaluableReason
              ?? "sin referencia poblacional verificada para este municipio."}{" "}
            Confianza metodológica: No evaluable; falta información del diseño y la participación.
          </p>
        )}
      </section>

      {/* COMPOSICIÓN POR EDAD Y SEXO (SAM) */}
      <SamObservedAssessment
        municipalityId={ibseStudy.municipalityId}
        instrumentId="ibse"
        title={`IBSE — ${mun}`}
        observed={ibseStudy.ageSexObserved?.cells}
        missingReason="El estudio no conserva la edad y el sexo de los participantes: el CSV importado no incluía las columnas «sexo» y «edad», o el municipio no tenía padrón por edad y sexo en el momento de importarlo."
        defaultFromAge={ibseStudy.sampleScope === "16-plus" ? 20 : 0}
      />

      {/* LÍNEAS DE OBSERVACIÓN */}
      {note?.implications && (
        <section className="study-report__section">
          <p className="study-report__section-title">Líneas de observación para el diagnóstico</p>
          <ul className="study-report__implications-list">
            {note.implications.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>
      )}

      {/* INTEGRACIÓN PSL */}
      {note?.pslIntegration && (
        <section className="study-report__section">
          <p className="study-report__section-title">Integración en el Perfil de Salud Local</p>
          <p className="study-report__psl-chapter">Capítulo: {note.pslIntegration.chapter}</p>
          <div className="study-report__psl-determinants">
            {note.pslIntegration.determinants.map((d, i) => (
              <span key={i} className="study-report__psl-determinant">{d}</span>
            ))}
          </div>
          <p className="study-report__psl-contribution">{note.pslIntegration.contribution}</p>
          <p className="study-report__psl-contribution" style={{ marginTop: "8px", fontStyle: "italic" }}>
            {pslParagraph}
          </p>
        </section>
      )}

      {/* COHERENCIA CON OTRAS EVIDENCIAS */}
      <section className="study-report__section">
        <p className="study-report__section-title">Coherencia con otras evidencias</p>
        <p className="study-report__interpretation">
          El IBSE mide el bienestar socioemocional de la muestra municipal
          participante ({scopeDesc.shortLabel.toLowerCase()}); su comparación con los instrumentos EAS
          (SF-12, DUKE-EAS, PREDIMED, Sueño, CAGE) requiere comprobar
          las edades, la composición y los procedimientos de las muestras.
          Cuando el SF-12 MCS está disponible, la comparación entre el bienestar emocional
          de la muestra IBSE y la salud mental percibida adulta puede caracterizar si el perfil
          de bienestar subjetivo de {mun} muestra diferencias relevantes entre grupos.
          Si el IBSE muestra un nivel bajo en el Factor Vínculo, resulta coherente explorarlo
          junto al DUKE-EAS, dado que ambos abordan dimensiones relacionales del bienestar.
          Cualquier concordancia o discrepancia entre instrumentos amplía el diagnóstico sin
          permitir establecer relaciones causales.
        </p>
      </section>

      {ibseStudy.demographicAdjustment && (
        <section className="study-report__section">
          <h4>Ajuste demográfico</h4>
          {ibseStudy.demographicAdjustment.status === "blocked" ? (
            <ul>{ibseStudy.demographicAdjustment.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          ) : (
            <>
              <p>Población de referencia: {ibseStudy.demographicAdjustment.reference.ageGroupLabel}. Resultado pendiente de validación humana.</p>
              <table>
                <thead><tr><th scope="col">Dimensión</th><th scope="col">Media observada</th><th scope="col">Media ajustada</th></tr></thead>
                <tbody>{IBSE_FACTORS.map(({ field, label }) => {
                  const metric = ibseStudy.demographicAdjustment?.status === "computed" ? ibseStudy.demographicAdjustment.metrics[field] : undefined;
                  return metric && <tr key={field}><th scope="row">{label}</th><td>{metric.observedMean.toFixed(1)}</td><td>{metric.adjustedMean.toFixed(1)}</td></tr>;
                })}</tbody>
              </table>
              <p>{ibseStudy.demographicAdjustment.metrics.meanTotal.nValid} respuestas válidas; tamaño efectivo por dispersión de pesos: {ibseStudy.demographicAdjustment.metrics.meanTotal.effectiveSampleSize.toFixed(1)}.</p>
              <p>Fuente: {ibseStudy.demographicAdjustment.reference.source}</p>
              <ul>{ibseStudy.demographicAdjustment.methodologicalCautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
              <details><summary>Procedencia del ajuste</summary><p style={{ overflowWrap: "anywhere" }}>SHA-256: {ibseStudy.demographicAdjustment.sampleFingerprint}</p></details>
            </>
          )}
        </section>
      )}

      {/* COLAPSABLES */}
      <details className="study-report__collapsible">
        <summary>Descripción del instrumento</summary>
        <div className="study-report__collapsible-body">
          <dl className="study-report__instrument-dl">
            <dt>Nombre oficial</dt><dd>{module.identity.name}</dd>
            <dt>Acrónimo</dt><dd>{module.identity.shortName}</dd>
            <dt>Constructo</dt><dd>{module.identity.description}</dd>
            <dt>Población</dt><dd>{module.identity.targetPopulation}</dd>
            <dt>Ítems</dt><dd>{module.items.length} ítems · escala Likert 1–5</dd>
            <dt>Rango</dt><dd>0–100 · mayor puntuación = mayor bienestar</dd>
            <dt>Fuente</dt><dd>REDCap municipal (exportación de datos del municipio)</dd>
            <dt>Estado módulo</dt><dd>En revisión (draft) — pendiente contraste con Bericat (2014)</dd>
          </dl>
          <p className="study-report__subsection-title">Factores</p>
          {module.dimensions
            .filter(d => !d.isComposite)
            .map(d => (
              <p key={d.id} className="study-report__dimension-item">
                <strong>{d.name}</strong> — {d.description}
              </p>
            ))}
          {module.algorithm.notes && (
            <p className="study-report__algo-note">Nota: {module.algorithm.notes}</p>
          )}
        </div>
      </details>

      {note?.publicHealthApplication && (
        <details className="study-report__collapsible">
          <summary>Aplicación en salud pública</summary>
          <div className="study-report__collapsible-body">
            <p className="study-report__subsection-title">Qué mide</p>
            <ul className="study-report__sp-list">
              {note.publicHealthApplication.measures.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            <p className="study-report__subsection-title">Qué no mide</p>
            <ul className="study-report__sp-list">
              {note.publicHealthApplication.doesNotMeasure.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            <p className="study-report__subsection-title">Contexto de uso</p>
            <ul className="study-report__sp-list">
              {note.publicHealthApplication.contextualUse.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            {note.publicHealthApplication.commonMisinterpretations && (
              <>
                <p className="study-report__subsection-title">Errores frecuentes</p>
                <ul className="study-report__sp-list study-report__sp-list--caution">
                  {note.publicHealthApplication.commonMisinterpretations.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </>
            )}
          </div>
        </details>
      )}

      <details className="study-report__collapsible">
        <summary>Cautelas metodológicas</summary>
        <div className="study-report__collapsible-body">
          {module.limitations.length > 0 && (
            <>
              <p className="study-report__subsection-title">Del instrumento</p>
              <ul className="study-report__cautions-list">
                {module.limitations.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </>
          )}
          {ibseStudy.methodologicalCautions.length > 0 && (
            <>
              <p className="study-report__subsection-title">De la muestra importada</p>
              <ul className="study-report__cautions-list">
                {ibseStudy.methodologicalCautions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
        </div>
      </details>

      <details className="study-report__collapsible">
        <summary>Evidencia y trazabilidad</summary>
        <div className="study-report__collapsible-body">
          <dl className="study-report__evidence-dl">
            <dt>Archivo fuente</dt>
            <dd className="study-report__evidence-file">{ibseStudy.sourceFileName}</dd>
            <dt>Fecha de importación</dt><dd>{formatDate(ibseStudy.createdAt)}</dd>
            <dt>Tipo de fuente</dt><dd>Exportación REDCap municipal (monitor IBSE)</dd>
            <dt>Registros brutos</dt><dd>{agg.n}</dd>
            <dt>Registros válidos</dt><dd>{agg.nValid}</dd>
            {ibseStudy.exportedAt && (
              <><dt>Fecha de exportación REDCap</dt><dd>{formatDate(ibseStudy.exportedAt)}</dd></>
            )}
          </dl>
        </div>
      </details>

      <details className="study-report__collapsible">
        <summary>Fundamento científico</summary>
        <div className="study-report__collapsible-body">
          {module.bibliography.map((ref, i) => (
            <div key={i} className="study-report__bib-item">
              <span className="study-report__bib-role">Instrumento original</span>
              {ref.authors} ({ref.year}).
              {ref.notes && <> {ref.notes}</>}
            </div>
          ))}
          <p className="study-report__algo-note">
            El monitor histórico COMPÁS disponía de valores de referencia provinciales
            para el IBSE, pero estos no son equivalentes a los datos de la Encuesta
            Andaluza de Salud (EAS) y no constituyen referencia territorial operativa
            para este instrumento. La comparación territorial se realiza únicamente
            a través del componente de referencia EAS cuando está disponible.
          </p>
        </div>
      </details>

      <p className="study-institutional-note">
        La decisión territorial corresponde siempre al equipo técnico.
      </p>
    </div>
  );
}
