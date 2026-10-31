# Diagnóstico territorial — auditoría inicial y contrato de ingesta universal (propuesta v0.1)
Fecha: 2026-10-31. Repositorio exclusivo: bhermoso/compas-ng-renovado.
Estado: propuesta de arquitectura; no habilita mutaciones de expedientes ni modifica contratos productivos.
Persistencia principal obligatoria: Firebase. El almacenamiento local es como máximo caché, borrador temporal o recuperación, no destino canónico.

## 0. Decisiones de producto
- El Tab 1 es la sala de control y punto de entrada del expediente territorial.
- El Tab 2 alberga Perfiles RELAS elaborados externamente (informe y presentaciones coherentes); no se vuelve a implementar un generador automático.
- Los perfiles RELAS terminan su diagnóstico con conclusiones y recomendaciones. El Plan de Acción es una fase distinta.
- Originales inmutables, derivados versionados y distribución auditable; nunca sobrescritura silenciosa.

### Persistencia Firebase — decisión vinculante
- Autenticación y autorización: reutilizar Firebase Authentication y los permisos territoriales existentes.
- Metadatos, índices, declaraciones temporales, referencias, estados y auditoría: Firestore, alineado con la estructura `relas_scopes` y controles de acceso existentes.
- Originales binarios (ZIP, PDF, DOCX, JPG, etc.): diseñar almacenamiento en Firebase Cloud Storage, sujeto a comprobar configuración real, reglas, permisos, cuotas y ciclo de vida. Firestore no debe utilizarse para insertar archivos binarios grandes en snapshots JSON.
- Usar identificadores estables, huellas de contenido, referencias desde Firestore a cada blob y vínculos de derivación; evitar duplicar originales.
- Publicación de una ingesta por etapas: subir original, validar integridad, preparar índices/derivados y confirmar manifest de incorporación. Ante fallos, estado recuperable y limpieza segura. No asumir una transacción atómica cruzando Firestore y Cloud Storage.
- No hacer de localStorage o IndexedDB una segunda fuente de verdad; cualquier caché debe declarar sincronización y conflictos.
- La persistencia debe preservar versiones históricas y originales, con reglas explícitas de retención y control de acceso.

## 1. Inventario inicial confirmado en master
- `src/App.tsx`: vista `repositorio`; monta `HealthReportViewer`, `EstudiosComplementariosPanel`, `ActivosSaludPanel`, `DocumentRepositoryPanel`, `DocumentIngestionPanel`, `EvidenceStorePanel`. Orquesta callbacks de carga y repositorios.
- `src/ui/components/DocumentIngestionPanel.tsx`: formulario con tipo preseleccionado y rutas específicas para Informe, marcos, documentos territoriales y material cualitativo. Instrumentos tipificados tienen entrada aparte.
- `src/ui/components/DocumentRepositoryPanel.tsx`: listado de documentos y biblioteca, controles de ciclo, conciliación y validación de activos.
- `src/ui/components/documentRepositoryCategorization.ts`: clasificación por `kind`/tags; comentario heredado erróneo sobre prohibición de recomendaciones en el Perfil.
- `src/domain/repository/MunicipalDocumentRepository.ts`: `MunicipalDocument` con `cycle?: {status: current|historical,referenceYear?}`; `DocumentSource.collectedAt?`, timestamps técnicos; conciliación temporal expresamente humana; `replaceMunicipalDocumentByKind` sustituye entradas canónicas.
- `src/ui/components/DocumentCycleControl.tsx`: declaración manual del ciclo y año, sin deducción del texto.
- `src/ui/components/CycleConciliationPanel.tsx`: compara fuentes histórica y actual solo tras declaración, no propone ni resuelve convergencias automáticamente.
- Existen rutas especializadas de importación REDCap y cuestionarios, conservación de originales, evidencias, copias y persistencia local/remota. Sus contratos y transacciones requieren auditoría detallada antes de conectar el distribuidor.
- `src/infrastructure/relas/BrowserRelasClient.ts`: cliente Firebase Authentication + Firestore.
- `src/infrastructure/relas/RemoteWorkspace.ts`: expedientes JSON almacenados en fragmentos Firestore bajo `relas_scopes/{municipalityId}` con manifest `workspace/current`, versiones y chunks; tras confirmar el nuevo manifest borra chunks de la versión anterior. Este esquema de snapshot no constituye por sí solo un archivo histórico persistente. La propuesta de versionado documental no debe depender de esas versiones efímeras.

## 2. Problemas y riesgos confirmados
1. Ingesta fragmentada por naturaleza documental y panel; experiencia de entrada repetitiva.
2. El estado temporal solo `current/historical` y `referenceYear` no describe período observado, fecha de publicación, vigencia normativa ni relación entre varios ciclos.
3. El estado de carga (`uploaded/validated/archived`) no equivale a vigencia temporal.
4. `replaceMunicipalDocumentByKind` elimina del array documentos anteriores del mismo tipo; no debe ser el mecanismo predeterminado del distribuidor sin archivo/versionado explícito y recuperación.
5. La visualización actual es una sucesión de paneles, no un mapa de fuentes, estado, dependencias y destinos.
6. Los comentarios heredados sobre el Perfil pueden inducir implementaciones contrarias a la decisión actual.
7. La persistencia remota actual elimina los fragmentos del snapshot anterior tras guardar el nuevo; debe separarse ese mecanismo de la conservación de originales y versiones documentales.
La inspección no acredita aún cobertura total de importadores, reglas de Cloud Storage ni pruebas de migración.

## 3. Contrato temporal propuesto (aditivo; no migrar aún)
Cada activo documental tendrá, separadamente:
- `documentDate`: emisión/redacción (fecha o precisión: año/mes/día; desconocida posible).
- `observedPeriod`: período sobre el que informa (inicio y fin, o período textual cuando no sea normalizable); puede diferir de la fecha del archivo.
- `sourceCollectedAt`: toma/extracción de la fuente; no equivalente al período observado.
- `ingestedAt`: incorporación técnica al expediente.
- `validity`: vigente, sustituido, derogado/caducado, desconocido o no aplicable; aplicable según naturaleza, nunca deducido solo por antigüedad.
- `diagnosticCycle`: identificador del ciclo RELAS al que se adscribe y su condición actual/histórica; declaración humana, no inferencia automática.
- `temporalScope`: histórico/actual/mixto/por determinar respecto a una fecha y ciclo de referencia explícitos. Puede haber documento reciente que describa hechos históricos y documento antiguo aún vigente.
- `temporalEvidence`: cita/localización y texto que justifica fechas sugeridas, más confianza.
- `temporalDeclaration`: valor revisado, autor, fecha y motivo. Separar sugerencias automáticas de declaraciones aprobadas.
- `supersedes`/`supersededBy`: relaciones documentales explícitas; jamás borrar antecedentes por defecto.

Las fechas detectadas por OCR, metadatos o nombre de fichero son solo propuestas. Toda categoría temporal que afecte a interpretación diagnóstica, comparaciones, reemplazos y salidas del Perfil requiere confirmación técnica. Si la información no consta, conservar `unknown`. Nunca equiparar `createdAt` con fecha del documento, ni `current` con validez normativa. No comparar series históricas sin verificar equivalencia de indicador, cobertura territorial, definición, instrumento y período.

### Ejemplos de control
- Informe sanitario emitido en 2017 sobre datos 2015–2016, incorporado en 2026: período observado 2015–2016, ciclo histórico declarado; no tratar como descripción actual.
- Norma publicada en 2024 y vigente en 2026: documento anterior pero vigencia actual; no llamarlo «histórico» por fecha.
- Memoria publicada en 2026 que relata talleres de 2017: emisión actual, contenido histórico, alcance mixto.
- Exportación REDCap octubre de 2026 con encuestas de mayo: fecha exportación ≠ período de recogida; nueva importación no modifica resultados de otra versión sin revisión.

## 4. Contrato del distribuidor
Pipeline: recepción → validación de tamaño, MIME real y seguridad ZIP → descompresión con límites y rutas normalizadas → identificación de subdocumentos → extracción (DOCX/PDF/CSV/imagen; OCR opcional) → clasificación múltiple (`kind`, `nature`, territorio, ciclo y fechas sugeridos) → deduplicación por huella y relación con versiones → bandeja de revisión → confirmación → escritura transaccional mediante adaptadores existentes → verificación y bitácora.

Un original puede producir varios vínculos de destino, pero una sola identidad documental. No inferir autoría, validación de activos ni conciliaciones. Los destinos pueden incluir Tab 2 (Perfil externo) y otras fases; conservar procedencia y separación metodológica. Fallos parciales deben poder revertirse. Datos personales en CSV/fotos: controles de exposición y privilegios; no publicar originales sensibles.

### Estados de incorporación
`received` → `analyzed` → `needs-review` → `approved` → `distributing` → `committed`; `failed`/`quarantined` con razón. No mezclar con estado de validación científica de fuente.

### Reglas de enrutamiento
- Alta confianza: precargar destino y campos, no confirmar sustitución automáticamente.
- Media/baja: revisión humana, vista previa, motivo de clasificación y alternativa.
- Conflictos: doble versión, diferente municipio, cambio de escala, período ambiguo o documento canónico existente → confirmación explícita.
- Documentos desconocidos: bandeja de documentación no clasificada, conservados sin producir evidencias inventadas.

## 5. Diseño visual — sala de control
Cabecera municipio/ciclo; dropzone universal; resumen factual (originales, estudios, activos, evidencias, pendientes de revisar, documentos sin temporalidad declarada); matriz de módulos con contadores y estados; bandeja de clasificación; inspector con original, derivaciones y dependencias; línea temporal con filtros `actual/histórico/mixto/sin declarar`; bibliotecas transversal y territorial claramente distinguidas. Texto breve, detalles bajo demanda. Los indicadores de integridad deben calcularse con reglas verificables, nunca porcentajes ficticios.

## 6. Plan de implementación por PR
A. Auditoría profunda read-only de rutas de carga, almacenamiento de originales, Firebase Authentication, Firestore, Cloud Storage (existencia/configuración/reglas), backup, rehidratación, remoto y exportaciones, con mapa de dependencias y casos de regresión de Zagra/Loja/Zaidín.
B. Nuevos modelos aditivos de metadatos temporales y clasificador puro con pruebas (no cambios de datos ni heurísticas que confundan vigencia).
C. Entrada universal y bandeja de revisión sin mutación de workspace.
D. Adaptadores transaccionales, versionado/backup y pruebas end-to-end.
E. Nuevo contenedor visual; conmutación gradual con interfaz anterior.
F. Migración no destructiva y regresión; despliegue solo previa autorización.

## 7. Criterios mínimos de aceptación
- La carga de ZIP mixto produce inventario individual, seguridad y destino propuesto justificable.
- Originales y versiones previas son recuperables y no se borran silenciosamente.
- Un informe de 2017, una norma vigente de 2024 y una exportación 2026 con recogida mayo son etiquetados correctamente solo tras declaración, no por heurística.
- Una misma fuente admite múltiples vínculos sin duplicar bytes.
- No se generan evidencias ni se cambian rankings, decisiones o perfiles por previsualización.
- Todo cambio comprometido deja registro de quién, qué, cuándo, destino y derivaciones.
- Expedientes históricos cargan sin migración destructiva ni recategorización retroactiva.
