# COMPÁS NG — Contrato del repositorio de actuaciones-tipo

> Estado: CONCEPTUAL. Fecha: 2026-10-20. Actualizado 2026-10-21 (§4 bis).
> Petición del autor (2026-10-20): hay actuaciones comunes o muy parecidas entre municipios (GRAFA, GRUSE, talleres de los CPA, actividades de los Puntos Vuela). Debe existir un repositorio de actuaciones-tipo que se pueda modificar y adaptar a cada municipio.

## 1. Propósito

Evitar redactar desde cero las actuaciones que se repiten entre municipios. Una actuación-tipo es una plantilla; la actuación del municipio es una copia adaptada. Este repositorio sirve a la agenda (`CONTRACT-AGENDA-ACTUATIONS`). No forma parte del Plan de Acción ni del diagnóstico, y no es dato local.

## 2. Actuación-tipo

Recoge solo lo descriptivo y transferible: nombre, código, programa, descripción, tipo de actividad, tema principal, colectivo, etapa vital y grupos de edad. Puede llevar una sugerencia de entorno. Las fichas heredadas pueden llevar además población, línea y objetivo EPVSA atribuidos, recursos, profesionales y frecuencia; al adaptar, esos campos se copian a la actuación, que los edita.

No recoge lo propio del municipio: fechas, responsables, contacto, entidades colaboradoras, participantes, recursos, evidencias ni resultados. Esos datos se rellenan al adaptar.

## 3. Orígenes

| Origen | Contenido | Estado de la fuente |
|---|---|---|
| `historico` | 125 actuaciones en 15 programas, tomadas del repo histórico (COMPAS-RESCATE-20260514, `index.html:18390–19014`). Solo código y nombre. | Heredado, **no verificado**. Contrastado con `08_Lineas_EPVSA_02abril24.pdf`: 124 de 125 nombres no aparecen en su texto. Se rotula así en la interfaz. |
| `historico` (fichas) | 32 actuaciones con ficha completa, constante `ACTUACIONES_PADUL_2026` del histórico (`index.html:24458–25626`), redactadas para la agenda de Pádul 2026. Conservan descripción, población, etapa de vida, línea y objetivo EPVSA atribuidos, recursos, profesionales, frecuencia, indicador (solo referencia) y base de evidencia citada (solo se muestra). | Heredado, **no verificado**. No se importan trimestre, prioridad, año, meta, responsable ni organización. Su código «codigoEPVSA» no coincide con el del catálogo de 125 (el mismo código designa otra actuación), por eso no se usa como identificador. «Entorno» pasa solo como sugerencia. Son plantillas aparte del catálogo. |
| `propia` | Creadas por el equipo desde la ficha de una actuación («Guardar como actuación-tipo»). | Autoría humana del equipo; consta el municipio de origen. |

### Catálogo por línea y programa

El catálogo heredado de 125 actuaciones se ofrece también ordenado por línea estratégica → programa → actuación (vista «Catálogo EPVSA por línea y programa» del repositorio), con filtros de línea, ámbito, programa y texto. La estructura (4 líneas, 15 programas, ámbito y objetivos estratégicos vinculados a cada programa) procede de `ESTRUCTURA_EPVSA` del histórico (`index.html:18252`, commit 58be063) Contrastada con `08_Lineas_EPVSA_02abril24.pdf`: las 4 líneas y los objetivos OE 1.1 a 1.7 coinciden literalmente; los textos de OE 2.1, 3.1 y 4.1 del histórico estaban resumidos y se sustituyen por los del documento. Los programas, su ámbito, su vínculo con línea y objetivos y las 125 actuaciones no figuran en el documento: son heredados, **no verificados**. Al añadir una actuación del catálogo, la ficha queda indicada con el marco EPVSA y la línea del programa (vínculo único en la fuente). No se rellena el objetivo, porque el programa se vincula a varios, ni el entorno. Es clasificación, no atribución de resultados ni dato local.

El catálogo heredado se ofrece como punto de partida y no como referencia con fuente. Su campo «ámbito» del histórico no asigna entorno. GRAFA, los talleres de los CPA y las actividades de los Puntos Vuela no figuran en él como actuaciones-tipo (solo «Colaboración con Puntos Vuela (Guadalinfo)», `P01-A21`, y «Grupos Socioeducativos (GRUSE)», `P03-A09`): las aporta el equipo.

## 4. Reglas

- **Adaptar copia, no enlaza.** Usar una plantilla crea una actuación nueva. La plantilla no cambia al editar la actuación, y la actuación guarda `templateRef` (id, origen, nombre) solo como referencia de procedencia.
- **El entorno lo decide una persona.** La actuación entra «sin asignar»; la sugerencia de entorno no se aplica sola.
- **Sin atribución de resultados.** (Las fichas heredadas muestran el indicador que el histórico les atribuía como referencia; no se copia a la actuación.) La plantilla no declara contribución ni resultado. Puede declarar un objetivo y un indicador como orientación, en forma de vínculo potencial (§4 bis). La relación real entre una actuación y un indicador se establece en el Plan de Acción y no se reparte entre actuaciones.
- **El catálogo heredado no se edita.** Para modificar una de sus actuaciones, se adapta y se guarda como propia.
- **Lo propio de cada municipio no sale de su expediente.** Al guardar como actuación-tipo se descartan fechas, responsables, participantes y resultados (I-ACT-TPL-2).

## 4 bis. Vínculo potencial y vínculo real — actualización autorizada 2026-10-21

Decisión del autor (2026-10-21): una actuación-tipo puede indicar a qué objetivo específico, y a qué indicador de ese objetivo, suele orientarse. Es una hipótesis de diseño del catálogo y no un hecho sobre ningún municipio.

- **Vínculo potencial.** Pertenece a la actuación-tipo. Se identifica por códigos estables del marco (marco, objetivo, indicador opcional), no por coincidencia de texto. Conserva origen y fecha. No indica contribución, magnitud ni resultado. En el catálogo heredado no existe: las atribuciones del histórico siguen siendo «no verificado» y no se convierten en vínculos.
- **Vínculo real.** Pertenece a la actuación del municipio y se establece en el Plan de Acción, por decisión del equipo. Usar una plantilla no lo crea. Cuando la actuación se adopta desde un objetivo del Plan, el vínculo potencial puede ofrecerse como punto de partida, y la persona lo acepta o no.
- **Quién edita.** Solo el autor crea, modifica o retira vínculos potenciales. El resto del equipo los consulta y puede proponer cambios fuera de la herramienta.
- **Dónde viven.** Los vínculos potenciales de las actuaciones-tipo propias se guardan en el expediente, con su copia en Firebase (§5). Compartirlos entre municipios sigue pendiente.
- **Qué no hace el sistema.** No sugiere actuaciones a partir de un indicador ni de un diagnóstico. Muestra las que el autor vinculó, cuando la persona consulta ese objetivo.

## 5. Dónde viven

- Catálogo heredado: código (`historicActuationCatalog.ts`), igual para todos los expedientes.
- Actuaciones-tipo propias: en el expediente del municipio (`actuationTemplates`), con su persistencia y su copia en Firebase.

**Decisión pendiente (autor):** compartir las actuaciones-tipo propias entre municipios exige un almacén común (colección propia en Firebase con sus reglas de acceso) o un fichero de intercambio. Hoy cada expediente conserva las suyas y no hay vía automática para pasarlas de un municipio a otro. No se asume ninguna de las dos.

## 6. Relación con otros contratos

`CONTRACT-AGENDA-ACTUATIONS` (la actuación adaptada es una actuación de agenda), `CONTRACT-ACTION-PLAN-CATALOG` (el repositorio no es parte del Plan de Acción).

## 7. Invariantes

- **I-ACT-TPL-1:** adaptar una plantilla no la modifica.
- **I-ACT-TPL-2:** una actuación-tipo propia no contiene fechas, responsables, contacto, participantes, evidencias ni resultados.
- **I-ACT-TPL-3:** el origen y el estado de la fuente se muestran siempre; lo heredado se rotula «no verificado».
- **I-ACT-TPL-4:** ninguna plantilla asigna entorno, trimestre ni prioridad por sí sola.
- **I-ACT-TPL-5:** un vínculo potencial es una orientación declarada por el autor; no es contribución, no se convierte en vínculo real sin decisión del equipo y no se infiere por texto.
