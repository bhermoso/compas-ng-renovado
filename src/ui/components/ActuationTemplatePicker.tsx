import { useMemo, useState } from "react";
import type { ActuationTemplate } from "../../domain/agenda/ActuationTemplate";
import { listTemplates, templatePrograms } from "../../application/agenda/actuationTemplates";

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
      <div className="agenda-filters" role="search">
        <label><span className="agenda-sr">Buscar actuaciones-tipo</span>
          <input type="search" value={query} placeholder="Buscar: GRUSE, Puntos Vuela, taller…" onChange={(e) => setQuery(e.target.value)} />
        </label>
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
      </div>
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
    </section>
  );
}
