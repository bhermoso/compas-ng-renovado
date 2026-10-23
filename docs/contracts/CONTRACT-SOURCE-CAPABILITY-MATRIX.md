# CONTRACT-SOURCE-CAPABILITY-MATRIX

> Matriz contractual de capacidades de fuente para el Perfil de Salud Local.
> Versión 1.2 — 2026-10-23
> Estado: VIGENTE
>
> Este contrato define qué tipos de información puede soportar, cargar e
> incorporar COMPÁS NG, qué papel metodológico tienen en el Perfil y cómo deben
> comportarse ante el Perfil canónico.

---

## 1. Propósito

El Perfil de Salud Local debe ser **siempre completo** aunque no siempre cuente
con las mismas fuentes. Completo no significa exhaustivo: significa que declara
qué sabe, de dónde procede, con qué escala, qué no sabe y qué cambia cuando se
incorpora una fuente nueva.

Esta matriz evita dos errores:

1. Tratar todas las fuentes como texto indiferenciado.
2. Confundir ausencia de una fuente con ausencia de Perfil.

La matriz es el puente entre `CONTRACT-REPOSITORY`, `CONTRACT-EVIDENCE`,
`CONTRACT-COMPLEMENTARY-STUDIES` y
`CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`.

---

## 2. Conceptos

| Concepto | Definición |
|---|---|
| **Fuente fija** | Fuente que actúa como base primaria del ciclo diagnóstico. En el estado actual, el Informe de Salud. |
| **Fuente variable** | Fuente que puede añadirse, sustituirse o acumularse según el municipio y el momento del proceso. |
| **Fuente atomizable** | Fuente de la que el sistema puede generar `EvidenceAtom` con trazabilidad. |
| **Fuente no atomizable** | Fuente preservada como documento o contexto, sin transformación a evidencia ordinaria. |
| **Fuente estructurada** | Fuente con parser, agregados o campos conocidos: CSV de instrumentos, priorización, dataset GES. |
| **Fuente documental genérica** | DOCX/PDF/texto que entra por selector documental y se clasifica por `DocumentKind`. |
| **Fuente contextual** | Información que contextualiza el territorio pero no debe protagonizar el Perfil ni sustituir evidencia local. |

---

## 3. Matriz de capacidades actuales

| Fuente | Ruta actual | Fija / variable | ¿Genera `EvidenceAtom`? | Papel en Perfil interpretativo | Madurez |
|---|---|---:|:---:|---|---|
| Informe de Salud | `DocumentKind: "health-report"`; `origin: "health-report"` reservado | Fija primaria | No | Base epidemiológica oficial; componente N de la regla N+1. | Activa |
| Estudios complementarios estructurados | CSV de instrumentos; `redcap-export` o `complementary-study`; `origin: "complementary-study"` cuando aplica | Variable | Sí | Indicadores cuantitativos, cautelas, calidad muestral y señales trazadoras. | Activa |
| IBSE | `redcap-export` + tag `"ibse"`; `origin: "ibse"` | Variable canónica por tag | Sí | Bienestar socioemocional escolar y resumen cualitativo derivado. | Activa |
| EAS / REDCap municipales | Parsers de 13 estudios complementarios | Variable | Sí | Salud percibida, apoyo social, alimentación, sueño, actividad física, consumo, salud mental y otros dominios medidos. | Activa parcial por comparadores |
| Exportación REDCap genérica | `DocumentKind: "redcap-export"`; `origin: "redcap"` si no hay origen más específico | Variable | Sí | Entrada estructurada genérica hasta que un parser específico la clasifique. | Activa genérica |
| Priorización ciudadana por votación | `redcap-export` + tag `"thematic-prioritisation"`; `origin: "citizen-participation"` | Variable canónica por tag | Sí | Evidencia participativa: preferencias, prioridades percibidas y base para deliberación. | Activa |
| Selección deliberativa del Grupo Motor | Objeto de priorización deliberativa del workspace | Variable | No ordinaria | Decisión posterior que orienta planificación; no sustituye al diagnóstico. | Activa |
| Localiza Salud / activos comunitarios | `DocumentKind: "localiza-salud"`; `origin: "localiza-salud"` | Variable acumulable | Sí | Fuente principal/preferente de activos cuando exista o pueda obtenerse; activos y capacidades potenciales; equilibrio activos-déficits. | Activa |
| Activos comunitarios legado | `DocumentKind: "community-asset"`; `origin: "community-assets"` | Variable interna/legado | Sí | Compatibilidad con datos anteriores; activos/capacidades que no deben desplazar Localiza Salud como fuente principal visible. | Legacy activo |
| Marco estratégico y normativo | `DocumentKind: "strategic-framework"`; `origin: "strategic-framework"` | Variable acumulable | Sí | Contexto institucional: EPVSA, ESCA, RELAS, estrategias autonómicas o estatales. | Activa |
| Documentación territorial de contexto | `DocumentKind: "territorial-documentation"`; `origin: "territorial-documentation"` | Variable acumulable | Sí si hay texto procesable | Determinantes, contexto social, económico, urbano, institucional o clínico-asistencial. | Activa |
| Informes ERACIS u otros diagnósticos de programa | Normalmente `territorial-documentation`; `documentNature` pendiente si se especializa | Variable acumulable | Sí si hay texto procesable | Diagnóstico social/territorial complementario; desigualdades, vulnerabilidad, barrios, colectivos. | Activa por ruta genérica |
| Informes clínico-asistenciales UGC | `territorial-documentation` + `documentNature: "ugc-clinical-assistance-report"` | Variable contextual | No como evidencia ordinaria en N1b | Preguntas de contraste clínico-asistencial; no reemplaza escala municipal. | Activa parcial |
| Material cualitativo y participativo | `DocumentKind: "qualitative-material"`; `origin: "qualitative-material"` | Variable acumulable | Sí | Percepciones, relatos, actas, necesidades sentidas, contradicciones y preguntas. | Activa |
| Evidencia longitudinal | `DocumentKind: "longitudinal-evidence"`; `origin: "longi"` | Variable acumulable | Sí | Cambios entre ciclos, evolución temporal y memoria diagnóstica. | Activa |
| Dataset GES / importación de proyecto | `projectDatasetImports` y parsers disponibles | Variable | Sí si el módulo tiene adaptador | Carga estructurada de instrumentos del proyecto; preserva metadatos sin registros individuales. | Activa parcial |
| BADEA/IECA y contexto municipal externo | Contexto/proxy del municipio matriz | Variable contextual | No como fuente ordinaria | Contextualiza condiciones del municipio matriz; no desplaza evidencia local. | Piloto/contextual |
| Variables EAS sueltas | `DocumentKind: "eas-variable"`; `origin: "eas"` | Variable reservada | No en flujo visible | Reservado para parser real; no debe usarse como carga cómoda. | Reservada |
| Indicadores CMI | `DocumentKind: "cmi-indicator"`; `origin: "cmi"` | Variable reservada | No en flujo visible | Reservado para parser real; posible fuente de indicadores sanitarios estructurados. | Reservada |
| SAM / calidad muestral transversal | `origin: "sam"` reservado | Variable metodológica | No en flujo activo | Evaluación futura de calidad muestral transversal; hoy no instancia átomos activos. | Reservada |
| Entrada manual y migración legacy | `origin: "manual-entry"` o `origin: "legacy-compas"` | Variable de compatibilidad | Sí técnicamente | Corrección, migración o incorporación manual controlada con trazabilidad. | Compatibilidad |
| Otros documentos | `DocumentKind: "other"`; `origin: "other"` | Variable fallback | Sí técnicamente | Fallback interno; no debe ser opción visible normal. | Fallback no preferente |

---

## 4. Regla de entrada para fuentes nuevas

Una fuente nueva entra por la ruta más específica disponible:

1. Si es el Informe de Salud, usa `health-report`.
2. Si es un estudio con parser estructurado, usa su importador específico.
3. Si es una priorización por votación, usa la ruta de priorización temática.
4. Si es inventario de activos, usa `localiza-salud`. Si los activos aparecen
   mencionados en otra fuente, se tratan como indicio contextual o capacidad
   potencial y deben reconciliarse con Localiza Salud cuando exista o pueda
   obtenerse.
5. Si es estrategia, norma, plan autonómico, plan sectorial, plan estratégico
   temático o marco RELAS/ESCA, usa `strategic-framework`.
6. Si es diagnóstico social, informe ERACIS, diagnóstico de barrio, informe de
   otro programa o documento de contexto territorial, usa
   `territorial-documentation`.
7. Si es acta, entrevista, grupo focal, memoria participativa o relato
   comunitario, usa `qualitative-material`.
8. Si compara ciclos, usa `longitudinal-evidence`.

Si una fuente se usa repetidamente y exige reglas propias de extracción,
canonicidad o escala, debe graduarse a parser o `documentNature` específico
antes de condicionar decisiones del Perfil.

---

## 5. Efecto sobre completitud del Perfil

El Perfil es completo cuando:

- identifica qué fuentes están presentes;
- identifica qué fuentes relevantes están ausentes;
- declara la escala de cada fuente;
- distingue datos locales, proxies y contexto externo;
- conserva la regla N+1;
- presenta lagunas como lagunas, no como áreas de intervención;
- marca el Perfil como potencialmente desactualizado si cambia una fuente usada
  en su generación.

La llegada de una nueva fuente no invalida automáticamente el Perfil anterior:
lo convierte en una instantánea histórica del expediente previo. Para que la
nueva información tenga valor institucional debe producirse una nueva lectura,
nueva validación o nueva compilación, según el punto del ciclo.

---

## 6. Invariantes

**SCM-I1 — Fuente nueva no equivale a nuevo Perfil**

Una fuente nueva actualiza el expediente. No crea un segundo Perfil ni una línea
diagnóstica paralela.

**SCM-I2 — Ruta específica antes que fallback**

Toda fuente debe entrar por la ruta más específica disponible. `other` solo es
fallback interno.

**SCM-I3 — Comparación exige estructura**

Una comparación entre territorios solo se hace entre indicadores con valor,
periodo, escala, fuente y cautela. El texto no se compara.

**SCM-I4 — Proxies visibles**

Toda fuente de escala superior o distinta al ámbito del Perfil debe declarar su
escala. Ningún proxy puede presentarse como dato municipal o distrital directo.

**SCM-I5 — Ausencia como contenido**

La ausencia de estudios, participación, activos, comparadores o evidencia
longitudinal se declara como alcance del diagnóstico. No se oculta y no se
transforma en prioridad.

**SCM-I6 — Participación no mide prevalencia**

La priorización ciudadana y el material cualitativo informan preferencias,
percepciones y sentido comunitario. No sustituyen indicadores epidemiológicos.

**SCM-I7 — Estrategias orientan, no diagnostican población**

Una estrategia autonómica, plan sectorial o marco normativo puede orientar la
lectura y la planificación posterior, pero no demuestra por sí solo un problema
de salud local.

**SCM-I8 — Localiza Salud como fuente principal de activos**

Siempre que exista o pueda obtenerse una fuente Localiza Salud, el mapa de
activos del Perfil se construye desde `localiza-salud`. Los activos mencionados
en ERACIS, material cualitativo, documentación territorial, informes de programa
u otros documentos pueden señalar capacidades potenciales, pero quedan como
complementarios, contextuales o pendientes de reconciliación. No sustituyen
Localiza Salud ni reabren `community-asset` como vía visible.

---

## 7. Relaciones

| Contrato | Relación |
|---|---|
| `CONTRACT-REPOSITORY` | Define `DocumentKind`, canonicidad, visibilidad y preservación documental. |
| `CONTRACT-EVIDENCE` | Define `EvidenceAtom`, `EvidenceOrigin`, confianza, procedencia e IntegrityGuard. |
| `CONTRACT-COMPLEMENTARY-STUDIES` | Define los 13 instrumentos estructurados y sus pipelines. |
| `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY` | Define cómo el Perfil usa fuentes, afirma, interpreta y declara incertidumbre. |
| `PROFILE-VISUAL-CONTRACT` | Define cómo se visualizan fuentes, escalas, cautelas.

---

## Registro de revisiones

| Fecha | Versión | Cambio | Responsable |
|---|---|---|---|
| 2026-10-23 | 1.2 | Se retiran la columna y la sección «salida comparativa breve» (decisión del autor: solo Perfil general); las secciones 7 y 8 pasan a 6 y 7 | COMPÁS NG |
| 2026-09-24 | 1.1 | Localiza Salud queda fijada como fuente principal/preferente para activos; otras menciones quedan como indicios complementarios o pendientes de reconciliación | COMPÁS NG |
| 2026-09-24 | 1.0 | Creación de la matriz de capacidades de fuentes y su relación con las dos salidas del Perfil | COMPÁS NG |
