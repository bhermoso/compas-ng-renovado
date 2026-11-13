# Contrato de elaboración externa, fidelidad documental y publicación del Perfil de Salud Local

> **Revisión de propuesta v1.1 — 12 de noviembre de 2026. Estado: PENDIENTE DE APROBACIÓN TÉCNICA.**
> Revisión solicitada para Alfacar, Atarfe, Loja y Zagra. Esta actualización no registra aprobación institucional ni valida sus perfiles.
>
> Alcance: perfiles de salud local redactados fuera de COMPÁS NG, importados en `MunicipalityWorkspace.externalProfileLibrary`, sus originales, revisiones y representaciones.
>
> **Prelación:** subordinado a `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md` v2.3.0 (02-11-2026), vigente. En caso de contradicción, prevalece el contrato metodológico. `docs/architecture/EXTERNAL-PROFILE.md` describe la decisión operativa de importación (29-10-2026); los contratos del antiguo compilador y de escritura automática no reactivan la generación en la pestaña Perfil.

## 1. Naturaleza del producto y responsabilidades

1. **Elaboración externa.** El diagnóstico, la interpretación, las conclusiones y las recomendaciones se redactan fuera de COMPÁS, bajo responsabilidad técnica identificable. COMPÁS no completa ni reescribe automáticamente lagunas diagnósticas a partir del expediente.
2. **No se confunde elaboración con importación.** Guardar un archivo, extraer su texto o reconocer encabezados no constituye una revisión científica ni una validación.
3. **Cuatro estados distintos.** (a) original aportado; (b) texto derivado para lectura y búsqueda; (c) representación editorial de COMPÁS; (d) revisión aprobada, solo cuando consta validación explícita. El PDF de impresión no adquiere por sí solo estatuto de original o de documento aprobado.
4. **Responsabilidad.** Se registra autoría del documento, versión, fecha, municipio, ciclo temporal y estado real de validación. Autoría del borrador y validación institucional son actos distintos; una autoría declarada en el propio PDF no sustituye la firma o aprobación del equipo.

## 2. Estructura común y variabilidad legítima

El documento externo deberá identificar, como mínimo, los siete apartados del art. 16 quater del contrato metodológico vigente:

1. Punto de partida, fuentes, escala y vacíos generales.
2. Conclusiones diagnósticas, precedidas por lectura de conjunto, con evidencia citada, incertidumbre y relación declarada con recomendaciones.
3. Convergencias y divergencias entre fuentes, cuando existan.
4. Lo que no sabemos y la fuente o actuación de conocimiento que cerraría cada laguna.
5. Recomendaciones **del Perfil**, de tipo Conocer, Contrastar o Abordar, derivadas de conclusiones o lagunas y sin fijar responsabilidades, plazos, recursos ni líneas del futuro Plan.
6. Paso al Plan de Acción como frontera de decisión, no como plan anticipado.
7. Autoría, versión y validación.

La información exhaustiva, referencias, tablas, limitaciones metodológicas, fuentes y trazabilidad detallada figuran en anexos. El art. 17 ter dispone cuatro páginas de datos comparables al inicio del documento canónico. **Para un perfil externo antiguo o de transición que no las contenga, COMPÁS deberá señalar la carencia: no las atribuirá retrospectivamente al original ni las rellenará con cifras inventadas.** Incorporarlas editorialmente exige evidencias declaradas, registro de versión y verificación de equivalencia con el documento canónico.

**No se imponen** números iguales de páginas, palabras, conclusiones, referencias, temas ni recursos a municipios distintos. La extensión sigue la complejidad y calidad de la evidencia: el cuerpo debe ser argumentativo y relativamente breve; el detalle va al anexo. Una versión de 13 páginas y otra de 18 pueden ser legítimas si tienen distinta composición o desarrollo; el número de páginas no mide calidad.

## 3. Original inalterable

1. Cada PDF, DOCX u otro archivo que se incorpore como original se conserva **byte por byte** con nombre, formato, tamaño y huella SHA-256, enlazado inequívocamente a la revisión municipal. Debe poder descargarse sin reconstrucción.
2. Su existencia no se infiere del texto visualizado, de una referencia bibliográfica, de una exportación posterior ni de un archivo conservado fuera de Firebase.
3. Si falta original o no se puede verificar su integridad, el sistema muestra explícitamente **«original no verificado/no adjunto»**; no presenta el PDF editorial como sustituto fiel.
4. Nunca se sustituye un original al modificar la transcripción o los indicadores. Un nuevo original exige revisión y registro propios.
5. Las copias locales y de Firebase son soportes de custodia; la identidad documental corresponde a la huella del archivo y su relación con la revisión, no al lugar donde se almacena.

## 4. Extracción, estructuración y reproducción

**Permitido, siempre identificado:** extracción de texto, corrección técnica de saltos de línea para lectura, índices y enlaces de navegación, separación de capítulos, marcadores de conclusiones/recomendaciones, tablas y gráficos construidos solo a partir de datos explícitos con fuente, fecha, escala y denominador; ajustes de accesibilidad y paginación.

**No permitido sobre la misma revisión; exige una nueva revisión identificada y revisión técnica antes de declararla aprobada:** cambiar cifras, porcentajes, denominadores, poblaciones, periodos, fuentes, comparadores, autorías, cautelas, grados de certeza o relaciones causales; generar o eliminar conclusiones; resumir como si fuera transcripción literal; introducir nuevos hallazgos, recomendaciones, gráficos no sustentados ni conexiones inferidas por coincidencia semántica.

La representación debe distinguir: **transcripción/lectura del documento**, **componentes derivados identificados** y **elementos gráficos/editoriales añadidos**. Si la extracción reordena o pierde material (tablas, notas, imágenes, encabezados, anexos), esa representación se marca como **no verificada** hasta comparar con el original. No se promete equivalencia solo por coincidir el recuento de conclusiones.

## 5. Una sola identidad documental y versiones diferenciadas

El art. 17 bis exige coherencia entre las representaciones de **una misma revisión canónica**. Esto no significa que una v0.1 y una v0.2 deban ser textos iguales, ni que deba reemplazarse el PDF original por una presentación recompuesta.

Toda versión conserva: identificador municipal, título, número o identificador de versión declarado, fecha del documento (distinta de fecha de carga), autoría, estado, revisión de origen cuando proceda, archivos vinculados y trazabilidad de validación. COMPÁS no debe atribuir a v0.1 texto o diseño encontrado en v0.2.

Las revisiones nuevas no modifican las anteriores. La promoción de versión vigente y la validación técnica son operaciones explícitas. Un perfil externo en borrador sigue siendo borrador aunque lo presente un diseño institucional.

## 6. Salidas y denominaciones obligatorias

- **«Descargar PDF original»**: entrega los mismos bytes que el documento adjunto; opción ausente o marcada como no disponible si no existe original verificable.
- **«Consultar texto incorporado»**: vista legible del texto de la revisión, con advertencia de posibles pérdidas de extracción cuando no esté cotejado.
- **«Exportar presentación editorial de COMPÁS»**: PDF o Word derivados; llevan título de perfil, municipio, versión, fecha, estado, procedencia y etiqueta de **representación derivada**. No se rotulan como «PDF original».
- **«Paquete de indicadores»**: datos estructurados con sus fuentes; su ausencia no significa que el texto carezca de cifras, y no autoriza inferirlas automáticamente.

En documentos derivados se verifican: presencia íntegra del cuerpo de la revisión, anexos, referencias, todas las conclusiones y recomendaciones; indicadores completos con filtros de pantalla desactivados; ausencia de duplicaciones diagnósticas engañosas; paginación legible. Las cuatro páginas de presentación comparativa no pueden convertir un perfil incompleto de indicadores en un panel aparentemente medido.

## 7. Cotejo y aceptación

Para declarar **fidelidad verificada** de una revisión se exige constancia reproducible de:

1. Original identificado y SHA-256 comprobado; vínculo con la revisión y estatus de autoría/validación.
2. Cotejo de texto y de tablas, notas, imágenes y anexos con el archivo fuente, incluyendo comprobación de pérdidas de extracción.
3. Coincidencia de valores, unidades, fechas, citas, nombres, cautelas y alcance territorial en original, lectura y exportación.
4. Correspondencia de conclusiones y recomendaciones (texto, número, orden y vínculos explícitos); ningún elemento deducido automáticamente.
5. Diferencias visuales y editoriales inventariadas, etiquetadas y justificadas.
6. Exportaciones comprobadas en casos con y sin paquete de indicadores, con y sin original PDF, y con documentos extensos.
7. Validación técnica humana expresa para considerar institucionalmente aprobado el documento; las pruebas de software no son validación científica.

Resultados posibles: **conforme**, **conforme con salvedades**, **no conforme** o **no verificado**. «No verificado» no equivale a incumplimiento. Los resultados se atribuyen a una versión exacta, nunca genéricamente a un municipio.

## 8. Casos iniciales y transición

Los casos de trabajo son **Alfacar, Atarfe, Loja y Zagra**, sobre la revisión vigente que Firebase devuelva en cada comprobación. La línea de base actual figura en [la auditoría del 12 de noviembre](../audits/PSL-EXTERNAL-BASELINE-2026-11-12.md). El [cotejo del 3 de noviembre](../audits/PSL-EXTERNAL-FIDELITY-BASELINE-2026-11-03.md) se conserva como antecedente, sin describir el estado actual.

Los documentos preexistentes se conservan sin reescritura. Su adaptación al contrato se tramita mediante nueva versión explícita si implica contenido, o como representación derivada identificada si solo cambia la presentación.

## 9. Pendientes de aceptación

- Aprobar esta revisión v1.1 por el responsable metodológico; no se infiere aprobación de su incorporación al repositorio.
- Definir qué campos de identidad documental adicionales exige el modelo de datos; hoy `ExternalHealthProfile` no almacena de forma separada el número de versión editorial ni la fecha declarada del documento.
- Determinar el procedimiento de validación de las cuatro páginas iniciales en perfiles externos de transición.
- Ejecutar cotejos de originales de Firebase y PDF editorial reales; no se ha realizado una certificación visual completa.


## 10. Encargo y entrega externa reproducibles

La instrucción de trabajo para la persona o equipo redactor es la [guía de entrega y aceptación](../guides/ENTREGA-PERFIL-EXTERNO.md). El encargo identifica un municipio y un corte documental; no parte de una copia de otro municipio. Se entrega un único paquete por revisión, con:

1. **PDF canónico completo**, con las cuatro páginas iniciales, cuerpo, anexos y referencias. El DOCX editable es opcional; si se aporta como original, queda vinculado a esa misma revisión.
2. **JSON `compas-profile-package/v1`**, con el texto completo de la misma revisión y los datos necesarios para representarla. El JSON no sustituye al PDF, y un PDF por sí solo no proporciona datos estructurados.
3. **Acta de entrega en Markdown**, con municipio, título, versión editorial, fecha del documento, corte de fuentes, autoría, archivos y SHA-256, revisión que sucede, diferencias respecto a ella y resultado de los cotejos. Puede adjuntarse y custodiarse sin atribuirle campos que el importador no lee.

La versión editorial y la fecha del documento constan también en portada y texto. Hoy el modelo no las almacena en campos propios: `createdAt` es incorporación, `id` identifica el registro y `revisionOf` su linaje. Ninguno sustituye la versión editorial o la fecha declarada. No se inventan propiedades JSON como si el importador las conservara. La especificación operativa enumera los campos soportados.

El corte de fuentes distingue documento catalogado, estudio cargado, priorización histórica, selección adoptada y activos del inventario vigente. Las fuentes opcionales ausentes se declaran, sin penalizar con cifras cero ni crear contenido de relleno. La regla N+1 y la suficiencia se comprueban con el contrato metodológico: el Informe solo no se convierte en Perfil por cambiar el título. Para la ruta externa, el anexo se elabora y coteja fuera de COMPÁS; no se invoca el compilador histórico para completar su contenido.

## 11. Indicadores, renta, activos y participación

- Cada cifra conserva valor literal, unidad, definición/población de referencia, periodo, escala y localizador de fuente. Un denominador desconocido se declara como desconocido; contar campos no vacíos no demuestra que esté documentado. Un recuento absoluto o una media declara su base y no exige inventar una fracción.
- `chartValue` se aporta solo para cifras numéricas exactas representables. Una cota por secreto estadístico conserva el literal y su nota; no lleva un `chartValue` que la haga pasar por estimación exacta.
- `comparisons` admite hasta seis referencias explícitas y prevalece sobre `comparison`. Solo se incluyen cuando coinciden definición, unidad, periodo y población de referencia o cuando la diferencia está metodológicamente justificada y visible. No se rellenan provincias ni municipios con datos autonómicos. No se usa color de mejor/peor sin sustento publicado por la fuente.
- La renta censal conserva CUSEC completo, año, definición y notas del INE. Una dirección localiza una sección: no convierte su renta agregada en renta de la calle o persona. No se promedian secciones sin ponderación adecuada. Las revisiones de renta no actualizan retroactivamente originales anteriores.
- Los activos se describen con fuente, fecha, ámbito y estado de contraste. Localiza Salud, inventario activo validado e inventarios históricos se distinguen; su número no acredita acceso, cobertura ni efecto sanitario. La correspondencia con necesidades es declarada, no inferida por coincidencia de palabras.
- Consulta participativa, estudio de priorización y selección adoptada por el Grupo Motor son hechos distintos. La incorporación de nueva participación puede exigir revisar decisiones anteriores, pero el Perfil no las cambia automáticamente.
- `supportsConclusions` enlaza indicadores con C1, C2… solo cuando lo declara el equipo; no implica causalidad. Las recomendaciones se identifican R1, R2… con tipo Conocer, Contrastar o Abordar y derivación explícita de conclusiones o lagunas. `areas` es una lista de orientaciones fundamentadas para deliberación, no un conjunto de líneas ya aprobadas.

## 12. Aceptación por revisión y publicación

Se registran resultados separados, sin convertir uno en prueba de otro:

| Comprobación | Evidencia exigida | Lo que no acredita |
|---|---|---|
| Importabilidad | JSON compatible, municipio correcto y límites de tamaño | Calidad científica |
| Conservación remota | Relectura del expediente desde Firebase y SHA-256 de originales | Fidelidad del texto extraído |
| Correspondencia documental | Cotejo PDF ↔ texto ↔ JSON ↔ exportación; diferencias inventariadas | Aprobación institucional |
| Suficiencia metodológica | Estructura, fuentes, conclusiones y recomendaciones justificadas; lagunas declaradas | Priorización adoptada |
| Validación técnica | Acto humano explícito con cuenta, fecha y revisión exacta | Decisión del Grupo Motor sobre el Plan |

Reconocer los cuatro rótulos de páginas o contar indicadores es un diagnóstico técnico preliminar, nunca aceptación completa. Se cotejan tablas, imágenes, notas y anexos; las salidas derivadas pueden perder elementos del original y esa limitación se declara. No se anuncia fidelidad completa sin cotejo reproducible.

La auditoría distingue **biblioteca completa**, **versión vigente** y **versión consultada**. Los JSON, originales e indicadores de revisiones históricas no se suman a la cobertura de la vigente. La versión más reciente no se promueve por fecha, nombre o cantidad de datos. Cambiar la vigente requiere una acción explícita distinta de cargar o validar.

Antes de entregar o distribuir: confirmar municipio y revisión; eliminar filtros de la exportación; comprobar original, cuerpo y anexos; conservar etiquetas de borrador o validación; identificar el medio y el destino. Una síntesis para una reunión, como la comparativa ESdE del Aula de Loja, identifica su perfil de referencia y sus fuentes añadidas; no sustituye al Perfil canónico ni se carga como si fuera una nueva revisión de él. Introducir esos datos en el Perfil exige revisión explícita y cotejo de todas sus representaciones.

## 13. Dependencias y cambios de fuentes

El expediente, la pestaña Perfil y el Plan Local de Salud deben identificar el mismo perfil vigente. Consultar una revisión histórica no cambia el perfil que consume la planificación. El estado de revisión o validación acompaña a cada salida; trabajar en el Plan no valida retroactivamente el Perfil.

Una nueva fuente o corrección abre una revisión de impacto: qué conclusiones, recomendaciones, indicadores, activos o decisiones podrían requerir contraste. No se reescribe el perfil vigente ni el Plan de forma automática. Los acuerdos de priorización y las selecciones del catálogo se registran en sus módulos, con trazabilidad al perfil y a la deliberación. El contrato de perfiles no impone una línea estratégica a todos los municipios.

Las versiones se conservan por defecto. La aplicación permite eliminación explícita con confirmación; esta operación excepcional no equivale a archivar ni forma parte de una armonización. No se usa para igualar recuentos ni limpiar divergencias entre revisiones. El cotejo de referencia es de solo lectura y no borra, promueve ni valida perfiles.

## Registro de revisión

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-03 | Propuesta 1.0 | Elaboración externa, custodia y fidelidad de representaciones |
| 2026-11-12 | Propuesta 1.1 | Entrega reproducible, cuatro casos actuales, distinción vigente/histórico, renta, activos, participación, aceptación y dependencias; pendiente de aprobación técnica |
