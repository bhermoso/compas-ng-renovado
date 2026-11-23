# Contrato de elaboración, entrega y conservación del Perfil de Salud Local

> Versión 1.0 — 2026-11-23. Estado: VIGENTE (aprobado por el responsable el 2026-11-23).
>
> Subordinado a [`CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`](CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md) v3.0.0. Si lo contradice, prevalece el contrato metodológico.
>
> Integra y sustituye a la propuesta de contrato externo v1.1 (12-11-2026), la guía de entrega (12-11-2026, ajustada el 17-11-2026), el documento de arquitectura EXTERNAL-PROFILE (29-10-2026) y el criterio de calidad «Perfil validado» (19-10-2026). Esos documentos pasan a `docs/historico/contratos-perfil/`.

Este contrato responde a una pregunta: cómo llega un Perfil a COMPÁS y qué ocurre con él después. Regula el encargo, la entrega, la carga, la custodia del original, el cotejo entre representaciones, el menú de elección, la validación y la publicación. Lo que el Perfil dice y cómo se estructura lo regula el contrato metodológico; cómo se escribe, la [guía de escritura](../guides/GUIA-ESCRITURA-PERFIL.md).

## 1. Papeles

1. **Equipo redactor.** Persona o equipo identificable que elabora el Perfil fuera de COMPÁS y responde de su contenido. Propone todas las conclusiones y recomendaciones.
2. **Equipo técnico del municipio.** Elige o descarta conclusiones y recomendaciones en COMPÁS y valida la revisión.
3. **COMPÁS.** Conserva el original y sus revisiones, presenta el documento y el menú, registra elecciones y validaciones y comprueba lo verificable. No completa ni reescribe el Perfil, ni deduce de él indicadores, conclusiones o relaciones.

Guardar un archivo, extraer su texto o reconocer sus encabezados no es una revisión científica ni una validación.

## 2. Encargo

- El encargo identifica un municipio, su identificador en COMPÁS, el ciclo, el responsable técnico y un corte documental. No parte de la copia de otro municipio.
- El equipo redactor lee el expediente desde Firebase, que es la única fuente, y registra la revisión del expediente que usa. Distingue documentos, estudios cargados, priorización histórica, selección adoptada por el Grupo Motor y activos del inventario vigente. Un nombre de archivo o una copia local no prueban que algo conste en el expediente.
- Comprueba la regla N+1 (Art. 7 bis A). Si solo hay Informe de Salud, se conserva como Informe y se declara qué falta para elaborar un Perfil; no se convierte en Perfil cambiándole el título.
- Las fuentes opcionales ausentes se declaran. No se sustituyen por ceros ni por contenido de relleno.

## 3. Estructura que debe tener el documento entregado

El documento sigue el contrato metodológico:

1. **Seis páginas de datos** (Art. 17 ter), en el orden del marco de los determinantes sociales: portada; contexto y población; ejes de desigualdad; condiciones de vida; servicios; salud y bienestar. Una página sin datos publicados para el municipio se mantiene y lo dice.
2. **Cuerpo de siete apartados** (Art. 16 quater): punto de partida; conclusiones, abiertas por una lectura de conjunto y numeradas C1, C2…; convergencias y divergencias, si las hay; lo que no sabemos; recomendaciones del Perfil, numeradas R1, R2…, de tipo Conocer, Contrastar o Abordar; paso al Plan de Acción; autoría y validación.
3. **Anexo**, con la evidencia por fuente, las cifras con procedencia, las relaciones declaradas con su grado y la tabla de trazabilidad de las conclusiones.

No se imponen a municipios distintos números iguales de páginas, palabras, conclusiones, referencias, temas ni recursos. La extensión sigue la evidencia; el número de páginas no mide la calidad.

**Perfiles anteriores a la versión 2.5.0 del contrato metodológico.** Rotulan sus páginas con los temas antiguos («Quién vive aquí», «Panel de salud», «Desigualdad») y pueden tener cuatro. COMPÁS las muestra en las páginas equivalentes sin reescribirlas y señala las que faltan. No atribuye retrospectivamente al original páginas que no tiene ni las rellena con cifras; incorporarlas exige una revisión nueva del equipo redactor.

## 4. Paquete de entrega

Se entrega un único paquete por revisión:

| Archivo | Contenido |
|---|---|
| PDF | Documento canónico completo: páginas de datos, cuerpo, anexo y referencias, con versión, fecha del documento y estado |
| JSON | Paquete `compas-profile-package/v1` con el texto completo de esa revisión y sus datos estructurados |
| Acta en Markdown | Identidad, corte de fuentes, archivos con tamaño y SHA-256, cambios respecto a la revisión anterior y cotejos |
| DOCX, opcional | Fuente editable de la misma revisión, coherente con el PDF |

El JSON no sustituye al PDF, y un PDF por sí solo no aporta datos estructurados.

**Esquema del paquete.** Campos: `schema: "compas-profile-package/v1"`, `municipalityId` (debe coincidir con el expediente abierto), `title`, `period`, `author`, `summary`, `text`, `results`, `findings`, `limitations` y `areas`. Cada resultado contiene `id`, `title`, `value` literal, `unit`, `source`, `page`, `period` y `caution`, y puede añadir `topic`, `scale`, `denominator`, `temporalContext` (`current`, `historical` o `not-stated`), `chartValue`, `comparison: {label, value}`, `comparisons: [{label, value}]` (hasta seis; prevalece sobre `comparison`) y `supportsConclusions: ["C1"]`. No se admiten validaciones de terceros, HTML ejecutable ni propiedades que el cargador no lea: la información sin campo propio va al acta.

**Reglas de las cifras.**

- Cada cifra conserva valor literal, unidad, definición o población de referencia, periodo, escala y localizador de la fuente (tabla, página o consulta identificada; no se inventa una página para una fuente web). Un denominador desconocido se declara como desconocido. Un recuento absoluto o una media declaran su base y no exigen inventar una fracción.
- `chartValue` solo para cifras numéricas exactas. Una cota por secreto estadístico conserva su literal y su nota y no lleva `chartValue`.
- `comparisons` solo cuando coinciden definición, unidad, periodo y población de referencia, o cuando la diferencia está justificada y visible. No se rellenan provincias ni municipios con datos autonómicos. No hay colores de mejor o peor sin intervalos o significación publicados por la fuente (Art. 17 quater).
- La renta censal conserva el código de sección completo, el año, la definición y las notas del INE. Una dirección localiza una sección; no convierte su renta en la de la calle o la persona. No se promedian secciones sin ponderar.
- Los activos se describen con fuente, fecha, ámbito y estado de contraste. Solo cuenta en la lectura lo que consta en Localiza Salud (Art. 9). Su número no acredita acceso, cobertura ni efecto sanitario.
- Consulta participativa, estudio de priorización y selección adoptada por el Grupo Motor son hechos distintos.
- `supportsConclusions` enlaza indicadores con conclusiones solo cuando lo declara el equipo redactor y no implica causalidad. `areas` es una lista de orientaciones para deliberar, no de líneas aprobadas.

**Acta mínima.**

```text
Municipio e identificador:
Título / versión editorial / fecha del documento / ciclo:
Equipo redactor y responsable técnico:
Corte de fuentes y revisión de origen:
Archivos entregados, tamaño y SHA-256:
Cambios frente a la revisión anterior:
Correspondencia PDF / texto / JSON / exportaciones:
Suficiencia y limitaciones metodológicas:
Relectura desde Firebase (fecha y resultado):
Revisión vigente confirmada:
Elección de conclusiones y recomendaciones (realizada o pendiente):
Validación técnica (realizada o pendiente, cuenta y fecha si consta):
Discrepancias y pendientes:
```

La versión editorial y la fecha del documento constan en la portada, en el texto y en el acta. El modelo de datos todavía no las guarda en campos propios: `createdAt` es la fecha de incorporación, `id` identifica el registro y `revisionOf` su linaje, y ninguno sustituye a la versión ni a la fecha declaradas.

## 5. Carga y custodia

1. **Formatos y límites.** PDF, DOCX, TXT, Markdown y paquetes JSON, sueltos o juntos en una sola revisión. Hasta 20 MiB por original y 40 MiB de originales por expediente, dentro del límite de 400 fragmentos de Firebase. La extracción de texto sirve para consultar; si falla, el original no se pierde.
2. **Original inalterable.** Cada original se conserva byte a byte, con nombre, formato, tamaño y huella SHA-256, vinculado a su revisión. Se descarga sin reconstrucción. Su existencia no se infiere del texto visualizado, de una referencia, de una exportación ni de un archivo guardado fuera de Firebase.
3. **Original ausente.** Si falta o no se puede verificar su integridad, COMPÁS muestra «original no verificado o no adjunto» y no presenta una maquetación propia como sustituto.
4. **Custodia remota.** El Perfil, sus originales y su historial viajan en el expediente de Firebase. IndexedDB y el almacenamiento del navegador son cachés. La carga solo se da por hecha cuando termina la escritura remota; si falla, se conserva el borrador.
5. **Revisiones.** Una corrección o una edición crea una revisión nueva y no modifica las anteriores ni sus originales. Una carga posterior no se promueve a vigente por ser más reciente, por su nombre ni por tener más datos: cambiar la revisión vigente es una acción explícita.

## 6. Representaciones y cotejo

COMPÁS distingue cuatro estados: original aportado; texto derivado para consulta; representación de COMPÁS; y revisión validada. El PDF que COMPÁS maqueta no adquiere por sí solo el estatuto de original ni de documento validado.

**Permitido sobre la misma revisión, siempre identificado:** extraer texto, corregir saltos de línea, añadir índices y enlaces, separar apartados, marcar conclusiones y recomendaciones, construir tablas y gráficos solo con datos explícitos con fuente, fecha, escala y denominador, y ajustar accesibilidad y paginación.

**Exige una revisión nueva:** cambiar cifras, denominadores, poblaciones, periodos, fuentes, comparadores, autorías, cautelas, grados o relaciones; añadir o quitar conclusiones o recomendaciones; resumir como si fuera transcripción; introducir hallazgos, gráficos o relaciones no declarados.

**Salidas y sus nombres.**

- «Descargar PDF original»: los mismos bytes que el original adjunto; no aparece si no hay original verificable.
- «Consultar texto incorporado»: vista legible del texto, con aviso de posibles pérdidas de extracción mientras no se haya cotejado.
- «Exportar presentación de COMPÁS»: PDF o Word derivados, rotulados como representación derivada, con municipio, versión, fecha, estado y procedencia.
- «Paquete de indicadores»: los datos estructurados con sus fuentes. Su ausencia no significa que el texto carezca de cifras ni autoriza a deducirlas.

**Cotejo.** Para declarar la fidelidad de una revisión se deja constancia reproducible de: original identificado y SHA-256 comprobado; cotejo de texto, tablas, notas, imágenes y anexos con el original; coincidencia de valores, unidades, fechas, citas, cautelas y alcance territorial entre original, texto y exportación; correspondencia de conclusiones y recomendaciones en texto, número y orden; y diferencias editoriales inventariadas. Resultados posibles: conforme, conforme con salvedades, no conforme o no verificado. «No verificado» no equivale a incumplimiento. El resultado se atribuye a una revisión exacta, nunca a un municipio en general.

## 7. Menú de elección

1. Cargada una revisión, COMPÁS presenta como menú sus conclusiones (C1…) y recomendaciones (R1…) (Art. 16 ter). Ninguna nace elegida.
2. El equipo técnico elige o descarta cada una, con autoría y fecha; el descarte admite un motivo. Las elecciones quedan registradas sobre esa revisión.
3. COMPÁS no suprime texto del original. Si se descarta alguna propuesta, la versión institucional es una revisión nueva del equipo redactor que solo contiene las elegidas; mientras no exista, la representación de COMPÁS rotula como descartadas las que lo están.
4. Una revisión no puede validarse con propuestas sin resolver.
5. Elegir no es priorizar: la priorización es del Grupo Motor.

## 8. Validación y su efecto

1. **Acto humano.** La validación técnica es una acción explícita, registrada con la cuenta, la fecha y la revisión exacta. Cargar un archivo o un paquete no la produce, y las pruebas de software no son validación científica.
2. **Vigente y validada son estados distintos.** Una revisión puede ser vigente sin estar validada.
3. **Criterio de calidad, no candado.** La validación no bloquea el trabajo posterior. Toda salida que dependa del Perfil (priorización, Plan de Acción, documento del Plan Local de Salud) declara si la revisión vigente estaba validada y si sus fuentes han cambiado después. El criterio nunca se simula: sin validación, se declara «no validado».
4. **Revisión retirada.** Una revisión sustituida o archivada no alimenta los pasos posteriores; solo lo hace la vigente, con sus propuestas elegidas (Art. 16 bis, I-LHPM-23).

## 9. Aceptación por revisión y publicación

Cada comprobación se registra por separado, sin que una sirva de prueba de otra:

| Comprobación | Evidencia exigida | Lo que no acredita |
|---|---|---|
| Importabilidad | JSON compatible, municipio correcto, límites respetados | Calidad científica |
| Conservación remota | Relectura desde Firebase y SHA-256 de los originales | Fidelidad del texto extraído |
| Correspondencia documental | Cotejo PDF, texto, JSON y exportación, con diferencias inventariadas | Validación |
| Suficiencia metodológica | Estructura, fuentes, conclusiones y recomendaciones justificadas y lagunas declaradas | Priorización adoptada |
| Elección | Todas las propuestas elegidas o descartadas, con autoría y fecha | Validación |
| Validación técnica | Acto humano explícito con cuenta, fecha y revisión exacta | Decisión del Grupo Motor sobre el Plan |

Reconocer los rótulos de las páginas o contar indicadores es un diagnóstico preliminar, no una aceptación. Antes de distribuir un Perfil: confirmar municipio y revisión; quitar filtros de la exportación; comprobar original, cuerpo y anexos; conservar las etiquetas de borrador o validación; e identificar el medio y el destino. Una síntesis para una reunión identifica su Perfil de referencia y no se carga como revisión de él.

## 10. Cambios de fuentes y dependencias

El expediente, la pestaña Perfil y el Plan Local de Salud identifican la misma revisión vigente. Consultar una revisión histórica no cambia la que consume la planificación, y trabajar en el Plan no valida el Perfil.

Una fuente nueva o una corrección abre una revisión de impacto: qué conclusiones, recomendaciones, indicadores, activos o decisiones podrían requerir contraste. No se reescriben el Perfil vigente ni el Plan de forma automática; los cambios de modelo o de datos se aplican con el [actualizador](CONTRACT-PROFILE-UPDATER.md).

Las revisiones se conservan. Eliminar una es una operación explícita, con confirmación, que no equivale a archivar y no se usa para igualar recuentos entre revisiones.

## 11. Pendientes de implementación

- El menú de elección del §7 sobre el Perfil cargado.
- Campos propios para la versión editorial y la fecha del documento.
- Cotejo completo de los Perfiles vigentes de Alfacar, Atarfe, Loja y Zagra contra este contrato y el metodológico v3.0.0.

## Registro de revisiones

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-03 | Propuesta 1.0 | Elaboración externa, custodia y fidelidad de representaciones (contrato externo) |
| 2026-11-12 | Propuesta 1.1 | Entrega reproducible, distinción entre vigente e histórico, renta, activos, participación, aceptación y dependencias; guía de entrega |
| 2026-11-23 | 1.0 | Contrato único de elaboración, entrega y conservación. Integra el contrato externo, la guía de entrega, EXTERNAL-PROFILE y el criterio de calidad «Perfil validado». Seis páginas de datos (metodológico v2.5.0); menú de elección en COMPÁS sobre el Perfil cargado; Localiza Salud, fuente exclusiva de activos. Aprobado por el responsable |
