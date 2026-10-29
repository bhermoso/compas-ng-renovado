# Perfil externo de Salud Local

Decisión del 29 de octubre de 2026: COMPÁS recibe un documento elaborado fuera de la aplicación. No construye un diagnóstico ni redacta perfiles desde el expediente. El tab ofrece un cargador, un panel de resultados, consulta del documento, descarga y revisiones con la identidad visual COMPÁS.

## Contenido y conservación

`MunicipalityWorkspace.externalProfileLibrary` conserva perfiles, originales y versión activa. Cada original incluye todos sus bytes en base64, nombre, tipo, tamaño y SHA-256. Los documentos, texto, indicadores, fuentes, cautelas e historial viajan en los fragmentos del expediente de Firebase existentes y permanecen protegidos por sus permisos. IndexedDB y localStorage son cachés. El mensaje de éxito de incorporación requiere que termine la escritura remota; un fallo mantiene el borrador.

Se admiten PDF, DOCX, TXT, Markdown y paquetes JSON, individualmente o seleccionados juntos. La extracción de texto permite revisar el documento; no infiere indicadores ni conclusiones. La imposibilidad de extraer texto no pierde el original. Límite de 20 MiB por original y 40 MiB de originales por expediente. Se comprueba también el límite total vigente de 400 fragmentos de Firebase antes de escribir. Los guardados de un mismo expediente se ordenan; la incorporación explícita suspende el autoguardado antiguo mientras termina.

Una edición crea otra revisión y conserva el original sin modificar. La validación técnica es una acción explícita registrada con la cuenta actual; cargar un archivo o un paquete no equivale a validarlo. La revisión puede descargarse en PDF y Word a partir exclusivamente del contenido guardado, además del original, texto y paquete de resultados. Estos formatos derivados son maquetaciones, no diagnósticos generados.

## Paquete preparado fuera de COMPÁS

El JSON usa `schema: "compas-profile-package/v1"`, `municipalityId`, `title`, `period`, `author`, `summary`, `text`, `results`, `findings`, `limitations` y `areas`. No acepta validaciones de terceros ni introduce contenido HTML ejecutable. El identificador municipal debe coincidir con el expediente abierto. Cada resultado contiene `id`, `title`, `value` literal, `unit`, `source`, `page`, `period` y `caution`. Puede añadir `topic`, `scale`, `denominator`, `temporalContext` (`current`, `historical`, `not-stated`), `chartValue` numérico y `comparison: {label, value}`. El gráfico solo aparece con cifras comparables declaradas. El paquete y el documento original pueden cargarse juntos en una única versión.

## Aprendizaje de «Modelos de Perfil de salud local»

La revisión del chat y su documento de Zagra lleva a mantener fecha, ámbito, fuente y denominador junto a las cifras. Los antecedentes sanitarios conservan su periodo y advertencia; no describen automáticamente la situación actual. Las preferencias de una consulta no probabilística no se muestran como prevalencias. No se asignan categorías a códigos de sexo cuyo diccionario no está disponible. Los activos no acreditan por sí solos acceso o efectos en salud. Las áreas propuestas se distinguen de decisiones aprobadas. No se crean mapas, tendencias ni comparadores sin datos explícitos.

## Compatibilidad

El runtime proyecta el perfil externo activo exclusivamente para los consumidores de planificación. Sin él, preserva el perfil histórico guardado; si tampoco existe, devuelve un estado vacío, sin invocar el generador. Los artefactos históricos continúan consultables y sus pruebas reconstruyen explícitamente fixtures del antiguo generador mediante un arnés solo de pruebas. La compilación del Plan Local de Salud incorpora el perfil externo vigente sin pedir la antigua compilación de un perfil.

## Validación

Pruebas de bytes y huella, aislamiento municipal, versiones, importación no validante, conservación remota fragmentada, guardados simultáneos, runtime sin generación y presentación con cautelas. La página `tests/fixtures/external-profile.html` es exclusivamente una comprobación local con datos ficticios y guardado simulado; no forma parte del punto de entrada publicado ni se incluye en `dist`. Las pruebas de esta transformación no escriben expedientes reales.
