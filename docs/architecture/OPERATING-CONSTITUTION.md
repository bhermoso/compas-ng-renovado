# COMPÁS NG — Constitución Operativa

> Documento normativo permanente.
> Establece las reglas de proceso, los criterios de aceptación y los mecanismos
> de control que gobiernan la evolución de COMPÁS NG.
> Complementa `ARCHITECTURE-CONSTITUTION.md`, que fija los principios de diseño.
> Este documento fija las reglas de trabajo.
> No debe modificarse sin deliberación explícita del equipo responsable.
> Última revisión: 2026-06-27

---

## Preámbulo

COMPÁS NG es una plataforma de apoyo a la planificación local de salud.
Su arquitectura y su proceso de desarrollo están bajo la misma exigencia:
**rigor, determinismo y mínima complejidad necesaria**.

Este documento establece:

- la arquitectura canónica del sistema en tres niveles;
- el pipeline oficial y sus restricciones de flujo;
- el objetivo en curso (Sprint 0, Gate 1);
- los criterios que determinan si el sistema puede avanzar;
- las reglas que gobiernan cómo se introducen cambios;
- el papel de los asistentes de IA en el proceso de desarrollo.

---

## 1. Arquitectura canónica

COMPÁS NG opera en tres niveles. Cada nivel tiene responsabilidades
exclusivas y no puede consumir directamente los outputs de un nivel
que no sea el inmediatamente anterior.

```
Nivel 1 — Preservación y evidencia
  │
  │   Repositorio Documental Municipal
  │   → EvidenceStore (EvidenceAtom[])
  │   → IntegrityGuard (saneamiento de la evidencia)
  │
  ▼
Nivel 2 — Interpretación territorial
  │
  │   Motor de Interpretación Territorial (MIT)
  │   → Estado Territorial Evolutivo (ETE)
  │   → Motor de Reconciliación Interpretativa
  │   → Perfil de Salud Local (PSL)  ← único puente al Nivel 3
  │
  ▼
Nivel 3 — Decisión y planificación
  │
  │   Priorización técnica
  │   → Encaje estratégico EPVSA
  │   → Plan de Acción (borrador técnico)
  │   → Agenda
  │   → Seguimiento
```

### 1.1 Restricciones de flujo entre niveles

- **Ningún motor del Nivel 3** puede consumir directamente outputs del MIT
  ni del EvidenceStore. El **PSL validado** es el único objeto autorizado
  a cruzar la frontera Nivel 2 → Nivel 3.

- **El MIT y los motores del Nivel 2** no modifican el Repositorio Documental
  ni los documentos del Nivel 1. Solo leen el EvidenceStore saneado.

- **La evidencia no contiene interpretación**. Los `EvidenceAtom` son
  representaciones estructuradas de documentos, no conclusiones del sistema.

- **La interpretación no contiene decisiones**. El PSL es una propuesta técnica
  que requiere validación humana antes de alimentar el Nivel 3.

### 1.2 Fuentes de documentos del Nivel 1

| Tipo de fuente | `kind` canónico | Canonicidad |
|---|---|---|
| Informe de Salud | `health-report` | Por `kind` (uno por municipio) |
| Activos Comunitarios | `community-asset` | Por `kind` (uno por municipio) |
| IBSE (REDCap) | `redcap-export` + tag `"ibse"` | Por `tag` (uno por municipio) |
| Priorización Temática (REDCap) | `redcap-export` + tag `"thematic-prioritisation"` | Por `tag` (uno por municipio) |
| Estudios EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE) | `complementary-study` + tag propio | Acumulable por tag |
| Documentación territorial, material cualitativo, otros | tipo propio | Acumulable |

---

## 2. Pipeline oficial

El pipeline analítico de COMPÁS NG es determinista y tiene un único punto
de entrada (EvidenceStore saneado) y un único puente autorizado al Nivel 3 (PSL).

```
EvidenceStore
  → IntegrityGuard.sanitizedStore
    → MIT → ETE
      → Motor de Reconciliación
        → PSL (generado o validado)
          → Priorización técnica
            → EPVSA
              → Plan de Acción
                → Agenda
                  → Seguimiento
```

El pipeline es **de solo lectura**: ninguna etapa escribe en las etapas anteriores.

Los resultados del MIT, la Reconciliación, el PSL no validado, el Plan de Acción,
la Agenda y el Seguimiento **no se persisten en localStorage**. Se recalculan en
cada sesión a partir del EvidenceStore persisitido. Solo el **PSL validado** por el
equipo técnico se persiste como excepción deliberada.

---

## 3. Separación entre evidencia, interpretación y decisión

Esta separación es un invariante arquitectónico. No puede relajarse.

| Capa | Qué es | Quién la genera | Quién la valida |
|---|---|---|---|
| **Evidencia** | Contenido de documentos en formato estructurado | Parsers, pipelines de extracción | Trazabilidad al documento fuente |
| **Interpretación** | Lectura territorial del conjunto de evidencia | MIT, Reconciliación, PSL | El equipo técnico mediante validación explícita |
| **Decisión** | Actos de priorización, planificación y compromiso institucional | Los profesionales de salud pública | El proceso institucional, nunca el sistema |

El sistema puede sugerir. No puede decidir.

Toda propuesta del sistema lleva `requiresHumanValidation: true`. Esta marca
no es opcional ni puede eliminarse.

---

## 4. Sprint 0 — Cerrado (certificado 2026-06-28)

**El Sprint 0 está arquitectónicamente certificado. Todos los criterios del Gate 1 (§5)
fueron superados sin excepción. El desarrollo de motores está autorizado desde el cierre
de este sprint.**

Ver expediente de certificación completo: `docs/historico/certification/CERTIFICATION-SPRINT-0-1.md`.

El Sprint 0 cerró la deuda técnica acumulada y garantizó que la plataforma
existente funciona de forma completamente determinista, habilitando la incorporación del
Motor de Interpretación Territorial, el PSL, el Plan de Acción, la Agenda,
el Seguimiento y el Compilador como objetos productivos.

### 4.1 Alcance del Sprint 0

Los seis bloques que debe cerrar el Sprint 0:

**Bloque A — Repositorio Documental** *(alta, media y baja prioridad)*
- Ciclo de vida completo: alta, sustitución, eliminación, persistencia, restauración.
- Deduplicación de tipos canónicos.
- Migraciones y rehidratación en localStorage.
- Ningún estado imposible.
- Toda evidencia referencia un documento existente.

**Bloque B — Estudios Complementarios**
- Los seis estudios (IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS)
  siguen exactamente el mismo contrato de ciclo de vida.
- Sin excepciones. Sin estudios "especiales".
- UI: estado, fichero, registros, cargar, sustituir, eliminar. Todo visible.

**Bloque C — EvidenceStore**
- `documentId` siempre válido.
- `municipalityId` correcto.
- Sin huérfanos.
- Sin duplicados.
- Limpieza de estados heredados.

**Bloque D — Persistencia**
- Flujo `vacío → carga → recarga → municipio → vuelta → estado idéntico`.

**Bloque E — UX institucional**
- Apariencia de producto institucional consolidado.
- Sin badges pastel, sin sensación de prototipo.
- Jerarquía documental clara y coherente.

**Bloque F — Terminología**
- Un único nombre para cada concepto.
- Sin duplicidades entre contratos, documentación y UI.

---

## 5. Gate 1 — Criterio de paso a motores

El Gate 1 es la condición de cierre del Sprint 0 y la condición de apertura
del desarrollo de motores. No puede superarse parcialmente.

### 5.1 Criterios de aceptación

El Gate 1 se considera superado cuando todas las siguientes afirmaciones son
verdaderas sin excepción:

1. **El Repositorio Documental es completamente determinista.**
   No existe ningún estado imposible conocido. Todo ciclo de vida de documento
   (alta, sustitución, eliminación, persistencia, restauración) funciona correctamente
   para todos los tipos documentales sin excepción.

2. **Los seis Estudios Complementarios siguen exactamente el mismo contrato.**
   IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS y CAGE-EAS tienen el mismo
   ciclo de vida, el mismo patrón de UI y la misma integración con el Repositorio y
   el EvidenceStore. No existen estudios "especiales".

3. **Toda evidencia tiene documento.**
   Todo `EvidenceAtom` en el EvidenceStore activo tiene un `provenance.documentId`
   que apunta a un documento existente en el Repositorio del mismo municipio.
   No existen átomos huérfanos.

4. **Toda carga genera exactamente el mismo ciclo de vida.**
   Cargar un estudio complementario siempre produce: (a) un documento en el repositorio,
   (b) un estudio interpretado en el workspace, (c) los EvidenceAtom correspondientes
   con `documentId` correcto, (d) persistencia inmediata en localStorage.

5. **La persistencia resiste cualquier recarga.**
   El workspace cargado tras un cierre y reapertura del navegador es idéntico
   al workspace guardado. Ningún campo se pierde, ningún estudio desaparece,
   ningún átomo queda huérfano.

6. **La interfaz parece un producto institucional consolidado.**
   Sin badges pastel, sin tarjetas innecesarias, sin sensación de prototipo.
   Los paneles de Repositorio Documental, Estudios Complementarios, EvidenceStore
   e Inventario pertenecen visualmente al mismo producto.

7. **No quedan estados imposibles conocidos.**
   Los estados listados en la auditoría del Sprint 0 están todos resueltos o
   documentados como riesgos aceptados con justificación explícita.

8. **La plataforma está preparada para soportar los motores sin aumentar deuda.**
   Añadir el MIT, el PSL o cualquier motor del Nivel 3 no requiere refactorizar
   nada del Nivel 1. El contrato de interfaz entre niveles es claro y estable.

### 5.2 Criterios de rechazo

El Gate 1 **no puede superarse** si alguna de las siguientes condiciones es verdadera:

- Existe un átomo huérfano conocido (sin `documentId` válido) que no está
  cubierto por el mecanismo de reparación en `loadWorkspaceFromLocalStorage`.
- Un estudio complementario tiene un ciclo de vida diferente al resto sin
  justificación técnica documentada en el contrato.
- El Repositorio puede quedar en estado inconsistente mediante una secuencia
  de operaciones reproducible.
- La persistencia pierde datos en algún escenario de recarga documentado.
- Cualquier prueba obligatoria del Bloque G (Tests, §4.1) falla.

---

## 6. Criterio anti-sobreingeniería

Antes de introducir cualquier cambio en COMPÁS NG, deben responderse estas
preguntas. Si alguna respuesta es negativa, el cambio no debe realizarse:

1. ¿Resuelve un fallo observado, una incoherencia demostrada o una mejora
   objetiva de robustez en el Sprint 0?

2. ¿Está acotado al bloque afectado, sin refactorizaciones colaterales?

3. ¿La solución más sencilla que resuelve el problema ya ha sido descartada
   explícitamente, con motivo documentado?

4. ¿El cambio es reversible?

5. ¿Puede verificarse su corrección con los tests existentes o con un nuevo
   test mínimo?

Si la intervención no supera este filtro, debe rechazarse aunque sea
"mejora de código" o "refactorización de calidad". La deuda técnica de COMPÁS NG
se reduce resolviendo fallos reales, no reorganizando código que funciona.

---

## 7. Papel de la IA en el proceso de desarrollo

La inteligencia artificial (Claude, Codex u otros asistentes) actúa en COMPÁS NG
en **rol exclusivamente asistencial**. Sus outputs son propuestas técnicas, nunca decisiones.

### 7.1 Lo que la IA puede hacer

- Leer, auditar y describir el estado del repositorio y la documentación.
- Proponer implementaciones concretas de cambios solicitados.
- Detectar contradicciones entre contratos y código.
- Generar tests y verificaciones.
- Producir borradores de documentación técnica.

### 7.2 Lo que la IA no puede hacer

- Aprobar sus propios cambios ni saltarse el proceso de auditoría.
- Modificar contratos arquitectónicos sin instrucción explícita del responsable.
- Introducir infraestructura nueva sin justificación demostrada.
- Hacer commits sin que el responsable haya auditado el diff completo.
- Superar Gate 1 sin verificación humana de todos los criterios de §5.1.

### 7.3 Proceso de aprobación de cambios de IA

Todo cambio propuesto por un asistente de IA debe seguir este proceso:

```
1. AUDITORÍA PREVIA
   La IA entrega un análisis del estado actual antes de modificar nada.

2. PROPUESTA MÍNIMA
   La IA propone exactamente el cambio mínimo que resuelve el problema.

3. DIFF CLARO
   El diff es legible, acotado y no incluye cambios colaterales.

4. VERIFICACIÓN
   npm test, npm run build y tests de integración relevantes pasan.

5. REVISIÓN HUMANA
   El responsable lee el diff antes de hacer commit.

6. COMMIT EXPLÍCITO
   El commit lo hace el responsable, con mensaje que explica el porqué.
```

Un asistente de IA que proponga cambios sin seguir este proceso, que incluya
refactorizaciones no solicitadas en un diff, o que haga commit sin instrucción
explícita, está violando el contrato operativo de COMPÁS NG.

---

## 8. Auditoría obligatoria de cambios

Todo cambio en COMPÁS NG debe ser:

| Requisito | Descripción |
|---|---|
| **Mínimo** | Acotado al bloque afectado. Sin refactorizaciones no solicitadas |
| **Auditable** | El diff es claro, comprensible y no incluye cambios colaterales |
| **Verificado** | `npm test` y `npm run build` pasan antes de considerar el cambio completo |
| **Trazable** | El commit explica el porqué, no el qué |
| **Reversible** | Puede deshacerse sin afectar a otras partes del sistema |

Estos requisitos se aplican sin excepción a todos los cambios, sean producidos
por un desarrollador humano o por un asistente de IA.

---

## 9. Trazabilidad extremo a extremo

COMPÁS NG garantiza trazabilidad completa desde el documento fuente hasta cada
unidad de evidencia que alimenta los motores analíticos.

```
Documento original (sourceFileName, createdAt)
  → MunicipalDocument (id, kind, tags, source.system)
    → EvidenceAtom (provenance.documentId, provenance.origin, provenance.sourceLabel)
      → EvidenceStore (atoms[])
        → IntegrityGuard (sanitizedStore)
          → MIT / ETE
```

Los invariantes de trazabilidad son:

- **T-1**: Todo `EvidenceAtom` tiene un `provenance.documentId` que apunta
  a un `MunicipalDocument` existente en el Repositorio del mismo municipio.

- **T-2**: Al eliminar un `MunicipalDocument`, todos sus átomos derivados
  desaparecen del `EvidenceStore` antes de que el workspace se persista.

- **T-3**: La rehidratación detecta y elimina cualquier átomo cuyo
  `provenance.documentId` ya no existe en el Repositorio.

- **T-4**: Ningún motor del Nivel 2 ni del Nivel 3 produce un `EvidenceAtom`.
  Los átomos solo los producen los parsers y pipelines del Nivel 1.

- **T-5**: El `municipalityId` de un átomo nunca puede diferir del
  `municipalityId` del workspace al que pertenece.

---

## 10. Documentos relacionados

Este documento es parte del sistema documental de COMPÁS NG. Los contratos
complementarios son:

| Documento | Ubicación | Cubre |
|---|---|---|
| Constitución Arquitectónica | `ARCHITECTURE-CONSTITUTION.md` | Principios de diseño permanentes (Arts. 1–14) |
| Fundamentos Arquitectónicos | `FOUNDATIONS.md` | Capas, repositorio, trazabilidad, tipos canónicos |
| Modelo de Dominio | `DOMAIN-MODEL.md` | Lenguaje ubicuo, conceptos y relaciones |
| Contrato Visual | `VISUAL-CONTRACT.md` | Identidad institucional y principios visuales |
| Contrato del Repositorio | `docs/contracts/CONTRACT-REPOSITORY.md` | Ciclo de vida documental, invariantes, operaciones |
| Contrato de Estudios Complementarios | `docs/contracts/CONTRACT-COMPLEMENTARY-STUDIES.md` | Instrumentos, taxonomía, patrón de implementación |
| Contrato de Evidencia | `docs/contracts/CONTRACT-EVIDENCE.md` | EvidenceAtom, EvidenceStore, IntegrityGuard |
| Contrato de Persistencia | `docs/contracts/CONTRACT-PERSISTENCE.md` | localStorage, rehidratación, migraciones, esquema |
| Contrato MIT-PSL | `docs/contracts/CONTRACT-MIT-PSL.md` | Motor de Interpretación Territorial y PSL |
| Contrato del Plan de Acción | `docs/contracts/CONTRACT-ACTION-PLAN.md` | Plan de Acción, Agenda, Seguimiento |
| Contrato del Compiler | `docs/contracts/CONTRACT-COMPILER.md` | Compilador del Plan Local de Salud |
| **Contrato de Interpretación** | `docs/contracts/CONTRACT-INTERPRETATION.md` | Naturaleza y límites de la interpretación territorial, capas del conocimiento, papel de la IA |
| Contrato de Inferencia Estructural | `docs/contracts/CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE.md` | Marco para investigación futura; bloquea implementación durante Sprint 0 |
| Contrato del Prompt Maestro Operativo | `docs/contracts/CONTRACT-PMO.md` | Inicialización de sesiones de trabajo con asistentes de IA; política de modelos; protocolo de invocación |
| Hoja de Ruta (histórica) | `docs/historico/ROADMAP.md` | Hitos pasados y próximos |

---

*Primera versión: 2026-06-27 — Creado en Sprint 0 para formalizar criterios
de Gate 1, proceso de aprobación de IA y reglas operativas del proyecto.*
*Revisado: 2026-06-27 — Cierre Sprint 0: añadido CONTRACT-INTERPRETATION y referencia a CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE.*
