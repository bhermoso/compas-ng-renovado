import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { ProfileStructure, ProfileSection } from "../../application/health-profile/profileStructure";

/** Marca las citas [1], [3, tabla 31033] sin alterar el texto. */
function withCitations(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]{1,60}\])/g);
  return parts.map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? <span key={i} className="epr-cite">{part}</span> : <Fragment key={i}>{part}</Fragment>
  );
}

const RECO_ORDER = ["Conocer", "Contrastar", "Abordar"] as const;

function SectionBody({ section, structure }: { section: ProfileSection; structure: ProfileStructure }) {
  if (/conclusiones/i.test(section.title) && structure.conclusions.length > 0) {
    const firstConclusion = section.paragraphs.findIndex((p) => /^C\d+[.\s]/.test(p));
    const intro = firstConclusion > 0 ? section.paragraphs.slice(0, firstConclusion) : [];
    return (
      <>
        {intro.map((p, i) => <p key={`i${i}`}>{withCitations(p)}</p>)}
        <ol className="epr-conclusions">
          {structure.conclusions.map((c) => (
            <li key={c.id} id={`epr-${c.id}`}>
              <h4><span className="epr-badge">{c.id}</span>{c.title}</h4>
              {c.body.map((p, i) => <p key={i}>{withCitations(p)}</p>)}
              {c.leadsTo && <p className="epr-leads">Lleva a {c.leadsTo}</p>}
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (/recomendaciones/i.test(section.title) && structure.recommendations.length > 0) {
    const intro = section.paragraphs.filter((p) => !/^(R\d+|Tipo\s|C\d+|Deriva de|(?:[A-Z] ){2,}|CONOCER|CONTRASTAR|ABORDAR)/.test(p)).slice(0, 2);
    const groups = RECO_ORDER.map((type) => ({ type, items: structure.recommendations.filter((r) => r.type === type) })).filter((g) => g.items.length);
    const untyped = structure.recommendations.filter((r) => !r.type);
    return (
      <>
        {intro.map((p, i) => <p key={`i${i}`}>{withCitations(p)}</p>)}
        {[...groups, ...(untyped.length ? [{ type: "Otras" as const, items: untyped }] : [])].map((g) => (
          <div key={g.type} className={`epr-reco-group epr-reco-group--${g.type.toLowerCase()}`}>
            <h4>{g.type}</h4>
            <ul>
              {g.items.map((r) => (
                <li key={r.id} id={`epr-${r.id}`}>
                  <span className="epr-badge">{r.id}</span>
                  <span>{withCitations(r.text)}{r.derivesFrom && <small> · Deriva de {r.derivesFrom}</small>}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    );
  }
  if (/referencias/i.test(section.title) && structure.references.length > 0) {
    return <ol className="epr-references">{structure.references.map((r, i) => <li key={i}>{r}</li>)}</ol>;
  }
  return <>{section.paragraphs.map((p, i) => <p key={i}>{withCitations(p)}</p>)}</>;
}

/**
 * Lector del Perfil: índice navegable y texto con su estructura reconocida.
 * El texto es el del perfil guardado; la estructura solo cambia la presentación.
 */
export function ProfileReader({ structure, pdfUrl, title }: { structure: ProfileStructure; pdfUrl?: string; title: string }) {
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [query, setQuery] = useState("");
  const sections = useMemo(() => structure.sections.filter((s) => s.id !== "inicio" || s.paragraphs.length), [structure]);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? sections.filter((s) => s.title.toLowerCase().includes(normalizedQuery) || s.paragraphs.some((p) => p.toLowerCase().includes(normalizedQuery)))
    : sections;

  return (
    <section className="epr" aria-label={`Lector: ${title}`}>
      <div className="epr-toolbar">
        <div className="epr-modes" role="group" aria-label="Vista del documento">
          <button type="button" aria-pressed={mode === "text"} onClick={() => setMode("text")}>Texto navegable</button>
          {pdfUrl && <button type="button" aria-pressed={mode === "pdf"} onClick={() => setMode("pdf")}>PDF original</button>}
        </div>
        {mode === "text" && (
          <label className="epr-search">
            <span className="ep-sr-only">Buscar en el perfil</span>
            <input type="search" placeholder="Buscar en el perfil" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        )}
      </div>
      {mode === "pdf" && pdfUrl ? (
        <div className="epr-pdf">
          <iframe title={`PDF original · ${title}`} src={pdfUrl} />
          <p className="ep-help"><a href={pdfUrl} target="_blank" rel="noopener noreferrer">Abrir el PDF en otra pestaña</a> si el visor no carga.</p>
        </div>
      ) : (
        <div className="epr-layout">
          <nav className="epr-toc" aria-label="Índice del perfil">
            <p className="ep-eyebrow">Índice</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id} className={s.level === 2 ? "epr-toc__sub" : undefined}>
                  <a href={`#epr-sec-${s.id}`}>{s.title === "Inicio" ? "Presentación" : s.title}</a>
                </li>
              ))}
            </ol>
            {structure.conclusions.length > 0 && (
              <>
                <p className="ep-eyebrow">Conclusiones</p>
                <p className="epr-toc__chips">{structure.conclusions.map((c) => <a key={c.id} href={`#epr-${c.id}`} title={c.title}>{c.id}</a>)}</p>
              </>
            )}
            {structure.recommendations.length > 0 && (
              <>
                <p className="ep-eyebrow">Recomendaciones</p>
                <p className="epr-toc__chips">{structure.recommendations.map((r) => <a key={r.id} href={`#epr-${r.id}`} title={r.text}>{r.id}</a>)}</p>
              </>
            )}
          </nav>
          <article className="epr-text">
            {normalizedQuery && <p className="ep-help">{matches.length === 1 ? "1 apartado contiene" : `${matches.length} apartados contienen`} «{query.trim()}».</p>}
            {matches.map((s) => {
              const Heading = s.level === 1 ? "h2" : "h3";
              return (
                <section key={s.id} id={`epr-sec-${s.id}`} className={`epr-section epr-section--${s.level}`}>
                  {s.title !== "Inicio" && <Heading>{s.title}</Heading>}
                  <SectionBody section={s} structure={structure} />
                </section>
              );
            })}
          </article>
        </div>
      )}
    </section>
  );
}
