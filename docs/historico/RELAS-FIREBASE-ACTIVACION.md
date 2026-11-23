# RELAS Zaidín: activación con Firebase

## Estado comprobado — 2026-09-10

El titular ha elegido Firebase en lugar de Supabase y ha proporcionado la configuración pública web del proyecto COMPAS, ID `compas-98dd7`, app `1:453759873152:web:110b0be2220ff59d91f665`.

Código preparado en la rama `codex/relas-acceso-servidor`. No se ha desplegado esta integración ni se ha accedido administrativamente al proyecto Firebase. El titular ha creado y configurado los recursos remotos desde la consola; no se han consultado desde este entorno. Las pruebas previas de Postgres no verifican las nuevas reglas de Firestore.

## Alcance

Ruta `?vista=relas-zaidin`: inicio de sesión por correo y contraseña, membresía por ámbito, borrador compartido de envejecimiento saludable y versiones inmutables. La sesión se mantiene en memoria. Los guardados usan transacciones y detectan versiones desactualizadas. Las fichas de indicadores y los documentos existentes aún no se trasladan al servidor. Guardar no constituye aprobación del Plan.

La demostración `?vista=coordinacion-zaidin` y los documentos públicos de GitHub Pages siguen siendo públicos. El nuevo acceso protege únicamente los datos almacenados bajo las reglas RELAS de Firestore. No inicializa Analytics ni migra datos del navegador.

## Activación pendiente en consola

1. Authentication: habilitar proveedor Correo electrónico/contraseña. Comprobar el dominio autorizado `bhermoso.github.io`.
2. Cloud Firestore: comprobar si existe una base `(default)`. Si no existe, crear una base estándar en modo producción y seleccionar conscientemente su región.
3. Revisar y probar `firebase/firestore.rules` antes de publicarlas. Si hay reglas de otras aplicaciones, integrarlas sin reemplazarlas indiscriminadamente. Las reglas propuestas deniegan cualquier ruta que no esté expresamente autorizada.
4. Crear la cuenta inicial en Authentication. No enviar contraseñas por la conversación. Copiar su UID para asignar su ámbito.
5. En Firestore, crear documento `relas_memberships/UID/scopes/granada-zaidin`, con `active` booleano `true` y `role` texto `administrator` para el titular. Para coordinación usar `coordinator`; para lectura `reader`. Ninguna cuenta puede crearse su membresía desde el cliente, tampoco por el mero hecho de registrarse.
6. Ejecutar `npm run test:relas` contra el proyecto ficticio `demo-compas-relas`. Requiere el emulador Firestore y la versión de Java compatible con el Firebase CLI instalado. Intento inicial detenido por cancelación de aprobación de red: no se certifican todavía las reglas.
7. Publicar la aplicación y comprobar con cuentas de prueba propias: acceso autorizado, rechazo de otra demarcación, lectura, revocación, conflicto de versiones y cierre de sesión. Nunca utilizar expedientes reales como datos de prueba.

## Verificación local

- `npm run build`: compilación de producción.
- `node tests/relas-login.smoke.mjs`: pantalla de acceso sin llamadas reales a Firebase; exige Chromium local o `COMPAS_TEST_CHROMIUM`.
- `npm run test:relas`: seis casos de permisos e historial en emulador; pendiente de ejecución completa.

## Referencias oficiales

- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/rules/unit-tests

## Avance confirmado por el titular

Correo electrónico/contraseña y Google aparecen habilitados en Authentication. El titular ha creado Firestore y ha copiado sus reglas iniciales: denegación total `allow read, write: if false`. Se entrega el bloque RELAS para publicación manual; todavía no se ha confirmado que esté publicado ni existen membresías verificadas. La región seleccionada no se ha confirmado. Las reglas incluyen comprobación de rol válido también para lectura.

El titular confirma que ha publicado las reglas RELAS, creado su cuenta, guardado la membresía `scopes/granada-zaidin` con `active: true` y `role: administrator`, y autorizado `bhermoso.github.io`. Estos pasos están confirmados por la conversación, pendientes de verificación mediante un inicio de sesión real. No se guarda su UID en el repositorio. Se añade una comprobación de permisos en GitHub Actions (Java 21 y emulador ficticio), previa al despliegue.

## Publicación confirmada — cierre de la integración

PR https://github.com/bhermoso/COMPAS_NG/pull/47 fusionada. Commit publicado: `7a7a2eb222eda903a457cfe5e3dd485ed19bde4a`. Pruebas Firestore: seis aprobadas y cero fallos en https://github.com/bhermoso/COMPAS_NG/actions/runs/34481910438. Despliegue GitHub Pages completado con éxito en https://github.com/bhermoso/COMPAS_NG/actions/runs/34482121399.

Entrada: https://bhermoso.github.io/COMPAS_NG/?vista=relas-zaidin

Pendiente: comprobación de inicio de sesión por el titular con su contraseña. El navegador de este entorno no ha podido abrir la URL pública (`ERR_EMPTY_RESPONSE`), aunque la pantalla pasó la prueba local y el despliegue fue satisfactorio. No se afirma que el inicio de sesión real esté probado. Este apartado sustituye los estados pendientes históricos anteriores para CI y publicación.

## Incidencia y requisito posterior del titular

El titular informa de mensaje de cuenta sin acceso tras el despliegue. No se ha observado el documento remoto ni la identidad de la sesión; causa pendiente de diagnóstico. La implementación actual solo tiene administrador por ámbito y NO tiene administrador global ni gestión de cuentas dentro de COMPAS. El titular exige control central de accesos parciales y conservar acceso a todos los ámbitos. Pendiente diseñar e implementar autorización global de servidor y recuperación independiente mediante titularidad Firebase; no usar una excepción de correo/UID en JavaScript.

Inventario comprobado: GitHub master `7a7a2eb`; copia PUBLICACION basada en ese commit con anotaciones locales posteriores; RECUPERADO y copia instalador en `73ffd26` con cambios locales, parte idénticos a master y parte distintos; copias anteriores `5715672` y revisión Atarfe `e45d378` también con diferencias. Ninguna declarada eliminable. Todos los archivos modificados/no seguidos inspeccionados tienen ruta equivalente publicada, pero eso NO prueba equivalencia de contenido. Copias de Drive/Windows/disco externo no inspeccionadas. GitHub no respalda automáticamente los espacios de trabajo guardados en cada navegador ni los registros de Firebase.


Condición vigente del titular: utilizar únicamente capacidades gratuitas. Se ha retirado la generación automática de cuentas del panel pendiente y sus dependencias. La administración general se conserva y las operaciones de cuentas y claves se remiten explícitamente a la consola propietaria de Firebase. Estado y activación: `docs/ADMINISTRACION-GENERAL-COMPAS.md`. Esta preparación aún no sustituye la versión publicada.
