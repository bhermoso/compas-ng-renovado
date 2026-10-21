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

