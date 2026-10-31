import type { MunicipalDocumentRepository } from "../../domain/repository";

type Props = { repository: MunicipalDocumentRepository; evidenceCount: number; studiesLoaded: number; totalStudies: number };

export function TerritorialDocumentControl({ repository, evidenceCount, studiesLoaded, totalStudies }: Props) {
  const docs = repository.documents;
  const active = docs.filter(d => d.status !== "archived" && d.status !== "rejected");
  const historical = active.filter(d => d.temporal?.declaration?.scope === "historical" || d.cycle?.status === "historical").length;
  const withoutCycle = active.filter(d => !d.cycle && !d.temporal).length;
  const unvalidated = active.filter(d => d.status !== "validated").length;
  const byKind = Array.from(new Set(active.map(d => d.kind))).map(kind => ({kind,count:active.filter(d => d.kind === kind).length}));
  const gaps = [
    ...(active.some(d => d.kind === "health-report") ? [] : ["Informe de Salud sin ficha documental"]),
    ...(studiesLoaded ? [] : ["No hay estudios complementarios incorporados"]),
    ...(withoutCycle ? [`${withoutCycle} fuentes sin declaración temporal`] : []),
    ...(unvalidated ? [`${unvalidated} fuentes pendientes de validación documental`] : []),
  ];
  return <section className="workspace-panel territorial-document-control" aria-label="Panel de control documental">
    <div className="panel-header"><div><p className="eyebrow">Sala de control · Diagnóstico territorial</p><h2>Situación documental y evidencias</h2></div>
    <p className="panel-note">Lectura del expediente actual; no altera fuentes, criterios ni validaciones.</p></div>
    <div className="territorial-document-control__metrics">
      <div><strong>{active.length}</strong><span>Documentos activos</span></div>
      <div><strong>{evidenceCount}</strong><span>Evidencias registradas</span></div>
      <div><strong>{studiesLoaded}/{totalStudies}</strong><span>Estudios incorporados</span></div>
      <div><strong>{historical}</strong><span>Fuentes históricas declaradas</span></div>
    </div>
    <div className="territorial-document-control__detail">
      <div><h3>Fuentes por categoría</h3>{byKind.length ? <ul>{byKind.map(row=><li key={row.kind}><span>{row.kind}</span><strong>{row.count}</strong></li>)}</ul>:<p className="panel-note">No constan documentos en el repositorio.</p>}</div>
      <div><h3>Aspectos por revisar</h3>{gaps.length ? <ul>{gaps.map(gap=><li key={gap}>{gap}</li>)}</ul>:<p className="panel-note">No se detectan pendientes en estas comprobaciones básicas. Esto no acredita suficiencia metodológica.</p>}
      <p className="panel-note">Los indicadores cuentan registros, no certifican la actualidad ni calidad de su contenido.</p></div>
    </div>
  </section>;
}
