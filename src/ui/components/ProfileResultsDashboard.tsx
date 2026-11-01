import { useState } from "react";
import type { ExternalHealthProfile, ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";
import {
  formatComparisonValue,
  groupRecommendations,
  groupResultsByTopic,
  headlineResults,
  type DashboardTopic,
} from "../../application/health-profile/profileDashboard";

const sourceLine = (r: ProfileResult) => [r.source, r.page].filter(Boolean).join(", ");
/** Unidad para mostrar junto a la cifra: «% de papeletas» se abrevia a «%» (la base figura aparte). */
const displayUnit = (unit: string) => (unit.startsWith("%") ? " %" : unit ? ` ${unit}` : "");

function Headline({ result }: { result: ProfileResult }) {
  return (
    <div className="epd-kpi">
      <span className="epd-kpi__value">{result.value}<small>{displayUnit(result.unit)}</small></span>
      <span className="epd-kpi__label">{result.title}</span>
      <span className="epd-kpi__meta">{result.period}{result.comparison ? ` · ${result.comparison.label}: ${formatComparisonValue(result.comparison.value)}${displayUnit(result.unit)}` : ""}</span>
    </div>
  );
}

function ResultRow({ result, scale }: { result: ProfileResult; scale?: number }) {
  const width = (v: number) => `${scale && scale > 0 ? Math.max(0.5, (v / scale) * 100) : 0}%`;
  const hasBar = result.chartValue !== undefined && result.chartValue >= 0 && !!scale;
  const unit = displayUnit(result.unit);
  return (
    <li className="epd-row">
      <div className="epd-row__head">
        <span className="epd-row__title">{result.title}</span>
        <span className="epd-row__value">{result.value}{unit}</span>
      </div>
      {hasBar && (
        <div className="epd-row__bars" title={`${result.title}: ${result.value}${unit}${result.comparison ? ` · ${result.comparison.label}: ${formatComparisonValue(result.comparison.value)}${unit}` : ""}`}>
          <div className="epd-bar"><span>{result.scale || "Municipio"}</span><div className="epd-bar__track"><i style={{ width: width(result.chartValue!) }} /></div></div>
          {result.comparison && result.comparison.value >= 0 && (
            <div className="epd-bar epd-bar--ref"><span>{result.comparison.label} · {formatComparisonValue(result.comparison.value)}{unit}</span><div className="epd-bar__track"><i style={{ width: width(result.comparison.value) }} /></div></div>
          )}
        </div>
      )}
      <p className="epd-row__meta">
        <span>{result.period}</span>
        {sourceLine(result) && <span>{sourceLine(result)}</span>}
        {result.denominator && <span>Base: {result.denominator}</span>}
      </p>
      {result.caution && <p className="epd-row__note">{result.caution}</p>}
    </li>
  );
}

function TopicPanel({ topic }: { topic: DashboardTopic }) {
  return (
    <section className="epd-topic" aria-label={topic.topic}>
      <h3>{topic.topic}</h3>
      <ul className="epd-rows">
        {topic.results.map((r) => <ResultRow key={r.id} result={r} scale={topic.scaleByUnit[r.unit]} />)}
      </ul>
    </section>
  );
}

const RECO_HINT: Record<string, string> = {
  Conocer: "Recuperar los datos que faltan",
  Contrastar: "Preguntar a quien lo vive",
  Abordar: "Empezar a actuar donde hay fundamento",
  Otras: "Propuestas del perfil",
};

/** Vista «Resultados» del perfil externo: lectura, conclusiones, datos y recomendaciones. */
export function ProfileResultsDashboard({ profile, municipalityName, onAddResults }: { profile: ExternalHealthProfile; municipalityName: string; onAddResults?: () => void }) {
  const topics = groupResultsByTopic(profile.results);
  const [topicFilter, setTopicFilter] = useState("Todos");
  const visibleTopics = topicFilter === "Todos" ? topics : topics.filter((t) => t.topic === topicFilter);
  const headlines = headlineResults(profile.results);
  const findings = profile.findings.filter(Boolean);
  const recommendations = groupRecommendations(profile.areas);
  const summary = profile.summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="epd">
      {headlines.length > 0 && (
        <section className="epd-hero" aria-label={`${municipalityName} en cifras`}>
          <p className="ep-eyebrow">{municipalityName} en cifras</p>
          <div className="epd-kpis">{headlines.map((r) => <Headline key={r.id} result={r} />)}</div>
        </section>
      )}

      <section className="epd-reading">
        <p className="ep-eyebrow">Lectura de conjunto</p>
        <h2>Qué nos dice el perfil</h2>
        {summary.length ? summary.map((p, i) => <p key={i}>{p}</p>) : <p>El documento está disponible. Su síntesis todavía no se ha incorporado.</p>}
      </section>

      {findings.length > 0 && (
        <section className="epd-findings">
          <p className="ep-eyebrow">Conclusiones</p>
          <h2>Lo que concluye el perfil</h2>
          <ol>
            {findings.map((f, i) => {
              const match = /^(C\d+)\.\s*(.*)$/.exec(f);
              return <li key={i}><span className="epd-findings__id">{match?.[1] ?? `C${i + 1}`}</span><span>{match?.[2] ?? f}</span></li>;
            })}
          </ol>
        </section>
      )}

      <section className="epd-data">
        <div className="epd-data__head">
          <div><p className="ep-eyebrow">Datos con contexto</p><h2>Resultados del perfil</h2></div>
          {topics.length > 1 && (
            <div className="epd-filters" role="group" aria-label="Filtrar resultados por tema">
              {["Todos", ...topics.map((t) => t.topic)].map((t) => (
                <button key={t} type="button" aria-pressed={topicFilter === t} onClick={() => setTopicFilter(t)}>{t}</button>
              ))}
            </div>
          )}
        </div>
        {topics.length ? (
          <div className="epd-topics">{visibleTopics.map((t) => <TopicPanel key={t.topic} topic={t} />)}</div>
        ) : (
          <div className="ep-pending"><h3>La presentación de resultados está pendiente</h3><p>El perfil se ha conservado completo. Incorpora el paquete de resultados preparado fuera de COMPÁS o añade sus indicadores al editar una revisión. No se han inventado gráficos a partir del texto.</p>{onAddResults && <button type="button" onClick={onAddResults}>Incorporar resultados</button>}</div>
        )}
      </section>

      {recommendations.length > 0 && (
        <section className="epd-recos">
          <p className="ep-eyebrow">Recomendaciones del perfil</p>
          <h2>Qué propone hacer a continuación</h2>
          <p className="epd-recos__note">Propuestas para que el equipo técnico elija, corrija o descarte. La priorización corresponde al Grupo Motor y las actuaciones, al Plan de Acción.</p>
          <div className="epd-recos__groups">
            {recommendations.map((g) => (
              <div key={g.type} className={`epd-recos__group epd-recos__group--${g.type.toLowerCase()}`}>
                <h3>{g.type}<span>{RECO_HINT[g.type]}</span></h3>
                <ul>
                  {g.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.id}</strong>
                      <span>{item.text.replace(new RegExp(`^${item.id}\\.\\s*`), "")}</span>
                      {item.derivesFrom && <small>Deriva de {item.derivesFrom}</small>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.limitations.filter(Boolean).length > 0 && (
        <section className="epd-howto">
          <h3>Cómo leer estos resultados</h3>
          <ul>{profile.limitations.filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
