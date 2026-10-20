# CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT

> COMPÁS NG — Contrato del Plan Local de Salud como Documento Institucional
> Sprint 2.2 — 2026-06-28
> Estado: VIGENTE
>
> Reconciliación de estado — 2026-09-23:
> `CONTRACT-LOCAL-HEALTH-PLAN-COMPILER`, `CONTRACT-INSTITUTIONAL-LIFECYCLE`
> y `CONTRACT-MTE` ya existen. Este contrato conserva la definición
> estructural del PLS; las referencias antiguas a contratos pendientes se leen
> como deuda histórica salvo donde se actualizan expresamente.
>
> Revisión — 2026-09-25: se formaliza `LocalHealthPlanOutline` como proyección
> evolutiva previa al documento institucional, consultable antes de registrar
> actuaciones.

---

## 1. Naturaleza del Plan Local de Salud

El **Plan Local de Salud** (PLS) es el instrumento institucional mediante el cual un municipio formaliza compromisos explícitos y verificables para mejorar la salud de su población en un período definido.

Tres propiedades lo definen (METHODOLOGICAL-FOUNDATIONS §I.1):

- **Compromiso:** no es un estudio, ni una declaración de intenciones, ni un análisis. Vincula a sus firmantes.
- **Explícito:** cada objetivo, actuación, indicador y responsable están nombrados con suficiente precisión para poder evaluarse.
- **Verificable:** el plan define desde su origen los criterios con los que juzgará su propio cumplimiento.

Un Plan Local de Salud que no puede evaluarse es una declaración, no un plan.

---

## 2. Distinción fundamental entre objetos del sistema

Esta distinción es el fundamento del contrato. Ninguno de estos objetos puede sustituir a otro:

| Objeto | Naturaleza | Nivel | Mutabilidad | Responsable |
|---|---|---|---|---|
| `LocalHealthProfile` (PSL) | Objeto vivo del sistema | Nivel 2 | Mutable (se regenera cuando cambia la evidencia) | Sistema + Equipo técnico |
| `LocalHealthProfileArtifact` (PSL-C) | Instantánea congelada del PSL | Compilador | Inmutable tras compilación | `LocalHealthProfileCompiler` |
| `ActionPlanDraft` | Borrador técnico del Nivel 3 | Nivel 3 | Mutable hasta validación formal | Sistema + Equipo técnico |
| `AgendaDraft` | Borrador técnico del Nivel 3 | Nivel 3 | Mutable hasta validación formal | Sistema + Equipo técnico |
| `MonitoringDraft` | Borrador técnico del Nivel 3 | Nivel 3 | Mutable hasta validación formal | Sistema + Equipo técnico |
| `LocalHealthPlanOutline` | Esbozo evolutivo y no institucional del PLS | Proyección | Mutable; se recalcula con el expediente | Sistema + Equipo técnico |
| **Plan Local de Salud** (`LocalHealthPlanDocument`) | Documento institucional definitivo | Compilador | Inmutable tras compilación y aprobación | `LocalHealthPlanCompiler` + Corporación municipal |

El PLS no es el PSL. El PLS no es el PSL-C aislado. El PLS no es el Plan de Acción. El PLS no es la Agenda. El PLS no es la salida automática del sistema.

### 2.1 Esbozo evolutivo del Plan Local de Salud

`LocalHealthPlanOutline` es una proyección de trabajo que permite leer la forma
que va adquiriendo el futuro PLS antes de disponer de todas las actuaciones.
No es un `LocalHealthPlanDocument`, no constituye un compromiso institucional,
no se valida como Plan de Acción y no recibe versión PLS/vN.

El esbozo puede generarse desde que existe un Perfil de Salud Local y se
actualiza conforme el expediente incorpora priorización, líneas, objetivos,
indicadores, actuaciones, agenda y evaluación. La ausencia de actuaciones no
bloquea su consulta.

Debe mostrar, como mínimo:

- identidad territorial y período de planificación propuesto;
- estado del Perfil y disponibilidad del PSL-C;
- Informe de Salud de referencia, dejando claro que es una fuente;
- prioridades disponibles, si existen;
- arquitectura estratégica seleccionada: líneas, objetivos generales,
  objetivos específicos e indicadores;
- secciones pendientes, entre ellas actuaciones, agenda, seguimiento,
  evaluación y aprobación.

Las actuaciones, fichas, responsables, plazos y recursos son opcionales en el
esbozo. Pasan a ser obligatorios al solicitar la compilación del
`LocalHealthPlanDocument`, en la sección VIII (no en el Plan de Acción).

**Invariantes del esbozo:**

- `status === "evolving-outline"`;
- `isCongealed === false`;
- `isInstitutionalDocument === false`;
- no admite aprobación institucional;
- no satisface ninguno de los gates G-PLS por su mera existencia;
- debe diferenciar visualmente contenido disponible y contenido pendiente.

---

## 3. Estructura documental canónica

El PLS es un único documento que integra todas las etapas del proceso de planificación en una secuencia coherente. Las secciones se ordenan para que cualquier lector —técnico, político o ciudadano— pueda seguir la lógica argumental del diagnóstico hasta los compromisos.

### 3.1 Tabla de secciones

| § | Sección | Obligatoria | Naturaleza del contenido |
|---|---|---|---|
| RE | **Resumen Ejecutivo** | Sí | Compilada por el sistema a partir de datos del PLS; revisable y completable por el equipo. No puede ser el único documento que se entregue. |
| I | **Portada institucional** | Sí | Compilada: municipio, período, fecha de compilación, versión, aprobación. |
| II | **Marco institucional de referencia** | Sí | Compilado desde el PSL Cap. I y el StrategicRepository (futuro). Marcos RELAS, ESCA, EPVSA, PSMA y otros aplicables. |
| III | **Contexto territorial** | Sí | Compilado desde metadatos del workspace: municipio, provincia, población, estructura. |
| IV | **Diagnóstico territorial — referencia al PSL-C** | Sí | El PLS no reproduce el diagnóstico; incluye o referencia el PSL-C compilado como capítulo propio. El PSL-C es la parte diagnóstica del PLS. |
| V | **Priorización** | Sí | Candidaturas técnicas (sistema), priorización ciudadana (proceso participativo), deliberación y consenso del Grupo Motor (humano), prioridades seleccionadas. Incluye obligatoriamente las necesidades identificadas pero no priorizadas, con justificación. |
| VI | **Articulación institucional** | Sí; canónica cuando consume `LecturaEstrategicaLocal` del MTE / provisional si usa un fallback EPVSA anterior | Correspondencias entre prioridades y marcos estratégicos (EPVSA, ESCA, RELAS, PEM, PSMA). Distinción entre actuaciones SSPA-garantizadas y actuaciones municipales nuevas. |
| VII | **Plan de Acción** | Sí | Líneas estratégicas, objetivos (general y específico) e indicadores con definición de medición, tiempo cero y meta. No contiene actuaciones (ver §3.1 bis). Validado por el Grupo Motor. |
| VIII | **Actuaciones y agenda de implementación** | Sí | Actuaciones registradas por entornos (sanitario, comunitario, educativo, laboral), con responsables nominados, plazos reales y recursos asignados, y su distribución temporal validada por ciclos municipales reales, no la trimestrización orientativa del sistema. Instrumento separado del Plan de Acción (`CONTRACT-AGENDA-ACTUATIONS`). |
| IX | **Marco de seguimiento** | Sí | Ítems de seguimiento con estados iniciales, responsable de medición, periodicidad y umbral de alerta. Marco de evaluación: preguntas de evaluación, momentos de medición, responsable. |
| X | **Marco de gobernanza** | Sí | Composición del Grupo Motor, Mesa de participación ciudadana, Comisión de seguimiento. Periodicidad de sesiones, resolución de conflictos, comunicación pública. |
| XI | **Memoria del proceso** | Condicional | Registro narrativo del proceso participativo: quién participó, qué se discutió, cómo se alcanzaron los acuerdos. Responsabilidad humana exclusiva. El sistema puede albergar sus documentos en el Repositorio Documental. No compilada por el sistema. |
| XII | **Anexos metodológicos** | Condicional | Fichas de indicadores completas, notas metodológicas, tabla de estudios complementarios utilizados, advertencias de integridad del EvidenceStore. Compilados desde los metadatos del PSL y del EvidenceStore. |
| AN | **Nota de aprobación institucional** | Sí | Fecha de aprobación, órgano que la aprueba (pleno, junta de gobierno, otro), acta o referencia al acta. Acto humano externo al sistema. COMPÁS NG registra la aprobación; no la produce. |

### 3.1 bis Plan de Acción y actuaciones: dos instrumentos — actualización autorizada 2026-10-19

El Plan de Acción es la planificación estratégica territorial: líneas estratégicas, objetivos e indicadores con su definición de medición. Las actuaciones (programas, talleres, charlas, caminatas…) y las agendas anuales son el instrumento de ejecución y se registran en la agenda, separada del Plan de Acción. Las actuaciones alimentan el resultado del indicador, pero no se sabe en qué medida contribuye cada una: el resultado se consolida por indicador y no se atribuye a actuaciones concretas. Este criterio difiere del de la guía rápida de planes locales de salud de la Junta de Andalucía (2014), que sitúa acciones y agendas anuales dentro del Plan de Acción.

Sin pérdida de funcionalidad: las fichas de actuación de cada indicador (`WorksheetAction`: actividades, entregas de datos, descarga Word) siguen funcionando. En el documento compilado (`compileInitialLocalHealthPlan`) y en la exportación, el Plan de Acción (`planActionParagraphs`) no incluye actuaciones; estas se agrupan en la sección «Actuaciones y agenda de implementación» (`planActuationParagraphs`). El gate G-PLS-5 no cambia.

### 3.2 Resumen Ejecutivo — posición y naturaleza

El Resumen Ejecutivo es la primera sección del PLS, no un documento independiente. Esta decisión está justificada metodológicamente: el Resumen Ejecutivo sin el PLS completo no permite la auditoría, y el lector político necesita poder consultar la fuente antes de tomar decisiones. El `LocalHealthPlanCompiler` lo genera como sección inicial y el sistema puede exportarlo de forma independiente, pero siempre como derivado del PLS completo.

### 3.3 La referencia al PSL-C como capítulo diagnóstico

El PLS no reproduce el contenido del PSL-C: lo integra o referencia. Hay dos opciones implementables:

- **Opción A (recomendada):** El PSL-C compilado se incluye como Capítulo IV del PLS mediante referencia a `sourcePSLId` y `sourcePSLVersion`. El `LocalHealthPlanCompiler` verifica que el PSL-C existente es coherente con el PSL aprobado (mismo `sourcePSLId`). No duplica el diagnóstico: lo enlaza.
- **Opción B:** El PSL-C se incluye físicamente como documento adjunto al PLS. Solo viable en formato DOCX o PDF; complica la trazabilidad digital.

`CONTRACT-LOCAL-HEALTH-PLAN-COMPILER` resuelve esta decisión a favor de la **Opción A**: integración del PSL-C por referencia. La Opción B queda como posibilidad técnica para exportadores DOCX/PDF si un requisito externo exige adjuntar físicamente el diagnóstico.

---

## 4. Entradas del `LocalHealthPlanCompiler`

### 4.1 Entradas obligatorias

| Entrada | Tipo | Condición verificable |
|---|---|---|
| PSL en estado `"approved"` | `LocalHealthProfile` | `psl.status === "approved"` |
| PSL-C compilado coherente | `LocalHealthProfileArtifact` | `pslc.sourcePSLId === psl.id` |
| Deliberación documentada | `psl.priorizacion.consensoDocumentado === true` | `priorizacionStatus === "complete"` |
| ActionPlanDraft validado formalmente | `ActionPlanDraft` + `FormalValidationRecord` vigente | Gate G-PLS-5; el registro externo se define en `CONTRACT-INSTITUTIONAL-LIFECYCLE` |
| AgendaDraft validada formalmente | `AgendaDraft` + `FormalValidationRecord` vigente | Gate G-PLS-6; el registro externo se define en `CONTRACT-INSTITUTIONAL-LIFECYCLE` |
| MonitoringDraft con marco de evaluación | `MonitoringDraft` | `monitoring.evaluationFramework` definido |
| Aprobación institucional registrada | Metadatos | `approvedAt`, `approvedBy`, `approvingBody` |
| Período de planificación | Metadatos | `planningPeriod: { start: string; end: string }` |
| Necesidades no priorizadas documentadas | Objeto formal | `unaddressedNeeds[]` con `justification` por ítem (campo pendiente de añadir al `ActionPlanDraft`) |

### 4.2 Entradas condicionales

| Entrada | Tipo | Cuándo es obligatoria |
|---|---|---|
| `LecturaEstrategicaLocal` | MTE canónico | Obligatoria cuando el PLS integre articulación institucional canónica; cualquier fallback EPVSA debe marcarse como provisional |
| Memoria del proceso | Documentos en el repositorio | Obligatoria si el marco RELAS lo exige; en caso contrario, opcional |
| Datos de referencia territorial | Fuentes externas | Obligatorios si el PSL-NHS se incluye en los anexos |

### 4.3 Lo que el compilador NO consume

El `LocalHealthPlanCompiler` **no** accede a:
- `EvidenceStore` directamente
- `MunicipalDocumentRepository` directamente (solo vía campos ya sintetizados en el PSL y el PSL-C)
- Ningún motor del Nivel 2 (MIT, LT1, OIT, Reconciliación)
- Ninguna fuente de datos externa no registrada en el workspace

---

## 5. Gates de compilación

Los siguientes gates deben cumplirse **todos** antes de que el `LocalHealthPlanCompiler` pueda activarse. Son condiciones previas, no recomendaciones.

| Gate | Código | Condición | Estado de implementación |
|---|---|---|---|
| PSL aprobado | G-PLS-1 | `psl.status === "approved"` | Implementado por `CONTRACT-INSTITUTIONAL-LIFECYCLE` (`approvePSL`, `handleApprovePSL`, `PSLApprovalRecord`) |
| PSL-C coherente con PSL | G-PLS-2 | Existe `LocalHealthProfileArtifact` con `sourcePSLId === psl.id` | Implementado en Sprint 2.1 |
| Deliberación documentada | G-PLS-3 | `psl.priorizacion.consensoDocumentado === true && psl.priorizacionStatus === "complete"` | Implementado |
| Capítulos V y VI del PSL en estado `authored` | G-PLS-4 | `psl.conclusiones.status === "authored" && psl.recomendaciones.status === "authored"` | Implementado |
| Plan de Acción formalmente validado | G-PLS-5 | `FormalValidationRecord` vigente para `target: "action-plan"` | Mecanismo implementado; consumo por el futuro compilador pendiente |
| Agenda formalmente validada | G-PLS-6 | `FormalValidationRecord` vigente para `target: "agenda"` | Mecanismo implementado; consumo por el futuro compilador pendiente |
| Necesidades no priorizadas documentadas | G-PLS-7 | `unaddressedNeeds[]` presentes y con `justification` (aunque sea "ninguna necesidad identificada quedó fuera") | Sin implementación activa |
| Aprobación institucional registrada | G-PLS-8 | `approvedAt`, `approvedBy`, `approvingBody` presentes | Sin implementación activa |
| PSL no obsoleto | G-PLS-9 | `pslIsStale === false` (equivalente al G-C7 del CONTRACT-COMPILER) | Implementado en el runtime |
| Marco de evaluación definido | G-PLS-10 | Preguntas de evaluación, momentos de medición y responsable de evaluación presentes en `MonitoringDraft` | Sin implementación activa |

**El gate G-PLS-1 sigue siendo crítico, pero ya no está pendiente de contrato.** La transición `validated → approved` y su actor model están gobernados por `CONTRACT-INSTITUTIONAL-LIFECYCLE`. Lo pendiente para el PLS es consumir ese estado junto con los demás gates en un `LocalHealthPlanCompiler` operativo.

---

## 6. Contenido humano obligatorio

El sistema **nunca puede generar automáticamente** los siguientes elementos:

| Elemento | Razón metodológica |
|---|---|
| **Validación política del PLS** (aprobación por la corporación municipal) | La aprobación es un acto institucional con consecuencias políticas y legales. No puede ser un clic de confirmación del equipo técnico. |
| **Compromisos institucionales definitivos** (responsables nominados, plazos comprometidos, recursos asignados) | Los compromisos institucionales requieren el acuerdo explícito de las personas e instituciones que los asumen. |
| **Responsables nominados** (persona + cargo concretos, no "el Ayuntamiento") | Sin responsable nominal, el ítem de seguimiento no tiene accountability (PM-8 invariante). |
| **Plazos reales** (integrados en ciclos municipales reales, no la trimestrización orientativa del sistema) | Los plazos dependen de la capacidad real del municipio, del calendario municipal y de los compromisos intersectoriales. |
| **Recursos asignados** (presupuesto, personal, equipamiento) | La asignación de recursos es una decisión política del Ayuntamiento y de los socios institucionales. |
| **Justificación de necesidades no priorizadas** | La transparencia sobre lo que no se aborda es parte de la rendición de cuentas. La justificación es un acto deliberativo. |
| **Deliberación y consenso del Grupo Motor** (Cap. V del PSL, Cap. V del PLS) | La deliberación no puede simularse ni sustituirse. |
| **Texto de conclusiones y recomendaciones** (Caps. V y VI del PSL, que forman parte del PLS vía PSL-C) | Ya garantizado por CONTRACT-MIT-PSL y CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER. |
| **Memoria del proceso participativo** | Registro narrativo de quién participó, qué se discutió y cómo se alcanzaron los acuerdos. |
| **Preguntas de evaluación** | Las preguntas de evaluación deben formularlas los actores del proceso, no el sistema, para que reflejen lo que el municipio quiere saber. |

---

## 7. Congelación y versionado

### 7.1 Cuándo queda congelado el PLS

Un `LocalHealthPlanDocument` queda congelado en el momento en que el compilador produce el artefacto. La congelación es irrevocable: el documento compilado nunca puede modificarse. Si el plan cambia, debe abrirse un nuevo ciclo formal de planificación.

El campo `isCongealed: true` es un literal type invariante, análogo al del `LocalHealthProfileArtifact`.

### 7.2 Versiones por municipio

Puede haber múltiples `LocalHealthPlanDocument` por municipio:
- Cada ciclo de planificación produce uno nuevo.
- El anterior queda en estado `superseded` (marcado en UI) pero no se elimina.
- El historial es acumulativo. La persistencia es análoga a `compiledProfiles` en el workspace: `compiledPlans?: LocalHealthPlanDocument[]`.

### 7.3 Relación entre versión del PLS y versión del PSL-C

Cada `LocalHealthPlanDocument` referencia:
- `sourcePSLId` — el ID del `LocalHealthProfile` aprobado que lo originó.
- `sourcePSLCArtifactId` — el ID del `LocalHealthProfileArtifact` incluido como capítulo diagnóstico.
- `sourcePSLCHash` — el `sourceHash` del PSL-C, para verificar integridad posterior.

Esta trazabilidad permite verificar que el diagnóstico del PLS es el mismo que fue presentado al Grupo Motor y aprobado institucionalmente.

### 7.4 Qué ocurre si cambia la evidencia después de compilar

Si el EvidenceStore cambia después de que el PLS esté compilado:
- El PSL vivo (`LocalHealthProfile` en estado `generated`) reflejará los nuevos datos.
- El PLS compilado **no cambia**. Es una instantánea histórica del estado del conocimiento en el momento de la aprobación.
- Si los cambios en la evidencia son suficientemente relevantes, el Grupo Motor puede decidir iniciar un nuevo ciclo de diagnóstico y planificación.
- La decisión de reabrir el ciclo es humana, no automática.

---

## 8. Exclusiones

Este contrato establece que el PLS **no es**:

| Lo que el PLS no es | Lo que sí es |
|---|---|
| El PSL vivo (`LocalHealthProfile`) | El PSL es el objeto analítico del Nivel 2; el PLS es el documento institucional del ciclo completo |
| El PSL-C aislado | El PSL-C es solo el capítulo diagnóstico del PLS; no es el plan |
| Un `ActionPlanDraft` | El ActionPlanDraft es un borrador técnico; el Plan de Acción del PLS es el capítulo VII validado e integrado en el documento institucional |
| Un `AgendaDraft` | La AgendaDraft es un borrador técnico; la Agenda del PLS es el capítulo VIII validado |
| Un `MonitoringDraft` | El MonitoringDraft es un borrador técnico; el Marco de Seguimiento del PLS es el capítulo IX validado |
| Una salida automática del sistema | El sistema asiste; los actores institucionales aprueban |
| Un documento editable después de compilado | El PLS compilado es inmutable. La corrección requiere un nuevo ciclo |
| Una decisión automática de COMPÁS NG | COMPÁS NG produce la propuesta técnica; el Grupo Motor y la corporación municipal deciden |
| El Informe de Salud | El Informe de Salud lo elabora el Distrito Sanitario; el PLS lo referencia en el PSL-C |
| El sistema sanitario del municipio | Los servicios del SSPA son externos al PLS; el PLS puede referenciarlos como activos o capacidades institucionales |
| Un documento eterno | Tiene vigencia definida (período de planificación); expira y genera el siguiente ciclo |

---

## 9. Invariantes

**I-PLS-1 — El PLS no es el PSL ni lo sustituye**
El Plan Local de Salud y el Perfil de Salud Local son objetos distintos con finalidades distintas. El PLS contiene o referencia el PSL-C; no lo duplica ni lo reemplaza.

**I-PLS-2 — El PLS requiere PSL aprobado, no solo validado**
El estado `"validated"` del PSL habilita el Nivel 3 y el PSL-C. El estado `"approved"` —condición política e institucional superior— es el gate del `LocalHealthPlanCompiler`.

**I-PLS-3 — El Plan de Acción del PLS no es el ActionPlanDraft**
El `ActionPlanDraft` del sistema es un borrador técnico orientativo. El capítulo VII (Plan de Acción) del PLS es el plan validado, con responsables nominados, plazos reales e indicadores con tiempo cero. Son objetos en niveles distintos del proceso.

**I-PLS-4 — El PLS incluye necesidades no priorizadas**
Un PLS metodológicamente completo documenta qué necesidades fueron identificadas pero no seleccionadas, con justificación explícita. Un PLS sin este objeto es metodológicamente deficiente (METHODOLOGICAL-FOUNDATIONS PM-10 equivalente).

**I-PLS-5 — La aprobación institucional es un acto humano externo al sistema**
COMPÁS NG registra la fecha, el órgano y la referencia al acta de aprobación. No puede aprobar el PLS que produce.

**I-PLS-6 — El PLS compilado no modifica el workspace**
La compilación del PLS es una operación de lectura de los objetos validados del workspace seguida de producción de un artefacto exportable. No escribe en el EvidenceStore, no modifica el PSL, no altera los borradores técnicos.

**I-PLS-7 — La trazabilidad del PLS llega hasta el EvidenceStore**
Todo compromiso del Plan de Acción debe poder rastrearse hasta su origen en la cadena: actuación → objetivo → prioridad → área de intervención → EvidenceAtom → documento fuente.

**I-PLS-8 — El PLS no incluye información técnica interna del pipeline**
Los nombres de tipos TypeScript, los IDs internos del sistema, los campos técnicos del EvidenceStore (como `stableAssetKey`), los resultados del MIT (LT1, OIT) ni las estructuras internas de los borradores técnicos aparecen en el PLS. La redacción es institucional, no técnica.

**I-PLS-9 — Las actuaciones SSPA-garantizadas se presentan como referencias, no como compromisos municipales**
Las actuaciones ya comprometidas por el SSPA a través de la ESCA no pueden presentarse como compromisos nuevos del municipio. El PLS las referencia como capacidades existentes y contextualiza la contribución municipal adicional.

---

## 10. Relación con el ciclo de evaluación

El PLS cierra el ciclo de planificación y abre el ciclo de evaluación. La evaluación (comparación indicadores baseline → fin de período) no está dentro del alcance del `LocalHealthPlanCompiler`. Es un stage distinto del pipeline (`evaluation`), también sin implementación activa.

Sin embargo, el PLS debe contener desde su compilación los elementos que harán posible la evaluación futura:
- Los indicadores con tiempo cero documentados.
- Las preguntas de evaluación formales.
- El período de evaluación definido.
- El responsable de evaluación asignado.

Un PLS sin estos elementos compromete la posibilidad de evaluar si el plan fue efectivo.

La evaluación final, cuando se produzca, genera `EvidenceAtom[]` de tipo `longitudinal-evidence` que retroalimentarán el EvidenceStore del siguiente ciclo diagnóstico (Hueco H-8, no diseñado todavía).

---

## 11. Prerequisitos vivos antes de implementar el `LocalHealthPlanCompiler`

Los siguientes elementos delimitan qué sigue bloqueando la implementación completa del `LocalHealthPlanCompiler` y qué deuda histórica ya está cerrada:

| Elemento | Estado | Qué desbloquea |
|---|---|---|
| Actor model del estado `approved` | ✅ Resuelto en `CONTRACT-INSTITUTIONAL-LIFECYCLE` | Gate G-PLS-1 |
| Validación formal de ActionPlanDraft y AgendaDraft | ✅ Resuelto como `FormalValidationRecord` en `CONTRACT-INSTITUTIONAL-LIFECYCLE` | Gates G-PLS-5 y G-PLS-6 |
| **CONTRACT-LOCAL-HEALTH-PLAN-COMPILER** | ✅ Vigente | Especificación técnica del compilador: tipos de entrada/salida, gates formales, versionado, persistencia y separación Renderer/Exporter |
| **UnaddressedNeed[] conectado al flujo de Plan de Acción** | ❌ Pendiente | Gate G-PLS-7 |
| **PLSEvaluationFramework / marco de evaluación operativo** | ❌ Pendiente | Gate G-PLS-10 |
| **CONTRACT-STRATEGIC-REPOSITORY** | CONCEPTUAL (Sprint 2) | StrategicRepository implementado como fuente del MTE, necesario para el Cap. VI (Articulación institucional) del PLS |
| **CONTRACT-MTE** | ✅ Vigente; integración en el PLS pendiente | Articulación institucional canónica que reemplaza cualquier fallback EPVSA |

---

## 12. Tipos TypeScript de referencia

Los tipos mínimos previstos por este contrato ya existen en `src/domain/health-plan/LocalHealthPlanDocument.ts`. El bloque siguiente se conserva como referencia contractual simplificada; la fuente viva de la forma completa es el tipo de dominio.

```typescript
// src/domain/health-plan/LocalHealthPlanDocument.ts

interface LocalHealthPlanDocument {
  // Identidad
  id: string;
  municipalityId: MunicipalityId;
  planVersion: string;             // PLS/v1, PLS/v2, …
  compiledAt: string;
  compiledBy?: string;

  // Período de planificación
  planningPeriod: {
    start: string;   // ISO date (año)
    end: string;     // ISO date (año)
  };

  // Trazabilidad
  sourcePSLId: string;
  sourcePSLCArtifactId: string;
  sourcePSLCHash: string;

  // Aprobación institucional
  approvedAt?: string;
  approvedBy?: string;
  approvingBody?: string;          // "Pleno municipal", "Junta de gobierno local"

  // Secciones (estructuradas según §3)
  // … (a especificar en CONTRACT-LOCAL-HEALTH-PLAN-COMPILER)

  // Invariante
  isCongealed: true;
}

// Objeto formal de necesidades no priorizadas (campo del ActionPlanDraft)
interface UnaddressedNeed {
  id: string;
  title: string;               // Necesidad identificada en el diagnóstico
  sourceAreaId?: string;       // ID del área de intervención del PSL de origen
  justification: string;       // Por qué no se prioriza en este ciclo
}
```

Estos tipos ya están implementados. La deuda restante no es crear el tipo, sino conectar inputs reales del Plan de Acción, necesidades no priorizadas, marco de evaluación y renderer/exporter del PLS.

---

## 13. Decisiones metodológicas tomadas

Las siguientes decisiones quedan fijadas por este contrato:

1. **El Plan de Acción, la Agenda y el Seguimiento son capítulos del PLS, no documentos independientes.** Los borradores técnicos (`ActionPlanDraft`, `AgendaDraft`, `MonitoringDraft`) son objetos internos del sistema; sus versiones validadas se integran en el PLS como capítulos VII, VIII y IX.

2. **El Resumen Ejecutivo es la sección inicial del PLS, no un documento independiente.** Puede exportarse de forma autónoma pero siempre como derivado del PLS completo.

3. **El PSL-C es el capítulo diagnóstico del PLS, no un documento ajeno.** El PLS integra o referencia el PSL-C; no reproduce el diagnóstico de forma independiente.

4. **Las necesidades no priorizadas son un objeto formal obligatorio del PLS.** Un PLS sin este objeto es metodológicamente incompleto.

5. **La Memoria del Proceso no es compilada por el sistema.** Es responsabilidad humana exclusiva. El sistema puede albergar sus documentos en el Repositorio Documental como evidencia endocualitativa.

6. **Las actuaciones SSPA-garantizadas se presentan como referencias, no como compromisos municipales.** La distinción ESCA-garantizado / municipio-nuevo es un requisito metodológico del PLS.

7. **La aprobación institucional es un acto externo al sistema.** COMPÁS NG registra la aprobación; no la produce.

8. **El marco de evaluación es obligatorio en el PLS.** Sin indicadores con tiempo cero, preguntas de evaluación y responsable de evaluación, la evaluación futura es imposible. El PLS que no puede evaluarse es una declaración.

---

## 14. Cuestiones que quedan fuera de este contrato

Las siguientes cuestiones no quedan resueltas por este contrato y deben abordarse en los contratos indicados:

| Cuestión | Contrato que la resolverá |
|---|---|
| Consumo de `FormalValidationRecord` por el compilador del PLS | Implementación del `LocalHealthPlanCompiler` |
| Conexión de `UnaddressedNeed[]` con el flujo real del Plan de Acción | Ampliación de dominio/UI del Plan de Acción |
| Marco de evaluación del PLS (`PLSEvaluationFramework`) | Definir tipo, UI y relación con indicadores/línea base |
| Formato de exportación del PLS (DOCX, PDF, HTML): cuál es el formato institucional coherente con los requisitos RELAS de la Consejería | Renderer/Exporter del PLS |
| Opción B para adjuntar físicamente el PSL-C, si un requisito externo la exige | Renderer/Exporter del PLS |
| Cuota de localStorage para el PLS compilado: exportar fuera del workspace o persistir | CONTRACT-LOCAL-HEALTH-PLAN-COMPILER |
| Integración de `LecturaEstrategicaLocal` en el Cap. VI del PLS | Implementación del `LocalHealthPlanCompiler` desde `CONTRACT-MTE` |
| Contenido y estructura del StrategicRepository para el Cap. VI del PLS | CONTRACT-STRATEGIC-REPOSITORY + CONTRACT-STRATEGIC-RESOURCE |
| Ciclo de evidencia longitudinal: cómo alimenta el EvidenceStore del ciclo siguiente | CONTRACT-EVIDENCE (ampliación, Hueco H-8) |
| Requisitos formales de la Junta de Andalucía para el PLS en el contexto RELAS | Decisión institucional externa, previa a CONTRACT-LOCAL-HEALTH-PLAN-COMPILER |

---

## 15. Relaciones con contratos existentes

| Contrato | Relación |
|---|---|
| `CONTRACT-MIT-PSL` | El PSL aprobado (gate G-PLS-1) es la entrada principal del compilador del PLS. |
| `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` | El PSL-C (sprint 2.1) es el capítulo diagnóstico del PLS (gate G-PLS-2). El PLS no puede compilarse sin un PSL-C coherente con el PSL aprobado. |
| `CONTRACT-INSTITUTIONAL-LIFECYCLE` | Define aprobación del PSL y validaciones formales del Nivel 3 (`FormalValidationRecord`) que habilitan gates G-PLS-1, G-PLS-5 y G-PLS-6. |
| `CONTRACT-DELIBERATIVE-PRIORITISATION` y `CONTRACT-ACTION-PLAN-CATALOG` | Definen la ruta vigente para selección/edición del Plan de Acción. El contrato legacy `CONTRACT-ACTION-PLAN` queda como reserva histórica y compatibilidad. |
| `CONTRACT-COMPILER` | Este contrato amplía y reemplaza funcionalmente al CONTRACT-COMPILER como especificación estructural del PLS. El CONTRACT-COMPILER queda como reserva arquitectónica histórica; los gates que define (G-C1 a G-C7) son precursores de los gates G-PLS-1 a G-PLS-10 de este contrato. |
| `CONTRACT-PERSISTENCE` | El PLS compilado no debe persistirse en localStorage (cuota). La exportación es descarga directa. La lista `compiledPlans` en el workspace almacena solo metadatos e identificadores. |
| `CONTRACT-EVIDENCE` | La trazabilidad del PLS llega hasta el EvidenceStore. Los `evidenceAtomIds` del PSL-C son la referencia de trazabilidad del capítulo diagnóstico del PLS. |
| `CONTRACT-MTE` | El Cap. VI (Articulación institucional) del PLS debe integrar la `LecturaEstrategicaLocal`. Cualquier fallback EPVSA anterior debe marcarse explícitamente como provisional. |
