import { useCallback, useEffect, useRef, useState } from "react";
import type { Figure, Slide } from "../../application/process/processPresentation";
import { InstitutionalLogoBand } from "./InstitutionalLogoBand";
import "./ProcessPresentation.css";

const LOGOS = ["consejeria", "distrito-sanitario", "relas", "violencia-genero", "rasselh"];
const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
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

function SlideView({ slide, onGoToCycle }: { slide: Slide; onGoToCycle: () => void }) {
  switch (slide.type) {
    case "cover":
      return (
        <section className="pp-slide pp-cover">
          <p className="pp-chain">Marco estratégico · Estrategia de Promoción de una Vida Saludable en Andalucía</p>
          <p className="pp-wordmark">COMPÁS</p>
          <hr className="pp-rule" />
          <h1>{slide.municipality}</h1>
          <p className="pp-cover__sub">Proceso local de salud{slide.province ? ` · ${slide.province}` : ""}</p>
          {slide.profileTitle && <p className="pp-cover__profile">{slide.profileTitle}{slide.validatedAt ? ` · validado el ${longDate(slide.validatedAt)}` : ""}</p>}
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
    case "closing":
      return (
        <section className="pp-slide pp-cover pp-closing">
          <p className="pp-wordmark">COMPÁS</p>
          <hr className="pp-rule" />
          <h1>Del Perfil a la acción</h1>
          <p className="pp-cover__sub">{slide.municipality} · priorizar y planificar</p>
          <button type="button" className="pp-cta" onClick={onGoToCycle}>Ir al ciclo de planificación →</button>
        </section>
      );
  }
}

export function ProcessPresentation({ slides, onClose, onGoToCycle, initialIndex = 0 }: { slides: Slide[]; onClose: () => void; onGoToCycle: () => void; initialIndex?: number }) {
  const [index, setIndex] = useState(Math.max(0, Math.min(slides.length - 1, initialIndex)));
  const [scale, setScale] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const go = useCallback((n: number) => setIndex(Math.max(0, Math.min(slides.length - 1, n))), [slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(index + 1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(index - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose, slides.length]);

  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (el) setScale(Math.max(0.1, Math.min(el.clientWidth / 1600, el.clientHeight / 900)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (stageRef.current) observer.observe(stageRef.current);
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
          <SlideView slide={slides[index]} onGoToCycle={leaveToCycle} />
        </div>
      </div>
      <div className="pp-bar">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>← Anterior</button>
        <span className="pp-counter">{index + 1} / {slides.length}</span>
        <button type="button" onClick={() => go(index + 1)} disabled={index === slides.length - 1}>Siguiente →</button>
        <span className="pp-dots">{slides.map((_, i) => <button key={i} type="button" aria-label={`Diapositiva ${i + 1}`} className={i === index ? "is-on" : ""} onClick={() => go(i)} />)}</span>
        <button type="button" onClick={toggleFullscreen}>Pantalla completa</button>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
