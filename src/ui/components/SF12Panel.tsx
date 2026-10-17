import type { SF12Study } from "../../domain/sf12";
import { SF12_EAS_MODULE } from "../../domain/methodology/definitions/sf12-eas";
import { getSampleQualityVerdict } from "./studyPanelUtils";

interface SF12PanelProps {
  sf12Study?: SF12Study;
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

// SF-12 no tiene umbrales clínicos validados.
// Se usa la distancia de ±3 puntos respecto a la norma española (≈50).
function getSF12NormLevel(
  mean: number,
  refMean: number
): { label: string; direction: "above" | "at" | "below" } {
  const diff = mean - refMean;
  if (diff > 3)  return { label: "por encima de la referencia española", direction: "above" };
  if (diff < -3) return { label: "por debajo de la referencia española", direction: "below" };
  return { label: "en el rango de la referencia española", direction: "at" };
}

const REF_MEAN = 50;

// ── Componente ────────────────────────────────────────────────────────────────

export function SF12Panel({ sf12Study, municipalityName }: SF12PanelProps) {
  if (sf12Study === undefined) return null;

  const module = SF12_EAS_MODULE;
  const note = module.institutionalNote;
  const mun = municipalityName ?? "el municipio";
  const { aggregates: agg } = sf12Study;

  const pcsLevel = getSF12NormLevel(agg.meanPCS, REF_MEAN);
  const mcsLevel = getSF12NormLevel(agg.meanMCS, REF_MEAN);
  const quality  = getSampleQualityVerdict(Math.min(agg.nValidPCS, agg.nValidMCS));

  const diffPCS = (agg.meanPCS - REF_MEAN).toFixed(1);
  const diffMCS = (agg.meanMCS - REF_MEAN).toFixed(1);

  const executiveSummary: string[] = [
    `La salud percibida de la población adulta de ${mun} presenta un PCS de ${agg.meanPCS.toFixed(1)}/100 (componente físico, ${pcsLevel.label}) y un MCS de ${agg.meanMCS.toFixed(1)}/100 (componente mental, ${mcsLevel.label}).`,
    `El PCS se aleja ${Number(diffPCS) >= 0 ? "+" : ""}${diffPCS} puntos respecto a la norma española (≈ 50); el MCS se aleja ${Number(diffMCS) >= 0 ? "+" : ""}${diffMCS} puntos.`,
    quality.note,
  ];

  const pslParagraph =
    `En ${mun}, la salud percibida de la población adulta (SF-12 EAS, n = ${agg.nValidPCS} válidos PCS · ${agg.nValidMCS} válidos MCS) ` +
    `muestra un Componente Físico (PCS) de ${agg.meanPCS.toFixed(1)}/100 ` +
    `(${pcsLevel.label}; diferencia respecto a norma española: ${Number(diffPCS) >= 0 ? "+" : ""}${diffPCS}) ` +
    `y un Componente Mental (MCS) de ${agg.meanMCS.toFixed(1)}/100 ` +
    `(${mcsLevel.label}; diferencia: ${Number(diffMCS) >= 0 ? "+" : ""}${diffMCS}). ` +
    `Ambas dimensiones son independientes. Este resultado contribuye al ` +
    `capítulo de Diagnóstico de Salud de la Población del Perfil de Salud Local.`;

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
          <span className="study-report__meta-date">Importado el {formatDate(sf12Study.createdAt)}</span>
          <span className="study-report__meta-n">
            {agg.nValidPCS} válidos PCS · {agg.nValidMCS} válidos MCS
          </span>
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
                <td className="study-bar-row__label">Componente Físico (PCS)</td>
                <td className="study-bar-row__track-cell">
                  <div className="study-bar-track">
                    <div className="study-bar-fill"
                      style={{ width: `${agg.meanPCS}%` }}
                      aria-label={`${agg.meanPCS.toFixed(1)} sobre 100`}
                    />
                    <span className="study-bar-mark" style={{ left: "50%" }} title="Norma española ≈ 50" />
                  </div>
                </td>
                <td className="study-bar-row__value">{agg.meanPCS.toFixed(1)}/100</td>
                <td className="study-bar-row__level study-bar-row__level--detail">
                  n={agg.nValidPCS}
                </td>
              </tr>
              <tr className="study-bar-row">
                <td className="study-bar-row__label">Componente Mental (MCS)</td>
                <td className="study-bar-row__track-cell">
                  <div className="study-bar-track">
                    <div className="study-bar-fill"
                      style={{ width: `${agg.meanMCS}%` }}
                      aria-label={`${agg.meanMCS.toFixed(1)} sobre 100`}
                    />
                    <span className="study-bar-mark" style={{ left: "50%" }} title="Norma española ≈ 50" />
                  </div>
                </td>
                <td className="study-bar-row__value">{agg.meanMCS.toFixed(1)}/100</td>
                <td className="study-bar-row__level study-bar-row__level--detail">
                  n={agg.nValidMCS}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="study-report__legend">
          <span className="study-report__legend-item study-report__legend-item--threshold">
            Norma española: PCS ≈ 50 · MCS ≈ 50 (Vilagut et al. 2008)
          </span>
        </div>
        {(agg.missingPCS > 0 || agg.missingMCS > 0) && (
          <p className="study-report__footnote">
            Sin puntuación PCS: {agg.missingPCS} · Sin puntuación MCS: {agg.missingMCS}.
          </p>
        )}
      </section>

      {/* COMPARACIÓN TERRITORIAL */}
      <section className="study-report__section">
        <p className="study-report__section-title">Comparación territorial</p>
        <dl className="study-report__evidence-dl">
          <dt>{mun} — PCS</dt>
          <dd>{agg.meanPCS.toFixed(1)}/100 ({pcsLevel.label})</dd>
          <dt>{mun} — MCS</dt>
          <dd>{agg.meanMCS.toFixed(1)}/100 ({mcsLevel.label})</dd>
          <dt>España (norma poblacional)</dt>
          <dd>PCS ≈ 50 · MCS ≈ 50 (Vilagut et al. 2008)</dd>
          <dt>Andalucía — EAS</dt>
          <dd>Sin referencia específica disponible para PCS/MCS en esta fuente</dd>
          <dt>Provincia de Granada — EAS</dt>
          <dd>Sin referencia específica disponible para PCS/MCS en esta fuente</dd>
        </dl>
        <p className="study-report__interpretation">
          La referencia canónica para el SF-12 es la norma española (≈ 50 en ambas escalas),
          calculada sobre una muestra representativa de la población general española (Vilagut et al. 2008).
          Una desviación de 3 o más puntos por debajo señala una diferencia clínicamente relevante respecto a esa norma.
          {pcsLevel.direction !== "at" && ` El PCS de ${mun} (${agg.meanPCS.toFixed(1)}) ${pcsLevel.direction === "below" ? "está por debajo" : "supera"} este umbral.`}
          {mcsLevel.direction !== "at" && ` El MCS (${agg.meanMCS.toFixed(1)}) ${mcsLevel.direction === "below" ? "está por debajo" : "supera"} el umbral de referencia.`}
          {" "}No se dispone de datos EAS desagregados por municipio o provincia para comparación subregional directa.
        </p>
      </section>

      {/* INTERPRETACIÓN */}
      {note && (
        <section className="study-report__section">
          <p className="study-report__section-title">Interpretación para el diagnóstico municipal</p>
          <p className="study-report__interpretation">{note.diagnosticInterpretation}</p>
        </section>
      )}

      {/* CALIDAD DE LA EVIDENCIA */}
      <section className="study-report__section">
        <p className="study-report__section-title">Calidad de la evidencia</p>
        <div className="study-report__quality-grid">
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Válidos PCS</span>
            <span className="study-report__quality-value">{agg.nValidPCS}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Válidos MCS</span>
            <span className="study-report__quality-value">{agg.nValidMCS}</span>
          </div>
          <div className="study-report__quality-cell">
            <span className="study-report__quality-label">Sin PCS</span>
            <span className="study-report__quality-value">{agg.missingPCS}</span>
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
      {note?.implications && note.implications.length > 0 && (
        <section className="study-report__section">
          <p className="study-report__section-title">Líneas de observación para el diagnóstico</p>
          <ul className="study-report__implications-list">
            {note.implications.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>
      )}

      {/* INTEGRACIÓN EN EL PSL */}
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
          El SF-12 aporta la perspectiva de la salud percibida adulta en sus dimensiones
          física y mental. El componente mental (MCS) puede ser coherente con los resultados
          del DUKE-EAS y del Sueño EAS: la literatura asocia el sueño insuficiente y el
          déficit de apoyo social con peor salud mental percibida. En {mun}, si el MCS
          está por debajo de la norma española y el DUKE-EAS muestra apoyo social bajo,
          ambos resultados apuntan en la misma dirección y refuerzan la dimensión relacional
          y emocional del diagnóstico. Una discrepancia entre MCS bajo y apoyo social adecuado
          orientaría hacia otros factores explicativos. El componente físico (PCS) puede
          ser coherente con la prevalencia de enfermedades crónicas si está disponible
          en el Informe de Salud del municipio.
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
            <dt>Ítems</dt><dd>{module.items.length > 0 ? module.items.length : 12} ítems (SF-12v2)</dd>
            <dt>Escalas</dt><dd>PCS y MCS · rango 0–100 · dirección: mayor = mejor</dd>
            <dt>Fuente</dt><dd>EAS: campos PCS12_SP y MCS12_SP (pre-calculados)</dd>
          </dl>
          <p className="study-report__subsection-title">Dimensiones</p>
          <p className="study-report__dimension-item">
            <strong>Componente Físico (PCS)</strong> — Limitaciones funcionales físicas,
            dolor corporal, vitalidad y salud general percibida.
          </p>
          <p className="study-report__dimension-item">
            <strong>Componente Mental (MCS)</strong> — Bienestar emocional, rol emocional,
            salud mental percibida y funcionamiento social.
          </p>
          <p className="study-report__algo-note">
            Nota: PCS12_SP y MCS12_SP son puntuaciones pre-calculadas por la EAS aplicando
            los coeficientes factoriales de la norma española (Vilagut et al. 2008).
            COMPÁS las consume directamente sin recalcular desde los 12 ítems.
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
          {sf12Study.methodologicalCautions.length > 0 && (
            <>
              <p className="study-report__subsection-title">De la muestra importada</p>
              <ul className="study-report__cautions-list">
                {sf12Study.methodologicalCautions.map((c, i) => <li key={i}>{c}</li>)}
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
            <dd className="study-report__evidence-file">{sf12Study.sourceFileName}</dd>
            <dt>Fecha de importación</dt><dd>{formatDate(sf12Study.createdAt)}</dd>
            <dt>Tipo de fuente</dt><dd>Microdatos EAS — Encuesta Andaluza de Salud</dd>
            <dt>Registros procesados</dt><dd>{agg.n}</dd>
            <dt>Válidos PCS12_SP</dt><dd>{agg.nValidPCS}</dd>
            <dt>Válidos MCS12_SP</dt><dd>{agg.nValidMCS}</dd>
          </dl>
        </div>
      </details>

      <details className="study-report__collapsible">
        <summary>Fundamento científico</summary>
        <div className="study-report__collapsible-body">
          {module.bibliography.map((ref, i) => (
            <div key={i} className="study-report__bib-item">
              <span className="study-report__bib-role">
                {i === 0 ? "Instrumento original" : "Norma española"}
              </span>
              {ref.authors} ({ref.year}). <em>{ref.title}</em>.{" "}
              {ref.source && <>{ref.source}.</>}
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
