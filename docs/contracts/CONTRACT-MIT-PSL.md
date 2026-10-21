# COMPÁS NG — Contrato del Motor de Interpretación Territorial y el Perfil de Salud Local

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes y los límites del
> Motor de Interpretación Territorial (MIT), la Reconciliación Interpretativa
> y el Perfil de Salud Local (PSL) en COMPÁS NG.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-24

---

## 1. Propósito

Este contrato establece el paso de evidencia trazable a interpretación
territorial (Nivel 2) y de interpretación territorial a decisión planificada
(Nivel 3). Es el contrato más crítico del sistema porque regula la única
frontera donde la información cambia de naturaleza: de datos analíticos a
propuestas que pueden influir en decisiones institucionales.

El **Motor de Interpretación Territorial (MIT)** transforma el `EvidenceStore`
saneado en un Estado Territorial Evolutivo: una lectura estructurada,
versionada y trazable del municipio.

El **Perfil de Salud Local (PSL)** sintetiza ese estado y actúa como **único
puente autorizado** entre el Nivel 2 analítico y el Nivel 3 de decisión.
Ningún motor del Nivel 3 puede consumir directamente los outputs del MIT.

---

## 2. Principios

### El MIT interpreta, no decide

El MIT organiza, clasifica y relaciona evidencia. No adopta conclusiones
institucionales, no establece prioridades municipales ni produce compromisos
de planificación. Todo output del MIT es una propuesta analítica que requiere
validación técnica y comunitaria explícita.

### LT1 organiza evidencia, no concluye institucionalmente

La dimensión diagnóstica (LT1) es la clasificación del `EvidenceStore` por
tipo semántico de átomo: determinantes, activos, indicadores, hallazgos
cualitativos y cautelas metodológicas. No establece causalidad, no pondera
la importancia relativa de las fuentes y no produce rankings automáticos.

### El OIT propone áreas de intervención, no actuaciones definitivas

Las Áreas de Intervención Territorial (OIT) son candidaturas analíticas
derivadas de la lectura territorial y de la Reconciliación. Son el producto
de heurísticas del sistema, no de deliberación técnica. Requieren revisión
y validación antes de traducirse en actuaciones concretas del Plan de Acción.

### La Reconciliación identifica tensiones, no las resuelve

El Motor de Reconciliación Interpretativa detecta y clasifica tensiones entre
fuentes, escalas y estados históricos. El sistema nunca resuelve un conflicto
interpretativo de forma automática. Toda tensión detectada queda marcada como
`"no-resuelta"` y es responsabilidad del equipo técnico gestionarla.

### El PSL es el objeto canónico del Nivel 2

El PSL sintetiza el análisis territorial en un objeto validable, versionado y
con ciclo de vida explícito. Es la única representación del Nivel 2 que el
Nivel 3 tiene autorizado a consumir.

### Ningún motor del Nivel 3 consume directamente el Nivel 2

Esta es la regla PSL-C1. Los motores del Nivel 3 (Priorización, EPVSA,
Plan de Acción, Agenda, Seguimiento) solo pueden operar sobre el PSL. No
pueden consumir `LT1Result`, `OITResult`, `ReconciliacionResult` ni
`EstadoTerritorialEvolutivo` directamente.

---

## 3. Entradas del MIT

El MIT acepta como entrada un `EvidenceStore` **ya saneado** por el
`EvidenceStoreIntegrityGuard`. No opera sobre el store original.

Las fuentes documentales que pueden contribuir evidencia al store son:

| Fuente | `EvidenceOrigin` | Estado en EvidenceStore |
|---|---|---|
| Informe de Salud | `health-report` | **Fuente primaria preservada — no genera EvidenceAtom** (D-HR-01 resuelta; véase CONTRACT-EVIDENCE §5.1) |
| Activos Comunitarios (legado) | `community-assets` | Activo (tipo interno; no visible en selector) |
| Localiza Salud | `localiza-salud` | Activo — vía visible única para activos comunitarios |
| Marco estratégico y normativo | `strategic-framework` | Activo |
| Documentación territorial | `territorial-documentation` | Activo |
| Material cualitativo | `qualitative-material` | Activo |
| IBSE | `ibse` | Activo |
| Priorización Temática | `citizen-participation` | Activo |
| Estudio Complementario | `complementary-study` | Activo |
| Evidencia longitudinal | `longi` | Activo (atoms) |
| EAS | `eas` | Origen reconocido; parser pendiente |
| CMI | `cmi` | Origen reconocido; parser pendiente |
| SAM | `sam` | Origen reservado; sin implementación |
| Entrada manual | `manual-entry` | Origen reconocido; flujo directo |

El MIT no distingue entre fuentes implementadas y pendientes: procesa los
átomos que encuentre en el store, independientemente de su procedencia. La
responsabilidad de garantizar que el store contiene evidencia de calidad es
del repositorio y del IntegrityGuard.

**El Informe de Salud no contribuye al EvidenceStore como átomos ordinarios.** El MIT
no recibe átomos con `origin: "health-report"` en el flujo activo del producto. El PSL
referencia el `HealthReportDocument` directamente por su título e identificador como
fuente primaria disponible. Su ausencia no impide la ejecución del MIT, pero el PSL
la señala explícitamente en el Capítulo II y en el resumen ejecutivo.

---

## 4. Motor de Interpretación Territorial (MIT)

### 4.1 Producto: `EstadoTerritorialEvolutivo`

El MIT produce un `EstadoTerritorialEvolutivo`, que incluye:

- **`version`**: igual a `evidenceStore.updatedAt`. Estable mientras la
  evidencia no cambia; determinista entre re-ejecuciones.
- **`dimensionDiagnostica`** (LT1): clasificación de átomos por tipo semántico.
- **`areasDeIntervencion`** (OIT): candidaturas de intervención territorial.
- **`dimensionLongitudinal`**: presencia y nota sobre evidencia evolutiva.
- **`tensionesEstructurales`**: tensiones territoriales reales detectadas entre fuentes analíticas. Solo deben incluirse tensiones con base en datos del territorio, no observaciones sobre la calidad de la base documental.
- **`limitacionesDiagnosticas`**: observaciones sobre la calidad de la base documental (cautelas metodológicas, ausencia de determinantes, base insuficiente). **No son tensiones territoriales.** No pueden escalar a áreas de intervención ni alimentar la ReconciliaciónInterpretativa. Se declaran en el Perfil como lagunas o aspectos pendientes de contraste, nunca como candidaturas de priorización.
- **`marcosAplicados`**: marcos interpretativos presentes (EPVSA, ESCA, RELAS
  y otros), con conteo de elementos por marco.
- **`origenesPresentes`**: lista ordenada de orígenes con al menos un átomo.
- **`totalEvidencias`**: número total de átomos en el store saneado.
- **`requiresHumanValidation: true`**: invariante tipado.

### 4.2 Dimensión diagnóstica (LT1)

LT1 es una sub-rutina interna del MIT, no una etapa de pipeline independiente.
Clasifica los átomos del store por `kind`:

| `kind` del átomo | Grupo LT1 |
|---|---|
| `determinant` | `determinants` |
| `asset` | `assets` |
| `indicator` | `indicators` |
| `qualitative-observation`, `participation` | `qualitativeFindings` |
| `methodological-caution` | `methodologicalCautions` |
| otros | no incluidos en ningún grupo LT1 |

LT1 produce además:
- **`summary`**: párrafo narrativo no causal que describe la base documental.
- **`preliminaryOpportunities`**: orientaciones preliminares heurísticas cuando
  se detectan combinaciones de determinantes y activos, hallazgos participativos
  e indicadores, o cautelas metodológicas sin determinantes.
- **`supportingEvidenceIds`**: IDs de todos los átomos del store.

**Límites de LT1:**
LT1 no establece causalidad. No produce rankings. No prioriza automáticamente.
No concluye cuáles son los problemas más graves del municipio. Su output es
una organización de la evidencia disponible, no un diagnóstico validado.

### 4.3 Áreas de Intervención Territorial (OIT)

OIT es otra sub-rutina interna del MIT. Transforma el resultado de LT1 en
áreas de intervención cuando detecta condiciones suficientes:

| Condición | Área generada |
|---|---|
| `determinants.length > 0` y `assets.length > 0` | Conectar determinantes con activos comunitarios |
| `qualitativeFindings.length > 0` y `indicators.length > 0` | Contrastar hallazgos participativos con indicadores |
| `methodologicalCautions.length > 0` | Revisar cautelas antes de priorizar |
| Ninguna condición cumplida | Área de fallback: ampliar la base de evidencia |

Cada área tiene: `id`, `title`, `rationale`, `relatedEvidenceIds`, `cautions`,
`requiresHumanValidation: true` y **`isAnalyticalGap?: boolean`**.

El campo `isAnalyticalGap` es obligatorio para la clasificación institucional:
- `isAnalyticalGap: true` — la "área" refleja una limitación diagnóstica (cautela metodológica, base insuficiente, ausencia de determinantes). **No puede pasar al capítulo de áreas de intervención del Perfil ni a la sección de candidaturas del Cap. VII.** Debe mostrarse, como máximo, en "Aspectos pendientes de contraste".
- `isAnalyticalGap: false` (o `undefined`) — área territorial sustantiva con base en datos reales. Puede pasar al Perfil como candidatura.

| Condición | Área generada | `isAnalyticalGap` |
|---|---|:---:|
| `determinants.length > 0` y `assets.length > 0` | Conectar determinantes con activos comunitarios | `false` |
| `qualitativeFindings.length > 0` y `indicators.length > 0` | Contrastar hallazgos participativos con indicadores | `false` |
| `methodologicalCautions.length > 0` | Revisar cautelas antes de priorizar | **`true`** |
| Ninguna condición cumplida | Ampliar la base de evidencia | **`true`** |

**Límites del OIT:**
Las áreas son heurísticas del sistema. Reflejan posibilidades analíticas,
no compromisos de intervención. Las áreas con `isAnalyticalGap: true` no
deben traducirse a candidaturas de priorización en ningún caso.

### 4.4 Dimensión longitudinal

La dimensión longitudinal es activa cuando el store contiene átomos con
`provenance.origin === "longi"`. Si está activa, el MIT genera una nota
sobre el número de evidencias longitudinales. Si no hay evidencia longitudinal,
el MIT señala que la interpretación se basa en el estado actual sin contexto
histórico comparativo.

La dimensión longitudinal no es equivalente a la Memoria Longitudinal del
proceso (concepto del dominio pendiente de implementar).

### 4.5 Tensiones estructurales

El MIT detecta heurísticamente las siguientes tensiones:

1. Base documental con cautelas metodológicas y sin determinantes.
2. Activos comunitarios presentes pero sin determinantes documentados.
3. Hallazgos participativos sin respaldo de indicadores cuantitativos.
4. Base documental insuficiente para articular áreas de intervención específicas.

Estas tensiones son señales del sistema, no conclusiones técnicas. Su ausencia
no garantiza que la base documental sea completa; su presencia no garantiza que
el municipio tenga ese problema específico.

### 4.6 Marcos interpretativos

Los marcos interpretativos (EPVSA, ESCA, RELAS, BUENA_EDAD, MAYORES y otros
registrados en `StrategicFrameworkRegistry`) son **guías de lectura**, no
módulos computacionales ejecutables. El MIT los aplica leyendo los elementos
del registro y contabilizando cuántos pertenecen a cada marco. No traduce
automáticamente la evidencia a líneas EPVSA; eso es responsabilidad del motor
EPVSA del Nivel 3, que opera sobre el PSL.

---

## 5. Reconciliación Interpretativa

La Reconciliación es un motor que actúa **entre** el Nivel 2 (MIT) y el Nivel 3
(PSL → Priorización). No forma parte del MIT ni del PSL; es el puente que
determina qué tensiones del MIT tienen suficiente consistencia para convertirse
en Áreas de Intervención Territorial del PSL.

### 5.1 Entradas

- `EstadoTerritorialEvolutivo` producido por el MIT en la ejecución actual.
- `historialEstadosTerritorial`: array de `TerritorialStateRecord`, snapshots
  compactos de estados anteriores del municipio.

### 5.2 Conflictos detectados

El motor detecta cinco tipos de conflicto interpretativo:

| Tipo | Condición de activación |
|---|---|
| `tendencia` | Dimensión longitudinal activa en el estado actual y en el historial |
| `fuente` | Coexistencia de fuentes con escalas o poblaciones distintas (IBSE + Informe de Salud; ciudadanía + técnica) |
| `escala` | IBSE (escala individual) + indicadores poblacionales |
| `temporal` | Cambios significativos entre el estado actual y el anterior (pérdida de determinantes; variación >50% en volumen de evidencia) |
| `interpretativo` | Tensiones estructurales presentes; activos sin determinantes |

Todo conflicto tiene `resolucion: "no-resuelta"`. Este campo es un invariante
tipado: el sistema no puede generar conflictos con cualquier otro valor.

### 5.3 Filtro de Relevancia

Las tensiones estructurales del MIT pasan por un Filtro de Relevancia antes
de ser escaladas. Una tensión es relevante si cumple **≥2 de 3 criterios**:

1. **Impacto estructural potencial**: la tensión menciona determinantes,
   activos, desigualdad, inequidad, vulnerabilidad o contexto territorial.
2. **Persistencia interpretativa**: la tensión conceptualmente similar aparece
   en ≥2 estados históricos, **o** hay ≥2 orígenes gobernados presentes.
3. **Divergencia de fuente significativa**: coexistencia de IBSE e Informe
   de Salud, o de participación ciudadana e indicadores cuantitativos.

Si la tensión no supera el filtro, se clasifica como **ruido estructural** y
no se escala a Área de Intervención Territorial.

### 5.4 Criterios de Escalado

Las tensiones que superan el Filtro de Relevancia se evalúan con tres
criterios adicionales, **todos obligatorios** para el escalado:

1. **Persistencia temporal**: la tensión conceptualmente similar aparece en
   ≥2 estados históricos.
2. **Convergencia de fuentes**: ≥2 orígenes gobernados presentes.
3. **Coherencia estructural**: la tensión menciona estructura sanitaria
   fundamental (determinantes, activos, indicadores, participación,
   desigualdad, vulnerabilidad) y no es la tensión de fallback por base
   documental insuficiente.

### 5.5 Clasificación final de tensiones

| Clasificación | Significado |
|---|---|
| `escalada` | Supera Filtro de Relevancia y Criterios de Escalado; se convierte en Área de Intervención Territorial escalada |
| `no-escalada` | Supera el Filtro de Relevancia pero no los Criterios de Escalado; señal a monitorizar |
| `ruido-estructural` | No supera el Filtro de Relevancia; puede ignorarse analíticamente |

### 5.6 Áreas de Intervención Territorial escaladas

Cuando existen tensiones escaladas, el runtime utiliza las áreas escaladas
por la Reconciliación como `oitParaDecision` (en lugar del OIT directo del MIT).
Estas áreas tienen prioridad sobre las del OIT porque reflejan consistencia
histórica y convergencia de fuentes, no solo la lectura puntual actual.

Si no hay tensiones escaladas, el MIT actúa como fallback: sus Áreas de
Intervención pasan directamente al PSL.

---

## 6. Perfil de Salud Local (PSL)

### 6.1 Naturaleza

El PSL es el **objeto canónico del Nivel 2**. No es un documento del
repositorio. No es el Informe de Salud municipal. No es el Plan Local de
Salud compilado. Es una síntesis analítica validable que:

- Organiza el análisis territorial en una **lectura institucional canónica única
  y adaptativa** (ver §6.1.1 bis): sus secciones y su extensión dependen de la
  riqueza y solidez del expediente; no hay recuento obligatorio de capítulos.
- Referencia los documentos fuente sin contenerlos ni sustituirlos.
- Actúa como único puente autorizado hacia la capa de decisión (Nivel 3).
- Tiene un ciclo de vida explícito con transiciones de estado auditables.

### 6.1.1 bis Arquitectura adaptativa de la lectura canónica (Fundamentos del Perfil único, 2026-07-17)

> Prevalece sobre cualquier redacción de este contrato que fije un número de
> capítulos. Ver `CONTRACT-INDEX` §«Fundamentos del Perfil único».

- Existe **una única lectura institucional canónica**. Queda **derogada toda
  rigidez numérica** («seis» o «siete» capítulos): la estructura capitular que
  sigue describe la **cobertura conceptual** (qué conocimiento cubre la lectura),
  no un recuento obligatorio de secciones del documento.
- La **extensión y el número de secciones dependen de la riqueza y la solidez del
  expediente**. Una sección puede **abrirse, comprimirse o no aparecer**.
- Una **mera presencia textual no obliga** a generar un bloque completo.
- **No puede coexistir una «lectura larga» alternativa** —ni abierta ni plegada—
  que compita con la lectura canónica.
- El **espacio técnico** (trazabilidad, matriz completa, referencias) puede existir
  *después* del documento, claramente separado de la lectura institucional.

### 6.1.2 Clases de conocimiento (Fundamentos del Perfil único, 2026-07-17)

La lectura distingue el **estatuto epistemológico** de cada pieza. Como mínimo:

| Clase | Qué es | No es |
|---|---|---|
| Dato estructurado | valor medido de un instrumento (p. ej. media IBSE, referencia EAS) | no es prueba de causalidad |
| Señal local exploratoria | resultado de muestra local no representativa | no es estimación poblacional |
| Referencia / proxy contextual | valor provincial o municipal que contextualiza | **no es medición distrital** |
| Presencia textual en una fuente | mención en el Informe u otro documento | **no es indicador ni prevalencia** |
| Conocimiento cualitativo/comunitario real | testimonio, participación ciudadana, saber local | no lo genera el sistema |
| Síntesis automática derivada | resumen que el sistema calcula desde otros datos (p. ej. `IBSE_RESUMEN`) | **no es conocimiento cualitativo ni participativo** |
| Incertidumbre | lo que no se sabe (incl. ausencia de desagregación = incertidumbre de equidad) | no es ausencia de desigualdad |
| Hipótesis plausible | mecanismo propuesto, coherente con la evidencia | **no es causalidad demostrada** |

**Regla de solidez:** la **frecuencia de una expresión puede orientar la búsqueda,
pero no eleva por sí sola una presencia textual a evidencia territorial.** No se
introduce un umbral numérico de menciones como criterio de solidez.

### 6.1.1 Principios metodológicos del Perfil de Salud Local

El Perfil de Salud Local (PSL) constituye una síntesis analítica del estado
de salud del ámbito territorial. Su función es ofrecer una lectura estructurada,
prudente y trazable de la situación de salud, inspirada en perfiles poblacionales
de salud pública como los Health Profiles británicos, pero adaptada al contexto
andaluz, RELAS y COMPÁS NG.

El PSL integra, cuando exista evidencia disponible:

- determinantes sociales de la salud;
- desigualdades, inequidades y vulnerabilidades territoriales;
- activos comunitarios y recursos salutogénicos;
- indicadores poblacionales;
- estudios complementarios;
- participación ciudadana;
- cautelas metodológicas;
- evidencia longitudinal.

El PSL describe, interpreta y sintetiza. No prescribe actuaciones, no selecciona
prioridades institucionales, no asigna líneas estratégicas, no aprueba objetivos
ni sustituye la deliberación técnica, ciudadana o institucional posterior.

### 6.2 Cobertura conceptual (dimensiones de la lectura, no recuento obligatorio)

> Las «dimensiones capitulares» siguientes describen **qué conocimiento cubre** la
> lectura canónica cuando el expediente lo sostiene. **No fijan un número
> obligatorio de secciones del documento** (ver §6.1.1 bis): una dimensión sin
> evidencia suficiente se comprime o no aparece; ninguna presencia textual obliga a
> abrir un bloque completo.

**Capítulo I — Marco Estratégico**

Referencia los marcos normativos y metodológicos aplicables: EPVSA, RELAS,
enfoque salutogénico, determinantes sociales y participación ciudadana.
El PSL no reproduce el contenido de los marcos; referencia sus IDs en
`strategicFrameworkSectionIds`. El contenido narrativo permanece en el objeto
`StrategicFramework`.

**Capítulo II — Informe de Salud**

Referencia el Informe de Salud mediante `healthReportDocumentId` y
`healthReportTitle`. El PSL no contiene el texto del informe.
La ausencia de Informe de Salud se señala explícitamente pero no bloquea
la generación del PSL.

**Invariante PSL-I1**: el PSL referencia el Informe de Salud; nunca lo
contiene, nunca lo sustituye y nunca lo modifica.

**Capítulo III — Diagnóstico integrado**

Estadísticas del `EvidenceStore` saneado: conteos por origen y por tipo,
IDs de átomos activos, presencia de fuentes relevantes (IBSE, Priorización
Temática, estudios complementarios), errores y avisos del IntegrityGuard.

El PSL referencia los IDs de los átomos en `evidenceAtomIds`. No duplica
el contenido de los átomos.

**Capítulo IV — Interpretación territorial**

Síntesis del MIT y la Reconciliación: resumen territorial, determinantes,
activos, indicadores, hallazgos participativos y cautelas metodológicas
(como conteos), tensiones estructurales, conflictos interpretativos,
tensiones escaladas y no escaladas, ruido estructural, marcos aplicados,
y áreas de intervención territorial.

Este capítulo es de **autoría asistida**: el sistema genera el contenido a
partir de los motores analíticos. El equipo técnico puede revisarlo pero no
lo edita directamente en la versión actual del sistema.

**Capítulo V — Conclusiones** (scaffold)

El sistema genera un borrador orientativo (`status: "scaffold"`) a partir
de la síntesis del MIT. El equipo técnico debe redactar o revisar las
conclusiones antes de que el PSL pueda considerarse validado.

Tras la validación del PSL, el equipo puede editar este capítulo en la
interfaz. Al guardar el texto, el estado del capítulo pasa a `"authored"`.

**Capítulo VI — Cierre interpretativo** (scaffold)

El sistema genera un borrador orientativo con el alcance del diagnóstico,
las limitaciones metodológicas identificadas y una síntesis del proceso
interpretativo. El equipo técnico debe redactar el cierre definitivo.
Este capítulo documenta qué puede y qué no puede concluirse a partir
de la evidencia disponible. No formula acciones ni orientaciones estratégicas.

**Capítulo VII — Síntesis y Priorización** (scaffold + participación)

Combina tres elementos:

- **Candidaturas técnicas** (`hasTechnicalCandidatures`): áreas de
  intervención con evidencia suficiente para ser consideradas en la
  priorización. Son propuestas del sistema.
- **Selección participativa** (`hasParticipatorySelection`): temáticas
  seleccionadas por la ciudadanía en el proceso de Priorización Temática.
- **Deliberación** (`deliberacionNota`, `consensoDocumentado`): el equipo
  técnico, la ciudadanía y las instituciones deben documentar el proceso
  deliberativo y el consenso alcanzado. Este contenido **nunca es generado
  por el sistema**; es siempre de autoría humana.

Estado del capítulo VII (`priorizacionStatus`):
- `"scaffold"`: sin candidaturas técnicas ni selección participativa.
- `"partial"`: tiene candidaturas técnicas y/o selección participativa,
  pero la deliberación no está documentada.
- `"complete"`: deliberación y consenso documentados por el equipo.

### 6.3 Ciclo de vida del PSL

```
generated → validated → approved
              ↓
           (puede revertirse a generated mediante invalidación)

generated → superseded   (si un PSL posterior sustituye a este)
generated → archived     (si el proceso se suspende o cierra)
validated → archived     (si el proceso se suspende o cierra)
```

| Estado | Significado |
|---|---|
| `generated` | Borrador generado automáticamente. Requiere revisión técnica |
| `review` | En revisión técnica activa (transición no implementada aún en la UI) |
| `validated` | Validado técnicamente por el equipo. Habilita la edición de caps V, VI y VII |
| `approved` | Aprobado institucionalmente (condición: cap VII completo con deliberación documentada) |
| `superseded` | Sustituido por un PSL posterior del mismo municipio |
| `archived` | Retirado por cierre, obsolescencia o decisión técnica |

**Transición `generated → validated`**:

El equipo técnico activa esta transición desde la interfaz. Al validar, el
PSL queda vinculado al nombre del responsable (`validatedBy`), la fecha
(`validatedAt`) y el estado del `EvidenceStore` en ese momento
(`evidenceStoreVersion`). A partir de este momento, el workspace persiste el
PSL validado en `validatedPSL`.

**Transición `validated → generated` (invalidación)**:

El equipo técnico puede revertir el PSL a borrador. Al invalidar, se elimina
`validatedPSL` del workspace y el runtime regenera un PSL fresco en estado
`generated`. Los capítulos editados manualmente (V, VI, VII) se pierden al
regenerar.

La invalidación es la respuesta apropiada cuando el PSL ha quedado obsoleto
por incorporación de nueva evidencia y el equipo decide regenerarlo.

### 6.4 Persistencia del PSL

El PSL validado se persiste en `workspace.validatedPSL`. En cada ejecución
del runtime:

1. Si `workspace.validatedPSL` existe → el runtime lo usa directamente.
2. Si no existe → el runtime construye un PSL fresco en estado `generated`.

El PSL generado en estado `generated` no se persiste: se recalcula en cada
render. Solo el PSL validado se escribe en el workspace y se guarda en
localStorage.

---

## 7. Invariantes

**PSL-I1 — El PSL referencia el Informe de Salud; nunca lo contiene ni lo sustituye**

`healthReportDocumentId` y `healthReportTitle` son referencias al documento
del repositorio. El PSL no duplica el texto del informe, no lo reemplaza y no
puede presentarse como equivalente al Informe de Salud epidemiológico original.
Un Informe de Salud preservado en el repositorio y un PSL son objetos distintos
en capas distintas del sistema.

**PSL-C1 — Ningún motor del Nivel 3 consume directamente outputs del Nivel 2**

La Priorización técnica (`PrioritizationEngine`) consume exclusivamente el PSL
(`psl.areasDeIntervencion`). El motor EPVSA consume el resultado de la
Priorización. El motor de Plan de Acción consume EPVSA y el PSL (para la
referencia `PSLReference`). La Agenda consume el Plan de Acción. El Seguimiento
consume la Agenda.

Ninguno de estos motores puede recibir como entrada directa `LT1Result`,
`OITResult`, `EstadoTerritorialEvolutivo` ni `ReconciliacionResult`. Si un
nuevo motor del Nivel 3 necesita información del Nivel 2, debe acceder a
ella a través del PSL o proponer que el PSL incorpore el campo necesario.

**I-MIT-1 — El MIT no modifica el `EvidenceStore`**

El MIT lee el store saneado y produce su output. No escribe en el store, no
añade átomos y no purga evidencia. Su ejecución es idempotente: el mismo store
produce el mismo `EstadoTerritorialEvolutivo` (mismo `version`).

**I-MIT-2 — Los outputs del MIT siempre llevan `requiresHumanValidation: true`**

`EstadoTerritorialEvolutivo.requiresHumanValidation` es `true` por diseño de
tipo. `OITResult.requiresHumanValidation` es `true`. `ReconciliacionResult.requiresHumanValidation`
es `true`. El sistema nunca produce interpretaciones territoriales que se
presenten como validadas automáticamente.

**I-MIT-3 — Los conflictos interpretativos nunca tienen resolución automática**

`ConflictoInterpretativo.resolucion` es siempre `"no-resuelta"`. Este campo es
un tipo literal: el sistema no puede generar conflictos con ningún otro valor.
La resolución de un conflicto es responsabilidad del equipo técnico.

**I-PSL-1 — Un PSL `generated` no es un PSL `validated`**

El estado `generated` indica que el sistema ha producido un borrador técnico.
No implica revisión, acuerdo técnico ni aprobación institucional. Las
conclusiones (cap. V) y el cierre interpretativo (cap. VI) en estado `generated`
son propuestas asistidas del sistema, no posicionamientos del equipo técnico.

**I-PSL-2 — El PSL no es el Plan Local de Salud compilado**

El PSL es el objeto analítico del Nivel 2 de COMPÁS NG. El Plan Local de
Salud compilado (cuando exista) será un producto de exportación documental
generado a partir del PSL aprobado y del Plan de Acción validado. Son objetos
distintos, en distintos niveles del sistema y con distintas finalidades
institucionales.

**I-PSL-3 — Los capítulos V y VI son scaffold hasta autoría humana explícita**

Los textos de conclusiones (cap. V) y cierre interpretativo (cap. VI) generados
por el sistema son orientativos. Están marcados con `status: "scaffold"` y con
un `authorshipNote` que recuerda la obligación de autoría humana. Solo cuando
el equipo técnico redacta y guarda su propio texto, el estado pasa a `"authored"`.
El sistema nunca promueve automáticamente de `"scaffold"` a `"authored"`.

**Invariante terminológico — El PSL concluye y orienta, pero no decide.**
El Capítulo V formula conclusiones diagnósticas. El Capítulo VI cierra la
lectura interpretativa documentando alcance y limitaciones y recoge las
orientaciones técnicas que el equipo elige del menú de propuestas
(CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY v1.5, Art. 16 ter). Ningún capítulo
del PSL selecciona prioridades ni formula actuaciones operativas (responsable,
plazo, recurso). Las actuaciones pertenecen al Motor de Traducción Estratégica
(Producto 5) y al Plan de Acción (Producto 6).

**I-PSL-4 — La deliberación del capítulo VII nunca es generada por el sistema**

`deliberacionNota` en estado `scaffold` es una instrucción al equipo, no un
contenido deliberativo. `consensoDocumentado: false` en ese estado significa
que no ha habido deliberación registrada. Solo el equipo puede documentar el
consenso; el sistema solo lo preserva y lo muestra.

---

## 8. `pslIsStale`

### Definición

`pslIsStale` es `true` cuando se cumplen simultáneamente:

1. `psl.status === "validated"` — el PSL ha sido validado técnicamente.
2. `psl.evidenceStoreVersion !== integrityGuard.sanitizedStore.updatedAt` — el
   `EvidenceStore` ha cambiado desde que se validó el PSL.

`evidenceStoreVersion` se captura en el momento de la validación y es igual a
`sanitizedStore.updatedAt` en ese instante.

### Qué implica

- El PSL validado puede no reflejar el estado territorial actual del municipio.
- La interfaz muestra un aviso de "Perfil desactualizado" con la fecha de la
  última validación.
- El Plan de Acción, la Agenda y el Seguimiento son generados a partir del PSL
  validado (obsoleto) hasta que el equipo invalide y regenere.
- El `ActionPlanDraft` incluye `pslReference.isStale: true`, informando a
  cualquier consumidor de que el plan se generó sobre un PSL posiblemente
  desactualizado.

### Qué no implica

- `pslIsStale` no invalida automáticamente el PSL. La decisión de regenerar
  es siempre del equipo técnico.
- `pslIsStale` no indica que el PSL sea incorrecto: puede que la nueva
  evidencia sea complementaria y no cambie el diagnóstico esencial.
- `pslIsStale` no bloquea ningún motor del Nivel 3: el sistema sigue
  generando plan, agenda y seguimiento, con la advertencia incorporada en
  `pslReference`.
- Un PSL en estado `generated` nunca puede estar obsoleto: `pslIsStale` solo
  es relevante para PSL en estado `validated`.

### Respuesta recomendada

Cuando `pslIsStale` es `true`, el equipo técnico debe:

1. Revisar qué evidencia ha cambiado y si es materialmente relevante.
2. Decidir si regenerar el PSL (invalidar → el sistema recalcula un borrador
   fresco) o aceptar el estado actual como base de planificación.
3. Si regenera, revisar y validar el nuevo borrador antes de continuar.

---

## 9. Exclusiones

Este contrato regula exclusivamente el MIT, la Reconciliación Interpretativa
y el PSL. Los siguientes aspectos quedan fuera de su alcance:

- **Repositorio Documental Municipal**: ciclo de vida de documentos, tipos
  canónicos, operaciones de sustitución y borrado. Véase
  `CONTRACT-REPOSITORY.md`.
- **EvidenceAtom y EvidenceStore**: estructura, pipelines de generación,
  IntegrityGuard. Véase `CONTRACT-EVIDENCE.md`.
- **Priorización técnica como decisión**: la priorización es deliberativa.
  El PSL proporciona candidaturas; la decisión es humana.
- **Motor EPVSA y traducción a líneas estratégicas**: motor del Nivel 3.
- **Plan de Acción, Agenda y Seguimiento**: motores del Nivel 3.
- **Persistencia y rehidratación del workspace**: serialización, migración de
  esquema, normalización de documentos canónicos al cargar.
- **Compilador del Plan Local de Salud**: producto de exportación documental
  del proceso finalizado; pendiente de diseño e implementación.
- **Biblioteca Metodológica Canónica**: contratos de instrumentos metodológicos.

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Documenta el estado del código a partir del commit `1e582f5`. Formaliza PSL-I1, PSL-C1, el ciclo de vida del PSL, los criterios de relevancia/escalado de la Reconciliación y la semántica de `pslIsStale`. |
| 2026-07-07 | **Revisión D-HR-01 + orígenes documentales + separación limitaciones/áreas.** Tabla de fuentes actualizada: `health-report` marcado como fuente primaria no atomizable; añadidos `territorial-documentation`, `qualitative-material`, `strategic-framework`. Campo `limitacionesDiagnosticas` documentado en `EstadoTerritorialEvolutivo`. OIT actualizado con campo `isAnalyticalGap` y tabla de clasificación. |
