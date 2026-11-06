# COMPÁS NG — Contrato de Persistencia y Rehidratación

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes y los límites de la
> persistencia, rehidratación y migración del workspace municipal en COMPÁS NG.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-27

---

## 1. Propósito

### Desarrollo para renta territorial — 2026-11-06

La incorporación de renta por sección conserva en el workspace municipal la fuente y las observaciones vinculadas al expediente y a su revisión del Perfil. El CUSEC se conserva como texto, sin perder ceros; se preservan periodo, unidad, valor literal, notas, condición de cota y referencia a la geometría de su periodo. Guardar y volver a cargar no convierte cotas o ausencias en números exactos ni mezcla secciones de municipios distintos.

Antes de declarar completada una incorporación en Firebase se relee la revisión desde el servidor y se contrasta la identidad municipal, las secciones, los indicadores y sus notas con el original. Se comprueba también que la revisión vigente sea la prevista y que las anteriores permanezcan conservadas. Una descarga local, una vista del navegador o este desarrollo contractual no acreditan por sí solos esa persistencia. No se migra ni sobrescribe automáticamente un expediente histórico por añadir estas reglas.

Este contrato establece cómo COMPÁS NG guarda, carga, normaliza y migra el
estado completo de un municipio entre sesiones de trabajo. El objetivo es que
el equipo técnico pueda cerrar y abrir la aplicación sin perder la información
acumulada, y que esa información sea confiable y coherente cuando se recarga.

La persistencia no es el pipeline analítico: no genera evidencia, no ejecuta
motores ni produce propuestas. Es la garantía de que el estado válido sobrevive
entre sesiones.

---

## 2. Unidad persistida: el workspace municipal

La unidad de persistencia es el **workspace municipal completo**
(`MunicipalityWorkspace`). No se persisten documentos sueltos, átomos
individuales, resultados de motores ni estados parciales.

El workspace contiene:

| Campo | Descripción |
|---|---|
| `municipality` | Contexto del municipio (identidad, nombre, provincia, código INE) |
| `repository` | Repositorio Documental Municipal (documentos y sus metadatos) |
| `evidenceStore` | Colección de `EvidenceAtom` del municipio |
| `healthReport` | Informe de Salud estructurado, si existe |
| `ibseStudy` | Estudio complementario IBSE procesado, si existe |
| `dukeStudy` | Estudio DUKE-EAS procesado, si existe |
| `predimedStudy` | Estudio PREDIMED-EAS procesado, si existe |
| `sf12Study` | Estudio SF-12 EAS procesado, si existe |
| `suenoStudy` | Estudio Sueño EAS procesado, si existe |
| `cageStudy` | Estudio CAGE-EAS procesado, si existe |
| `thematicPrioritisation` | Priorización temática activa, si existe |
| `thematicPrioritisationStudy` | Estudio estadístico de priorización, si existe |
| `historialEstadosTerritorial` | Snapshots compactos del Estado Territorial Evolutivo (max. 50) |
| `validatedPSL` | PSL validado técnicamente, si el equipo lo ha validado |
| `schemaVersion` | Versión del esquema de serialización |
| `createdAt` | ISO 8601 de creación del workspace |
| `updatedAt` | ISO 8601 de última modificación |

---

## 3. Aislamiento municipal

Cada municipio tiene su propio espacio de almacenamiento, identificado por una
clave que incluye el `municipalityId`:

```
compas-ng:workspace:{municipalityId}
```

Las operaciones sobre un municipio no leen ni modifican los datos de otro. No
existe estado compartido entre municipios en localStorage.

Adicionalmente, el sistema persiste la lista de municipios personalizados
(creados por el equipo durante una sesión) en una clave separada:

```
compas-ng:custom-municipalities
```

Esta clave almacena solo los metadatos de identificación de cada municipio
personalizado (`id`, `name`, `province`, `ineCode`), no su workspace.

### 3.1 Cambio de municipio activo

Al cambiar de municipio, la aplicación:

1. Guarda el workspace actual antes de cambiar (el guardado es reactivo: ocurre
   automáticamente en el `useEffect` que observa el workspace).
2. Carga el workspace del municipio destino desde localStorage, o crea uno
   nuevo si no existe.
3. Reinicia completamente el estado de UI relacionado con el municipio anterior
   (formularios, mensajes de carga, selecciones pendientes).

El municipio anterior no se desaloja de localStorage: su workspace sigue
persistido y se recupera si el equipo vuelve a seleccionarlo.

---

## 4. `schemaVersion`

### 4.1 Versión actual

```
"1.0.0"
```

Este valor es una cadena semántica definida en `createMunicipalityWorkspace` y
verificada en `loadWorkspaceFromLocalStorage`.

### 4.2 Compatibilidad hacia atrás

El sistema **no es compatible** con workspaces cuyo `schemaVersion` sea
distinto de la versión actual. Si al cargar se detecta una versión diferente,
`loadWorkspaceFromLocalStorage` devuelve `null` y la aplicación crea un
workspace nuevo vacío para ese municipio.

Esta política es conservadora: descarta datos de versiones distintas en lugar
de intentar migrarlos automáticamente. Es la acción correcta cuando no se
puede garantizar la coherencia de la estructura antigua.

### 4.3 Cuándo debe incrementarse `schemaVersion`

`schemaVersion` debe incrementarse en los siguientes casos:

- Se elimina un campo del workspace que existía en versiones anteriores.
- Se cambia la semántica de un campo existente de forma incompatible (p. ej.,
  un número pasa a ser un objeto).
- Se añade un campo **obligatorio** que no puede tener valor por defecto
  seguro en un workspace anterior.

En estos casos debe implementarse una migración explícita en
`loadWorkspaceFromLocalStorage` antes de incrementar la versión, o aceptar
que los workspaces antiguos se descarten.

### 4.4 Cuándo no es necesario incrementar `schemaVersion`

- Se añade un campo **opcional** con valor por defecto seguro (p. ej., un
  array que puede empezar vacío). La ausencia del campo en workspaces
  anteriores se gestiona con migraciones puntuales sin cambio de versión.

---

## 5. Guardado

### 5.1 Cuándo se guarda

El workspace se guarda automáticamente en `localStorage` en cada cambio de
estado. La aplicación observa el workspace con `useEffect` y llama a
`saveWorkspaceToLocalStorage` en cada actualización. El guardado es síncrono
desde el punto de vista del ciclo de React, aunque la escritura en localStorage
es una operación del navegador.

Adicionalmente, hay un guardado explícito al completar la importación de
Priorización Temática, para asegurar que el workspace actualizado se
persiste aunque el efecto reactivo no se haya ejecutado aún.

### 5.2 Qué se guarda exactamente

El workspace se serializa como JSON. Antes de serializar, se aplica
`stripHtmlFields` (véase §7). No se guarda el estado de los motores analíticos
(MIT, Reconciliación, PSL no validado, Plan de Acción, Agenda, Seguimiento):
estos se recalculan en cada sesión.

### 5.3 Fallo de guardado

Si `localStorage.setItem` falla (cuota excedida, localStorage deshabilitado),
`saveWorkspaceToLocalStorage` devuelve `false` y la aplicación muestra un aviso:

> «No se pudo guardar el espacio de trabajo en este navegador. La selección
> puede perderse al recargar.»

Un fallo de guardado no es un error fatal: la sesión continúa en memoria. Los
datos de esa sesión se perderán al recargar.

---

## 6. Carga y rehidratación

### 6.1 Secuencia de carga

Al inicializar la aplicación o al cambiar de municipio, se ejecuta:

```
1. localStorage.getItem("compas-ng:workspace:{municipalityId}")
2. Si null o excepción → crear workspace nuevo vacío
3. JSON.parse del valor recuperado
4. Verificar schemaVersion → si no coincide, descartar y crear nuevo
5. Aplicar migraciones puntuales (§6.2)
6. normalizeCanonicalDocuments → deduplicación + purga de huérfanos (§6.3)
7. Devolver workspace rehidratado
```

### 6.2 Migraciones puntuales aplicadas en la carga

Las siguientes migraciones se aplican automáticamente al cargar, sin cambio
de `schemaVersion`:

**Migración M-1: `healthReports[]` → `healthReport`**

Si el workspace cargado contiene el campo `healthReports` como array (formato
anterior al refactoring del Informe de Salud), se extrae el primer elemento
como `healthReport` singular y se elimina el array:

```
parsed.healthReport = parsed.healthReports[0] ?? undefined
delete parsed.healthReports
```

Esta migración es idempotente: si ya existe `healthReport`, el campo
`healthReports` no estará presente y la migración no tiene efecto.

**Migración M-2: `ibseStudy.methodologicalCautions`**

Si el workspace contiene un `ibseStudy` sin el campo `methodologicalCautions`
(campo añadido en commit `b66193a`), se rellena con un array vacío:

```
parsed.ibseStudy.methodologicalCautions = []
```

Esta migración garantiza que el tipo `IBSEStudy` sea estructuralmente válido
en workspaces importados desde versiones anteriores a la adición del campo.

### 6.3 Normalización de documentos canónicos (`normalizeCanonicalDocuments`)

Tras las migraciones, se aplica la normalización de documentos canónicos. Esta
función sanea dos invariantes que pueden haberse violado en sesiones anteriores
a la introducción de los controles de canonicidad.

**Paso 1 — Deduplicación de tipos canónicos**

Los tipos documentales canónicos por `kind` son:
- `health-report`
- `community-asset`

Si el repositorio contiene más de un documento activo de alguno de estos tipos,
la normalización conserva únicamente el más reciente según `createdAt`
(comparación lexicográfica de ISO 8601). En caso de empate, se conserva el
último del array. Los demás se eliminan del repositorio.

**Paso 2 — Purga de átomos huérfanos**

Tras la deduplicación, se eliminan del `evidenceStore` todos los átomos
cuyo `provenance.documentId` apunte a un documento que ya no existe en el
repositorio (después de la deduplicación del paso anterior).

**Condición de aplicación**: si no hay duplicados ni huérfanos, la
función devuelve el workspace original sin modificarlo.

**Conservación de átomos sin `documentId`**: los átomos que no tienen
`provenance.documentId` **no se purgan**. Se trata de átomos generados antes
de la introducción del campo (evidencia legacy) y se conservan para no perder
información válida. Sin embargo, estos átomos no pueden ser purgados de forma
precisa si su documento fuente es eliminado; en ese caso se aplica la purga
por `origin` como fallback (véase `CONTRACT-REPOSITORY.md §6`).

---

## 7. `stripHtmlFields`

### 7.1 Por qué existe

El Informe de Salud cargado desde DOCX o PDF puede contener HTML renderizable
en los campos `body.originalHtml` y `section.bodyHtml`. Este HTML puede ser
significativamente más grande que el texto plano correspondiente, lo que
puede llevar al sistema a superar la cuota de localStorage (~5 MB).

`stripHtmlFields` reduce el tamaño del workspace serializado eliminando los
campos HTML antes de escribir en localStorage.

### 7.2 Qué elimina

- **`healthReport.body.originalHtml`**: HTML original completo del documento.
  Se elimina siempre. No es necesario para el análisis territorial; es una
  representación de visualización del documento fuente.
- **`healthReport.sections[*].bodyHtml`**: HTML de cada sección, excepto en
  los casos descritos en §7.3.

### 7.3 Qué preserva

- **`bodyHtml` de secciones que contienen tablas** (`bodyHtml.includes("<table"`)):
  las tablas se preservan porque la reconstrucción desde `bodyText` pierde el
  formato tabular y puede hacer ilegible el contenido de la sección. El
  `bodyText` de las mismas secciones siempre se preserva como fallback de
  visualización cuando `bodyHtml` está ausente.
- **`bodyText` de todas las secciones**: siempre se preserva. Es la fuente
  de los `EvidenceAtom` generados y la representación de visualización
  por defecto.

### 7.4 Riesgo de persistir HTML pesado

Si `stripHtmlFields` no se aplica o deja de aplicarse, el workspace serializado
puede superar la cuota de localStorage. En ese caso, `saveWorkspaceToLocalStorage`
devuelve `false` y los datos de la sesión se pierden al recargar. El riesgo es
proporcional al tamaño del documento HTML: informes de salud en formato DOCX
con imágenes embebidas como base64 pueden ser especialmente grandes.

---

## 8. `historialEstadosTerritorial`

El historial de estados territoriales es un array de snapshots compactos
(`TerritorialStateRecord`) que acumula una entrada por cada cambio verificable
en el `EvidenceStore`.

### 8.1 Cuándo se añade un snapshot

Un snapshot se añade cuando:
- `runtime.mit.totalEvidencias > 0` (el store no está vacío), **y**
- `runtime.mit.version !== historial.at(-1)?.version` (la versión del MIT
  ha cambiado respecto al último snapshot registrado).

`runtime.mit.version` es igual a `evidenceStore.updatedAt`, que cambia
únicamente cuando se añaden, modifican o eliminan átomos. Esto hace el
historial idempotente: re-renders sin cambios en la evidencia no añaden
entradas duplicadas.

### 8.2 Límite de entradas

El historial tiene un máximo de **50 entradas** por municipio. Cuando se añade
una entrada nueva que superaría ese límite, se descarta la más antigua:

```
historialEstadosTerritorial: [
  ...(prev.historialEstadosTerritorial ?? []).slice(-49),
  resumen
]
```

### 8.3 Qué contiene un snapshot

Los snapshots son compactos: contienen conteos escalares, resúmenes de texto
y listas de strings (tensiones, orígenes, marcos). No contienen arrays de
`EvidenceAtom` ni contenido de documentos. Esto hace que el historial sea
persistible en localStorage sin explosión de tamaño.

---

## 9. Interfaz `WorkspacePersistence`

La interfaz `WorkspacePersistence` (en `src/contracts/workspace/`) define el
contrato abstracto de persistencia:

```typescript
interface WorkspacePersistence {
  save(workspace: MunicipalityWorkspace): Promise<void>;
  load(municipalityId: MunicipalityId): Promise<MunicipalityWorkspace | null>;
  exists(municipalityId: MunicipalityId): Promise<boolean>;
}
```

Existen dos implementaciones:

| Implementación | Almacenamiento | Estado |
|---|---|---|
| `LocalStorageWorkspacePersistence` | `localStorage` del navegador | En producción (funciones exportadas, no clase) |
| `InMemoryWorkspacePersistence` | Mapa en memoria | Disponible; no inyectada en la aplicación |

`InMemoryWorkspacePersistence` implementa la interfaz correctamente y es
adecuada para pruebas y entornos sin acceso a `localStorage`. Su comentario
de cabecera indica explícitamente que no está inyectada en la aplicación
actual y que el workspace vive en estado React.

---

## 10. Garantías

**G-P1 — No pérdida silenciosa de datos válidos en la carga**

Si `loadWorkspaceFromLocalStorage` devuelve un workspace, todos los documentos,
átomos, estudios y PSL validado que estaban presentes al guardar también están
presentes al cargar, salvo los eliminados explícitamente por las
normalizaciones (duplicados canónicos) o las migraciones (formato anterior).
Ninguna normalización elimina datos sin criterio documentado.

**G-P2 — No contaminación entre municipios**

La clave de almacenamiento incluye el `municipalityId`. Una operación sobre el
municipio A no puede leer ni modificar los datos del municipio B.

**G-P3 — No duplicación canónica persistente**

Tras la normalización de carga, el repositorio nunca contiene más de un
documento activo con `kind: "health-report"` ni más de uno con
`kind: "community-asset"`. Si la sesión anterior introdujo duplicados, la
carga siguiente los corrige.

**G-P4 — No conservación de evidencia huérfana con `documentId` trazable**

Los átomos cuyo `provenance.documentId` no corresponde a ningún documento del
repositorio —después de la deduplicación— son purgados en la carga. Solo se
conservan los átomos huérfanos cuyo `documentId` es `undefined` (evidencia
legacy sin trazabilidad completa).

**G-P5 — Fallback seguro ante versiones antiguas o datos corruptos**

Si el workspace almacenado tiene una `schemaVersion` distinta, está corrupto
(JSON inválido) o no existe, el sistema crea un workspace vacío nuevo sin
lanzar un error al usuario. La aplicación arranca siempre en un estado
coherente.

**G-P6 — El PSL validado sobrevive entre sesiones**

`workspace.validatedPSL` se persiste como parte del workspace. Al recargar,
el runtime lo detecta y lo usa directamente como PSL canónico sin recalcular
un borrador nuevo. La validación técnica del equipo no se pierde entre sesiones.

**G-P7 — El fallo de guardado es visible, no silencioso**

Si `saveWorkspaceToLocalStorage` falla, la aplicación muestra un aviso
explícito al equipo. No hay pérdida silenciosa de datos: el equipo sabe que
la sesión actual no se está persistiendo.

---

## 11. Exclusiones

Este contrato regula exclusivamente la persistencia, carga, normalización y
migración del workspace. Los siguientes aspectos quedan fuera de su alcance:

- **Generación de EvidenceAtom**: pipelines de evidencia. Véase
  `CONTRACT-EVIDENCE.md`.
- **Motor de Interpretación Territorial (MIT) y PSL**: análisis territorial
  y ciclo de vida del PSL. Véase `CONTRACT-MIT-PSL.md`.
- **Repositorio Documental**: ciclo de vida de documentos, canonicidad por
  `kind` o `tag`, operaciones de sustitución y borrado. Véase
  `CONTRACT-REPOSITORY.md`.
- **Plan de Acción, Agenda, Seguimiento y Compilador**: motores del Nivel 3.
- **Interfaz de usuario**: presentación del estado de persistencia, mensajes
  de error, formularios.
- **Sincronización multi-dispositivo o multi-sesión**: no implementada. El
  sistema solo garantiza persistencia local en el dispositivo del equipo.

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Documenta el estado del código a partir del commit `1e582f5`. Formaliza el esquema de claves, `schemaVersion`, las migraciones M-1 y M-2, la normalización de documentos canónicos, la purga de huérfanos, `stripHtmlFields` y el historial territorial con su límite de 50 entradas. |
| 2026-06-27 | Sprint 0: §2 actualizado para incluir `dukeStudy`, `predimedStudy`, `sf12Study`, `suenoStudy` y `cageStudy`, añadidos al workspace en commits `0bf5026`, `9aad479`, `7f47034`, `20080cd` y `9c73fa0` respectivamente y omitidos en la primera redacción. |
