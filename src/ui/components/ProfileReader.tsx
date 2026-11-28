import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { ProfileStructure, ProfileSection } from "../../application/health-profile/profileStructure";
import { DATA_PAGE_HEADINGS } from "../../application/health-profile/profileStructure";

import { ProfileText } from "./ProfileText";

/** Marca las citas [1], [3, tabla 31033] sin alterar el texto. */
function withCitations(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]{1,60}\])/g);
  return parts.map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? <span key={i} className="epr-cite">{part}</span> : <Fragment key={i}>{part}</Fragment>
  );
}

function proposalLinks(text: string, ids: ReadonlySet<string>): ReactNode {
  return text.split(/(\b[CR]\d+\b)/g).map((part, i) => ids.has(part)
    ? <a key={i} href={`#epr-${part}`}>{part}</a>
    : <Fragment key={i}>{part}</Fragment>);
}

function conclusionParagraph(text: string, recommendationIds: ReadonlySet<string>): ReactNode {
  const lead = /\bLleva a\s+(R\d+(?:(?:,\s*| y )R\d+)*)\.?$/i.exec(text);
  if (!lead) return withCitations(text);
  return <>{withCitations(text.slice(0, lead.index))}{proposalLinks(lead[0], recommendationIds)}</>;
}

const PAGE_CONTINUATION = /(?:[·•–—-]\s*|\()\s*continuaci[oó]n\b/i;

type ChapterIds = { conclusions?: string; recommendations?: string; references?: string };

function SectionBody({ section, structure, chapters, discarded }: {
  section: ProfileSection;
  structure: ProfileStructure;
  chapters: ChapterIds;
  discarded?: ReadonlySet<string>;
}) {
  if (section.id === chapters.conclusions && structure.conclusions.length > 0) {
    const firstConclusion = section.paragraphs.findIndex((p) => /^C\d+[.\s]/.test(p));
    const intro = firstConclusion > 0 ? section.paragraphs.slice(0, firstConclusion) : [];
    const recommendationIds = new Set(chapters.recommendations ? structure.recommendations.map(r => r.id) : []);
    return (
      <>
        {intro.map((p, i) => /^una lectura de conjunto$/i.test(p.trim())
          ? <h3 key={i}>{p}</h3>
          : <p key={i}>{withCitations(p)}</p>)}
        <ol className="epr-conclusions">
          {structure.conclusions.map((c) => (
            <li key={c.id} id={`epr-${c.id}`} className={discarded?.has(c.id) ? "epr-discarded" : undefined}>
              <h3><span className="epr-badge">{c.id}</span>{c.title}</h3>
              {discarded?.has(c.id) && <p className="epr-discarded__label">Descartada por el equipo técnico</p>}
              {c.body.map((p, i) => <p key={i}>{conclusionParagraph(p, recommendationIds)}</p>)}
              {c.leadsTo && <p className="epr-leads">Lleva a {proposalLinks(c.leadsTo, recommendationIds)}</p>}
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (section.id === chapters.recommendations && structure.recommendations.length > 0) {
    const firstRecommendation = section.paragraphs.findIndex((p) => /^R\d+\b/.test(p));
    const intro = firstRecommendation > 0 ? section.paragraphs.slice(0, firstRecommendation).filter((p) =>
      !/^Tipo\s+Recomendaci/i.test(p) && !/^(?:[A-Z] ){2,}/.test(p) && !/^(Conocer|Contrastar|Abordar)$/i.test(p)
    ) : [];
    const conclusionIds = new Set(chapters.conclusions ? structure.conclusions.map(c => c.id) : []);
    return (
      <>
        {intro.map((p, i) => <p key={`i${i}`}>{withCitations(p)}</p>)}
        <ol className="epr-recommendations">
          {structure.recommendations.map((r) => (
            <li key={r.id} id={`epr-${r.id}`} className={discarded?.has(r.id) ? "epr-discarded" : undefined}>
              <span className="epr-badge">{r.id}</span>
              <div>
                <p>{r.type && <strong>{r.type}. </strong>}{withCitations(r.text)}</p>
                {r.derivesFrom && <p className="epr-leads">Deriva de {proposalLinks(r.derivesFrom, conclusionIds)}</p>}
                {discarded?.has(r.id) && <p className="epr-discarded__label">Descartada por el equipo técnico</p>}
              </div>
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (section.id === chapters.references && structure.references.length > 0) {
    return <ol className="epr-references">{structure.references.map((r, i) => <li key={i}>{r}</li>)}</ol>;
  }
  return <ProfileText paragraphs={section.paragraphs} renderText={withCitations} />;
}

type OriginalPdf = { url: string; name: string; edition: string; differentRevision: boolean };

export function ProfileOriginalPdf({ pdf }: { pdf: OriginalPdf }) {
  return (
    <div className="epr-pdf">
      <p role="note" className="epr-pdf__edition"><strong>{pdf.edition}</strong>
        {pdf.differentRevision && <span>El archivo corresponde a una edición distinta del Perfil consultado.</span>}
      </p>
      <iframe title={`PDF original · ${pdf.name}`} src={pdf.url} />
      <p className="ep-help"><a href={pdf.url} target="_blank" rel="noopener noreferrer">Abrir el PDF en otra pestaña</a> si el visor no carga.</p>
    </div>
  );
}

/**
 * Lector del Perfil: índice navegable y texto con su estructura reconocida.
 * El texto es el del perfil guardado; la estructura solo cambia la presentación.
 */
export function ProfileReader({ structure, pdf, title, statusLabel, discarded, onExport, printable = false }: {
  structure: ProfileStructure;
  pdf?: OriginalPdf;
  title: string;
  statusLabel?: string;
  discarded?: ReadonlySet<string>;
  onExport?: () => void;
  printable?: boolean;
}) {
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [query, setQuery] = useState("");
  const sections = useMemo(() => structure.sections.filter((s) => s.id !== "inicio" || s.paragraphs.length), [structure]);
  const isAnnex = (s: ProfileSection) => s.level === 2 || /^(Anexos|Referencias)$/i.test(s.title);
  const annexIndex = sections.findIndex(isAnnex);
  const beforeAnnex = annexIndex === -1 ? sections : sections.slice(0, annexIndex);
  const chapter = (re: RegExp) => beforeAnnex.find((s) => re.test(s.title) && !PAGE_CONTINUATION.test(s.title))?.id;
  const chapters = {
    conclusions: chapter(/conclusiones/i),
    recommendations: chapter(/recomendaciones/i),
    references: sections.find((s) => /^referencias$/i.test(s.title))?.id,
  };
  // El material de portada, créditos, resumen e índice se conserva, pero
  // no desplaza el primer capítulo sustantivo en la lectura normal.
  const firstChapterIndex = sections.findIndex((section) =>
    /^(?:\d+[.\s]+)?Punto de partida\b/i.test(section.title.trim())
  );
  // Las páginas de datos (Art. 17 ter) son parte del Perfil y abren la lectura; no van con los preliminares.
  const isDataPage = (s: ProfileSection) => /^.+ en datos$/i.test(s.title.trim()) || Object.values(DATA_PAGE_HEADINGS).some(re => re.test(s.title.trim()));
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
  // «La salud en resumen» es un rótulo literal en la primera página del
  // Perfil externo de Alfacar. No atribuirlo a otros documentos que no lo declaran.
  const hasSourceSummary = openingSections.some((s) =>
    s.title.toLowerCase().includes("la salud en resumen")
    || s.paragraphs.some((p) => /\bla salud en resumen\b/i.test(p))
  );
  const openingIds = new Set(hasEditorialOpening ? openingSections.map((s) => s.id) : []);
  const editorialOpening: ProfileSection = {
    id: "apertura-editorial",
    title: hasSourceSummary ? "01. La salud en resumen" : "01. Apertura y síntesis",
    level: 1,
    paragraphs: openingSections.flatMap((s) => s.paragraphs),
  };
  const preliminaries = before.filter((s) => !isDataPage(s) && !isNumberedChapter(s) && !openingIds.has(s.id));
  const preliminaryIds = new Set(preliminaries.map((s) => s.id));
  const readingSections = [
    ...(hasEditorialOpening ? [editorialOpening] : []),
    ...sections.filter((s) => !preliminaryIds.has(s.id) && !openingIds.has(s.id)),
  ];
  const dataEnd = readingSections.findIndex((s) => !isDataPage(s));
  const dataCount = dataEnd === -1 ? readingSections.length : dataEnd;
  const annexStart = readingSections.findIndex(isAnnex);
  const bodyEnd = annexStart === -1 ? readingSections.length : annexStart;
  const indexGroups = [
    { heading: "Datos comparables", items: readingSections.slice(0, dataCount) },
    { heading: "Cuerpo del Perfil", items: readingSections.slice(dataCount, bodyEnd) },
    { heading: "Anexos y referencias", items: readingSections.slice(bodyEnd) },
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const matchesSection = (s: ProfileSection) =>
    s.title.toLowerCase().includes(normalizedQuery) || s.paragraphs.some((p) => p.toLowerCase().includes(normalizedQuery));
  const matches = normalizedQuery ? readingSections.filter(matchesSection) : readingSections;
  const preliminaryMatches = normalizedQuery ? preliminaries.filter(matchesSection).length : 0;
  const totalMatches = matches.length + preliminaryMatches;

  const content = (
    <article className="epr-text">
    {preliminaries.length > 0 && (
      <details className="epr-preliminaries" id="epr-preliminaries" open={printable || preliminaryMatches > 0}>
        <summary>Presentación, resumen, créditos e índice del documento original</summary>
        {preliminaries.map((section) => (
          <section key={section.id} id={`epr-sec-${section.id}`} className="epr-section epr-section--preliminary">
            {section.title !== "Inicio" && <h3>{section.title}</h3>}
            <SectionBody section={section} structure={structure} chapters={chapters} discarded={discarded} />
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
              <p className="ep-help">
                {hasSourceSummary
                  ? "«La salud en resumen» consta en el texto incorporado. Solo el número 01 se añade para facilitar la navegación; el documento original no se ha modificado."
                  : "Rótulo de navegación añadido por COMPÁS: el texto incorporado no contiene un encabezado «01». El documento original no se ha modificado."}
              </p>
              {pdf && <p className="ep-help"><a href={pdf.url} target="_blank" rel="noopener noreferrer">Abrir el PDF original para cotejar la apertura</a></p>}
              {openingSections.map((original) => (
                <section key={original.id} className="epr-section epr-section--opening-source">
                  {original.title !== "Inicio" && <h3>{original.title}</h3>}
                  <SectionBody section={original} structure={structure} chapters={chapters} discarded={discarded} />
                </section>
              ))}
            </>
          ) : <SectionBody section={s} structure={structure} chapters={chapters} discarded={discarded} />}
        </section>
      );
    })}
    </article>
  );

  if (printable) return (
    <div className="epr-print">
      <header className="epr-print__head">
        <p>COMPÁS · Exportación del Perfil de Salud Local</p>
        <h1>{title}</h1>
        {statusLabel && <p>{statusLabel}</p>}
      </header>
      {content}
    </div>
  );

  return (
    <section className="epr" aria-label={`Lector: ${title}`}>
      <div className="epr-toolbar">
        <div className="epr-modes" role="group" aria-label="Vista del documento">
          <button type="button" aria-pressed={mode === "text"} onClick={() => setMode("text")}>Texto navegable</button>
          {pdf && <button type="button" aria-pressed={mode === "pdf"} onClick={() => setMode("pdf")}>PDF original</button>}
        </div>
        {mode === "text" && (
          <>
            <label className="epr-search">
              <span className="ep-sr-only">Buscar en el perfil</span>
              <input type="search" placeholder="Buscar en el perfil" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {onExport && <button type="button" className="ep-primary" onClick={onExport}>Exportar Perfil a PDF</button>}
          </>
        )}
      </div>
      {mode === "pdf" && pdf ? (
        <ProfileOriginalPdf pdf={pdf} />
      ) : (
        <div className="epr-layout">
          <nav className="epr-toc" aria-label="Índice del perfil">
            {preliminaries.length > 0 && <a className="epr-toc__preliminary" href="#epr-preliminaries">Presentación y materiales preliminares</a>}
            {indexGroups.filter((group) => group.items.length > 0).map((group) => (
              <section key={group.heading} aria-label={group.heading}>
                <p className="ep-eyebrow">{group.heading}</p>
                <ol>{group.items.map((s) => (
                  <li key={s.id} className={s.level === 2 ? "epr-toc__sub" : undefined}>
                    <a href={`#epr-sec-${s.id}`}>{s.title === "Inicio" ? "Presentación" : s.title}</a>
                  </li>
                ))}</ol>
              </section>
            ))}
          </nav>
          {content}
        </div>
      )}
    </section>
  );
}
