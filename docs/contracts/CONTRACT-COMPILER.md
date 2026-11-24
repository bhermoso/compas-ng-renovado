# COMPÁS NG — Contrato del Compilador del Plan Local de Salud

> Documento normativo permanente.
> Define la posición arquitectónica, los gates obligatorios, los límites y
> los criterios de implementación futura del stage `compiler` en COMPÁS NG.
> Este stage está **declarado pero sin implementación activa en el runtime**.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-24

---

## 1. Propósito

El **Compilador del Plan Local de Salud** es el último stage del pipeline de
COMPÁS NG. Su función futura es ensamblar y exportar el Plan Local de Salud
de un municipio como documento institucional, a partir de los objetos
validados de los niveles anteriores del sistema.

El compilador no analiza evidencia, no genera propuestas ni produce
interpretaciones analíticas. Es un **motor de exportación documental**:
toma como entradas los productos ya validados por el equipo técnico y los
organiza en un artefacto exportable con estructura, formato y trazabilidad
verificables.

---

## 2. Estado actual: reserva arquitectónica

El stage `compiler` está declarado en el sistema pero **no tiene
implementación activa**:

- Existe como valor del tipo `PipelineStage`
  (`domain/pipeline/CompasPipeline.ts`).
- Tiene una etiqueta de visualización ("Compilador") en `PipelineTracePanel`.
- **No existe ningún motor, función ni clase** que lo ejecute en
  `MunicipalityRuntime`.
- **No aparece en la traza de ejecución** que el runtime genera en cada
  sesión.
- **No produce ningún output** en el pipeline actual.

El ROADMAP lo clasifica explícitamente fuera del alcance hasta nueva
decisión:

> «Compilador del Plan Local de Salud: producto documental compilado a
> partir del Plan de Acción validado. El Plan de Acción actual es un
> borrador técnico, no el PLS definitivo.»

Ninguna funcionalidad activa del sistema depende de este stage.

---

## 3. Distinción fundamental: Plan de Acción ≠ Plan Local de Salud compilado

Esta distinción es el fundamento del contrato. Son dos objetos distintos
en niveles distintos del sistema:

| Concepto | Naturaleza | Estado actual |
|---|---|---|
| `ActionPlanDraft` | Borrador técnico del Nivel 3. Objetivos, actuaciones e indicadores preliminares. Requiere validación humana | Implementado |
| Plan Local de Salud compilado | Documento institucional exportable. Producto del stage `compiler`. Requiere PSL aprobado y plan validado como gate | No implementado |

El Plan de Acción **no es** el Plan Local de Salud. El Plan Local de Salud
compilado es el producto documental final del proceso de planificación, que
integra el diagnóstico territorial (PSL), las decisiones de priorización,
las actuaciones validadas, la agenda y el seguimiento en un único artefacto
exportable.

---

## 4. Posición en el pipeline

```
Nivel 1: EvidenceStore (IntegrityGuard)
    └─▶ Nivel 2: MIT → Reconciliación → PSL
            └─▶ Nivel 3: Priorización → EPVSA → Plan de Acción → Agenda → Seguimiento
                    │
                    │   (gates obligatorios — véase §6)
                    │
                    ▼
            stage: compiler  ◄── RESERVA ARQUITECTÓNICA (sin implementación activa)
                    │
                    ▼
            Plan Local de Salud compilado
            (artefacto exportable institucional)
```

El compilador es el punto terminal del pipeline. Ningún motor posterior
consume su output dentro del sistema. Su salida está destinada a ser
exportada y preservada fuera de COMPÁS NG como documento institucional.

---

## 5. Entradas futuras mínimas

Antes de que el compilador pueda ejecutarse, deben existir y estar
validados los siguientes objetos:

### 5.1 PSL en estado `"approved"`

El ciclo de vida del `LocalHealthProfile` define el estado `"approved"` como
la condición de aprobación institucional del Perfil de Salud Local, posterior
a `"validated"`. Sus metadatos asociados son:
- `approvedAt: string` — fecha de aprobación.
- `approvedBy: string` — responsable institucional de la aprobación.
- Condición necesaria según el dominio: capítulo VII (`priorizacionStatus`)
  en estado `"complete"` (deliberación y consenso documentados).

**La transición `validated → approved` no tiene implementación activa en la
UI.** El tipo y los campos existen en `LocalHealthProfile`, pero ningún
handler en la capa de aplicación ejecuta esta transición actualmente.

### 5.2 Plan de Acción revisado técnicamente

El `ActionPlanDraft` generado por el Nivel 3, revisado por el equipo técnico
con responsables, calendarios y recursos asignados. El borrador técnico
producido automáticamente no es suficiente; se requiere validación explícita.

### 5.3 Agenda revisada

El `AgendaDraft` con distribución trimestral ajustada a ciclos municipales
reales, responsables concretos y condiciones de ejecución definidas.

### 5.4 Seguimiento inicial

El `MonitoringDraft` con el estado inicial de las actuaciones y los campos
requeridos completados por el equipo.

### 5.5 Fuentes trazables

El compilador debe poder acceder a la cadena de trazabilidad completa que
conecta cada elemento del Plan Local de Salud con su origen en el
`EvidenceStore` a través del PSL. Sin esta trazabilidad, el documento
compilado no puede afirmar que sus contenidos son verificables.

---

## 6. Gates obligatorios

Los siguientes gates deben cumplirse **todos** antes de que el stage
`compiler` pueda activarse. Son condiciones previas, no recomendaciones:

| Gate | Condición | Estado actual en el sistema |
|---|---|---|
| G-C1 | PSL en estado `"approved"` | Estado definido en el tipo; sin transición implementada en UI |
| G-C2 | `priorizacion.consensoDocumentado === true` | Implementado: `handleDocumentarDeliberacion` en App.tsx |
| G-C3 | `priorizacionStatus === "complete"` | Implementado: se activa al documentar el consenso |
| G-C4 | Capítulos V y VI del PSL en estado `"authored"` | Implementado: `PSLChapterEditor` en UI |
| G-C5 | Plan de Acción técnicamente revisado | Sin mecanismo de validación formal implementado |
| G-C6 | Agenda con responsables y calendarios reales asignados | Sin mecanismo de asignación implementado |
| G-C7 | El PSL no está obsoleto (`pslIsStale === false`) | Implementado: detectado en `MunicipalityRuntime` |

El gate G-C1 es el más crítico y actualmente el menos avanzado en
implementación. Los gates G-C5 y G-C6 requieren diseño previo de los
flujos de validación del Nivel 3. Hasta que exista ese mecanismo formal,
este gate bloquea cualquier activación del compiler.

---

## 7. Salidas futuras

### 7.1 Artefacto principal

El compilador producirá un único artefacto por ejecución:

```
Plan Local de Salud de [Nombre del municipio]
Período: [período de planificación, p. ej. 2027–2030]
```

### 7.2 Estructura mínima del artefacto

El Plan Local de Salud compilado debe incluir, como mínimo, los mismos
capítulos del PSL enriquecidos con los elementos del Nivel 3:

| Capítulo | Contenido | Origen |
|---|---|---|
| I | Marco Estratégico | PSL Cap. I + marcos registrados |
| II | Informe de Salud | PSL Cap. II (referencia al documento fuente) |
| III | Diagnóstico integrado | PSL Cap. III |
| IV | Interpretación territorial | PSL Cap. IV |
| V | Conclusiones | PSL Cap. V (texto de autoría humana) |
| VI | Recomendaciones | PSL Cap. VI (texto de autoría humana) |
| VII | Priorización y consenso | PSL Cap. VII + consenso documentado |
| VIII | Plan de Acción | Objetivos, actuaciones e indicadores revisados |
| IX | Agenda | Distribución temporal validada |
| X | Seguimiento | Ítems de seguimiento con estado inicial |

### 7.3 Formatos posibles

Los formatos de exportación a considerar en el diseño futuro son:
- **DOCX**: editable por el equipo técnico para revisión final.
- **PDF**: para distribución institucional y archivo.
- **HTML institucional**: para publicación web con estructura navegable.

El formato definitivo debe decidirse con el equipo institucional antes de
implementar el motor.

### 7.4 Trazabilidad en el artefacto

El documento compilado debe incluir, de forma explícita o en anexo:
- Fecha de generación y versión del sistema.
- ID y estado del PSL que lo originó.
- Lista de fuentes documentales del repositorio que contribuyeron al
  diagnóstico.
- Estado de validación de cada sección.
- Nota clara de que el documento requiere aprobación institucional antes
  de su uso oficial.

---

## 8. Invariantes

**I-C1 — El compilador no analiza evidencia**

El compilador no ejecuta el IntegrityGuard, no procesa el `EvidenceStore`,
no genera `EvidenceAtom` y no produce ningún output analítico. Su función
es exclusivamente de ensamblaje y exportación documental.

**I-C2 — El compilador no genera PSL**

El compilador recibe el PSL como entrada ya existente y validada. No crea
ni modifica el PSL. Un PSL no puede ser generado durante la ejecución del
compilador.

**I-C3 — El compilador no prioriza**

Las prioridades municipales deben estar decididas antes de activar el
compilador. El compilador las registra y exporta; no las calcula ni las
sugiere.

**I-C4 — El compilador no decide institucionalmente**

El documento compilado es una propuesta técnica de exportación, no una
decisión institucional. La aprobación institucional del Plan Local de Salud
es un acto humano externo al sistema. El compilador no puede aprobar el
documento que produce.

**I-C5 — El compilador requiere PSL aprobado, no solo validado**

`"validated"` es la condición mínima para el Nivel 3 (Plan de Acción,
Agenda, Seguimiento). El compilador requiere `"approved"`: una condición
superior que implica deliberación, consenso documentado y aprobación
institucional explícita.

**I-C6 — El documento compilado no modifica el workspace**

La ejecución del compilador no altera el `EvidenceStore`, el repositorio
documental, el PSL ni ningún otro objeto del workspace. Es una operación
de solo lectura que produce un artefacto externo.

**I-C7 — El documento compilado preserva la trazabilidad**

Cada elemento del Plan Local de Salud compilado debe ser trazable hasta
su origen en la cadena de evidencia. Un compilador que no pueda garantizar
esta trazabilidad no cumple el contrato.

**I-C8 — El compilador no es el stage `evaluation`**

`evaluation` y `compiler` son stages distintos del pipeline. La evaluación
de impacto (comparación pre/post intervención) es una actividad posterior
y diferente a la compilación del plan inicial. El compilador produce el
plan; la evaluación mide sus resultados. Ninguno de los dos tiene
implementación activa actualmente.

---

## 9. Riesgos conocidos

**R-C1 — Confundir el Plan de Acción con el Plan Local de Salud**

El `ActionPlanDraft` del Nivel 3 es un borrador técnico interno. Si se
presenta como el Plan Local de Salud oficial, el municipio puede tomar
compromisos sobre una base técnica insuficiente. El compilador, cuando
exista, será la única ruta autorizada para producir el documento
institucional definitivo.

**R-C2 — Activar el compilador sin PSL aprobado**

Si el compilador se implementa sin el gate G-C1 (PSL `"approved"`),
podría producir documentos basados en borradores. Un Plan Local de Salud
compilado sobre un PSL no aprobado institucionalmente no tiene validez
institucional. Este gate es el más crítico y el que actualmente tiene
menos infraestructura de soporte.

**R-C3 — Formatos de exportación sin validación institucional**

El formato del Plan Local de Salud tiene requisitos institucionales
específicos de la Junta de Andalucía y del marco RELAS. Un formato
técnicamente correcto pero institucionalmente inadecuado puede requerir
revisión completa antes de su uso oficial. El diseño del formato debe
involucrar al equipo institucional antes de la implementación.

**R-C4 — Pérdida de trazabilidad en la exportación**

Si el proceso de exportación no preserva los identificadores de origen
(IDs de EvidenceAtom, documentId, PSL, etc.), el documento compilado
pierde su auditabilidad. Un Plan Local de Salud no auditable tiene valor
reducido para el seguimiento y la rendición de cuentas.

**R-C5 — Cuota de almacenamiento**

Un documento compilado completo en formato DOCX o PDF puede superar la
cuota de localStorage (~5 MB). El compilador debe diseñarse para exportar
fuera del workspace (descarga directa en el navegador) sin intentar
persistir el artefacto completo en localStorage.

---

## 10. Criterios mínimos antes de implementar

Los siguientes criterios deben estar cumplidos antes de que el stage
`compiler` pase de reserva arquitectónica a implementación activa:

**10.1 Gates de sistema completados**

- La transición `validated → approved` del PSL debe estar implementada
  en la UI con los metadatos correspondientes (`approvedAt`, `approvedBy`).
- Debe existir un mecanismo de validación formal del Plan de Acción que
  diferencie el borrador técnico del plan revisado.

**10.2 Contrato de estructura**

Debe existir un documento que especifique la estructura exacta del Plan
Local de Salud compilado: capítulos obligatorios, contenido mínimo de
cada uno, elementos de trazabilidad requeridos y marcas de autoría.

**10.3 Decisión de formato**

El equipo institucional debe aprobar al menos un formato de exportación
antes del inicio de la implementación. El formato no puede ser elegido
unilateralmente por el sistema.

**10.4 Revisión de cuota**

Debe evaluarse si el documento compilado puede exportarse directamente
(descarga en navegador) sin pasar por localStorage, o si requiere un
mecanismo de almacenamiento alternativo.

**10.5 Alineamiento institucional**

El Plan Local de Salud compilado debe ser coherente con los requisitos
formales del marco RELAS y de la Consejería de Salud y Consumo de la
Junta de Andalucía. Este alineamiento debe verificarse antes de definir
la estructura del artefacto.

---

## 11. Relación con contratos existentes

| Contrato | Relación con el compilador |
|---|---|
| `CONTRACT-REPOSITORY.md` | Los documentos del repositorio son fuente trazable del Plan compilado. El compilador los referencia; no los modifica |
| `CONTRACT-EVIDENCE.md` | Los `EvidenceAtom` son la base de trazabilidad del diagnóstico que el compilador incluye. El compilador no genera ni modifica átomos |
| `CONTRACT-MIT-PSL.md` (histórico; doctrina vigente del Perfil: `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`) | El PSL en estado `"approved"` es la entrada principal del compilador. PSL-I1 (el PSL referencia el Informe de Salud; no lo contiene) aplica también al documento compilado |
| `CONTRACT-COMPLEMENTARY-STUDIES.md` | Los estudios complementarios contribuyen evidencia al PSL. El documento compilado debe referenciar qué estudios estuvieron presentes en el diagnóstico |
| `CONTRACT-PERSISTENCE.md` | El compilador no debe persistir el artefacto compilado en localStorage. La exportación es una operación de lectura del workspace seguida de descarga directa |
| `CONTRACT-ACTION-PLAN.md` | El Plan de Acción, la Agenda y el Seguimiento del Nivel 3 son capítulos del Plan Local de Salud compilado. El compilador toma como entrada el PSL aprobado y los objetos validados del Nivel 3 derivados de ese PSL |

---

## 12. Exclusiones

Este contrato regula exclusivamente el stage `compiler` como reserva
arquitectónica. Los siguientes aspectos quedan fuera de su alcance:

- **Análisis territorial**: MIT, LT1, OIT, Reconciliación. Véase
  `CONTRACT-MIT-PSL.md`.
- **PSL y su ciclo de vida** hasta el estado `"validated"`: véase
  `CONTRACT-MIT-PSL.md`.
- **Priorización, EPVSA, Plan de Acción, Agenda y Seguimiento**: véase
  `CONTRACT-ACTION-PLAN.md`.
- **Stage `evaluation`**: evaluación de impacto post-intervención. Es un
  stage distinto del compilador, también sin implementación activa.
- **Aprobación institucional** del Plan Local de Salud: es un acto humano
  externo al sistema. COMPÁS NG puede registrar la aprobación como hecho
  documentado; no la produce ni la valida.
- **Distribución o publicación** del documento compilado: fuera del alcance
  del sistema en cualquier horizonte actual.

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Documenta el stage `compiler` como reserva arquitectónica sin implementación activa. Establece los gates obligatorios, la distinción Plan de Acción / Plan Local de Salud compilado, los invariantes y los criterios mínimos de implementación futura. |
