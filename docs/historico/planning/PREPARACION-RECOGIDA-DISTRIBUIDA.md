# Preparación de instrumentos y recogida distribuida

## Alcance de esta entrega

El editor habitual y el ejemplo de coordinación comparten la propuesta de cuatro
ejes. Se mantienen los identificadores y las decisiones anteriores. Las mejoras
de jerarquía visual distinguen procedencia, instrucciones, objetivos y controles.

El catálogo de preparación reúne alternativas para todos los objetivos. Está en
el Gestor, en el ejemplo de coordinación y en las fichas, filtrado por indicador.
Añadir una opción a una ficha conserva el texto previo y la identifica como
pendiente. Esa referencia se incorpora a la descarga Word mediante el campo
existente de instrumento. Seleccionar una opción no genera un cuestionario,
no valida su adecuación y no permite calcular una puntuación.

## Preparación metodológica por instrumento

Antes de habilitar la administración: versión exacta, población y contexto de
validación, permisos de reproducción y adaptación, ítems, opciones de respuesta,
periodo de referencia, modalidad de administración, instrucciones, puntuación,
respuestas ausentes, interpretación y sensibilidad al cambio. Los instrumentos
propios requieren definición, revisión de contenido y pilotaje. Ninguna traducción
ni extracción de ítems hereda automáticamente la validación original.

Un objetivo con varias dimensiones requiere mediciones separadas o subescalas
justificadas. Una puntuación global no demuestra mejora en cada dimensión.
Las metas y líneas base permanecerán vacías hasta disponer de acuerdos y datos.

## Formas de uso

- Encuesta monográfica o combinada, según población y finalidad.
- Registro inicial por agentes al incorporarse una persona a una actuación.
- Seguimiento durante la actuación.
- Evaluación final o posterior.

Cada medición deberá conservar instrumento y versión, fecha, actuación, población,
quién responde y quién registra. El autoinforme, la respuesta de una persona
informante y la valoración profesional no se mezclarán. El seguimiento necesita
un identificador autorizado que evite duplicados; el prototipo no lo implementa.
No se atribuyen resultados de personas atendidas a toda la población territorial.

## Acceso privado: especificación pendiente de implementación

Credenciales personales y autorización en servidor por ámbito y operación.
Coordinación territorial sin administración de plataforma. Agentes limitados a
actuaciones asignadas. Acceso a registros individuales solo mediante permiso
específico. La relación entre municipio, mancomunidad y distrito no concede
acceso implícito. Las exportaciones deben respetar los mismos permisos.

Documentos: borrador, enviado para aprobación del administrador, requiere
correcciones, aprobado o rechazado. Blas ejerce la función de administrador.
La carga no equivale a aprobación; las aportaciones pendientes no alimentarán
el diagnóstico como documentación aprobada. La aprobación documental es distinta
de la aprobación institucional del plan. Las revisiones conservan autor y fecha.

Para pasar a producción hacen falta un servicio de identidad, almacenamiento
privado y persistente y pruebas de autorización en servidor. No se han creado
cuentas, contraseñas ni expedientes personales en esta entrega.

## Pendientes que no deben presentarse como funciones disponibles

Cuestionarios ejecutables de las nuevas escalas; cálculo automático de sus
resultados; envío entre agentes y coordinación; aprobación real de documentos;
cuentas privadas y sincronización; nuevas mediciones del Zaidín. El catálogo
es una selección fundamentada y ampliable, no un inventario universal cerrado.

## Composición modular de propuestas de recogida

El Gestor guarda propuestas diferenciadas por población, modalidad de recogida,
persona que responde e instrumentos seleccionados. Las propuestas utilizan los
metadatos versionados de QuestionnaireProject y permanecen en estado borrador,
sin módulos ejecutables. Se muestran en su apartado propio, fuera de la lista
de cuestionarios administrables. Se conservan con la exportación del expediente.

La especificación JSON descargada es un documento de preparación, no un formulario
REDCap ni una encuesta ejecutable. El selector de población no acredita validación
para esa población. La duración queda pendiente de elegir versiones concretas.
El uso simultáneo de TIL y De Jong Gierveld genera una advertencia de duplicidad.

### Protección de la edición y variantes

El preparador muestra «Cambios sin guardar» cuando el nombre o la configuración difieren de la última versión guardada o recuperada. Abrir otra propuesta, iniciar una nueva, cambiar de sección principal o cambiar de ámbito requiere confirmar el descarte si existen cambios pendientes. Al cerrar o recargar la página se solicita el aviso nativo del navegador. Descargar la especificación no marca la edición como guardada en el expediente.

«Duplicar propuesta» conserva el contenido actual, prepara un nombre terminado en «Copia» y crea una identidad independiente al guardar. La copia puede cambiar de población, modalidad o calendario sin modificar la propuesta de origen. Al cambiar de ámbito se reinicia el editor para evitar trasladar inadvertidamente una propuesta al expediente de otro municipio.

Verificación: compilación de producción y prueba de navegador de guardado, recuperación, descarga, copia independiente, cancelación del descarte y presentación móvil.
