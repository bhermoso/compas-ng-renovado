# CONTRACT-TERRITORIAL-STATISTICS

> Estadística territorial oficial para el Perfil de Salud Local: búsqueda, descarga,
> conservación e integración en la revisión.
> Versión 1.0.0 — 2026-11-17
> Estado: VIGENTE
>
> Desarrolla el dominio «determinantes sociales» y el eje de desigualdad del
> Art. 17 quater de `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY` (v2.4.0).
> Implementación: `src/application/territorial-statistics/`, panel «Estadística
> territorial» del expediente.

---

## 1. Problema

Los cuatro Perfiles vigentes (Alfacar, Atarfe, Loja, Zagra) usan una parte pequeña
de la estadística oficial disponible sobre determinantes sociales. Faltan, por
ejemplo, el índice de Gini, la distribución P80/P20 y la composición de la renta
por fuente de ingresos, que el INE publica para cada municipio y sección censal.
Cada dato se buscaba a mano, con su año y su fuente, y nada aseguraba que el
mismo indicador se tomara igual en todos los municipios.

El Art. 17 quater exige un núcleo común de indicadores, igual en todos los
municipios, con ficha y comparadores. Este contrato fija cómo se obtienen los de
determinantes sociales y desigualdad, cómo se conservan y cómo llegan al Perfil
sin alterar la revisión vigente.

## 2. Estatuto

1. **Material para la revisión, no evidencia del Perfil vigente.** Una descarga no
   modifica el Perfil vigente, no genera `EvidenceAtom` y no cambia la lectura de
   ningún expediente. Llega al Perfil cuando el equipo redactor la incorpora en
   una revisión nueva (`CONTRACT-EXTERNAL-PSL-FIDELITY-AND-PUBLICATION` v1.1).
2. **Datos, no diagnóstico.** Los valores describen el territorio. No priorizan,
   no recomiendan y no establecen relaciones causales con la salud (Art. 8 y 8 bis).
3. **Excepción acotada a la doctrina del piloto BADEA.** El piloto de 2026-07
   (`BADEA-IECA-TERRITORIAL-SCOPE-MAPPING.md`) excluía la consulta a la API en
   tiempo de ejecución. Este contrato la admite solo en el circuito aquí descrito:
   iniciada por el usuario, con procedencia completa y conservada como instantánea.
   El contexto BADEA 19824 del piloto no cambia.

## 3. Fuentes admitidas

| Fuente | Productor | Acceso | Escalas |
|---|---|---|---|
| Atlas de Distribución de Renta de los Hogares (ADRH) | INE | API wstempus, tablas por provincia y tablas nacionales | Municipio, distrito censal, sección; provincia, Andalucía y España como comparadores |
| Censo anual de población | INE | API wstempus, tablas por provincia | Municipio, distrito censal, sección; provincia como comparador |
| Banco de Datos Estadísticos de Andalucía (BADEA, SIMA) | IECA | API REST de consultas | Municipio, sección; provincia y Andalucía cuando la consulta los publica |
| Distribución espacial de la población (malla de 250 m) | IECA | Servicio WFS | Celda de 250 m dentro del término municipal |

Una fuente nueva entra por reforma de este contrato y nueva versión del catálogo.

## 4. Catálogo de indicadores

1. El catálogo (`catalog.ts`, versión `2026-11-17`) contiene 37 indicadores en tres
   dominios: determinantes sociales, desigualdad y población. El anexo A los lista.
2. Cada indicador tiene una **ficha** con: identificador estable, título,
   definición, unidad, productor, periodicidad, escalas, comparadores, si la
   fuente publica intervalos, cautelas, tabla o consulta exacta y denominación de
   la serie o medida.
3. Las tablas del INE se fijan por provincia andaluza (ocho identificadores por
   tabla). La ficha vale para cualquier municipio andaluz con expediente.
4. Las denominaciones de serie se comparan sin tener en cuenta el orden de sus
   partes, porque el INE las ordena de forma distinta en municipio y sección.
5. El catálogo se revisa con el núcleo del Art. 17 quater, una vez al año. Cambiar
   una ficha exige nueva versión del catálogo; cada descarga conserva la versión
   con la que se hizo.

## 5. Descarga

1. La inicia el usuario desde el expediente, con el código INE del municipio. Si el
   expediente no lo tiene, el usuario lo indica y queda guardado con la descarga.
2. Cada tabla o consulta se pide una sola vez y en secuencia, con progreso visible.
3. Un fallo de una fuente se registra como incidencia y no detiene las demás. La
   descarga declara sus incidencias.
4. Las tablas del INE se piden con metadatos (`tip=AM`): cada serie trae el código
   territorial, de modo que el municipio y sus secciones se identifican por código,
   no por nombre.

## 6. Regla del valor literal

1. **Se conserva el valor publicado.** El valor numérico y su representación en la
   fuente (`format` en BADEA; el número del INE en formato es-ES, con coma decimal y
   punto de millares desde cinco cifras) se guardan sin redondear ni corregir.
2. **Secreto estadístico.** Un dato protegido se guarda como «Secreto estadístico»,
   sin valor numérico, y no entra en cálculos ni en sumas. En la malla, el valor
   `-1` es secreto: la celda no se suma y se cuenta aparte.
3. **Derivados declarados.** Algunos porcentajes del Censo no se publican como tales.
   COMPÁS los calcula como cociente de dos recuentos publicados, redondeado a un
   decimal, y conserva ambos recuentos. El derivado se declara en la ficha, en la
   observación y en el paquete; nunca se presenta como dato de la fuente.
4. **Redondeos de la fuente.** La mediana de la renta del ADRH se publica redondeada.
   Una coincidencia entre ámbitos no indica igualdad exacta.
5. **Textos.** Solo se repara la doble codificación de caracteres de algunas
   respuestas del IECA. No se reescribe ninguna denominación.

## 7. Comparadores

1. Se descargan los ámbitos superiores que la fuente publica en tablas o consultas
   del mismo producto: provincia, Andalucía y España para el ADRH; provincia para el
   Censo anual; provincia y Andalucía para las consultas BADEA que los incluyen.
2. Un comparador que la fuente no publica se omite y no se estima. Las tablas
   municipales del Censo anual no publican Andalucía; ninguna de estas fuentes
   publica el Distrito sanitario.
3. En la tasa municipal de desempleo registrado, el IECA publica la provincia y
   Andalucía por grado de urbanización. Se usa el del propio municipio y se nombra.
4. Ninguna de estas fuentes publica intervalos ni significación: el panel no marca
   «mejor», «similar» ni «peor» (Art. 17 quater, 3).

## 8. Escala

1. El dato de sección o de celda es agregado. No se atribuye a calles, viviendas ni
   personas (Art. 17 quater, desarrollo del eje de renta).
2. La renta es un eje de desigualdad, no un índice de privación múltiple.
3. Con una sola sección se muestra su dato y se declara que no permite analizar
   diferencias internas.
4. Las sumas de la malla localizan la población dentro del término; no sustituyen
   las cifras oficiales del municipio.
5. Un ámbito COMPÁS que no es municipio (Granada-Zaidín) no tiene código INE propio.
   Se descarga el municipio matriz y sus secciones; seleccionar las secciones del
   ámbito queda pendiente (§12).

## 9. Conservación

1. Cada descarga es una instantánea inmutable (`compas-territorial-statistics/v1`):
   municipio, código INE, fecha, autor, versión del catálogo, fuentes con su
   dirección de consulta, observaciones, malla e incidencias.
2. Se guarda en el expediente compartido (campo `territorialStatistics`) solo
   cuando el usuario lo decide, tras revisarla. Se conservan las seis más recientes.
3. Una descarga no sustituye a otra: el expediente puede mostrar la evolución de
   las fuentes entre revisiones.

## 10. Paquete para la revisión

El panel genera, a partir de una descarga:

1. **Resultados** con la forma de `compas-profile-package/v1`: valor publicado,
   unidad, fuente, tabla o consulta y fecha de consulta, periodo, cautelas,
   dominio, escala municipal y comparadores publicados.
2. **Cobertura frente al Perfil vigente.** Para cada indicador: «No figura en el
   Perfil», «Hay un dato más reciente», «Mismo periodo, valor distinto», «Al día» o
   «Sin dato descargado». La coincidencia se busca por el nombre del indicador y
   debe comprobarse.
3. **Tablas:** valores con procedencia completa (CSV) y valores por sección censal
   (CSV).
4. **Malla de 250 m** en GeoJSON, tal como la devuelve el servicio.

El paquete no modifica la revisión vigente ni constituye validación. El equipo
redactor decide qué incorpora y dónde: las páginas de datos (Art. 17 ter), la
página de desigualdad (Art. 17 quater, 4) o el anexo.

## 11. Invariantes

| ID | Invariante |
|---|---|
| I-TS-1 | Una descarga no modifica el Perfil vigente ni genera evidencia del expediente. |
| I-TS-2 | Todo valor conserva proveedor, tabla o consulta, dirección, periodo y fecha de consulta. |
| I-TS-3 | El valor publicado no se redondea, corrige ni completa. |
| I-TS-4 | Un dato con secreto estadístico no tiene valor numérico ni entra en cálculos. |
| I-TS-5 | Un valor derivado declara su método y los valores publicados de los que procede. |
| I-TS-6 | Un comparador no publicado se omite; no se estima. |
| I-TS-7 | El dato de sección o de celda no se atribuye a unidades menores. |
| I-TS-8 | Las descargas guardadas son inmutables y conservan la versión del catálogo. |

## 12. Cuestiones abiertas

1. **Distrito sanitario como comparador.** Ninguna de estas fuentes lo publica.
2. **Andalucía en el Censo anual.** Existen tablas autonómicas con desgloses
   distintos (68519, 68520, 66600, 67127). Usarlas exige comprobar que miden lo mismo.
3. **Series temporales.** La descarga toma el último año publicado. La tendencia
   entre ciclos (Art. 17 quater, 5) puede obtenerse pidiendo más periodos.
4. **Ámbitos inframunicipales de COMPÁS.** Asociar a Granada-Zaidín sus secciones
   censales requiere una relación declarada entre ámbito y secciones.
5. **Ficha municipal del SIMA.** Se publica como hoja de cálculo; leerla exigiría
   incorporar un lector de ese formato.

---

## Anexo A. Indicadores del catálogo 2026-11-17

| Dominio | Indicador | Fuente | Tabla o consulta | Escalas | Comparadores |
|---|---|---|---|---|---|
| Desigualdad | Renta neta media por persona | INE · ADRH | renta (Granada 31025; nacional 53689) | Municipio, distrito, sección | Provincia, Andalucía, España |
| Desigualdad | Renta neta media por hogar | INE · ADRH | renta | Municipio, distrito, sección | Provincia, Andalucía, España |
| Desigualdad | Mediana de la renta por unidad de consumo | INE · ADRH | renta | Municipio, distrito, sección | Provincia, Andalucía, España |
| Desigualdad | Población por debajo del 60 % de la mediana (total, mujeres, hombres) | INE · ADRH | umbrales (Granada 31030; nacional 53694) | Municipio, distrito, sección | Provincia, Andalucía, España |
| Desigualdad | Índice de Gini | INE · ADRH | Gini (Granada 37698; nacional 53688) | Municipio, distrito, sección | Provincia, Andalucía, España |
| Desigualdad | Distribución de la renta P80/P20 | INE · ADRH | Gini | Municipio, distrito, sección | Provincia, Andalucía, España |
| Determinantes sociales | Peso del salario, las pensiones, las prestaciones por desempleo y otras prestaciones en la renta | INE · ADRH | fuentes (Granada 31026; nacional 53687) | Municipio, distrito, sección | Provincia, Andalucía, España |
| Población | Población, edad media, 65 y más años, menores de 18 | INE · ADRH | demográficos (Granada 31033; nacional 53776) | Municipio, distrito, sección | Provincia, Andalucía, España |
| Determinantes sociales | Hogares unipersonales; tamaño medio del hogar | INE · ADRH | demográficos | Municipio, distrito, sección | Provincia, Andalucía, España |
| Población | Nacionalidad extranjera (derivado) | INE · Censo anual | nacionalidad (Granada 69178) | Municipio, distrito, sección | Provincia |
| Población | Nacida en el extranjero (derivado) | INE · Censo anual | nacimiento (Granada 69179) | Municipio, distrito, sección | Provincia |
| Determinantes sociales | Educación superior; primaria o inferior, 15 y más años (derivados) | INE · Censo anual | estudios (Granada 66721) | Municipio, distrito, sección | Provincia |
| Determinantes sociales | Parados y ocupados sobre población de 16 y más años (derivados) | INE · Censo anual | actividad (Granada 66723) | Municipio, distrito, sección | Provincia |
| Determinantes sociales | Tasa municipal de desempleo registrado (total, mujeres, hombres) | IECA · BADEA | 120971 | Municipio | Provincia y Andalucía, mismo grado de urbanización |
| Determinantes sociales | Paro registrado | IECA · BADEA | 37015 | Municipio | Provincia, Andalucía |
| Determinantes sociales | Afiliaciones por lugar de residencia | IECA · BADEA | 49483 | Municipio | — |
| Determinantes sociales | Pensionistas y pensión contributiva media | IECA · BADEA | 46121 | Municipio | Provincia, Andalucía |
| Desigualdad | Renta disponible media por declaración (IRPF) | IECA · BADEA (AEAT) | 105037 | Municipio | Provincia, Andalucía |
| Población | Grado de urbanización | IECA · BADEA | 19824 | Municipio | — |
| Desigualdad | Tasa de desempleo registrado y de larga duración por sección | IECA · BADEA | 119350 | Sección | — |
| Determinantes sociales | Índice de soledad por sección | IECA · BADEA | 119351 | Sección | — |
| Desigualdad | Mediana de las pensiones contributivas por sección | IECA · BADEA | 119349 | Sección | — |
| Población y contexto | Población, 65 y más años, afiliaciones, pensiones y demandantes de empleo por celda | IECA · malla de 250 m | `grid:gridp_250` (2024) | Celda | — |

Las tablas por provincia de las otras siete provincias andaluzas figuran en `catalog.ts`.

## Registro de revisiones

| Fecha | Versión | Cambio | Responsable |
|---|---|---|---|
| 2026-11-17 | 1.0.0 | Creación: fuentes, catálogo de 37 indicadores, descarga, valor literal, comparadores, conservación y paquete para la revisión. Comprobado contra las API del INE y del IECA con Alfacar (18011). Encargo del autor: «todo el circuito», integración como paquete para la revisión, cuatro fuentes | COMPÁS NG |
