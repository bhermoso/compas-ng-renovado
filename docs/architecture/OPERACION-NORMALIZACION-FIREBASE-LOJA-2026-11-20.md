# Normalización controlada de la ficha histórica de Loja en Firebase

La normalización del seed de Loja (PR #178) no modifica los expedientes ya guardados. Esta acción explícita permite corregir el documento histórico `doc-action-plan-loja-2022` en el expediente **Loja** guardado remotamente, si todavía tiene `kind=strategic-framework`.

## Requisitos y recorrido

1. Abrir Loja autenticado, con permiso de escritura y después de la hidratación remota.
2. En Diagnóstico → Biblioteca estratégica, abrir «Normalizar la ficha histórica del Plan de Acción de Loja».
3. Descargar una **copia de recuperación** generada por la función ya existente `createBackup`, con comprobación `inspectBackup`. Se incluyen workspaces accesibles desde el navegador, originales IndexedDB disponibles y documentos incorporados al bundle que puedan recuperarse. El informe de la copia declara expresamente los originales faltantes; **no se puede afirmar que la copia incluye archivos que no están disponibles**.
4. Revisar el archivo descargado y los avisos; confirmar manualmente.
5. Al solicitar el cambio, leer desde Firebase la versión actual, comprobar igualdad de estado completo con el snapshot revisado y ejecutar el normalizador solo para la ficha exacta de Loja.
6. El servicio de guardado exige coincidencia de `expectedPreviousUpdatedAt`, además del control de concurrencia transaccional existente en `saveRemoteWorkspace`.
7. Releer desde Firebase y comprobar que la revisión coincide con lo guardado. Si falla, mostrar error; preservar la copia para recuperación.

## Garantías y límites

- La diferencia se limita a `kind` de la ficha histórica y `updatedAt` del workspace y repositorio; el resto de campos y arrays son idénticos.
- La propuesta se rechaza ante cambios en Firebase o si otro expediente es el activo.
- No reinterpreta ni atomiza documentación, no recrea archivos ni modifica los planes aprobados o las prioridades.
- Atarfe nunca entra en este flujo.
- La comprobación de copia demuestra integridad del **archivo descargado** a nivel de datos antes de producir la descarga, pero el navegador no puede certificar que el usuario lo haya guardado en disco; la interfaz exige confirmación.
- Un original ausente de la copia sigue ausente: se muestran advertencias. Para recuperación integral de originales no disponibles debe recuperarse la fuente correspondiente.
- La operación es manual, nunca se ejecuta durante la hidratación o al abrir el expediente.

Las pruebas simulan éxito de escritura y relectura, versión obsoleta, expediente Atarfe, estado ya normalizado y fallo de cotejo posterior.
