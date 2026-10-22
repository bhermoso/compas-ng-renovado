import { useState } from "react";
import type { FigureInput } from "../../application/figures";
import { parseFigures } from "../../application/figures";
import type { FigureRecord } from "../../domain/repository";

interface FigureImportPanelProps {
  figures: ReadonlyArray<FigureRecord>;
  onImport: (figures: FigureInput[]) => void;
}

/**
 * Cifras con procedencia (CONTRACT-LHPM v1.7, Art. 8 ter, paso «describir»). Se importan
 * como una lista JSON de valores literales con año, territorio, escala y fuente. Si una
 * sola cifra no es admisible no se importa ninguna. Importar el mismo id sustituye la cifra.
 */
export function FigureImportPanel({ figures, onImport }: FigureImportPanelProps) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  function submit() {
    if (author.trim() === "") {
      setProblems(["Falta la autoría de la importación."]);
      setDone(null);
      return;
    }
    const r = parseFigures(text, author.trim());
    setProblems(r.problems);
    if (r.problems.length > 0) {
      setDone(null);
      return;
    }
    onImport(r.figures);
    setDone(`${r.figures.length} cifras importadas.`);
    setText("");
  }

  const byDimension = new Map<string, number>();
  for (const f of figures) byDimension.set(f.dimension ?? "sin dimensión", (byDimension.get(f.dimension ?? "sin dimensión") ?? 0) + 1);

  return (
    <section className="workspace-panel" aria-labelledby="figures-title">
      <h2 id="figures-title">Cifras con procedencia</h2>
      <p>
        Valores literales de una fuente, con año, territorio, escala y localización. No se redondean ni se
        aproximan: si el valor es aproximado, no se importa. Las de ámbito distinto del municipio se
        muestran rotuladas «referencia no local». Hay {figures.length} cifras en el expediente
        {figures.length > 0 ? ` (${[...byDimension.entries()].map(([d, n]) => `${d}: ${n}`).join("; ")})` : ""}.
      </p>
      <label>
        Lista de cifras (JSON)
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label>
        Autoría de la importación
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      {problems.map((m) => <p key={m} role="alert">{m}</p>)}
      {done !== null && <p role="status">{done}</p>}
      <button type="button" onClick={submit}>Importar cifras</button>
    </section>
  );
}
