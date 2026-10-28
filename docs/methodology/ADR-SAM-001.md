# ADR-SAM-001 — Tamaño, cobertura, composición y confianza independientes

Estado: aceptado por encargo del autor, 2026-10-28. Método: SAM-3.0.0.

## Decisión

Retirar la clasificación alta/media/baja derivada de alcanzar el 100 % o el
60 % de Cochran. Esos cortes no tienen justificación metodológica documentada.
Cambiar su valor por otros cortes no resolvería el problema. Ningún tamaño,
cobertura o parecido demográfico demuestra por sí solo representatividad.

Cochran con corrección por población finita se conserva como referencia de
planificación de una proporción bajo selección aleatoria simple, con sus
parámetros nominales efectivos. No atribuye un margen de error a la encuesta.
Se conservan n, N, fuente, año, universo, fecha, n teórico y sus parámetros.

`computeSampleComposition` conserva recuentos, porcentajes y diferencias en
puntos porcentuales por edad y sexo; identifica celdas y bandas sin respuestas.
El signo de la diferencia indica sobre/infrarrepresentación en la composición,
sin umbral de aceptación ni calificación global. La tolerancia numérica de
1e-10 en el resumen evita tratar ruido de coma flotante como desequilibrio;
no constituye un criterio estadístico. La tabla conserva las diferencias originales.

## Cobertura y explicación

`coverageGlobal` conserva su significado histórico n/n teórico × 100 para
compatibilidad. La interfaz lo llama «Porcentaje del tamaño teórico».
`populationRatioPercent` es n/N × 100, un cociente descriptivo de registros.
Solo `participationBasis.uniqueResidents` junto con
`matchingPopulationAndPeriod` permite publicar `populationCoveragePercent`,
si n no supera N. Los productores actuales no dan esas garantías y no las
inventan: por defecto la cobertura es «No evaluable», indicando el motivo.

Una participación muy elevada es una fortaleza y puede justificar hablar de
cobertura censal elevada tras comprobar población objetivo, periodo, residencia,
duplicados y no participación. No se fija un corte automático para «elevada» o
«casi censal». Incluso una cobertura alta puede ocultar selección diferencial.
La semejanza por edad y sexo tampoco controla diferencias no observadas.

`describeSAM` comparte el texto de interfaz, átomos y perfiles recién generados.
Explica cobertura verificable o su ausencia, distribución por sexo, diferencias
demográficas extremas, celdas vacías y consecuencias interpretativas. El detalle
demográfico completo permanece en la tripirámide. Cuando una comparación del
perfil usa todas las edades, declara que no confirma el universo objetivo.

## Confianza y compatibilidad

Las evaluaciones nuevas devuelven `sampleQuality: "not-evaluable"` y
`canClassifyQuality: false`. Los átomos SAM nuevos tienen
`confidence: "not-evaluable"`, `methodology.version: "SAM-3.0.0"` e identificador
estable. El tipo añade este estado; conserva high/medium/low para leer el
histórico y los productores ajenos a SAM. Los filtros por confianza son exactos:
un SAM nuevo no aparece en alta/media/baja; sí en «not-evaluable».
Las etiquetas de EvidenceStore y LT1 contemplan el nuevo estado.

No se modifica ningún JSON municipal, agregado, evidencia histórica ni perfil
guardado. Las vistas identifican SAM sin versión como histórico pendiente de
reevaluación. Los perfiles nuevos añaden esa limitación y las evaluaciones
posibles; no se eleva ni rebaja la confianza de indicadores de otros productores.

Para migrar una evidencia se debe contar con su evaluación fuente y ejecutar
`planSAMEvidenceMigration(previous, assessment)`: valida municipio/identificador,
recalcula según v3 y devuelve copia íntegra `previous` y `replacement`. El
llamador debe archivar el original antes de la sustitución explícita y revisada.
La función no persiste ni ejecuta migraciones al cargar. No se debe usar el
upsert genérico como sustituto de este archivo de auditoría. No se atribuye
verificación de cobertura a datos históricos.

## Límites y verificación

Zagra 15–83 no se puede obtener exactamente de bandas quinquenales que incluyen
80–84; no se interpola. Los límites de edad observados tampoco definen por sí
solos el universo del estudio. La auditoría de expedientes y comparación de
resultados figura en `SAM-3-IMPACT-2026-10-28.md`.

Pruebas: antiguos límites 60/100 %, muestras grandes desequilibradas, cobertura
alta verificada y no verificada, muestras pequeñas proporcionales, ausencia de
padrón, celdas vacías, intervalos, migración histórica, filtros, interfaz e
integridad de las exportaciones reales. Véase el informe de impacto para los
comandos y resultados de la validación.
