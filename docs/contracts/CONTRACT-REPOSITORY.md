# COMPÁS NG — Contrato del Repositorio Documental Municipal

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes y los límites del
> Repositorio Documental Municipal en COMPÁS NG.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-09-24

---

## 1. Propósito

El **Repositorio Documental Municipal** es el registro formal de todos los
documentos de un municipio dentro de COMPÁS NG. Centraliza los documentos
de entrada, preserva su procedencia y actúa como fuente de verdad documental
a partir de la cual el sistema genera representaciones derivadas.

### Papel dentro de COMPÁS NG

El repositorio ocupa el **Nivel 1** del sistema: es la capa de preservación
documental, anterior a cualquier transformación analítica. Ningún motor
analítico —incluido el Motor de Interpretación Territorial (MIT), el Perfil
de Salud Local (PSL) o el Plan de Acción— modifica los documentos del
repositorio ni sustituye su función.

### Relación con el municipio activo

Cada repositorio pertenece a exactamente un municipio. No existe estado
documental global mutable ni documentos compartidos entre municipios. El
`municipalityId` del repositorio es el contexto obligatorio de todos sus
documentos.

La aplicación puede construir una **Biblioteca documental COMPÁS** como vista
derivada de los repositorios municipales ya persistidos en el navegador. Esta
biblioteca permite consultar documentación acumulada en otros expedientes, pero
no altera el repositorio de origen ni constituye un repositorio global. Cuando
un documento de la biblioteca se asigna a otro expediente, el sistema registra
una **copia trazable** dentro del repositorio municipal activo, con un nuevo
`documentId`, el `municipalityId` del expediente destino y tags de procedencia
(`compas-library-assigned`, `source-municipality:*`, `source-document:*`).
La eliminación o sustitución posterior de esa copia solo afecta al expediente
destino.

### Relación con el pipeline analítico

El repositorio alimenta el pipeline analítico a través de una sola frontera:
la generación de `EvidenceAtom`. Esta frontera está regulada por el
[Contrato de Evidencia](CONTRACT-EVIDENCE.md). El repositorio no ejecuta
transformaciones analíticas directamente: proporciona la fuente, y el
pipeline derivado la lee sin modificarla.

---

## 2. Principios

### Fuente única documental municipal

El repositorio es la única fuente autorizada de documentos municipales en
COMPÁS NG. Todo documento que participe en el análisis territorial debe estar
registrado en él. Un documento no registrado no existe para el sistema.

### Separación entre documento y evidencia derivada

Un documento registrado en el repositorio no es equivalente a su evidencia
derivada. La evidencia (`EvidenceAtom`) es una representación transformada del
documento, posterior a la frontera de explotación documental. El documento
original permanece íntegro e inmutable aunque su evidencia derivada sea
modificada, purgada o regenerada.

### Separación entre documento y PSL

El Perfil de Salud Local (PSL) es un objeto analítico del Nivel 2, generado a
partir del `EvidenceStore`. No es un documento del repositorio, no puede ser
añadido al repositorio como fuente y no sustituye a ningún documento existente
en él. El PSL referencia el Informe de Salud mediante `healthReportDocumentId`;
nunca lo contiene ni lo reemplaza.

### Separación entre documento y Plan Local de Salud compilado

El Plan Local de Salud compilado, cuando exista, es un producto de exportación
generado a partir del PSL aprobado y del Plan de Acción validado. No es un
documento del repositorio. Un documento del repositorio —sea un Informe de Salud, un
diagnóstico territorial o cualquier otro— nunca se transforma automáticamente
en el Plan Local de Salud compilado.

### No inferencia automática de significado institucional

El repositorio preserva documentos. No infiere su relevancia estratégica, no
los pondera entre sí ni adopta decisiones sobre qué priorizar. Toda
interpretación analítica de los documentos ocurre fuera del repositorio, en
la capa de aplicación y los motores analíticos, con trazabilidad explícita.

---

## 3. Tipos documentales (`DocumentKind`)

El tipo (`kind`) de un documento determina cómo el sistema lo procesa y qué
garantías ofrece. Los tipos actuales son:

| `kind` | Nombre canónico | Canonicidad | Genera evidencia | Visible en selector |
|---|---|:---:|:---:|:---:|
| `health-report` | Informe de Salud | Por `kind` | **No** (D-HR-01) | Sí — cargador DOCX/PDF |
| `community-asset` | Activos Comunitarios | Por `kind` | Sí | **No** — tipo interno/legado† |
| `strategic-framework` | Marco estratégico y normativo | Acumulable | Sí | Sí |
| `redcap-export` | Exportación REDCap | Por `tag` (IBSE, TP) o acumulable | Sí | No directamente |
| `complementary-study` | Estudio Complementario | Acumulable | Sí | Sí |
| `eas-variable` | Variable EAS | Acumulable | Sí | **No** — sin parser real |
| `cmi-indicator` | Indicador CMI | Acumulable | Sí | **No** — sin parser real |
| `localiza-salud` | Localiza Salud | Acumulable | Sí | Sí — vía visible única y fuente principal/preferente para activos‡ |
| `territorial-documentation` | Documentación territorial | Acumulable | Sí | Sí |
| `qualitative-material` | Material cualitativo | Acumulable | Sí | Sí |
| `longitudinal-evidence` | Evidencia longitudinal | Acumulable | Sí | Sí |
| `other` | Otro | Acumulable | Sí | **No** — no debe exponerse como opción visible |

**Notas:**

\* **D-HR-01 (resuelta):** El Informe de Salud **no genera `EvidenceAtom`** en el flujo activo del producto.
`canGenerateEvidence = false` bloquea la pipeline genérica. La pipeline dedicada
`HealthReportToEvidencePipeline` queda fuera del flujo activo (función aislada, no llamada).
El IS se preserva como `HealthReportDocument` para visualización y referencia. Ver `CONTRACT-EVIDENCE.md §5.1`.

El Informe de Salud admite dos formatos:
- **DOCX** (`.docx`): se crea `HealthReportDocument` con cuerpo HTML y secciones para visualización.
- **PDF** (`.pdf`): se preserva como fuente primaria sin extracción de texto ni secciones diagnósticas.

† **`community-asset`** existe como tipo interno para compatibilidad con datos anteriores y flujo de Localiza Salud.
No está expuesto como categoría visible en el selector documental del producto y no debe desplazar Localiza Salud
como fuente principal de activos.

‡ **`localiza-salud`** es la vía visible única y la fuente principal/preferente para registrar activos
comunitarios en el selector, siempre que exista o pueda obtenerse. Internamente genera átomos con
`origin: "localiza-salud"` y `kind: "asset"`. Los documentos de tipo `community-asset` generados antes
del cierre del selector siguen procesándose correctamente. Activos mencionados en otras fuentes quedan
como indicios complementarios o pendientes de reconciliación con Localiza Salud.

### IBSE y Priorización Temática dentro de `redcap-export`

IBSE (Índice de Bienestar Socioemocional) y la Priorización Temática son
dos instrumentos distintos que comparten `kind: "redcap-export"`. Su
diferenciación contractual no se realiza por `kind` sino por `tags`:

| Instrumento | `kind` | Tag discriminante |
|---|---|---|
| IBSE | `redcap-export` | `"ibse"` |
| Priorización Temática | `redcap-export` | `"thematic-prioritisation"` |

**El `kind` compartido no implica sustitución mutua.** Registrar un nuevo IBSE
no elimina ni sustituye la Priorización Temática, y viceversa. La canonicidad
de cada uno es independiente y opera sobre su tag, no sobre el `kind`.

Ninguna operación del sistema puede utilizar el `kind` como único criterio
para identificar o sustituir documentos IBSE o de Priorización Temática.
Toda lógica que los distinga debe operar sobre los tags.

---

## 4. Canonicidad

Un documento es **canónico** cuando el sistema garantiza que solo puede haber
una versión activa de ese tipo por municipio en cada momento. COMPÁS NG
implementa dos mecanismos de canonicidad distintos:

### 4.1 Canónico por `kind`

Solo puede existir un documento activo con ese `kind` en el repositorio del
municipio. Al registrar uno nuevo, el anterior se elimina automáticamente junto
con toda su evidencia derivada.

Tipos canónicos por `kind`:

- `health-report` (Informe de Salud)
- `community-asset` (Activos Comunitarios)

La función que implementa esta garantía es `replaceMunicipalDocumentByKind`.

### 4.2 Canónico por `tag`

Dentro de un `kind` acumulable, un tag concreto determina que solo puede
existir un documento activo con ese tag en el repositorio del municipio. Al
registrar un nuevo documento con ese tag, todos los documentos previos con el
mismo tag se eliminan junto con su evidencia derivada.

Tags canónicos actuales (ambos sobre `kind: "redcap-export"`):

| Tag canónico | Instrumento |
|---|---|
| `"ibse"` | IBSE — Índice de Bienestar Socioemocional |
| `"thematic-prioritisation"` | Priorización Temática |

La función que implementa esta garantía es `removeDocumentsByTag`, que opera
sobre tags en lugar de `kind`.

### 4.3 Acumulable

El resto de tipos documentales son acumulables: pueden coexistir múltiples
documentos del mismo `kind` en el repositorio. Cada uno tiene su propio
`documentId` y su propia evidencia derivada.

### 4.4 Histórico

Un documento en estado `archived` permanece en el repositorio como referencia
histórica. No participa activamente en el pipeline analítico, pero su
trazabilidad se preserva. La distinción entre `archived` e histórico depende
del flujo institucional: el repositorio solo garantiza la persistencia del
estado, no su interpretación.

---

## 5. Relación documento → EvidenceAtom

### Cuándo genera evidencia

Un documento genera `EvidenceAtom` cuando se le aplica un pipeline de
extracción. La generación no es automática al registrar el documento: requiere
una acción explícita del sistema (carga de un Informe de Salud, importación
de CSV IBSE, importación de CSV de Priorización Temática, ingesta manual de
texto).

### Cuándo no genera evidencia

No todos los registros en el repositorio generan `EvidenceAtom`:

- Un documento con `canGenerateEvidence: false` no está conectado a la
  pipeline genérica de ingesta.
- Un documento registrado pero sin contenido procesable no genera átomos.
- Un documento en estado `archived` o `rejected` no alimenta motores activos.

### Trazabilidad mediante `documentId`

Cada `EvidenceAtom` generado a partir de un documento incorpora el
`documentId` del documento origen en `provenance.documentId`. Esta relación
es la clave de trazabilidad que permite:

- identificar el documento fuente de cada unidad de evidencia;
- purgar los átomos derivados cuando el documento es eliminado o sustituido;
- auditar qué documentos han contribuido al `EvidenceStore` activo.

El campo `provenance.documentId` es opcional en el tipo (para compatibilidad
con átomos generados antes de que el campo existiera), pero todos los átomos
generados por el sistema a partir del repositorio actual **deben** incluirlo.

### Preservación de fuente primaria

El documento original se preserva íntegro en el repositorio. Ninguna operación
de extracción, síntesis o transformación modifica el documento fuente. Si una
representación derivada resulta incorrecta, se regenera a partir del documento
original; la dirección inversa —modificar el documento a partir de la
evidencia derivada— no existe en el sistema.

### Procedencia

Cada `EvidenceAtom` incluye en su `provenance`:

- `origin`: tipo de fuente (`"health-report"`, `"ibse"`, `"citizen-participation"`, etc.).
- `documentId`: identificador del documento que originó el átomo.
- `sourceLabel`: título legible del documento fuente, cuando está disponible.
- `extractedAt`: marca temporal de la extracción.

Esta procedencia es inmutable: el sistema no reescribe la procedencia de un
átomo ya generado.

---

## 6. Operaciones permitidas

### Añadir (`addMunicipalDocument`)

Registra un documento nuevo en el repositorio. El documento queda en estado
`uploaded`. No genera evidencia derivada por sí solo: la generación ocurre en
la capa de aplicación, con control explícito.

Invariante: el `municipalityId` del documento queda vinculado al `municipalityId`
del repositorio en el momento de la adición. No puede cambiarse posteriormente.

### Asignar desde la Biblioteca documental COMPÁS

La asignación de un documento existente en otro expediente se implementa como
una adición especializada sobre el repositorio activo: nunca se enlaza el
documento externo por referencia mutable. La copia conserva título, tipo,
metadatos documentales, `sourceText` disponible y referencia al archivo original
cuando exista; la procedencia de la copia queda expresada en `source.system` y
en los tags de trazabilidad.

Solo son visibles y asignables automáticamente los marcos estratégicos y
normativos de alcance transversal (`strategic-framework`): EPVSA, ESCA,
planes autonómicos y documentos equivalentes que no describen un expediente
local concreto. Los documentos de ámbito municipal o inframunicipal de otro
territorio —Informes de Salud, activos Localiza, diagnósticos territoriales,
estudios complementarios, materiales cualitativos o evidencias longitudinales
locales— no pertenecen a la Biblioteca COMPÁS interexpediente y no se ofrecen
como documentación adicional del expediente activo.

Si el documento origen ya tenía `EvidenceAtom` derivados, la asignación clona
esos átomos reescribiendo `municipalityId` y `provenance.documentId` hacia el
expediente destino, y añade una cautela metodológica sobre aplicabilidad local.
Si no existen átomos derivados pero la copia contiene `sourceText` procesable,
la capa de aplicación puede ejecutar la misma frontera documento → evidencia
que una ingesta manual.

### Sustituir

La sustitución solo aplica a documentos canónicos y tiene dos variantes:

**Por `kind`** (`replaceMunicipalDocumentByKind`): elimina todos los documentos
previos del mismo `kind` y registra el nuevo. Se usa para `health-report` y
`community-asset`. La purga de evidencia derivada asociada es responsabilidad
de la capa de aplicación.

**Por `tag`** (`removeDocumentsByTag` + `addMunicipalDocument`): elimina todos
los documentos que incluyan el tag canónico y registra el nuevo. Se usa para
IBSE y Priorización Temática. La purga de evidencia derivada asociada es
responsabilidad de la capa de aplicación.

En ambos casos, la sustitución es irreversible en la sesión activa: los datos
del documento anterior desaparecen del repositorio y su evidencia derivada se
purga del `EvidenceStore`.

### Eliminar (`removeMunicipalDocument`)

Elimina un documento concreto por su `documentId`. La eliminación activa una
purga encadenada de la evidencia derivada, garantizando:

1. **Alcance municipal**: solo se purgan átomos cuyo `municipalityId` coincide
   con el municipio activo. Los átomos de otros municipios no se ven afectados.
2. **Purga por `documentId`**: se eliminan los átomos cuyo `provenance.documentId`
   coincide con el documento borrado.
3. **Purga por `origin` (fallback)**: para átomos generados antes de que
   existiera el campo `documentId`, se aplica un filtro por `origin` asociado
   al tipo del documento eliminado:
   - `health-report` → purga átomos con `origin: "health-report"`.
   - `community-asset` → purga átomos con `origin: "community-assets"`.
   - Documentos con tag `"ibse"` → purga átomos con `origin: "ibse"`.
   - Documentos con tag `"thematic-prioritisation"` → purga átomos con
     `origin: "citizen-participation"`.
4. **Aislamiento por tipo**: la purga de un tipo documental no afecta a los
   átomos de otros tipos, siempre que el `municipalityId` sea el correcto.
5. **Limpieza de estado derivado**: al eliminar un documento, el sistema
   también limpia el estado analítico directamente vinculado a él en el
   workspace (p. ej., `healthReport`, `ibseStudy`, `thematicPrioritisation`),
   así como los mensajes de interfaz pendientes relacionados con ese documento.

### Reimportar

La reimportación de un documento canónico (por `kind` o por `tag`) activa la
sustitución descrita en el apartado anterior: el documento previo y su
evidencia derivada se eliminan antes de registrar el nuevo. La reimportación
de un documento acumulable añade una nueva entrada sin afectar a los existentes.

### Validar y archivar (`validateMunicipalDocument`, `archiveMunicipalDocument`)

El repositorio puede marcar documentos como `validated` o `archived`. Estas
operaciones cambian el estado del documento pero no afectan a su evidencia
derivada ni al resto del pipeline. La semántica institucional de la validación
y el archivado queda fuera del contrato del repositorio; es responsabilidad del
equipo técnico del municipio.

---

## 7. Invariantes

Las siguientes afirmaciones son verdaderas en todo momento en que el repositorio
funcione correctamente. Cualquier estado que las viole es un defecto.

**I-R1 — Unicidad del contexto municipal**
Todo documento del repositorio tiene el mismo `municipalityId` que el repositorio
que lo contiene. No existen documentos sin municipio ni documentos de municipios
ajenos en un repositorio.

**I-R2 — Unicidad del Informe de Salud**
En ningún momento puede haber más de un documento con `kind: "health-report"` en
estado activo en el repositorio de un municipio.

**I-R3 — Unicidad de Activos Comunitarios**
En ningún momento puede haber más de un documento con `kind: "community-asset"` en
estado activo en el repositorio de un municipio.

**I-R4 — Unicidad del documento IBSE**
En ningún momento puede haber más de un documento con tag `"ibse"` en el
repositorio de un municipio.

**I-R5 — Unicidad del documento de Priorización Temática**
En ningún momento puede haber más de un documento con tag `"thematic-prioritisation"`
en el repositorio de un municipio.

**I-R6 — IBSE y Priorización Temática son independientes**
La existencia, sustitución o eliminación de un documento IBSE no afecta al
documento de Priorización Temática, y viceversa, aunque compartan
`kind: "redcap-export"`.

**I-R7 — El documento original no se modifica por la extracción**
Ninguna operación de generación de `EvidenceAtom`, ningún motor analítico y
ningún proceso de síntesis modifica el contenido (`sourceText`, `sourceFileName`)
ni los metadatos de procedencia de un documento registrado en el repositorio.

**I-R8 — El borrado es atómico por municipio**
La eliminación de un documento afecta exclusivamente a los átomos de evidencia
del municipio activo. Los átomos de otros municipios no se ven afectados en
ningún caso.

**I-R9 — El repositorio no genera decisiones**
El repositorio preserva documentos. No infiere prioridades, no genera
conclusiones institucionales ni adopta decisiones analíticas. Toda
interpretación sobre los documentos ocurre fuera del repositorio, en la capa
de aplicación.

**I-R10 — Un documento fuente nunca se convierte en PSL ni en Plan compilado**
Ningún documento del repositorio —sea un Informe de Salud, un diagnóstico
territorial o cualquier otro— se transforma automáticamente en el Perfil de
Salud Local ni en el Plan Local de Salud compilado. Estos son objetos analíticos
generados a partir del `EvidenceStore`, no documentos del repositorio.

**I-R11 — La trazabilidad documental se preserva**
Todo `EvidenceAtom` generado a partir de un documento registrado en el
repositorio incluye en su `provenance` el `documentId` del documento origen.
Esta vinculación no puede ser eliminada ni alterada retroactivamente por el
sistema.

**I-R12 — La reutilización intermunicipal siempre crea copia local**
Un documento asignado desde la Biblioteca documental COMPÁS debe existir en el
repositorio destino como `MunicipalDocument` propio, con el `municipalityId` del
destino y tags de procedencia hacia el documento origen. No puede haber un
documento de municipio ajeno dentro del repositorio destino, ni un borrado en el
destino puede modificar el expediente origen.

---

## 8. Exclusiones

Este contrato regula exclusivamente el Repositorio Documental Municipal. Los
siguientes aspectos quedan fuera de su alcance y están regulados por sus
propios contratos:

- **EvidenceAtom y EvidenceStore**: su estructura, ciclo de vida, reglas de
  integridad y comportamiento en el pipeline. Véase `CONTRACT-EVIDENCE.md`.
- **Motor de Interpretación Territorial (MIT)**: el motor que transforma el
  `EvidenceStore` en un Estado Territorial Evolutivo.
- **Reconciliación Interpretativa**: detección y clasificación de tensiones
  entre fuentes.
- **Perfil de Salud Local (PSL)**: el objeto analítico del Nivel 2 que sintetiza
  el diagnóstico territorial.
- **Mediación PSL → Nivel 3**: el contrato que regula que ningún motor del
  Nivel 3 consume salidas del Nivel 2 sin mediación del PSL.
- **Priorización técnica**: generación de candidaturas de priorización.
- **Encaje estratégico EPVSA**: traducción de prioridades a líneas estratégicas.
- **Plan de Acción, Agenda y Seguimiento**: motores del Nivel 3.
- **Persistencia y rehidratación**: el mecanismo de persistencia en
  `localStorage`, la normalización de documentos canónicos al cargar y la
  política de migración de esquema.
- **Compilador del Plan Local de Salud**: producto de exportación documental.
- **Biblioteca Metodológica Canónica**: contratos de instrumentos metodológicos
  (IBSE, SF-12, DUKE, PREDIMED y otros).

---

## Fuente territorial de renta — desarrollo de 2026-11-06

El expediente municipal conserva la fuente oficial de renta que sustenta el Art. 17 quater del contrato metodológico del Perfil. Se registran el organismo, conjunto de datos, URL de origen, fecha de consulta, periodo de referencia y ámbito municipal. El archivo original recuperado se conserva íntegro con SHA-256; su integridad no certifica la interpretación de los datos.

Las tablas y geometrías derivadas conservan el CUSEC completo como texto, las unidades y las notas de cada observación, incluidas las de secreto estadístico. Se documenta la transformación desde el original y se verifica la pertenencia de cada sección al municipio. Los datos de otro municipio no rellenan ausencias locales. La fuente de renta no se registra como un activo de Localiza Salud ni sustituye al Informe sobre la situación de salud.

Una actualización conserva el original y las revisiones anteriores; se vincula explícitamente a la nueva revisión del Perfil. La existencia de un archivo preparado fuera del expediente no acredita su incorporación a Firebase.

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Incorpora la distinción canonicidad-por-kind vs canonicidad-por-tag introducida en commit `1e582f5`. |
| 2026-07-07 | **Revisión D-HR-01 + selector documental.** Tabla de `DocumentKind` ampliada con `strategic-framework` y columna de visibilidad en selector. `health-report` actualizado: DOCX/PDF aceptados; no genera EvidenceAtom (D-HR-01 resuelta). `community-asset` aclarado como tipo interno/legado. `localiza-salud` declarado como vía visible única para activos. `eas-variable`, `cmi-indicator` y `other` marcados como no expuestos en selector. |
| 2026-09-24 | Localiza Salud queda fijada como fuente principal/preferente de activos cuando exista o pueda obtenerse; otras menciones de activos quedan como indicios complementarios o pendientes de reconciliación. |
