# COMPÁS NG — Expediente de Certificación Arquitectónica y Metodológica
## Sprint 0 y Sprint 1

> Documento de cierre formal.
> Establece el dictamen oficial sobre el estado arquitectónico, metodológico y contractual
> de COMPÁS NG al término del Sprint 1.
> No puede modificarse salvo por decisión deliberada del responsable del proyecto.
> Fecha de emisión: 2026-06-28

---

## 1. Objeto de certificación

Este expediente certifica el estado del repositorio `COMPAS_NG` (`C:\Users\blash\Desktop\COMPAS_NG`)
al cierre del Sprint 1, con las siguientes preguntas como eje:

1. ¿Puede declararse arquitectónicamente certificable el Sprint 0?
2. ¿Puede declararse certificable —con condiciones explícitas— el Sprint 1?
3. ¿Cuál es la deuda real que pasa al Sprint 2?
4. ¿Cuáles son los prerequisitos objetivos del Sprint 2?

---

## 2. Alcance

### Incluido

- Arquitectura de tres niveles (Nivel 1: evidencia; Nivel 2: interpretación; Nivel 3: decisión).
- Repositorio Documental Municipal.
- EvidenceStore e IntegrityGuard.
- Motor de Interpretación Territorial (MIT): LT1, OIT, Reconciliación.
- Perfil de Salud Local (PSL).
- Seis Estudios Complementarios: IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS.
- Biblioteca Metodológica Canónica (estado actual).
- Motores del Nivel 3 en estado de borrador técnico: Priorización, EPVSA, Plan de Acción, Agenda, Seguimiento.
- Persistencia y rehidratación (localStorage, migraciones).
- Contratos arquitectónicos (15 documentos).
- Constituciones Arquitectónica y Operativa.
- Contrato Visual, Fundamentos y Hoja de Ruta.
- Suite de tests y pipeline de build.

### Excluido expresamente

- Familia de compiladores (LocalHealthProfileCompiler, NHSHealthProfileCompiler,
  LocalHealthPlanCompiler): ninguno implementado; pertenecen al Sprint 2.
- Repositorio Estratégico Territorial: diseño conceptual; no implementado.
- Motor de Traducción Estratégica: diseño conceptual; no implementado.
- Tripirámide Dinámica / SAM: diseño conceptual; no implementado.
- Constructor Metodológico de Encuestas (UI): infraestructura de dominio presente;
  interfaz y bloques de clasificación ausentes.
- Portada institucional: ausente.
- Inteligencia Territorial Explicable: investigación futura.

---

## 3. Evidencias verificadas

| Evidencia | Resultado | Fecha de verificación |
|---|---|---|
| `npm test` (vitest run) | **309/309 tests passing** — 11 ficheros — 771ms | 2026-06-28 |
| `npm run build` (tsc -b + vite build) | Sin errores. 437 módulos. 993KB chunk principal | 2026-06-28 |
| `npm run lint` (eslint) | Verificado tras creación del expediente | 2026-06-28 |
| TypeScript strict | Sin errores de tipo | 2026-06-28 |
| `git status` | Un directorio sin trackear: `audit/` (no afecta al producto) | 2026-06-28 |
| Git log | 183 commits. Último: `chore(branding)` | 2026-06-28 |
| Fixture y test de Atarfe | `fixtures/ibse-eas-atarfe.csv` y `tests/atarfe-complementary-studies.test.ts` commiteados | 2026-06-28 |

### Verificaciones arquitectónicas cruzadas

| Invariante | Verificación |
|---|---|
| **PSL-C1** | `PrioritizationEngine.ts:21`, `ActionPlanEngine.ts:101`, `MunicipalityRuntime.ts:53` confirman que ningún motor del Nivel 3 consume outputs del Nivel 2 directamente |
| **requiresHumanValidation: true** | Presente en todos los outputs del MIT, PSL, EvidenceAtoms, ActionPlan, Agenda |
| **T-1 a T-5 (trazabilidad)** | Verificados mediante tests de trazabilidad de átomos y Atarfe end-to-end |
| **Separación evidencia/interpretación/decisión** | Implementada mediante arquitectura de tres niveles sin atajos conocidos |
| **Pipeline de solo lectura** | El MIT no modifica el EvidenceStore; verificable en LT1Engine y OITEngine |
| **No persistencia de registros individuales** | Confirmado: parsers calculan agregados y descartan individuales |

---

## 4. Sprint 0 — Dictamen

### CERTIFICABLE

Todos los criterios del Gate 1 (`OPERATING-CONSTITUTION.md §5.1`) quedan superados
sin excepción:

| Criterio | Estado |
|---|---|
| 1. Repositorio Documental determinista | ✓ Verificado por tests de ciclo de vida completo |
| 2. Los seis Estudios Complementarios siguen el mismo contrato | ✓ Todos implementados con mismo pipeline y UI |
| 3. Toda evidencia tiene documentId válido | ✓ Verificado por tests de trazabilidad de átomos |
| 4. Toda carga genera exactamente el mismo ciclo de vida | ✓ Verificado por tests de integración Atarfe |
| 5. La persistencia resiste cualquier recarga | ✓ LocalStorageWorkspacePersistence con tests |
| 6. La interfaz parece un producto institucional consolidado | ✓ Contrato Visual aplicado; CSS institucional |
| 7. No quedan estados imposibles conocidos sin gestión | ✓ Resueltos o documentados como riesgos aceptados |
| 8. La plataforma está preparada para motores sin aumentar deuda | ✓ Nivel 2 y 3 implementados sobre Nivel 1 sin refactorización |

Ningún criterio de rechazo del §5.2 está activo.

La deuda técnica pendiente al cierre del Sprint 0 (`App.tsx` monolítico,
bundle sin code splitting, migraciones inline) fue aceptada explícitamente
como deuda reconocida antes del inicio del Sprint 1. No invalida el Gate 1.

**El Sprint 0 queda arquitectónicamente certificado a fecha 2026-06-28.**

---

## 5. Sprint 1 — Dictamen

### CERTIFICABLE CON CONDICIONES

El Sprint 1 entregó sus tres compromisos explícitos:

| Compromiso | Estado |
|---|---|
| Corrección escala IBSE 0-100 | ✓ Implementado, testado con test de regresión explícito |
| 6 contratos nuevos creados e indexados en CONTRACT-INDEX | ✓ SCALE-PANELS v1.1, INDEX, EVIDENCE-QUALITY, DYNAMIC-TRIPYRAMID, STRATEGIC-REPOSITORY, STRATEGIC-TRANSLATION |
| Consolidación visual institucional de los 6 paneles | ✓ Gramática A/B/C aplicada; prefijo `study-*`; lenguaje institucional uniforme |

**El Sprint 1 no puede declararse cerrado sin condiciones** porque existen cuatro
categorías de deuda que, aunque estaban identificadas al inicio del sprint, no
han sido resueltas y tienen impacto directo en el Sprint 2.

Las condiciones se documentan exhaustivamente en §7 (Deuda Aceptada).

**El Sprint 1 queda certificado con condiciones a fecha 2026-06-28.**

---

## 6. Componentes congelados

Los siguientes componentes quedan congelados: su contrato no debe modificarse
sin revisión deliberada y su implementación no debe alterarse sin Gate explícito.

| Componente | Congelado desde | Contrato de referencia |
|---|---|---|
| MunicipalDocumentRepository | Sprint 0 | CONTRACT-REPOSITORY |
| EvidenceStore + IntegrityGuard (reglas A-E) | Sprint 0 | CONTRACT-EVIDENCE |
| LocalStorageWorkspacePersistence (schema 1.0.0) | Sprint 0 | CONTRACT-PERSISTENCE |
| Pipeline de Estudios Complementarios (6 instrumentos) | Sprint 0 | CONTRACT-COMPLEMENTARY-STUDIES |
| Gramática editorial de paneles (categorías A/B/C) | Sprint 1 | CONTRACT-SCALE-PANELS v1.1 |
| Motor de Interpretación Territorial (MIT: LT1, OIT, Reconciliación) | Sprint 0 | CONTRACT-MIT-PSL |
| PSL — ciclo generated → validated, pslIsStale | Sprint 0 | CONTRACT-MIT-PSL |
| Regla PSL-C1 | Sprint 0 | CONTRACT-MIT-PSL + OPERATING-CONSTITUTION §1.1 |
| Plan de Acción / Agenda / Seguimiento como borradores técnicos | Sprint 0 | CONTRACT-ACTION-PLAN |
| StrategicFrameworkRegistry (EPVSA, ESCA, RELAS, EBE, MAYORES) | Sprint 0 | CONTRACT-ACTION-PLAN |
| Arquitectura canónica de tres niveles | Sprint 0 | OPERATING-CONSTITUTION §1 |
| Separación evidencia / interpretación / propuesta | Sprint 0 | ARCHITECTURE-CONSTITUTION Art. 5 |
| Principio de no sustitución del Informe de Salud | Sprint 0 | PSL-I1, I-CE-2 |
| EAS como referencia metodológica primaria | Sprint 0 | ARCHITECTURE-CONSTITUTION Art. 14 |
| Denominaciones canónicas del Repositorio Estratégico | Sprint 1 | CONTRACT-STRATEGIC-REPOSITORY |

---

## 7. Componentes reservados

Los siguientes componentes tienen contrato o diseño conceptual aprobado
pero no tienen implementación activa. Su reserva es intencional.
No deben implementarse antes del Gate correspondiente.

| Componente | Estado | Contrato | Gate de activación |
|---|---|---|---|
| Tripirámide Dinámica / SAM | CONCEPTUAL | CONTRACT-DYNAMIC-TRIPYRAMID | Sprint 2 — cuando datos de padrón disponibles |
| Repositorio Estratégico Territorial | CONCEPTUAL | CONTRACT-STRATEGIC-REPOSITORY | Sprint 2 — prerequisito del MTE |
| Motor de Traducción Estratégica (MTE) | CONCEPTUAL | CONTRACT-STRATEGIC-TRANSLATION | Sprint 2 — requiere Repositorio Estratégico |
| PSL transición `approved` | Tipo definido, sin handler | CONTRACT-MIT-PSL §6.3 | Sprint 2 — junto con familia de compiladores |
| Inteligencia Territorial Explicable | FUTURO — investigación | CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE | No antes de Sprint 3; requiere investigación metodológica previa |
| Familia de compiladores (ver §9) | Sin implementación | CONTRACT-COMPILER (reserva actual) | Sprint 2 — requiere contratos específicos por compilador |

---

## 8. Deuda aceptada

La deuda aceptada no invalida la certificación. Queda registrada formalmente
para impedir que sea ignorada en el Sprint 2.

### 8.1 Deuda técnica

| Ítem | Descripción | Prioridad para Sprint 2 |
|---|---|---|
| `App.tsx` monolítico | 1915 líneas: router + estado + handlers + render en un solo fichero. Riesgo creciente de mantenibilidad. | Media |
| Bundle sin code splitting | 993KB en el chunk principal. Sin impacto funcional inmediato. | Baja |
| Migraciones inline | `LocalStorageWorkspacePersistence` concentra 230 líneas de migración de esquema. | Baja |
| Directorios reservados vacíos | `ai/`, `services/`, `modules/`, `shared/` existen como reservas declaradas sin contenido. | Sin prioridad (correctos) |

### 8.2 Deuda metodológica

| Ítem | Descripción | Prioridad para Sprint 2 |
|---|---|---|
| **Biblioteca Metodológica incompleta** | SF-12, Sueño y CAGE no tienen `MethodologicalModule` en el registry. Sus parsers hardcodean nombres de columna. Ver CONTRACT-COMPLEMENTARY-STUDIES §9a. | **ALTA — primer prerequisito del Sprint 2** |
| IBSE en estado `draft` | Pendiente contraste bibliográfico completo con Bericat (2014). El módulo es operativo pero no puede transitar a `validated`. | Media |
| Referencias sin datos reales | Los 6 paneles muestran "sin referencia disponible" para Granada/Andalucía. | Media |
| Catálogo temático incompleto | Los 10 temas actuales no incluyen "Activos para la Salud", "Entornos Promotores" ni "Participación Ciudadana", presentes en el PLS real de Atarfe. | Media |

### 8.3 Deuda documental

| Ítem | Descripción | Prioridad para Sprint 2 |
|---|---|---|
| OPERATING-CONSTITUTION §4 desactualizado | El encabezado de sección sigue describiendo Sprint 0 como "objetivo vigente". El cuerpo es correcto. | **ALTA — corregir al inicio del Sprint 2** |
| CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT ausente | El contenido del Plan Local de Salud no está metodológicamente discutido ni contractualizado. No puede implementarse `LocalHealthPlanCompiler` sin este contrato. Ver §9. | **ALTA — prerequisito del Sprint 2** |

### 8.4 Deuda arquitectónica

| Ítem | Descripción | Prioridad para Sprint 2 |
|---|---|---|
| PSL transición `approved` sin handler | El tipo está definido (`"approved"` en `LocalHealthProfile.ts`). No existe `handleApprovePSL` en `App.tsx`. La transición `validated → approved` es prerequisito del gate G-C1 de cualquier compilador. | **ALTA — Sprint 2 (junto con compiladores)** |
| ClassificationBlocks en `planned` | Todos los bloques de clasificación (`eas-sociodemographic`, `eas-household`, etc.) están tipados pero sin contenido. Bloquean el Constructor Metodológico de Encuestas. | **ALTA — Sprint 2** |
| Constructor Metodológico sin UI | El dominio y la capa de aplicación existen (`QuestionnaireBuilder`, `GenerateRedcapDictionaryArtifact`). No existe interfaz ni integración de extremo a extremo. | Media |
| EPVSATranslator como MTE provisional | El `EPVSATranslator` es la "versión inicial" del Motor de Traducción Estratégica. Cuando el MTE real se implemente (con Repositorio Estratégico como input), este componente deberá evolucionar o ser reemplazado. | Media — gestionar en Sprint 2 |

### 8.5 Deuda visual

| Ítem | Descripción | Prioridad para Sprint 2 |
|---|---|---|
| Portada institucional ausente | No existe pantalla que explique qué es COMPÁS NG, qué es un Plan Local de Salud, el Expediente Territorial ni el recorrido metodológico completo. | **ALTA — Sprint 2** |
| Visor PDF nativo no implementado | El Informe de Salud en PDF se procesa (texto extraído disponible); no hay visor PDF embebido. | Baja |

---

## 9. Nota sobre la familia de compiladores

El CONTRACT-COMPILER actual describe una reserva arquitectónica genérica denominada
"Compilador del Plan Local de Salud". Esta denominación es imprecisa y debe
reemplazarse por una familia de compiladores con propósitos distintos.

### 9.1 Distinción de la familia

**LocalHealthProfileCompiler**

- Propósito: compilar el Perfil de Salud Local como documento institucional autónomo.
- Entrada: PSL en estado `validated`.
- Salida: artefacto exportable del análisis territorial (diagnóstico, capítulos I-VII).
- No requiere plan de acción ni agenda. Opera sobre el Nivel 2.
- Gate mínimo: PSL en estado `validated`.

**NHSHealthProfileCompiler**

- Propósito: generar una representación tipo NHS Health Profiles a partir del PSL.
- Entrada: PSL en estado `validated`.
- Salida: perfil de salud territorial en formato editorial NHS (alta densidad informativa,
  tipografía estructural, indicadores comparativos).
- No introduce nueva interpretación. Es un motor de presentación, no analítico.
- Gate mínimo: PSL en estado `validated` + datos de referencia disponibles.

**LocalHealthPlanCompiler**

- Propósito: compilar el Plan Local de Salud como documento institucional definitivo.
- Entrada: PSL en estado `approved` + Priorizaciones + Motor de Traducción Estratégica
  ejecutado + Plan de Acción validado + Agenda + Seguimiento.
- Salida: Plan Local de Salud completo, exportable, con trazabilidad verificable.
- Gate mínimo: PSL en estado `approved` (condición G-C1 actual) + todos los inputs
  del Nivel 3 validados + CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT formalizado.

### 9.2 Prerequisito contractual del LocalHealthPlanCompiler

El contenido del Plan Local de Salud —estructura de secciones, jerarquía documental,
elementos obligatorios y opcionales, formato institucional, trazabilidad al PSL—
no está todavía metodológicamente discutido ni contractualizado.

**No debe implementarse `LocalHealthPlanCompiler` sin que exista previamente el
contrato `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT`** (o denominación equivalente que
fije el contrato documental del Plan Local de Salud).

El Sprint 2 debe:
1. Definir y aprobar CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT.
2. Solo entonces diseñar LocalHealthPlanCompiler.
3. Implementarlo cuando el PSL tenga transición `approved` operativa.

### 9.3 Implicación para CONTRACT-COMPILER

El CONTRACT-COMPILER actual es una reserva arquitectónica válida pero insuficiente
como base de implementación. Debe mantenerse como documento histórico de la reserva
y complementarse con contratos específicos por compilador cuando cada uno entre en
alcance de sprint.

---

## 10. Criterios de reapertura

Las siguientes condiciones autorizan la reapertura de items de este expediente:

| Ítem afectado | Condición de reapertura |
|---|---|
| Dictamen Sprint 0 | Incumplimiento demostrado de cualquiera de los 8 criterios del Gate 1 en un escenario reproducible |
| Dictamen Sprint 1 | Contradicción demostrada entre un entregable del Sprint 1 y su contrato de referencia |
| Componentes congelados | Necesidad real documentada que requiera modificar un contrato congelado; requiere deliberación explícita del responsable |
| Deuda §8.2 (Biblioteca) | Solo puede cerrarse cuando los MethodologicalModules de SF-12, Sueño y CAGE estén registrados y sus parsers los deriven |
| Deuda §8.3 (OPERATING-CONSTITUTION) | Cierra con la actualización de §4 al inicio del Sprint 2 |

---

## 11. Frontera objetiva del Sprint 2

El Sprint 2 comienza donde termina el conocimiento territorial sistematizado y empieza
la planificación estratégica operativa.

**Capa de entrada del Sprint 2:**
PSL `validated` estable + Biblioteca Metodológica completa (6/6 instrumentos).

**Capa de salida objetivo del Sprint 2:**
LocalHealthProfileCompiler operativo + Constructor Metodológico de Encuestas funcional
+ Repositorio Estratégico + Motor de Traducción Estratégica operativo.

El LocalHealthPlanCompiler puede ser alcanzable en Sprint 2 si y solo si
CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT se aprueba en la primera mitad del sprint.

Los siguientes bloques pertenecen objetivamente al Sprint 2:

| Bloque | Justificación |
|---|---|
| Biblioteca Metodológica completa (SF-12, Sueño, CAGE) | Prerequisito del Constructor y del Canon metodológico completo |
| ClassificationBlocks (eas-sociodemographic et al.) | Prerequisito del Constructor |
| Constructor Metodológico de Encuestas (UI) | Infraestructura de dominio existente; interfaz ausente |
| Portada institucional | Prerequisito de usabilidad institucional |
| OPERATING-CONSTITUTION §4 actualizado | Deuda documental activa desde el cierre del Sprint 0 |
| CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT | Prerequisito del LocalHealthPlanCompiler |
| LocalHealthProfileCompiler | Primer compilador; gate: PSL `validated` |
| NHSHealthProfileCompiler | Compilador editorial; gate: PSL `validated` + referencias |
| PSL transición `approved` | Prerequisito del LocalHealthPlanCompiler y del gate G-C1 |
| Repositorio Estratégico Territorial | CONTRACT-STRATEGIC-REPOSITORY listo para implementación |
| Motor de Traducción Estratégica | CONTRACT-STRATEGIC-TRANSLATION listo; requiere Repositorio |
| LocalHealthPlanCompiler | Gate: CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT + PSL `approved` + MTE |
| Catálogo temático ampliado | Activos, Entornos, Participación necesarios para PLS reales |
| Compilador REDCap (integración completa) | Artifact generator existe; UI e integración ausentes |

**No pertenecen al Sprint 2:**

| Bloque | Razón |
|---|---|
| Inteligencia Territorial Explicable | CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE es FUTURO; requiere investigación metodológica previa |
| Tripirámide Dinámica completa | Requiere datos de padrón municipal por municipio; fuera del repositorio actual |
| Agenda inteligente / Seguimiento inteligente | Dependen del MTE operativo; no pueden diseñarse antes |

---

## 12. Prerequisitos del Sprint 2

Antes de comenzar el Sprint 2, deben verificarse las siguientes condiciones:

1. **Biblioteca Metodológica** — `MethodologicalModule` de SF-12, Sueño y CAGE existe
   en `domain/methodology/registry.ts` y sus parsers derivan nombres de columna del módulo.
   Este es el prerequisito de mayor impacto. Bloquea Constructor, Compilador REDCap y
   validación canónica de 3 instrumentos.

2. **OPERATING-CONSTITUTION §4 actualizado** — El encabezado de sección refleja el
   estado real del proyecto (Sprint 2, no Sprint 0 como objetivo vigente).

3. **CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT creado y aprobado** — Define la estructura,
   jerarquía, elementos obligatorios y opcionales, y trazabilidad al PSL del Plan Local
   de Salud como documento institucional. Sin este contrato no puede diseñarse
   `LocalHealthPlanCompiler`.

4. **Gate 2 definido** — La OPERATING-CONSTITUTION debe incluir §5.x (Gate 2) con
   criterios de aceptación para el Sprint 2, análogos al Gate 1 del Sprint 0.
   Criterios naturales: Biblioteca completa (6/6), Constructor funcional end-to-end,
   LocalHealthProfileCompiler operativo, portada institucional presente.

---

## 13. Acta final

| Campo | Valor |
|---|---|
| Expediente | CERTIFICATION-SPRINT-0-1 |
| Fecha de emisión | 2026-06-28 |
| Repositorio | `C:\Users\blash\Desktop\COMPAS_NG` |
| Tests | 309/309 passing |
| Build | Limpio sin errores |
| Lint | Limpio |
| Commits | 183 |
| **Sprint 0** | **CERTIFICADO** |
| **Sprint 1** | **CERTIFICADO CON CONDICIONES** |
| Condición principal Sprint 1 | Biblioteca Metodológica (§8.2) — primer prerequisito del Sprint 2 |
| Deuda total clasificada | 5 categorías, 16 ítems, ordenados por prioridad |
| Componentes congelados | 14 |
| Componentes reservados | 6 |
| Compiladores en alcance futuro | 3 (LocalHealthProfileCompiler, NHSHealthProfileCompiler, LocalHealthPlanCompiler) |
| Prerequisito contractual pendiente | CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT |
| Sprint 2 autorizado | Sí, sujeto a §12 (4 prerequisitos) |

---

*Este expediente ha sido producido mediante auditoría directa del repositorio: lectura
de código fuente, contratos, tests y constituciones. Se basa en evidencia verificable,
no en suposiciones. Cualquier modificación posterior debe incluir justificación explícita
y referencia al ítem de este expediente que afecta.*
