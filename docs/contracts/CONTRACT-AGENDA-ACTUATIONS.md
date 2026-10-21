# COMPÁS NG — Contrato de la agenda de actuaciones por entornos

> Estado: CONCEPTUAL. Fecha: 2026-10-19.
> Decisiones del autor (2026-10-19): se conservan los cuatro entornos del histórico; la agenda admite alta manual además del volcado desde el Plan de Acción; la ficha es completa y se presenta por bloques; el bloque de resultado vive en el expediente (Firebase) y alimenta la agenda y el seguimiento y evaluación.
> Decisión del autor (2026-10-19, posterior): las agendas anuales no forman parte del Plan de Acción. Se conservan como instrumento propio de ejecución, con entidad separada del plan. La guía rápida de planes locales de salud de la Junta de Andalucía (2014) las sitúa en la fase de ejecución del Plan de Acción; COMPÁS no sigue ese criterio.

## 1. Propósito

Dar al equipo técnico un registro de las actuaciones del municipio, organizado por entornos, con una ficha completa por actuación. La actuación es un registro con autoría humana. El sistema no genera actuaciones, trimestres ni prioridades.

## 2. Relación con otros contratos

- `CONTRACT-INSTITUTIONAL-LIFECYCLE`: el `AgendaDraft` sigue siendo un objeto derivado y efímero que recibe la validación formal como registro externo. Este contrato no lo modifica. La actuación es otro objeto: un registro persistido. Cómo se relaciona la validación formal de la agenda con las actuaciones registradas queda sin decidir y se resuelve por separado.
- Plan de Acción vigente (`CONTRACT-ACTION-PLAN-CATALOG`, `IndicatorWorksheet`): las actuaciones del plan ya tienen ficha, actividades, entregas de datos y consolidación del indicador (`WorksheetAction`). Esos datos viven en el plan y la agenda no los copia. La agenda no es parte del Plan de Acción: es un instrumento separado, con su propio registro y su propio ciclo. La actuación de agenda puede vincularse a una actuación de la ficha del plan (`linkedAction`), pero el vínculo es una referencia y no una pertenencia. En el documento del Plan Local de Salud las actuaciones y la agenda ocupan su propia sección (VIII), separada del Plan de Acción (VII), según `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` §3.1 bis. Si las actuaciones dejan de recogerse en las fichas del plan, el volcado deja de tener origen y la agenda sigue funcionando por alta manual.
- Repositorio de actuaciones-tipo (`CONTRACT-ACTUATION-TEMPLATES`): una actuación puede crearse adaptando una plantilla. La actuación es una copia y guarda `templateRef` como referencia de procedencia.
- Seguimiento y evaluación: puede leer el bloque de resultado de las actuaciones. No lo copia ni lo duplica. La vista Evaluación no incorpora la agenda ni su resumen: la agenda se trabaja en su propia vista (decisión del autor, 2026-10-20).

## 3. Entornos

Cuatro entornos, con los nombres del histórico: sanitario, comunitario, educativo y laboral. Una actuación pertenece a un entorno o está «sin asignar». Solo una persona cambia el entorno de una actuación, por arrastre o desde la ficha. No hay asignación automática.

## 4. Origen de las actuaciones

1. Alta manual.
2. Volcado desde el Plan de Acción. Cada actuación del plan genera como máximo un registro de agenda, vinculado a ella. Entra «sin asignar», porque el plan no declara entorno. El volcado no inventa entorno, trimestre ni prioridad.

### Fuente única de cada dato

En un registro vinculado, los datos que el plan ya recoge se leen del plan y no se copian: nombre, descripción (contribución), responsable, población, calendario y recursos. Se muestran en la ficha como lectura, con la indicación de dónde se editan. El resultado de un indicador no se lee ni se muestra en la actuación (§6). Todo lo demás se guarda en el registro de agenda. En un registro manual, todos los campos se guardan en el registro de agenda.

## 5. Ficha por bloques

| Bloque | Contenido |
|---|---|
| Identificación | nombre, código, programa, descripción, tipo de actividad, temática principal y secundarias, ámbito territorial, año, trimestre |
| Vínculo estratégico | marco, línea, objetivo, indicador principal y secundarios, meta, frecuencia |
| Población | población, colectivo, etapa de vida, grupos de edad, participantes previstos y alcanzados, mujeres, hombres, otro o no consta, número de sesiones |
| Responsables | responsable, organización, entidad responsable, persona referente, contacto, profesionales, entidades colaboradoras, asociaciones implicadas, activos comunitarios |
| Seguimiento | estado, prioridad, fecha prevista y real, recursos, evidencia, observaciones |
| Resultado | lo realizado según su registro propio, resultado observado de la actuación, fuente de verificación, barreras, facilitadores, aprendizajes, decisión para el siguiente ciclo |

En un registro manual solo el nombre es obligatorio. En uno vinculado el nombre procede del plan. Un campo vacío se muestra como «sin dato». No se rellena ni se aproxima.

## 6. Bloque de resultado

1. Vive en el registro de agenda y se guarda en el expediente, que se sincroniza con Firebase. No hay copia en seguimiento ni en evaluación. El valor de un indicador no se escribe ni se muestra en la actuación: se consolida en el Plan de Acción por indicador. No se conoce en qué medida contribuyó cada actuación, y la agenda no lo atribuye. La actuación registra lo que puede contar por sí misma (realización) y el indicador al que declara contribuir.
2. Lo rellena el equipo. El sistema no calcula cumplimiento, no puntúa y no etiqueta resultados.
3. La decisión para el siguiente ciclo es una decisión humana: mantener, modificar, escalar, suspender, evaluar más o no decidido.
4. Los participantes por sexo y grupos de edad son recuentos declarados. Si se usan para evaluar representatividad, se hace con SAM (`CONTRACT-DYNAMIC-TRIPYRAMID`).

## 7. Persistencia

Las actuaciones se guardan en el expediente del municipio. Eliminar una actuación la elimina también de Firebase junto con el resto del expediente. Cada actuación lleva un orden numérico dentro de su entorno, que cambia al arrastrarla.

## 8. Datos personales

Persona referente y contacto son datos personales de terceros. Son opcionales. Las exigencias de protección de datos del entorno institucional son una pregunta abierta y no se suponen.

## 9. Qué no se porta del histórico

Las actuaciones precargadas (con entorno, trimestre y prioridad ya puestos) y el reparto de trimestres por orden. Eran propuestas de EPVSA, no datos del municipio.

## Importación desde el COMPÁS histórico — actualización autorizada 2026-10-21

La agenda puede traerse de la copia `.json` del monolito (ruta `estrategias/<estrategia>/municipios/<municipio>/agendas`). La importación solo traduce campos: añade actuaciones sin sustituir ni borrar las existentes, no infiere entorno, trimestre ni prioridad (un valor no válido queda vacío) y deja el valor de indicador alcanzado del histórico como nota, sin tratarlo como resultado. Lo importado es registro de trabajo no verificado; la persona revisa entornos y datos.
