# COMPÁS NG — Arquitectura de Productos Institucionales

> Especificación metodológica y documental de los productos que COMPÁS NG
> debe ser capaz de generar.
>
> Este documento no piensa desde el software. Piensa desde el técnico de salud
> pública, el municipio y la institución que recibirán los productos.
>
> No implementa nada. Define qué debe existir y por qué.
>
> Fecha de emisión: 2026-06-28
> Coherente con: ARCHITECTURE-CONSTITUTION, OPERATING-CONSTITUTION,
> CERTIFICATION-SPRINT-0-1, BLUEPRINT-PRODUCTION, ROADMAP.

---

## 0. Reconciliación con los Fundamentos del Perfil único (2026-07-17)

> **Esta sección prevalece sobre el resto del documento.** Reconcilia este catálogo
> con los Fundamentos del Perfil único (`CONTRACT-INDEX` §«Fundamentos del Perfil
> único»). Donde el cuerpo histórico contradiga lo siguiente, **queda superado**.

- **El PSL-NHS deja de contarse como producto institucional independiente.** Se
  retira del catálogo de productos actuales, de sus tablas y de sus grafos. El
  catálogo vigente pasa de ocho a **siete** productos.
- **Retirada del 2026-10-23.** El PSL-NHS ya no existe ni como representación
  derivada: el autor decidió trabajar solo con el Perfil general. La arquitectura
  vigente tiene una **única salida** del Perfil canónico
  (`CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`, Art. 17 ter).
- **Quedan superadas las recomendaciones de este documento de mantener paneles o
  compiladores separados** para PSL-C y PSL-NHS: el Perfil es único; el PSL-C es su
  compilación institucional, no otro Perfil.
- **Queda superada toda afirmación de «siete capítulos» obligatorios.** La lectura del
  Perfil es única y **adaptativa** (`CONTRACT-MIT-PSL` §6.1.1 bis): su extensión y su
  número de secciones dependen de la riqueza del expediente.
- La retirada del **código/ruta/artefacto NHS** (`NHSHealthProfileCompiler`,
  `workspace.nhsArtifact`, pestaña de navegación) es **migración técnica ejecutada**
  (GOV-P4-01 · PR-E). `NHSHealthProfileView` y `projectNHSDerived` se eliminaron
  el 2026-10-23.

Las secciones históricas §4 (análisis NHS) y §6.2 (NHSHealthProfileCompiler) se
conservan como registro de diseño **superado**; no constituyen autoridad vigente.

---

## 1. Filosofía

COMPÁS NG no genera informes. Genera **productos institucionales**.

La distinción no es semántica. Es funcional.

Un informe es un documento descriptivo que relata lo que el sistema encontró.
Un producto institucional es un artefacto con una finalidad precisa, una audiencia
definida, un momento exacto en el ciclo de planificación y una responsabilidad
explícita sobre quién lo usa y para qué.

Un Perfil de Salud Local no sirve para lo mismo que un Plan Local de Salud.
Un Resumen Ejecutivo no tiene el mismo lector que un Anexo Técnico.
Un Diccionario REDCap no se entrega a un alcalde.

Si COMPÁS NG confunde estos productos —generando un solo documento para todo, o
mezclando diagnóstico con planificación, o presentando datos metodológicos a lectores
políticos— el sistema falla, independientemente de la calidad técnica del código.

### Por qué esta distinción importa para la arquitectura

Cada producto institucional requiere:

1. Un **objeto de entrada** distinto o un subconjunto distinto del mismo objeto.
2. Una **estructura documental** propia con secciones, jerarquía y densidad adaptadas.
3. Un **nivel de automatización** diferente: lo que puede generarse automáticamente
   varía radicalmente entre un perfil diagnóstico y un plan de acción.
4. Un **contrato de validación** propio: quién valida, cuándo y con qué autoridad.
5. Un **compilador específico**: no existe un compilador universal de documentos
   institucionales de salud pública.

La familia de compiladores de COMPÁS NG no nace de una decisión técnica.
Nace de que estos productos son genuinamente distintos.

### El invariante que no puede relajarse

Ningún producto institucional de COMPÁS NG puede presentar como decidido
lo que todavía es propuesta del sistema, ni como validado lo que todavía
es borrador técnico. Esta regla, establecida en ARCHITECTURE-CONSTITUTION Art. 5
y en OPERATING-CONSTITUTION §3, no es solo un principio de diseño: es una
garantía metodológica que da valor institucional a los productos.

Un producto que mezcle diagnóstico con decisión, o propuesta con compromiso,
no es un producto de COMPÁS NG. Es una herramienta que deteriora la calidad
del proceso de planificación local.

---

## 2. Catálogo de productos institucionales

COMPÁS NG produce **siete** productos institucionales distinguibles (ver §0).
Tres son productos del ciclo de diagnóstico y planificación.
Dos son artefactos metodológicos para el ciclo de captura.
Dos son productos complementarios del proceso.

| Código | Producto | Tipo | Estado actual |
|---|---|---|---|
| **PSL-C** | Perfil de Salud Local COMPÁS | Diagnóstico territorial | Sin compilador |
| **PLS** | Plan Local de Salud | Planificación institucional | Sin definición estructural |
| **RE** | Resumen Ejecutivo | Comunicación política | Sin definición |
| **CM** | Cuestionario Municipal | Instrumento metodológico | Infraestructura parcial |
| **DD** | Diccionario REDCap | Artefacto técnico | Infraestructura parcial |
| **AT** | Anexo Técnico Metodológico | Documentación de rigor | Sin definición |
| **MEM** | Memoria del Proceso | Documento participativo | Fuera del alcance del sistema |

> El antiguo **PSL-NHS** se retira de este catálogo como producto independiente (§0):
> pasa a ser, a lo sumo, una **representación derivada del Perfil**, sin compilador ni
> artefacto propio garantizado.

---

### 2.1 Perfil de Salud Local COMPÁS (PSL-C)

| Campo | Valor |
|---|---|
| **Objetivo** | Documentar el estado de salud del territorio de forma trazable y revisable |
| **Destinatarios** | Equipo técnico local, Distrito Sanitario, Junta de Andalucía |
| **Momento del ciclo** | Al completar el diagnóstico territorial (antes de la priorización formal) |
| **Entradas** | `LocalHealthProfile` en estado `validated` |
| **Salidas** | Documento institucional exportable; lectura única y **adaptativa** (sin recuento obligatorio de capítulos, ver §0) |
| **Dependencias** | Requiere Informe de Salud, al menos un Estudio Complementario y PSL validado |
| **Compilador** | `LocalHealthProfileCompiler` |
| **Contrato pendiente** | `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` |

### 2.2 Perfil tipo NHS Health Profiles (PSL-NHS)

| Campo | Valor |
|---|---|
| **Objetivo** | Comunicar el estado de salud en formato editorial accesible y comparativo |
| **Destinatarios** | Corporación municipal, comunidad, prensa, público no técnico |
| **Momento del ciclo** | Paralelo o posterior al PSL-C; usable en sesiones de priorización comunitaria |
| **Entradas** | `LocalHealthProfile` en estado `validated` + datos de referencia (Granada/Andalucía) |
| **Salidas** | Documento editorial de alta densidad; comparativo; sin jerga técnica |
| **Dependencias** | PSL-C validado; datos de referencia disponibles |
| **Compilador** | `NHSHealthProfileCompiler` |
| **Contrato pendiente** | `CONTRACT-NHS-HEALTH-PROFILE-COMPILER` |
| **Limitación actual** | Datos de referencia Granada/Andalucía no disponibles |

### 2.3 Plan Local de Salud (PLS)

| Campo | Valor |
|---|---|
| **Objetivo** | Comprometer institucionalmente al municipio con un plan de acción en salud |
| **Destinatarios** | Municipio, Distrito Sanitario, Junta de Andalucía, comunidad |
| **Momento del ciclo** | Al completar la priorización, la traducción estratégica y la validación del plan |
| **Entradas** | PSL `approved` + PrioritizationResult + StrategicTranslationResult + ActionPlanDraft validado + AgendaDraft validado + MonitoringDraft |
| **Salidas** | Documento institucional completo del proceso de planificación |
| **Dependencias** | Todos los productos anteriores del ciclo |
| **Compilador** | `LocalHealthPlanCompiler` |
| **Contrato pendiente** | `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` (prerequisito del compilador) |

### 2.4 Resumen Ejecutivo (RE)

| Campo | Valor |
|---|---|
| **Objetivo** | Comunicar el proceso y sus resultados a audiencias no técnicas en 1-2 páginas |
| **Destinatarios** | Alcaldía, corporación municipal, prensa, comunidad |
| **Momento del ciclo** | Junto al Plan Local de Salud |
| **Entradas** | Síntesis del PSL-C + prioridades seleccionadas + compromisos del Plan |
| **Salidas** | Documento breve de alta síntesis |
| **Dependencias** | PLS completado |
| **Posición** | Puede ser sección inicial del PLS o documento separado (definir en CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT) |
| **Estado** | Sin definición estructural |

### 2.5 Cuestionario Municipal (CM)

| Campo | Valor |
|---|---|
| **Objetivo** | Definir metodológicamente un instrumento de medición municipal |
| **Destinatarios** | Equipo técnico, metodólogos, coordinadores de estudio |
| **Momento del ciclo** | Antes de la captura de datos (upstream del EvidenceStore) |
| **Entradas** | Módulos de la Biblioteca Metodológica + Bloques de clasificación |
| **Salidas** | `QuestionnaireDefinition`: definición metodológica completa del instrumento |
| **Nota** | No es el Diccionario REDCap. El CM define el instrumento; el DD lo implementa en REDCap. |
| **Estado** | Infraestructura de dominio/aplicación implementada; sin UI ni ClassificationBlocks |

### 2.6 Diccionario REDCap (DD)

| Campo | Valor |
|---|---|
| **Objetivo** | Configurar el proyecto REDCap para la captura de datos del cuestionario municipal |
| **Destinatarios** | Administradores REDCap, coordinadores técnicos |
| **Momento del ciclo** | Inmediatamente antes del lanzamiento del estudio en REDCap |
| **Entradas** | `QuestionnaireDefinition` con todos los módulos completos (redcapFormField requerido) |
| **Salidas** | CSV de Data Dictionary + branching logic + calculated fields + metadata |
| **Dependencias** | Todos los módulos referenciados deben existir en el registry con adaptador REDCap |
| **Estado** | `RedcapDictionaryBuilder`, `RedcapDictionaryCsvExporter` implementados; sin UI |

### 2.7 Anexo Técnico Metodológico (AT)

| Campo | Valor |
|---|---|
| **Objetivo** | Documentar el rigor metodológico del proceso para auditoría y revisión por pares |
| **Destinatarios** | Revisores metodológicos, Junta de Andalucía, organismos de evaluación |
| **Momento del ciclo** | Junto al PSL-C o al PLS |
| **Entradas** | Metadata de la Biblioteca Metodológica + EvidenceStore statistics + quality assessments + cautelas declaradas |
| **Salidas** | Nota metodológica detallada: instrumentos, fuentes, limitaciones, calidad muestral |
| **Estado** | Sin definición estructural. Sin compilador. |

### 2.8 Memoria del Proceso (MEM)

| Campo | Valor |
|---|---|
| **Objetivo** | Documentar el proceso participativo y deliberativo que acompañó la planificación |
| **Destinatarios** | Comunidad, instituciones, futuras ediciones del plan |
| **Momento del ciclo** | A lo largo de todo el proceso |
| **Entradas** | Documentos endocualitativos (actas, acuerdos, registros de participación) |
| **Salidas** | Memoria narrativa del proceso |
| **Posición arquitectónica** | El sistema puede albergar estos documentos en el Repositorio Documental como evidencia endocualitativa (FOUNDATIONS — Principio endocualitativo). No los genera: los preserva. |
| **Estado** | Fuera del alcance del compilador; responsabilidad humana. |

---

## 3. Perfil de Salud Local COMPÁS — Especificación

### 3.1 Finalidad

El PSL-C es el documento que certifica que el equipo técnico ha realizado un diagnóstico
territorial estructurado, trazable y metodológicamente coherente del estado de salud del
municipio. No es un estudio epidemiológico. No es un informe médico. Es la síntesis
analítica del proceso de conocimiento territorial que COMPÁS NG facilita.

Su valor institucional reside en que:
- Cualquier usuario externo puede verificar de dónde procede cada afirmación.
- El equipo técnico ha validado explícitamente el contenido.
- Las conclusiones y recomendaciones son autoría humana, no del sistema.
- El PSL validado es el objeto que autoriza al municipio a entrar en la fase de planificación.

### 3.2 Papel dentro del sistema

El PSL-C es la primera forma compilada del `LocalHealthProfile`. Este objeto tiene
existencia interna en el sistema (como objeto del Nivel 2); el PSL-C es su representación
como documento exportable y entregable.

Esta distinción tiene consecuencias arquitectónicas:
- El `LocalHealthProfile` es un objeto vivo que se recalcula cuando cambia la evidencia.
- El PSL-C es una instantánea del `LocalHealthProfile` en estado `validated` en un momento preciso.
- El PSL-C no puede desactualizarse: es una captura formal del diagnóstico validado.

### 3.3 Relación con el MIT

El MIT produce el `EstadoTerritorialEvolutivo`, que el `buildLocalHealthProfile`
sintetiza en los capítulos III y IV del PSL. El PSL-C no expone al lector los detalles
del MIT (LT1, OIT, tensiones, filtro de relevancia): expone la lectura territorial resultante
en lenguaje institucional.

Los capítulos del MIT que se convierten en contenido del PSL-C:
- Capítulo III: estadísticas del EvidenceStore (conteos por origen, por tipo, advertencias).
- Capítulo IV: lectura territorial (resumen narrativo, determinantes, activos, indicadores,
  hallazgos participativos, cautelas, tensiones, áreas de intervención).

El PSL-C no expone jamás términos técnicos del pipeline al lector institucional.
No aparecen `LT1Result`, `OITResult`, `EvidenceAtom`, `stableAssetKey` ni
`requiresHumanValidation` como texto visible en el documento.

### 3.4 Relación con el EvidenceStore

El capítulo III del PSL-C documenta el EvidenceStore: cuánta evidencia existe, de qué
fuentes, con qué calidad. No reproduce los átomos individuales: los referencia por IDs
y presenta estadísticas agregadas.

Esta relación es unidireccional: el PSL-C lee el EvidenceStore; nunca lo modifica.
El PSL-C no puede ser más fiable que el EvidenceStore que lo generó.

### 3.5 Papel como documento institucional

El PSL-C tiene un ciclo de vida formal:
- Es producido por el equipo técnico (validado por persona identificada con fecha).
- Puede ser presentado al Distrito Sanitario y a la Junta de Andalucía.
- Puede usarse como punto de partida de sesiones de priorización comunitaria.
- Puede ser sustituido si el diagnóstico territorial cambia significativamente.

El PSL-C NO es:
- El Plan Local de Salud (que es un compromiso de planificación, no un diagnóstico).
- El Informe de Salud municipal (que es la fuente primaria de la que el PSL se deriva).
- Un documento de decisión (no establece prioridades ni compromisos de actuación).

### 3.6 Estructura mínima prevista del PSL-C

La estructura documental del PSL-C debe formalizarse en
`CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER`. Como guía de diseño:

| Sección | Origen en el PSL | Autoría |
|---|---|---|
| Portada institucional | Metadatos del workspace | Sistema |
| Marco estratégico de referencia | Capítulo I | Sistema |
| Fuente diagnóstica primaria | Capítulo II (ref. Informe de Salud) | Sistema |
| Base documental y evidencias | Capítulo III | Sistema |
| Lectura territorial | Capítulo IV | Sistema |
| Conclusiones | Capítulo V | **Humana** (no scaffold) |
| Recomendaciones | Capítulo VI | **Humana** (no scaffold) |
| Síntesis y priorización | Capítulo VII | **Humana** (deliberación documentada) |
| Nota de validación | Metadatos del PSL | Sistema |
| Cautelas metodológicas | Resultado del IntegrityGuard | Sistema |

Los capítulos V, VI y VII solo pueden ser `authored` (no `scaffold`) para que el PSL-C
sea compilable. Un PSL con capítulos en estado `scaffold` no puede producir PSL-C.

---

## 4. Perfil tipo NHS Health Profiles — Análisis y especificación

> **SECCIÓN SUPERADA (ver §0).** Registro de diseño histórico. No es autoridad
> vigente: el PSL-NHS ya no es un producto institucional independiente; sus
> capacidades solo podrían sobrevivir como representación derivada dentro del Perfil.

### 4.1 Qué son los NHS Local Health Profiles

> **Nota de actualización empírica (2026-09-24):** esta sección se conserva como
> registro histórico de benchmark. La consulta vigente del referente OHID/DHSC
> Fingertips identifica el perfil público `Local Authority Health Profiles`
> (`profile_id=26`) y el grupo `All indicators` (`group_id=1938132701`) con 72
> indicadores para autoridades locales en la configuración actual. Por tanto, las
> menciones históricas a 43 indicadores no deben tratarse como descripción actual
> del referente, sino como fotografía del diseño analizado en 2026-06-28.

Los NHS Local Health Profiles (actualmente mantenidos por OHID — Office for Health
Improvements and Disparities, antigua Public Health England) son perfiles anuales
de salud territorial producidos para cada área administrativa de Inglaterra.

Sus características definitorias:
- **43 indicadores** organizados en cuatro dominios: marcadores globales (esperanza de vida,
  mortalidad prematura), determinantes sociales (privación, empleo, educación, vivienda),
  conductas de salud (tabaquismo, obesidad, actividad física, alcohol) y resultados de salud
  (mortalidad cardiovascular, cáncer, salud mental, salud materno-infantil).
- **Gráfico de espina** (*spine chart*): un gráfico de barras horizontal donde el centro
  es la media nacional. Las barras se extienden a la izquierda (peor que la media) o a la
  derecha (mejor). El color codifica la significación estadística: rojo (significativamente
  peor), verde (significativamente mejor), gris (sin diferencia significativa).
- **Densidad informativa alta**: para cada indicador, valor local, intervalo de confianza,
  referencia nacional y tendencia temporal en un espacio compacto.
- **Sin texto narrativo**: el documento es casi exclusivamente datos, tablas y el gráfico
  de espina. No hay secciones de análisis editorial.
- **Actualizados anualmente** de forma automática desde fuentes de datos nacionales del NHS.
- **Públicos y descargables** en PDF y en plataforma interactiva (Fingertips).

### 4.2 Qué principios son transferibles a COMPÁS NG

**Transferibles:**

- La idea de **comparación como principio estructurador**: un indicador sin referencia no
  comunica. La comparación contra Granada o Andalucía es lo que da significado al dato
  municipal.
- La **densidad editorial**: un documento que concentra mucha información en poco espacio,
  sin decoración. Más tabla que texto. Más datos que palabras.
- La **organización por dominios**: determinantes sociales → conductas → resultados.
  Esta secuencia tiene coherencia metodológica: los determinantes explican las conductas;
  las conductas influyen en los resultados. Es la cadena causal implícita en la salud pública.
- La **marca de significación estadística**: no todo valor diferente es un hallazgo relevante.
  Distinguir lo estadísticamente significativo de la variación natural es un principio de rigor.
- El **formato adecuado para audiencias diversas**: el perfil NHS es legible por un técnico
  y por un político. No requiere conocimientos metodológicos para entender que el municipio
  tiene un indicador de obesidad significativamente peor que la media.
- La **portabilidad del documento**: diseñado para ser entendido fuera de la aplicación,
  impreso o distribuido, sin necesidad de acceso al sistema que lo generó.

**No transferibles:**

- Los **43 indicadores fijos**: en España, y especialmente en municipios pequeños de
  Andalucía, no existen fuentes de datos anuales para 43 indicadores con fiabilidad
  estadística. La infraestructura de datos del NHS es incomparable con la española.
- La **actualización automática anual**: COMPÁS NG no tiene acceso a feeds de datos
  nacionales. Los datos provienen de estudios que el equipo técnico administra y carga.
- El **formato interactivo en línea**: el PSL-NHS de COMPÁS NG es un documento exportable,
  no una plataforma de consulta permanente.
- La **comparación automática con la media nacional**: España no tiene la infraestructura
  de datos territoriales equivalente al NHS England para hacer esto de forma fiable y automática.

### 4.3 El PSL-NHS dentro de COMPÁS NG

El PSL-NHS es una **reinterpretación del principio editorial NHS** aplicada a los datos
disponibles en COMPÁS NG. No es una copia del modelo inglés.

Lo que hace el PSL-NHS:
- Presenta los resultados de los 6 estudios complementarios en un formato editorial de alta
  densidad, análogo al gráfico de espina.
- Muestra indicadores del Informe de Salud si están disponibles.
- Compara cada indicador contra las referencias de Granada y Andalucía cuando existen.
- No incluye texto narrativo de análisis. Solo datos, comparaciones y marcas de significación.
- Puede entregarse a la corporación municipal en una reunión de trabajo sin formación técnica.
- Puede imprimirse en dos páginas.

Lo que el PSL-NHS no hace:
- No reproduce el análisis territorial del MIT (eso es el PSL-C).
- No incluye las conclusiones ni recomendaciones del equipo técnico.
- No presenta áreas de intervención ni candidaturas de priorización.
- No sustituye al PSL-C: es complementario.

### 4.4 Requisito que bloquea el PSL-NHS

El PSL-NHS requiere datos de referencia (Granada/Andalucía) para cada indicador.
Sin estos datos, los gráficos de espina no tienen valor comparativo.

Actualmente: todos los paneles de estudios muestran "sin referencia disponible".

**El PSL-NHS no puede ser plenamente funcional sin datos de referencia.** Esta es
una limitación metodológica, no técnica. El `NHSHealthProfileCompiler` puede
implementarse con valores de referencia en `null`, pero el producto resultante
tendrá valor reducido hasta que los datos estén disponibles.

---

## 5. Plan Local de Salud — Especificación metodológica

### 5.1 Qué representa

El Plan Local de Salud (PLS) es el **documento de compromiso institucional** que formaliza
el proceso de planificación local de salud. No es un análisis. No es un diagnóstico.
Es el resultado de un proceso que combina conocimiento técnico, deliberación comunitaria
y decisión institucional, y que queda comprometido públicamente ante el municipio y
la Junta de Andalucía.

Su naturaleza como documento institucional implica que:
- Tiene validez formal ante la Junta de Andalucía como resultado del proceso RELAS.
- Compromete al municipio con actuaciones, plazos y responsables.
- Puede auditarse en el tiempo: las actuaciones comprometidas deben poder evaluarse.
- Es el documento que cierra un ciclo de planificación y abre el siguiente.

### 5.2 Qué objetos consume

El PLS integra todos los outputs validados del ciclo de planificación:

| Objeto consumido | Contenido que aporta al PLS |
|---|---|
| `LocalHealthProfile` (`approved`) | Diagnóstico territorial: el PSL-C es su capítulo de diagnóstico |
| `ThematicPrioritisation` (resultado del proceso participativo) | Prioridades seleccionadas por la ciudadanía |
| `StrategicTranslationResult` | Alineación con marcos institucionales (EPVSA, ESCA, RELAS, etc.) |
| `ActionPlanDraft` (validado) | Objetivos, actuaciones, responsables, indicadores |
| `AgendaDraft` (validado) | Calendario de implementación |
| `MonitoringDraft` | Marco de seguimiento y evaluación |

Ninguno de estos objetos puede ser sustituido por una propuesta del sistema no validada.
El PLS contiene compromisos institucionales, no borradores técnicos.

### 5.3 Qué decisiones humanas incorpora

El PLS es el producto donde la proporción de autoría humana es máxima:

| Elemento | Autoría |
|---|---|
| Diagnóstico territorial (caps. V y VI del PSL) | Humana (el sistema genera scaffold; el equipo lo redacta) |
| Prioridades de salud | Humana (proceso deliberativo comunitario documentado) |
| Objetivos estratégicos | Humana (el sistema sugiere desde el MTE; el equipo decide) |
| Actuaciones del Plan de Acción | Humana (el sistema genera borrador; el equipo valida) |
| Responsables y plazos | Humana (no existe dato en el sistema) |
| Recursos asignados | Humana (no existe dato en el sistema) |
| Marco de seguimiento definitivo | Humana (el sistema provee estructura; el equipo completa) |

### 5.4 Qué partes pueden generarse automáticamente

Solo pueden generarse automáticamente las partes que derivan directamente del pipeline
de COMPÁS NG y que son explícitamente borradores técnicos:

- La portada y metadatos del municipio.
- La descripción del marco estratégico de referencia (Capítulo I del PSL compilado).
- Las estadísticas de evidencia del diagnóstico (Capítulo III del PSL).
- La lectura territorial del MIT (Capítulo IV del PSL).
- Los candidatos a priorización técnica (áreas de intervención del OIT).
- Las sugerencias de alineación estratégica (output del MTE, con cautelas).
- Los borradores de objetivos y actuaciones del Plan de Acción.
- La trimestrización orientativa de la Agenda.
- La estructura del marco de seguimiento.

Todo lo anterior lleva `requiresHumanValidation: true` en el sistema y debe
marcarse explícitamente en el documento como borrador técnico orientativo.

### 5.5 Qué partes no deben automatizarse nunca

- Las conclusiones del equipo técnico sobre el diagnóstico.
- Las recomendaciones de intervención.
- La documentación de la deliberación comunitaria (quién participó, qué se discutió, cómo se alcanzó el consenso).
- Los compromisos definitivos (responsables institucionales, asignación de recursos, plazos comprometidos).
- La aprobación del plan por parte de los órganos municipales.
- Los informes de seguimiento de la ejecución real.

Automatizar cualquiera de estos elementos produciría un documento que parecería
un Plan Local de Salud pero que no lo sería metodológicamente.

### 5.6 Contratos previos necesarios

El PLS no puede diseñarse ni compilarse sin:

1. **CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT**: define la estructura documental del PLS
   (secciones obligatorias, secciones opcionales, formato, nivel de detalle, relación
   con el PSL-C, posición del Resumen Ejecutivo, coherencia con la metodología RELAS).
   **Este es el contrato que debe crearse primero.**

2. **CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER**: el PSL-C compilado es el capítulo de
   diagnóstico del PLS. Sin definir el PSL-C, no puede definirse el PLS.

3. **CONTRACT-STRATEGIC-TRANSLATION implementado**: el MTE debe estar operativo para
   que el capítulo de encaje estratégico del PLS tenga contenido.

---

## 6. Familia de compiladores

Los compiladores son motores de exportación documental. Transforman objetos ya validados
en artefactos institucionales exportables. No analizan, no interpretan, no proponen.

### 6.1 LocalHealthProfileCompiler

| Campo | Valor |
|---|---|
| **Entrada** | `LocalHealthProfile` en estado `validated` con caps. V y VI en estado `authored` y cap. VII con deliberación documentada |
| **Producto** | PSL-C: documento institucional de diagnóstico territorial |
| **Restricciones** | No puede compilar un PSL con capítulos en estado `scaffold`. Solo produce PSL-C a partir de PSL validado explícitamente por el equipo técnico |
| **Gates** | `psl.status === "validated"` + `conclusiones.status === "authored"` + `recomendaciones.status === "authored"` |
| **Dependencias** | Ninguna de los compiladores de planificación. Puede ejecutarse de forma independiente. |
| **Contrato** | `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` (pendiente de crear) |
| **Sprint** | Sprint 2 |

### 6.2 NHSHealthProfileCompiler

> **SECCIÓN SUPERADA (ver §0).** El `NHSHealthProfileCompiler` no es un compilador de
> producto propio en el estado objetivo; su retirada es migración técnica ejecutada (PR-E).

| Campo | Valor |
|---|---|
| **Entrada** | `LocalHealthProfile` en estado `validated` + datos de referencia (opcional, mejora el producto) |
| **Producto** | PSL-NHS: perfil de alta densidad editorial con indicadores comparativos |
| **Restricciones** | Sin datos de referencia, el gráfico de espina no tiene valor comparativo. El compilador puede ejecutarse igualmente pero debe declarar explícitamente la ausencia de referencias. |
| **Gates** | `psl.status === "validated"` |
| **Dependencias** | Independiente del LocalHealthProfileCompiler. Puede ejecutarse en paralelo. |
| **Contrato** | `CONTRACT-NHS-HEALTH-PROFILE-COMPILER` (pendiente de crear) |
| **Sprint** | Sprint 2 |

### 6.3 LocalHealthPlanCompiler

| Campo | Valor |
|---|---|
| **Entradas** | `LocalHealthProfile` (`approved`) + `PrioritizationResult` + `StrategicTranslationResult` + `ActionPlanDraft` (validado) + `AgendaDraft` (validado) + `MonitoringDraft` |
| **Producto** | PLS: Plan Local de Salud como documento institucional completo |
| **Restricciones** | Es el compilador con mayor número de prerequisites. No puede ejecutarse sin PSL aprobado. No puede ejecutarse sin MTE operativo. No puede ejecutarse sin CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT. |
| **Gates** | `psl.status === "approved"` + todos los inputs del Nivel 3 validados + `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` aprobado |
| **Dependencias** | Depende de LocalHealthProfileCompiler (el PSL-C es su capítulo de diagnóstico). Depende del MTE. |
| **Contrato** | `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` (prerequisito) + `CONTRACT-LOCAL-HEALTH-PLAN-COMPILER` |
| **Sprint** | Sprint 2 — segunda mitad (depende de CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT) |

### 6.4 ExecutiveSummaryCompiler

| Campo | Valor |
|---|---|
| **Posición** | Pendiente de definir: ¿sección del PLS o documento independiente? |
| **Entrada** | `LocalHealthPlanDocument` completado |
| **Producto** | RE: Resumen ejecutivo de 1-2 páginas |
| **Restricciones** | No puede diseñarse antes de que CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT resuelva su posición. Si el RE es una sección del PLS, lo produce el LocalHealthPlanCompiler. Si es independiente, necesita su propio compilador. |
| **Decisión pendiente** | Ver §7, Producto Inexistente P-3 |
| **Sprint** | Sprint 2 o Sprint 3 (depende de la decisión anterior) |

### 6.5 TechnicalAppendixCompiler

| Campo | Valor |
|---|---|
| **Entrada** | Metadata de la Biblioteca Metodológica + EvidenceStore statistics + `IntegrityGuardResult` |
| **Producto** | AT: Nota técnica metodológica |
| **Restricciones** | El motor SAM está disponible desde Producto 2 (2026-06-29). Para integrar la calidad muestral en el Anexo Técnico, consume `computeSampleQualityAssessment()` directamente. La Tripirámide visual (visualización de resultados SAM) queda pendiente. |
| **Gates** | `psl.status === "validated"` |
| **Dependencias** | Ninguna del resto de compiladores. |
| **Contrato** | Pendiente de crear |
| **Sprint** | Sprint 2 (versión básica); integración SAM en calidad muestral disponible ahora (motor Producto 2) |

### 6.6 REDCapCompiler

El REDCapCompiler no es un compilador homogéneo. Internamente trabaja con tres capas
independientes que nunca deben mezclarse.

#### Capa 1 — Metodológica

Contiene las decisiones científicas del instrumento. No pertenece al compilador:
proviene de la Biblioteca Metodológica y del Constructor.

| Elemento | Origen |
|---|---|
| `MethodologicalModule` | Biblioteca Metodológica |
| `ClassificationBlock` | Registro de bloques de clasificación |
| `QuestionnaireDefinition` | Constructor Metodológico |
| Algoritmos de scoring | `MethodologicalModule.algorithm` |
| Branching logic (semántica) | `MethodologicalModule.items` + `adapters.redcap` |
| Variables derivadas (definición) | `MethodologicalModule.dimensions` |

Esta capa no contiene ninguna decisión de presentación visual. Cambiar un umbral
metodológico no debe afectar al aspecto del cuestionario. Cambiar el estilo de las
tarjetas no debe afectar a ninguna variable ni a su lógica.

#### Capa 2 — REDCap Estructural

Contiene la traducción al formato técnico de REDCap. Es la capa que el compilador
ya genera parcialmente.

| Elemento | Descripción |
|---|---|
| Data Dictionary | CSV con 18 columnas canónicas de REDCap |
| Instruments / Forms | Agrupación de campos por formulario |
| Field types | `text`, `radio`, `checkbox`, `yesno`, `descriptive`, `calc` |
| Variable names | Nombres de campo REDCap (`fieldName`) |
| Choices | Cadenas de opciones codificadas (`1, Opción \| 2, Opción`) |
| Branching logic | Expresiones REDCap para mostrar/ocultar campos |
| Calculated fields | Fórmulas REDCap (`if`, `sum`, `round`, `datediff`...) |
| Field annotations | Directivas REDCap (`@HIDDEN`, `@CALCTEXT`, etc.) |

Los campos `calc` incluyen dos subcategorías con roles distintos:
- **Variables intermedias ocultas** (`@HIDDEN`): indicadores parciales del scoring,
  flags de control de flujo. No son visibles al participante.
- **Variables de resultado visibles**: scores finales que pueden mostrarse en el
  informe REDCap o en el panel de resultados.

#### Capa 3 — Visual / Editorial REDCap

Contiene la presentación institucional del cuestionario dentro de REDCap.
Esta capa es completamente independiente de las dos anteriores: puede aplicarse
o no sin alterar ningún dato ni ninguna lógica.

REDCap permite embeber HTML en cuatro puntos:
- **`Field Label`**: etiqueta visible de cada campo (texto de la pregunta).
- **`Section Header`**: encabezado de bloque entre grupos de preguntas.
- **`Field Label` de campos `descriptive`**: bloques de texto o imagen sin datos.
- **Choices**: en casos excepcionales, opciones con texto enriquecido.

La capa visual explota estos cuatro puntos para aplicar la identidad COMPÁS:

| Elemento visual | Punto REDCap | Descripción |
|---|---|---|
| **Portada institucional** | `descriptive.fieldLabel` | Franja de color COMPÁS, logotipo, título del estudio, descripción, instrucciones |
| **Encabezado de bloque** | `sectionHeader` | Separador con `border-top`, `border-bottom`, fondo institucional y título de bloque |
| **Tarjeta de pregunta** | `fieldLabel` (todo tipo de campo) | Envoltorio `<div>` con borde, borde-radio y padding; la pregunta vive dentro de la tarjeta |
| **Nota metodológica** | `descriptive.fieldLabel` | Bloque con borde izquierdo institucional y tipografía menor; contextualiza la escala |
| **Separador de sección** | `descriptive.fieldLabel` | Línea divisoria entre el cuestionario y el informe de resultados |
| **Tarjeta de resultado** | `descriptive.fieldLabel` | Muestra el score calculado con fondo de color codificado según resultado |

**Paleta COMPÁS en el contexto REDCap:**

La capa visual usa exclusivamente la paleta institucional definida en VISUAL-CONTRACT:
`#0074c8` (azul), `#00acd9` (azul claro), `#94d40b` (verde), `#ffb61b` (ámbar),
`#ff6600` (naranja), `#dc143c` (rojo). No usa colores ajenos al VISUAL-CONTRACT.

**Restricción tipográfica:** REDCap no garantiza la carga de fuentes externas.
Las fuentes en HTML deben ser del sistema: `'Segoe UI', Tahoma, Geneva, Verdana,
sans-serif` como primera opción; `Georgia, 'Times New Roman', serif` para textos
formales. No se usan Google Fonts ni fuentes embebidas.

**Restricción de CSS:** REDCap acepta estilos `inline` en HTML. No acepta `<style>`
ni `<link>` externos. Todo estilo de la capa visual debe ser `inline`.

#### Dos niveles de salida

El REDCapCompiler debe poder generar exactamente dos niveles:

**Nivel 1 — Diccionario REDCap funcional mínimo**

Capa 1 + Capa 2 únicamente. Sin HTML en `Field Label`, sin HTML en `Section Header`.
Sin campos `descriptive` de presentación ni de resultado.

- Legible directamente en cualquier instalación REDCap, incluidas versiones antiguas.
- Auditable metodológicamente: el revisor ve el contenido sin ruido visual.
- Importable sin dependencias de HTML o CSS.
- Útil para revisión metodológica, validación científica o entornos REDCap restrictivos.

**Nivel 2 — Diccionario REDCap institucional COMPÁS**

Capa 1 + Capa 2 + Capa 3 completa. Incluye HTML en todos los puntos aplicables.

- Produce cuestionarios con identidad visual COMPÁS dentro de REDCap.
- Incluye portada institucional (campo `descriptive`).
- Pregunta cada ítem en tarjeta con borde y padding.
- Añade encabezados de bloque con HTML entre grupos temáticos.
- Incluye sección de resultados con campos `descriptive` que muestran scores calculados.
- El participante percibe el cuestionario como un documento institucional, no un formulario genérico.

Los dos niveles producen exactamente las mismas variables, la misma branching logic
y los mismos campos calculados. Solo difieren en los valores de `fieldLabel`,
`sectionHeader` y en la presencia o ausencia de campos `descriptive` visuales.

#### Relación con el VISUAL-CONTRACT

La capa visual REDCap **no sustituye** al VISUAL-CONTRACT general de la aplicación.
Son capas complementarias con alcances distintos:

| Ámbito | Documento de referencia |
|---|---|
| Identidad visual de la aplicación React (colores, tipografía, composición) | `VISUAL-CONTRACT` |
| Semántica de navegación (vocabulario visible, espacios de trabajo, Home, ciclo) | `CONTRACT-NAVIGATION` |
| Documentos institucionales compilados (PSL-C, PLS, PSL-NHS) | Contratos de compilador específicos |
| HTML en diccionarios REDCap | `CONTRACT-REDCAP-VISUAL-TEMPLATE` (ver §7) |

El VISUAL-CONTRACT establece los principios de identidad. La capa visual REDCap
es la adaptación de esos principios a las posibilidades y restricciones de REDCap.

#### Tabla consolidada del REDCapCompiler

| Campo | Valor |
|---|---|
| **Entradas** | `QuestionnaireProject` + `RedcapVisualTemplate` (opcional) |
| **Producto funcional** | DD-mínimo: CSV sin HTML (Nivel 1) |
| **Producto institucional** | DD-COMPÁS: CSV con capa visual (Nivel 2) |
| **Restricciones** | Módulos con `redcapFormField` completo obligatorios; HTML solo en `Field Label`, `Section Header` y `descriptive`; estilos exclusivamente inline |
| **Gate Nivel 1** | Todos los módulos con `redcapFormField` en el registry |
| **Gate Nivel 2** | Nivel 1 + `RedcapVisualTemplate` aprobada + `CONTRACT-REDCAP-VISUAL-TEMPLATE` vigente |
| **Estado actual** | `RedcapDictionaryBuilder` y `RedcapDictionaryCsvExporter` generan Nivel 1 básico. Sin plantilla visual. Sin UI. Sin ClassificationBlocks. |
| **Contrato estructural** | `CONTRACT-COMPLEMENTARY-STUDIES §6` (Constructor documentado) |
| **Contrato visual** | `CONTRACT-REDCAP-VISUAL-TEMPLATE` (pendiente — ver §7) |
| **Sprint** | Sprint 2 (Nivel 1 completo + UI); `CONTRACT-REDCAP-VISUAL-TEMPLATE` en Sprint 2 |

---

## 7. Productos todavía inexistentes que bloquean el desarrollo

### P-1 — CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT

**Qué bloquea:** el LocalHealthPlanCompiler no puede diseñarse sin saber qué compila.
El PLS no puede estructurarse sin un contrato que defina sus secciones.

**Preguntas que debe responder:**
- ¿Qué secciones obligatorias tiene el Plan Local de Salud en el contexto RELAS?
- ¿Cómo se integra el PSL-C (o su equivalente compilado) en el PLS?
- ¿El Resumen Ejecutivo es una sección del PLS o un documento independiente?
- ¿Cómo se presenta la traducción estratégica (EPVSA, ESCA, RELAS) en el PLS?
- ¿Qué formato de exportación es institucional (HTML, PDF, DOCX)?
- ¿Cuál es el nivel mínimo de autoría humana requerida para compilar un PLS?
- ¿Cómo se documenta el proceso participativo en el PLS?

**Quién debe responder:** el equipo técnico de COMPÁS NG y el conocimiento de la metodología RELAS.
No puede ser definido unilateralmente desde el software.

**Impacto de no resolverlo:** sin este contrato, el LocalHealthPlanCompiler no puede diseñarse.
El PLS como producto institucional no existe para el sistema.

### P-2 — Estructura y contenido del Resumen Ejecutivo

**Qué bloquea:** el ExecutiveSummaryCompiler o la sección correspondiente del PLS.

**Preguntas que debe responder:**
- ¿Es el RE una sección inicial del PLS o un documento independiente?
- Si es independiente, ¿qué elementos del PLS sintetiza?
- ¿Cuál es la audiencia exacta (alcaldía, pleno, prensa, comunidad)?
- ¿Cuánto espacio ocupa (1 página, 2 páginas, 4 páginas)?
- ¿Tiene gráficos o es exclusivamente texto?

**Recomendación:** definir en CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT como la sección inicial
del PLS, extraíble como documento independiente. Simplifica la arquitectura de compiladores.

### P-3 — Estructura documental del PSL-NHS

**Qué bloquea:** el `NHSHealthProfileCompiler` y la resolución de la tensión entre
PSL-C y PSL-NHS en la interfaz.

**Preguntas que debe responder:**
- ¿Cuántos indicadores incluye? ¿Cuáles son? ¿De qué fuentes?
- ¿Qué formato tiene el gráfico de espina? ¿Una barra por indicador? ¿Una barra por dominio?
- ¿Cómo se presenta la ausencia de datos de referencia?
- ¿Tienen los 6 estudios EAS peso suficiente para construir este perfil sin el Informe de Salud?

**Nota sobre la tensión con el VISUAL-CONTRACT:** *(superado por §0)* la antigua
tensión sobre si PSL-C y PSL-NHS debían tener compiladores distintos queda resuelta:
el Perfil es único; el PSL-C es su compilación institucional. No procede un compilador
NHS separado como producto propio.

### P-4 — Circuito Survey → EvidenceStore

**Qué bloquea:** el ciclo completo del Constructor Metodológico. Sin este circuito,
la Encuesta Municipal genera datos en REDCap que nunca regresan al sistema.

**El problema:** el REDCap Compiler genera un Diccionario. REDCap administra el cuestionario.
Los resultados regresan como exportación CSV. No existe un parser que convierta
esa exportación en EvidenceAtoms.

**Opciones arquitectónicas:**
- **Parser genérico**: el Constructor genera también un esquema de parser basado en
  la QuestionnaireDefinition. El parser lee la exportación usando ese esquema.
- **Parser específico**: el equipo técnico implementa un parser para cada cuestionario
  compuesto, siguiendo el patrón §10 de CONTRACT-COMPLEMENTARY-STUDIES.

La primera opción tiene mayor complejidad pero elimina trabajo manual para cada nuevo cuestionario.
La segunda es más simple pero genera deuda por cada cuestionario nuevo.

**Esta decisión debe tomarse antes de implementar el REDCap Compiler completo en Sprint 2.**

### P-5 — Datos de referencia Granada/Andalucía

**Qué bloquea:** el valor comparativo del PSL-NHS y de los paneles de estudios actuales.

**No es un problema del software.** Es un problema de disponibilidad de datos.
Los datos de referencia deben obtenerse de fuentes oficiales (IECA, SSPA, Sistema de
Información Sanitaria de Andalucía) y cargarse en el sistema como recursos de referencia.

La arquitectura para integrar estos datos debe diseñarse en Sprint 2, independientemente
de cuándo estén disponibles los datos.

### P-6 — CONTRACT-REDCAP-VISUAL-TEMPLATE

**Qué bloquea:** la generación del Diccionario REDCap institucional (Nivel 2).
Sin este contrato, el REDCapCompiler solo puede producir diccionarios funcionales mínimos (Nivel 1).

**Naturaleza del contrato:** define la plantilla visual COMPÁS para diccionarios REDCap.
No define contenido metodológico. No define variables. No define algoritmos.
Define exclusivamente los elementos HTML y de estilo que el compilador aplica sobre
el diccionario funcional para producir la versión institucional.

**Preguntas que debe responder:**
- ¿Cuál es la estructura exacta del HTML de portada institucional en REDCap?
- ¿Cuál es la plantilla del encabezado de bloque (`sectionHeader`)?
- ¿Cuál es la plantilla de tarjeta de pregunta (envoltorio del `fieldLabel`)?
- ¿Cuál es la plantilla de nota metodológica (`descriptive`)?
- ¿Cuál es la plantilla de tarjeta de resultado (`descriptive`)?
- ¿Qué tokens de color COMPÁS se usan en cada elemento?
- ¿Qué restricciones de HTML son aceptadas por la versión de REDCap objetivo?
- ¿Cómo se versiona la plantilla cuando REDCap cambia su renderizado?

**¿Debe ser contrato independiente o sección del contrato del REDCapCompiler?**

**Recomendación: contrato independiente.**

Razones:
1. La plantilla visual puede evolucionar (nueva identidad COMPÁS, nueva versión de REDCap)
   sin modificar el contrato estructural del compilador.
2. La plantilla es un recurso transversal: aplica a todos los cuestionarios,
   independientemente de los módulos que contengan.
3. Separa la responsabilidad metodológica de la responsabilidad editorial.
4. Permite que el equipo de comunicación o diseño institucional revise y apruebe
   la plantilla sin revisar el contrato metodológico completo.
5. Es coherente con la separación VISUAL-CONTRACT / ARCHITECTURE-CONSTITUTION
   ya establecida en el proyecto.

**Impacto de no crearlo:** el REDCapCompiler generará siempre diccionarios funcionales
mínimos. Los cuestionarios municipales no tendrán identidad COMPÁS en REDCap.
La experiencia del participante en REDCap no reflejará la identidad institucional del proyecto.

---

## 8. Grafo de dependencias entre productos

Las dependencias son entre productos, no entre componentes software.

```
                ┌─────────────────────────────────┐
                │       CICLO DE CAPTURA          │
                │                                 │
                │  Cuestionario Municipal (CM)    │
                │           │                     │
                │           ▼                     │
                │  Diccionario REDCap (DD)        │
                │           │                     │
                │    [Captura en REDCap]          │
                └───────────┼─────────────────────┘
                            │ (retroalimenta)
                            ▼
            ┌───────────────────────────────────────┐
            │         CICLO DE DIAGNÓSTICO          │
            │                                       │
            │           EvidenceStore               │
            │               │                       │
            │               ▼                       │
            │   Perfil de Salud Local COMPÁS        │
            │         (PSL-C)  ◄──────────────────┐ │
            │           │                          │ │
            │           ▼                          │ │
            │    [PSL-C es el                      │ │
            │     diagnóstico del PLS]             │ │
            └─────────────────────────────────────┘─┘
            (PSL-NHS retirado del grafo como producto
             independiente; ver §0 — sería, a lo sumo,
             una representación derivada del Perfil)
                                 │
                                 ▼
            ┌───────────────────────────────────────┐
            │        CICLO DE PLANIFICACIÓN         │
            │                                       │
            │     Plan Local de Salud (PLS)         │
            │           │                           │
            │    ┌──────┴──────────┐                │
            │    │                 │                │
            │    ▼                 ▼                │
            │ Resumen          Anexo Técnico        │
            │ Ejecutivo (RE)   Metodológico (AT)   │
            └───────────────────────────────────────┘
                                 │
                                 ▼ (cierra el ciclo)
                    [Siguiente ciclo de planificación]
                    [La ejecución del PLS genera nueva evidencia]
                    [longitudinal — Hueco H-8 del Blueprint]
```

**Dependencias críticas:**

| Producto | Requiere primero |
|---|---|
| PSL-C | PSL `validated` con capítulos V, VI, VII en estado `authored`/`complete` |
| PSL-NHS | PSL `validated`; datos de referencia (deseable) |
| PLS | PSL-C + Priorización + MTE + Plan + Agenda + Seguimiento + CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT |
| RE | PLS (o: ser sección inicial del PLS) |
| AT | PSL `validated`; SAM (deseable para calidad muestral) |
| CM | Biblioteca Metodológica completa (6/6) + ClassificationBlocks |
| DD | CM + módulos con `redcapFormField` completo |

---

## 9. Prioridad arquitectónica

### El primer producto que debe congelarse

**CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, que define el Perfil de Salud Local COMPÁS (PSL-C).**

### Justificación

**Razón 1: Es el producto más upstream del ciclo compilado.**
El PSL-C es el primer producto institucional exportable de COMPÁS NG. Todo lo que viene
después (PSL-NHS, PLS, RE, AT) depende de que el PSL-C esté estructurado.
Congelar el PSL-C primero crea el punto de anclaje de todo el sistema de productos.

**Razón 2: El objeto de entrada está definido y estable.**
El `LocalHealthProfile` cubre un conjunto definido de dimensiones de conocimiento; su *proyección editorial* es única y **adaptativa**, sin recuento obligatorio de capítulos *(reconciliado por §0)*.
No hay ambigüedad sobre qué contiene. La única pregunta es cómo compilarlo como documento
institucional. Esta pregunta es respondible hoy.

**Razón 3: Su estructura determina la estructura del PLS.**
El PSL-C es el capítulo de diagnóstico del PLS. No puede estructurarse el PLS sin saber cómo
está estructurado el PSL-C. El CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT que define el PLS depende
de que el PSL-C esté definido antes.

**Razón 4: Desbloquea el NHSHealthProfileCompiler de forma lateral.**
El PSL-NHS parte del mismo `LocalHealthProfile` que el PSL-C. Ambos compilers comparten
el mismo input y pueden diseñarse en paralelo una vez que el PSL-C está congelado.

**Razón 5: Permite iniciar la implementación del Sprint 2 sin bloqueos.**
Con el PSL-C congelado, el equipo puede comenzar a implementar el
`LocalHealthProfileCompiler` sin esperar a que el CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
esté aprobado. El PLS puede seguir diseñándose en paralelo.

### Lo que NO debe congelarse primero

**El PLS no debe congelarse primero.** Requiere demasiados inputs sin definir:
estructura del PSL-C, MTE operativo, resolución del Resumen Ejecutivo.
Intentar definir el PLS antes del PSL-C introduciría acoplamiento prematuro.

**El PSL-NHS no debe congelarse primero.** Antes de diseñar el NHS Profile de COMPÁS NG,
el equipo debe resolver qué indicadores incluir y si los datos de referencia estarán
disponibles. Estas son preguntas metodológicas previas al diseño del compilador.

**El DD (Diccionario REDCap) no debe congelarse primero.** La Biblioteca Metodológica
está completa (13/13 instrumentos con `MethodologicalModule` registrado — H-01 cerrado
2026-07-13). El bloqueo específico de SF-12, Sueño y CAGE está resuelto. El bloqueo
que subsiste es la integración Constructor Metodológico → REDCap → EvidenceStore (H-10).

---

## 10. Verificación de coherencia

### Con ARCHITECTURE-CONSTITUTION

- Art. 5 (separación evidencia/interpretación/propuesta): ✓ El PSL-C contiene solo diagnóstico
  técnico validado. El PLS contiene compromisos humanos deliberados. No se mezclan.
- Art. 4 (primacía del documento original): ✓ Ningún compilador modifica el repositorio.
  Todos leen desde el PSL sin alterar la cadena de evidencia.
- Art. 9 (transparencia metodológica): ✓ Los borradores técnicos automáticos están
  distinguidos de la autoría humana en todos los productos.
- Art. 13 (creación estructural justificada): ✓ Cada compilador responde a un producto
  real con audiencia y finalidad distintas.

### Con OPERATING-CONSTITUTION

- §1 (arquitectura 3 niveles): ✓ PSL-C y PSL-NHS compilan Nivel 2. PLS compila Nivel 3.
- §2 (pipeline de solo lectura): ✓ Ningún compilador escribe en el EvidenceStore ni en el PSL.
- §3 (separación evidencia/interpretación/decisión): ✓ Los 6 capítulos automáticos del PSL-C
  son interpretación; los capítulos V, VI, VII son decisión humana. La distinción se
  mantiene en el documento compilado.

### Con CERTIFICATION-SPRINT-0-1

- Coherente con la familia de compiladores identificada en §9.
- Coherente con el Hueco H-1 (CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT ausente).
- Coherente con la deuda metodológica §8.2 (Biblioteca incompleta afecta al DD y al CM).

### Con BLUEPRINT-PRODUCTION

- Coherente con la posición de los compiladores en el mapa del sistema.
- Elabora el contenido de los "Objetos de productos documentales" (§I.6 del Blueprint).
- Confirma y amplía los Huecos H-1 a H-3 identificados en el Blueprint.

### Con ROADMAP

- Coherente con la secuencia de Sprint 2.
- Confirma que CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT y PSL-C son las dos primeras
  entregas de Sprint 2 antes de implementar compiladores.

### Contradicciones detectadas

**Contradicción C-1: VISUAL-CONTRACT §12.2 vs separación de compiladores**

El VISUAL-CONTRACT §12.2 describe `LocalHealthProfilePanel` como "Generador del Perfil
de Salud Local sintético, inspirado en NHS Local Health Profiles".

**Recomendación *(reconciliada por §0)*:** el Perfil es único; **no** procede un panel
ni un compilador NHS separados como producto propio. Ninguna capacidad
NHS se integra en el Perfil (lectura única y adaptativa, sin
recuento obligatorio de capítulos). La retirada del `NHSHealthProfileCompiler`/panel es
migración técnica ejecutada (PR-E).

**Contradicción C-2: CONTRACT-COMPILER actual es insuficiente**

El CONTRACT-COMPILER describe una única "reserva arquitectónica" genérica denominada
"Compilador del Plan Local de Salud". Con la familia de 6 compiladores identificada en
este documento, el CONTRACT-COMPILER es demasiado estrecho. No cubre LocalHealthProfileCompiler,
NHSHealthProfileCompiler, TechnicalAppendixCompiler ni REDCapCompiler.

**Recomendación:** Mantener CONTRACT-COMPILER como reserva histórica. Crear contratos
específicos para cada compilador (ver §VIII.3 del Blueprint). El CONTRACT-COMPILER
no debe modificarse hasta que se cree el primer contrato específico.

**Nota:** estas contradicciones son menores. No invalidan ningún componente existente.
Son señales de que los documentos fundacionales deben evolucionar junto con la
madurez del modelo de productos institucionales.

---

## Resumen

COMPÁS NG produce **siete** productos institucionales distinguibles (§0; el PSL-NHS
ya no cuenta como producto independiente). El Perfil de Salud Local COMPÁS es el
producto más urgente de congelar porque desbloquea todos los demás. El Plan Local
de Salud no puede estructurarse sin CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT, que a su
vez no puede escribirse sin tener el PSL-C congelado como su capítulo de diagnóstico.

El primer acto del Sprint 2, antes de implementar cualquier compilador, debe ser
redactar y aprobar CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.

---

*Este documento es una especificación metodológica, no un diseño de software.
Toda decisión de implementación derivada de él debe pasar por el proceso de
auditoría definido en OPERATING-CONSTITUTION §7-8.*
