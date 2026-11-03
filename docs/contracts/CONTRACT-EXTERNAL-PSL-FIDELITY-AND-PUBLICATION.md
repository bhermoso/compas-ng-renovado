# Contrato de elaboración externa, fidelidad documental y publicación del Perfil de Salud Local

> **Propuesta v1.0 — 3 de noviembre de 2026. Estado: PENDIENTE DE APROBACIÓN TÉCNICA.**
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

**No permitido sin nueva revisión aprobada:** cambiar cifras, porcentajes, denominadores, poblaciones, periodos, fuentes, comparadores, autorías, cautelas, grados de certeza o relaciones causales; generar o eliminar conclusiones; resumir como si fuera transcripción literal; introducir nuevos hallazgos, recomendaciones, gráficos no sustentados ni conexiones inferidas por coincidencia semántica.

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

Los casos de contraste son Loja v0.3, Zagra v0.1 y Zagra v0.2. Véase `docs/audits/PSL-EXTERNAL-FIDELITY-BASELINE-2026-11-03.md`.

Los documentos preexistentes se conservan sin reescritura. Su adaptación al contrato se tramita mediante nueva versión explícita si implica contenido, o como representación derivada identificada si solo cambia la presentación.

## 9. Pendientes de aceptación

- Aprobar esta propuesta v1.0 por el responsable metodológico.
- Definir qué campos de identidad documental adicionales exige el modelo de datos; hoy `ExternalHealthProfile` no almacena de forma separada el número de versión editorial ni la fecha declarada del documento.
- Determinar el procedimiento de validación de las cuatro páginas iniciales en perfiles externos de transición.
- Ejecutar cotejos de originales de Firebase y PDF editorial reales; no se ha realizado una certificación visual completa.
