import { useCallback, useEffect, useRef, useState } from "react";
import { slideSteps, type Figure, type Slide } from "../../application/process/processPresentation";
import { IBSE_FIELDS, type IBSEYouthAnalysis } from "../../application/ibse/analyzeIBSEYouth";
import type { SampleQualityAssessment } from "../../domain/sam";
import { buildSamTriPyramidRows, type SamTriPyramidRow } from "./samTriPyramidRows";
import { InstitutionalLogoBand } from "./InstitutionalLogoBand";
import "./ProcessPresentation.css";

const LOGOS = ["consejeria", "distrito-sanitario", "relas", "violencia-genero", "rasselh"];
// Separador de miles también en cifras de cuatro dígitos (1.242), como en el Perfil.
const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: "always" });
/** Medias del IBSE con un decimal, como las publica el estudio. */
const mean = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function longDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function Foot({ children }: { children: string }) {
  return <p className="pp-src">{children}</p>;
}

function FigureCard({ f }: { f: Figure }) {
  return (
    <div className="pp-figure">
      <span className="pp-figure__value">{f.value}</span>
      <span className="pp-figure__unit">{f.unit}</span>
      <span className="pp-figure__title">{f.title}</span>
      <span className="pp-figure__period">{f.period}</span>
    </div>
  );
}

const pct1 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Tripirámide SAM a escala de presentación: padrón, afijación ideal y muestra, capa a capa. */
function TriPyramidSlide({ assessment, focusBands, source, step }: { assessment: SampleQualityAssessment; focusBands: string[]; source: string; step: number }) {
  const built = buildSamTriPyramidRows(assessment);
  if ("notEvaluable" in built) return <section className="pp-slide"><h2>Quién respondió</h2><p className="pp-unit">{built.notEvaluable}</p></section>;
  const rows = [...built.rows].reverse();
  const max = Math.max(...built.rows.flatMap((r) => [r.pctPop.male, r.pctPop.female, r.pctIdeal.male, r.pctIdeal.female, r.pctAchieved.male, r.pctAchieved.female])) || 1;
  const w = (pct: number, visible: boolean) => ({ width: visible ? `${(pct / max) * 100}%` : "0%" });
  const focus = built.rows.filter((r) => focusBands.includes(r.ageBand));
  const sum = (f: (r: SamTriPyramidRow) => number) => focus.reduce((acc, r) => acc + f(r), 0);
  const focusSample = sum((r) => r.pctAchieved.male + r.pctAchieved.female);
  const focusPop = sum((r) => r.pctPop.male + r.pctPop.female);
  const titles = ["Quién vive en el municipio", "Cómo debería repartirse la muestra", "Quién respondió", "Los jóvenes, sobrerrepresentados"];
  return (
    <section className={`pp-slide pp-tri pp-tri--step${step}`}>
      <p className="pp-eyebrow">Monitor de bienestar socioemocional · composición de la muestra (SAM)</p>
      <h2>{titles[Math.min(step, focus.length ? 3 : 2)]}</h2>
      <div className="pp-tri__body">
        <div className="pp-tri__pyramid">
          <div className="pp-tri__head"><span>Hombres</span><span /><span>Mujeres</span></div>
          {rows.map((r) => (
            <div key={r.ageBand} className={`pp-tri__row${step >= 3 && focusBands.includes(r.ageBand) ? " is-focus" : ""}`}>
              <span className="pp-tri__side pp-tri__side--m">
                <span className="pp-tri__layer pp-tri__layer--pop" style={w(r.pctPop.male, step >= 0)} />
                <span className="pp-tri__layer pp-tri__layer--ideal" style={w(r.pctIdeal.male, step >= 1)} />
                <span className="pp-tri__layer pp-tri__layer--sample" style={w(r.pctAchieved.male, step >= 2)} />
              </span>
              <span className="pp-tri__age">{r.ageBand}</span>
              <span className="pp-tri__side">
                <span className="pp-tri__layer pp-tri__layer--pop" style={w(r.pctPop.female, step >= 0)} />
                <span className="pp-tri__layer pp-tri__layer--ideal" style={w(r.pctIdeal.female, step >= 1)} />
                <span className="pp-tri__layer pp-tri__layer--sample" style={w(r.pctAchieved.female, step >= 2)} />
              </span>
            </div>
          ))}
        </div>
        <div className="pp-tri__side-panel">
          <div className={`pp-key pp-key--pop${step >= 0 ? " is-on" : ""}`}>Padrón</div>
          <div className={`pp-key pp-key--ideal${step >= 1 ? " is-on" : ""}`}>Afijación ideal ({assessment.nTheoretical} respuestas)</div>
          <div className={`pp-key pp-key--sample${step >= 2 ? " is-on" : ""}`}>Muestra conseguida ({assessment.nObserved})</div>
          {step >= 3 && focus.length > 0 && (
            <div className="pp-tri__callout">
              <span className="pp-stat__value">{pct1.format(focusSample)} %</span>
              <span className="pp-stat__label">de la muestra tiene {focusBands.join(" y ")} años</span>
              <span className="pp-stat__value pp-tri__callout-pop">{pct1.format(focusPop)} %</span>
              <span className="pp-stat__label">del padrón</span>
            </div>
          )}
        </div>
      </div>
      <p className="pp-src">{`${source}. Cada capa, en porcentaje de su propio total. Describe la composición; no califica la representatividad.`}</p>
    </section>
  );
}

function YouthCoverageSlide({ a, step }: { a: IBSEYouthAnalysis; step: number }) {
  const maxN = Math.max(...a.ages.map((r) => r.population));
  return (
    <section className="pp-slide">
      <p className="pp-eyebrow">Monitor · {a.minAge} a {a.maxAge} años</p>
      <h2>{nf.format(a.group.n)} respuestas de {nf.format(a.group.population)} jóvenes</h2>
      <div className="pp-cov">
        {a.ages.map((r) => (
          <div key={r.age} className="pp-cov__row">
            <span className="pp-cov__age">{r.age} años</span>
            <span className="pp-cov__track" style={{ width: `${(r.population / maxN) * 100}%` }}>
              <span className="pp-cov__fill" style={{ width: step >= 1 ? `${(r.n / r.population) * 100}%` : "0%" }} />
            </span>
            <span className="pp-cov__label">{step >= 1 ? `${r.n} de ${r.population} · ${pct1.format(r.ratioPercent)} %` : `${r.population}`}</span>
          </div>
        ))}
      </div>
      <div className="pp-cov__summary">
        <span><b>{pct1.format(a.group.ratioPercent)} %</b> de la franja respondió</span>
        <span>Referencia de Cochran: <b>{a.group.nTheoretical}</b> respuestas</span>
        <span>Margen con {a.group.n}: <b>±{pct1.format(a.group.marginPoints)}</b> puntos</span>
      </div>
      <p className="pp-src">{`${a.populationSource} (población con tarjeta sanitaria del centro, no padrón). Respuestas válidas del Monitor. El margen supone selección aleatoria, que el Monitor no tuvo.`}</p>
    </section>
  );
}

function YouthIBSESlide({ a }: { a: IBSEYouthAnalysis }) {
  const lo = 40, hi = 85;
  const x = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  return (
    <section className="pp-slide">
      <p className="pp-eyebrow">Monitor · {a.minAge} a {a.maxAge} años</p>
      <h2>IBSE total por edad y sexo</h2>
      <div className="pp-legend"><span className="pp-key pp-key--f">Mujeres</span><span className="pp-key pp-key--m">Hombres</span><span className="pp-key pp-key--all">Total, con intervalo del 95 %</span></div>
      <div className="pp-dots-plot">
        {a.ages.map((r) => (
          <div key={r.age} className="pp-dots-plot__row">
            <span className="pp-dots-plot__age">{r.age} años<small>{r.n} respuestas</small></span>
            <span className="pp-dots-plot__axis">
              {r.total.low !== undefined && <span className="pp-dots-plot__ci" style={{ left: x(r.total.low), width: `calc(${x(r.total.high!)} - ${x(r.total.low)})` }} />}
              <span className="pp-dots-plot__dot pp-dots-plot__dot--all" style={{ left: x(r.total.mean) }} title={pct1.format(r.total.mean)} />
              {r.women.meanTotal !== undefined && <span className="pp-dots-plot__dot pp-dots-plot__dot--f" style={{ left: x(r.women.meanTotal) }} />}
              {r.men.meanTotal !== undefined && <span className="pp-dots-plot__dot pp-dots-plot__dot--m" style={{ left: x(r.men.meanTotal) }} />}
            </span>
            <span className="pp-dots-plot__values">
              <b>{pct1.format(r.total.mean)}</b>
              <small>M {r.women.meanTotal !== undefined ? pct1.format(r.women.meanTotal) : "—"} ({r.women.n}) · H {r.men.meanTotal !== undefined ? pct1.format(r.men.meanTotal) : "—"} ({r.men.n})</small>
            </span>
          </div>
        ))}
        <div className="pp-dots-plot__scale"><span /><span className="pp-dots-plot__ticks"><span>{lo}</span><span>{nf.format((lo + hi) / 2)}</span><span>{hi}</span></span><span /></div>
      </div>
      <p className="pp-src">{`Escala 0–100. Intervalo del 95 % con corrección por población finita, solo con 10 o más respuestas; supone selección aleatoria, que el Monitor no tuvo. Población: ${a.populationSource}.`}</p>
    </section>
  );
}

function YouthFactorsSlide({ a }: { a: IBSEYouthAnalysis }) {
  return (
    <section className="pp-slide">
      <p className="pp-eyebrow">Monitor · {a.minAge} a {a.maxAge} años frente a {a.maxAge + 1} o más</p>
      <h2>Los cuatro factores en los jóvenes</h2>
      <div className="pp-legend"><span className="pp-key pp-key--young">{a.minAge}–{a.maxAge} años ({a.group.n})</span><span className="pp-key pp-key--older">{a.maxAge + 1} o más ({a.older.n})</span></div>
      <div className="pp-factors">
        {IBSE_FIELDS.map(({ field, label }) => {
          const y = a.group.means[field];
          const o = a.older.means[field];
          return (
            <div key={field} className={`pp-factor${field === "meanTotal" ? " pp-factor--total" : ""}`}>
              <span className="pp-factor__label">{label}</span>
              <span className="pp-factor__bars">
                <span className="pp-cbar pp-cbar--young"><span style={{ width: `${y.mean}%` }} /><b>{pct1.format(y.mean)}{y.low !== undefined ? ` (${pct1.format(y.low)}–${pct1.format(y.high!)})` : ""}</b></span>
                <span className="pp-cbar pp-cbar--older"><span style={{ width: `${Number.isFinite(o) ? o : 0}%` }} /><b>{Number.isFinite(o) ? pct1.format(o) : "—"}</b></span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="pp-src">Escala 0–100. Entre paréntesis, intervalo del 95 % de la franja joven con corrección por población finita; supone selección aleatoria. Las medias de mayor edad describen a quienes respondieron.</p>
    </section>
  );
}

function SlideView({ slide, onGoToCycle, step }: { slide: Slide; onGoToCycle: () => void; step: number }) {
  switch (slide.type) {
    case "tripyramid":
      return <TriPyramidSlide assessment={slide.assessment} focusBands={slide.focusBands} source={slide.source} step={step} />;
    case "youth-coverage":
      return <YouthCoverageSlide a={slide.analysis} step={step} />;
    case "youth-ibse":
      return <YouthIBSESlide a={slide.analysis} />;
    case "youth-factors":
      return <YouthFactorsSlide a={slide.analysis} />;
    case "cover":
      return (
        <section className="pp-slide pp-cover">
          <p className="pp-chain">Marco estratégico · Estrategia de Promoción de una Vida Saludable en Andalucía</p>
          <p className="pp-wordmark">COMPÁS</p>
          <hr className="pp-rule" />
          <h1>{slide.municipality}</h1>
          <p className="pp-cover__sub">Proceso local de salud{slide.province ? ` · ${slide.province}` : ""}</p>
          {slide.profileTitle && <p className="pp-cover__profile">{slide.profileTitle}{slide.validatedAt ? ` · validado el ${longDate(slide.validatedAt)}` : ""}{slide.inReview && " · En revisión"}</p>}
          <div className="pp-logos"><InstitutionalLogoBand variant="cover" ids={LOGOS} /></div>
        </section>
      );
    case "timeline":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">Recorrido</p>
          <h2>De dónde venimos</h2>
          <ol className="pp-timeline" style={{ gridTemplateColumns: `repeat(${slide.items.length}, 1fr)` }}>
            {slide.items.map((item, i) => (
              <li key={`${item.date}-${i}`} className={`pp-tl pp-tl--${item.kind}`}>
                <span className="pp-tl__dot" />
                <span className="pp-tl__date">{longDate(item.date)}</span>
                <span className="pp-tl__kind">{item.kindLabel}</span>
                <span className="pp-tl__title">{item.title}</span>
              </li>
            ))}
          </ol>
          <Foot>Hitos registrados en el expediente y fecha de validación del Perfil.</Foot>
        </section>
      );
    case "figures":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <div className={`pp-figures pp-figures--${Math.min(slide.figures.length, 4)}`}>
            {slide.figures.map((f) => <FigureCard key={f.id} f={f} />)}
          </div>
          <Foot>{slide.source}</Foot>
        </section>
      );
    case "ibse":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">Monitor de bienestar socioemocional · IBSE</p>
          <h2>{nf.format(slide.n)} respuestas · {nf.format(slide.nValid)} válidas</h2>
          <div className="pp-ibse">
            <div className="pp-hbars">
              {slide.factors.map((f) => (
                <div key={f.label} className={`pp-hbar${f.label === "IBSE total" ? " pp-hbar--total" : ""}`}>
                  <span className="pp-hbar__label">{f.label}</span>
                  <span className="pp-hbar__track"><span className="pp-hbar__fill" style={{ width: `${Math.max(0, Math.min(100, f.value))}%` }} /></span>
                  <span className="pp-hbar__value">{mean.format(f.value)}</span>
                </div>
              ))}
              <p className="pp-scale">Escala 0–100</p>
            </div>
            <div className="pp-ibse__side">
              {slide.strata.map((s) => (
                <div key={s.label} className="pp-stat"><span className="pp-stat__value">{mean.format(s.mean)}</span><span className="pp-stat__label">IBSE total · {s.label} · {nf.format(s.nValid)} válidas</span></div>
              ))}
              {slide.highlights.map((f) => (
                <div key={f.id} className="pp-stat pp-stat--soft"><span className="pp-stat__value">{f.value} %</span><span className="pp-stat__label">{f.title}</span></div>
              ))}
            </div>
          </div>
          <Foot>{`${slide.source}. Medias y porcentajes de quienes respondieron, no estimaciones de la población.`}</Foot>
        </section>
      );
    case "sample": {
      const max = Math.max(...slide.cells.map((c) => Math.max(c.male, c.female)));
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">Monitor de bienestar socioemocional</p>
          <h2>Quién respondió</h2>
          <div className="pp-pyramid">
            <div className="pp-pyramid__head"><span>Hombres</span><span /><span>Mujeres</span></div>
            {[...slide.cells].reverse().map((c) => (
              <div key={c.ageBand} className="pp-pyramid__row">
                <span className="pp-pyramid__side pp-pyramid__side--m"><span className="pp-pyramid__n">{c.male}</span><span className="pp-pyramid__bar pp-pyramid__bar--m" style={{ width: `${(c.male / max) * 100}%` }} /></span>
                <span className="pp-pyramid__age">{c.ageBand}</span>
                <span className="pp-pyramid__side"><span className="pp-pyramid__bar pp-pyramid__bar--f" style={{ width: `${(c.female / max) * 100}%` }} /><span className="pp-pyramid__n">{c.female}</span></span>
              </div>
            ))}
          </div>
          <Foot>{`${slide.source}. Respuestas por edad y sexo: ${nf.format(slide.assigned)} con edad y sexo asignables.`}</Foot>
        </section>
      );
    }
    case "comparison":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <div className="pp-compare">
            <div className="pp-legend"><span className="pp-key pp-key--muni">Municipio</span>{slide.rows[0].comparisons.map((c, i) => <span key={c.label} className={`pp-key pp-key--c${i}`}>{c.label}</span>)}</div>
            {slide.rows.map((r) => {
              const values = [r.numeric ?? 0, ...r.comparisons.map((c) => c.value)];
              const max = Math.max(...values) || 1;
              return (
                <div key={r.id} className="pp-compare__row">
                  <span className="pp-compare__title">{r.title}<small>{r.unit} · {r.period}</small></span>
                  <span className="pp-compare__bars">
                    <span className="pp-cbar pp-cbar--muni"><span style={{ width: `${(values[0] / max) * 100}%` }} /><b>{r.value}</b></span>
                    {r.comparisons.map((c, i) => <span key={c.label} className={`pp-cbar pp-cbar--c${i}`}><span style={{ width: `${(c.value / max) * 100}%` }} /><b>{nf.format(c.value)}</b></span>)}
                  </span>
                </div>
              );
            })}
          </div>
          <Foot>{slide.source}</Foot>
        </section>
      );
    case "pairs":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <div className="pp-legend"><span className="pp-key pp-key--f">Mujeres</span><span className="pp-key pp-key--m">Hombres</span></div>
          <div className="pp-pairs">
            {slide.rows.map((p) => {
              const max = Math.max(p.women.numeric ?? 0, p.men.numeric ?? 0) || 1;
              return (
                <div key={p.women.id} className="pp-pair">
                  <span className="pp-pair__title">{p.title}<small>{p.women.unit} · {p.women.period}</small></span>
                  <span className="pp-cbar pp-cbar--f"><span style={{ width: `${((p.women.numeric ?? 0) / max) * 100}%` }} /><b>{p.women.value}</b></span>
                  <span className="pp-cbar pp-cbar--m"><span style={{ width: `${((p.men.numeric ?? 0) / max) * 100}%` }} /><b>{p.men.value}</b></span>
                </div>
              );
            })}
          </div>
          <Foot>{slide.source}</Foot>
        </section>
      );
    case "sections": {
      const max = Math.max(...slide.bars.map((b) => b.value)) || 1;
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <p className="pp-unit">{slide.unit} · {slide.period}</p>
          <div className="pp-columns" style={{ gridTemplateColumns: `repeat(${slide.bars.length}, 1fr)` }}>
            {slide.bars.map((b) => (
              <div key={b.section} className="pp-column">
                <span className="pp-column__value">{b.label}</span>
                <span className="pp-column__bar" style={{ height: `${(b.value / max) * 100}%` }} />
                <span className="pp-column__label">{b.section}</span>
              </div>
            ))}
          </div>
          <Foot>{`${slide.source}. Datos agregados por sección; no se atribuyen a personas, viviendas o calles.`}</Foot>
        </section>
      );
    }
    case "conclusions":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">Perfil de Salud Local · conclusiones</p>
          <h2>Lo que concluye el Perfil</h2>
          <ol className="pp-conclusions">
            {slide.items.map((c) => <li key={c.id}><span className="pp-badge">{c.id}</span><span>{c.headline}</span></li>)}
          </ol>
          <Foot>{`${slide.profileTitle}. Conclusiones elegidas por el equipo técnico (${slide.total}); texto completo en el Perfil.`}</Foot>
        </section>
      );
    case "recommendations":
      return (
        <section className="pp-slide">
          <p className="pp-eyebrow">Perfil de Salud Local · recomendaciones</p>
          <h2>Lo que recomienda el Perfil</h2>
          <div className="pp-recs">
            {slide.items.map((r) => (
              <div key={r.id} className={`pp-rec pp-rec--${r.kind.toLowerCase()}`}>
                <span className="pp-badge">{r.id}</span>
                <span className="pp-rec__name">{r.name}</span>
                <span className="pp-rec__kind">{r.kind}</span>
              </div>
            ))}
          </div>
          <Foot>{`${slide.profileTitle}. Propuestas para la deliberación del Grupo Motor, no prioridades adoptadas.`}</Foot>
        </section>
      );
    case "documentary-page": {
      const { page } = slide;
      return (
        <section className="pp-slide pp-documentary">
          <h2>{page.title}</h2>
          {page.introduction && <p className="pp-documentary__intro">{page.introduction}</p>}
          {page.kind === "notes" ? (
            <dl className="pp-documentary__notes">
              {page.entries.map((entry, i) => (
                <div key={i}><dt>{entry.heading}</dt><dd>{entry.text}</dd></div>
              ))}
            </dl>
          ) : (
            <table className="pp-documentary__table" aria-label={page.title}>
              <thead><tr>{page.columns.map((column, i) => <th key={i} scope="col">{column}</th>)}</tr></thead>
              <tbody>{page.rows.map(([label, ...cells], i) => (
                <tr key={i}><th scope="row">{label}</th>{cells.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}</tbody>
            </table>
          )}
          <Foot>{page.source}</Foot>
        </section>
      );
    }
    case "closing":
      return (
        <section className="pp-slide pp-cover pp-closing">
          <p className="pp-wordmark">COMPÁS</p>
          <hr className="pp-rule" />
          <h1>Del Perfil a la acción</h1>
          <p className="pp-cover__sub">{slide.municipality} · priorizar y planificar</p>
          {!!slide.pendingChoices && <p className="pp-cover__profile">Conclusiones y recomendaciones pendientes de seleccionar · {slide.pendingChoices}</p>}
          <button type="button" className="pp-cta" onClick={onGoToCycle}>{slide.goToPrioritization ? "Ir a Priorización" : "Ir al ciclo de planificación →"}</button>
        </section>
      );
  }
}

export function ProcessPresentation({ slides, onClose, onGoToCycle, initialIndex = 0, initialStep = 0 }: { slides: Slide[]; onClose: () => void; onGoToCycle: () => void; initialIndex?: number; initialStep?: number }) {
  const [index, setIndex] = useState(Math.max(0, Math.min(slides.length - 1, initialIndex)));
  const [step, setStep] = useState(initialStep);
  const [scale, setScale] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const go = useCallback((n: number, toStep = 0) => {
    const next = Math.max(0, Math.min(slides.length - 1, n));
    setIndex(next);
    setStep(Math.min(toStep, slideSteps(slides[next]) - 1));
  }, [slides]);
  const forward = useCallback(() => {
    if (step < slideSteps(slides[index]) - 1) setStep(step + 1);
    else go(index + 1);
  }, [go, index, slides, step]);
  const back = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else go(index - 1, Number.MAX_SAFE_INTEGER);
  }, [go, index, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); forward(); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); back(); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward, go, onClose, slides.length]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(0.1, Math.min(width / 1600, height / 900)));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  };
  const leaveToCycle = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    onGoToCycle();
  };

  return (
    <div className="pp-root" ref={rootRef} role="dialog" aria-modal="true" aria-label="Presentación del proceso">
      <div className="pp-stage" ref={stageRef}>
        <div className="pp-frame" style={{ transform: `scale(${scale})` }}>
          <SlideView slide={slides[index]} onGoToCycle={leaveToCycle} step={step} />
        </div>
      </div>
      <div className="pp-bar">
        <button type="button" onClick={back} disabled={index === 0 && step === 0}>← Anterior</button>
        <span className="pp-counter">{index + 1} / {slides.length}</span>
        <button type="button" onClick={forward} disabled={index === slides.length - 1 && step >= slideSteps(slides[index]) - 1}>Siguiente →</button>
        <span className="pp-dots">{slides.map((_, i) => <button key={i} type="button" aria-label={`Diapositiva ${i + 1}`} className={i === index ? "is-on" : ""} onClick={() => go(i)} />)}</span>
        <button type="button" onClick={toggleFullscreen}>Pantalla completa</button>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
