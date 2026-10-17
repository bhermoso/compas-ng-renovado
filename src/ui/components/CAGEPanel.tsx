import type { CAGEStudy } from "../../domain/cage";
import { CAGE_EAS_MODULE } from "../../domain/methodology/definitions/cage-eas";
import { getSampleQualityVerdict } from "./studyPanelUtils";

interface CAGEPanelProps {
  cageStudy?: CAGEStudy;
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

// Descripción del nivel de riesgo según prevalencia en la muestra evaluada
function getRiskLevel(pct: number): "elevada" | "moderada" | "baja" {
  if (pct > 10) return "elevada";
  if (pct > 5)  return "moderada";
  return "baja";
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CAGEPanel({ cageStudy, municipalityName }: CAGEPanelProps) {
  if (cageStudy === undefined) return null;

  const module = CAGE_EAS_MODULE;
  const note = module.institutionalNote;
  const mun = municipalityName ?? "el municipio";
  const { aggregates: agg } = cageStudy;

  const quality = getSampleQualityVerdict(agg.nValidCAGER);
  const hasOrdinal = agg.nValidCAGE > 0;
  const missingRate = agg.n > 0
    ? ((agg.missingCAGER / agg.n) * 100).toFixed(1)
    : "0.0";

  const riskLevel = getRiskLevel(agg.pctRisk);

  const ordinalBullet = hasOrdinal
    ? `Distribución de consumo: bebedor social ${((agg.nCAGE1 / agg.nValidCAGE) * 100).toFixed(1)} % · riesgo ${((agg.nCAGE2 / agg.nValidCAGE) * 100).toFixed(1)} % · perjudicial ${((agg.nCAGE3 / agg.nValidCAGE) * 100).toFixed(1)} % · dependencia ${((agg.nCAGE4 / agg.nValidCAGE) * 100).toFixed(1)} %.`
    : "La distribución ordinal por nivel de consumo (CAGE 1–4) no está disponible en esta muestra.";

  const executiveSummary: string[] = [
    `En ${mun}, el ${agg.pctRisk.toFixed(1)} % de la población adulta evaluada (n = ${agg.nValidCAGER}) presenta señales de riesgo de consumo problemático de alcohol — prevalencia ${riskLevel}.`,
    `El missing estructural (${agg.missingCAGER} personas, ${missingRate} % del total) corresponde mayoritariamente a personas abstemias, no evaluadas por el protocolo EAS.`,
    ordinalBullet,
    quality.note,
  ];

  const pslParagraph =
    `En ${mun}, la prevalencia de señales de riesgo de consumo problemático de alcohol ` +
    `(CAGE-EAS, n = ${agg.nValidCAGER} adultos evaluados) es del ${agg.pctRisk.toFixed(1)} %. ` +
    `El ${missingRate} % de la muestra no fue evaluado (abstemia u otro criterio de exclusión EAS). ` +
    (hasOrdinal
      ? `La distribución por nivel de consumo muestra: bebedor social ${((agg.nCAGE1 / agg.nValidCAGE) * 100).toFixed(1)} %, consumo de riesgo ${((agg.nCAGE2 / agg.nValidCAGE) * 100).toFixed(1)} %, perjudicial ${((agg.nCAGE3 / agg.nValidCAGE) * 100).toFixed(1)} %, dependencia ${((agg.nCAGE4 / agg.nValidCAGE) * 100).toFixed(1)} %. `
      : "") +
    `Este resultado contribuye al análisis de conductas de riesgo en el capítulo de Determinantes de Salud del Perfil de Salud Local.`;

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
          <span className="study-report__tag">Encuesta Andaluza de Salud</span>
          <span className="study-report__tag">{module.identity.targetPopulation}</span>
          <span className="study-report__meta-date">Importado el {formatDate(cageStudy.createdAt)}</span>
          <span className="study-report__meta-n">{agg.nValidCAGER} evaluados · {agg.pctRisk.toFixed(1)} % riesgo</span>
        </div>
      </header>

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
          <table className="study-bar-table">
            <tbody>
              <tr className="study-bar-row study-bar-row--total">
                <td className="study-bar-row__label">Señal de riesgo (CAGE_R)</td>
                <td className="study-bar-row__track-cell">
                  <div className="study-bar-track">
                    <div className="study-bar-fill"
                      style={{ width: `${agg.pctRisk}%` }}
                      aria-label={`${agg.pctRisk.toFixed(1)} %`}
                    />
                  </div>
                </td>
                <td className="study-bar-row__value">{agg.pctRisk.toFixed(1)} %</td>
                <td className="study-bar-row__level study-bar-row__level--detail">
                  n={agg.nRisk} de {agg.nValidCAGER}
                </td>
              </tr>

              {hasOrdinal && (
                <>
                  <tr className="study-bar-row">
                    <td className="study-bar-row__label">Bebedor social (nivel 1)</td>
                    <td className="study-bar-row__track-cell">
                      <div className="study-bar-track">
                        <div className="study-bar-fill"
                          style={{ width: `${(agg.nCAGE1 / agg.nValidCAGE) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="study-bar-row__value">
                      {((agg.nCAGE1 / agg.nValidCAGE) * 100).toFixed(1)} %
                    </td>
                    <td className="study-bar-row__level study-bar-row__level--detail">n={agg.nCAGE1}</td>
                  </tr>
                  <tr className="study-bar-row">
                    <td className="study-bar-row__label">Consumo de riesgo (nivel 2)</td>
                    <td className="study-bar-row__track-cell">
                      <div className="study-bar-track">
                        <div className="study-bar-fill"
                          style={{ width: `${(agg.nCAGE2 / agg.nValidCAGE) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="study-bar-row__value">
                      {((agg.nCAGE2 / agg.nValidCAGE) * 100).toFixed(1)} %
                    </td>
                    <td className="study-bar-row__level study-bar-row__level--detail">n={agg.nCAGE2}</td>
                  </tr>
                  <tr className="study-bar-row">
                    <td className="study-bar-row__label">Consumo perjudicial (nivel 3)</td>
                    <td className="study-bar-row__track-cell">
                      <div className="study-bar-track">
                        <div className="study-bar-fill"
                          style={{ width: `${(agg.nCAGE3 / agg.nValidCAGE) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="study-bar-row__value">
                      {((agg.nCAGE3 / agg.nValidCAGE) * 100).toFixed(1)} %
                    </td>
                    <td className="study-bar-row__level study-bar-row__level--detail">n={agg.nCAGE3}</td>
                  </tr>
                  <tr className="study-bar-row">
                    <td className="study-bar-row__label">Dependencia grave (nivel 4)</td>
                    <td className="study-bar-row__track-cell">
                      <div className="study-bar-track">
                        <div className="study-bar-fill"
                          style={{ width: `${(agg.nCAGE4 / agg.nValidCAGE) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="study-bar-row__value">
                      {((agg.nCAGE4 / agg.nValidCAGE) * 100).toFixed(1)} %
                    </td>
                    <td className="study-bar-row__level study-bar-row__level--detail">n={agg.nCAGE4}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {agg.missingCAGER > 0 && (
          <p className="study-report__footnote">
            No evaluados: {agg.missingCAGER} de {agg.n} ({missingRate} %) —
            abstemia u otro criterio de exclusión EAS (missing estructural, no error de recogida).
          </p>
        )}
        {agg.nRisk < 10 && agg.nRisk > 0 && (
          <p className="study-report__footnote" style={{ color: "#b45309", marginTop: "4px" }}>
            Prevalencia muy baja (n={agg.nRisk} positivos): los porcentajes deben
            interpretarse con extrema precaución por el tamaño de celda.
          </p>
        )}
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
            <span className="study-report__quality-label">Evaluados (CAGE_R)</span>
            <span className="study-report__quality-value">{agg.nValidCAGER}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">No evaluados</span>
            <span className="study-report__quality-value">{agg.missingCAGER}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Procesados</span>
            <span className="study-report__quality-value">{agg.n}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Valoración</span>
            <span className={`study-report__quality-verdict study-report__quality-verdict--${quality.key}`}>
              {quality.label}
            </span>
          </div>
        </div>
        <p className="study-report__quality-note">
          {quality.note} La evaluación completa de la representatividad requiere el análisis SAM.
        </p>
      </section>

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
          El consumo de riesgo de alcohol (CAGE-EAS) forma parte del análisis de estilos
          de vida de la población adulta. Cuando el PREDIMED-EAS está disponible, la lectura
          conjunta de adherencia dietética y consumo de alcohol delimita el perfil de
          conductas de salud de {mun}: la presencia simultánea de baja adherencia
          mediterránea y prevalencia elevada de CAGE_R positivo señalaría dos determinantes
          de salud cardiovascular coincidentes. Si el SF-12 MCS muestra peor salud mental
          percibida junto a una prevalencia elevada de riesgo de consumo, ambos resultados
          son consistentes con la literatura, aunque no permiten establecer relación causal.
          Una discrepancia entre prevalencia de riesgo baja y MCS bajo orientaría el
          análisis hacia otros determinantes del bienestar emocional.
        </p>
      </section>

      {/* COLAPSABLES */}
      <details className="study-report__collapsible">
        <summary>Descripción del instrumento</summary>
        <div className="study-report__collapsible-body">
          <dl className="study-report__instrument-dl">
            <dt>Nombre oficial</dt><dd>{module.identity.name}</dd>
            <dt>Acrónimo</dt><dd>{module.identity.shortName}</dd>
            <dt>Constructo</dt><dd>{module.identity.description}</dd>
            <dt>Población</dt><dd>{module.identity.targetPopulation}</dd>
            <dt>Indicadores</dt><dd>CAGE_R (riesgo binario) · CAGE (nivel ordinal 1–4)</dd>
            <dt>Fuente</dt><dd>EAS: campos derivados CAGE_R y CAGE</dd>
          </dl>
          <p className="study-report__algo-note">
            COMPÁS no tiene acceso a los 4 ítems originales del CAGE (Ewing, 1984):
            consume los campos derivados CAGE_R (positivo/negativo) y CAGE (nivel 1–4)
            que produce la EAS. La codificación EAS puede diferir de otras clasificaciones
            CAGE publicadas.
          </p>
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
          {cageStudy.methodologicalCautions.length > 0 && (
            <>
              <p className="study-report__subsection-title">De la muestra importada</p>
              <ul className="study-report__cautions-list">
                {cageStudy.methodologicalCautions.map((c, i) => <li key={i}>{c}</li>)}
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
            <dd className="study-report__evidence-file">{cageStudy.sourceFileName}</dd>
            <dt>Fecha de importación</dt><dd>{formatDate(cageStudy.createdAt)}</dd>
            <dt>Tipo de fuente</dt><dd>Microdatos EAS — Encuesta Andaluza de Salud</dd>
            <dt>Registros procesados</dt><dd>{agg.n}</dd>
            <dt>Evaluados (CAGE_R)</dt><dd>{agg.nValidCAGER}</dd>
            <dt>No evaluados (abstemia/NC)</dt><dd>{agg.missingCAGER}</dd>
            <dt>Con señal de riesgo</dt><dd>{agg.nRisk}</dd>
          </dl>
        </div>
      </details>

      <details className="study-report__collapsible">
        <summary>Fundamento científico</summary>
        <div className="study-report__collapsible-body">
          {module.bibliography.map((ref, i) => (
            <div key={i} className="study-report__bib-item">
              <span className="study-report__bib-role">Instrumento original</span>
              {ref.authors} ({ref.year}). <em>{ref.title}</em>.{" "}
              {ref.source && <>{ref.source}.</>}
              {ref.doi && <> DOI: {ref.doi}.</>}
              {ref.notes && <> {ref.notes}</>}
            </div>
          ))}
        </div>
      </details>

      <p className="study-institutional-note">
        La decisión territorial corresponde siempre al equipo técnico.
      </p>
    </div>
  );
}
