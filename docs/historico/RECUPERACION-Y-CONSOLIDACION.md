# Recuperación y consolidación · 10 de septiembre de 2026

## Base comprobada

La PR #44 se integró en master como b4545894ab2ca8c53f39243c69bf4e7309eda556.
GitHub Actions 34468459584 completó npm ci, compilación y despliegue. La web
sirvió los recursos index-DQVfuEdl.js e index-Cs_w_iMD.css. El PDF publicado
informe-salud-zaidin-abril-2023-CQRcOvVX.pdf coincidió con la huella SHA-256
c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1.

La recuperación del código parte de ese commit, no de reconstruir conversaciones.
Las copias antiguas no se han borrado ni se han aplicado sobre master.

## Hallazgos de persistencia

- Los expedientes usan localStorage; los originales usan IndexedDB.
- No había un control general de exportación/importación del expediente en App,
  aunque diversas ayudas mencionaban la exportación JSON.
- La persistencia rutinaria omite ciertos campos HTML. Al leer expedientes se
  aplican normalizaciones y migraciones que pueden eliminar derivados huérfanos.
- El borrador de demostración de coordinación tiene una clave separada y no
  constituye una aprobación ni un borrador municipal automáticamente consolidado.
- Hay originales sin referencia documental. Descartarlos al exportar supondría
  una pérdida: se incluyen también en la copia nueva.

## Copia versionada de este navegador

Acceso: «Copias y recuperación del trabajo» en COMPÁS. Incluye las claves de los
expedientes, el registro de ámbitos personalizados y el borrador de demostración;
los originales de todos los ámbitos de este navegador, incluso sin referencia;
y los PDF distribuidos con la aplicación que estén referenciados y sean accesibles.
No descarga enlaces externos arbitrarios. Informa de los originales ausentes.

El ámbito activo se captura de memoria sin eliminar sus campos HTML. Además se
conserva `preservedStorage`: copia literal del almacenamiento anterior, para
poder examinarlo incluso si la carga había normalizado datos. Este contenido
histórico se conserva en el archivo; no sustituye automáticamente al activo.

Formato `compas-ng-browser-backup`, versión 1, JSON con originales en base64.
Huella SHA-256 del contenido y de cada original, tamaño y metadatos de archivo.
Las huellas detectan alteraciones; no acreditan autoría ni validez científica.
El fichero debe conservarse como documento privado del usuario, nunca subirse
al repositorio público para probar la función.

## Comprobar y recuperar

Entrada independiente: `?vista=recuperacion`. No inicia App ni carga expedientes
de ejemplo. En un perfil de navegador vacío, abrir directamente este enlace,
seleccionar la copia, revisar el resumen y pulsar «Recuperar sin sobrescribir».
Después abrir COMPÁS y seleccionar el ámbito.

Se verifica toda la copia antes de escribir, y se repite la comprobación al
recuperar. Se rechazan formato incompatible, claves no admitidas, identificadores
incoherentes, duplicados, archivos alterados y diferencias con datos existentes.
No existe combinación automática de dos versiones diferentes de un mismo ámbito.
Repetir una recuperación idéntica es válido. Otros datos del navegador se respetan.

Los originales nuevos se añaden mediante una transacción IndexedDB sin sustituir
los existentes. Si falla la escritura de expedientes, se retiran las nuevas claves
escritas durante esa operación; los originales ya copiados permanecen conservados,
y la recuperación se puede repetir. No existe transacción única entre localStorage
e IndexedDB: tras un cierre abrupto puede haber una incorporación parcial; la copia
original permite reintentar. No realizar ediciones simultáneas durante la operación.

La función acepta este nuevo formato. Los JSON históricos de expedientes aislados,
las exportaciones de fichas y los borradores separados no se presentan como copias
completas: requieren revisión específica conservando sus archivos originales.

## Verificación reproducible

- `npm run build` con las dependencias del lockfile.
- `npm test -- tests/documentation-references.test.ts tests/document-access.test.tsx tests/zaidin-original-report.test.ts tests/profile-report-change.test.ts`: 12 casos.
- `node tests/browser-recovery.smoke.mjs` (Playwright Chromium instalado; admite
  `COMPAS_TEST_CHROMIUM`): entrada vacía, descarga y recuperación por la interfaz,
  Atarfe y Zaidín, borrador separado, igualdad literal de expedientes, PDF original
  por hash, originales sin referencia, idempotencia, alteración de copia y archivo,
  conflictos, claves ajenas, fallo de cuota y reintento.

Estas pruebas utilizan perfiles de navegador aislados y datos de prueba. No han
leído ni recuperado el almacenamiento del ordenador personal del usuario.

## Copias antiguas revisadas

La copia COMPAS_NG_RECUPERADO, cuyo HEAD era 73ffd26, conserva cambios sin commit
relacionados con fichas. El exportador, modelo, documentación y dos pruebas de
fichas coinciden con la versión publicada. El editor publicado añade etiquetas de
accesibilidad y selección desde el catálogo de instrumentos respecto del editor
antiguo. Las adiciones locales de App, estilos, protección de persistencia, modelo
y pruebas también están presentes en la versión publicada. El catálogo actual
conserva las fichas y añade el borrador de preparación y un control de versión
para no heredar aprobaciones. No se han localizado adiciones de código de fichas
pendientes de incorporar en esa copia. No se ha borrado la copia histórica.

La copia histórica COMPAS_NG con HEAD 5715672 conserva modificaciones en ESCA,
una fotografía de Zagra y una presentación. No se han sobrescrito, publicado ni
atribuido al expediente actual sin contrastar sus versiones.

## Pendientes reales

1. Crear la copia desde el navegador donde esté el trabajo real del usuario y
   comprobar su inventario; una prueba técnica no acredita la recuperación de
   ese trabajo ni permite acceder a archivos de otros ordenadores.
2. Contrastar las versiones locales antiguas, Drive y descargas que aporte el
   usuario antes de eliminar duplicados. No se ha certificado la copia de Drive.
3. Recuperar los DOCX originales UGC si existen; hoy solo consta texto conservado.
4. Revisar las conclusiones del Perfil contra el PDF original. No están validadas
   por el hecho de haber publicado su fuente.
5. Diseñar persistencia compartida, autenticación y permisos efectivos de servidor.

La independencia completa de la memoria conversacional sigue sin estar certificada.
