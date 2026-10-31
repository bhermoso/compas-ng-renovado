# Consolidación Firebase documental v1 — estado y puertas de activación
Fecha: 2026-10-31. **No apto para desplegar ni activar escritura todavía.**

## Configuración conocida
La configuración proporcionada por la propiedad del proyecto confirma el *nombre declarado*, no la existencia operativa ni permisos, de Storage: `compas-98dd7.firebasestorage.app`; proyecto `compas-98dd7`; Auth, Firestore y Realtime Database `compas-98dd7-default-rtdb.europe-west1.firebasedatabase.app`. Analytics y Realtime Database no forman parte de la persistencia documental prevista. `RelasClient` registra el bucket y expone acceso al Storage de la misma app nombrada; no conecta escrituras.

## Hallazgos bloqueantes
1. El Firestore actual permite usuarios con membresía territorial activa sin registro `compas_access_accounts`, y administradores generales de `compas_admins`. El borrador Storage exige `compas_access_accounts` y carece de excepción para administrador global: **NO hay paridad de permisos**. No desplegar `firebase/storage.rules.draft`.
2. Para reglas Storage con `firestore.get`, confirmar permisos de acceso entre servicios y límites de consultas; realizar pruebas de roles, suspensión, lector, administrador global, ámbitos cruzados y cuentas legadas.
3. `firebase.json` todavía no declara Storage ni emulador. No se ha verificado que el bucket exista en el proyecto, la región, las reglas activas o la facturación requerida.
4. El cliente `RemoteOriginals.ts` es exclusivamente de lectura y coteja tamaño y SHA-256; no hay escritura confirmada ni estado de recuperación.
5. El índice Firestore usa claves por SHA-256/municipio e impide cambios/borrado; el ciclo de vida y enlaces de versión todavía no son transaccionales con Storage.
6. `RemoteWorkspace.ts` retira chunks de snapshots antiguos. Esto no cumple la obligación de conservar originales/versiones documentales; no reutilizarlo como archivo permanente.
7. Las pruebas de emulador se han escrito pero **no se han ejecutado aquí**; CI no ha confirmado una compilación exitosa.

## Plan de implementación en orden estricto
1. Verificar con consola/CLI Firebase proyecto, bucket, región, reglas, permisos interservicio y estado de facturación sin cambiar nada.
2. Unificar modelo de autorización compatible con administración general, cuentas gestionadas y accesos territoriales heredados. Probar en emuladores Firestore + Storage con resultados observados.
3. Validar `npm run build`, `npm test`, `npm run test:relas`, corrigiendo los fallos antes de habilitar el flujo.
4. Implementar subida en dos fases con idempotencia: calcular SHA-256, comprobación del ámbito/autorización, subida con precondición de no sobrescritura, verificar bytes/hashes, registrar índice y vínculo de versión, recuperar huérfanos sin borrar un original legalmente retenido.
5. Añadir búsqueda y lectura de duplicados existentes basada en índice verificable; distinguir ausencia de índice de inexistencia real.
6. Diseñar migración desde IndexedDB por ámbito y usuario, modo vista previa, reconciliación y consentimiento explícito; preservar copias.
7. Solo tras pruebas y autorización separada: preparar despliegue de reglas, migración y activación por ámbito.

## Invariantes
- Fuente canónica Firebase, cachés locales no autoritativas.
- No hay escritura automática desde la bandeja de revisión.
- No se realiza borrado ni sustitución de original o índice existente.
- La presencia de una huella no implica clasificación metodológica o temporal validada.
- No efectuar cambios a `master`, reglas en producción o datos municipales sin autorización explícita.
