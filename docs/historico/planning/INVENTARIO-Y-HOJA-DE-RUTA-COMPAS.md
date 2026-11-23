# COMPAS: inventario funcional y expediente territorial

Fecha: 10 de septiembre de 2026. Base de código examinada: `d0c4d282de943bb32c5c1e5a2ac14a626316901c` (master publicado al comenzar la revisión). Este informe completa conjuntamente los pasos 1 y 2 de la recuperación de la visión general del proyecto. Es una auditoría funcional acotada y una propuesta de integración, no una certificación de toda la aplicación ni un cambio del contrato arquitectónico.

## 1. Propósito y decisiones que se conservan

COMPAS acompaña el ciclo de planificación de salud de municipios, mancomunidades y distritos municipales: documentación y recogida de datos, análisis, perfil de salud, prioridades, objetivos e indicadores, actuaciones, seguimiento y evaluación. Zaidín es el primer recorrido de integración; no define por sí solo todo el producto.

La evidencia, la interpretación técnica y la decisión institucional siguen separadas. El sistema ayuda a preparar propuestas; no atribuye aprobación al Grupo Motor ni al administrador sin un acto explícito. El perfil validado y vigente sigue siendo el puente hacia las decisiones derivadas, conforme a la [Constitución Operativa](../architecture/OPERATING-CONSTITUTION.md).

El titular administra todos los ámbitos. Las personas responsables tienen acceso a los ámbitos asignados, sin herencia automática entre distrito, municipio y mancomunidad. Cambiar a una persona responsable no cambia la identidad del expediente. La autenticación identifica; el registro de administración general concede permisos. Un correo indicado en una conversación no es una asignación de permisos.

No introducir suscripciones, funciones que exijan ampliar el plan ni medios de cobro. GitHub es la referencia del código y Drive su respaldo. Firebase conserva identidades y los datos compartidos implementados; no es otro repositorio de código.

No inventar observaciones: una escala disponible no equivale a una escala aplicada. Usar IBSE, Índice de Bienestar Socioemocional. Los valores derivados deben identificar fuente, periodo, población y método. El trabajo debe ser reconstruible sin memoria conversacional.

## 2. Cómo leer el inventario

- **Implementado localmente:** hay código conectado a la interfaz principal y almacenamiento en el navegador. No implica sincronización ni autorización de servidor.
- **Implementado compartido:** hay operaciones y reglas de Firebase para el objeto indicado. No implica que todo el expediente esté migrado.
- **Parcial:** hay componentes o una parte del recorrido, pero falta una conexión necesaria.
- **Pendiente:** la interfaz anuncia la función o existe una intención, pero no un recorrido operativo completo.

La revisión combina lectura de código y pruebas seleccionadas. No se han inspeccionado las cuentas, los documentos ni los datos privados del navegador del titular. El titular ha comunicado que funciona su entrada con Google y que publicó las reglas; esta auditoría no ha leído su registro remoto de administración ni creado espacios o usuarios reales.

## 3. Inventario de capacidades

Las rutas de evidencia se resuelven desde la raíz del repositorio.

| Área | Estado y capacidad observada | Límite concreto | Evidencia principal |
|---|---|---|---|
| Entrada y navegación | Entrada directa; acceso separado a Administración y RELAS | La portada pública no constituye aislamiento de todos los expedientes y archivos | `src/main.tsx`, `src/App.tsx` |
| Ámbitos y cuentas | Compartido: creación de municipio, mancomunidad o distrito; alta con contraseña aleatoria; coordinación/consulta; retirada/reactivación | No hay edición de correo/contraseña ni sustitución guiada del responsable; no se migran asignaciones antiguas al listado | `src/infrastructure/relas/AdminAccounts.ts`, `src/ui/components/AdministrationPanel.tsx`, `firebase/firestore.rules` |
| Repositorio documental | Local: registro, clasificación, referencias y consulta de originales/textos disponibles | Los originales privados permanecen en IndexedDB; una referencia no acredita un archivo disponible | `src/ui/components/DocumentRepositoryPanel.tsx`, `src/ui/components/Documentation.tsx`, `src/infrastructure/document-files/originalFiles.ts` |
| PDF e ingesta | Local: PDF/DOCX principal y complementario, extracción y acceso desde enriquecimiento | No hay OCR ni reconstrucción garantizada de tablas/gráficos; extracción no equivale a interpretación validada | `src/application/health-report/ProcessPdfHealthReport.ts`, `src/application/document-ingestion/ManualDocumentIngestionService.ts`, `src/App.tsx` |
| Evidencias | Local: almacén estructurado, referencias de procedencia y saneamiento de integridad | No es un repositorio compartido ni un registro completo de datos individuales | `src/application/evidence/EvidenceStoreIntegrityGuard.ts`, `src/application/runtime/MunicipalityRuntime.ts` |
| Estudios y análisis | Local: importadores de IBSE y otros instrumentos; agregados, advertencias y evaluación metodológica de muestras | No es un motor general de estadística; cada parser exige su formato. El parser IBSE agrega puntuaciones de columnas previstas; no debe anunciarse como puntuador universal de ítems | `src/application/ibse/IBSECSVParser.ts`, `src/application/sam/`, `src/ui/components/EstudiosComplementariosPanel.tsx` |
| Gestor de encuestas | Local: proyectos modulares, biblioteca, diccionario REDCap, especificación metodológica e importación de datasets compatibles | No hay un servicio propio de recogida pública de respuestas. No todos los instrumentos tienen adaptador REDCap | `src/ui/components/GESPanel.tsx`, `src/application/questionnaire/ImportProjectDataset.ts` |
| Preparación de recogida | Local: propuestas por población, modalidad e instrumentos, guardado y variantes | Son propuestas de preparación; no encuestas ejecutables ni validación de una escala para cualquier población | `src/ui/components/CollectionPreparation.tsx`, `docs/planning/PREPARACION-RECOGIDA-DISTRIBUIDA.md` |
| Perfil de salud | Local: lectura territorial, edición interpretativa, validación, compilación del perfil y revisión por cambio de fuentes | Procesar un informe nuevo no reescribe ni aprueba conclusiones. Falta verificar la formulación real del expediente del titular | `src/application/health-profile/profileSourceChanged.ts`, `src/application/health-profile-compiler/LocalHealthProfileCompiler.ts`, `src/ui/components/LocalHealthProfileView.tsx` |
| Priorización y plan de acción | Local: lectura estratégica, participación, selección deliberativa, catálogo y borrador técnico | El acceso a derivados depende de un perfil vigente y de las decisiones exigidas; no confundir bloqueo legítimo con ausencia del catálogo | `src/application/runtime/MunicipalityRuntime.ts`, `src/ui/components/ActionPlanCatalogPanel.tsx`, bloque `view === "plan"` en `src/App.tsx` |
| Preparación editable del plan | Local y compartida: decisiones sobre elementos del catálogo | Son dos almacenamientos distintos, sin importación ni fusión automática entre ellos | `src/domain/action-plan-catalog/PlanPreparationDraft.ts`, `src/ui/components/PlanPreparationPanel.tsx`, `src/ui/components/TerritorialWorkspace.tsx` |
| Fichas, actuaciones y entregas | Local: definición del indicador, actuaciones, retornos, consolidaciones y descarga Word | Campos textuales; el resultado consolidado lo introduce la persona responsable. No hay recogida distribuida ni cálculo automático general | `src/domain/action-plan-catalog/IndicatorWorksheet.ts`, `src/ui/components/IndicatorWorksheetEditor.tsx`, `src/application/action-plan/exportIndicatorWorksheet.ts` |
| Documentos del perfil | Local: modelo documental con exportaciones DOCX y PDF y visor | Exportar el perfil no equivale a compilar el Plan Local completo; aprobación sigue siendo otro acto | `src/application/psl-c-export/`, `src/ui/components/PSLCArtifactViewer.tsx`, `src/ui/components/LocalHealthProfileView.tsx` |
| Plan Local de Salud final | Pendiente en la interfaz: se anuncia compilación futura incluso con perfil aprobado | No hay entrega final operativa desde esa pestaña que integre todas las partes | Bloque `view === "plan-local"` en `src/App.tsx` |
| Agenda y seguimiento | Parcial: motores y modelos de borrador derivados | La existencia del motor no acredita un registro operativo de ejecución conectado a fichas y evaluación | `src/application/agenda/AgendaEngine.ts`, `src/application/monitoring/MonitoringEngine.ts` |
| Evaluación | Pendiente en la interfaz actual | La pestaña presenta texto informativo; no genera el informe de evaluación | Bloque `view === "evaluacion"` en `src/App.tsx` |
| Copias y recuperación | Local: copia versionada con originales disponibles, huellas, comprobación de conflictos y restauración aditiva | El JSON del expediente y el bundle Git no equivalen a esa copia completa; no incluyen automáticamente Firebase | `src/infrastructure/recovery/browserRecovery.ts`, `src/ui/components/BackupPanel.tsx` |

### Encuestas: alcance comprobado

`GESPanel` utiliza generadores reales de diccionario REDCap y especificación. La importación de proyectos admite IBSE, AUDIT-C, GHQ-12, PHQ-9, PSQI, Fagerström y SBQ cuando existen columnas compatibles. El importador identifica los módulos EAS sin adaptador REDCap y los omite con motivo explícito; no debe interpretarse esa omisión como un estudio sin problemas de salud. Conserva metadatos de importación, no el CSV bruto. La preparación de recogida y un proyecto exportable son objetos diferentes.

## 4. Dónde están los datos hoy

| Contenido | Ubicación efectiva | Consecuencia |
|---|---|---|
| Código y documentos incorporados a la distribución | GitHub / web pública | Son públicos aunque se añada un formulario de login |
| Expediente `MunicipalityWorkspace` | localStorage por ámbito | Lo que hay en un navegador no aparece automáticamente en otro |
| Originales cargados por el usuario | IndexedDB `compas-original-documents` | Hay que incluirlos en una copia recuperable antes de cualquier traslado |
| Proyectos de encuesta, importaciones, fichas, validaciones y perfiles compilados | Campos del expediente local | No se comparten por crear el mismo ID territorial en Firebase |
| Identidad y contraseña | Firebase Authentication | El panel no conserva la contraseña generada tras cerrar su presentación |
| Administración general y asignaciones | `compas_admins`, `compas_access_accounts`, `relas_memberships` | Sus reglas se aplican en servidor; titular y responsables son permisos distintos |
| Identidad territorial | `relas_scopes/{scope}` | Contiene nombre/tipo; no es por sí sola un expediente completo |
| Borrador compartido e historial | `relas_scopes/{scope}/drafts/{moduleId}` y `history` | Guarda decisiones del borrador, no documentos, fichas ni encuestas |
| Respaldo del código | Archivo existente `COMPAS_NG_CONSOLIDADO.bundle` en Drive | Recupera Git; no es copia de las cuentas o datos de Firestore ni del navegador |

**Hallazgo principal:** COMPAS tiene un expediente local rico y un espacio compartido limitado. La siguiente etapa debe conectarlos mediante objetos explícitos, no mediante una copia opaca que parezca sincronizar todo.

## 5. Expediente territorial objetivo — propuesta para implementar por etapas

Es un modelo funcional, todavía no una colección de Firebase ya desplegada. Reutiliza los objetos existentes y evita renombrar masivamente `municipalityId`: en la transición se documentará su correspondencia con `scopeId` y se validará que coincidan. No introducir permisos por coincidencia de nombres ni por jerarquía geográfica.

| Parte del expediente | Objetos necesarios | Condición antes de declararla compartida |
|---|---|---|
| Identidad y acceso | ID estable, nombre, tipo, asignaciones y roles | Titular entra en todos; responsable solo en asignados; revocación efectiva |
| Fuentes documentales | Registro, versión, archivo original o ausencia explícita, huella, procedencia y extracción | Descarga desde otro equipo y verificación del original; distinguir referencia pública de archivo privado |
| Datos y evidencias | Dataset/versión, diccionario, registros o agregados según finalidad, unidades, periodo y procedencia | Importación reproducible; ningún valor sintético como observado; política explícita de conservación del original |
| Perfil | Interpretaciones, preguntas abiertas, fuentes utilizadas y versión validada | Fuente nueva marca revisión; no sobrescribe decisiones ni validaciones anteriores |
| Decisiones y plan | Priorización, selección deliberativa, módulos, objetivos e indicadores, borradores y acuerdos | Distinguir propuesta, revisión técnica y acto institucional; registrar autor y fecha |
| Fichas y actuaciones | Definición, responsable, entregas por periodo, justificantes y consolidaciones | Dos sesiones intercambian la misma ficha con control de versiones y conflictos |
| Encuestas y registros | Proyecto/versiones, instrumentos, población, modalidad y datasets resultantes | Instrumento realmente administrable; importación compatible; acceso y minimización de datos definidos |
| Análisis | Entrada identificable, método/versiones, resultados y limitaciones | Mismo conjunto de datos produce el mismo resultado; comprobar faltantes y denominadores |
| Productos documentales | Tipo, versión, datos de origen, estado, exportaciones e identidad de quien valida | El archivo coincide con la vista y puede regenerarse a partir de la versión guardada |
| Historial y recuperación | Revisiones, cambios, respaldo y migraciones | Recuperación en entorno limpio sin depender de esta conversación |

Los borradores podrán pasar por preparado, enviado para revisión y devuelto o revisado. La aprobación documental corresponde al administrador según el flujo acordado; la aprobación institucional del plan conserva su procedimiento propio. Estos estados son una propuesta de integración, no permisos o transiciones ya presentes en todas las pantallas.

No se ha seleccionado ni habilitado almacenamiento remoto de originales privados. Antes de implementar esa pieza, comprobar capacidad, condiciones de uso y recuperación compatibles con la restricción de no ampliar el plan ni aceptar cargos. No prometer que todas las necesidades de archivos caben en el servicio actual.

## 6. Verificación realizada en esta revisión

Se examinó el código local con árbol equivalente al master citado. No se modificó código de la aplicación, datos iniciales ni reglas durante este inventario.

| Verificación | Resultado | Qué acredita |
|---|---|---|
| Ocho archivos de pruebas: generadores REDCap/metodología, persistencia de encuestas, fichas, cambio de informe, DOCX/PDF de perfil, limpieza de escalas no observadas | 152 pruebas superadas, 1 fallida | Funciones concretas; no una certificación de todos los recorridos |
| Importación multidataset, IBSE y calidad muestral SAM | 58 pruebas superadas | Importadores y análisis cubiertos por esos casos |
| Navegador: `tests/profile-pdf-enrichment.smoke.mjs` | Superada | PDF Zaidín de 130 páginas; huella comprobada; 159.679 caracteres, 12 secciones; cargador complementario; conserva principal y validación previa |
| Inspección directa del seed Zaidín | 8 documentos, 56 evidencias de tipo activo, sin campos de estudios de escalas | No se observan estudios sintéticos activos en ese seed; no acredita datos de un navegador privado |

La prueba de navegador utiliza un contexto de prueba, no el expediente privado del titular. Los caracteres y secciones extraídos miden procesamiento documental, no resultados de salud. No se han ejecutado todas las pruebas del repositorio ni revalidado clínicamente cada escala.

### Incidencias registradas

- **INV-01 — prueba documental desactualizada:** `tests/zaidin-non-observed-studies-removal.test.ts` exige exactamente siete documentos. El seed tiene ocho: incorpora el PDF original y conserva la conversión histórica. Falla esa primera aserción. La inspección independiente confirma 56 activos y ausencia de campos de estudios. Corregir la prueba comprobando identidades y ausencia de observaciones no acreditadas, no eliminando el documento ni ajustando ciegamente el recuento.
- **INV-02 — continuidad histórica ambigua:** documentos previos afirman que no existe autenticación. Se añaden avisos de alcance y enlaces a este inventario; se conserva la historia, sin tratarla como estado actual.
- **INV-03 — dos borradores sin conexión:** `workspace.planPreparationDrafts` y Firestore pueden representar revisiones diferentes del mismo módulo. No existe conciliación implementada.
- **INV-04 — fichas fuera de RELAS:** `TerritorialWorkspace` muestra expresamente que las fichas y documentos se gestionan en el espacio completo.
- **INV-05 — privacidad incompleta:** la protección territorial de Firestore no restringe archivos distribuidos públicamente ni convierte la portada pública en administración privada.
- **INV-06 — producto final y evaluación incompletos:** las pestañas no son generadores operativos; no anunciar entregas finales disponibles.
- **INV-07 — mantenimiento de responsables:** falta un recorrido sencillo para sustitución de cuenta y edición de permisos; los expedientes deben conservar su identidad y su historial.

## 7. Hoja de ruta y siguiente unidad de trabajo

| Orden | Trabajo acotado | Se termina cuando… |
|---|---|---|
| 1 y 2 — esta entrega | Inventario comprobado + definición del expediente objetivo | Existe esta referencia versionada con fuentes, límites, incidencias y criterios de aceptación |
| 3A — siguiente | Zaidín: conservar el expediente real y contrastar su perfil con el informe original | Se identifica el expediente que usa el titular, se conserva su copia con originales, se comprueba la versión de cada fuente y se presenta un listado de cambios del perfil para revisión humana |
| 3B — junto con 3A cuando sea posible | Conectar el borrador local con el espacio Zaidín | Vista previa de importación, comparación de versiones y elección explícita; no sobrescribir ninguno por defecto; operación registrada y recuperable |
| 4A | Compartir fichas, actuaciones y entregas | El responsable rellena una ficha en otra sesión, el titular recibe la misma versión y puede revisarla; lectura/revocación/aislamiento probados |
| 4B | Sustituir responsables y aclarar el menú | Retirada y asignación con un recorrido guiado, sin pérdida del expediente ni modificación del titular |
| 4C | Documentos compartidos y recogida modular | Originales recuperables y trazables; propuestas distinguidas de encuestas administrables; no añadir costes aceptados implícitamente |
| 5 | Análisis y documentos integrados | Cada resultado tiene entrada y método; los documentos usan versiones cerradas; implementar la compilación final antes de anunciarla |
| 6 | Evaluación y recuperación completa | Informe basado en entregas reales y recuperación demostrada del expediente completo en otro entorno |

**Primer recorrido de aceptación:** informe de abril de 2023 → fuente consultable y extracción verificable → cambios propuestos al perfil → revisión/validación humana → preparación de Envejecimiento saludable (Edadismo, Soledad no deseada, Autonomía, Participación) → una ficha real acordada → una entrega identificada → revisión → documento versionado. No atribuir datos a esa entrega hasta que existan.

Para 3A no basta con el seed del repositorio: hace falta contrastarlo con el expediente del navegador que usa el titular. La aplicación ya dispone de copia con originales. Obtener esa copia cuando se empiece el contraste; no pedir credenciales ni asumir que el respaldo de código contiene los datos del usuario.

No se recomienda abrir simultáneamente todos los módulos. Pueden trabajarse juntos el contraste documental/perfil y el diseño del intercambio del borrador; la migración efectiva debe esperar a conservar ambas versiones y probar sus permisos.

## 8. Continuación sin conversación

1. Consultar master y el estado de publicación: el commit citado es la base de esta revisión, no una promesa de actualidad perpetua.
2. Leer este inventario y `docs/ADMINISTRACION-GENERAL-COMPAS.md`.
3. Comprobar el estado de INV-01 a INV-07 y registrar cualquier cambio con evidencia.
4. Continuar por 3A/3B; respetar decisiones humanas y originales existentes.
5. Mantener un repositorio principal y el mismo respaldo de Drive. El respaldo de los datos de cada expediente es una operación diferente.
