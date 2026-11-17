# Perfiles externos: Alfacar, Atarfe, Loja y Zagra

Comprobación: 12-11-2026, sesión administrativa de COMPÁS, lectura directa del catálogo y de los fragmentos de Firebase mediante `verificar-perfiles.html`. Código publicado observado: `0c819053db86d9ff96084e75a253968b670f4f5c`. Se consultaron también los originales vinculados y las versiones vigentes en la interfaz de perfiles. No se cargaron, eliminaron, promovieron ni validaron perfiles como parte de esta revisión.

Este informe describe un corte, no una fuente de datos permanente. Volver a ejecutar la lectura antes de intervenir. No certifica fidelidad palabra por palabra, reproducción visual de exportaciones ni calidad científica.

## Estado leído del servidor

Todos los expedientes se recuperaron íntegramente, con biblioteca válida. Todos tienen perfil externo vigente, PDF original, texto y resultados; ninguno consta validado técnicamente. Se reconocen los cuatro bloques iniciales de datos en el texto de los cuatro perfiles, lo que no certifica que estén completos.

| Municipio | Versiones | Originales comprobados en toda la biblioteca / fallos | Indicadores vigentes | Con fuente / periodo / localizador | Con campo denominador | Con comparadores explícitos |
|---|---:|---:|---:|---|---:|---:|
| Alfacar | 5 | 10 / 0 | 28 | 28 / 28 / 25 | 1 | 0 |
| Atarfe | 3 | 6 / 0 | 19 | 19 / 19 / 17 | 6 | 6 |
| Loja | 1 | 2 / 0 | 97 | 97 / 97 / 97 | 97 | 22 |
| Zagra | 2 | 4 / 0 | 30 | 30 / 30 / 30 | 30 | 9 |

Los recuentos de fuente, periodo, localizador y denominador solo comprueban campos no vacíos; no evalúan la pertinencia de sus contenidos. «Comparadores» significa indicadores con referencias declaradas, no comparabilidad epidemiológica certificada. Los originales incluyen JSON y otros formatos; su integridad se verifica recalculando SHA-256 y longitud.

El verificador publicado contaba los JSON y listaba adjuntos de **toda la biblioteca** junto a resultados de la vigente. Por ello sus totales 5, 3, 1 y 2 JSON no significan que cada perfil vigente lleve esos archivos. La corrección de código de esta revisión limita esos recuentos y nombres a `active.attachmentIds`.

## Identidad de las revisiones vigentes observadas

| Municipio | Referencia vigente y archivos vinculados | Observación |
|---|---|---|
| Alfacar | «Perfil de Salud Local de Alfacar»; `Perfil_Salud_Local_Alfacar_v0.5_2026-11-10.pdf` y `perfil-alfacar-paquete-compas.json` | La revisión de renta incorporada el 11/11, con 33 indicadores, figura histórica; no sustituye la vigente v0.5 de 28 indicadores. El número de versión aquí procede del nombre del PDF, no de un campo editorial propio. |
| Atarfe | «Perfil de Salud Local de Atarfe»; `Perfil_Salud_Local_Atarfe_v0.2_2026-11-09.pdf` y `perfil-atarfe-paquete-compas (1).json` | Hay revisiones con PDF v0.4 y v0.5 y 27 indicadores, pero ambas figuran históricas; la vigente tiene 19. No promoverlas sin contraste del equipo. |
| Loja | «Perfil de Salud Local de Loja · revisión de renta censal · 6/11/2026»; `Loja_PSL_renta_2024.pdf` y `.json` | Una versión externa conservada. La lectura del perfil declara 9 conclusiones y 12 recomendaciones. Los 97 resultados no equivalen a 97 indicadores del núcleo sanitario: incluyen otros ámbitos y renta. |
| Zagra | «Perfil de Salud Local de Zagra · revisión de renta censal · 6/11/2026»; `Zagra_PSL_renta_2024.pdf` y `.json` | Dos revisiones con el mismo título y nombres de archivo; la incorporación del 8/11 figura vigente y la del 11/11 histórica. Igual título y recuento no prueban identidad de bytes o contenido. |

El verificador publicado no mostraba ID de revisión, fecha de incorporación ni adjuntos por fila de versión. La corrección los incorpora para poder identificar cada versión sin deducirla de su título. No se han reconstruido IDs ocultos desde el navegador.

## Fuentes del expediente y proceso

| Municipio | Documentos / informes / estudios catalogados | Módulos de estudio cargados | Selección adoptada / estudio temático |
|---|---|---|---|
| Alfacar | 6 / 1 / 0 | Ninguno | Sí / Sí |
| Atarfe | 5 / 1 / 0 | IBSE | No / No |
| Loja | 58 / 1 / 2 | Ninguno | No / No |
| Zagra | 14 / 1 / 0 | Ninguno | Sí / Sí |

No se exige igualdad entre estudios catalogados y módulos cargados. La consulta de Alfacar muestra además una advertencia: la participación recibida no está incorporada en la selección anterior del Grupo Motor. No se resuelve cambiando el estado del Perfil. El contenido del Perfil puede describir antecedentes participativos que aún no tienen registro adoptado en los módulos del expediente.

## Prioridad de trabajo

1. **Identificar y conciliar versiones en Alfacar y Atarfe.** Contrastar vigente, revisiones posteriores, renta, fuentes y decisiones; documentar cuál debe ser referencia. No usar la fecha de carga como decisión automática.
2. **Completar trazabilidad de las cifras.** Revisar en Alfacar los 3 indicadores sin localizador y la base de los 27 sin campo denominador; en Atarfe los 2 sin localizador y la base de los 13 sin campo denominador. No inventar denominadores para recuentos o medias. En Loja y Zagra, comprobar que los campos existentes contienen bases pertinentes.
3. **Cotejar original, texto, JSON y salidas.** El SHA-256 correcto no demuestra que la transcripción ni la maquetación editorial reproduzcan tablas, notas, imágenes o anexos. Esta parte sigue pendiente para los cuatro casos.
4. **Revisar suficiencia y validar con autoría humana.** La revisión contractual y las pruebas de software no aprueban científicamente los perfiles.
5. **Confirmar dependencias.** El Plan consume la vigente; la consulta histórica y la presentación del Aula no cambian esa referencia. Activos e intervenciones necesitan sus registros propios y su contraste.

## Correcciones derivadas en el repositorio

- Añadir Atarfe al conjunto de referencia; la comparación técnica exige los cuatro expedientes, sin igualar cifras ni cobertura.
- Separar adjuntos de la vigente y custodia de toda la biblioteca; identificar cada revisión y sus originales en la tabla de versiones.
- No fijar una selección de lectura al ID de la copia inicial antes de llegar la biblioteca remota. Sin elección explícita se sigue la vigente; consultar una histórica sigue siendo posible y se rotula como tal.
- Revisar el contrato externo, añadir una guía única de entrega y aclarar el alcance histórico de los contratos del generador. Mantener explícita la aprobación técnica pendiente del contrato externo.


## Evaluación posterior del contenido

La lectura completa de las cuatro versiones vigentes se evalúa en [el dictamen de contenido](PSL-CONTENT-REVIEW-2026-11-12.md). Distingue las bases aprovechables de Alfacar y Atarfe de las inconsistencias editoriales de Loja y Zagra; identifica las correcciones y los límites del cotejo. Los mínimos técnicos de esta línea de base no acreditan conformidad metodológica.
