# Contrato de escritura del Perfil Local de Salud

> Documento operativo, no académico. Gobierna cómo se escribe el Perfil,
> lo redacte COMPÁS NG, una persona o un asistente fuera de la aplicación.
> Versión inicial: 2026-07-09. Versión 2: 2026-10-25 (§0, lector y voz;
> §1 y §4 alineados con el contrato metodológico v2.1.0); §0.2, §0.4 y §0.5
> revisados el 2026-10-26 (estructura en siete apartados y citas). Implementación
> testeable: `src/application/health-profile/profileWritingContract.ts` y
> `tests/profile-writing-contract.test.ts`.

## 0. Para quién se escribe y cómo suena

Decisión del autor (2026-10-25). Esta sección prevalece sobre cualquier hábito
de redacción y se aplica cada vez que se genere un Perfil, dentro o fuera de
COMPÁS, para que el resultado no dependa de recordarlo en cada conversación.

### 0.1 El lector

El Perfil lo recibe una persona que tiene que entender su municipio y decidir:
una técnica municipal, un concejal o una alcaldesa, una enfermera o un médico
del centro de salud, una persona del Grupo Motor. No es un evaluador del método
ni un revisor del sistema. Lee para saber cómo está la salud de su pueblo, por
qué, con qué cuenta y qué conviene hacer a continuación.

**Prueba del lector.** Antes de entregar cualquier apartado, se relee como lo
leería esa persona. Si una frase le habla del documento, de sus fuentes o de
sus reglas en vez de hablarle del municipio, se reescribe o va al anexo.

### 0.2 La voz

- El sujeto del texto es el municipio y su gente, no el Perfil. «Loja tiene…»,
  «En la Alfaguara…», «Las mujeres de Loja…»; nunca «Este Perfil describe…»,
  «En este apartado se recoge…», «Lo que no consta se declara aquí…».
- Prosa de diagnóstico, con datos dentro de la frase. Cada dato lleva su
  cita al lado, numerada en estilo Vancouver con la tabla o el apartado de la
  fuente: «20.923 habitantes [1]», «el 58,8 % [4, tabla 31030]». Datos de
  fuentes distintas no comparten cita. Tablas solo donde el lector compara
  cifras.
- Se escribe desde el lugar: el territorio, los barrios, los anejos, la
  economía real, la historia que explica el presente. Los determinantes
  sociales de la salud forman parte de ese discurso diagnóstico integral; no
  se exponen como teoría ni ocupan un capítulo aparte.
- Lo que no se sabe se dice donde importa, como un hecho sobre el
  conocimiento del municipio y en una frase: «No hay datos de suicidio en Loja
  posteriores a 2010». No se anuncian listas de ausencias ni se declara qué
  entra o no entra en el documento.
- Modelo de referencia: «Loja: lo que sabemos de los determinantes de su
  salud» (borrador del 25-10-2026). Contramodelo: los borradores que se
  explican a sí mismos.

### 0.3 Qué no va en el cuerpo

Como regla general, se reserva para anexos de notas metodológicas o metadatos
de trazabilidad, sin impedir los campos explícitos de las conclusiones, la tabla
de lagunas, las discrepancias entre fuentes ni el apartado de autoría y
validación exigidos por la estructura aprobada:

1. La explicación de qué es el documento, qué incluye, qué deja fuera y por
   qué (salvo un párrafo de presentación, sin reglas).
2. Las etiquetas de tipo de afirmación («hecho», «interpretación»,
   «hipótesis»), los grados de sustento y los rótulos de ciclo como
   encabezados de frase. El contrato metodológico exige clasificar cada
   afirmación (Art. 8): esa clasificación vive en la capa de trazabilidad y en
   el bloque de conclusiones, y se nota en la prosa por cómo se dice («los
   datos muestran», «probablemente», «no se sabe»), no por etiquetas.
3. Las definiciones operativas (recurso y activo, local y no local) y la
   tabla completa de fuentes.
4. Las incoherencias de las fuentes, que van a una nota técnica dirigida a
   quien elaboró cada fuente.

### 0.4 Estructura del Perfil RELAS y adaptación territorial (Loja, 2026-10-26)

Para el caso de Loja, el Art. 16 quater del contrato metodológico organiza el
cuerpo en siete apartados, con la conclusión como unidad y la evidencia completa
en anexos. El Resumen precede al cuerpo y no se numera. La organización de los apartados previos puede adaptarse al territorio, pero
todo Perfil Local de Salud RELAS debe cerrar su desarrollo diagnóstico con
**conclusiones y recomendaciones explícitas**. Las recomendaciones son parte
del Perfil, no un contenido indebido ni una opción que pueda omitirse por una
regla heredada. La autoría, validación y material administrativo se ubican
después de ese cierre diagnóstico, en los metadatos o anexos pertinentes. Esta
estructura no ordena reestructurar automáticamente perfiles históricos. Su aplicación requiere comprobar el contrato
metodológico vigente, la fase del expediente y la estructura aprobada para cada
municipio; no debe suprimir ni alterar evidencia, textos validados o decisiones
territoriales previas.

**Cuerpo.**

1. **Punto de partida.** El municipio en un párrafo, el proceso local (ciclo
   actual y ciclos anteriores) y de dónde procede lo que se sabe. Las
   preguntas que recorren la lectura y los vacíos principales, en una frase
   cada uno.
2. **Conclusiones.** Cada una con su enunciado y una lectura breve, seguida
   de campos fijos: tipo, evidencia (hasta tres, con cifra y cita), relación
   y su grado, límite y recomendaciones a las que lleva. Es el único lugar
   del cuerpo con etiquetas de tipo de afirmación (§0.3).
3. **Coincidencias y discrepancias entre fuentes.** Dónde convergen
   registros, estadísticas y consultas, y dónde se separan.
4. **Lo que no sabemos.** Tabla: pregunta sin respuesta con datos,
   conclusión a la que afecta y dónde puede obtenerse la respuesta.
5. **Recomendaciones.** Menú numerado (Conocer, Contrastar, Abordar), cada
   una con la conclusión de la que deriva, para que el equipo técnico elija,
   corrija o descarte (Art. 8 quater). «Abordar» solo con relación de grado 1
   o 2.
6. **Paso al Plan de Acción.** Breve transición que no incorpora actuaciones ni sustituye la decisión del Grupo Motor.
7. **Autoría y validación.** Registro administrativo posterior al cierre de conclusiones y recomendaciones, que podrá trasladarse a metadatos o anexos para preservar ese cierre.

**Anexos.**

- Evidencia por dimensión: el municipio y su gente; situación de salud;
  desigualdades; activos y recursos; voz de la comunidad.
- El proceso local: ciclos, hitos y lo que dejó cada uno.
- Cómo ha cambiado el municipio: cifras de ciclos distintos, una junto a
  otra solo cuando se midieron de la misma manera.
- Tablas de apoyo (por ejemplo, renta por sección censal), referencias,
  notas metodológicas y nota técnica para quienes elaboraron las fuentes.

**Decisiones que se mantienen.**

- **Estilos de vida.** Sin apartado propio. Las cifras autonómicas o
  provinciales sin dato local (Encuesta Andaluza de Salud) son contexto,
  rotulado «no local», dentro del anexo de situación de salud. Se dice una
  vez, en su sitio, que no hay datos locales y que solo los habrá si se
  producen como estudios complementarios con el Gestor de Encuestas de
  COMPÁS.
- **Interpretación.** No hay lectura integrada en hilos ni párrafos de
  «lectura» al final de cada anexo: la interpretación vive en las
  conclusiones y en el apartado 3.
- **Antecedentes.** Los ciclos anteriores se cuentan en el anexo del proceso
  local y sirven de término de comparación, no de descripción del presente.

### 0.5 Comprobación antes de entregar

Un Perfil, o un apartado, no se entrega si:

- la prosa diagnóstica se centra reiteradamente en el propio documento o su método, salvo los apartados de presentación, procedencia, validación y transición de fase;
- aparecen etiquetas de tipo de afirmación fuera del bloque de conclusiones;
- se acumulan listas de ausencias sin relación diagnóstica, salvo la tabla explícita de preguntas pendientes prevista en la estructura aprobada;
- una cifra no lleva año y cita propia al lado, o se presenta una cifra
  estimada o aproximada como dato;
- un dato no local ocupa el lugar de uno local;
- se usa lenguaje estigmatizante sobre barrios o colectivos, aunque proceda
  literalmente de una fuente;
- no supera la prueba del lector (§0.1).

## 1. Propósito del Perfil Local de Salud

El Perfil es el producto esencial de COMPÁS NG. El Informe de Salud viene
dado; el Plan de Acción pertenece a una fase posterior. Lo que aporta COMPÁS
es convertir estudios complementarios, documentación territorial, BADEA/IECA,
activos comunitarios, material cualitativo y el contraste del Grupo Motor en
una **lectura territorial con sentido**: informar, interesar, suscitar
preguntas y preparar la deliberación. Desde el contrato metodológico v1.4
(2026-10-21) el Perfil concluye y recomienda qué conocer, qué contrastar y
qué abordar (Art. 8 quater), en el cuerpo, tras las conclusiones; no decide.

## 2. Escribir con perspectiva de sociología de la salud

No es una capa ornamental: cambia la frase. La fórmula de escritura es:

```
señal de salud
→ posible mecanismo social
→ determinante plausible
→ desigualdad observable o no observable
→ activo/capacidad relacionada
→ pregunta para contraste comunitario
→ conclusión diagnóstica → recomendaciones elegibles separadas, cuando procedan
```

Operativamente:

- **Conocimiento lego/experiencial (Popay)**: la comunidad y el Grupo Motor
  son *fuente de conocimiento* sobre mecanismos, barreras, significados y
  relación estructura/agencia — no un trámite de validación posterior. Si no
  hay material cualitativo, esa experiencia es *conocimiento pendiente de
  incorporación*, nunca se inventa.
- **Determinantes y desigualdades (Graham; Borrell/Benach)**: las señales se
  leen como distribución desigual de recursos, exposiciones y poder. La falta
  de desagregación se escribe como *desigualdad no observable*, no como
  ausencia de desigualdad.
- **Salutogénesis y activos (Antonovsky; Hernán/Cofiño)**: los activos son
  capacidades reales o potenciales conectadas con los desafíos — reconocidas
  o pendientes de validación, accesibles o pendientes de contraste — no un
  inventario decorativo ni cobertura demostrada.
- **Participación (Cassetti/Paredes-Carbonell)**: la deliberación produce
  conocimiento; el texto debe dejar preguntas vivas que el Grupo Motor pueda
  trabajar.
- **Lugar y vida cotidiana (Macintyre/Ellaway; Bambra)**: el barrio, el
  entorno cotidiano y las condiciones de vida son la clave de lectura: cómo
  se duerme, cuánto apoyo se tiene, cuánto se camina, qué se come.

## 2 bis. Principio de primacía local

El Perfil comenta **primero** la evidencia local o directamente incorporada
al proceso —Informe de Salud (fuente primaria), estudios complementarios
(señales propias del proceso), documentación territorial, activos, material
cualitativo, priorización y contraste comunitario cuando existan—. Las
fuentes externas o de escala superior —BADEA/IECA, EAS, Andalucía,
provincia, municipio matriz usado como proxy— **solo contextualizan,
comparan o ayudan a formular hipótesis**, y aparecen siempre con cautela de
escala. **No pueden convertirse en la historia principal del Perfil**, y el
proxy municipal/provincial/autonómico nunca sustituye a la evidencia
distrital/local: donde falte dato local, se declara la ausencia, no se
rellena con contexto externo.

Consecuencia de orden: en cada capítulo, la evidencia local precede al
contexto externo (p. ej., el Informe de Salud se comenta antes que el
contexto BADEA del municipio matriz).

### Hilo sanitario y contextualización social

La primacía local tiene un matiz de objeto: el Perfil mantiene el **hilo
sanitario**. El Informe de Salud sostiene el objeto salud del documento
—situación epidemiológica, problemas de salud, factores de riesgo,
condiciones sanitarias y lectura de enfermedad/bienestar—; los estudios
complementarios **amplían ese hilo** hacia bienestar, hábitos y vida
cotidiana; BADEA/IECA y las fuentes externas **contextualizan** determinantes
y desigualdades. El Perfil no debe convertirse ni en un informe
epidemiológico estrecho ni en un informe social general: es una lectura de
salud socialmente contextualizada.

## 3. Reglas de escritura

1. Abrir por la comprensión del territorio, no por la lista de fuentes.
2. El Informe de Salud estructura la lectura de situación (función
   analítica), además de preservarse como documento.
3. Los estudios complementarios son señales de vida cotidiana y bienestar,
   no el centro automático del Perfil.
4. Cada indicador trazador abre una pregunta diagnóstica, no cierra un dato.
5. Los determinantes se formulan como mecanismos sociales plausibles,
   siempre pendientes de contraste.
6. Distinguir siempre evidencia directa / proxy-contexto / ausencia de dato.
7. Los activos se interpretan como capacidades potenciales conectadas con
   los desafíos.
8. BADEA/IECA es contexto municipal (proxy para ámbitos inframunicipales):
   sitúa el contexto urbano, no resuelve desigualdades internas.
9. El cierre invita a deliberar; las recomendaciones explícitas del cierre diagnóstico no sustituyen las decisiones del Plan de Acción.
10. Tono: institucional y claro; prosa diagnóstica, con tablas y campos estructurados cuando sean necesarios.

### 3 bis. Contrato autorial transversal

La prosa del Perfil aplica además
`docs/contracts/CONTRACT-AUTHORIAL-STYLE.md`. Antes de redactar identifica el
problema territorial, distingue hechos, inferencias, hipótesis y decisiones, y
permite que la evidencia corrija la interpretación. Evita conceptos
prescindibles, oposiciones fabricadas, grandilocuencia y estructuras de
plantilla.

Esta aplicación queda subordinada a las fronteras metodológicas del Perfil: la
voz analítica no autoriza prescripciones operativas fuera del menú elegible,
causalidad falsa, experiencia comunitaria inventada ni sustitución de evidencia
local por contexto externo.
Las redacciones finales aportadas o aprobadas por el equipo se conservan.

## 4. Fronteras (inviolables)

- **No actuaciones**, programas, objetivos estratégicos ni prioridades. Las
  recomendaciones del Perfil (Conocer, Contrastar, Abordar) solo en el menú
  elegible de su apartado aprobado, vinculadas a conclusiones y sin responsable,
  plazo, recurso ni indicador.
- **No Plan de Acción** como contenido del Perfil (es fase posterior).
- **No causalidad falsa**: hipótesis y mecanismos plausibles, nunca
  «demuestra que» ni «causa directa».
- **No proxy como estimación distrital**: todo dato municipal, provincial o
  autonómico se etiqueta como contexto de referencia.
- **No inventar experiencia comunitaria** si no hay material cualitativo.

## 5. Criterios de aceptación de una buena lectura territorial

Una lectura es aceptable si: (a) un lector institucional entiende en la
apertura la imagen del territorio, sus señales, desafíos, capacidades e
incertidumbres; (b) cada señal queda conectada con al menos un mecanismo
plausible o una pregunta; (c) las desigualdades no observables están
declaradas; (d) los activos aparecen conectados con desafíos; (e) hay
preguntas vivas para el Grupo Motor formuladas como producción de
conocimiento; (f) el texto anima a la deliberación y solo recomienda en su capítulo
final (Conocer, Contrastar, Abordar); (g) supera `checkProfileWritingContract` sin violaciones; (h) cumple la
comprobación del §0.5.

### 5 bis. Alcance del verificador automático y transición

`checkProfileWritingContract` es un detector limitado de expresiones, no una
prueba suficiente de calidad, citas, estructura ni sustento causal. Su regla
histórica sobre recomendaciones corresponde a una narrativa anterior y no
autoriza rechazar recomendaciones elegibles del apartado previsto. Las pruebas
de regresión del generador antiguo describen su salida actual, no una prohibición
metodológica universal. La prohibición de recomendaciones se considera obsoleta:
el Perfil RELAS debe culminar con conclusiones y recomendaciones; las actuaciones,
responsables, plazos e indicadores corresponden al Plan de Acción. Antes de activar generación nueva deben actualizarse
verificador, pruebas, compilador y consumidores de exportación de forma conjunta,
con pruebas sobre perfiles históricos; no se altera la salida actual mediante
esta PR exclusivamente documental.

## 6. Bibliografía orientadora mínima

Solo referencias (no se ha descargado material: sin verificación de licencia
en este entorno, se registra la cita y se localiza desde fuentes oficiales).

- Popay J, Williams G. *Public health research and lay knowledge*. Soc Sci
  Med 1996;42(5):759-768.
- Popay J, Williams G, Thomas C, Gatrell A. *Theorising inequalities in
  health: the place of lay knowledge*. Sociol Health Illn 1998;20(5):619-644.
- Graham H. *Social determinants and their unequal distribution: clarifying
  policy understandings*. Milbank Q 2004;82(1):101-124.
- Borrell C, Artazcoz L. *Las desigualdades sociales en salud y sus
  políticas* (Informe SESPAS). Gac Sanit 2008;22(Supl 1). Benach J, Muntaner
  C. *Aprender a mirar la salud*. El Viejo Topo, 2005.
- Antonovsky A. *Unraveling the Mystery of Health*. Jossey-Bass, 1987; y
  *The salutogenic model as a theory to guide health promotion*. Health
  Promot Int 1996;11(1):11-18.
- Hernán M, Morgan A, Mena ÁL. *Formación en salutogénesis y activos para la
  salud*. Escuela Andaluza de Salud Pública (acceso abierto en easp.es).
- Cofiño R, Aviñó D, Benedé CB, et al. *Promoción de la salud basada en
  activos: ¿cómo trabajar con esta perspectiva en intervenciones locales?*
  Gac Sanit 2016;30(S1):93-98 (acceso abierto).
- Cassetti V, Paredes-Carbonell JJ, et al. *Evidencia sobre la participación
  comunitaria en salud en el contexto español*. Gac Sanit 2020;34(4):388-394
  (acceso abierto). AdaptA GPS: adaptación al contexto español de la guía
  NICE NG44 de participación comunitaria (2019).
- Macintyre S, Ellaway A, Cummins S. *Place effects on health: how can we
  conceptualise, operationalise and measure them?* Soc Sci Med
  2002;55(1):125-139.
- Bambra C. *Health Divides: Where You Live Can Kill You*. Policy Press, 2016.
