# Repositorio canónico y copia única

## Organización acordada

1. Un solo repositorio de código: https://github.com/bhermoso/COMPAS_NG .
2. Como máximo una copia de trabajo/respaldo del código en Drive, identificada por su carpeta existente COMPAS_NG_RECUPERADO. No crear nuevos repositorios alternativos.
3. Firebase `compas-98dd7` es el servicio de cuentas y datos; no contiene una copia Git ni sustituye un respaldo del repositorio.

Las ramas de trabajo y propuestas dentro del repositorio GitHub no son repositorios adicionales. `master` corresponde a la web publicada; la rama de administración general contiene la preparación pendiente de activar los permisos globales del titular. No fusionarla antes de asegurar su entrada.

## Estado verificado el 10 de septiembre de 2026

- GitHub master: `7a7a2eb222eda903a457cfe5e3dd485ed19bde4a` (PR47). Acceso territorial publicado; incidencia de entrada comunicada por el titular.
- Copia de trabajo usada aquí: COMPAS_NG_PUBLICACION. Preparación de administración general, exclusivamente capacidades gratuitas, y eliminación de la integración descartada.
- Copia antigua COMPAS_NG_RECUPERADO: base `73ffd26`. Sus dos commits no exclusivos de master tienen parches equivalentes incorporados (`git cherry` devuelve `-`). Tiene diferencias de trabajo no confirmadas como descartables; parte de sus archivos ya coincide con master.
- Otras copias de revisión de Atarfe y preparación antigua: no utilizarlas como referencia para trabajo nuevo. Conservar hasta terminar la comparación de sus diferencias, especialmente archivos binarios y datos locales.
- Drive: localizada la carpeta COMPAS_NG_RECUPERADO. Su estado Git y su integridad necesitan comprobación; no etiquetarla como actualizada solo por la fecha de la carpeta.
- Copias del ordenador Windows y disco externo: no inspeccionadas desde este entorno.

## Retirada de duplicados

Eliminar un clon solo después de conservar sus cambios exclusivos, archivos no seguidos y datos ajenos a Git en la copia única. `node_modules` y `dist` son regenerables y no constituyen datos de proyecto. No eliminar metadatos Git de la copia RECUPERADO mientras la copia de trabajo PUBLICACION dependa de ellos como worktree.

No se ha borrado ningún repositorio ni archivo del usuario en Drive. No hay una copia de repositorio en Firebase que eliminar. Los datos del navegador y Firebase requieren un respaldo separado del código, sin convertirlo en otro repositorio.
