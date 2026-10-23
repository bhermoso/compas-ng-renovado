# IBSE de Atarfe: procedencia y condiciones para la ponderación

Fecha: 23 de octubre de 2026.
Estado: diagnóstico reproducible y propuesta pendiente de aprobación metodológica. No modifica los contratos vigentes ni activa ponderaciones.

## Resultado de la revisión

La matriz de `src/config/samWeights.js`, incorporada en el commit 6d87e32, contiene 32 coeficientes para 16 bandas entre 15-19 y 90-94 años. No incluye identificador de muestra, recuentos muestrales por celda, fórmula de derivación ni vínculo verificable con un export concreto. Su nombre no acredita por sí mismo la procedencia INE 2025. `getSamWeight` no recibe municipio y devuelve 1 ante una banda o sexo desconocidos; además, no reconoce los códigos REDCap 1/2. No se utiliza desde el parser IBSE.

Existe una referencia poblacional distinta y documentada en `fixtures/population/atarfe-population-2025.ts`: tabla INE 68535, Atarfe 18022, periodo 2025, 20.952 personas, 21 bandas de todas las edades. Esta revisión comprueba su contenido en el repositorio, no vuelve a certificar la descarga original del INE. Disponer de esa referencia no valida los coeficientes añadidos.

`fixtures/ibse-atarfe.csv` contiene puntuaciones y estado de cumplimentación, pero no edad ni sexo: 909 registros, 811 válidos y media total 63,2. El expediente semilla declara muestra mixta de menores de 16 y personas de 16 o más, sin desglose disponible. No se pueden reconstruir los pesos individuales ni sus medias ponderadas desde ese archivo. Tampoco puede dividirse exactamente la banda poblacional 15-19 en menores de 16 y mayores sin datos adicionales.

## Necesidad y límites

La participación voluntaria depende de canales de captación, accesibilidad, vinculación institucional y disposición a responder. Una captación escolar concentra edades y excluye a quienes no pertenecen al marco escolar. Si bienestar y participación varían entre grupos, la media participante puede diferir de la media de la población objetivo. Esto justifica evaluar la composición, pero no demuestra la dirección o magnitud de un sesgo concreto sin datos.

La postestratificación puede corregir desequilibrios observados en variables auxiliares. No garantiza eliminar la autoselección dentro de cada celda ni permite representar grupos sin respuestas. El ajuste puede aumentar la variabilidad y reducir el tamaño efectivo. Referencia: [AAPOR, Reassessing Survey Methods](https://aapor.org/wp-content/uploads/2023/01/AAPOR_Reassessing_Survey_Methods_Report_Final.pdf).

Por ello es obligatorio evaluar y declarar la posibilidad de ajuste; no es defendible exigir que toda muestra se pondere. Una muestra escolar no pasa a representar a toda la población municipal mediante pesos.

## Método propuesto, no activado

1. Fijar municipio, estudio, periodo y población objetivo antes del cálculo. Resolver los alias `atarfe` y `18022` mediante el registro existente; nunca aplicar la matriz de Atarfe por defecto a otro territorio.
2. Usar bandas y categorías compatibles entre referencia y respuestas válidas. Conservar los registros sin asignación como tales: no imputar sexo o edad ni asignar silenciosamente peso 1.
3. Para cada celda h, calcular `w_h = (N_h / N) / (n_h / n)`. Los denominadores deben corresponder al mismo universo declarado. Los pesos dependen de la muestra; no son constantes municipales reutilizables entre encuestas.
4. Si `N_h > 0` y `n_h = 0`, no existe peso finito que recupere esa celda. No excluirla silenciosamente del universo. Suspender la estimación global o aprobar una redefinición explícita del universo o de las bandas.
5. Calcular cada media como `sum(w_i * x_i) / sum(w_i)` sobre las respuestas válidas de esa variable. Mantener `nValid` como recuento real, junto a suma de pesos y media sin ajustar. No multiplicar una suma global por un único peso. Redondear solo al presentar el resultado.
6. Registrar pesos extremos y `n_eff = sum(w_i)^2 / sum(w_i^2)` como diagnóstico de dispersión de pesos, no como demostración de representatividad ni fundamento suficiente de un margen de error en muestras voluntarias. No truncar pesos sin una decisión documentada.

## Contrato y trazabilidad

`CONTRACT-DYNAMIC-TRIPYRAMID.md`, apartado «Principio de no modificación», establece que la calidad muestral nunca modifica los resultados del estudio. La integración que sustituya las medias actuales por medias ponderadas requiere una enmienda expresa. Propuesta: conservar los agregados observados y añadir un resultado ajustado separado, con validación humana, sin equiparar ajuste estadístico con decisión de priorización.

El resultado ajustado deberá identificar referencia y versión, tabla y año, muestra y huella del archivo, universo, celdas observadas/poblacionales, exclusiones, fórmula, suma de pesos, tamaño efectivo y estado de validación. La indexación demográfica identifica celdas; no reescala el IBSE ni crea otro índice. La escala del instrumento se conserva.

Los cinco átomos IBSE_FACTORES y el IBSE_RESUMEN deberán distinguir resultado observado y ajustado y compartir la trazabilidad y cautelas pertinentes. No se añadirá «ajustado según INE 2025» cuando no se haya calculado y verificado el ajuste. En el estado actual, el parser declara expresamente que no se ha ponderado; esa cautela se transmite a los seis átomos por el mecanismo existente. No se regeneran automáticamente estudios persistidos ni validaciones humanas.

## Datos y aprobación pendientes

- Export IBSE con puntuaciones, edad y sexo enlazados por respuesta, sin identificadores personales innecesarios; o estadísticos suficientes por celda (recuento y suma de cada puntuación).
- Archivo de cálculo de los 32 coeficientes, referencia poblacional exacta y muestra de origen.
- Universo objetivo y tratamiento de celdas vacías, edades no cubiertas y respuestas no asignables.
- Aprobación expresa de la enmienda contractual para introducir resultados ajustados separados.

## Verificación reproducible

`npx vitest run tests/ibse-weighting-provenance.test.ts tests/ibse-age-sex.test.ts tests/ibse.test.ts`

Las pruebas comprueban la muestra disponible, la conservación de las medias, la transmisión de cautelas a los seis átomos y que disponer de edad/sexo no se etiquete como ponderación aplicada. Los identificadores de otros municipios en las pruebas son casos sintéticos de neutralidad, no reasignaciones de evidencia real.
