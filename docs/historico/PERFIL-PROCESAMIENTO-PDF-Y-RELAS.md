# Perfil del Zaidín: procesamiento documental y acceso RELAS

> Actualización de referencia — 10/09/2026: las secciones históricas de este documento no describen todas las capacidades actuales. Ya existe autenticación y almacenamiento territorial parcial en Firebase. Consultar [inventario funcional y hoja de ruta](planning/INVENTARIO-Y-HOJA-DE-RUTA-COMPAS.md) y [administración general](ADMINISTRACION-GENERAL-COMPAS.md) antes de continuar. Se conserva el texto anterior como historial.

## Incidencia corregida

El PDF original del informe de abril de 2023 estaba incorporado y accesible,
pero el registro PDF dejaba `body.originalText` vacío y `sections` sin contenido.
La lectura sanitaria devolvía `present: false`. Además, el panel «Enriquecimiento
de fuentes del Perfil» se había definido como resumen sin cargador.

Ahora, al encontrar el PDF incorporado sin texto, se extrae su texto una vez.
La sección permite volver a procesar el PDF ya registrado y ofrece el mismo
cargador de PDF/DOCX del diagnóstico territorial, con las mismas categorías.
La carga primaria de PDF extrae texto; la complementaria procesa el texto por el
circuito de ingesta existente. Los originales y las referencias se conservan.
Una carga primaria posterior archiva la referencia anterior y conserva su informe.
No se cruzan ámbitos si se cambia de municipio durante una carga asíncrona.

El procesamiento mantiene la identidad documental del informe incorporado y
registra páginas, huella SHA-256 y fecha de extracción. No genera EvidenceAtoms
primarios ni reescribe validaciones previas. El cambio de versión del almacén
señala la necesidad de revisar el Perfil validado. No se recompilan ni aprueban
perfiles de forma automática.

PDF de imagen: no se hace OCR. Si no hay texto se informa; no se atribuye una
lectura al documento. La extracción conserva marcas de página, pero no reconstruye
tablas HTML ni interpreta gráficos. Por tanto, los valores y su escala requieren
contraste en el original. La formulación institucional no se da por actualizada
únicamente por procesar el archivo.

## Comprobación

`tests/profile-pdf-enrichment.smoke.mjs`, con Playwright, recorre la aplicación:
selecciona Zaidín, comprueba procesamiento automático del PDF incorporado,
identidad documental conservada y ausencia de nuevos átomos primarios; después
carga un PDF complementario desde el enriquecimiento sin sustituir el principal.

Resultado sobre el original: 130 páginas, 159.679 caracteres, 12 secciones
reconocidas; el motor sanitario recibe el texto. SHA-256:
c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1.
El recuento de caracteres es una medida de extracción, no un resultado sanitario.

## Acceso con claves para RELAS Zaidín: estado real

Existe `CoordinatorPreview.tsx`, accesible mediante `?vista=coordinacion-zaidin`.
Es una demostración de coordinación, con borrador local separado. No se han
creado usuarios, claves, sesiones autenticadas ni permisos de servidor. GitHub
Pages distribuye una aplicación estática; el código actual no contiene un servicio
de autenticación o persistencia compartida.

El trabajo pendiente es habilitar un servicio de identidad y almacenamiento que
compruebe en el servidor el ámbito y el rol en cada operación. Coordinación RELAS
Zaidín debe trabajar exclusivamente en su ámbito; los agentes aportan documentos,
fichas y registros, y la coordinación prepara su propuesta para enviar para su
aprobación. La aprobación de documentos corresponde al administrador y la del
Plan sigue su procedimiento propio. No convertir una acción de coordinación en
aprobación del Grupo Motor.

No introducir claves compartidas en el JavaScript público ni presentar una
pantalla de entrada como control de acceso efectivo. Antes de activar cuentas:
comprobar sesión, cierre y revocación, rechazo de acceso cruzado entre ámbitos,
permisos por operación y conservación del expediente durante la migración.
La recuperación local ya publicada sirve para conservar los datos antes de
conectarlos al futuro servicio; no constituye esa conexión.
