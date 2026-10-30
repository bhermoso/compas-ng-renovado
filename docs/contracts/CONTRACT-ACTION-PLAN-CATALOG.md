# CONTRATO DEL CATÁLOGO TEMÁTICO DEL PLAN DE ACCIÓN

> PA-RELAS-02 · Versión 1.0 — 2026-09-04  
> Estado: VIGENTE

## 1. Posición en la cadena

El catálogo solo se consulta después de una selección deliberativa vigente:

`PSL validado → Lectura Estratégica Local → selección del Grupo Motor → módulos temáticos propuestos`

El catálogo no participa en el diagnóstico ni altera retrospectivamente el
Perfil de Salud Local. Tampoco selecciona prioridades.

## 2. Primera versión del catálogo

La versión inicial contiene dos módulos documentados a partir del I Plan Local
de Salud del Distrito Zaidín 2027–2030:

| Módulo | Objetivos generales | Objetivos específicos | Indicadores trazadores |
|---|---:|---:|---:|
| Envejecimiento saludable | 9 | 18 | 18 |
| Prevención y abordaje de las adicciones | 6 | 12 | 12 |

Cada módulo conserva versión, procedencia, códigos y cautelas. La fuente es una
propuesta reutilizable, no evidencia de que sus contenidos sean adecuados para
otro municipio.

## 3. Regla de elegibilidad

Los módulos se muestran siempre como catálogo consultable en el espacio Plan de
Acción. Sus objetivos e indicadores pueden examinarse antes de decidir, pero no
pueden aceptarse, adaptarse o rechazarse todavía.

La revisión de un módulo solo se habilita cuando el Grupo Motor vincula
expresamente una prioridad seleccionada con el identificador estable del módulo.
No se permiten equivalencias por coincidencia textual, inferencia semántica,
puntuación ni expansión automática de palabras clave.

## 4. Revisión humana por elemento

Líneas estratégicas, objetivos generales, objetivos específicos e indicadores nacen en estado
`pending`. El Grupo Motor puede, de forma independiente:

- `accepted`: aceptar la propuesta sin cambios;
- `adapted`: conservar la propuesta y registrar una redacción municipal;
- `rejected`: rechazarla;
- `pending`: mantenerla pendiente.

Una adaptación sin redacción municipal explícita es inválida. La revisión debe
identificar al equipo o Grupo Motor que la registra.

## 5. Trazabilidad y obsolescencia

Cada revisión conserva:

- municipio;
- módulo y versión;
- Lectura Estratégica de origen;
- selección deliberativa de origen;
- escenarios seleccionados que habilitaron la propuesta;
- decisión y adaptación por elemento;
- autoría y fecha de la revisión.

La revisión queda obsoleta si cambia la Lectura Estratégica, la selección, los
escenarios de origen o la versión del módulo. Nunca se migra ni se reaprueba de
forma automática.

## 6. Límites institucionales

Las fuentes y periodicidades de los indicadores son propuestas para validación.
Antes de medir deben cerrarse definición operacional, numerador, denominador,
fuente, desagregaciones, línea base, meta y responsable del dato.

El catálogo no inventa actuaciones ni asigna responsables, plazos, recursos,
presupuestos o compromisos institucionales. Estas decisiones pertenecen al
municipio y son posteriores a PA-RELAS-02.

## 7. Preparación editable previa — actualización autorizada 2026-09-09

La preparación de un borrador puede realizarse antes de la elegibilidad formal.
Se guarda separadamente en `planPreparationDrafts`, por municipio y módulo, y no
alimenta la selección deliberativa, el PAI ni las revisiones formales. Permite
incluir, excluir, modificar o dejar pendientes elementos. Excluir un ascendiente
retira sus descendientes del borrador sin borrar sus decisiones, fichas o actuaciones.

Desde 2026-09-24, `PlanPreparationDraft` puede transportar también:

- `unaddressedNeeds?: UnaddressedNeed[]`, para documentar necesidades diagnosticadas no priorizadas o declarar que todas han quedado incorporadas al Plan de Acción (G-PLS-7);
- `evaluationFramework?: PLSEvaluationFramework`, para preservar preguntas, momentos, responsable y nota de línea base del futuro marco de evaluación del PLS (G-PLS-10).

Estos campos se editan en `PlanPreparationPanel` y viajan a `PlanDocument` cuando se valida o exporta la versión del Plan de Acción. Preparan el consumo posterior por `LocalHealthPlanCompiler`, pero su presencia no convierte la preparación editable en aprobación institucional ni en Plan Local de Salud compilado.

Para El Zaidín se presenta la propuesta editorial 92418 en cuatro bloques, con los
18 códigos específicos y sus indicadores originales. El catálogo 3.1 y sus
revisiones se conservan como referencia formal anterior. No se traslada aprobación
entre versiones ni se aplica esta redacción local a otros municipios. La adopción
formal de la nueva versión requiere una integración posterior explícita; esta
entrega habilita preparación y revisión metodológica, no aprobación automática.

## 8. Actuaciones fuera del Plan de Acción — actualización autorizada 2026-10-19

El Plan de Acción lo componen líneas estratégicas, objetivos e indicadores. Las actuaciones y las agendas anuales son un instrumento separado (`CONTRACT-AGENDA-ACTUATIONS`). Las fichas de actuación de la ficha del indicador se conservan como instrumento de recogida de datos para consolidar el indicador; no convierten las actuaciones en parte del Plan de Acción ni permiten atribuirles una parte del resultado del indicador. No se retira ninguna función.

## 9. La EPVSA como módulo y ampliación del catálogo — actualización autorizada 2026-10-21

Decisiones del autor (2026-10-21):

- **La EPVSA es un módulo más.** Sus líneas, objetivos específicos e indicadores entran en el catálogo del Plan de Acción como módulo, con la misma versión, procedencia y cautelas que los demás. Su fuente es `08_Lineas_EPVSA_02abril24.pdf`. El módulo no se rellena con el registro actual de marcos estratégicos, cuyos nombres y objetivos no coinciden con ese documento (decisión pendiente del autor).
- **Ampliación.** Pueden añadirse módulos (por ejemplo, otras líneas temáticas), objetivos, indicadores y actuaciones-tipo vinculadas. Solo el autor lo hace. Cada ampliación conserva versión y procedencia.
- **Dónde vive lo añadido.** En el expediente de cada municipio, con su copia en Firebase. El catálogo del código no se modifica desde la aplicación.
- **Vínculos.** Se establecen por código estable de módulo, objetivo e indicador. Valen las reglas de elegibilidad de §3 y las de vínculo potencial y real de `CONTRACT-ACTUATION-TEMPLATES` §4 bis.
- **Qué no cambia.** Las actuaciones siguen fuera del Plan de Acción (§8). Ver las actuaciones-tipo vinculadas a un objetivo no las incorpora al Plan, ni a la agenda, ni asigna parte del resultado del indicador. El sistema no genera ni sugiere actuaciones.

## 10. Cuatro bloques en Zagra — encargo del autor de 2026-10-28

La línea de envejecimiento saludable de Zagra adopta la estructura vigente del
Zaidín: Edadismo, Soledad no deseada, Autonomía y Participación. Esta adaptación
expresa amplía a Zagra el ámbito de reutilización previsto en §7. Conserva los
18 códigos de objetivos específicos y sus indicadores, con textos referidos al
municipio de Zagra y procedencia identificada. No incorpora las decisiones del
expediente del Zaidín. Las otras líneas de Zagra conservan su estructura.

La versión territorial es `zagra-cuatro-bloques-2026-10-28`. Los cuatro grupos
usan códigos propios `ZAGRA-ENV-OG1` a `ZAGRA-ENV-OG4`, porque los antiguos
`ENV-OG1` a `ENV-OG9` agrupaban contenidos distintos. La edición, el Plan
resultante, la exportación y el esbozo del PLS utilizan la misma estructura.

Si existe un borrador municipal 3.1, se archiva íntegro antes de reagruparlo.
Se conservan las redacciones de objetivos específicos, indicadores, fichas y
actuaciones. La exclusión de un grupo anterior se conserva en sus objetivos
específicos; los nuevos grupos quedan pendientes de revisión. Una versión
desconocida no se transforma automáticamente. Esta operación no valida el Plan,
no sustituye versiones institucionales y no crea actuaciones ni compromisos.


### Compatibilidad y conservación — corrección de 2026-10-30

La misma transformación 3.1 se aplica al preparar la lectura del borrador
territorial de Firebase. Abrirlo no escribe: el coordinador guarda la nueva
versión con su original íntegro en `migration.draft`, dentro de la misma
transacción y con control de versión concurrente. Las revisiones previas siguen
asociadas a su versión de origen; no se reutilizan al iniciar una revisión nueva.
Las cuentas de consulta y administración conservan sus permisos existentes.

La exclusión conserva separadamente la decisión individual y su redacción. Una
reincorporación explícita recupera las adaptaciones; también al reincorporar un
módulo completo. Si el expediente ya fue reagrupado, la recuperación utiliza
exclusivamente su borrador original archivado y no sustituye ediciones posteriores.

Una referencia incompatible no se edita, proyecta ni exporta como la versión
actual. Los nombres de bloque pertenecen a la versión del módulo, no se deducen
de códigos reutilizados. Las salidas comparten el orden editorial y señalan los
bloques pendientes. Las descargas distinguen el borrador actual de la última
versión validada, que se mantiene inmutable.

### Notación visible de envejecimiento saludable — 2026-10-30

En las estructuras de cuatro bloques de Zaidín y Zagra se aplica una jerarquía
común: `ENV-OEST` (objetivo estratégico), `ENV-OGb` (objetivo general del bloque),
`ENV-OEb.n` (objetivo específico) y `ENV-Ib.n` (su indicador).

| Bloque | Objetivo general | Objetivos específicos | Indicadores |
|---|---|---|---|
| 1. Edadismo | ENV-OG1 | ENV-OE1.1 a ENV-OE1.2 | ENV-I1.1 a ENV-I1.2 |
| 2. Soledad no deseada | ENV-OG2 | ENV-OE2.1 a ENV-OE2.7 | ENV-I2.1 a ENV-I2.7 |
| 3. Autonomía | ENV-OG3 | ENV-OE3.1 a ENV-OE3.4 | ENV-I3.1 a ENV-I3.4 |
| 4. Participación | ENV-OG4 | ENV-OE4.1 a ENV-OE4.5 | ENV-I4.1 a ENV-I4.5 |

Son códigos de presentación, no claves de almacenamiento. Los identificadores
originales de objetivos, indicadores y grupos territoriales conservan sus
vínculos con decisiones, revisiones, fichas, instrumentos y actuaciones. No se
sustituyen claves por etiquetas numéricas, pues una etiqueta nueva puede
coincidir con un identificador antiguo de otro objetivo. La correspondencia se
resuelve siempre dentro de la versión del módulo.

Pantalla, controles accesibles, esbozo, instrumentos y exportaciones del borrador
usan la misma notación. Las versiones documentales ya validadas mantienen sus
códigos impresos. La visualización de una ficha guardada puede actualizar sus
etiquetas dentro de la misma versión sin cambiar su texto, sus datos ni la
referencia original; una versión distinta sigue marcada como referencia antigua.
El catálogo original 3.1, Loja y otras líneas mantienen su numeración anterior.
