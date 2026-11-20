# Separación documental: biblioteca común y expedientes territoriales

Fecha: 2026-11-20. Estado: primera fase, **sin borrados ni migraciones remotas**.

## Contrato funcional

1. **Biblioteca estratégica común:** referencias institucionales, estrategias, normativa y guías metodológicas para todos los ámbitos. Una referencia común no es una observación de salud local y nunca se convierte automáticamente en evidencia, cifra ni conclusión municipal.
2. **Expediente municipal:** informe de salud, estudios propios (IBSE, encuestas, REDCap), activos y documentación histórica de ese ámbito, cada fuente con su procedencia, ciclo y originales.
3. **Productos municipales versionados:** Perfil, decisiones de priorización, planes, actuaciones y validaciones. No migran a la biblioteca común.

## Primera implementación

- `src/application/strategic-reference-library.ts`: catálogo común de los cuatro PDF ya incluidos en el build. No reescribe los datos de los municipios; cada ficha conserva una ruta de origen y un ámbito de referencia.
- `StrategicReferenceLibrary`: biblioteca consultable en Diagnóstico territorial, diferenciada de la documentación municipal.
- `inspectWorkspaceSeparation`: inventario de fuentes estratégicas repetidas por municipio, fuentes restantes, evidencias, originales, versiones y planes.
- `createCleanWorkspaceExample`: **copia nueva en memoria**, con identidad del municipio y colecciones de documentos y evidencias vacías. No opera en Firebase, almacenamiento del navegador ni seeds.
- Un JSON de ensayo puede descargarse manualmente. **No debe importarse sobre el expediente activo**.

## Lo que NO debe automatizarse todavía

- Borrar documentos de Atarfe, Loja u otros municipios.
- Retirar copias estratégicas sin cotejar huellas, títulos, versiones y disponibilidad de originales.
- Interpretar un PDF bibliográfico incluido con COMPÁS como sustituto de un documento validado en Firebase.
- Promover documentos municipales a referencias generales por el simple hecho de que su tipo sea `strategic-framework`: puede haber marcos *municipales* y planes específicos de un territorio.
- Resetear `appliedSeedMigrations`, `deletedDocuments` o registros de validación sin considerar las rehidrataciones posteriores.
- Descartar microdatos, estudios IBSE ni revisiones previas de Perfil.

## Migración posterior, con compuertas

1. Copia de recuperación de todos los expedientes y originales disponibles, incluyendo comprobación desde Firebase.
2. Inventario documentado de posibles referencias comunes por **ámbito real**, emisor, versión y SHA-256. Identificar planes **locales** que deben permanecer municipales.
3. Crear persistencia propia de biblioteca compartida con permisos de administrador y control de versiones, independiente de los workspaces.
4. Reemplazar duplicaciones municipales por **vínculos de referencia**, conservando las relaciones de procedencia; nunca recalcular evidencia por el mero cambio de ubicación.
5. Activar un **entorno de ensayo aislado** de Atarfe o Loja, con ID y almacenamiento diferentes, sin reemplazar el municipio real.
6. Realizar comparación documental antes/después y pruebas de importación, recuperación, accesos y actualización remota; solo entonces considerar retirar duplicados mediante confirmación explícita.

La fase actual es una separación **de consulta e inventario**. Todavía no constituye una migración global ni una limpieza de Firebase.
