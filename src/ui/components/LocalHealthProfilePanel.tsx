export function LocalHealthProfilePanel() {
  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Síntesis diagnóstica municipal</p>
          <h2>Perfil de Salud Local</h2>
        </div>
        <p className="panel-note">
          El Perfil de Salud Local (PSL) es el activo canónico, persistente y
          versionado que COMPÁS genera a partir de toda la evidencia disponible
          del municipio. Fundamenta la priorización y el Plan Local de Salud sin
          sustituir los documentos fuente originales.
        </p>
      </div>

      <div className="psl-status-row">
        <span className="status-pill status-pill--empty">No generado todavía</span>
        <span className="psl-status-note">
          Disponible cuando se haya incorporado evidencia y ejecutado el análisis
          territorial completo.
        </span>
      </div>

      <p className="inv-section-label">Características del Perfil de Salud Local</p>
      <div className="psl-feature-grid">
        <div className="psl-feature">
          <p className="psl-feature__title">Activo canónico del municipio</p>
          <p className="psl-feature__desc">
            Representa el conocimiento oficial del municipio sobre su situación de
            salud en un momento dado. No es un informe narrativo ni un PDF: es un
            objeto de dominio generado y gestionado por COMPÁS.
          </p>
        </div>
        <div className="psl-feature">
          <p className="psl-feature__title">Trazable hasta la fuente</p>
          <p className="psl-feature__desc">
            Cada elemento del PSL se rastrea hasta los EvidenceAtom que lo
            soportan y, desde ahí, hasta el documento fuente original. Sin
            trazabilidad completa, el PSL no puede validarse.
          </p>
        </div>
        <div className="psl-feature">
          <p className="psl-feature__title">Versionado y acumulativo</p>
          <p className="psl-feature__desc">
            Cada versión del PSL queda registrada. Las versiones anteriores se
            conservan para trazabilidad histórica. El PSL nunca destruye una
            versión anterior: la archiva o la marca como sustituida.
          </p>
        </div>
        <div className="psl-feature">
          <p className="psl-feature__title">Validación humana obligatoria</p>
          <p className="psl-feature__desc">
            El sistema genera el PSL automáticamente en estado de borrador. Solo
            el técnico responsable puede validarlo. COMPÁS nunca auto-valida
            un PSL ni lo convierte en canónico sin intervención explícita.
          </p>
        </div>
        <div className="psl-feature">
          <p className="psl-feature__title">No sustituye al Informe de Salud</p>
          <p className="psl-feature__desc">
            El Informe de Salud y los documentos fuente se preservan íntegros
            en el repositorio. El PSL los referencia por identificador: nunca los
            reemplaza ni los resume en su lugar.
          </p>
        </div>
        <div className="psl-feature">
          <p className="psl-feature__title">Fundamenta la priorización</p>
          <p className="psl-feature__desc">
            La priorización canónica del Plan Local de Salud opera sobre un PSL
            validado. Sin PSL validado, la priorización tiene carácter
            exploratorio y se marca explícitamente como tal.
          </p>
        </div>
      </div>
    </section>
  );
}
