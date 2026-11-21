import { STRATEGIC_REFERENCES } from "../../application/strategic-reference-library";
import { documentAccessUrl } from "./documentAccessUtils";

/** Marco estratégico común: los mismos documentos en todos los expedientes.
 * No se atribuye al municipio ni se cuenta como evidencia del diagnóstico. */
export function CommonStrategicFramework() {
  return (
    <div className="csf">
      <p className="panel-note">Referencias comunes a todos los ámbitos. No pertenecen a ningún municipio ni se cuentan como evidencia de salud local; de ellas proceden objetivos e indicadores del Plan de Acción. Su presencia no certifica vigencia ni aplicación institucional.</p>
      <ul className="csf__list">
        {STRATEGIC_REFERENCES.map(item => {
          const local = item.sourcePath ? documentAccessUrl(item.sourcePath) : undefined;
          const href = local ?? item.url;
          return (
            <li key={item.id} className="csf__item">
              <span className="csf__text">
                <strong>{item.title}</strong>
                <small>{item.shortName} · {item.issuer} · {item.period}</small>
              </span>
              {href
                ? <a href={href} target="_blank" rel="noopener noreferrer">{local ? "Abrir PDF conservado" : "Abrir en la sede oficial"}</a>
                : <span>Archivo no accesible</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
