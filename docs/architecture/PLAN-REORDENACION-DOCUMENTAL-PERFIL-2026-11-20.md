# COMPÁS NG — Propuesta de saneamiento documental orientado al Perfil de Salud Local

**Estado:** propuesta de arquitectura para revisión, NO nuevo contrato normativo, NO autorización de migración destructiva.  
**Ámbito:** Diagnóstico territorial → fuentes conservadas → Perfil de Salud Local → Priorización.  
**Rama de trabajo:** `fix/document-archive-provenance-20261120`, PR #169.  
**Fecha:** 2026-11-20.

## 1. Problema y propósito

La sucesión de cargas, revisiones y pantallas ha hecho crecer el gestor documental como un segundo producto. Se han superpuesto un índice global, bandeja de carga, ficha central, copias locales, originales remotos, inventarios de activos, detección de duplicados, versiones de informes y biblioteca propia del Perfil.

**Propósito:** restaurar la continuidad de trabajo sobre el Perfil de Salud Local sin perder procedencia, seguridad de los originales ni capacidad de deshacer operaciones documentales. No se persigue una nueva colección de tarjetas ni un recuento decorativo de «evidencias».

## 2. Fuentes de verdad ya localizadas

- `docs/ESTADO-ACTUAL-COMPAS-NG.md`: preservar separación entre original, transcripción, EvidenceStore y Perfil; cadena expediente → Perfil → priorización.
- Issue #92: ficha única por ID, versiones, hash, Firebase/IndexedDB, control de borrado y trazabilidad.
- Issue #160: carga → consulta → sustitución → retirada → recarga, ensayos Firebase autenticados, exclusión de recurso individual, residuos históricos.
- Issue #151: fidelidad de versiones del Perfil, original PDF/JSON, coincidencia narrativa/estadística y compuerta humana.
- Código: `src/domain/repository`, `src/application/document-ingestion/documentDuplicates.ts`, `src/application/document-files/documentRevisions.ts`, `src/ui/components/{Documentation,DocumentAccess,DocumentArchiveManager,DuplicateDocumentsPanel,DocumentReviewInbox,ActivosSaludPanel}.tsx`, `src/application/localiza-assets`, `src/ui/components/ExternalProfileDashboard.tsx`.
- Contratos completos: **pendientes de inventariado exhaustivo** en `docs/contracts` por el ejecutor; no reinterpretar nombres ni reemplazar contratos sin cotejo.

## 3. Taxonomía obligatoria para el expediente municipal

1. **Informe sobre la situación de salud de [municipio]**: documento y originales/versiones.
2. **Estudios complementarios**: IBSE, SAM y demás instrumentos; el resultado de un instrumento no es otro documento original.
3. **Localiza Salud de [municipio]**: **un inventario vigente**, con recursos/actividades individuales, referencias externas y revisiones. No confundir unidad documental, recurso ni actividad.
4. **Otras fuentes documentales**: solo las que correspondan al diagnóstico según su función.
5. **Perfil de Salud Local**: artefacto externo o incorporado con biblioteca de versiones propia, ligado a las fuentes concretas utilizadas.
6. **Priorización**: fase deliberativa posterior; recomendaciones del Perfil no son prioridades adoptadas.

Las evidencias derivadas son soporte metodológico visible al inspeccionar la procedencia de un resultado, no un quinto bloque de igual rango a los documentos básicos.

## 4. Modelo de información que debe guiar la limpieza

Cuatro entidades distintas, ligadas por IDs:
- **Documento fuente**: función documental, municipio, título institucional, emisor, fechas declaradas y relaciones de revisión.
- **Versión/original**: hash, tamaño, medio, almacenamiento remoto/local verificado, fecha de custodia, autor y sustitución.
- **Unidad interna de información**: recurso Localiza, actividad asociada, observación, indicador o hallazgo con su identificador estable y fuente.
- **Producto del proceso**: resultados de diagnóstico y versión del Perfil, con manifiesto de fuentes/revisiones y estado de revisión/validación.

Nunca deducir identidad del título, del nombre del fichero ni de la posición de una fila. El hash idéntico identifica bytes iguales, no necesariamente función documental equivalente.

## 5. Caso Atarfe / CPA, sin inferencias destructivas

El seed público `public/seeds/compas-ng-workspace-atarfe.json` registra **tres documentos**, uno de ellos `doc-localiza-atarfe` de clase `localiza-salud`; el EvidenceStore del seed contiene 26 átomos. Los 26 átomos NO son 26 estudios ni 26 originales.

La relación aportada por el usuario contiene **19 filas enlazadas a identificadores de Localiza Salud y una fila adicional sin identificador**, la unidad de salud mental comunitaria. Dos filas se titulan «Centro de Participación Activa de Atarfe», con IDs externos distintos **61585** y **61419**. La relación incluye además actividades explícitas del CPA, por ejemplo coro (61425) y senderismo (61429).

**No concluir aún** que 61585/61419 sean una misma ficha duplicada, ni que una sea actividad, ni validar identidad solo por el título. Contrastar descripción, tipo, vigencia, referencias externas y registro histórico. Diseñar dos niveles `recurso` y `actividad vinculada` cuando los datos lo acrediten; permitir `identidad por verificar` y asociación manual reversible. El usuario decidirá si consolidar.

Inventario único significa un solo archivo/inventario vigente del municipio, **no** un solo registro de recurso, y **no** eliminación del historial.

## 5 bis. Conciliación concreta de la relación aportada por el usuario

Cotejo de 2026-11-20 entre la relación de 20 recursos aportada en la conversación y el `sourceText` del seed público de Atarfe (20 líneas):

- **Coinciden los 20 títulos de la relación** en el inventario del seed, incluidas las dos entradas tituladas Centro de Participación Activa y los talleres de coro y senderismo; las filas no deben convertirse en 20 originales.
- La relación aportada permite completar dos referencias externas que **faltan en el seed**: **Centro Cultural Medina Elvira — 61583** y **Club de senderismo Castillejo — 61924**. La unidad de salud mental comunitaria permanece sin ID externo en ambos conjuntos.
- El seed presenta un único `doc-localiza-atarfe` y **26 átomos derivados**: **20 `asset`**, **5 `indicator`** y **1 `qualitative-observation`**. No son 26 archivos originales. La exposición prominente de «Evidencias» como cuarto bloque confunde niveles.
- CPA **61419** y **61585** comparten título e institución pero describen talleres y destinatarios de manera diferente; **61425** (coro) y **61429** (senderismo) son actividades con entradas diferenciadas. Decisión propuesta: entidad institucional CPA + subrecursos/actividades vinculados cuando lo acrediten los datos, sin fusionar automáticamente los IDs externos.
- **Acción necesaria**: matriz de correspondencias por ID externo, título, ámbito, destinatarios, temática, tipo propuesto y relación jerárquica; reconciliación sin sobrescribir ni añadir un segundo Localiza.

Los dos identificadores recuperables son una propuesta de completado **pendiente de confirmar contra fuente externa y Firebase real**; esta auditoría no ha cambiado el seed ni el expediente remoto.

## 6. Vista de Diagnóstico territorial: pantalla inicial y herramientas

Estado inicial al entrar, **sin expansión del IBSE**: portada institucional con el gradiente COMPÁS, banda de cinco logos ya utilizada por Inicio, municipio y 3–4 accesos centrados en documentos RELAS. Sin renderizar la lista masiva de fuentes, el catálogo global, la bandeja de carga ni el EvidenceStore. El contenido inicial debe caber a 1280 × 720 salvo restricciones de accesibilidad; móvil puede desplazar.

Al entrar en un bloque, mostrar el espacio **contextual**, no todos los módulos abiertos: lista de versiones, estado de custodia, original verificable y operaciones `abrir / descargar / nueva versión / archivar / retirar` según permisos. La acción `Volver al resumen` restituye la portada sin perder trabajo no confirmado. Las acciones sensibles siempre muestran repercusiones y requieren confirmación.

Un **único** componente de gestión documental gobierna el inventario. `DuplicateDocumentsPanel`, `DocumentArchiveManager`, `DocumentReviewInbox` y el diálogo `Documentation` deben coordinar una misma fuente de verdad; fusionar o retirar duplicación de interfaz con pruebas y sin eliminar funciones útiles prematuramente.

## 7. Oleadas de ejecución (trabajo sustantivo, no microiteraciones)

### Oleada A — Arqueología y matriz de decisiones (código + contratos)

Entregar:
- índice de contratos vigentes/legacy con cita a archivo y sección;
- mapa de rutas de datos y escrituras de cada original, cada versión, activo y Perfil;
- matriz `Conservar / Unificar / Ocultar / Deprecar / No tocar` por componente;
- instantánea de Atarfe sin escribir Firebase;
- inventario de discrepancias entre seed, navegador y Firebase (separadas, no equiparadas);
- decisiones abiertas, limitadas a las de semántica institucional o de pérdida de datos.

No implementar un segundo sistema de duplicados.

### Oleada B — Núcleo documental transaccional y migración no destructiva

Unificar acceso por ID, versiones y readback autenticado; asegurar que reemplazo/retirada no renace desde IndexedDB ni afecta un Perfil guardado. Migración idempotente, con dry-run, conteo antes/después, copia de seguridad, rollback verificable y reporte; no correr sobre expedientes reales sin decisión explícita.

Resolver altas repetidas como `misma huella`, `posible coincidencia`, `revisión declarada` o `unidad de recurso`, con acciones distintas.

### Oleada C — Localiza Salud y Estudios sin superposiciones

Un inventario vigente por municipio; recursos y actividades con ID externo, vinculación reversible, validación y exclusión por unidad; no perder todos los recursos al eliminar una fila. Los instrumentos (IBSE incluido) abren cerrados y mantienen sus visualizaciones y cálculos históricos.

### Oleada D — Portada compacta y ficha operativa

Diseño compartido con Inicio; portada de una pantalla, logos e identidad. Una sola puerta hacia cada conjunto documental y una ficha usable con operaciones reales; comprobación visual por Chrome/Playwright en 1280×720 y móvil, más teclado y zoom.

### Oleada E — Volver al Perfil de Salud Local

Desde el Perfil, ofrecer **manifiesto reproducible de fuentes** (ID, revisión, original, fecha de corte, enlace y estado de verificación), sin sustituir el PDF/JSON propio del Perfil. Cotejar resultados del Perfil con originales y datos, conservar versión activa y revisión humana; recomendaciones separadas de prioridades. Salida: informe de diferencias y decisiones pendientes, no cambios epidemiológicos inventados.

## 8. Pruebas y compuertas de aceptación

- `npm run build`, suites unitarias relevantes y CI pasan, sin cambiar pruebas para esconder pérdidas funcionales.
- E2E en ámbito de ensayo, con Firebase autenticado, segunda sesión y recarga: altas, originales, duplicados, sustituciones, archivados y borrado con readback.
- Original faltante, original corrupto, nombre idéntico/bytes distintos, hash idéntico/nombre distinto, versión del Perfil con PDF/JSON de revisión distinta, backup antiguo.
- Invariantes: **cero cambios no autorizados a expedientes reales**, ninguna pérdida de recursos vinculados, ninguna prioridad adoptada automáticamente, ningún falso «original disponible».
- Inspección de captura a 1280×720 y móvil: portada inicial sin scroll obligatorio en escritorio, sin estudios autodesplegados; el espacio de detalle sí puede desplazarse cuando se abre.
- Validación de Atarfe CPA 61585/61419/61425/61429 con evidencia de identidad, no resolución por semejanza nominal.
- Cierre: mostrar **antes/después** del expediente documental y acceso al Perfil, explicar qué componentes se han retirado y qué sigue pendiente.

## 9. Ejecución con Codex o ChatGPT Work

**Codex (repositorio):** inventario contractual, matriz de dependencias, refactorización, migraciones idempotentes, pruebas y PR por oleada. Trabajar en rama de saneamiento, no en `master`; revisar PR #169 antes de continuar para evitar que su trabajo de portada se convierta en arquitectura definitiva.

**Work (navegador):** inspección real de Inicio, Diagnóstico y Perfil; capturas comparables, operaciones de solo lectura en Atarfe; pruebas destructivas únicamente en ámbito de ensayo autorizado.

**Revisión humana concentrada:** una decisión de nomenclatura/taxonomía, una sobre equivalencia recurso–actividad y una sobre vigencia/retirada por conjunto; no solicitar aprobación tras cada ajuste cosmético.

## 10. Orden de prioridades

**Primero proteger el Perfil y los originales.** Después eliminar duplicación estructural, conciliar Localiza/IBSE, completar la portada operativa y retomar el contenido del Perfil. La maquetación no valida la custodia ni la epidemiología.

**Puntos por negociar:** (1) cómo identificar un único inventario vigente Localiza por municipio; (2) quién y con qué prueba puede confirmar equivalencias entre recursos/actividades; (3) política de archivo vs eliminación irreversible; (4) orden de validación de Perfiles municipales. Hasta acordarlos: solo lectura, informes y cambios reversibles.
