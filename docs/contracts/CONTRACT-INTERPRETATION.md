# COMPÁS NG — Contrato de Interpretación Territorial

> Documento normativo permanente.
> Define qué significa interpretar dentro de COMPÁS NG, qué constituye
> una interpretación válida, qué nunca lo constituye, y qué papel
> desempeñan el sistema y las personas en el proceso interpretativo.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-27

---

## Preámbulo

La interpretación es la operación más crítica de COMPÁS NG.

Es el momento en que los datos dejan de ser registros y se convierten en
lectura territorial. Es también el momento de mayor riesgo: donde la
automatización puede crear la ilusión de conocimiento sin la sustancia del
criterio profesional.

Este contrato establece los principios y los límites que gobiernan la
interpretación en COMPÁS NG. No los límites de lo que el sistema puede
calcular, sino los límites de lo que el sistema puede pretender saber.

---

## 1. Naturaleza de la interpretación en COMPÁS NG

### 1.1 Qué es interpretar dentro de COMPÁS NG

Interpretar es organizar, clasificar y relacionar evidencia disponible para
producir una lectura coherente y trazable del estado de salud territorial
de un municipio.

La interpretación en COMPÁS NG:

- organiza la evidencia por tipo semántico (determinantes, activos,
  indicadores, hallazgos participativos, cautelas metodológicas);
- identifica tensiones entre fuentes;
- señala áreas donde la evidencia sugiere posibilidades de intervención;
- sintetiza la lectura en un Perfil de Salud Local revisable y validable.

La interpretación en COMPÁS NG **nunca**:

- concluye cuáles son los problemas definitivos del municipio;
- establece causalidad entre determinantes y resultados de salud;
- decide qué intervenciones deben realizarse;
- prioriza automáticamente sin deliberación humana explícita;
- genera compromisos institucionales o actuaciones municipales.

### 1.2 Quién interpreta

La interpretación en COMPÁS NG tiene dos actores:

**El sistema** (MIT, Reconciliación): organiza y clasifica la evidencia,
detecta patrones y tensiones, y genera lecturas preliminares estructuradas.
Su output siempre lleva `requiresHumanValidation: true`. Siempre.

**El equipo técnico y la comunidad**: valida, revisa, enriquece y convierte
las lecturas preliminares en conocimiento territorial con valor institucional.
Sin esta validación, ninguna interpretación del sistema puede utilizarse para
fundamentar decisiones.

---

## 2. Capas del conocimiento en COMPÁS NG

Las siguientes capas son distintas y no deben mezclarse. Cada una tiene
sus propios actores, sus propias garantías y sus propias restricciones.

### Capa 1 — Documento

**Qué es**: el documento original preservado en el Repositorio Documental
Municipal (Informe de Salud, exportaciones REDCap, activos comunitarios,
estudios complementarios, documentación territorial).

**Quién lo genera**: el equipo de salud pública, el sistema de captura
(REDCap), los organismos productores del documento.

**Garantías**: es la fuente de verdad. No es modificado ni sustituido
por ningún motor de COMPÁS NG. Se preserva íntegramente.

**Restricciones**: el sistema no puede generar, modificar ni sustituir
documentos. Solo los registra, referencia y procesa.

### Capa 2 — Evidencia

**Qué es**: representación estructurada de contenidos del documento fuente,
en formato de `EvidenceAtom`. Incluye tipo semántico, contenido, confianza,
trazabilidad al documento de origen y marca de validación humana requerida.

**Quién la genera**: los parsers y pipelines de extracción de COMPÁS NG
(Nivel 1: parsers de Informe de Salud, estudios complementarios, activos).

**Garantías**: toda evidencia referencia el documento que la originó.
No hay evidencia sin documento. No hay documento modificado por la evidencia.

**Restricciones**: la evidencia no contiene interpretación. Un `EvidenceAtom`
describe lo que el documento contiene, no lo que significa para el municipio.
Los motores del Nivel 2 leen la evidencia; no la producen ni la modifican.

### Capa 3 — Interpretación

**Qué es**: lectura estructurada del conjunto de evidencia disponible,
producida por el MIT y la Reconciliación. Incluye la clasificación por tipo
semántico (LT1), las áreas de intervención derivadas (OIT), las tensiones
detectadas, los conflictos entre fuentes y los marcos interpretativos aplicados.

**Quién la genera**: el Motor de Interpretación Territorial (MIT) y el
Motor de Reconciliación Interpretativa, sobre el `EvidenceStore` saneado.

**Garantías**: la interpretación siempre lleva `requiresHumanValidation: true`.
No establece causalidad. No produce rankings. No prioriza.

**Restricciones**: la interpretación no modifica la evidencia ni los
documentos. No genera propuestas de actuación. No puede presentarse como
diagnóstico validado sin validación técnica explícita.

### Capa 4 — Hipótesis

**Qué es**: formulación explícita, trazable y revisable que relaciona
patrones observados de salud con determinantes estructurales plausibles.

**Quién la genera**: en la versión actual, el sistema no genera hipótesis
formales. Las hipótesis son el producto de la deliberación técnica del equipo
a partir de la lectura interpretativa. En una fase futura, la Inferencia
Estructural Territorial podrá asistir en su formulación; nunca las producirá
de forma autónoma.

**Garantías**: toda hipótesis debe expresar explícitamente su nivel de
plausibilidad, la evidencia que la apoya, la evidencia que la contradice
y la evidencia que falta.

**Restricciones**: una hipótesis nunca es una conclusión. Una hipótesis
formulada por el sistema es una propuesta asistida para la deliberación
técnica, no un posicionamiento del equipo.

### Capa 5 — Deliberación

**Qué es**: el proceso de revisión, debate y consenso entre el equipo
técnico, la comunidad y las instituciones sobre las prioridades, los objetivos
y las actuaciones del Plan Local de Salud.

**Quién la realiza**: siempre personas. El sistema puede facilitar la
deliberación (mostrando candidaturas técnicas, preferencias ciudadanas,
tensiones no resueltas), pero no la realiza ni la sustituye.

**Garantías**: el sistema COMPÁS NG nunca puede documentar un consenso
en nombre del equipo. Solo el equipo puede documentarlo (`consensoDocumentado`
en el capítulo VII del PSL). La deliberación es un acto humano irrenunciable.

**Restricciones**: ninguna propuesta del sistema puede presentarse como
el resultado de una deliberación. Las candidaturas técnicas son propuestas
asistidas, no decisiones deliberadas.

### Capa 6 — Decisión institucional

**Qué es**: el acto mediante el cual el equipo técnico y las instituciones
competentes adoptan compromisos formales: la prioridad municipal, el Plan
de Acción, el Plan Local de Salud aprobado.

**Quién la toma**: siempre personas con responsabilidad institucional.
COMPÁS NG puede generar borradores técnicos orientativos. Nunca adopta
decisiones institucionales de forma autónoma.

**Garantías**: todo output del sistema marcado como borrador o propuesta
técnica no constituye decisión hasta que el equipo responsable lo valide
y apruebe mediante un acto explícito.

**Restricciones**: ningún motor de COMPÁS NG puede declarar una decisión
institucional. Los campos `status: "validated"` y `status: "approved"` del
PSL son asignados por personas, no por el sistema.

---

## 3. El Motor de Interpretación Territorial (MIT)

### 3.1 Objetivo

El MIT transforma el `EvidenceStore` saneado en una lectura territorial
estructurada, versionada y trazable.

No es un motor de diagnóstico. No es un sistema de recomendación.
Es un organizador asistido de evidencia territorial.

### 3.2 Entradas

El MIT acepta exclusivamente un `EvidenceStore` ya saneado por el
`EvidenceStoreIntegrityGuard`. No procesa documentos directamente. No
accede al repositorio. No consulta fuentes externas.

### 3.3 Salidas

El MIT produce un `EstadoTerritorialEvolutivo` que incluye:

- Dimensión diagnóstica (LT1): evidencia clasificada por tipo semántico.
- Áreas de Intervención Territorial (OIT): candidaturas heurísticas.
- Dimensión longitudinal: presencia y nota sobre evidencia evolutiva.
- Tensiones estructurales: contradicciones detectadas entre fuentes.
- Marcos interpretativos aplicados: conteo de elementos por marco.

Todas las salidas del MIT llevan `requiresHumanValidation: true`.
Este campo no puede tomar ningún otro valor.

### 3.4 Restricciones del MIT

El MIT **no puede**:

- afirmar causalidad entre determinantes y resultados de salud;
- establecer rankings de gravedad o urgencia;
- producir recomendaciones de actuación;
- resolver conflictos entre fuentes;
- modificar el `EvidenceStore` ni los documentos fuente;
- operar sobre información que no esté en el `EvidenceStore` saneado.

### 3.5 Determinismo

La misma versión del `EvidenceStore` (mismo `updatedAt`) produce
siempre el mismo `EstadoTerritorialEvolutivo`. El MIT es determinista
e idempotente. Dos ejecuciones sobre el mismo store producen resultados
idénticos.

---

## 4. El Perfil de Salud Local como síntesis interpretativa

### 4.1 Papel del PSL

El Perfil de Salud Local (PSL) es el objeto canónico que sintetiza la
interpretación territorial. Es el único puente autorizado entre el
análisis territorial (Nivel 2) y la capa de decisión y planificación
(Nivel 3).

No es el Informe de Salud. No es el Plan Local de Salud compilado.
Es una síntesis analítica validable que organiza el análisis en
capítulos estructurados, referencia los documentos fuente sin contenerlos,
y tiene un ciclo de vida explícito con transiciones auditables.

### 4.2 Estado del PSL y naturaleza interpretativa

| Estado | Significado interpretativo |
|---|---|
| `generated` | Borrador automático del sistema. Propuesta asistida. No implica revisión técnica. |
| `validated` | Revisado y aceptado por el equipo técnico como base de planificación. |
| `approved` | Aprobado institucionalmente con deliberación documentada. |

Un PSL en estado `generated` no es interpretación validada. Es la propuesta
del sistema para que el equipo la revise.

### 4.3 Capítulos según su naturaleza interpretativa

| Capítulo | Naturaleza | Actor principal |
|---|---|---|
| I — Marco Estratégico | Referencia normativa | Sistema (contenido fijo) |
| II — Informe de Salud | Referencia documental | Sistema (referencia al documento) |
| III — Diagnóstico integrado | Evidencia organizada | Sistema (desde EvidenceStore) |
| IV — Interpretación territorial | Lectura asistida | Sistema (MIT + Reconciliación) |
| V — Conclusiones | Propuesta asistida → autoría humana | Equipo técnico |
| VI — Recomendaciones | Propuesta asistida → autoría humana | Equipo técnico |
| VII — Priorización | Candidaturas + deliberación | Equipo técnico + ciudadanía |

Los capítulos V, VI y VII no pueden considerarse validados hasta que
el equipo técnico haya redactado o revisado su contenido de forma explícita.

---

## 5. El papel de la inteligencia artificial

### 5.1 Papel asistencial

La inteligencia artificial en COMPÁS NG tiene un papel exclusivamente
asistencial. Puede ayudar a:

- organizar y clasificar evidencia;
- detectar patrones y tensiones entre fuentes;
- sintetizar lecturas preliminares;
- generar borradores técnicos orientativos;
- explicar los razonamientos del sistema de forma transparente.

La IA no puede:

- adoptar decisiones institucionales;
- validar automáticamente un PSL;
- resolver deliberaciones en nombre del equipo;
- producir compromisos municipales;
- sustituir el criterio profesional de los técnicos de salud pública.

### 5.2 Explicabilidad

Todo output asistido por IA en COMPÁS NG debe ser explicable. Esto significa:

- trazable: se puede identificar qué evidencia lo fundamenta;
- revisable: el equipo técnico puede modificarlo o rechazarlo;
- transparente: el sistema señala siempre cuándo un contenido es una
  propuesta asistida y no una conclusión validada.

El sistema nunca presentará un output de IA como conocimiento consolidado.
Toda propuesta de IA lleva indicación explícita de su naturaleza provisional.

### 5.3 Verificabilidad

Los outputs del sistema son verificables:

- Los `EvidenceAtom` incluyen `provenance.documentId`, `provenance.origin`
  y `provenance.sourceLabel`, que permiten rastrear su origen.
- Las lecturas territoriales son regenerables desde el mismo `EvidenceStore`.
- El PSL referencia los IDs de átomos y documentos, no los duplica.

Si un output no puede verificarse trazando su origen en los documentos
del repositorio, no puede utilizarse como base de planificación.

### 5.4 Validación humana: invariante absoluto

`requiresHumanValidation: true` es un invariante tipado en todos los outputs
interpretativos del sistema. No puede eliminarse. No puede tomar otro valor.
No existe excepción a este invariante.

Este campo no es un aviso opcional: es la formalización en código del principio
de que el sistema asiste pero no decide.

---

## 6. Lo que nunca constituye interpretación válida

Las siguientes afirmaciones **nunca** pueden ser outputs válidos de COMPÁS NG:

- "El principal problema de salud de {municipio} es X."
- "X causa Y en este municipio."
- "Se recomienda implementar Z."
- "La prioridad número 1 del Plan Local es X."
- "El municipio debe actuar sobre X antes que sobre Y."
- "Este municipio tiene un nivel de salud {calificativo}."
- "La ciudadanía ha decidido que X es prioritario."
- "El equipo técnico concluye que X."

Cualquier frase de este tipo que aparezca en el sistema es una propuesta
asistida que requiere revisión humana. Nunca una conclusión del sistema.

---

## 7. Inferencia Estructural Territorial — Marco para investigación futura

### 7.1 Definición

Una Inferencia Estructural Territorial es una formulación explícita,
trazable y revisable que relaciona patrones observados de salud con
determinantes sociales, demográficos, comunitarios, ambientales,
conductuales o institucionales estructuralmente plausibles.

No es un diagnóstico. No es causalidad. Es una hipótesis estructural
formulada de forma asistida para ser revisada por el equipo técnico.

### 7.2 Estado actual

La Inferencia Estructural Territorial es una **línea de investigación
metodológica futura**. No está implementada en el sistema actual.

El contrato de reserva está en:
```
docs/contracts/CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE.md
```

Ningún componente de COMPÁS NG puede implementar inferencia estructural
territorial hasta que ese contrato deje de estar en estado de investigación
metodológica y se apruebe una implementación específica.

### 7.3 Relación con el MIT

Cuando la Inferencia Estructural Territorial se implemente, formará parte
del proceso interpretativo del MIT, añadiendo una capa adicional entre la
clasificación de evidencia (LT1) y las áreas de intervención (OIT). No
sustituirá a ninguna de estas capas; las enriquecerá.

### 7.4 Relación con el PSL

Las hipótesis estructurales formalizadas formarán parte del Capítulo IV
del PSL, como subcapa de la interpretación territorial. Nunca sustituirán
los Capítulos V, VI o VII, que requieren autoría humana.

### 7.5 Condiciones previas a cualquier implementación

Antes de implementar cualquier componente de Inferencia Estructural Territorial:

1. Revisar bibliografía en epidemiología social, determinantes sociales
   de la salud, epidemiología espacial, modelos causales e inferencia bayesiana.
2. Definir criterios formales de plausibilidad que no dependan de correlación
   estadística simple.
3. Establecer mecanismos de explainability verificables por el equipo técnico.
4. Documentar el método completo en el contrato correspondiente antes de
   escribir ningún código.

---

## 8. Invariantes

**I-INT-1 — La interpretación siempre está marcada como provisional**

Todo output interpretativo del sistema lleva `requiresHumanValidation: true`.
Este invariante no tiene excepciones. No puede relajarse para ningún tipo
de output, independientemente de la cantidad de evidencia disponible.

**I-INT-2 — La interpretación no establece causalidad**

El sistema puede detectar correlaciones o patrones en la evidencia disponible.
No puede afirmar que A causa B en un municipio concreto. La causalidad en
epidemiología social requiere diseño metodológico específico que COMPÁS NG
no implementa.

**I-INT-3 — Los conflictos interpretativos nunca se resuelven automáticamente**

`ConflictoInterpretativo.resolucion` es siempre `"no-resuelta"`. El sistema
detecta conflictos; no los resuelve. La resolución es responsabilidad del
equipo técnico.

**I-INT-4 — La deliberación no puede ser generada por el sistema**

El capítulo VII del PSL incluye una sección de deliberación (`deliberacionNota`,
`consensoDocumentado`). El sistema proporciona el marco y la estructura; el
equipo técnico documenta el consenso. El sistema nunca puede establecer
`consensoDocumentado: true` por sí mismo.

**I-INT-5 — El PSL en `generated` no es interpretación validada**

Un PSL en estado `generated` es una propuesta asistida del sistema. No puede
utilizarse como base de planificación municipal hasta que el equipo técnico lo
valide mediante un acto explícito (`validated`).

**I-INT-6 — La interpretación territorial no sustituye al Informe de Salud**

El MIT opera sobre `EvidenceAtom` derivados del Informe de Salud. Su lectura
interpreta y organiza; nunca sustituye ni resume el Informe de Salud original.
El documento fuente permanece íntegro e independiente de cualquier lectura
interpretativa.

---

## 9. Relación con otros contratos

| Contrato | Relación |
|---|---|
| `CONTRACT-EVIDENCE.md` | Define los `EvidenceAtom` que son las entradas del MIT |
| `CONTRACT-MIT-PSL.md` (histórico; doctrina vigente del Perfil: `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`) | Formalizaba el MIT, la Reconciliación y el PSL como objetos de dominio |
| `CONTRACT-ACTION-PLAN.md` | Define los motores del Nivel 3 que consumen el PSL (capa de deliberación y decisión) |
| `CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE.md` | Reserva arquitectónica para la futura Inferencia Estructural Territorial |
| `ARCHITECTURE-CONSTITUTION.md` | Arts. 5, 6 y 9 establecen los principios de separación y transparencia que fundamentan este contrato |
| `FOUNDATIONS.md` | §9 define las restricciones de generación automática |
| `CONTRACT-PMO.md` | Extiende a nivel operativo de sesión el papel asistencial de la IA definido en §5 de este contrato |

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-27 | Primera redacción. Establece la gramática completa del proceso interpretativo: capas, restricciones, papel del MIT y del PSL, papel de la IA, marco para la futura Inferencia Estructural Territorial e invariantes. |
