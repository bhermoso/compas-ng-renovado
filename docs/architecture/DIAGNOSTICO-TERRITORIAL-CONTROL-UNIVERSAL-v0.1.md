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


## 8. Auditoría adicional Firebase y contrato visual (2026-10-31)
### Firebase — constataciones
- `firebase.json` configura Firestore y emuladores Firestore/Auth; no registra Storage ni reglas de Storage. La disponibilidad real del bucket en el proyecto remoto no ha sido comprobada.
- `firebase/firestore.rules` delimita lectura y escritura por membresía territorial, rol y administrador para `relas_scopes`; hay que respetar ese modelo al crear metadatos y reglas de archivos, sin asumir permisos amplios ni exponer PII.
- `src/infrastructure/document-files/originalFiles.ts` conserva originales exclusivamente en IndexedDB local `compas-original-documents`. El comentario del código dice que no se suben. La migración a Firebase Storage es una tarea real, no una simple configuración de ruta; antes de cualquier migración deben hacerse inventario, copia, comprobación de hash y reconciliación por ámbito.
- `src/infrastructure/relas/RemoteWorkspace.ts` escribe snapshots JSON en chunks Firestore y limpia la versión anterior; no utilizar ese almacenamiento para originales grandes ni como historial documental permanente.
- Propuesta: Storage para bytes de originales, Firestore para manifest, clasificación, declaraciones temporales, destinos y auditoría; integridad con hash; prohibir sobreescritura por defecto; revisión de cuotas, CORS, reglas, retención y acceso firmado/autorizado antes de habilitar.

### Identidad visual COMPÁS — comprobación y obligación
- `src/App.css` contiene comentario explícito `Paleta institucional — VISUAL-CONTRACT §2`, Inter y tokens: azul #0074c8, cyan #00acd9, verde #94d40b, amarillo #ffb61b, naranja #ff6600, rojo #dc143c; neutros slate, superficies blancas y gradiente institucional de seis franjas.
- El fichero fuente del contrato visual no ha sido confirmado con las rutas exploradas. **Bloqueante antes de aprobar el nuevo diseño:** localizar el contrato mediante grep en el clon completo y cumplirlo íntegramente, no solo su paleta.
- La sala de control debe reutilizar tokens, componentes, espaciado y accesibilidad propios del proyecto; no importar una biblioteca gráfica o un tema extraño sin revisión.

### Comprobaciones Git Bash (desde raíz de compas-ng-renovado)
```bash
pwd
git remote -v
git branch --show-current
grep -RniE --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 'VISUAL-CONTRACT|contrato visual|paleta institucional|gradiente COMPÁS' docs src README* 2>/dev/null | head -100
find . -path './node_modules' -prune -o -path './.git' -prune -o -iname '*visual*contract*' -print
grep -RniE --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 'firebase/storage|storageBucket|getStorage|uploadBytes|ref\(.*storage' src firebase firebase.json 2>/dev/null | head -100
```
Esos comandos son solo lectura. Confirmar mediante grep el contrato antes de cambiar CSS.

### Siguiente secuencia
1. Localizar y leer contrato visual completo.
2. Auditar usos de IndexedDB/originales, backup, borrado y rehidratación; inventario migratorio.
3. Diseñar esquema Storage+Firestore y reglas de acceso con tests en emuladores.
4. Prototipo de sala de control conforme al contrato visual, sin activar escritura nueva hasta superar pruebas.


## 9. Auditoría de dependencias de originales y recuperación (2026-10-31)
- `src/ui/components/DocumentAccess.tsx`: la descarga y adjunción del original llaman a `loadOriginalFile`/`saveOriginalFile` en IndexedDB; se permite sustituir el archivo local tras confirmación sin recalcular datos derivados. Para pasar a Firebase, el acceso al original debe migrarse a una interfaz de almacenamiento que compruebe huella, permisos y versión, y evitar discordancias entre fichero y evidencias.
- `src/ui/components/BackupPanel.tsx`: `createBackup` exporta expedientes y originales disponibles **en ese navegador**, no necesariamente todos los originales de todos los equipos. Una solución Firebase debe continuar ofreciendo exportación íntegra verificada y restauración sin sobreescritura, sin que la ausencia de un archivo local signifique pérdida remota.
- `src/infrastructure/persistence/indexed-db-workspace.ts`: persiste snapshots locales de workspace por municipio; debe tratarse como copia local/cache después de definir la fuente remota canónica, y probar conflictos y desconexión.
- `src/infrastructure/relas/RelasClient.ts`: proyecto Firebase configurado para Firestore/Auth; el cliente `RelasClient` expone `auth` y `db`, pero no `storage`. No se ha verificado en la infraestructura remota la existencia de un bucket autorizado. No crear uno automáticamente.
- `firebase/firestore.rules`: acceso por ámbito y pertenencia, roles `reader`/`coordinator`/`administrator`; el archivo del distribuidor debe usar equivalentes comprobables en Storage y pruebas explícitas de aislamiento entre municipios. Evitar accesos públicos persistentes.
- El `firebase.json` actual no declara `storage`; los emuladores disponibles son Auth y Firestore. Las pruebas integrales nuevas deberán incorporar Storage solo cuando la configuración esté lista.

### Migración aditiva obligatoria (no ejecutar aún)
1. Inventariar referencias y originales locales por municipio, manteniendo copias de recuperación antes de tocar nada.
2. Preparar reglas Storage, esquema Firestore, emuladores y tests de permisos para lectura/escritura y aislamiento entre municipios.
3. Subir bytes con integridad hash y metadatos temporales; distinguir `pending` de `committed`.
4. Verificar lectura autorizada en otra sesión/equipo antes de declarar la migración completa.
5. Mantener el original IndexedDB intacto hasta confirmación y backup verificados. No borrar documentos ni derivaciones existentes.
6. Incorporar auditoría/recuperación y manejo de archivos huérfanos o carga fallida.

### Contrato visual pendiente de localizar
La referencia `VISUAL-CONTRACT §2` está probada en `src/App.css`, pero la búsqueda de varias rutas nominales del archivo y la búsqueda indexada de GitHub no han localizado aún el texto íntegro. No afirmar que el contrato falta en todas las ramas ni inventar su contenido. Mantener este punto como verificación pendiente y bloquear la aprobación final de diseño hasta localizar el original o formalizar expresamente su recuperación.


## 10. Fundamentos visuales recuperados del código de la home (fuente primaria implementada)
Verificados directamente en `src/App.tsx` y `src/App.css` de `master`. **No equivalen al documento original `VISUAL-CONTRACT`**, aún no localizado.

| Elemento | Implementación verificada | Regla para el nuevo Tab 1 |
| --- | --- | --- |
| Tipografía | `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Reutilizar familia y pesos actuales |
| Identidad | `--azul:#0074c8`, `--cyan:#00acd9`, `--verde:#94d40b`, `--amarillo:#ffb61b`, `--naranja:#ff6600`, `--rojo:#dc143c` | Reutilizar variables, no duplicar colores arbitrarios |
| Barra institucional | `.gradient-bar` de 6 px y seis franjas, cada una ~16.66 % | Mantener uso reconocible y contenido |
| Neutros | `--fondo-principal:#f8fafc`, `--fondo-secundario:#f1f5f9`, `--borde:#e2e8f0`, `--blanco:#ffffff` | Fondos sobrios y separación por jerarquía |
| Texto | `--texto-principal:#1e293b`, `--texto-secundario:#526070`, `--texto-terciario:#64748b` | Contraste y legibilidad; verificar WCAG |
| Contenedores | `.hero,.workspace-panel` con ancho máximo 1120 px; tarjetas de radio 8 px, borde y sombra tenue | Usar patrones ya establecidos salvo necesidad responsive justificada |
| Navegación | `NAV_ITEMS` de `src/App.tsx` identifica `Diagnóstico territorial` como fase 01 | Conservar lenguaje y jerarquía global de fases |
| Microjerarquía | `.eyebrow` azul, mayúsculas, tracking 0.14em; `.lead` secundario con interlineado 1.7 | Respetar niveles tipográficos sin saturar de texto |

### Criterios de revisión visual
- Prohibido introducir un tema genérico o librería de diseño incompatible con los tokens del repositorio.
- Diseño responsivo, navegación por teclado, foco visible, contraste comprobado y estados de carga/error accesibles.
- La sala de control puede ser más densa y esquemática que la home, pero debe conservar su identidad: tipografía, paleta, superficies, ritmo, marca, navegación.
- Verificar estilos existentes de la home y `InstitutionalLogoBand` antes de decidir cabecera o logotipos, sin deducir reglas no inspeccionadas.
- Mantener la búsqueda del contrato original abierta; ninguna inferencia del CSS debe presentarse como norma textual verificada de ese documento.
