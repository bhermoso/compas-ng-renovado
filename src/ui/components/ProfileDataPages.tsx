import { ProfileText } from "./ProfileText";
import { useMemo, useRef, useState } from "react";
import type { ProfileDataPages as DataPages, ProfileStructure } from "../../application/health-profile/profileStructure";
import type { ProfileResult } from "../../domain/health-profile/ExternalHealthProfile";
import {
  comparatorsOf,
  formatComparisonValue,
  geographicComparators,
  groupResultsByTopic,
  headlineResults,
  sectionMetrics,
  splitDataPageResults,
} from "../../application/health-profile/profileDashboard";
import "./ProfileDataPages.css";

/**
 * Páginas de datos comparables del Perfil (contrato, Art. 17 ter), con una
 * presentación inspirada en los Local Authority Health Profiles: portada,
 * quién vive aquí, panel de salud y desigualdad. Todo procede del Perfil
 * guardado (texto y paquete de resultados): no hay cifras en el código.
 * Las comparaciones no llevan colores de juicio (Art. 17 quater, 3): cada
 * ámbito se distingue por su forma, no por «mejor» o «peor».
 */

const unitOf = (unit: string) => (unit.startsWith("%") ? " %" : unit ? ` ${unit}` : "");
const SHAPES = ["diamond", "square", "triangle", "ring"] as const;

function Marker({ shape, x, y }: { shape: (typeof SHAPES)[number] | "local"; x: number; y: number }) {
  if (shape === "local") return <circle className="pdp-mk pdp-mk--local" cx={x} cy={y} r={5.5} />;
  if (shape === "diamond") return <rect className="pdp-mk pdp-mk--0" x={x - 4} y={y - 4} width={8} height={8} transform={`rotate(45 ${x} ${y})`} />;
  if (shape === "square") return <rect className="pdp-mk pdp-mk--1" x={x - 4} y={y - 4} width={8} height={8} />;
  if (shape === "triangle") return <path className="pdp-mk pdp-mk--2" d={`M${x} ${y - 5}L${x + 5} ${y + 4}H${x - 5}Z`} />;
  return <circle className="pdp-mk pdp-mk--3" cx={x} cy={y} r={4} />;
}

/** Valor local frente a los ámbitos de comparación, sobre una escala propia de la fila. */
function DotStrip({ result, geo }: { result: ProfileResult; geo: string[] }) {
  const local = result.chartValue;
  if (local === undefined) return null;
  const refs = comparatorsOf(result).filter((c) => geo.includes(c.label));
  const values = [local, ...refs.map((c) => c.value)];
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || Math.abs(hi) || 1;
  const min = lo - span * 0.25, max = hi + span * 0.25;
  const x = (v: number) => 8 + ((v - min) / (max - min)) * 144;
  return (
    <svg className="pdp-strip" viewBox="0 0 160 18" role="img" aria-label={`${result.title}: ${result.value}${unitOf(result.unit)}${refs.map((c) => `; ${c.label}: ${formatComparisonValue(c.value)}`).join("")}`}>
      <line x1={8} x2={152} y1={9} y2={9} className="pdp-strip__axis" />
      {refs.map((c) => <Marker key={c.label} shape={SHAPES[geo.indexOf(c.label) % SHAPES.length]} x={x(c.value)} y={9} />)}
      <Marker shape="local" x={x(local)} y={9} />
    </svg>
  );
}

function Legend({ municipalityName, geo }: { municipalityName: string; geo: string[] }) {
  return (
    <p className="pdp-legend">
      <span><svg viewBox="0 0 14 14"><Marker shape="local" x={7} y={7} /></svg>{municipalityName}</span>
      {geo.map((g, i) => <span key={g}><svg viewBox="0 0 14 14"><Marker shape={SHAPES[i % SHAPES.length]} x={7} y={7} /></svg>{g}</span>)}
    </p>
  );
}

/** Procedencia de una fila: fuente, página y base, tal como las declara el perfil. */
const provenanceOf = (r: ProfileResult) =>
  `${[r.source, r.page].filter(Boolean).join(", ")}${r.denominator ? ` · Base: ${r.denominator}` : ""}`;

/**
 * Tabla tipo «spine» sin colores de juicio: valor local, comparadores, gráfico
 * de puntos y cambio. Cada indicador ocupa una sola línea; la procedencia
 * (fuente, página y base) se numera una vez bajo la tabla y la fila la cita.
 */
function IndicatorTable({ results, municipalityName, geo, caption, grouped, id }: { results: ProfileResult[]; municipalityName: string; geo: string[]; caption: string; grouped: boolean; id: string }) {
  const topics = grouped ? groupResultsByTopic(results) : [{ topic: "", results, scaleByUnit: {} }];
  const beforeOf = (r: ProfileResult) => comparatorsOf(r).filter((c) => !geo.includes(c.label));
  const hasBefore = results.some((r) => beforeOf(r).length > 0);
  // Prueba 17/11: la lista agrupa por fuente; página y base quedan en el título de la referencia.
  const sourceOf = (r: ProfileResult) => r.source || provenanceOf(r);
  const sources: string[] = [];
  for (const r of results) { const s = sourceOf(r); if (s && !sources.includes(s)) sources.push(s); }
  const cols = (
    <colgroup>
      <col className="pdp-c-title" /><col className="pdp-c-period" /><col className="pdp-c-local" />
      {geo.map((g) => <col key={g} className="pdp-c-geo" />)}
      <col className="pdp-c-chart" />
      {hasBefore && <col className="pdp-c-before" />}
      {sources.length > 0 && <col className="pdp-c-ref" />}
    </colgroup>
  );
  const head = (
    <thead>
      <tr>
        <th scope="col">Indicador</th><th scope="col">Periodo</th><th scope="col" className="pdp-num">{municipalityName}</th>
        {geo.map((g) => <th key={g} scope="col" className="pdp-num">{g}</th>)}
        <th scope="col" className="pdp-chart-col">Comparación</th>
        {hasBefore && <th scope="col">Antes</th>}
        {sources.length > 0 && <th scope="col" className="pdp-srcref"><abbr title="Fuente">F.</abbr></th>}
      </tr>
    </thead>
  );
  const row = (r: ProfileResult, sharedUnit = false) => {
    const unit = sharedUnit ? "" : unitOf(r.unit);
    const comps = comparatorsOf(r);
    const before = beforeOf(r);
    const n = sources.indexOf(sourceOf(r)) + 1;
    return (
      <tr key={r.id}>
        <th scope="row" title={r.title}>{r.title}</th>
        <td className="pdp-muted">{r.period || "—"}</td>
        <td className="pdp-num pdp-local">{r.value}{unit}</td>
        {geo.map((g) => { const c = comps.find((x) => x.label === g); return <td key={g} className="pdp-num">{c ? formatComparisonValue(c.value) : "—"}</td>; })}
        <td className="pdp-chart-col"><DotStrip result={r} geo={geo} /></td>
        {hasBefore && <td className="pdp-muted">{before.length ? before.map((c) => `${c.label}: ${formatComparisonValue(c.value)}`).join(" · ") : "—"}</td>}
        {sources.length > 0 && <td className="pdp-srcref">{n > 0 ? <a href={`#${id}-f${n}`} title={provenanceOf(r)}>{n}</a> : "—"}</td>}
      </tr>
    );
  };
  const sourceList = sources.length > 0 && (
    <ol className="pdp-sources" aria-label={`Fuentes · ${caption}`}>
      {sources.map((s, i) => <li key={s} id={`${id}-f${i + 1}`}>{s}</li>)}
    </ol>
  );
  // Agrupada: una tabla por dominio, con las mismas columnas, para poder repartirlas en columnas de página.
  if (grouped) return (
    <div className="pdp-table-wrap pdp-domains" role="group" aria-label={caption}>
      {topics.map((t, i) => {
        const units = new Set(t.results.map((r) => unitOf(r.unit).trim()));
        const shared = units.size === 1 && [...units][0] !== "" ? [...units][0] : "";
        return (
          <table key={t.topic} id={`pdp-domain-${i}`} className="pdp-table pdp-table--line pdp-dtable">
            <caption className="pdp-dtable__cap">{t.topic}{shared && <span className="pdp-dtable__unit"> · {shared}</span>}</caption>
            {cols}
            {head}
            <tbody>{t.results.map((r) => row(r, !!shared))}</tbody>
          </table>
        );
      })}
      {sourceList}
    </div>
  );
  return (
    <div className="pdp-table-wrap">
      <table className="pdp-table pdp-table--line">
        <caption className="ep-sr-only">{caption}</caption>
        {head}
        <tbody>{results.map((r) => row(r))}</tbody>
      </table>
      {sourceList}
    </div>
  );
}

/** Comparador por dominio: escala independiente por indicador; nunca mezcla unidades. */
function DomainComparison({ domains, geo, municipalityName }: {
  domains: ReturnType<typeof groupResultsByTopic>;
  geo: string[];
  municipalityName: string;
}) {
  const [chosen, setChosen] = useState(0);
  const domain = domains[Math.min(chosen, domains.length - 1)];
  if (!domain) return null;
  const renderDomain = (d: typeof domain) => { const domainRows = d.results.filter((r) =>
    r.chartValue !== undefined && Number.isFinite(r.chartValue) && r.chartValue >= 0 &&
    comparatorsOf(r).some((c) => geo.includes(c.label) && Number.isFinite(c.value) && c.value >= 0));
    return <div key={d.topic}><h4>{d.topic}</h4>{domainRows.length ? <div className="pdp-domain-chart__rows">{domainRows.map((r) => {
      const refs = comparatorsOf(r).filter((c) => geo.includes(c.label) && c.value >= 0 && Number.isFinite(c.value));
      const max = Math.max(r.chartValue!, ...refs.map((c) => c.value), 1) * 1.06;
      return <div className="pdp-domain-chart__item" key={r.id}><div className="pdp-domain-chart__title"><b>{r.title}</b><small>{r.period || "Periodo no declarado"} · {unitOf(r.unit).trim() || "sin unidad declarada"}</small></div>
        {[{label:municipalityName,value:r.chartValue!,local:true},...refs.map((c)=>({label:c.label,value:c.value,local:false}))].map((v) => <div className="pdp-domain-chart__measure" key={v.label}><span>{v.label}</span><i><b className={v.local?"is-local":undefined} style={{width:`${(v.value/max)*100}%`}} /></i><strong>{formatComparisonValue(v.value)}</strong></div>)}
        <details><summary>Procedencia y cautelas</summary><p>{[r.source,r.page,r.denominator ? `Base: ${r.denominator}`:undefined,r.caution].filter(Boolean).join(" · ") || "No consta detalle adicional de procedencia."}</p></details></div>;
    })}</div> : <p className="pdp-note">Sin pares numéricos comparables; consultar la tabla completa.</p>}</div>;
  };
  return <details className="pdp-domain-chart pdp-noprint" aria-label="Comparador gráfico por dominio"><summary>Comparar por dominio · un gráfico por indicador</summary>
    <div className="pdp-domain-chart__header">
      <div><p className="pdp-domain-chart__eyebrow">LECTURA COMPARADA</p>
        <h3>Indicadores por dominio</h3>
        <p>Una escala propia por indicador. Los gráficos no expresan significación estadística.</p>
      </div>
      <label className="pdp-noprint">Dominio
        <select value={chosen} onChange={(e) => setChosen(Number(e.target.value))}>
          {domains.map((d, i) => <option key={d.topic} value={i}>{d.topic}</option>)}
        </select>
      </label>
    </div>
    <div className="pdp-domain-screen">{renderDomain(domain)}</div>
  </details>;
}

function SectionExplorer({ results, municipalityName }: { results: ProfileResult[]; municipalityName: string }) {
  const metrics = useMemo(() => sectionMetrics(results), [results]);
  const [metric, setMetric] = useState(0);
  const [selected, setSelected] = useState<string>();
  if (!metrics.length) return null;
  const m = metrics[Math.min(metric, metrics.length - 1)];
  const max = Math.max(...m.rows.map((r) => r.value), ...m.references.map((x) => x.value)) * 1.08 || 1;
  const lowest = [...m.rows].sort((a, b) => a.value - b.value)[0];
  const current = m.rows.find((r) => r.section === selected) ?? lowest;
  const unit = unitOf(m.unit);
  return (
    <div className="pdp-sections">
      <div className="pdp-sections__head">
        <div className="pdp-tabs pdp-noprint" role="group" aria-label="Indicador por sección censal">
          {metrics.map((x, i) => <button key={x.title} type="button" aria-pressed={i === metric} onClick={() => setMetric(i)}>{x.title}</button>)}
        </div>
        <p className="pdp-print-only pdp-muted">{m.title}</p>
      </div>
      <div className="pdp-sections__body">
        <ol className="pdp-bars" aria-label={`${m.title} por sección censal`}>
          {m.rows.map((r) => (
            <li key={r.section} className={r.section === current.section ? "is-selected" : undefined}>
              <button type="button" onClick={() => setSelected(r.section)} aria-pressed={r.section === current.section}>
                <span className="pdp-bars__label">{r.section}</span>
                <span className="pdp-bars__track">
                  <i style={{ width: `${(r.value / max) * 100}%` }} />
                  {m.references.map((ref, i) => <b key={ref.label} className={`pdp-ref pdp-ref--${i}`} style={{ left: `${(ref.value / max) * 100}%` }} title={`${ref.label}: ${formatComparisonValue(ref.value)}${unit}`} />)}
                </span>
                <span className="pdp-bars__value">{r.display}{unit}</span>
              </button>
            </li>
          ))}
        </ol>
        <aside className="pdp-section-card" aria-live="polite">
          <p className="ep-eyebrow">Sección censal</p>
          <h4>{current.section}</h4>
          <dl>
            {metrics.map((x) => { const row = x.rows.find((r) => r.section === current.section); return row ? <div key={x.title}><dt>{x.title}</dt><dd>{row.display}{unitOf(x.unit)}</dd></div> : null; })}
          </dl>
          {m.references.length > 0 && <p className="pdp-muted">Referencias: {m.references.map((ref) => `${ref.label} ${formatComparisonValue(ref.value)}${unit}`).join(" · ")}</p>}
        </aside>
      </div>
      <p className="pdp-note">Las líneas verticales marcan {m.references.map((r) => r.label).join(", ") || "las referencias"}. Datos de renta y población por sección; ningún indicador de salud se publica a esta escala en {municipalityName}.</p>
    </div>
  );
}

/** Copia las páginas a un marco propio con los mismos estilos y lo imprime: el PDF es lo que se ve. */
function printPages(node: HTMLElement | null, title: string) {
  if (!node) return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).map((n) => n.outerHTML).join("");
  doc.open();
  doc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title>${styles}</head><body class="pdp-print-body"><section class="external-profile">${node.outerHTML}</section></body></html>`);
  doc.close();
  const go = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); };
  if (doc.readyState === "complete") window.setTimeout(go, 300); else frame.addEventListener("load", () => window.setTimeout(go, 300));
}

export function ProfileDataPages({ pages, results, municipalityName, title, period, metrics, pdfUrl, pdfName, interpretation }: {
  pages: DataPages;
  results: ProfileResult[];
  municipalityName: string;
  title: string;
  period: string;
  metrics: string[];
  pdfUrl?: string;
  pdfName?: string;
  interpretation?: Pick<ProfileStructure, "overallReading" | "conclusions">;
}) {
  const root = useRef<HTMLDivElement>(null);
  const split = splitDataPageResults(results);
  const geo = geographicComparators(results, municipalityName);
  const headlines = headlineResults(results);
  const inequalityOther = split.inequality.filter((r) => !/^secci[oó]n/i.test(r.scale ?? ""));
  const sectionResults = split.inequality.filter((r) => /^secci[oó]n/i.test(r.scale ?? ""));
  const healthDomains = groupResultsByTopic(split.healthPanel);
  const comparedCount = split.healthPanel.filter((r) => comparatorsOf(r).some((c) => geo.includes(c.label))).length;
  const pageHead = (n: number, heading: string) => (
    <header className="pdp-page__head"><span>{municipalityName} en datos · {n} de 4</span><h2>{heading}</h2></header>
  );

  return (
    <div className="pdp-wrap">
      <div className="pdp-toolbar pdp-noprint">
        <nav aria-label="Páginas de datos">
          {["Portada", "Quién vive aquí", "Panel de salud", "Desigualdad"].map((label, i) => <a key={label} href={`#pdp-${i + 1}`}><span>{i + 1}</span>{label}</a>)}
        </nav>
        <div className="pdp-downloads">
          <button type="button" onClick={() => printPages(root.current, `${title} · páginas de datos`)}>↓ Guardar páginas en PDF</button>
          {pdfUrl && <a className="pdp-primary" href={pdfUrl} download={pdfName}>↓ PDF original completo</a>}
        </div>
      </div>

      <div className="pdp" ref={root}>
        <section id="pdp-1" className="pdp-page pdp-cover" aria-label={`${municipalityName} en datos: portada`}>
          <div className="pdp-band" aria-hidden="true" />
          <p className="pdp-kicker">Perfil de Salud Local</p>
          <h2 className="pdp-cover__title">{municipalityName}</h2>
          <p className="pdp-cover__meta">{[title, period].filter(Boolean).join(" · ")}</p>
          {headlines.length > 0 && (
            <div className="pdp-kpis">
              {headlines.map((r) => {
                const ref = comparatorsOf(r)[0];
                return (
                  <div key={r.id} className="pdp-kpi">
                    <strong>{r.value}<small>{unitOf(r.unit)}</small></strong>
                    <span>{r.title}</span>
                    <em>{r.period}{ref ? ` · ${ref.label}: ${formatComparisonValue(ref.value)}${unitOf(r.unit)}` : ""}</em>
                  </div>
                );
              })}
            </div>
          )}
          {pages.cover.length > 0 && (
            <div className="pdp-blocks">
              {pages.cover.map((b) => <div key={b.title} className="pdp-block"><h3>{b.title}</h3><ProfileText paragraphs={[b.text]} /></div>)}
            </div>
          )}
          {metrics.length > 0 && <p className="pdp-metrics">{metrics.join(" · ")}</p>}
        </section>

        <section id="pdp-2" className="pdp-page" aria-label="Quién vive aquí">
          {pageHead(2, "Quién vive aquí")}
          <ProfileText paragraphs={pages.whoLivesHere} className="pdp-text" />
          {split.whoLivesHere.length > 0 && (
            <>
              <Legend municipalityName={municipalityName} geo={geo} />
              <IndicatorTable results={split.whoLivesHere} municipalityName={municipalityName} geo={geo} caption="Población, hogares y origen" grouped={false} id="pdp-t2" />
            </>
          )}
        </section>

        <section id="pdp-3" className="pdp-page" aria-label="Panel de salud">
          {pageHead(3, "Panel de salud")}
          <ProfileText paragraphs={pages.healthPanel} className="pdp-text" />
          {split.healthPanel.length > 0 ? (
            <>
              <div className="pdp-health-summary pdp-noprint" aria-label="Cobertura del sistema de indicadores">
                <div><strong>{split.healthPanel.length}</strong><span>indicadores documentados</span></div>
                <div><strong>{healthDomains.length}</strong><span>dominios de salud</span></div>
                <div><strong>{comparedCount}</strong><span>con referencia territorial</span></div>
              </div>
              <nav className="pdp-domain-nav pdp-noprint" aria-label="Ir a un dominio del panel">
                {healthDomains.map((domain,i)=><a href={`#pdp-domain-${i}`} key={domain.topic}>
                  <span>{domain.topic}</span><small>{domain.results.length} indicadores</small>
                </a>)}
              </nav>
              <p className="pdp-note">Los dominios organizan los indicadores incluidos en el perfil guardado. La ausencia de una referencia se muestra como «—»; no se estiman datos faltantes.</p>
              <DomainComparison domains={healthDomains} geo={geo} municipalityName={municipalityName} />
              <Legend municipalityName={municipalityName} geo={geo} />
              <IndicatorTable results={split.healthPanel} municipalityName={municipalityName} geo={geo} caption="Indicadores del panel de salud" grouped id="pdp-t3" />
            </>
          ) : <p className="pdp-text">El perfil no trae indicadores para el panel.</p>}
          {interpretation && (interpretation.overallReading.length > 0 || interpretation.conclusions.length > 0) && (
            <section className="pdp-interpretation" aria-label="Lectura documentada del perfil">
              <div className="pdp-interpretation__heading">
                <p className="ep-eyebrow">INTERPRETACIÓN DEL DOCUMENTO</p>
                <h3>De los indicadores a las conclusiones</h3>
                <p>Texto procedente del perfil guardado, no generado a partir de los gráficos. Las conclusiones se muestran como lectura global; no se atribuyen automáticamente a un dominio concreto.</p>
              </div>
              {interpretation.overallReading.length > 0 && <details open className="pdp-interpretation__reading">
                <summary>Lectura de conjunto</summary>
                {interpretation.overallReading.map((paragraph,i)=><p key={i}>{paragraph}</p>)}
              </details>}
              {interpretation.conclusions.length > 0 && <details className="pdp-interpretation__conclusions">
                <summary>{interpretation.conclusions.length} conclusiones documentadas · Ver títulos y fundamento</summary>
                <ol>{interpretation.conclusions.map(c=><li key={c.id}><strong>{c.id}. {c.title}</strong>
                  {c.body.map((paragraph,i)=><p key={i}>{paragraph}</p>)}
                  {c.leadsTo && <small>Deriva en: {c.leadsTo}</small>}
                </li>)}</ol>
              </details>}
            </section>
          )}
          <p className="pdp-note">Valores tal como los publica cada fuente. Los ámbitos se distinguen por la forma del marcador; el panel no marca mejor o peor, porque solo podría hacerlo cuando la fuente publica intervalos o significación. Cada fila tiene su propia escala.</p>
        </section>

        <section id="pdp-4" className="pdp-page" aria-label="Desigualdad">
          {pageHead(4, "Desigualdad")}
          <ProfileText paragraphs={pages.inequality.intro} className="pdp-text" />
          <SectionExplorer results={sectionResults} municipalityName={municipalityName} />
          {inequalityOther.length > 0 && <IndicatorTable results={inequalityOther} municipalityName={municipalityName} geo={geo} caption="Otros indicadores de desigualdad" grouped={false} id="pdp-t4" />}
          {pages.inequality.blocks.length > 0 && (
            <div className="pdp-blocks pdp-blocks--plain">
              {pages.inequality.blocks.map((b) => <div key={b.title} className="pdp-block"><h3>{b.title}</h3><ProfileText paragraphs={[b.text]} /></div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
