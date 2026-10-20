import { useMemo, useState } from "react";
import type { ActuationTemplate } from "../../domain/agenda/ActuationTemplate";
import {
  catalogAmbitos, epvsaCatalogTree, listTemplates, templatePrograms,
} from "../../application/agenda/actuationTemplates";
import { HISTORIC_LINES } from "../../domain/agenda/historicEpvsaStructure";

interface Props {
  own: readonly ActuationTemplate[];
  onUse: (template: ActuationTemplate) => void;
  onRemoveOwn: (id: string) => void;
  onClose: () => void;
}

const SHOWN = 40;

/** Repositorio de actuaciones-tipo (CONTRACT-ACTUATION-TEMPLATES): buscar, elegir y adaptar. */
export function ActuationTemplatePicker({ own, onUse, onRemoveOwn, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("");
  const [origin, setOrigin] = useState<"" | "historico" | "propia">("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "list">("tree");
  const [lineCode, setLineCode] = useState("");
  const [ambito, setAmbito] = useState("");
  const [programCode, setProgramCode] = useState("");
  const tree = useMemo(() => epvsaCatalogTree({ query, lineCode, ambito, programCode }), [query, lineCode, ambito, programCode]);
  const treeCount = tree.reduce((n, l) => n + l.programs.reduce((m, p) => m + p.templates.length, 0), 0);
  const treePrograms = useMemo(() => epvsaCatalogTree({}).flatMap((l) => l.programs.map((p) => ({ code: p.code, label: `${p.code} · ${p.shortName}` }))), []);
  const programs = useMemo(() => templatePrograms(own), [own]);
  const found = useMemo(() => listTemplates(own, { query, program, origin }), [own, query, program, origin]);
  const shown = found.slice(0, SHOWN);

  return (
    <section className="agenda-templates" aria-label="Repositorio de actuaciones-tipo">
      <header className="agenda-templates__header">
        <div>
          <p className="eyebrow">Repositorio</p>
          <h3>Actuaciones-tipo</h3>
        </div>
        <button type="button" onClick={onClose}>Cerrar</button>
      </header>
      <p className="panel-note">
        Elige una actuación-tipo para crear tu actuación a partir de ella y adáptala a tu municipio. La plantilla no cambia.
        El catálogo heredado del histórico no está verificado contra la EPVSA; las propias las crea el equipo desde la ficha de una actuación.
      </p>
      <div className="agenda-filters" role="group" aria-label="Vista del repositorio">
        <button type="button" aria-pressed={view === "tree"} onClick={() => setView("tree")}>Catálogo EPVSA por línea y programa</button>
        <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Lista (incluye fichas completas y propias)</button>
      </div>
      <div className="agenda-filters" role="search">
        <label><span className="agenda-sr">Buscar actuaciones-tipo</span>
          <input type="search" value={query} placeholder="Buscar: GRUSE, Puntos Vuela, taller…" onChange={(e) => setQuery(e.target.value)} />
        </label>
        {view === "list" ? (<>
          <label><span className="agenda-sr">Filtrar por programa</span>
            <select value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="">Todos los programas</option>
              {programs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label><span className="agenda-sr">Filtrar por origen</span>
            <select value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)}>
              <option value="">Todas</option>
              <option value="propia">Propias</option>
              <option value="historico">Heredadas del histórico</option>
            </select>
          </label>
        </>) : (<>
          <label><span className="agenda-sr">Filtrar por línea estratégica</span>
            <select value={lineCode} onChange={(e) => setLineCode(e.target.value)}>
              <option value="">Todas las líneas</option>
              {HISTORIC_LINES.map((l) => <option key={l.code} value={l.code}>{l.code} · {l.name.length > 60 ? `${l.name.slice(0, 60)}…` : l.name}</option>)}
            </select>
          </label>
          <label><span className="agenda-sr">Filtrar por ámbito</span>
            <select value={ambito} onChange={(e) => setAmbito(e.target.value)}>
              <option value="">Todos los ámbitos</option>
              {catalogAmbitos().map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label><span className="agenda-sr">Filtrar por programa del catálogo</span>
            <select value={programCode} onChange={(e) => setProgramCode(e.target.value)}>
              <option value="">Todos los programas</option>
              {treePrograms.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </label>
        </>)}
      </div>
      {view === "tree" ? (
        <>
          <p className="panel-note" role="status">
            {treeCount} actuaciones-tipo del catálogo EPVSA en {tree.reduce((n, l) => n + l.programs.length, 0)} programas.
            Líneas y objetivos contrastados con el documento de la EPVSA; programas y actuaciones heredados del histórico, no verificados. Al añadir se abre la ficha para adaptarla; la línea queda
            indicada y el objetivo lo eliges tú.
          </p>
          <div className="agenda-catalog">
            {tree.map((line) => (
              <details key={line.code} className="agenda-catalog__line" open={!!(query || lineCode || ambito || programCode)}>
                <summary>
                  <strong>{line.code}</strong> {line.name} <small>· {line.programs.length} programas</small>
                </summary>
                <p className="agenda-catalog__objectives">
                  <strong>Objetivos estratégicos:</strong> {line.objectives.map((o) => o.code).join(" · ")}
                </p>
                {line.programs.map((prog) => (
                  <details key={prog.code} className="agenda-catalog__program" open={!!(query || programCode)}>
                    <summary>
                      <strong>{prog.code}</strong> {prog.shortName} <small>· {prog.ambito} · {prog.templates.length} actuaciones-tipo</small>
                    </summary>
                    <p className="agenda-catalog__objectives"><strong>Nombre completo:</strong> {prog.name}</p>
                    <p className="agenda-catalog__objectives">
                      <strong>Objetivos estratégicos vinculados:</strong> {prog.objectiveCodes.join(", ") || "sin vínculo en la fuente"}
                    </p>
                    <ul className="agenda-templates__list">
                      {prog.templates.map((t) => (
                        <li key={t.id} className="agenda-templates__item">
                          <div><strong>{t.code}</strong><small>{t.name}</small></div>
                          <div className="agenda-templates__actions">
                            <button type="button" onClick={() => onUse(t)} aria-label={`Añadir a agenda: ${t.name}`}>➕ Añadir a agenda</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </details>
            ))}
          </div>
        </>
      ) : (<>
      <p className="panel-note" role="status">{found.length} actuaciones-tipo{found.length > SHOWN ? `; se muestran las ${SHOWN} primeras, afina la búsqueda` : ""}.</p>
      <ul className="agenda-templates__list">
        {shown.map((t) => (
          <li key={t.id} className="agenda-templates__item">
            <div>
              <strong>{t.name}</strong>
              <small>{t.code ? `${t.code} · ` : ""}{t.program ?? ""}{t.origin === "propia" ? " · propia" : " · heredada del histórico"}</small>
              {t.description && <small>{t.description}</small>}
              {t.indicator && <small>Indicador que le atribuía el histórico (solo referencia): {t.indicator}</small>}
              {t.evidenceBase && <small>Base citada por la fuente: {t.evidenceBase}</small>}
            </div>
            <div className="agenda-templates__actions">
              <button type="button" onClick={() => onUse(t)}>Usar y adaptar</button>
              {t.origin === "propia" && (confirmRemove === t.id
                ? <><button type="button" className="agenda-danger" onClick={() => { onRemoveOwn(t.id); setConfirmRemove(null); }}>Eliminar de verdad</button><button type="button" onClick={() => setConfirmRemove(null)}>Cancelar</button></>
                : <button type="button" onClick={() => setConfirmRemove(t.id)}>Eliminar</button>)}
            </div>
          </li>
        ))}
      </ul>
      </>)}
    </section>
  );
}
