import { useState } from "react";
import type { RelationDeclaration } from "../../domain/repository";
import { currentRelations, validateRelationDeclaration } from "../../application/relations";

type Draft = Omit<RelationDeclaration, "version" | "declaredAt">;

interface RelationTablePanelProps {
  history: ReadonlyArray<RelationDeclaration>;
  onDeclare: (relation: Draft) => void;
}

const STATUS_LABEL = { propuesta: "Propuesta", validada: "Validada" } as const;

/**
 * Tabla de relaciones determinante-problema (CONTRACT-LHPM v1.7, Arts. 8 bis y 8 ter 2).
 * La declara y la valida una persona del equipo técnico; cada cambio es una versión
 * nueva con autoría y fecha. Solo una relación validada de grado 1 o 2 puede sostener
 * una orientación.
 */
export function RelationTablePanel({ history, onDeclare }: RelationTablePanelProps) {
  const current = currentRelations(history);
  const [author, setAuthor] = useState("");
  const [id, setId] = useState("");
  const [determinant, setDeterminant] = useState("");
  const [detEvidence, setDetEvidence] = useState("");
  const [problem, setProblem] = useState("");
  const [probEvidence, setProbEvidence] = useState("");
  const [grade, setGrade] = useState<"1" | "2" | "3">("3");
  const [basis, setBasis] = useState("");
  const [source, setSource] = useState({ title: "", year: "", scale: "" });
  const [missing, setMissing] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const lines = (t: string) => t.split("\n").map((l) => l.trim()).filter((l) => l !== "");

  function submit(status: "propuesta" | "validada") {
    const draft: Draft = {
      id: id.trim(),
      determinant: { label: determinant.trim(), evidence: lines(detEvidence) },
      problem: { label: problem.trim(), evidence: lines(probEvidence) },
      grade: Number(grade) as 1 | 2 | 3,
      basis: basis.trim(),
      ...(grade === "2" ? { source: { title: source.title.trim(), year: source.year.trim(), scale: source.scale.trim() } } : {}),
      ...(missing.trim() !== "" ? { missing: missing.trim() } : {}),
      status,
      declaredBy: author.trim(),
    };
    const found = validateRelationDeclaration(draft);
    setProblems(found);
    if (found.length === 0) onDeclare(draft);
  }

  function load(r: RelationDeclaration) {
    setId(r.id);
    setDeterminant(r.determinant.label);
    setDetEvidence(r.determinant.evidence.join("\n"));
    setProblem(r.problem.label);
    setProbEvidence(r.problem.evidence.join("\n"));
    setGrade(String(r.grade) as "1" | "2" | "3");
    setBasis(r.basis);
    setSource(r.source ?? { title: "", year: "", scale: "" });
    setMissing(r.missing ?? "");
  }

  return (
    <section className="workspace-panel" aria-labelledby="relation-table-title">
      <h2 id="relation-table-title">Tabla de relaciones determinante-problema</h2>
      <p>
        La declara y la valida una persona del equipo técnico; cada cambio es una versión nueva con su
        autoría y fecha. El grado 1 exige evidencia local de ambos extremos; el grado 2, una fuente externa
        verificable con título, año y escala; el grado 3 es plausible y no sostiene recomendaciones de tipo «Abordar». Solo una
        relación validada de grado 1 o 2 puede sostener una orientación.
      </p>
      {current.length === 0 ? <p>No hay relaciones declaradas.</p> : (
        <ul className="document-list">
          {current.map((r) => (
            <li key={r.id} className="document-row">
              <div>
                <p className="document-kind">
                  {r.id} · versión {r.version} · {STATUS_LABEL[r.status]} · grado {r.grade} · {r.declaredBy} ·{" "}
                  {r.declaredAt.slice(0, 10)}
                </p>
                <p>{r.determinant.label} → {r.problem.label}</p>
                <p>Razón del grado: {r.basis}</p>
                {r.source !== undefined && <p>Fuente: {r.source.title} ({r.source.year}; {r.source.scale})</p>}
                {r.missing !== undefined && <p>Falta: {r.missing}</p>}
              </div>
              <div className="doc-repo__actions">
                <button type="button" onClick={() => load(r)}>Cargar en el formulario</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label>Identificador (p. ej. R1)<input type="text" value={id} onChange={(e) => setId(e.target.value)} /></label>
      <label>Determinante<input type="text" value={determinant} onChange={(e) => setDeterminant(e.target.value)} /></label>
      <label>Evidencia del determinante (una por línea)<textarea rows={2} value={detEvidence} onChange={(e) => setDetEvidence(e.target.value)} /></label>
      <label>Problema de salud<input type="text" value={problem} onChange={(e) => setProblem(e.target.value)} /></label>
      <label>Evidencia del problema (una por línea)<textarea rows={2} value={probEvidence} onChange={(e) => setProbEvidence(e.target.value)} /></label>
      <label>Grado de sustento
        <select value={grade} onChange={(e) => setGrade(e.target.value as "1" | "2" | "3")}>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select>
      </label>
      <label>Razón del grado<textarea rows={2} value={basis} onChange={(e) => setBasis(e.target.value)} /></label>
      {grade === "2" && (
        <>
          <label>Fuente (título)<input type="text" value={source.title} onChange={(e) => setSource({ ...source, title: e.target.value })} /></label>
          <label>Fuente (año)<input type="text" value={source.year} onChange={(e) => setSource({ ...source, year: e.target.value })} /></label>
          <label>Fuente (escala)<input type="text" value={source.scale} onChange={(e) => setSource({ ...source, scale: e.target.value })} /></label>
        </>
      )}
      <label>Lo que falta (opcional)<textarea rows={2} value={missing} onChange={(e) => setMissing(e.target.value)} /></label>
      <label>Autoría<input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
      {problems.map((m) => <p key={m} role="alert">{m}</p>)}
      <button type="button" onClick={() => submit("propuesta")}>Declarar como propuesta</button>
      <button type="button" onClick={() => submit("validada")}>Declarar y validar</button>
    </section>
  );
}
