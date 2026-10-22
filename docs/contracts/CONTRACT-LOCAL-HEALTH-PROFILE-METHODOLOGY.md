# CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY

> Contrato metodológico canónico del Perfil de Salud Local (PSL) en COMPÁS NG.
> Versión 1.7 — 2026-10-22 (historial en el registro de revisiones)
> Estado: VIGENTE
>
> Este contrato define qué debe ser metodológicamente un Perfil de Salud Local,
> qué puede afirmar y qué no puede afirmar, cómo se construye su evidencia y
> qué condiciones debe cumplir para ser aceptable como documento institucional.
>
> No describe implementación. No define tipos de datos. No especifica compiladores.
> Es el documento normativo que antecede y condiciona a CONTRACT-MIT-PSL,
> CONTRACT-PSL-COMPAS y CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.

---

## Alcance

Este contrato aplica a:
- El `LocalHealthProfile` como objeto analítico del sistema.
- El `LocalHealthProfileArtifact` (PSL-C) como documento institucional compilado.
- La representación comparativa breve tipo OHID/Fingertips, en lo que atañe a su función como salida derivada de la misma base diagnóstica.
- Todo proceso de producción, validación y entrega del Perfil de Salud Local en COMPÁS NG.

Este contrato no aplica a:
- El Plan de Acción, la Agenda ni el Marco de Seguimiento.
- El Motor de Traducción Estratégica ni sus outputs.
- El Plan Local de Salud compilado.

---

## Capítulo I — Naturaleza y finalidad

### Art. 1. Naturaleza del Perfil

El Perfil de Salud Local es el instrumento de síntesis interpretativa del diagnóstico territorial. Su naturaleza es epistémica: organiza, interpreta y presenta lo que la evidencia disponible revela sobre el estado de salud de una comunidad municipal.

El Perfil **no es**:

- Un plan. No contiene compromisos, actuaciones ni plazos.
- Una declaración de intenciones. No anticipa lo que se va a hacer.
- Un documento del sistema sanitario. Es del municipio, validado por el equipo técnico de salud pública.
- Un catálogo de servicios sanitarios. Los servicios que el sistema sanitario presta en el territorio son activos o datos de contexto, no el objeto del diagnóstico.
- Un producto eterno. Tiene un momento de generación, un responsable y una vigencia implícita ligada al siguiente ciclo diagnóstico.

### Art. 2. Finalidad

La finalidad del Perfil es proporcionar al municipio, al Distrito Sanitario y a la Junta de Andalucía una lectura organizada, trazable y revisable de la situación de salud del territorio, como base para las decisiones de planificación que deberán tomarse en etapas posteriores.

El Perfil existe para que el diagnóstico preceda a la planificación y no la justifique. No existe para legitimar decisiones ya tomadas. No existe para reemplazar el juicio del equipo técnico. No existe para producir compromisos de acción de forma automática.

### Art. 3. Separación entre diagnóstico, priorización, planificación y decisión

El Perfil pertenece a la etapa de síntesis diagnóstica. Las etapas de priorización, planificación y decisión institucional son posteriores y dependen metodológicamente del Perfil, pero no están contenidas en él.

| Etapa | Pregunta que responde | Producto |
|---|---|---|
| **Diagnóstico (Perfil)** | ¿Qué dice la evidencia sobre el territorio? | PSL |
| **Priorización** | ¿Qué necesidades merecen atención preferente? | Deliberación del Grupo Motor |
| **Planificación** | ¿Qué se va a hacer, cómo, quién y cuándo? | Plan de Acción / PLS |
| **Decisión** | ¿La corporación asume el plan como compromiso institucional? | PLS aprobado |

El Perfil concluye y orienta. No decide. Formula orientaciones técnicas derivadas de sus conclusiones (Art. 7 quater): qué contrastar, qué capacidades conectar o reforzar, qué lagunas cubrir, qué determinantes explorar. No selecciona prioridades, no asigna líneas estratégicas, no fija actuaciones operativas (responsable, plazo, recurso, indicador de ejecución), no asume compromisos y no sustituye la deliberación del Grupo Motor.

La orientación técnica propone, la priorización elige, el Plan de Acción concreta y la decisión compromete.

La mezcla de estas etapas en el contenido del Perfil es un defecto metodológico grave que invalida el diagnóstico como base de planificación.

---

## Capítulo II — Identidad territorial

### Art. 4. Singularidad territorial

El Perfil de Salud Local es singular: no puede pertenecer a otro municipio. Esta singularidad no es administrativa; es metodológica.

Un Perfil es singular cuando:
- La lectura territorial emerge de la evidencia específica de ese municipio, no de plantillas ni de textos tipo.
- Los activos comunitarios identificados son los de ese territorio.
- Las tensiones entre fuentes reflejan las contradicciones reales de ese contexto.
- Las cautelas metodológicas se refieren a las limitaciones concretas de los estudios realizados en ese municipio.

Un Perfil que podría intercambiarse con el de otro municipio sin que ningún lector lo notara no ha cumplido su función metodológica.

### Art. 4 bis. Unidades de lectura derivadas del expediente

Las unidades en que el Perfil organiza su lectura integrada se derivan del expediente del municipio. No proceden de una lista de temas fija ni del índice del Informe de Salud.

1. **Existencia.** Una unidad existe cuando al menos una fuente del expediente la sostiene: una prioridad ciudadana, un problema documentado en el Informe o en los estudios, o un grupo de activos. Sin fuente, no hay unidad.
2. **Temas como coordenadas.** Los temas de salud (los de la papeleta de priorización temática y los que añada el Informe) sirven para situar y cruzar fuentes. No determinan qué unidades se escriben.
3. **Tres planos.** Cada unidad cruza capacidad (activos), necesidad documentada (Informe y estudios) y voz (priorización ciudadana y material cualitativo). Un plano sin fuente se declara como laguna (Art. 8), no se rellena.
4. **Correspondencia declarada.** La relación entre temas del Informe, temas de la priorización y ámbitos de activos consta en una tabla declarada, versionada y validada por una persona. Ningún emparejamiento se infiere del texto.
5. **Orden de la lectura dentro de la unidad:** lo que sostiene la salud, lo que se sabe del problema y su escala, lo que dice la comunidad, lo que falta saber y lo que queda para la priorización.

### Art. 4 ter. Ejes de lectura declarados

Un tema que el Informe de Salud trata y que la priorización temática no recoge (el envejecimiento y la dependencia, por ejemplo) no genera por sí solo una unidad de lectura. Puede hacerlo si una persona del equipo técnico lo declara como eje de lectura.

1. **Declaración.** El eje se declara con su definición, las dimensiones del Informe que agrupa y la autoría y la fecha de quien lo declara. Sin declaración, el tema no genera unidad ni conclusión compilada.
2. **Estatuto.** Un eje es una agrupación de evidencia, no un hallazgo. Declararlo no lo prioriza: priorizar corresponde al Grupo Motor (Art. 3).
3. **Versión.** Cada cambio del eje es una versión nueva, con autoría y fecha.

### Art. 5. Perfil como explicación territorial

El Perfil no es la acumulación de datos: es su explicación. La diferencia entre acumular y explicar es la distinción entre el EvidenceStore —que contiene los datos— y el Perfil —que los organiza en una lectura con sentido.

La explicación territorial del Perfil tiene tres movimientos:

1. **Descripción:** qué datos existen y qué muestran.
2. **Interpretación:** qué patrones emergen, qué tensiones existen entre fuentes, qué áreas del territorio merecen atención.
3. **Delimitación:** qué no se puede afirmar con la evidencia disponible, qué está fuera del alcance del diagnóstico, qué permanece incierto.

El tercer movimiento es tan importante como los dos primeros. Un Perfil que explica sin delimitar su propio alcance genera falsa certeza.

### Art. 6. Razonamiento multidisciplinar

El Perfil integra evidencia de naturaleza distinta: epidemiológica, sociológica, psicológica, comunitaria, cualitativa. Esta integración no se resuelve mediante jerarquías entre disciplinas.

La evidencia cuantitativa no tiene primacía sobre la evidencia comunitaria cualitativa. Las dos tienen condiciones de validez distintas y aportan conocimiento complementario. El Perfil reconoce esta complementariedad y evita presentar una sola dimensión como suficiente.

Cuando distintas disciplinas o fuentes producen resultados que apuntan en direcciones opuestas, el Perfil declara la contradicción. No la resuelve artificialmente.

---

## Capítulo III — Evidencia y afirmaciones

### Art. 7. Familias de evidencia admisibles

El Perfil puede integrar evidencia de las siguientes familias:

| Familia | Tipo de conocimiento que aporta |
|---|---|
| **Indicadores cuantitativos** | Estado de salud medible: bienestar socioemocional, apoyo social, salud percibida, hábitos |
| **Determinantes sociales** | Condiciones que estructuran el estado de salud: nivel educativo, empleo, vivienda, entorno |
| **Activos comunitarios** | Recursos, capacidades y fortalezas del territorio movilizables para la salud |
| **Evidencia cualitativa** | Perspectivas, relatos y conocimiento experiencial de los actores del territorio |
| **Participación ciudadana** | Prioridades, percepciones y preferencias de la comunidad expresadas en el proceso participativo |
| **Informes institucionales** | Diagnósticos producidos por el sistema sanitario, servicios sociales u otras instituciones |
| **Evidencia longitudinal** | Cambios observados entre ciclos diagnósticos anteriores y el actual |
| **Cautelas metodológicas** | Limitaciones de las fuentes anteriores que condicionan la interpretación |
| **Marcos estratégicos y normativos** | Orientaciones programáticas autonómicas o estatales relevantes para la planificación (EPVSA, ESCA, RELAS, etc.) |

Ninguna familia tiene rango superior a las demás. El Perfil declara de qué familia proviene cada afirmación y con qué nivel de confianza metodológica.

### Art. 7 bis. Estatuto del Informe de Salud como fuente primaria

El Informe de Salud del municipio (Informe de Situación de Salud u equivalente) tiene un estatuto diferenciado del resto de las fuentes de evidencia:

1. **Es la base epidemiológica oficial del Perfil.** Sintetiza el estado de salud de la población desde la perspectiva del sistema sanitario público. El Perfil lo referencia como fuente primaria, no lo sustituye.
2. **Se preserva íntegro.** El Informe de Salud se carga, conserva y visualiza como documento, no como evidencia atomizada. El sistema no lo transforma en unidades de evidencia ordinarias del EvidenceStore.
3. **No genera EvidenceAtom en el flujo activo del producto.** Las secciones del Informe no se convierten en átomos de evidencia ni alimentan el Motor de Interpretación Territorial como evidencia estructurada. Ver D-HR-01 en el Gap Register.
4. **El Perfil contextualiza el Informe, no lo reemplaza.** Lo que el Perfil añade, una vez cumplida la regla N+1, es la lectura integrada: determinantes sociales, estudios complementarios, activos y capacidades, y priorización ciudadana. Esta lectura enriquece el Informe sin modificarlo.
5. **Admite DOCX y PDF.** Ambos formatos se aceptan. El DOCX permite visualización estructurada; el PDF se preserva como fuente primaria sin extracción de contenido.

### Art. 7 bis A. Regla N+1 del Perfil

El Informe de Salud constituye la base epidemiológica oficial del Perfil, pero por sí solo no constituye un Perfil de Salud Local. El Informe de Salud solo es el componente **N**.

Hay Perfil cuando esa base se interpreta a la luz de al menos una fuente adicional (**+1**) perteneciente a una de estas tres familias:

1. Estudios Complementarios.
2. Activos y capacidades del territorio.
3. Priorización ciudadana.

Cualquiera de estas fuentes puede activar la regla N+1, en cualquier combinación. El Perfil no resume el Informe de Salud: lo cruza con evidencia territorial adicional. Si solo existe el Informe de Salud, el producto sigue siendo el Informe de Salud, no un Perfil.

### Art. 7 ter. Limitaciones diagnósticas y áreas territoriales

El sistema puede detectar observaciones sobre la calidad de la base documental (ausencia de determinantes, cautelas metodológicas, base insuficiente). Estas observaciones son **limitaciones diagnósticas** (`limitacionesDiagnosticas` en el modelo del MIT), no áreas territoriales de intervención.

**Reglas de separación obligatorias:**

- Una carencia de información no es un área de intervención territorial.
- Una cautela metodológica no es una candidatura para la deliberación del Grupo Motor.
- La ausencia de determinantes identificados no puede escalar a área priorizable.
- Los conflictos interpretativos internos del sistema no son áreas de intervención.
- Las limitaciones diagnósticas se declaran como lagunas (Art. 8) o decisiones posteriores, no como áreas.

Solo pueden pasar a la sección de áreas de intervención del Perfil los aspectos que representen **tensiones territoriales sustantivas** con base en datos reales: convergencia de determinantes, activos en relación con necesidades identificadas, hallazgos participativos contrastados con indicadores. Las limitaciones diagnósticas se muestran, como máximo, como "Aspectos pendientes de contraste" o "Limitaciones del diagnóstico".

### Art. 7 quater. Capítulo VI — Cierre interpretativo

El Capítulo VI del Perfil es el **Cierre interpretativo y orientaciones técnicas**. No es "Plan de acción".

El cierre interpretativo establece:
- Qué comprensión del territorio emerge del conjunto del diagnóstico.
- Qué tensiones o patrones deben contrastarse con el Grupo Motor.
- Qué capacidades territoriales pueden sostener el proceso comunitario.
- Qué incertidumbres deben quedar explícitas antes de la priorización.
- Qué orientaciones técnicas se derivan de las conclusiones (Art. 8, tipo «Orientación técnica»).

Cada orientación cita las conclusiones de las que deriva y el grado de sustento de las relaciones en que se apoya (Art. 8 bis). Solo las relaciones de grado 1 y 2 pueden sostener una orientación.

El Capítulo VI no establece compromisos, no selecciona prioridades y no fija actuaciones operativas (responsable, plazo, recurso, indicador de ejecución). Esa concreción pertenece al Plan de Acción / Plan Local de Salud, que es un producto distinto del Perfil. El Perfil termina cuando el territorio queda comprendido y orientado.

### Art. 8. Tipos de afirmación

El Perfil opera con exactamente ocho tipos de afirmación. Toda afirmación incluida en el Perfil debe ser clasificable en uno de estos tipos. Si no puede clasificarse, debe revisarse antes de incluirse.

**Hecho:** afirmación que describe un dato observado, con fuente identificada y trazable.
*Ejemplo: "El 32,8 % de la muestra adulta declara sueño de duración insuficiente (Sueño-EAS, n=152 válidos)."*

**Interpretación:** afirmación que da sentido a uno o varios hechos en el contexto del territorio. Requiere autoría humana explícita y no puede generarse automáticamente.
*Ejemplo: "La convergencia entre bajo apoyo social funcional y alto porcentaje de sueño insuficiente sugiere un patrón de aislamiento social que merece atención diagnóstica."*

**Hipótesis:** afirmación sobre relaciones causales o patrones no demostrados en la evidencia disponible, formulada como posibilidad para orientar la planificación.
*Ejemplo: "Es posible que la dispersión geográfica de las pedanías esté relacionada con la escasez de activos comunitarios en esas zonas."*

**Orientación técnica:** afirmación propositiva derivada de una o varias conclusiones, que indica qué conviene contrastar, explorar, conectar, reforzar o cubrir. Requiere autoría humana explícita, cita las conclusiones de las que deriva y el grado de sustento de la relación en que se apoya (Art. 8 bis). No fija responsable, plazo ni recurso.
*Ejemplo: "Si el Grupo Motor confirma la soledad no deseada como problema, la lectura orienta a explorar su conexión con los activos de participación declarados por el equipo técnico."*

**Percepción:** afirmación que recoge el conocimiento experiencial de actores del territorio, sin pretensión de validación cuantitativa.
*Ejemplo: "Las personas mayores del municipio señalan el transporte como barrera principal de acceso a los servicios de salud."*

**Cautela:** afirmación que limita el alcance de otra afirmación o advierte sobre condiciones que reducen su fiabilidad.
*Ejemplo: "El tamaño muestral del estudio IBSE (n=47) es insuficiente para estimaciones estables por grupo de edad."*

**Laguna:** declaración de que una dimensión relevante del territorio no está cubierta por la evidencia disponible.
*Ejemplo: "No se dispone de datos sobre salud mental adulta en este municipio en el ciclo diagnóstico actual."*

**Decisión posterior:** declaración explícita de que un aspecto del diagnóstico no puede resolverse en el Perfil y debe ser objeto de deliberación en la etapa de priorización o planificación.
*Ejemplo: "La comparación entre el bienestar socioemocional escolar y los determinantes socioeconómicos requiere una discusión deliberativa que el Grupo Motor debe abordar en la etapa de priorización."*

El Perfil declara siempre el tipo de afirmación que realiza. Las interpretaciones no se presentan como hechos. Las hipótesis no se presentan como interpretaciones. Las lagunas no se ocultan.

### Art. 8 bis. Relaciones entre determinantes y problemas de salud

El Perfil puede formular relaciones entre potenciales determinantes y problemas de salud del territorio. Toda relación es una hipótesis (Art. 8) y cumple estas condiciones:

1. **Sustento declarado.** Cada relación cita su base: estudio, guía, encuesta o tabla, con año, población y escala. Una relación sin fuente verificable no entra como relación; puede figurar como laguna («relación plausible sin fuente verificada») para contraste con el Grupo Motor.
2. **Grado de sustento, declarado en cada relación.**
   - *Grado 1 — Observada en el territorio:* ambos extremos constan en la evidencia local del mismo ciclo. Describe coexistencia, no causa.
   - *Grado 2 — Documentada en referencia externa:* la relación procede de una fuente de ámbito superior o de la literatura, con fuente verificable (por ejemplo, valores de la Encuesta Andaluza de Salud para Andalucía o Granada), etiquetada «no local». No sustituye el dato municipal.
   - *Grado 3 — Plausible, sin sustento verificado:* se marca «no verificado». No sostiene ninguna orientación.
3. **Lenguaje proporcionado al sustento.** «Se asocia con», «coexiste con» o «es compatible con». «Causa», «provoca» o «explica» solo cuando la fuente citada demuestra causalidad y así lo dice.
4. **Tabla declarada.** Las relaciones elegibles proceden de una tabla versionada y validada por una persona, como las correspondencias del Art. 4 bis. El sistema no infiere relaciones por coincidencia de términos en un texto.
5. **Escala.** Una asociación observada en un ámbito superior no se atribuye al municipio ni a las personas que lo habitan; se declara la escala (Art. 13).
6. **Contraevidencia.** Si consta evidencia que contradice la relación, se declara junto a ella (Art. 14).

### Art. 8 ter. La afirmación como unidad y la cadena de lectura

Cada frase del cuerpo del Perfil es una afirmación con los campos siguientes: tipo (Art. 8), texto, evidencia con localización, origen (compilada por el sistema desde átomos, o redactada por el equipo técnico), afirmaciones de las que deriva, grado de sustento cuando se apoya en una relación (Art. 8 bis) y, si requiere elección, su estado (Art. 16 ter). La evidencia es obligatoria; solo la cautela y la laguna pueden limitarse a remitir a otra afirmación.

La lectura de cada unidad (Art. 4 bis) recorre cinco pasos. Cada paso admite solo ciertos tipos y tiene una prohibición propia.

| Paso | Tipos que admite | Prohibido |
|---|---|---|
| Describir | hecho, laguna | cifra sin año y fuente; dato aproximado; sustituir el dato local por el de otro ámbito |
| Analizar | hecho, cautela, laguna | umbral sin fuente; presentar una referencia no local como dato municipal |
| Inferir | interpretación, hipótesis | causalidad sin grado 1 o 2; sostener una orientación con una relación de grado 3 |
| Concluir | conclusión | conclusión sin evidencia citada |
| Orientar | orientación técnica | responsable, plazo, recurso o indicador de ejecución; decidir prioridades |

1. **Referencias no locales.** Las referencias de ámbito autonómico o provincial (por ejemplo, la Encuesta Andaluza de Salud) entran en el paso de análisis solo como referencia comparativa rotulada «no local», con encuesta, año y tabla. Nunca sustituyen el dato municipal.
2. **Tabla de relaciones.** Las relaciones del paso de inferencia constan en una tabla declarada y versionada, con su grado y su fuente. La valida una persona del equipo técnico, y cada versión lleva su autoría y su fecha.
3. **Generación.** Una regla puede generar una conclusión u orientación solo cuando existen la relación en la tabla y los átomos de evidencia que la sostienen. Ninguna regla genera una orientación a partir de una relación de grado 3.

*Consecuencia si se viola:* el Perfil contiene frases que no se pueden clasificar ni rastrear, o una orientación descansa en una relación sin sustento.

### Art. 9. Activos para la salud con rango equivalente a los déficits

El Perfil identifica y presenta los activos comunitarios del territorio —recursos, capacidades, fortalezas, redes, prácticas— con el mismo rango metodológico que los indicadores de necesidad.

Los activos no son un apartado opcional ni un complemento pedagógico del diagnóstico. Son evidencia territorial con valor explicativo propio. Un municipio con indicadores por debajo del referente provincial y un tejido asociativo activo tiene una situación distinta de otro municipio con los mismos indicadores y sin tejido comunitario. El Perfil refleja esta diferencia.

La descripción de activos obedece a las mismas exigencias de trazabilidad que cualquier otra evidencia: fuente identificada, tipo de activo, accesibilidad y relación con las necesidades de salud identificadas.

Cuando exista o pueda obtenerse Localiza Salud, esta será la fuente principal/preferente para el mapa de activos del Perfil. Otras fuentes -ERACIS, documentación territorial, material cualitativo, diagnósticos de programas, memorias participativas o informes institucionales- pueden aportar indicios sobre capacidades del territorio, pero no sustituyen Localiza Salud: deben declararse como complementarias, contextuales o pendientes de reconciliación.

Un Perfil que solo diagnostica déficits viola su función metodológica.

### Art. 9 bis. Estatuto de los activos y patrones de cruce

**Estatuto.** Solo cuenta como activo del Perfil el que consta en Localiza Salud. Un mapa previo de recursos (guía local, anexo de un perfil anterior, memoria participativa) no está validado: se conserva como candidato y sigue tres estados, cada paso con decisión humana:

| Estado | Entra en la lectura | Presentación |
|---|---|---|
| Candidato previo, sin coincidencia en Localiza | No | Lista de revisión, «pendiente de reconciliación» |
| Revisado y registrado en Localiza Salud | Sí | Activo con fuente Localiza |
| Validado | Sí | Activo validado |

La coincidencia entre un candidato y Localiza la declara una persona.

**Patrones de cruce.** Cada unidad declara qué combinación de planos sostiene la evidencia, sin umbrales ni puntuaciones:

| Patrón | Afirma | No afirma |
|---|---|---|
| Correspondencia | Necesidad documentada, activo registrado y voz coinciden | Que el activo funcione, llegue o se use |
| Activo sin necesidad documentada | Capacidad no puesta en relación con un problema por el diagnóstico | Que no exista necesidad |
| Necesidad sin activo registrado | El mapa de activos no la cubre | Que el activo no exista: es una laguna del mapa, no un hallazgo |
| Voz sin contraste | La comunidad lo señala y el Informe no lo trata | Que el Informe lo contradiga |

Las conclusiones del Perfil se formulan por patrón. Siguen siendo conclusiones, no recomendaciones (Art. 16 bis).

### Art. 9 ter. Conexión entre determinantes y activos: de lo deficitario a lo salutogénico

La lectura de cada problema o determinante se acompaña de su lectura de capacidad: los factores y activos que sostienen la salud frente a ese problema o determinante, o la declaración expresa de que no hay activo registrado. No se redacta un párrafo de déficit sin su contraparte.

1. **Conexión declarada.** La conexión entre un activo y un determinante o tema la declara el equipo técnico, por activo, con el tema, la justificación, la autoría y la fecha. Es independiente de las temáticas de Localiza Salud, que no se modifican. El sistema no la infiere de las palabras del nombre o la descripción del activo.
2. **Estatuto.** La conexión es una interpretación de capacidad: qué puede sostener el activo. Su efecto sobre el determinante es una hipótesis salvo que se cite evidencia (Art. 8 bis).
3. **Patrones de cruce.** A los del Art. 9 bis se suman: determinante o problema con activo conectado; determinante o problema sin activo conectado; activo conectado a un determinante sin problema documentado. Cada patrón se declara como tal y ninguno se resuelve por analogía.
4. **Orden de lectura.** Se mantiene el del Art. 4 bis: primero lo que sostiene la salud, después lo que se sabe del problema y su escala, después la voz de la comunidad y por último lo que falta.

### Art. 10. Participación como evidencia

Los resultados del proceso participativo —qué ha seleccionado la ciudadanía como prioritario, qué ha identificado como problema, qué conocimiento experiencial ha aportado— son evidencia del diagnóstico.

Esta evidencia tiene tipo específico (percepción o afirmación participativa) y condiciones de validez propias: representatividad del proceso, acceso de los grupos más vulnerables, método utilizado. El Perfil declara estas condiciones.

La participación ciudadana no decide prioridades en el Perfil: informa el diagnóstico. El Perfil escucha; no decide. Registra qué ha dicho la comunidad; el Grupo Motor delibera sobre cómo integrarlo con el análisis técnico en la etapa de priorización.

Cuando el proceso participativo no se realizó, el Perfil lo declara como laguna y señala su implicación para la completitud del diagnóstico.

### Art. 11. Desigualdades e inequidades

El Perfil incorpora la perspectiva de equidad como dimensión transversal del diagnóstico, no como sección adicional.

En cada dominio de evidencia, el Perfil responde: ¿quién está en peor situación dentro del territorio? ¿Las brechas entre grupos son mayores o menores que las diferencias entre el municipio y su referente territorial? ¿El proceso participativo ha dado voz a los grupos con mayor riesgo de salud?

Cuando los datos no permiten desagregar por grupo de población, el Perfil lo declara como limitación metodológica. Los agregados globales que ocultan inequidades sin declarar ese ocultamiento son metodológicamente inaceptables.

---

## Capítulo IV — Rigor metodológico

### Art. 12. Comparación territorial y temporal

**Comparación territorial**

Cada indicador cuantitativo del Perfil se presenta con su referente de comparación: provincial, autonómico o normativo del instrumento. Un indicador sin referente es descriptivo; con referente, es diagnóstico.

Cuando no existe referente disponible, el indicador se presenta sin comparación y se declara esa ausencia. Presentar un indicador como si la comparación fuera posible cuando no lo es constituye una falsedad metodológica.

En el contexto de COMPÁS NG, el referente provincial es más informativo que el referente nacional para municipios andaluces de tamaño pequeño y medio, por razones de comparabilidad socioeconómica y demográfica. El referente nacional se usa cuando no existe referente provincial o cuando el instrumento tiene validación normativa de ámbito estatal sin desagregación provincial.

**Comparación temporal**

Cuando existe evidencia de ciclos anteriores, el Perfil registra la evolución de los indicadores entre ciclos. La evidencia longitudinal es una familia de evidencia con las mismas garantías de trazabilidad que cualquier otra.

Cuando no existe evidencia de ciclos anteriores, el Perfil lo declara. El primer ciclo de diagnóstico de un municipio carece, por definición, de referente temporal propio.

### Art. 13. Incertidumbre situada

La incertidumbre es una característica de todo diagnóstico real, no un defecto del proceso.

El Perfil declara la incertidumbre de cada afirmación en el lugar en que esa afirmación aparece, no en un apéndice técnico separado. Una cautela metodológica desplazada al final del documento no cumple su función: el lector ha interpretado los datos sin conocerla.

Las principales fuentes de incertidumbre que el Perfil debe declarar son:
- Tamaño muestral insuficiente para estimaciones estables.
- Datos de ámbito superior al municipal (Zona Básica, Distrito) usados como proxy.
- Instrumentos en estado borrador o sin contraste con fuente primaria.
- Brechas temporales entre los datos disponibles y el momento del diagnóstico.
- Representatividad limitada del proceso participativo.

Las muestras municipales de COMPÁS NG no permiten inferencia estadística rigurosa comparable a la de encuestas de referencia poblacional. Los comparadores son indicativos, no estadísticamente significativos. La falsa precisión es más peligrosa que la incertidumbre reconocida.

### Art. 14. Convergencia y divergencia de evidencias

Cuando varias fuentes apuntan en la misma dirección, el Perfil declara esa convergencia. La convergencia de fuentes independientes aumenta la solidez de una interpretación.

Cuando fuentes distintas producen resultados contradictorios sobre el mismo aspecto del territorio, el Perfil declara la contradicción sin resolverla artificialmente. La resolución de contradicciones entre evidencias es un acto de deliberación que corresponde al equipo técnico en los capítulos de autoría humana y, si persiste, al Grupo Motor en la etapa de priorización.

Suprimir o minimizar evidencia que contradice la lectura mayoritaria es un defecto metodológico grave. Las tensiones entre fuentes son información sobre el territorio, no ruido a eliminar.

---

## Capítulo V — Articulación institucional

### Art. 15. Compatibilidad metodológica con la Estrategia de Salud Comunitaria de Andalucía

#### 15.1 La ESCA como marco del sistema sanitario, no del municipio

La Estrategia de Salud Comunitaria de Andalucía (ESCA) es un mandato operativo del Sistema Sanitario Público de Andalucía (SSPA) para sus equipos de Atención Primaria y Comunitaria. No es un marco de contenidos para el municipio: es un plan operativo territorial obligatorio para los Distritos Sanitarios.

El Perfil registra la ESCA en su capítulo de marco estratégico como referencia institucional del sistema sanitario que opera en el territorio. Esta referencia informa al diagnóstico sobre qué capacidades del SSPA están disponibles en el municipio; no determina las prioridades del municipio.

#### 15.2 Separación de responsabilidades entre el SSPA y el municipio

Las actuaciones del Plan Operativo ESCA son compromisos del SSPA, no del municipio. El Perfil distingue entre:

- Lo que el SSPA garantiza estructuralmente en el territorio (actuaciones ESCA).
- Lo que el municipio puede comprometerse a hacer en coordinación con el SSPA (compromisos del plan local).

El error metodológico más frecuente en la articulación ESCA-Perfil es presentar actuaciones garantizadas por el SSPA como necesidades del municipio no cubiertas, o como prioridades de intervención municipal. Este error produce planes locales que duplican obligaciones del sistema sanitario y ocultan las necesidades genuinas que el municipio sí puede abordar.

#### 15.3 La ESCA no es un instrumento de evaluación ni un estudio complementario

La ESCA es un plan operativo estratégico. No es una escala, no es un instrumento psicométrico, no genera puntuaciones, no produce datos cuantitativos para el EvidenceStore del Perfil. El Perfil no trata la ESCA como una fuente de evidencia sobre la población.

#### 15.4 Las líneas estratégicas de la ESCA no son objetivos municipales

Las líneas estratégicas de la ESCA definen la orientación del sistema sanitario público. No son objetivos que el municipio deba trasladar mecánicamente a su plan local. La correspondencia entre las prioridades del diagnóstico territorial y las líneas institucionales es objeto de la etapa de traducción estratégica, posterior al Perfil. El Perfil no establece esa correspondencia.

---

## Capítulo VI — Autoría y validación

### Art. 16. No automatización de decisiones

Ningún output generado automáticamente por el sistema puede presentarse en el Perfil como decisión territorial, como prioridad seleccionada ni como orientación técnica sin validación humana explícita.

El sistema genera:
- Organización de la evidencia en el EvidenceStore.
- Síntesis de patrones emergentes en la interpretación territorial.
- Propuestas de orientación técnica para que el equipo las valide, las matice o las descarte.
- Andamiaje de capítulos para redacción humana.

El cuerpo diagnóstico del Perfil es compilado, trazable y no editable libremente. Su autoridad metodológica depende de que pueda reconstruirse la cadena que va desde la fuente hasta la afirmación. La autoría humana no reescribe el diagnóstico como texto libre: lo interpreta, lo matiza y lo asume en los espacios de cierre y enriquecimiento previstos.

El equipo técnico produce:
- Las conclusiones diagnósticas del territorio.
- El cierre interpretativo con el alcance y las limitaciones del diagnóstico.
- La narración de la deliberación de priorización.

Los capítulos de conclusiones y cierre interpretativo del Perfil son siempre de autoría humana. El andamiaje del sistema es un punto de partida para la redacción, no su sustituto. El Perfil compilado como documento institucional no puede generarse mientras esos capítulos contengan andamiaje no reemplazado por texto de autoría del equipo técnico.

### Art. 16 bis. Cadena del conocimiento

La cadena metodológica del Perfil es:

`evidencia → lectura integrada → conclusiones → orientaciones técnicas → | frontera de decisión | → priorización → Plan de Acción`

El Perfil llega hasta las orientaciones técnicas. La priorización corresponde al Grupo Motor y las actuaciones operativas al Plan de Acción y al Plan Local de Salud. La frontera entre Perfil y Plan no es un muro: toda actuación posterior debe poder derivarse de las orientaciones y conclusiones del Perfil, y toda orientación y conclusión debe poder trazarse hasta la evidencia que la sostiene.

### Art. 16 ter. Conclusiones y orientaciones como menú elegible

Las conclusiones y las orientaciones técnicas del Perfil se presentan al equipo técnico como un menú de propuestas. El equipo elige cuáles asume y descarta las demás.

1. **Propuesta.** El sistema genera cada propuesta a partir de las relaciones y lecturas declaradas (Art. 8 bis, 9 ter). Cada una lleva su texto, su tipo (conclusión u orientación), la evidencia o relación de la que deriva y su grado de sustento. Ninguna nace elegida: el sistema puede ordenar las propuestas, pero no marca ninguna.
1 bis. **Propuestas del equipo técnico.** El equipo puede redactar conclusiones y orientaciones en el cierre interpretativo (Art. 16) cuando la lectura no las genera, por ejemplo cuando se apoyan en cifras del Informe que aún no son átomos de evidencia. Cada una cita la evidencia de la que parte, declara sus salvedades y, si se apoya en una relación, su grado de sustento (Art. 8 bis); una orientación deriva de conclusiones registradas. Entra en el mismo menú, rotulada «redactada por el equipo técnico», y no nace elegida: registrarla no equivale a elegirla. El cuerpo diagnóstico sigue siendo compilado; estas propuestas solo llegan a él si se eligen.
2. **Elección.** El equipo técnico elige o descarta cada propuesta, con su autoría y la fecha. Puede ajustar la redacción de una propuesta elegida, que conserva el vínculo con la evidencia de origen. El descarte admite un motivo, que se recomienda registrar.
3. **Lo que entra en el Perfil.** Solo las propuestas elegidas figuran en el cuerpo del Perfil canónico, y lo hacen igual en pantalla, visor, DOCX, PDF e impresión (Art. 17 bis). Las descartadas no se muestran en el cuerpo, pero se conservan en el registro del expediente: no se borran.
4. **Resolución previa a la versión institucional.** El Perfil no puede generarse como documento institucional mientras queden propuestas sin resolver. En borrador, las pendientes se muestran como tales.
5. **Coherencia.** Descartar una propuesta no suprime la evidencia ni la lectura integrada de las que deriva. Si dos propuestas elegidas se contradicen, el Perfil lo declara (Art. 14).
6. **Elegir no es priorizar.** La elección es una validación técnica de lo que el Perfil afirma y orienta. La priorización entre necesidades sigue siendo deliberación del Grupo Motor (Art. 3).
7. **Interpretaciones e hipótesis.** Las interpretaciones y las hipótesis, que exigen autoría humana (Art. 8), pasan por este mismo menú y siguen las mismas reglas de elección, descarte y resolución previa a la versión institucional.
8. **Ubicación y modo de revisión.** Las conclusiones y las orientaciones ocupan el final del Perfil, tras la lectura integrada y en este orden: conclusiones y orientaciones técnicas, y después la frontera de decisión (Art. 16 bis). No se intercalan en las unidades ni abren el documento. El menú no es un documento aparte: es un modo de revisión del mismo Perfil, con los controles de elegir y descartar junto a cada propuesta. Los controles son interfaz y no contenido: fuera del modo de revisión se muestra solo lo elegido, y el texto es idéntico en todas las representaciones (Art. 17 bis).

### Art. 17. Autoría, validación y responsabilidad técnica

El Perfil tiene un responsable técnico con nombre y cargo identificables. Esta identificación es una garantía institucional, no una formalidad.

La validación técnica del Perfil es el acto mediante el cual el equipo técnico certifica que:
- El diagnóstico es metodológicamente correcto.
- Los capítulos de autoría humana expresan el juicio técnico del equipo.
- Las cautelas metodológicas están declaradas con precisión.
- El Perfil puede utilizarse como base del proceso de planificación.

La validación no certifica que el diagnóstico es exhaustivo. Certifica que es honesto sobre su propio alcance.

Una vez compilado como artefacto institucional, el Perfil es inmutable. Si el diagnóstico cambia —porque llegan nuevos datos o porque se detecta un error— debe generarse un nuevo artefacto con nueva versión y nueva validación. El artefacto anterior no se elimina: queda en el historial como registro del diagnóstico en ese momento.

---

### Art. 17 bis. Modelo canónico único

Existe una sola composición canónica del Perfil de Salud Local. Pantalla, visor, impresión, DOCX y PDF son representaciones del mismo documento. Ninguna representación puede divergir de otra.

Las diferencias de formato solo pueden afectar a soporte, paginación, densidad o adaptación visual. No pueden crear contenidos, estructuras diagnósticas, conclusiones o catálogos de fuentes distintos.

### Art. 17 ter. Dos salidas del mismo Perfil canónico

COMPÁS NG puede ofrecer dos salidas institucionales del mismo Perfil canónico, siempre que ambas deriven del mismo modelo semántico y de la misma validación:

1. **Salida interpretativa COMPÁS.** Es la lectura territorial completa: integra fuentes, declara incertidumbres, formula síntesis diagnóstica, expone tensiones, identifica capacidades y deja preguntas para el Grupo Motor. Es la salida propia del Perfil de Salud Local.
2. **Salida comparativa breve tipo OHID/Fingertips.** Es una ficha de alta densidad para audiencia política y ciudadana: presenta indicadores, valores, periodo, escala, referencias territoriales disponibles y cautelas. Su inspiración metodológica son los Local Authority Health Profiles de OHID/DHSC Fingertips, no una copia formal ni un segundo diagnóstico.

La salida comparativa breve no puede:
- crear afirmaciones que no existan en el Perfil canónico;
- consumir fuentes distintas de las ya incorporadas al Perfil;
- ocultar que un valor procede de proxy contextual o de escala no municipal;
- emitir recomendaciones, prioridades o compromisos;
- formular posiciones automáticas "mejor/peor/similar" si el Perfil canónico no ha validado previamente dirección, comparador e inferencia suficiente.

Cuando no exista referencia territorial válida para un indicador, la salida comparativa lo muestra como "referencia no disponible" o equivalente. La ausencia de referencia es una cautela visible, no un hueco que el sistema pueda rellenar por analogía.

---

## Capítulo VII — Flexibilidad y criterios de aceptación

### Art. 18. Flexibilidad metodológica

El Perfil debe poder absorber nueva información, nuevas fuentes y nuevos métodos sin perder su identidad como instrumento de síntesis interpretativa.

La identidad del Perfil no depende de qué instrumentos están disponibles, cuántos estudios se han realizado, ni qué marcos institucionales son relevantes en cada ciclo. Depende de que:
- La lectura emerge de la evidencia del territorio específico.
- La incertidumbre está declarada.
- La autoría humana es identificable.
- La trazabilidad hasta la evidencia de origen es completa.

Un Perfil con Informe de Salud y una única fuente adicional válida según la regla N+1 puede ser metodológicamente correcto. Un Perfil con seis instrumentos pero sin trazabilidad o sin autoría humana explícita no lo es.

La versatilidad del Perfil se gobierna mediante `CONTRACT-SOURCE-CAPABILITY-MATRIX`: una fuente nueva —ERACIS, estrategia autonómica, plan estratégico temático, estudio complementario, priorización ciudadana, documentación territorial, material cualitativo o evidencia longitudinal— debe entrar por la ruta más específica disponible y declarar su escala, estatuto, capacidad de atomización y efecto sobre las salidas del Perfil.

Cuando se incorporen nuevas familias de evidencia, nuevos instrumentos o nuevas fuentes institucionales, este contrato debe revisarse para evaluar si sus artículos siguen siendo adecuados. Los artículos no cambian con la implementación: cambian cuando la experiencia metodológica demuestra que deben revisarse.

### Art. 19. Criterios de aceptación del Perfil

Un Perfil de Salud Local es metodológicamente aceptable cuando puede responderse afirmativamente a todas las preguntas siguientes:

| Criterio | Pregunta de verificación |
|---|---|
| **Singularidad** | ¿Este Perfil no podría pertenecer a otro municipio sin que ningún lector lo notara? |
| **Trazabilidad** | ¿Cada afirmación relevante es rastreable hasta la evidencia o la fuente que la sustenta? |
| **Regla N+1** | ¿El Informe de Salud se interpreta junto a al menos una fuente adicional válida: estudios complementarios, activos y capacidades, o priorización ciudadana? |
| **Incertidumbre visible** | ¿Las cautelas metodológicas están en el cuerpo del documento, junto al dato que condicionan? |
| **Contradicciones declaradas** | ¿Las contradicciones entre fuentes están explícitamente reconocidas, sin resolución artificial? |
| **Equilibrio activos-déficits** | ¿Los activos comunitarios tienen la misma visibilidad que los indicadores de necesidad? |
| **No prescripción** | ¿El Perfil no prescribe automáticamente prioridades, actuaciones ni compromisos? |
| **Autoría identificable** | ¿Los capítulos interpretativos tienen autoría humana explícita, con nombre y cargo? |
| **Alcance delimitado** | ¿El Perfil declara qué no ha podido medir o conocer en este ciclo diagnóstico? |
| **Separación de etapas** | ¿El Perfil no anticipa decisiones de planificación que corresponden a etapas posteriores? |
| **Equidad transversal** | ¿El diagnóstico incorpora la perspectiva de quién está en peor situación dentro del territorio? |

Un Perfil que no supera alguno de estos criterios requiere revisión antes de compilarse como documento institucional.

---

## Hipótesis metodológicas abiertas

Las siguientes cuestiones no tienen todavía resolución normativa en este contrato. Mientras estén abiertas, la responsabilidad recae en el juicio del equipo técnico.

**H-LHPM-1 — Versiones del Perfil técnico según destinatario**
¿Qué versión del Perfil compilado —la lectura completa o una síntesis breve— se entrega de forma predeterminada a cada destinatario institucional? (La lectura es única y adaptativa, sin recuento obligatorio de capítulos; ver Fundamentos del Perfil único.) Esta decisión afecta al compilador y al ciclo de vida del artefacto.

**H-LHPM-2 — Umbral mínimo de participación ciudadana para compilación**
¿Qué nivel de participación es metodológicamente suficiente para que el Perfil pueda compilarse? ¿Basta con la priorización temática por cuestionario? ¿Es necesario que los grupos más vulnerables hayan tenido acceso representativo? Esta decisión determina si la participación es un requisito de calidad o un gate del compilador.

**H-LHPM-3 — Síntesis de activos comunitarios extensos**
Cuando el mapa de activos es extenso, ¿cómo se sintetizan en el documento? ¿Como tipología agregada, listado completo, selección según áreas de intervención emergentes o referencia a documento separado? Esta decisión afecta a la estructura del capítulo de interpretación territorial.

**H-LHPM-4 — Desagregación por sexo: obligatoria o recomendada**
Los instrumentos de COMPÁS producen datos individuales que permiten calcular indicadores por sexo. ¿Es la desagregación por sexo un requisito estructural del Perfil o una recomendación que el equipo técnico incorpora en los capítulos de autoría humana sin soporte estructurado del sistema?

**H-LHPM-5 — Posición de la ESCA en el cuerpo del Perfil**
¿Debe el Perfil declarar explícitamente qué actuaciones ESCA están activas en el municipio como dato de contexto del diagnóstico? ¿O esa información pertenece exclusivamente al capítulo de articulación institucional del Plan Local de Salud? Esta decisión determina el alcance del capítulo de marco estratégico del Perfil.

**H-LHPM-6 — Verificabilidad del contenido humano**
El compilador exige contenido no vacío en los capítulos de autoría humana. ¿Cómo distingue el sistema entre texto de autoría genuina y andamiaje mínimamente modificado? ¿Es esta distinción técnicamente verificable o recae íntegramente en la responsabilidad deontológica del equipo técnico?

---

## Invariantes

**I-LHPM-1 — Separación diagnóstico-planificación**

El Perfil nunca contiene compromisos de actuación, responsables de ejecución, plazos ni presupuesto. Si algún elemento de planificación aparece en el Perfil, viola este invariante independientemente de cómo esté formulado.

*Consecuencia si se viola:* la legitimidad epistémica del diagnóstico queda comprometida; el Plan Local de Salud que se derive del Perfil carece de base diagnóstica independiente.

*Fuente:* METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING PM-2, PM-13; CONTRACT-MIT-PSL PSL-C1.

---

**I-LHPM-2 — Trazabilidad completa de las afirmaciones**

Toda afirmación del Perfil que no sea una laguna declarada o una decisión posterior debe ser trazable hasta su evidencia de origen en el EvidenceStore o en el repositorio documental.

*Consecuencia si se viola:* el Perfil no puede auditarse como documento institucional; cualquier tercero puede impugnar sus afirmaciones sin posibilidad de refutación.

*Fuente:* METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING PM-19; CONTRACT-EVIDENCE §trazabilidad.

---

**I-LHPM-3 — Autoría humana en capítulos interpretativos**

Los capítulos de conclusiones y cierre interpretativo del Perfil solo pueden contener texto redactado por el equipo técnico. El andamiaje generado por el sistema no puede presentarse como contenido de autoría humana.

*Consecuencia si se viola:* el Perfil compilado no tiene autor técnico identificable; sus conclusiones carecen de responsabilidad institucional.

*Fuente:* METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING PM-20; CONTRACT-PSL-COMPAS PSL-P3-3; CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER G-LHC-2, G-LHC-3.

---

**I-LHPM-4 — Ausencia de prescripción automática**

El Perfil no prescribe prioridades, actuaciones ni líneas estratégicas de forma automática. Las candidaturas técnicas de intervención son propuestas metodológicamente informadas, nunca decisiones.

*Consecuencia si se viola:* la etapa de deliberación queda vaciada de contenido; las prioridades del Plan de Acción pueden ser el resultado de un algoritmo en lugar de un juicio informado.

*Fuente:* METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING PM-7, PM-20; CONTRACT-INTERPRETATION §1.1.

---

**I-LHPM-5 — Equilibrio activos-déficits**

El Perfil integra activos comunitarios con el mismo rango metodológico que los indicadores de necesidad. Un Perfil que solo diagnostica déficits viola este invariante.

*Consecuencia si se viola:* el Plan de Acción derivado del Perfil tenderá a diseñarse sobre carencias, ignorando las capacidades existentes del territorio que podrían potenciarse para mejorar la salud.

*Fuente:* METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING PM-4; BENCHMARK-INSTITUTIONAL-PRODUCTS §P2.

---

**I-LHPM-6 bis — Informe de Salud como fuente primaria no atomizable**

El Informe de Salud no se convierte en evidencia ordinaria del sistema. El Perfil lo referencia como fuente diagnóstica primaria pero no lo transforma en `EvidenceAtom`. Las secciones del Informe no alimentan el MIT como evidencia estructurada.

*Consecuencia si se viola:* el Informe de Salud pierde su estatuto como fuente oficial primaria; sus afirmaciones se mezclan en el pipeline analítico con evidencia de distinto rango, escala y metodología. La trazabilidad y la autoridad institucional del informe quedan comprometidas.

*Fuente:* CONTRACT-EVIDENCE §5.1 (D-HR-01 resuelta); CONTRACT-REPOSITORY §3; Gap Register H-15.

---

**I-LHPM-6 ter — Separación de limitaciones diagnósticas y áreas territoriales**

Las limitaciones diagnósticas —cautelas metodológicas, vacíos de información, ausencia de determinantes, base documental insuficiente— no pueden escalarse a áreas de intervención territorial ni a candidaturas para el proceso de priorización. Solo áreas con base en datos territoriales sustantivos pueden pasar al capítulo de intervención.

*Consecuencia si se viola:* el Perfil propone la priorización de huecos de información como si fueran problemas de salud del territorio; el Grupo Motor delibera sobre limitaciones metodológicas en lugar de sobre prioridades sanitarias.

*Fuente:* CODE (TerritorialInterpretationEngine — campo `limitacionesDiagnosticas`; OITEngine — campo `isAnalyticalGap`); Arts. 7 ter, 7 quater.

---

**I-LHPM-6 — Inmutabilidad del artefacto compilado**

El Perfil compilado como documento institucional es inmutable desde el momento de su compilación. Todo cambio en el diagnóstico requiere una nueva compilación con nueva versión y nueva validación. El artefacto anterior no se elimina.

*Consecuencia si se viola:* la trazabilidad institucional se pierde; no es posible saber qué diagnóstico sirvió de base para el plan aprobado por la corporación municipal.

*Fuente:* CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER §8; CONTRACT-PSL-COMPAS PSL-I4.

---

**I-LHPM-7 — Regla N+1**

El Informe de Salud por sí solo no constituye un Perfil de Salud Local. El Perfil requiere que el Informe se interprete junto a al menos una fuente adicional válida: Estudios Complementarios, activos y capacidades, o priorización ciudadana.

*Consecuencia si se viola:* el Perfil queda reducido a resumen o reetiquetado del Informe de Salud; no existe lectura territorial integrada.

*Fuente:* Art. 7 bis A.

---

**I-LHPM-8 — Modelo canónico único**

Pantalla, visor, impresión, DOCX y PDF son representaciones del mismo documento canónico. Ninguna representación puede producir una lectura diagnóstica diferente.

*Consecuencia si se viola:* COMPÁS NG genera perfiles paralelos y pierde la condición de fuente institucional trazable.

*Fuente:* Art. 17 bis.

---

**I-LHPM-9 — Frontera entre orientaciones y decisión**

El Perfil concluye y orienta; no decide. La priorización es del Grupo Motor y las actuaciones operativas (responsable, plazo, recurso, indicador) del Plan de Acción, que deben derivarse de las conclusiones y orientaciones del Perfil, y estas de la evidencia.

*Consecuencia si se viola:* el Perfil selecciona prioridades o fija actuaciones, o el Plan formula actuaciones sin base diagnóstica trazable.

*Fuente:* Art. 16 bis; CONTRACT-ACTION-PLAN.

---

**I-LHPM-10 — Dos salidas, una fuente de verdad**

La salida interpretativa COMPÁS y la salida comparativa breve tipo OHID/Fingertips son representaciones del mismo Perfil canónico. Ninguna puede constituir un segundo Perfil, un segundo catálogo de indicadores o una segunda fuente de verdad.

*Consecuencia si se viola:* COMPÁS NG vuelve a producir perfiles paralelos, con riesgo de contradicción entre lo que el diagnóstico interpreta y lo que la ficha comparativa sugiere.

*Fuente:* Arts. 17 bis y 17 ter; CONTRACT-NHS-HEALTH-PROFILE §0.

**I-LHPM-11 — Unidades derivadas del expediente**

El Perfil no contiene unidades de lectura que ninguna fuente del expediente sostenga, ni omite una unidad sostenida por una fuente. Dos municipios con expedientes distintos no producen el mismo conjunto de unidades por construcción.

*Consecuencia si se viola:* el Perfil vuelve a ser intercambiable entre municipios (Art. 4) y la ausencia de evidencia se presenta como lectura.

*Fuente:* Arts. 4 y 4 bis.

**I-LHPM-12 — Activos validados frente a candidatos**

Un recurso que no consta en Localiza Salud no se presenta como activo del Perfil ni se cuenta en la lectura. «Necesidad sin activo registrado» se refiere al mapa de Localiza y nunca se formula como inexistencia del recurso.

*Consecuencia si se viola:* un mapa sin validar pasa por evidencia, o una laguna del mapa se lee como ausencia de capacidad comunitaria.

*Fuente:* Arts. 9 y 9 bis.

---

**I-LHPM-13 — Relaciones con sustento declarado**

Toda relación entre determinante y problema declara fuente, año, escala y grado de sustento (Art. 8 bis). Ninguna se infiere por coincidencia de términos. Solo las de grado 1 y 2 sostienen una orientación.

*Consecuencia si se viola:* el Perfil presenta como relación lo que es una conjetura, o un valor externo sustituye al dato municipal.

**I-LHPM-14 — Conexión activo-determinante declarada**

La conexión entre un activo y un determinante la declara una persona del equipo técnico, con justificación, autoría y fecha. No altera las temáticas de Localiza Salud y no se infiere del texto del activo (Art. 9 ter).

*Consecuencia si se viola:* el Perfil atribuye a un activo una capacidad que nadie ha afirmado.

**I-LHPM-15 — Orientación con autoría y derivación**

Toda orientación técnica tiene autoría humana validada, cita las conclusiones de las que deriva y no fija responsable, plazo ni recurso (Art. 8, 16).

*Consecuencia si se viola:* el sistema emite como orientación del Perfil un texto que nadie ha validado, o el Perfil invade el Plan de Acción.

**I-LHPM-16 — Menú elegible, sin elección por defecto**

Toda conclusión y orientación del cuerpo del Perfil ha sido elegida por una persona del equipo técnico, con autoría y fecha. Ninguna propuesta se considera elegida por omisión y las descartadas se conservan en el registro (Art. 16 ter).

*Consecuencia si se viola:* el sistema publica como conclusión del Perfil lo que nadie ha asumido, o se pierde la traza de lo descartado.

**I-LHPM-17 — Afirmación tipada y con evidencia**

Toda afirmación del cuerpo del Perfil tiene tipo (Art. 8) y evidencia con localización, salvo la cautela y la laguna que remiten a otra afirmación. Cada paso de la cadena de lectura admite solo los tipos que le corresponden (Art. 8 ter).

*Consecuencia si se viola:* aparecen en el Perfil frases que no se pueden clasificar ni rastrear hasta su fuente.

**I-LHPM-18 — Conclusiones y orientaciones al final, en el mismo documento**

Las conclusiones y las orientaciones técnicas cierran el Perfil y no se presentan antes de la lectura integrada. La revisión se hace sobre el propio documento, no sobre una representación aparte (Art. 16 ter, 8).

*Consecuencia si se viola:* el lector encuentra las conclusiones sin la lectura que las sostiene, o la revisión opera sobre un texto que no es el del Perfil.

## Relaciones con otros contratos

| Contrato | Tipo de relación |
|---|---|
| `CONTRACT-MIT-PSL` | Este contrato establece los principios que el MIT debe respetar al producir la interpretación territorial. Los Arts. 5, 6 y 14 condicionan el diseño del motor. |
| `CONTRACT-PSL-COMPAS` | Define el producto institucional resultante de aplicar este contrato. Debe ser coherente en todos sus artículos con este contrato. |
| `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` | Los gates del compilador (G-LHC-1 a G-LHC-7) son la implementación técnica de los Arts. 16, 17 e I-LHPM-3. |
| `CONTRACT-SOURCE-CAPABILITY-MATRIX` | Define el estatuto operativo de cada fuente admisible: ruta de entrada, escala, atomización, madurez y efecto sobre la salida interpretativa y la salida comparativa breve. |
| `CONTRACT-NHS-HEALTH-PROFILE` §0 | La representación comparativa breve tipo OHID/Fingertips es una **salida derivada** del conocimiento territorial del Perfil canónico. Por los Fundamentos del Perfil único (2026-07-17) **deja de tener estatuto de producto institucional propio** y no puede ser segunda fuente de verdad; solo sobrevive dentro del Perfil, previa validación. Los Arts. 12, 13, 17 bis y 17 ter condicionan sus criterios de generación. |
| `CONTRACT-INTERPRETATION` | Define qué significa interpretar dentro de COMPÁS NG. Este contrato es complementario: define qué tipos de afirmación son admisibles y cuáles no (Art. 8). |
| `CONTRACT-STRATEGIC-REPOSITORY` | Las líneas estratégicas de los marcos institucionales son referencia para el capítulo de marco estratégico del Perfil (Arts. 15.1 y 15.4). La articulación con esos marcos es posterior al Perfil. |
| `METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING` | Documento fundacional del que derivan los principios PM-1 a PM-24. Los invariantes de este contrato son aplicación normativa directa de esos principios. |

---

## Registro de revisiones

| Fecha | Versión | Cambio | Responsable |
|---|---|---|---|
| 2026-07-03 | 1.0 | Creación inicial | COMPÁS NG Sprint 2 |
| 2026-07-14 | 1.1 | Saneamiento de gobernanza: regla N+1, priorización ciudadana como evidencia, cadena del conocimiento, modelo canónico único y autoría humana acotada | COMPÁS NG gobernanza |
| 2026-09-24 | 1.2 | Localiza Salud queda fijada como fuente principal/preferente para activos del Perfil, con otras fuentes como apoyo contextual o pendiente de reconciliación | COMPÁS NG |
| 2026-10-21 | 1.3 | Unidades de lectura derivadas del expediente (Art. 4 bis), estatuto de activos candidatos frente a Localiza y patrones de cruce (Art. 9 bis); invariantes I-LHPM-11 e I-LHPM-12. Decisión del autor | COMPÁS NG |
| 2026-10-21 | 1.4 | El Perfil concluye y orienta; no decide (Art. 3, 7 quater, 16, 16 bis, I-LHPM-9). Nuevo tipo de afirmación «Orientación técnica» (Art. 8). Relaciones determinante-problema con sustento y grados (Art. 8 bis). Conexión determinante-activo declarada y transición déficit-salutogénesis (Art. 9 ter). Invariantes I-LHPM-13 a 15. Decisión del autor | COMPÁS NG |
| 2026-10-21 | 1.5 | Conclusiones y orientaciones como menú elegible por el equipo técnico: propuesta, elección o descarte con autoría y fecha, solo las elegidas entran en el cuerpo; sin elección por defecto (Art. 16 ter, I-LHPM-16). Decisión del autor | COMPÁS NG |
| 2026-10-22 | 1.6 | Propuestas redactadas por el equipo técnico en el cierre interpretativo, con evidencia citada, sin elección por defecto (Art. 16 ter 1 bis). Decisión del autor | COMPÁS NG |
| 2026-10-22 | 1.7 | La afirmación como unidad y la cadena de lectura en cinco pasos (Art. 8 ter); ejes de lectura declarados (Art. 4 ter); interpretaciones e hipótesis en el menú, ubicación final de conclusiones y orientaciones y modo de revisión sobre el mismo documento (Art. 16 ter, 7 y 8). Invariantes I-LHPM-17 e I-LHPM-18. Decisión del autor | COMPÁS NG |

---

*Este contrato es el documento normativo que antecede y condiciona a CONTRACT-MIT-PSL,*
*CONTRACT-PSL-COMPAS y CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.*
*Todo contrato de producto que afecte al Perfil de Salud Local debe ser coherente con este contrato.*
