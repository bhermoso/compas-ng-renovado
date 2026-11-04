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
const PAGE_CONTINUATION = /(?:[·•–—-]\s*|\()\s*continuaci[oó]n\b/i;

function SectionBody({ section, structure }: { section: ProfileSection; structure: ProfileStructure }) {
  if (/conclusiones/i.test(section.title) && !PAGE_CONTINUATION.test(section.title) && structure.conclusions.length > 0) {
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
  if (/recomendaciones/i.test(section.title) && !PAGE_CONTINUATION.test(section.title) && structure.recommendations.length > 0) {
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
  // El material de portada, créditos, resumen e índice se conserva, pero
  // no desplaza el primer capítulo sustantivo en la lectura normal.
  const firstChapterIndex = sections.findIndex((section) =>
    /^(?:\d+[.\s]+)?Punto de partida\b/i.test(section.title.trim())
  );
  // Las páginas de datos (Art. 17 ter) son parte del Perfil y abren la lectura; no van con los preliminares.
  const isDataPage = (s: ProfileSection) => /^(.+ en datos|Quién vive aquí|Panel de salud|Desigualdad)$/i.test(s.title.trim());
  const before = firstChapterIndex > 0 ? sections.slice(0, firstChapterIndex) : [];
  // Solo el material introductorio no numerado queda plegado. Los capítulos
  // 01–05, si existen, son parte del Perfil y deben figurar en el índice.
  const isNumberedChapter = (s: ProfileSection) => /^\d{1,2}\.?(?:\s+)/.test(s.title.trim());
  const firstNumberedIndex = sections.findIndex(isNumberedChapter);
  // Algunos PDF externos comienzan con una síntesis sin título numerado y
  // continúan directamente en «02». La lectura de COMPÁS le ofrece navegación
  // propia, pero declara que «01» es un rótulo editorial, no texto del original.
  const sourceStartsAtTwo = firstNumberedIndex > 0
    && /^0?2\.\s+/.test(sections[firstNumberedIndex].title.trim())
    && !sections.some((s) => /^0?1\.\s+/.test(s.title.trim()));
  const openingSections = sourceStartsAtTwo ? sections.slice(0, firstNumberedIndex) : [];
  const hasEditorialOpening = openingSections.some((s) => s.paragraphs.length > 0);
  const openingIds = new Set(hasEditorialOpening ? openingSections.map((s) => s.id) : []);
  const editorialOpening: ProfileSection = {
    id: "apertura-editorial",
    title: "01. Apertura y síntesis",
    level: 1,
    paragraphs: openingSections.flatMap((s) => s.paragraphs),
  };
  const preliminaries = before.filter((s) => !isDataPage(s) && !isNumberedChapter(s) && !openingIds.has(s.id));
  const preliminaryIds = new Set(preliminaries.map((s) => s.id));
  const readingSections = [
    ...(hasEditorialOpening ? [editorialOpening] : []),
    ...sections.filter((s) => !preliminaryIds.has(s.id) && !openingIds.has(s.id)),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const matchesSection = (s: ProfileSection) =>
    s.title.toLowerCase().includes(normalizedQuery) || s.paragraphs.some((p) => p.toLowerCase().includes(normalizedQuery));
  const matches = normalizedQuery ? readingSections.filter(matchesSection) : readingSections;
  const preliminaryMatches = normalizedQuery ? preliminaries.filter(matchesSection).length : 0;
  const totalMatches = matches.length + preliminaryMatches;

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
              {preliminaries.length > 0 && (
                <li className="epr-toc__preliminary"><a href="#epr-preliminaries">Presentación y materiales preliminares</a></li>
              )}
              {readingSections.map((s) => (
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
            {preliminaries.length > 0 && (
              <details className="epr-preliminaries" id="epr-preliminaries" open={preliminaryMatches > 0}>
                <summary>Presentación, resumen, créditos e índice del documento original</summary>
                <p className="ep-help">Información documental conservada íntegramente. Se muestra aparte para facilitar el acceso directo al contenido del Perfil.</p>
                {preliminaries.map((section) => (
                  <section key={section.id} id={`epr-sec-${section.id}`} className="epr-section epr-section--preliminary">
                    {section.title !== "Inicio" && <h3>{section.title}</h3>}
                    <SectionBody section={section} structure={structure} />
                  </section>
                ))}
              </details>
            )}
            {normalizedQuery && <p className="ep-help">{totalMatches === 1 ? "1 apartado contiene" : `${totalMatches} apartados contienen`} «{query.trim()}».</p>}
            {matches.map((s) => {
              const Heading = s.level === 1 ? "h2" : "h3";
              return (
                <section key={s.id} id={`epr-sec-${s.id}`} className={`epr-section epr-section--${s.level}`}>
                  {s.title !== "Inicio" && <Heading>{s.title}</Heading>}
                  {hasEditorialOpening && s.id === editorialOpening.id ? (
                    <>
                      <p className="ep-help">Rótulo de navegación añadido por COMPÁS: el texto incorporado no contiene un encabezado «01». El documento original no se ha modificado.</p>
                      {openingSections.map((original) => (
                        <section key={original.id} className="epr-section epr-section--opening-source">
                          {original.title !== "Inicio" && <h3>{original.title}</h3>}
                          <SectionBody section={original} structure={structure} />
                        </section>
                      ))}
                    </>
                  ) : <SectionBody section={s} structure={structure} />}
                </section>
              );
            })}
          </article>
        </div>
      )}
    </section>
  );
}
