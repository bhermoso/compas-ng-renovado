# COMPÁS NG — Contrato de Estudios Complementarios

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes, la taxonomía y los
> límites de los Estudios Complementarios en COMPÁS NG.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-27

---

## 1. Propósito

Los **Estudios Complementarios** son instrumentos de medición cuantitativa o
semiestructurada que aportan dimensiones del estado de salud de la población
municipal que el Informe de Salud puede no cubrir, o cubrir solo de forma
agregada. Se administran sobre la población municipal mediante exportaciones de
REDCap u otros sistemas de captura y producen datos procesados localmente.

Dentro de COMPÁS NG, los Estudios Complementarios:

- enriquecen el `EvidenceStore` con indicadores, factores y hallazgos que
  las fuentes documentales primarias no incluyen;
- son siempre datos de contexto: complementan el diagnóstico territorial, no
  lo determinan ni lo sustituyen;
- no generan automáticamente decisiones de priorización ni actuaciones del
  Plan de Acción;
- preservan la privacidad: los registros individuales de cada participante no
  se almacenan; solo sobreviven los agregados municipales.

---

## 2. Taxonomía

### 2.1 Categoría arquitectónica: Estudios Complementarios

La categoría arquitectónica es **Estudios Complementarios**. Es la única
denominación autorizada para referirse al conjunto de instrumentos de
medición cuantitativa o semiestructurada que complementan el Informe de Salud
dentro del sistema.

IBSE, SF-12, DUKE, PREDIMED, CAGE, ESCA y cualquier otro instrumento que se
incorpore en el futuro son **implementaciones concretas** de esta categoría.
Ninguno de ellos tiene rango arquitectónico propio. El mayor desarrollo actual
de IBSE en COMPÁS NG no le otorga una categoría distinta al resto.

### 2.2 Estado de implementación por instrumento

| Instrumento | Categoría | Estado actual |
|---|---|---|
| **IBSE** — Índice de Bienestar Socioemocional | `validated-scale` | Implementado (módulo en `draft`; ver §9) |
| **DUKE-EAS** — Apoyo social funcional (Duke-UNC-11 sobre EAS) | `validated-scale` | Implementado — módulo en Biblioteca |
| **PREDIMED-EAS** — Adherencia a Dieta Mediterránea (PREDIMED-14 sobre EAS) | `validated-scale` | Implementado — módulo en Biblioteca |
| **SF-12 EAS** — Salud percibida (PCS/MCS sobre EAS) | `validated-scale` | Implementado — módulo en Biblioteca |
| **Sueño EAS** — Duración y calidad subjetiva del sueño (P33_R / P33A sobre EAS) | `eas-official-block` | Implementado — módulo en Biblioteca |
| **CAGE-EAS** — Riesgo de alcoholismo (CAGE_R / CAGE sobre EAS) | `eas-official-block` | Implementado — módulo en Biblioteca |
| **IPAQ-EAS** — Actividad física y sedentarismo en tiempo libre (IPAQ_DICO / P34A_R sobre EAS) | `eas-official-block` | Implementado — módulo en Biblioteca |
| **AUDIT-C** — Cribado de consumo de riesgo de alcohol (AUDIT-C municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| **GHQ-12** — Cribado de malestar psicológico probable (GHQ-12 municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| **PHQ-9** — Cribado de síntomas depresivos (PHQ-9 municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| **PSQI** — Calidad global del sueño (Pittsburgh Sleep Quality Index municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| **Fagerström (FTND)** — Dependencia a la nicotina en fumadores (FTND municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| **SBQ** — Comportamiento sedentario prolongado (SBQ municipal) | `validated-scale` | Implementado — módulo en Biblioteca |
| Otros instrumentos futuros | — | Sin definir |

El estado "conceptual" significa que el instrumento está reconocido en el
dominio (DOMAIN-MODEL.md §5.3) pero no tiene módulo registrado, tipos de
dominio propios, parser ni pipeline de evidencia.

### 2.3 Fuentes de captura

Los Estudios Complementarios pueden provenir de:

- **REDCap**: sistema de captura habitual. La exportación CSV de REDCap es el
  documento fuente.
- **Sistemas equivalentes**: cualquier sistema que produzca registros
  individuales en formato tabular, siempre que el instrumento tenga un módulo
  metodológico con adaptador para ese sistema.
- **Agregados externos**: en casos excepcionales, un estudio puede incorporar
  agregados ya calculados sin acceso a los individuales (p. ej., resultados
  de un estudio publicado). En ese caso, la trazabilidad al instrumento
  individual es limitada y debe documentarse explícitamente.

### 2.4 Cuestionarios compuestos

Un cuestionario puede agregarse a partir de múltiples instrumentos
(por ejemplo: bloque sociodemográfico EAS + IBSE + PREDIMED). En ese caso,
cada instrumento conserva su identidad metodológica propia. El cuestionario
compuesto no crea un instrumento nuevo: es un contenedor de instrumentos
existentes. La trazabilidad de cada ítem debe poder rastrearse hasta su
módulo de origen.

---

## 3. Relación con el Repositorio Documental

### 3.1 Registro en el repositorio

Toda importación de un Estudio Complementario produce un documento en el
repositorio. El `kind` del documento depende del origen del instrumento:

| Familia | `kind` canónico | Tag discriminante | Canonicidad |
|---|---|---|---|
| IBSE (exportación REDCap municipal) | `"redcap-export"` | `"ibse"` | Por tag (uno por municipio) |
| Instrumentos EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE) | `"complementary-study"` | Tag propio del instrumento | Por tag (uno por municipio) |
| Futuros instrumentos REDCap | `"redcap-export"` | Tag propio del instrumento | Por tag (uno por municipio) |

Atributos comunes a todos los documentos de Estudios Complementarios:

| Campo | Valor |
|---|---|
| `id` | UUID generado en el momento de la importación |
| `sourceFileName` | Nombre del fichero CSV importado |
| `canGenerateEvidence` | `true` (por defecto) |
| `tags` | Al menos el tag discriminante del instrumento |

**Razón de la distinción `redcap-export` vs `complementary-study`:** IBSE
es una exportación REDCap de un cuestionario municipal administrado directamente
por el equipo. Los instrumentos EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE) son
variables derivadas de los microdatos oficiales de la Encuesta Andaluza de Salud,
no exportaciones de REDCap municipal. Esta distinción refleja el origen diferente
de cada fuente, aunque ambas familias pertenecen a la misma categoría arquitectónica
de Estudios Complementarios.

### 3.2 Discriminación entre instrumentos

Cada instrumento tiene un tag canónico único. La correspondencia actual es:

| Instrumento | `kind` | Tag discriminante |
|---|---|---|
| IBSE | `redcap-export` | `"ibse"` |
| Priorización Temática | `redcap-export` | `"thematic-prioritisation"` |
| DUKE-EAS | `complementary-study` | `"duke-eas"` |
| PREDIMED-EAS | `complementary-study` | `"predimed-eas"` |
| SF-12 EAS | `complementary-study` | `"sf12-eas"` |
| Sueño EAS | `complementary-study` | `"sueno-eas"` |
| CAGE-EAS | `complementary-study` | `"cage-eas"` |
| IPAQ-EAS | `complementary-study` | `"ipaq-eas"` |
| AUDIT-C | `redcap-export` | `"auditc"` |
| GHQ-12 | `redcap-export` | `"ghq12"` |
| PHQ-9 | `redcap-export` | `"phq9"` |
| PSQI | `redcap-export` | `"psqi"` |
| Fagerström | `redcap-export` | `"fagerstrom"` |
| SBQ | `redcap-export` | `"sbq"` |

**Nota:** La Priorización Temática comparte `kind: "redcap-export"` con IBSE
pero no es un Estudio Complementario; es una familia documental distinta con
contrato propio. Aparece aquí solo para completar la tabla de discriminación.

### 3.3 Canonicidad por tag

Cada instrumento de estudio complementario es **canónico por tag**: solo puede
existir un documento activo con su tag discriminante en el repositorio de cada
municipio. Al importar una nueva exportación del mismo instrumento, el
documento anterior se sustituye y su evidencia derivada se purga.

Esta canonicidad es por tag, no por `kind`. Distintos instrumentos con el mismo
`kind` no se sustituyen entre sí.

### 3.4 Trazabilidad: `documentId`

El `id` del documento en el repositorio se propaga a los `EvidenceAtom` que el
estudio genera, como `provenance.documentId`. Esto permite purgar exactamente
los átomos de ese instrumento cuando el documento es eliminado o sustituido.
Véase `CONTRACT-EVIDENCE.md`.

---

## 4. Relación con EvidenceAtom

### 4.1 Qué genera cada tipo de evidencia

Un Estudio Complementario puede generar las siguientes categorías de átomo:

| Categoría de átomo | `kind` | Descripción |
|---|---|---|
| Indicadores cuantitativos | `indicator` | Medias municipales de factores e índices |
| Resumen interpretativo derivado | `qualitative-observation` | Síntesis automática del instrumento; marcada como derivada |
| Cautelas metodológicas | `methodological-caution` | Limitaciones del instrumento o la muestra |

El caso IBSE ilustra la distinción:

- **IBSE_FACTORES** (5 átomos, `kind: "indicator"`): evidencia cuantitativa
  primaria. Índice total y 4 factores (Vínculo, Situación, Control, Persona).
- **IBSE_RESUMEN** (1 átomo, `kind: "qualitative-observation"`, tag
  `"ibse-derived"`): síntesis automática derivada de IBSE_FACTORES. No es
  evidencia primaria. No debe prevalecer sobre los datos cuantitativos cuando
  exista discrepancia.

Los futuros instrumentos deben mantener esta misma distinción entre evidencia
primaria y resumen derivado cuando sea aplicable.

### 4.2 Nivel de confianza

La confianza de los átomos generados refleja la calidad de la muestra:

| Condición de la muestra | `confidence` |
|---|---|
| `nValid >= 30` (o criterio equivalente del instrumento) | `"medium"` |
| `nValid < 30` | `"low"` |

Ningún Estudio Complementario genera átomos con `confidence: "high"`.

### 4.3 Validación humana

Todos los átomos generados por Estudios Complementarios tienen
`requiresHumanValidation: true`. El sistema no produce evidencia de estudios
complementarios que se presente como automáticamente validada.

### 4.4 Privacidad: no persistencia de registros individuales

Los registros individuales de los participantes no se almacenan en ningún
momento. El parser lee el CSV fila a fila, calcula los agregados municipales y
descarta los individuales. Solo los agregados sobreviven en `IBSEAggregates`
(y en los equivalentes de futuros instrumentos). Esta garantía es parte del
contrato de cada instrumento, no solo de IBSE.

---

## 5. Biblioteca Metodológica

### 5.1 `MethodologicalModule` como fuente única de verdad

Cada instrumento de Estudio Complementario debe tener una definición canónica
en la **Biblioteca Metodológica** (`domain/methodology/`). Esta definición es
la fuente única de verdad para:

- la estructura de ítems y opciones de respuesta;
- las dimensiones y sus composiciones;
- el algoritmo de cálculo canónico;
- la interpretación de resultados y sus umbrales;
- los adaptadores para sistemas de captura (REDCap, SAV, etc.).

Los parsers, los motores de evidencia y el Constructor de Cuestionarios derivan
su comportamiento de esta definición. No deben replicar ni redefinir ninguno
de estos elementos fuera del módulo.

El parser IBSE ilustra esta dependencia: lee sus nombres de columna directamente
desde `IBSE_MODULE.adapters.redcap.columns`, no los tiene hardcoded.

### 5.2 Estructura de un `MethodologicalModule`

Un módulo canónico incluye:

| Componente | Descripción |
|---|---|
| `identity` | ID, versión, estado, categoría, nombre, descripción, propósito, población objetivo |
| `source` | Autores, año, publicación, DOI, URL, organismo, notas |
| `items` | Ítems del instrumento: texto, dimensión, tipo de respuesta, opciones, inversión de escala, campo REDCap |
| `dimensions` | Dimensiones o factores: ítems que los componen, campo de salida canónico |
| `algorithm` | Tipo de algoritmo, nivel de entrada canónico, pasos, nivel de agregación, criterio de completitud, notas de implementación |
| `interpretation` | Escala (mín/máx/dirección), umbrales optativos, valores de referencia, notas contextuales |
| `limitations` | Limitaciones metodológicas conocidas del instrumento |
| `bibliography` | Referencias bibliográficas de la fuente primaria |
| `adapters` | Adaptadores opcionales para REDCap, SAV u otros sistemas |

### 5.3 Categorías de módulo (`ModuleCategory`)

| Categoría | Descripción |
|---|---|
| `eas-sociodemographic` | Variables de clasificación de la VI Encuesta Andaluza de Salud |
| `eas-official-block` | Bloque oficial completo de la EAS |
| `validated-scale` | Escala psicométrica o epidemiológica con validación publicada |
| `municipal-module` | Módulo propio de un proyecto o municipio |
| `external-official-module` | Módulo externo excepcional (INE, IECA, CIS) con justificación |
| `custom` | Uso específico no encuadrable en los anteriores |

Los instrumentos de Estudios Complementarios validados (IBSE, SF-12, DUKE,
PREDIMED) son `validated-scale`. Los módulos específicos del municipio son
`municipal-module`.

### 5.4 Estados de módulo (`ModuleStatus`)

| Estado | Significado |
|---|---|
| `draft` | Definición en construcción o pendiente de contraste con fuente primaria |
| `validated` | Definición contrastada con la fuente primaria original; lista para uso en producción |
| `deprecated` | Sustituida por una versión posterior o retirada por obsolescencia |

### 5.5 Condición para declarar un módulo `validated`

Un módulo puede transitar de `draft` a `validated` cuando se cumplan todas
las condiciones siguientes:

1. Todos los ítems están contrastados con la publicación original del
   instrumento (texto exacto, opciones de respuesta, inversión de escala).
2. El algoritmo está verificado contra la descripción metodológica de la
   fuente primaria.
3. La interpretación (escala, umbrales si existen, valores de referencia si
   existen) está alineada con la fuente primaria.
4. El adaptador REDCap (cuando existe) está verificado contra un diccionario
   REDCap real del instrumento.
5. Las limitaciones metodológicas están documentadas explícitamente.
6. La bibliografía primaria está completa y verificable.

### 5.6 Estado actual de IBSE en la Biblioteca

El módulo `IBSE_MODULE` está en estado `"draft"` por la siguiente razón
documentada:

> Los 8 ítems han sido verificados contra el diccionario REDCap interno
> (`MonitorIBSEATARFE2026_DataDictionary_2026-06-20.csv`). Pendiente el
> contraste bibliográfico completo con la fuente primaria: Bericat (2014).

Los ítems, dimensiones, algoritmo y adaptador REDCap están completos y son
operativos. El módulo no debe marcarse como `"validated"` hasta completar el
contraste con Bericat (2014) y documentar la referencia bibliográfica completa.

El adaptador SAV está pendiente de contraste con el fichero de referencia.

---

## 6. Constructor de Cuestionarios

### 6.1 Relación con Estudios Complementarios

El **Constructor de Cuestionarios** es el componente que permite componer
cuestionarios municipales a partir de módulos de la Biblioteca Metodológica y
bloques de clasificación. No es un Estudio Complementario en sí mismo: es la
herramienta que permite construirlos.

Un cuestionario construido con el Constructor puede convertirse en la fuente
de captura de un Estudio Complementario si:

1. Incluye al menos un módulo metodológico registrado.
2. Se genera un diccionario REDCap o equivalente.
3. Los datos capturados se exportan y se importan en COMPÁS NG mediante el
   parser del instrumento.

### 6.2 Garantías del Constructor

- Valida que cada `ModuleId` declarado en el cuestionario exista en el
  registro antes de construir cualquier artefacto.
- Genera el diccionario REDCap (`RedcapDictionaryDefinition`) iterando los
  ítems de cada módulo y extrayendo su `redcapFormField`. Si un ítem no tiene
  `redcapFormField`, el constructor falla con error explícito.
- Preserva la identidad metodológica de cada módulo: no fusiona ítems de
  distintos módulos, no redefine opciones de respuesta y no altera la lógica
  de salto definida en el módulo.

### 6.3 Lo que el Constructor no hace

- No crea módulos metodológicos nuevos. Un instrumento nuevo debe formalizarse
  primero en la Biblioteca antes de poder incluirse en un cuestionario.
- No duplica ni redefine el contrato de cada escala. Los ítems, dimensiones y
  algoritmos de cada instrumento son propiedad del módulo, no del cuestionario.
- No genera parsers automáticamente. Un cuestionario compuesto requiere un
  parser específico si sus resultados van a alimentar el `EvidenceStore`.

### 6.4 Bloques de clasificación

Los bloques de clasificación (`ClassificationBlockId`) son bloques
sociodemográficos o de contexto que pueden añadirse al cuestionario junto a
los módulos metodológicos:

| Bloque | Fuente | Estado |
|---|---|:---:|
| `eas-sociodemographic` | VI Encuesta Andaluza de Salud | Planificado |
| `eas-household` | VI Encuesta Andaluza de Salud | Planificado |
| `ine-demography` | Instituto Nacional de Estadística | Planificado |
| `ieca-territorial` | Instituto de Estadística y Cartografía de Andalucía | Planificado |
| `cis-political` | Centro de Investigaciones Sociológicas | Planificado |
| `custom` | Definición propia del proyecto | Planificado |

Todos los bloques de clasificación están actualmente en estado `"planned"`:
existen como tipos en el dominio pero no tienen contenido metodológico ni
adaptadores implementados.

---

## 7. REDCap y fuentes externas

### 7.1 REDCap como sistema de captura

REDCap es el sistema de captura de datos habitual para los Estudios
Complementarios en COMPÁS NG. La exportación CSV de REDCap es el
**documento fuente**: es el fichero que el equipo importa en la aplicación
y que da lugar al documento en el repositorio.

### 7.2 Distinción entre formulario, exportación y estudio interpretado

| Concepto | Descripción |
|---|---|
| **Formulario REDCap** | Instrumento digital con el que los participantes responden. No es gestionado por COMPÁS NG |
| **Exportación REDCap** | Fichero CSV que REDCap genera con los registros de cada participante. Es el documento fuente importado en COMPÁS NG |
| **Estudio interpretado** | Objeto de dominio (`IBSEStudy` o equivalente) que contiene los agregados municipales calculados a partir de la exportación. Es la representación interna del estudio en COMPÁS NG |

La exportación REDCap contiene datos individuales. El estudio interpretado
no los contiene: solo los agregados.

### 7.3 Correspondencia exacta con el instrumento validado

Cuando un instrumento tiene una fuente primaria validada (Bericat 2014 para
IBSE; instrumento SF-12 original; etc.), el módulo metodológico de COMPÁS NG
debe corresponder exactamente a esa fuente. No deben crearse versiones
alternativas de los ítems, las opciones de respuesta ni el algoritmo sin
justificación técnica expresa documentada en el módulo.

Cuando REDCap calcula internamente valores intermedios (como hace con los
factores IBSE), el adaptador REDCap del módulo debe documentar esta desviación
del flujo canónico, indicando qué pasos del algoritmo ejecuta REDCap y qué
pasos ejecuta el parser de COMPÁS NG.

---

## 8. Invariantes

**I-CE-1 — IBSE no es una categoría arquitectónica**

IBSE es una implementación concreta de la categoría Estudios Complementarios.
Comparte con el resto de instrumentos el mismo ciclo de vida (módulo →
parser → evidencia), el mismo rol en el repositorio (`kind: "redcap-export"`,
tag discriminante), la misma posición frente al PSL (datos de contexto) y las
mismas garantías de privacidad (no persistencia de individuales). El mayor
desarrollo actual de IBSE en el código no le confiere ningún privilegio
arquitectónico sobre los futuros instrumentos.

**I-CE-2 — Ningún Estudio Complementario sustituye al Informe de Salud**

Los Estudios Complementarios miden dimensiones que el Informe de Salud puede
no cubrir. No son una alternativa al Informe de Salud y no pueden usarse como
sustituto de la fuente diagnóstica primaria. El PSL señala explícitamente la
ausencia del Informe de Salud independientemente de cuántos estudios
complementarios estén disponibles.

**I-CE-3 — Ningún Estudio Complementario produce por sí solo un PSL**

Los Estudios Complementarios alimentan el `EvidenceStore`, que forma parte de
las entradas del MIT. El PSL se construye a partir del MIT completo, del
IntegrityGuard y del workspace. Un solo Estudio Complementario no es suficiente
para construir un PSL significativo.

**I-CE-4 — Ningún Estudio Complementario decide prioridades**

Los resultados de un Estudio Complementario son evidencia de contexto. No
determinan las prioridades del Plan Local de Salud. Las candidaturas de
priorización provienen de las áreas de intervención del PSL, que integra
todas las fuentes del `EvidenceStore`. La decisión de priorización es siempre
humana.

**I-CE-5 — Todo resultado debe ser trazable a fuente, módulo o exportación**

Cada `EvidenceAtom` generado por un Estudio Complementario incluye en su
`provenance`: `origin` (origen del instrumento), `documentId` (ID del
documento fuente en el repositorio), `sourceLabel` (nombre del fichero) y
`extractedAt` (fecha de extracción). Esta trazabilidad es inmutable.

**I-CE-6 — Todo instrumento debe declarar sus límites metodológicos**

El campo `limitations` del módulo metodológico y el campo
`methodologicalCautions` del estudio interpretado son obligatorios. Un
Estudio Complementario sin limitaciones declaradas indica una definición
incompleta, no un instrumento perfecto.

**I-CE-7 — Los registros individuales no se persisten**

Ningún registro individual de participante se almacena en el workspace, en
el `EvidenceStore` ni en localStorage. Solo sobreviven los agregados
municipales. Este invariante no puede ser relajado sin un diseño explícito
de privacidad y una decisión deliberada del equipo.

**I-CE-8 — La ausencia de implementación no implica ausencia conceptual**

Los 13 instrumentos vigentes están implementados. Futuros instrumentos que se
reconozcan en el dominio antes de ser implementados seguirán este invariante:
no tener parser ni módulo registrado no los excluye de la categoría; indica que
su implementación está pendiente. El contrato de la categoría se aplica a todos
cuando se implementen.

**I-CE-9 — Un módulo en `draft` es operativo pero no canónico**

`IBSE_MODULE.identity.status === "draft"` indica que la definición está
pendiente de contraste completo con la fuente primaria. El parser puede
utilizarlo porque la estructura operativa (columnas REDCap, dimensiones,
algoritmo de agregación) está verificada. Pero las decisiones sobre el texto
exacto de los ítems deben reservarse hasta la validación con Bericat (2014).

---

## 9. Estados de un Estudio Complementario

Para cada instrumento de la familia de Estudios Complementarios, se distinguen
los siguientes estados:

| Estado | Descripción | Criterio de transición |
|---|---|---|
| **Conceptual** | El instrumento está reconocido en el dominio (DOMAIN-MODEL.md) pero no tiene módulo ni código | — |
| **Contratado** | Existe un `MethodologicalModule` registrado en el registry, con al menos `identity` y `source` completos, aunque los ítems o adaptadores estén incompletos | Módulo añadido al registry |
| **Implementado parcialmente** | Módulo con ítems y/o adaptador REDCap, pero sin parser ni pipeline de evidencia operativos | Módulo parcialmente completado |
| **Implementado** | Módulo + parser + tipos de dominio + pipeline de evidencia operativos. El módulo puede estar en `draft` | Todos los componentes en producción |
| **Validado** | Módulo en estado `validated` (contraste bibliográfico completo, ítems verificados, algoritmo verificado, adaptador verificado) + implementación operativa | Módulo pasa de `draft` a `validated` |
| **Obsoleto** | Módulo en estado `deprecated` + implementación retirada o deshabilitada | Decisión explícita del equipo |

### Estado actual por instrumento

| Instrumento | Estado |
|---|---|
| **IBSE** | **Implementado** (módulo en `draft`; pendiente de `validated`) |
| **DUKE-EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **PREDIMED-EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **SF-12 EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **Sueño EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **CAGE-EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **IPAQ-EAS** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **AUDIT-C** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **GHQ-12** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **PHQ-9** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **PSQI** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **Fagerström (FTND)** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| **SBQ** | **Implementado** — dominio, parser, EvidenceAtoms, panel, workspace, `MethodologicalModule` en Biblioteca |
| Otros instrumentos futuros | Conceptual |

### Nota §9a — Estado de la Biblioteca Metodológica (H-01 CERRADO)

~~Deuda técnica abierta~~ **CERRADA** — todos los 13 instrumentos tienen `MethodologicalModule`
registrado en `domain/methodology/registry.ts`.

Los módulos EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE, IPAQ) están en estado `draft` por las
mismas razones que IBSE: pendiente de contraste bibliográfico con fuente primaria completa.
Los instrumentos REDCap municipales (AUDIT-C, GHQ-12, PHQ-9, PSQI, Fagerström, SBQ)
igualmente en `draft`.

**Deuda residual vigente:** los módulos deben transitar a `validated` antes de que los
instrumentos puedan considerarse en estado `Validado`. Ver §5.5 para condiciones de transición.
El patrón §10 se respeta en los instrumentos REDCap; para EAS, los parsers pueden todavía
derivar columnas hardcodeadas (ver comentarios en cada parser).

---

## 10. Patrón de implementación

Todo instrumento nuevo que se incorpore como Estudio Complementario debe
seguir el mismo patrón que IBSE:

```
1. domain/methodology/definitions/{instrumento}.ts
   └── MethodologicalModule completo (identity, source, items, dimensions,
       algorithm, interpretation, limitations, bibliography, adapters.redcap)

2. domain/methodology/registry.ts
   └── Registrar el módulo: REGISTRY.set(module.identity.id, module)

3. domain/{instrumento}/{Instrumento}Aggregates.ts
   └── Tipo de datos de los agregados municipales

4. domain/{instrumento}/{Instrumento}Study.ts
   └── Tipo de estudio interpretado con municipalityId, sourceFileName,
       aggregates, methodologicalCautions

5. application/{instrumento}/{Instrumento}CSVParser.ts
   └── Parser que deriva nombres de columna del módulo (adapters.redcap)
   └── Calcula los agregados municipales, descarta individuales

6. application/{instrumento}/{Instrumento}StudyToEvidenceAtoms.ts
   └── Transforma {Instrumento}Study en EvidenceAtom[]
   └── Distingue evidencia primaria (indicadores) de derivada (observación)
```

La adición de un instrumento sigue el Artículo 13 de ARCHITECTURE-CONSTITUTION.md:
debe responder a un problema real del municipio antes de implementarse.

---

## 11. Exclusiones

Este contrato regula exclusivamente los Estudios Complementarios como familia
documental. Los siguientes aspectos quedan fuera de su alcance:

- **MIT y PSL**: el sistema consume la evidencia generada por los estudios;
  sus contratos estaban en `CONTRACT-MIT-PSL.md` (histórico; doctrina vigente del Perfil: `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`).
- **Repositorio Documental**: el ciclo de vida de los documentos, la
  canonicidad por tag y las operaciones de sustitución y borrado están en
  `CONTRACT-REPOSITORY.md`.
- **EvidenceAtom y EvidenceStore**: estructura, IntegrityGuard y pipelines
  están en `CONTRACT-EVIDENCE.md`.
- **Priorización Temática**: aunque usa `kind: "redcap-export"`, es una
  familia documental distinta con contrato propio. No es un Estudio
  Complementario.
- **Plan de Acción, Agenda y Seguimiento**: motores del Nivel 3.
- **Compilador del Plan Local de Salud**: producto de exportación documental.
- **Gobernanza institucional**: decisiones sobre qué instrumentos administrar,
  cuándo y a quién.

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Establece la taxonomía correcta (Estudios Complementarios como categoría; IBSE como implementación). Documenta el estado actual de IBSE en la Biblioteca Metodológica, el patrón de implementación para futuros instrumentos y los invariantes de privacidad y trazabilidad. |
| 2026-06-25 | Actualización de estado: DUKE-EAS y PREDIMED-EAS pasan de «Conceptual» a «Implementado» en §2.2 y §9. Se añade nota §9a documentando la deuda técnica por ausencia de `MethodologicalModule` en la Biblioteca Metodológica y la desviación de parsers respecto al patrón §10. |
| 2026-06-27 | Sprint 0: SF-12 EAS, Sueño EAS y CAGE-EAS pasan de «Conceptual» a «Implementado» (implementados en commits `7f47034`, `20080cd` y `9c73fa0` respectivamente). §3.1 y §3.2 actualizados para reflejar la distinción real entre `kind: "redcap-export"` (IBSE) y `kind: "complementary-study"` (instrumentos EAS). Nota §9a ampliada para incluir los cinco instrumentos EAS sin `MethodologicalModule`. |
| 2026-07-13 | Fase de gobernanza y consolidación: IPAQ-EAS, AUDIT-C, GHQ-12, PHQ-9, PSQI, Fagerström y SBQ pasan a «Implementado». §2.2, §3.2 y §9 actualizados para reflejar los 13 instrumentos vigentes. H-01 cerrado: todos los instrumentos tienen `MethodologicalModule` en la Biblioteca. Nota §9a actualizada. I-CE-8 actualizado. |
