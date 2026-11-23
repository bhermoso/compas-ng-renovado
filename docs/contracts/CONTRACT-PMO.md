# COMPÁS NG — Contrato del Prompt Maestro Operativo

> Documento normativo permanente.
> Define la naturaleza, el contenido obligatorio, las reglas de uso y los invariantes
> del Prompt Maestro Operativo (PMO) de COMPÁS NG.
> El PMO es el instrumento oficial mediante el cual cualquier asistente de IA inicia,
> contextualiza y delimita una sesión de trabajo sobre el proyecto.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-29

---

## Preámbulo

COMPÁS NG es un sistema con gobierno arquitectónico explícito. Sus decisiones están
formalizadas en una Constitución Arquitectónica, una Constitución Operativa, un Blueprint
de producción y un registro de contratos. Ninguna sesión de trabajo debería comenzar
sin que esos instrumentos estén activos como contexto.

Los asistentes de IA que colaboran en COMPÁS NG no tienen memoria persistente entre
sesiones. Cada sesión comienza en frío. Sin un mecanismo de inicialización formal, el
asistente opera sobre su conocimiento de entrenamiento —que puede estar desactualizado,
incompleto o en contradicción con el estado real del repositorio— o sobre resúmenes
conversacionales que no tienen rango de fuente de verdad.

El Prompt Maestro Operativo (PMO) es la respuesta institucional a este problema.

El PMO no es un prompt conversacional. Es un instrumento de gobierno que convierte
la inicialización de una sesión de IA en un acto arquitectónicamente trazable,
reproducible y coherente con el sistema de gobierno del proyecto.

Este contrato establece las reglas que gobiernan cualquier PMO de COMPÁS NG.
No contiene ni un PMO concreto ni instrucciones de implementación.
Contiene exclusivamente las reglas que cualquier PMO debe respetar.

---

## 1. Naturaleza del PMO

### 1.1 Qué es el PMO

El PMO es un documento de inicialización de sesión que tiene rango de instrumento
de gobierno dentro de COMPÁS NG.

El PMO:

- establece el contexto institucional de la sesión antes de que comience cualquier trabajo;
- identifica los documentos de gobierno que el asistente debe leer o tener activos;
- delimita el alcance de la sesión y sus restricciones;
- especifica el nivel de capacidad del modelo requerido para la tarea;
- declara explícitamente qué está permitido y qué está prohibido en la sesión.

El PMO es el equivalente operativo de una orden de trabajo con contexto arquitectónico:
no solo dice qué debe hacerse, sino desde qué sistema de conocimiento debe hacerse.

### 1.2 Qué no es el PMO

El PMO **no es**:

- un resumen del proyecto para el asistente (los documentos de gobierno son la fuente de verdad);
- un historial de conversaciones anteriores;
- una descripción de lo que la IA "ya sabe" sobre el proyecto;
- una lista de tareas pendientes;
- un sustituto de la lectura de los contratos relevantes;
- una autorización para actuar fuera de los límites del sistema de gobierno;
- un instrumento exclusivo de ningún proveedor de IA ni de ningún modelo concreto.

### 1.3 Posición en el sistema de gobierno

El PMO es un instrumento de **capa operativa**. Se sitúa por debajo de la Constitución
Arquitectónica, la Constitución Operativa y el Blueprint, y está coordinado con los
contratos del dominio. No puede contradecir ninguno de estos instrumentos. Cuando existe
contradicción entre un PMO concreto y un contrato vigente, el contrato prevalece.

```
Constitución Arquitectónica (principios permanentes)
    ↓
Constitución Operativa (reglas de proceso)
    ↓
Blueprint de Producción (plano completo del sistema)
    ↓
Contratos de dominio (comportamientos garantizados por componente)
    ↓
CONTRACT-PMO (reglas que gobiernan los PMOs)
    ↓
PMO concreto (instrumento de inicialización de sesión)
    ↓
Sesión de trabajo con asistente de IA
```

---

## 2. Finalidad

El PMO tiene tres finalidades institucionales:

**Finalidad 1 — Coherencia de contexto.**
Garantizar que el asistente trabaja sobre el estado real del proyecto, derivado de
los documentos de gobierno canónicos, y no sobre su conocimiento de entrenamiento,
sobre resúmenes externos ni sobre recuerdos de sesiones anteriores.

**Finalidad 2 — Delimitación del rol.**
Establecer explícitamente qué puede y qué no puede hacer el asistente en la sesión,
en coherencia con el Artículo 7 de la Constitución Operativa y con el papel asistencial
definido en `CONTRACT-INTERPRETATION §5`.

**Finalidad 3 — Trazabilidad del trabajo.**
Hacer que el trabajo de cualquier sesión sea atribuible a un estado documental concreto
del proyecto, de forma que pueda auditarse si el asistente operó dentro del sistema
de gobierno o lo violó.

---

## 3. Alcance

### 3.1 Lo que el PMO gobierna

- La inicialización de cualquier sesión de trabajo de un asistente de IA sobre COMPÁS NG.
- La selección del nivel de modelo adecuado para la tarea de la sesión.
- El conjunto de documentos de gobierno que deben estar activos antes de que comience el trabajo.
- Las restricciones operativas que el asistente debe respetar durante la sesión.
- El alcance declarado de la sesión (qué se puede y qué no se puede hacer en ella).

### 3.2 Lo que el PMO no gobierna

- Los contenidos metodológicos del proyecto (eso lo gobiernan los contratos y el Blueprint).
- Las decisiones arquitectónicas (eso lo gobierna la Constitución Arquitectónica).
- Las decisiones de implementación (eso lo gobiernan los contratos de dominio).
- La aprobación de cambios al repositorio (eso lo gobierna la Constitución Operativa §7-8).
- El trabajo humano del equipo técnico fuera de las sesiones con IA.

---

## 4. Fuente única de verdad

El PMO se construye exclusivamente a partir de los documentos de gobierno del repositorio
canónico de COMPÁS NG.

**La jerarquía de fuentes, en orden de autoridad:**

| Nivel | Fuente | Ruta canónica |
|---|---|---|
| 1 | Constitución Arquitectónica | `ARCHITECTURE-CONSTITUTION.md` |
| 2 | Constitución Operativa | `docs/architecture/OPERATING-CONSTITUTION.md` |
| 3 | Blueprint de Producción | `docs/architecture/BLUEPRINT-PRODUCTION.md` |
| 4 | Expediente de Certificación | `docs/historico/certification/CERTIFICATION-SPRINT-0-1.md` |
| 5 | Contratos de dominio | `docs/contracts/CONTRACT-*.md` |
| 6 | Fundamentos metodológicos | `docs/methodology/METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING.md` |
| 7 | Registro de gaps | `docs/architecture/ARCHITECTURAL-GAP-REGISTER.md` |

**Lo que nunca puede ser fuente de verdad para un PMO:**

- el conocimiento de entrenamiento del asistente sobre el proyecto;
- resúmenes producidos en sesiones anteriores;
- conversaciones previas o historial de mensajes;
- documentación de repositorios distintos al canónico;
- la memoria del responsable del proyecto transmitida conversacionalmente sin referencia documental.

---

## 5. Reglas de regeneración

El PMO debe regenerarse cuando se produce cualquiera de las siguientes condiciones:

**Condición R-1 — Actualización de documentos de gobierno.**
Cuando se modifica la Constitución Arquitectónica, la Constitución Operativa, el Blueprint
o cualquier contrato referenciado en el PMO vigente. El PMO obsoleto no puede usarse para
sesiones que afecten a los componentes gobernados por los documentos modificados.

**Condición R-2 — Cambio de fase de sprint.**
Al inicio de cada nuevo sprint. El cambio de sprint implica nuevos componentes, nuevos
contratos y nuevas restricciones que el PMO anterior puede no contemplar.

**Condición R-3 — Incorporación de nuevos contratos.**
Cuando se crea un contrato nuevo que afecta al alcance de trabajo habitual de las sesiones.

**Condición R-4 — Detección de violación de contrato en sesión anterior.**
Si una sesión con un PMO produjo outputs que violaron un contrato, el PMO debe revisarse
para identificar y corregir la ambigüedad o laguna que permitió la violación.

**Condición R-5 — Cambio en la política de modelos.**
Cuando cambian las capacidades de los modelos disponibles o las tareas típicas del proyecto
requieren una reclasificación del nivel de modelo recomendado.

**El PMO obsoleto debe marcarse explícitamente como tal.** Un PMO sin fecha de revisión
posterior a la última actualización de los documentos de gobierno que referencia se
considera potencialmente desactualizado y debe verificarse antes de usarse.

---

## 6. Contenido mínimo obligatorio

Todo PMO de COMPÁS NG debe contener, sin excepción, los siguientes elementos:

### 6.1 Encabezado institucional

- Identificador del PMO (código único: PMO-YYYY-MM-DD o PMO-SPRINT-N).
- Fecha de emisión.
- Sprint al que pertenece.
- Nivel de modelo recomendado (véase §7).
- Ruta canónica del repositorio de trabajo.

### 6.2 Declaración de fuentes activas

Lista explícita de los documentos de gobierno que el asistente debe leer o tener
activos antes de comenzar la sesión. La lista debe incluir al menos:

- La Constitución Operativa.
- El Blueprint de Producción.
- El Expediente de Certificación del sprint más reciente.
- Los contratos relevantes para el alcance de la sesión.

El asistente no puede declarar que "conoce" estos documentos sin haberlos leído
en la sesión actual o en la conversación vigente. El conocimiento de entrenamiento
no sustituye la lectura de los documentos canónicos.

### 6.3 Declaración de rol

Especificación explícita del rol del asistente en la sesión, coherente con los
roles permitidos por la Constitución Operativa §7.

Los roles posibles son:

| Rol | Descripción |
|---|---|
| `AUDITOR` | Lee, analiza y emite dictamen. No modifica el repositorio. |
| `IMPLEMENTADOR` | Propone y ejecuta cambios mínimos sobre instrucción explícita. |
| `ARQUITECTO` | Diseña instrumentos de gobierno, contratos o estructuras. No implementa. |
| `VERIFICADOR` | Ejecuta tests, comprobaciones y valida el estado del repositorio. |
| `CONSULTOR` | Responde preguntas sobre el sistema. No produce cambios. |

Un PMO puede combinar roles solo si los roles son compatibles y la compatibilidad
se declara explícitamente con sus restricciones.

### 6.4 Declaración de alcance

- Qué puede hacerse en la sesión.
- Qué no puede hacerse en la sesión, aunque el asistente lo proponga.
- Qué componentes del sistema están en alcance.
- Qué componentes están explícitamente fuera de alcance.

### 6.5 Restricciones operativas activas

Lista de restricciones adicionales para la sesión, derivadas del estado del proyecto:

- Componentes congelados que no pueden modificarse.
- Contratos que no pueden alterarse en esta sesión.
- Gates que deben respetarse.
- Deuda conocida que no debe resolverse en esta sesión.

### 6.6 Protocolo de cierre

Descripción de cómo debe cerrar el asistente la sesión:

- Qué debe producir como output final.
- Si debe proponer un commit o esperar instrucción explícita.
- Si debe producir documentación del trabajo realizado.
- Si debe actualizar el Registro de Gaps u otros instrumentos de gobierno.

---

## 7. Política de modelos

### 7.1 Clasificación de niveles de capacidad

El PMO debe especificar el nivel de capacidad requerido para la sesión. Los niveles
son agnósticos respecto al proveedor y al modelo concreto; describen capacidades
funcionales que el responsable del proyecto debe mapear a los modelos disponibles.

| Nivel | Etiqueta | Capacidades requeridas | Tareas típicas en COMPÁS NG |
|---|---|---|---|
| 1 | **BAJO** | Comprensión de instrucciones simples. Generación de texto estructurado. | Consultas factuales, generación de boilerplate, formateo de documentos. |
| 2 | **MEDIO** | Razonamiento sobre código y documentos. Detección de inconsistencias locales. | Lectura y explicación de contratos, propuesta de correcciones puntuales, generación de tests. |
| 3 | **ALTO** | Razonamiento arquitectónico. Síntesis de múltiples documentos. Coherencia entre contratos. | Diseño de nuevos componentes, auditorías parciales, redacción de contratos, propuesta de implementaciones. |
| 4 | **MAX** | Razonamiento profundo sobre sistemas complejos. Auditoría exhaustiva. Detección de contradicciones entre instrumentos de gobierno. | Auditorías de consolidación, certificaciones de sprint, diseño de instrumentos de gobierno, análisis de impacto cruzado. |
| 5 | **PENSAMIENTO** | Razonamiento extendido con exploración explícita de alternativas. Deliberación sobre decisiones con múltiples tradeoffs. | Resolución de contradicciones arquitectónicas abiertas, diseño de nuevos paradigmas, decisiones con impacto permanente sobre el gobierno del proyecto. |

### 7.2 Reglas de selección del nivel

**Regla M-1.** El nivel mínimo para cualquier sesión que modifique un contrato vigente
es **ALTO**. No se puede modificar un contrato con un modelo de nivel BAJO o MEDIO.

**Regla M-2.** El nivel mínimo para cualquier sesión de auditoría de consolidación
o certificación de sprint es **MAX**. Una auditoría producida con modelo de nivel
inferior no tiene validez certificatoria.

**Regla M-3.** El nivel mínimo para resolver una contradicción entre la Constitución
y un contrato, o entre dos contratos, es **PENSAMIENTO**. La resolución de
contradicciones constitucionales no puede delegarse a modelos de menor capacidad.

**Regla M-4.** Ninguna sesión puede operar con un nivel inferior al recomendado
en el PMO. El nivel puede aumentarse, nunca reducirse durante la sesión.

**Regla M-5.** El PMO debe justificar el nivel seleccionado cuando sea MAX o PENSAMIENTO.
La justificación debe referenciar el tipo de tarea y el riesgo de error.

### 7.3 Restricciones por nivel

| Nivel | Puede modificar contratos | Puede auditar | Puede implementar | Puede certificar |
|---|---|---|---|---|
| BAJO | No | No | No | No |
| MEDIO | No | Parcial (alcance declarado) | Sí (instrucción explícita) | No |
| ALTO | Sí (bajo instrucción) | Sí | Sí | No |
| MAX | Sí | Sí (exhaustiva) | Sí | Sí (con revisión humana) |
| PENSAMIENTO | Sí | Sí (con deliberación explícita) | Sí | Sí (con revisión humana) |

---

## 8. Relación con el sistema de gobierno

### 8.1 Subordinación a la Constitución

El PMO no puede contradecir ningún artículo de la Constitución Arquitectónica ni
ninguna regla de la Constitución Operativa. Si un PMO concreto parece contradecirlas,
prevalece la Constitución y el PMO debe revisarse.

El PMO no puede ampliar los permisos del asistente más allá de lo que la
Constitución Operativa §7 establece como rol asistencial.

### 8.2 Coherencia con el Blueprint

El PMO debe declarar explícitamente en qué parte del Blueprint se sitúa el trabajo
de la sesión. No puede iniciarse trabajo en componentes que no existen en el Blueprint
sin proponer primero la actualización del Blueprint mediante el proceso de gobierno
establecido.

### 8.3 Relación con los contratos de dominio

El PMO puede restringir el alcance de los contratos que el asistente puede leer,
modificar o referenciar. No puede ampliar el alcance de un contrato ni crear
compromisos contractuales no ratificados por el responsable del proyecto.

Los contratos vigentes (estado `VIGENTE` en `CONTRACT-INDEX`) solo pueden modificarse
si el PMO lo autoriza explícitamente y la modificación sigue el proceso de
`OPERATING-CONSTITUTION §7-8`.

### 8.4 Relación con el Registro de Gaps

El PMO puede instruir al asistente para actualizar el Registro de Gaps al cierre
de la sesión. Sin esa instrucción explícita, el asistente no puede modificar el
Registro de Gaps unilateralmente.

---

## 9. Protocolo de invocación

### 9.1 La palabra "PMO" como disparador oficial

La palabra `PMO` escrita como mensaje o en el primer turno de una sesión con un
asistente de IA es el disparador oficial del protocolo de inicialización de sesión
en COMPÁS NG.

Cualquier asistente de IA que reciba `PMO` como input en el contexto de trabajo
sobre COMPÁS NG debe interpretar esta señal como instrucción de ejecutar el
protocolo de inicialización descrito en §9.2.

La palabra `PMO` puede ir acompañada de:

- La ruta al PMO concreto que debe cargarse (`PMO: ruta/al/archivo.md`).
- El identificador del PMO que debe usarse (`PMO: PMO-2026-06-29`).
- Sin argumento, en cuyo caso el asistente debe solicitar la ruta o el identificador.

### 9.2 Comportamiento obligatorio del asistente al recibir PMO

Al recibir la señal `PMO`, el asistente debe ejecutar en este orden:

**Paso 1 — Confirmación de recepción.**
Confirmar que ha recibido la señal PMO y que va a ejecutar el protocolo de
inicialización. No comenzar ningún trabajo sustantivo hasta completar todos los pasos.

**Paso 2 — Lectura del PMO.**
Leer el PMO indicado (o solicitar su ruta si no fue especificada). Si el PMO no
existe o no está accesible, informar al responsable y detenerse.

**Paso 3 — Verificación de vigencia.**
Verificar que el PMO está vigente comparando su fecha de emisión con las fechas de
última revisión de los documentos de gobierno que referencia. Si detecta que el PMO
puede estar desactualizado, informar al responsable antes de continuar.

**Paso 4 — Lectura de documentos de gobierno declarados.**
Leer los documentos de gobierno listados en §6.2 del PMO. La lectura debe ser del
repositorio canónico, no de la memoria del asistente.

**Paso 5 — Confirmación de contexto.**
Declarar explícitamente:
- el rol que va a desempeñar en la sesión;
- el alcance declarado;
- las restricciones operativas activas;
- el nivel de modelo con el que opera;
- los documentos leídos y su fecha de última revisión.

**Paso 6 — Solicitud de instrucción.**
Solo tras completar los pasos anteriores, solicitar al responsable la primera
instrucción de trabajo de la sesión.

### 9.3 Lo que el asistente no puede hacer al recibir PMO

- Asumir que "ya conoce" el estado del proyecto sin leer los documentos declarados.
- Comenzar a trabajar antes de completar el paso 5.
- Declarar el contexto a partir de su conocimiento de entrenamiento.
- Modificar el PMO durante la sesión sin instrucción explícita del responsable.
- Reducir el alcance declarado en el PMO sin autorización del responsable.
- Ignorar restricciones operativas declaradas aunque la tarea solicitada parezca trivial.

---

## 10. Compatibilidad con diferentes IAs

### 10.1 Principio de neutralidad

El PMO debe ser interpretable por cualquier asistente de IA capaz de:

- leer documentos en formato Markdown;
- acceder a rutas del sistema de archivos o a URLs de repositorio;
- seguir instrucciones secuenciales estructuradas;
- mantener restricciones operativas durante la sesión.

El PMO no puede contener sintaxis, formatos de sistema o instrucciones que solo
sean interpretables por un proveedor o modelo concreto.

### 10.2 Prohibiciones de contenido específico de proveedor

El PMO **no puede contener**:

- instrucciones en formato de "system prompt" específicas de un proveedor;
- referencias a nombres de modelos concretos como única opción;
- sintaxis de herramientas propietarias de un proveedor;
- comportamientos que solo puedan ejecutarse en una interfaz concreta.

Si una capacidad solo está disponible en un proveedor concreto, debe documentarse
como requisito de capacidad funcional (§7) y no como nombre de producto.

### 10.3 Comportamiento esperado ante capacidades variables

Los asistentes tienen diferentes capacidades de contexto, herramientas y acceso
al sistema de archivos. El PMO debe especificar qué capacidades son obligatorias
para la sesión y qué debe hacer el asistente si no dispone de alguna de ellas:

- Si no puede leer ficheros del sistema: solicitar al responsable que pegue el
  contenido de los documentos de gobierno en la conversación.
- Si no tiene acceso a herramientas de búsqueda: indicarlo explícitamente y
  trabajar solo con el contexto proporcionado.
- Si su ventana de contexto es insuficiente para los documentos declarados: informar
  al responsable y acordar qué documentos priorizar.

En ningún caso el asistente puede comenzar a trabajar fingiendo tener capacidades
que no posee o asumiendo que "probablemente" conoce el contenido de un documento
que no ha podido leer.

---

## 11. Criterios de validación del PMO

Un PMO concreto es válido si y solo si cumple todos los siguientes criterios:

**V-1.** Tiene identificador único, fecha de emisión y sprint de referencia.

**V-2.** Declara el nivel de modelo requerido y la justificación cuando es MAX o PENSAMIENTO.

**V-3.** Lista explícitamente los documentos de gobierno que el asistente debe leer.
La lista incluye al menos la Constitución Operativa, el Blueprint y el Expediente
de Certificación más reciente.

**V-4.** Declara el rol del asistente y verifica que ese rol es compatible con
la Constitución Operativa §7.

**V-5.** El alcance declarado es coherente con el Blueprint: no instruye a trabajar
en componentes que no existen o que están en estado `FUTURO` sin el gate correspondiente.

**V-6.** No contradice ningún contrato vigente. Si existe contradicción aparente, el
PMO incluye una nota de aclaración que resuelve la contradicción antes de la sesión.

**V-7.** No contiene sintaxis específica de proveedor. Es interpretable por cualquier
asistente con las capacidades funcionales declaradas.

**V-8.** Contiene un protocolo de cierre con las instrucciones de entrega final de la sesión.

Un PMO que no cumple alguno de estos criterios debe revisarse antes de usarse.
El asistente que detecte que el PMO que recibe no cumple algún criterio debe
informar al responsable antes de iniciar la sesión.

---

## 12. Criterios de actualización de este contrato

Este contrato debe revisarse cuando se produzca cualquiera de las siguientes condiciones:

**A-1.** La Constitución Operativa §7 (papel de la IA) se modifica.

**A-2.** Se añaden nuevos roles para asistentes de IA en el proyecto que no están
contemplados en §6.3.

**A-3.** Los niveles de capacidad de los modelos disponibles cambian significativamente
y la clasificación de §7 ya no refleja la realidad operativa.

**A-4.** Se detectan sistemáticamente violaciones de contrato que el protocolo de
inicialización vigente no previene.

**A-5.** El proyecto incorpora asistentes de IA con capacidades radicalmente distintas
(por ejemplo, con memoria persistente, con acceso autónomo al repositorio o con
capacidad de ejecución autónoma de commits).

---

## 13. Invariantes

**I-PMO-1 — El PMO nunca es fuente de conocimiento técnico.**

El PMO establece el contexto de la sesión. No describe la arquitectura del sistema,
no resume contratos y no reemplaza la lectura de los documentos de gobierno. Si el
PMO contiene descripciones técnicas, esas descripciones son redundantes en el mejor
caso y peligrosamente desactualizadas en el peor.

**I-PMO-2 — El PMO nunca sustituye los documentos de gobierno.**

Ningún PMO puede declarar que "el sistema funciona así" sin referencia a un documento
de gobierno que lo sostenga. El PMO apunta a los documentos; los documentos contienen
la verdad. El PMO no es la verdad.

**I-PMO-3 — El nivel de modelo no puede reducirse durante una sesión.**

Si el PMO especifica nivel MAX, la sesión debe realizarse con un modelo de nivel MAX
desde el inicio hasta el final. El asistente no puede comenzar con MAX y continuar
con ALTO porque "la tarea resultó ser más simple". El nivel se determina por la tarea
más exigente de la sesión, no por la tarea en curso.

**I-PMO-4 — El protocolo de inicialización no puede saltarse ni abreviarse.**

No existe excepción al protocolo de §9.2. Incluso en sesiones urgentes, incluso
cuando el responsable indica que "ya conoce el estado del proyecto", el asistente
debe completar los cinco pasos antes de comenzar a trabajar. Una sesión iniciada
sin protocolo completo no tiene trazabilidad institucional.

**I-PMO-5 — El asistente no puede ampliar el alcance declarado sin autorización.**

Si durante la sesión emerge trabajo que está fuera del alcance declarado en el PMO,
el asistente debe informar al responsable y solicitar autorización explícita antes
de proceder. No puede ampliar el alcance unilateralmente aunque el trabajo parezca
necesario o beneficioso.

**I-PMO-6 — El PMO nunca autoriza acciones que la Constitución prohíbe.**

Ninguna instrucción en un PMO puede autorizar al asistente a hacer commits sin
revisión humana, modificar contratos sin proceso de aprobación, introducir
infraestructura nueva sin justificación demostrada, o superar gates de forma
automática. Si un PMO parece autorizar algo que la Constitución Operativa §7.2
prohíbe, el asistente debe notificarlo y detenerse.

**I-PMO-7 — Un PMO desactualizado es un PMO inválido.**

Un PMO que referencia documentos de gobierno en versiones anteriores a las vigentes
no puede usarse para sesiones que afecten a los componentes gobernados por esos
documentos. La antigüedad del PMO no lo hace "aproximadamente correcto": lo hace
potencialmente incorrecto en los puntos que han evolucionado.

---

## 14. Riesgos que el PMO evita

**R-PMO-1 — Sesión basada en conocimiento de entrenamiento obsoleto.**
Sin PMO, el asistente puede responder sobre COMPÁS NG desde su conocimiento de
entrenamiento, que no refleja el estado real del repositorio. El PMO obliga a leer
los documentos canónicos al inicio de cada sesión.

**R-PMO-2 — Contradicción entre sesiones.**
Sin PMO, dos sesiones realizadas con diferentes asistentes o en momentos distintos
pueden producir outputs contradictorios porque parten de contextos diferentes. El PMO
establece el contexto de forma reproducible.

**R-PMO-3 — Trabajo fuera del sistema de gobierno.**
Sin PMO, el asistente puede proponer soluciones que son técnicamente correctas pero
que violan contratos, ignoran gates o contradicen la Constitución. El PMO establece
las restricciones antes de que comience el trabajo.

**R-PMO-4 — Modelo inadecuado para la tarea.**
Sin política de modelos, el responsable puede usar un modelo de nivel BAJO para una
tarea de auditoría arquitectónica, obteniendo resultados superficiales o incorrectos.
El PMO especifica el nivel mínimo requerido y lo justifica.

**R-PMO-5 — Pérdida de trazabilidad del trabajo de IA.**
Sin PMO, no existe registro de en qué estado documental se basó la sesión. El PMO
hace que cada sesión sea atribuible a un snapshot documentado del sistema de gobierno.

**R-PMO-6 — Dependencia de proveedor.**
Sin criterios de neutralidad, el proyecto puede desarrollar dependencia de las
características propietarias de un proveedor de IA. El PMO garantiza que los
instrumentos de sesión son portables entre proveedores.

**R-PMO-7 — Alcance implícito no declarado.**
Sin PMO, el asistente puede asumir que "todo el proyecto está en alcance" y realizar
cambios en componentes que estaban fuera del objetivo de la sesión. El PMO declara
explícitamente qué está y qué no está en alcance.

---

## 15. Antipatrones

Los siguientes son antipatrones del PMO: formas de construir un PMO que parecen
correctas pero que violan el espíritu o la letra de este contrato.

**AP-1 — El PMO como resumen del proyecto.**
Un PMO que describe en prosa el estado del proyecto, la arquitectura o los
componentes existentes. Este antipatrón hace que el PMO se desactualice con cada
cambio y convierte el PMO en una fuente de verdad paralela que compite con los
documentos de gobierno. El PMO debe apuntar a los documentos, no resumirlos.

**AP-2 — El PMO como lista de tareas.**
Un PMO que enumera lo que debe hacerse en la sesión antes de establecer el contexto.
El trabajo sin contexto arquitectónico activo es el problema que el PMO resuelve. Un
PMO que comienza por el trabajo antes que por el contexto no cumple su función.

**AP-3 — El PMO con instrucciones de proveedor embebidas.**
Un PMO que usa sintaxis de system prompt, funciones de herramienta propietarias o
comportamientos específicos de una interfaz concreta. Hace el PMO inutilizable en
otros asistentes y crea dependencia de proveedor.

**AP-4 — El PMO atemporal.**
Un PMO sin fecha, sin referencia al sprint actual, sin identificador. Un PMO que podría
usarse para "cualquier sesión" no establece el contexto concreto que hace trazable el
trabajo. La atemporal dad es una forma de desresponsabilización.

**AP-5 — El PMO que amplía permisos.**
Un PMO que contiene frases como "el asistente puede actuar con autonomía", "no es
necesario pedir confirmación antes de modificar", "puedes hacer commits directamente".
Estas instrucciones violan la Constitución Operativa §7.2 y el PMO no tiene autoridad
para relajar invariantes constitucionales.

**AP-6 — El PMO que declara el contexto desde la memoria del responsable.**
Un PMO construido en conversación, donde el responsable va transmitiendo oralmente
lo que "él recuerda" sobre el estado del proyecto, en lugar de apuntar a los
documentos de gobierno. El conocimiento tácito del responsable no es fuente de
verdad para el PMO.

**AP-7 — El PMO sin protocolo de cierre.**
Un PMO que establece el inicio de la sesión pero no define cómo debe terminar.
Sin protocolo de cierre, el trabajo producido puede quedar sin integrar en el
sistema de gobierno, sin registro en el Registro de Gaps y sin propuesta de
actualización de contratos si fuera necesario.

**AP-8 — El PMO de nivel único para todas las tareas.**
Un PMO que usa siempre el mismo nivel de modelo, sin distinguir entre tareas de
consulta (BAJO), implementación (MEDIO o ALTO) y auditoría constitucional (MAX o
PENSAMIENTO). La homogeneización del nivel es un indicador de que el PMO no refleja
la naturaleza real de las tareas.

---

## 16. Relación con otros contratos

| Contrato | Relación |
|---|---|
| `ARCHITECTURE-CONSTITUTION.md` | Establece los principios que el PMO no puede contradecir. Arts. 1, 5, 9 y 13 son especialmente relevantes. |
| `OPERATING-CONSTITUTION.md` | §7 (papel de la IA), §8 (auditoría de cambios) y §6 (anti-sobreingeniería) definen los límites del asistente en cualquier sesión. |
| `BLUEPRINT-PRODUCTION.md` | El alcance declarado en cualquier PMO debe poder mapearse al Blueprint. El PMO no puede apuntar a componentes que no existen en el Blueprint. |
| `CONTRACT-INTERPRETATION.md` | Formaliza el papel asistencial de la IA, que el PMO extiende a nivel operativo de sesión. |
| `CONTRACT-INDEX.md` | El estado de los contratos en el índice determina qué puede modificarse en cada sesión. |
| `ARCHITECTURAL-GAP-REGISTER.md` | El PMO puede instruir al asistente para actualizar el registro al cierre. El asistente no puede modificarlo sin esta instrucción. |

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-29 | Primera redacción. Establece el PMO como instrumento oficial de gobierno, su jerarquía en el sistema documental, el protocolo de invocación, la política de modelos por nivel de capacidad, los invariantes, los riesgos que evita y los antipatrones a evitar. Instrumento agnóstico de proveedor y de modelo. |
