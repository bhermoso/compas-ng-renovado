import { useState } from "react";
import type { ProfileStructure } from "../../application/health-profile/profileStructure";
import type { ExternalHealthProfile, ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";
import {
  formatComparisonValue,
  groupRecommendations,
  groupResultsByTopic,
  headlineResults,
  splitDataPageResults,
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

/** Tabla de indicadores de una página de datos: valor local, referencia, periodo y fuente, sin colores de juicio. */
function DataTable({ results, municipalityName, caption }: { results: ProfileResult[]; municipalityName: string; caption: string }) {
  const topics = groupResultsByTopic(results);
  const grouped = topics.length > 1;
  return (
    <div className="epd-table-wrap">
      <table className="epd-table">
        <caption className="ep-sr-only">{caption}</caption>
        <thead><tr><th scope="col">Indicador</th><th scope="col">{municipalityName}</th><th scope="col">Referencia</th><th scope="col">Periodo</th><th scope="col">Fuente</th></tr></thead>
        {topics.map((t) => (
          <tbody key={t.topic}>
            {grouped && <tr className="epd-table__group"><th scope="rowgroup" colSpan={5}>{t.topic}</th></tr>}
            {t.results.map((r) => {
              const unit = displayUnit(r.unit);
              return (
                <tr key={r.id}>
                  <th scope="row">{r.title}{r.scale && r.scale !== municipalityName ? <small>{r.scale}</small> : null}</th>
                  <td className="epd-table__value">{r.value}{unit}</td>
                  <td>{r.comparison ? `${r.comparison.label}: ${formatComparisonValue(r.comparison.value)}${unit}` : "—"}</td>
                  <td>{r.period || "—"}</td>
                  <td className="epd-table__source">{[sourceLine(r), r.denominator ? `Base: ${r.denominator}` : ""].filter(Boolean).join(" · ")}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

const DATA_PAGES = [
  { id: "epd-p1", label: "Portada" },
  { id: "epd-p2", label: "Quién vive aquí" },
  { id: "epd-p3", label: "Panel de salud" },
  { id: "epd-p4", label: "Desigualdad" },
] as const;

const RECO_HINT: Record<string, string> = {
  Conocer: "Recuperar los datos que faltan",
  Contrastar: "Preguntar a quien lo vive",
  Abordar: "Empezar a actuar donde hay fundamento",
  Otras: "Propuestas del perfil",
};

/** Vista «Resultados» del perfil externo: lectura, conclusiones, datos y recomendaciones. */
export function ProfileResultsDashboard({ profile, municipalityName, onAddResults, structure, onOpenReader }: {
  profile: ExternalHealthProfile;
  municipalityName: string;
  onAddResults?: () => void;
  /** Estructura reconocida en el texto del perfil: suple lo que el paquete no trae. */
  structure?: ProfileStructure;
  /** Abre el lector en un ancla (conclusión, recomendación o apartado). */
  onOpenReader?: (anchor?: string) => void;
}) {
  const topics = groupResultsByTopic(profile.results);
  const [topicFilter, setTopicFilter] = useState("Todos");
  const visibleTopics = topicFilter === "Todos" ? topics : topics.filter((t) => t.topic === topicFilter);
  const headlines = headlineResults(profile.results);
  const findings = profile.findings.filter(Boolean).length
    ? profile.findings.filter(Boolean)
    : (structure?.conclusions ?? []).map((c) => `${c.id}. ${c.title}`);
  const areas = profile.areas.length
    ? profile.areas
    : (structure?.recommendations ?? []).map((r) => ({
        id: r.id,
        title: `${r.id}. ${r.text}`,
        rationale: [r.type, r.derivesFrom ? `Deriva de ${r.derivesFrom}` : ""].filter(Boolean).join(" · "),
      }));
  const recommendations = groupRecommendations(areas);
  const ownSummary = profile.summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const summary = ownSummary.length ? ownSummary : structure?.summary ?? [];
  const figures = headlines.length === 0 ? structure?.keyFigures ?? [] : [];
  const recoCounts = recommendations.filter((g) => g.type !== "Otras").map((g) => `${g.items.length} ${g.type}`);
  const metrics = [
    findings.length ? `${findings.length} conclusiones` : "",
    areas.length ? `${areas.length} recomendaciones${recoCounts.length ? ` (${recoCounts.join(" · ")})` : ""}` : "",
    structure?.references.length ? `${structure.references.length} referencias` : "",
    structure?.pages ? `${structure.pages} páginas` : "",
  ].filter(Boolean);

  const pages = structure?.dataPages;
  const split = splitDataPageResults(profile.results);
  const pageHead = (n: number, title: string) => (
    <div className="epd-page__head"><p className="ep-eyebrow">{municipalityName} en datos · {n} de 4</p><h2>{title}</h2></div>
  );

  return (
    <div className="epd">
      {pages ? (
        <>
          <nav className="epd-pages-nav" aria-label="Páginas de datos">
            {DATA_PAGES.map((p, i) => <a key={p.id} href={`#${p.id}`}><span>{i + 1}</span>{p.label}</a>)}
          </nav>
          <section id="epd-p1" className="epd-hero epd-page" aria-label={`${municipalityName} en datos: portada`}>
            {pageHead(1, municipalityName)}
            {headlines.length > 0 && <div className="epd-kpis">{headlines.map((r) => <Headline key={r.id} result={r} />)}</div>}
            {pages.cover.length > 0 && (
              <div className="epd-blocks">
                {pages.cover.map((b) => <div key={b.title} className="epd-block"><h3>{b.title}</h3><p>{b.text}</p></div>)}
              </div>
            )}
            {metrics.length > 0 && <p className="epd-metrics">{metrics.join(" · ")}</p>}
          </section>
          <section id="epd-p2" className="epd-page" aria-label="Quién vive aquí">
            {pageHead(2, "Quién vive aquí")}
            {pages.whoLivesHere.map((p, i) => <p key={i} className="epd-page__text">{p}</p>)}
            {split.whoLivesHere.length > 0 && <DataTable results={split.whoLivesHere} municipalityName={municipalityName} caption="Indicadores de población y hogares" />}
          </section>
          <section id="epd-p3" className="epd-page" aria-label="Panel de salud">
            {pageHead(3, "Panel de salud")}
            {pages.healthPanel.map((p, i) => <p key={i} className="epd-page__text">{p}</p>)}
            {split.healthPanel.length > 0
              ? <DataTable results={split.healthPanel} municipalityName={municipalityName} caption="Indicadores del panel de salud" />
              : <p className="epd-page__text">El perfil no trae indicadores para el panel. {onAddResults && <button type="button" onClick={onAddResults}>Incorporar resultados</button>}</p>}
            <p className="epd-page__note">Valores tal como los publica cada fuente. El panel no marca mejor o peor: solo podría hacerlo cuando la fuente publica intervalos o significación.</p>
          </section>
          <section id="epd-p4" className="epd-page" aria-label="Desigualdad">
            {pageHead(4, "Desigualdad")}
            {pages.inequality.intro.map((p, i) => <p key={i} className="epd-page__text">{p}</p>)}
            {split.inequality.length > 0 && <DataTable results={split.inequality} municipalityName={municipalityName} caption="Indicadores de desigualdad" />}
            {pages.inequality.blocks.length > 0 && (
              <div className="epd-blocks">
                {pages.inequality.blocks.map((b) => <div key={b.title} className="epd-block"><h3>{b.title}</h3><p>{b.text}</p></div>)}
              </div>
            )}
          </section>
          {structure && structure.overallReading.length > 0 && (
            <section className="epd-reading">
              <p className="ep-eyebrow">Lectura de conjunto</p>
              <h2>Qué concluye el perfil</h2>
              {structure.overallReading.map((p, i) => <p key={i}>{p}</p>)}
              {onOpenReader && <button type="button" className="epd-reading__more" onClick={() => onOpenReader()}>Leer el perfil completo</button>}
            </section>
          )}
        </>
      ) : (
      <>
      {(headlines.length > 0 || figures.length > 0) && (
        <section className="epd-hero" aria-label={`${municipalityName} en cifras`}>
          <p className="ep-eyebrow">{municipalityName} en cifras</p>
          <div className="epd-kpis">
            {headlines.map((r) => <Headline key={r.id} result={r} />)}
            {figures.map((f, i) => (
              <div key={i} className="epd-kpi">
                <span className="epd-kpi__value">{f.value}<small>{f.unit ? ` ${f.unit}` : ""}</small></span>
                <span className="epd-kpi__label">{(() => { const label = f.sentence.replace(/\s*\[[^\]]+\]/g, ""); return label.length > 140 ? `${label.slice(0, 137).trimEnd()}…` : label; })()}</span>
                {f.citation && <span className="epd-kpi__meta">{f.citation}</span>}
              </div>
            ))}
          </div>
          {figures.length > 0 && <p className="epd-hero__note">Cifras tal como aparecen en el resumen del perfil, con su cita.</p>}
          {metrics.length > 0 && <p className="epd-metrics">{metrics.join(" · ")}</p>}
        </section>
      )}

      <section className="epd-reading">
        <p className="ep-eyebrow">Lectura de conjunto</p>
        <h2>Qué nos dice el perfil</h2>
        {summary.length ? summary.map((p, i) => <p key={i}>{p}</p>) : <p>El documento está disponible. Su síntesis todavía no se ha incorporado.</p>}
        {onOpenReader && structure && structure.sections.length > 1 && <button type="button" className="epd-reading__more" onClick={() => onOpenReader()}>Leer el perfil completo</button>}
      </section>

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
        ) : figures.length > 0 ? (
          <div className="ep-pending"><h3>Este perfil no trae paquete de indicadores</h3><p>Las cifras destacadas proceden del resumen del documento. Para gráficos comparativos con fuente, ámbito y periodo, incorpora el paquete de resultados o añade los indicadores al editar una revisión. No se generan gráficos a partir del texto.</p>{onAddResults && <button type="button" onClick={onAddResults}>Incorporar resultados</button>}</div>
        ) : (
          <div className="ep-pending"><h3>La presentación de resultados está pendiente</h3><p>El perfil se ha conservado completo. Incorpora el paquete de resultados preparado fuera de COMPÁS o añade sus indicadores al editar una revisión. No se han inventado gráficos a partir del texto.</p>{onAddResults && <button type="button" onClick={onAddResults}>Incorporar resultados</button>}</div>
        )}
      </section>
      </>
      )}

      {findings.length > 0 && (
        <section className="epd-findings">
          <p className="ep-eyebrow">Conclusiones</p>
          <h2>Lo que concluye el perfil</h2>
          <ol>
            {findings.map((f, i) => {
              const match = /^(C\d+)\.\s*(.*)$/.exec(f);
              const id = match?.[1] ?? `C${i + 1}`;
              const content = <><span className="epd-findings__id">{id}</span><span>{match?.[2] ?? f}</span></>;
              return <li key={i}>{onOpenReader && structure?.conclusions.some((c) => c.id === id)
                ? <button type="button" className="epd-findings__open" onClick={() => onOpenReader(`epr-${id}`)} aria-label={`Leer ${id} en el documento`}>{content}</button>
                : content}</li>;
            })}
          </ol>
        </section>
      )}


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
