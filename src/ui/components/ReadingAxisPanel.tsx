import { useState } from "react";
import type { ReadingAxisDeclaration } from "../../domain/repository";
import {
  KNOWN_INFORME_DIMENSIONS,
  KNOWN_LOCALIZA_TEMATICAS,
  currentAxes,
  validateAxisDeclaration,
} from "../../application/localiza-assets";

type Draft = Omit<ReadingAxisDeclaration, "version" | "declaredAt">;

interface ReadingAxisPanelProps {
  history: ReadonlyArray<ReadingAxisDeclaration>;
  onDeclare: (axis: Draft) => void;
}

/**
 * Ejes de lectura (CONTRACT-LHPM v1.7, Art. 4 ter). Un eje agrupa evidencia sobre un
 * tema que el Informe trata y la papeleta no recoge. Lo declara una persona del equipo
 * técnico, con su definición, las dimensiones del Informe que agrupa y las temáticas
 * de Localiza que conecta; cada cambio es una versión nueva. Declararlo no lo prioriza.
 */
export function ReadingAxisPanel({ history, onDeclare }: ReadingAxisPanelProps) {
  const current = currentAxes(history);
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [definition, setDefinition] = useState("");
  const [dims, setDims] = useState<string[]>([]);
  const [tematicas, setTematicas] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string, on: boolean) =>
    set(on ? [...list, v] : list.filter((x) => x !== v));

  function submit() {
    const draft: Draft = {
      id: id.trim(),
      label: label.trim(),
      definition: definition.trim(),
      informeDimensions: dims,
      localizaTematicas: tematicas,
      declaredBy: author.trim(),
    };
    const found = validateAxisDeclaration(draft);
    setProblems(found);
    if (found.length === 0) onDeclare(draft);
  }

  function load(a: ReadingAxisDeclaration) {
    setId(a.id);
    setLabel(a.label);
    setDefinition(a.definition);
    setDims(a.informeDimensions);
    setTematicas(a.localizaTematicas);
  }

  return (
    <section className="workspace-panel" aria-labelledby="reading-axes-title">
      <h2 id="reading-axes-title">Ejes de lectura</h2>
      <p>
        Un eje agrupa evidencia sobre un tema que el Informe trata y la priorización no recoge. Lo declara
        una persona del equipo técnico, con su definición, las dimensiones del Informe que agrupa y las
        temáticas de Localiza cuyos activos conecta. Declararlo no lo prioriza: priorizar corresponde al
        Grupo Motor. Sin ninguna fuente en el expediente, el eje no genera unidad.
      </p>
      {current.length === 0 ? <p>No hay ejes declarados.</p> : (
        <ul className="document-list">
          {current.map((a) => (
            <li key={a.id} className="document-row">
              <div>
                <p className="document-kind">
                  {a.label} · versión {a.version} · {a.declaredBy} · {a.declaredAt.slice(0, 10)}
                </p>
                <p>{a.definition}</p>
                <p>Dimensiones del Informe: {a.informeDimensions.join("; ")}.</p>
                {a.localizaTematicas.length > 0 && <p>Temáticas de Localiza: {a.localizaTematicas.join("; ")}.</p>}
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => load(a)}>Cargar en el formulario</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label>Identificador<input type="text" value={id} onChange={(e) => setId(e.target.value)} /></label>
      <label>Nombre del eje<input type="text" value={label} onChange={(e) => setLabel(e.target.value)} /></label>
      <label>Definición<textarea rows={2} value={definition} onChange={(e) => setDefinition(e.target.value)} /></label>
      <fieldset>
        <legend>Dimensiones del Informe que agrupa</legend>
        {KNOWN_INFORME_DIMENSIONS.map((d) => (
          <label key={d}>
            <input type="checkbox" checked={dims.includes(d)} onChange={(e) => toggle(dims, setDims, d, e.target.checked)} />
            {d}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Temáticas de Localiza que conecta con el eje</legend>
        {KNOWN_LOCALIZA_TEMATICAS.map((t) => (
          <label key={t}>
            <input type="checkbox" checked={tematicas.includes(t)} onChange={(e) => toggle(tematicas, setTematicas, t, e.target.checked)} />
            {t}
          </label>
        ))}
      </fieldset>
      <label>Autoría<input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
      {problems.map((m) => <p key={m} role="alert">{m}</p>)}
      <button type="button" onClick={submit}>Declarar eje</button>
    </section>
  );
}
