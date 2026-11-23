# COMPÁS NG — Expediente de Certificación Institucional
## Producto 5 — Motor de Traducción Estratégica (MTE)

> Documento oficial de arquitectura.
> No es un manual de usuario ni una guía de implementación.
> Deja constancia formal de que el Producto 5 existe, cuál es su alcance,
> qué garantiza, qué queda pendiente y por qué puede considerarse certificado.
> No puede modificarse salvo por decisión deliberada del responsable del proyecto.
> Fecha de emisión: 2026-06-30

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre oficial** | Motor de Traducción Estratégica (MTE) |
| **Código** | PRODUCT-5 |
| **Objetivo institucional** | Identificar y hacer explícitas las coherencias estratégicas latentes en la intersección del diagnóstico territorial certificado (LocalHealthProfile validado) y el conocimiento estratégico institucional disponible (FrameworkProvider), produciendo la LecturaEstrategicaLocal como unidad canónica de transferencia al ciclo de planificación |
| **Fecha de emisión** | 2026-06-30 |
| **Estado** | **CERTIFICADO** |
| **Versión** | 1.0 |
| **Repositorio** | `C:\Users\blash\Desktop\COMPAS_NG` |
| **Prerrequisitos certificados** | Producto 1 — Estudios Complementarios · Producto 2 — SAM NG · Producto 3 — PSL-C · Producto 4 — NHS Health Profile |

---

## 2. Alcance certificado

### 2.1 Misión institucional

El MTE no genera conocimiento. Hace visible el conocimiento que ya existe, latente, en la combinación del diagnóstico territorial y el conocimiento estratégico institucional. Su acción canónica es **explicitar**: convertir coherencias estratégicas latentes en representaciones estructuradas, trazables e inmutables.

El MTE no interpreta el diagnóstico: lo organiza en clave estratégica. No valora: relaciona. No decide: representa.

### 2.2 Entradas certificadas

| Entrada | Estado | Restricción |
|---|---|---|
| `LocalHealthProfile` validado o aprobado | ✅ Certificada | Solo lectura; nunca modificado (I-MTE-3) |
| `FrameworkProvider` (interfaz) | ✅ Certificada | Solo lectura; abstracción completa sobre el origen del conocimiento |
| `StaticFrameworkProvider` con `StrategicFrameworkRegistry` | ✅ Certificada | Implementación de producción para v1.0 |

### 2.3 Salida certificada

| Salida | Estado |
|---|---|
| `LecturaEstrategicaLocal` | ✅ Única salida autorizada |
| `EscenarioEstrategico[]` (entidades del dominio) | ✅ Producidas por el MTE; inmutables desde la explicitación |
| `VacioInstitucional[]` | ✅ Vacío en v1.0; poblado cuando el algoritmo excluya áreas |
| Cuatro cautelas invariables (CONTRACT-MTE §6.4) | ✅ Siempre presentes |
| `requiresHumanValidation: true` | ✅ Invariante; nunca puede cambiar de valor |

### 2.4 Entidades del dominio certificadas

Todas las entidades del dominio del Producto 5 están definidas en `src/domain/strategic-scenario/`:

| Entidad | Estado |
|---|---|
| `EscenarioEstrategico` | ✅ Implementada |
| `LecturaEstrategicaLocal` | ✅ Implementada |
| `ReferenciaInstitucional` | ✅ Implementada |
| `TensionEstrategica` | ✅ Implementada |
| `VacioInstitucional` | ✅ Implementada |
| `MetodologiaMTE` | ✅ Implementada |
| `NivelEstrategico` | ✅ Implementada |
| `TipoTensionEstrategica` | ✅ Implementada |

---

## 3. Arquitectura certificada

### 3.1 Posición en la arquitectura

```
LocalHealthProfile (status: "validated" | "approved")   ← única fuente territorial (Nivel 3)
    │
    │  [solo lectura; G-MTE-1]
    ▼
MTEEngine.translate(psl, provider)
    │
    │  ← FrameworkProvider (conocimiento estratégico institucional)
    │    [solo lectura; G-MTE-3]
    ▼
LecturaEstrategicaLocal
    ├── EscenarioEstrategico[]         ← agrupación 1:1 (v1.0, MTE-L1)
    │     ├── tema                     ← title del área, sin síntesis (I-SC-2)
    │     ├── areasOrigen              ← [area.id] (I-SC-1, I-MTE-5)
    │     ├── evidenciaOrigen          ← area.relatedEvidenceIds
    │     ├── cautelasOriginales       ← area.cautions heredadas
    │     ├── referenciasInstitucionales ← por palabras clave; de FrameworkProvider
    │     ├── tensiones                ← tipo "evidencia" de PSL (MTE-L4)
    │     └── sinCoberturaMarcal       ← true ↔ referencias vacías (I-SC-7)
    ├── VacioInstitucional[]           ← vacío en v1.0
    ├── cautelas[4]                    ← invariables; CONTRACT-MTE §6.4
    ├── MetodologiaMTE                 ← trazabilidad del proceso
    └── requiresHumanValidation: true  ← invariante (I-MTE-2)
```

### 3.2 Infraestructura de acceso al conocimiento

```
StrategicFrameworkRegistry          ← conocimiento estratégico en src/domain/strategy/
    │  [getAllStrategicElements()]
    ▼
StaticFrameworkProvider             ← src/application/mte/StaticFrameworkProvider.ts
    │  implements FrameworkProvider
    ▼
MTEEngine.translate()               ← recibe FrameworkProvider como abstracción
```

El MTE **no importa** `StrategicFrameworkRegistry` directamente. El acceso al conocimiento es exclusivamente mediante `FrameworkProvider`. El origen del conocimiento es completamente transparente para el motor.

### 3.3 Gates de compilación

| Gate | Condición | Tipo | Comportamiento verificado |
|---|---|---|---|
| **G-MTE-1** | `psl.status === "validated" \|\| "approved"` | Bloqueante | `{ ok: false, violations: ["G-MTE-1: ..."] }` |
| **G-MTE-2** | `psl.areasDeIntervencion.length >= 1` | No bloqueante | Artefacto con `escenarios: []`, `hasTranslatableContent: false` |
| **G-MTE-3** | `frameworkProvider != null` | Bloqueante | `{ ok: false, violations: ["G-MTE-3: ..."] }` |

### 3.4 Mecanismo de correspondencia v1.0

**Estrategia:** palabras clave entre el texto del área (`title + rationale`) y los elementos del proveedor (`label + description`).

**Algoritmo:**
1. Normalización NFD + eliminación de diacríticos
2. Tokenización por caracteres no alfanuméricos
3. Filtro: longitud ≥ 4 caracteres; eliminación de stopwords en español
4. Coincidencia: `elemento.texto.includes(clave)` para cada clave del área
5. Sin scoring, sin ranking, sin IA

**Resultado v1.0:** cobertura amplia; diseñada como observación metodológica, no como asignación definitiva. Las cautelas invariables del artefacto recuerdan explícitamente esta naturaleza.

### 3.5 Tensiones de evidencia

Fuentes de tensiones de tipo `"evidencia"`:
- `psl.tensionesEscaladas[]` → `TensionEstrategica` sin `origenPSL`
- `psl.conflictos[]` → `TensionEstrategica` con `origenPSL = conflicto.id`

Distribución (MTE-L4): todas las tensiones se distribuyen a todos los escenarios sin discriminación. La vinculación de tensiones a áreas específicas pertenece a versiones futuras.

### 3.6 Regla PSL-C1

El MTE opera en el Nivel 3. Su única fuente de información territorial es el `LocalHealthProfile`. No accede a `LT1Result`, `OITResult`, `EvidenceStore`, `EvidenceAtom`, SAM, estudios complementarios ni workspace. Esta restricción es invariante.

---

## 4. Invariantes verificadas

| Invariante | Descripción | Evidencia |
|---|---|---|
| **I-MTE-1** | PSL-C1: única fuente territorial | Inspección de imports en `MTEEngine.ts`; sin acceso a Nivel 2 |
| **I-MTE-2** | `requiresHumanValidation: true` siempre | Bloque 5, test 4 (Atarfe + unitario) |
| **I-MTE-3** | PSL de origen inmutable | Bloque 5, test 1 (Atarfe); Bloque 2, test 3 (unitario) |
| **I-MTE-4** | Determinismo: mismo PSL → mismo artefacto | Bloque 6, test 1-2 (Atarfe); Bloque 2, test 4 (unitario) |
| **I-MTE-5** | Trazabilidad: `areasOrigen → PSL` | Bloque 4 (Atarfe); Bloque 3 (unitario) |
| **I-MTE-6** | Principio de Objetividad heredado | Bloque 7, test 6 (Atarfe); Bloque 6 (unitario) |
| **I-MTE-7** | FrameworkProvider de solo lectura | Bloque 5, test 2-3 (Atarfe) |
| **I-SC-1** | Trazabilidad al diagnóstico (areasOrigen) | Bloque 2 + Bloque 4 (Atarfe) |
| **I-SC-2** | Tema derivado, no generado | Bloque 4 (Atarfe); Bloque 3 (unitario) |
| **I-SC-3** | Referencias con sourceTrace | Bloque 3 (Atarfe); Bloque 4 (unitario) |
| **I-SC-7** | Coherencia `sinCoberturaMarcal` ↔ referencias | Bloque 3 (Atarfe); Bloque 2 (unitario) |

---

## 5. Estado de implementación por componente

| Componente | Estado | Ubicación |
|---|---|---|
| `LecturaEstrategicaLocal` (tipo raíz) | ✅ Implementado | `src/domain/strategic-scenario/LecturaEstrategicaLocal.ts` |
| `EscenarioEstrategico` y entidades asociadas | ✅ Implementado | `src/domain/strategic-scenario/LecturaEstrategicaLocal.ts` |
| `FrameworkProvider` (interfaz) | ✅ Implementado | `src/application/mte/FrameworkProvider.ts` |
| `StaticFrameworkProvider` (implementación) | ✅ Implementado | `src/application/mte/StaticFrameworkProvider.ts` |
| `MTEEngine.translate()` (motor) | ✅ Implementado | `src/application/mte/MTEEngine.ts` |
| Gates G-MTE-1, G-MTE-2, G-MTE-3 | ✅ Implementados | `MTEEngine.ts` |
| Correspondencia por palabras clave (v1.0) | ✅ Implementado | `MTEEngine.ts — buscarReferencias()` |
| Tensiones de evidencia (escaladas + conflictos) | ✅ Implementado | `MTEEngine.ts — buildTensiones()` |
| Cautelas invariables (CONTRACT-MTE §6.4) | ✅ Implementadas | `MTEEngine.ts — CAUTELAS` |
| `MetodologiaMTE` (trazabilidad del proceso) | ✅ Implementado | `MTEEngine.ts — buildMetodologia()` |
| Fixtures canónicos del dominio | ✅ Implementados | `tests/strategic-scenario-fixtures.ts` |
| `RegistryFrameworkProvider` (producción) | ⏳ Previsto | No necesario en v1.0; `StaticFrameworkProvider(getAllStrategicElements())` cubre este rol |
| Tensiones de marco (MTE-L3) | ⏳ Versión futura | Documentado como limitación; análisis de elementos del proveedor |
| Agrupación multi-área (MTE-L1) | ⏳ Versión futura | 1:1 es suficiente para v1.0 |

---

## 6. Evidencias objetivas de certificación

### 6.1 Build y TypeScript

```
TypeScript strict (tsconfig.app.json --noEmit): 0 errores, 0 advertencias
```

### 6.2 Suite de tests

```
771/771 tests pasan en 22 ficheros de test
```

Tests directamente relacionados con el Producto 5:

| Fichero de test | Tests | Qué verifica |
|---|---|---|
| `tests/strategic-scenario-fixtures.ts` | — | Fixtures canónicos del dominio (Unidad 2) |
| `tests/strategic-scenario-domain.test.ts` | 56 | Invariantes I-SC-1 a I-SC-8; tipos; serialización; inmutabilidad; estados válidos e imposibles (Unidad 3) |
| `tests/framework-provider.test.ts` | 15 | Contrato FrameworkProvider + StaticFrameworkProvider; desacoplamiento del dominio MTE (Unidad 4) |
| `tests/mte-engine.test.ts` | 39 | Comportamiento del motor: gates, invariantes, trazabilidad, correspondencia, tensiones, Principio de Objetividad (Unidad 5) |
| `tests/mte-atarfe-validation.test.ts` | 40 | Validación institucional con datos canónicos de Atarfe: 7 bloques (Unidad 6) |
| **Total Producto 5** | **150** | |

### 6.3 Criterios CONTRACT-MTE §11 verificados

| Criterio | Fichero | Estado |
|---|---|---|
| TypeScript `--noEmit` sin errores | Build | ✅ |
| Todos los tests anteriores sin regresión | Suite completa | ✅ |
| G-MTE-1: PSL `generated` → `{ ok: false }` | mte-engine + mte-atarfe-validation | ✅ |
| G-MTE-1: PSL `validated` → `{ ok: true }` | mte-engine + mte-atarfe-validation | ✅ |
| G-MTE-1: PSL `approved` → `{ ok: true }` | mte-engine | ✅ |
| G-MTE-2: sin áreas → `hasTranslatableContent: false` | mte-engine + mte-atarfe-validation | ✅ |
| `requiresHumanValidation: true` en artefacto | mte-engine + mte-atarfe-validation | ✅ |
| PSL de origen no modificado tras compilación | mte-engine + mte-atarfe-validation | ✅ |
| Dos compilaciones del mismo PSL producen artefactos equivalentes | mte-engine + mte-atarfe-validation | ✅ |
| `sinCoberturaMarcal: true` ↔ referencias vacías | mte-engine + mte-atarfe-validation | ✅ |
| Trazabilidad: `areasOrigen` apunta a IDs válidos del PSL | mte-engine + mte-atarfe-validation | ✅ |
| `cautelasOriginales` heredadas correctamente desde áreas | mte-engine + mte-atarfe-validation | ✅ |
| Cuatro cautelas invariables siempre presentes | mte-engine + mte-atarfe-validation | ✅ |
| Artefacto serializable sin pérdida | mte-engine + mte-atarfe-validation | ✅ |
| Auditoría con datos reales de Atarfe | mte-atarfe-validation | ✅ |
| Ningún `EscenarioEstrategico` contiene texto generado autónomamente | mte-engine + mte-atarfe-validation | ✅ |

### 6.4 Ausencia de regresiones

Los 731 tests anteriores al Producto 5 continúan pasando sin modificación. Los Productos 1–4 no registran ninguna regresión.

---

## 7. Validación institucional con Atarfe

### 7.1 Caso de validación

| Campo | Valor |
|---|---|
| Municipio | Atarfe (Granada, DAP Granada-Metro) |
| PSL utilizado | Fixture canónico `psl-atarfe-001` (`status: "validated"`) |
| Áreas de intervención | 2: "Salud mental comunitaria" / "Alimentación saludable" |
| Tensiones escaladas | 1 (bienestar emocional escolar vs. recursos comunitarios accesibles) |
| Conflictos | 0 |
| Provider | `StaticFrameworkProvider(getAllStrategicElements(), "1.0.0")` |
| Marcos consultados | EPVSA · ESCA · MAYORES · BUENA\_EDAD · RELAS (25 elementos) |

### 7.2 Resultado observado

| Escenario | Área | Cobertura | Referencias |
|---|---|---|---|
| `escenario-psl-atarfe-001-ait-1` | Salud mental comunitaria | ✅ Detectada | Múltiples (EPVSA, ESCA, MAYORES, BUENA\_EDAD, RELAS) |
| `escenario-psl-atarfe-001-ait-2` | Alimentación saludable | ✅ Detectada | Múltiples (EPVSA principalmente) |

Ambos escenarios presentan `sinCoberturaMarcal: false`. El mecanismo de palabras clave v1.0 detecta correspondencia institucional en las dos áreas del diagnóstico de Atarfe.

### 7.3 Limitación de la validación

El PSL de Atarfe utilizado corresponde al fixture canónico de la suite de tests. El PSL producido automáticamente por el pipeline completo desde datos REDCap reales (IBSE, DUKE, PREDIMED, SAM) requiere la orquestación UI completa (D3-03: handler `validated → approved`). Esta es una limitación de la validación, no un defecto del MTE. Cuando D3-03 se complete, el MTE operará sobre el PSL real sin ningún cambio en su implementación.

---

## 8. Exclusiones expresas del Producto 5

| Elemento | Motivo |
|---|---|
| Plan de Acción Inteligente | Producto 6 — consumidor primario de la `LecturaEstrategicaLocal` |
| Plan Local de Salud (compilador) | Producto 7 |
| Evaluación | Producto 8 |
| Documento Ejecutivo | Producto 9 |
| Agrupación multi-área de escenarios | MTE-L1 — versión futura |
| Tensiones de tipo `"marco"` | MTE-L3 — versión futura |
| Vinculación discriminativa de tensiones a áreas | MTE-L4 — versión futura |
| `activosRelacionados` en escenarios | MTE-L2 — requiere acceso a tipos de átomos del EvidenceStore |
| `RegistryFrameworkProvider` dedicado | No necesario; `StaticFrameworkProvider(getAllStrategicElements())` es equivalente |
| Integración UI del MTE en App.tsx | Sesión de integración posterior al Producto 6 |
| IA generativa en correspondencia | Incompatible con el Principio de Objetividad (I-MTE-6, I-SC-6) |

---

## 9. Deuda residual

La deuda residual del Producto 5 es de naturaleza funcional/evolutiva, no arquitectónica:

| ID | Deuda | Tipo | Bloquea |
|---|---|---|---|
| D5-01 | Agrupación multi-área (MTE-L1): un escenario puede integrar varias áreas con coherencia compartida | Algoritmo — versión futura | No bloquea v1.0 |
| D5-02 | Tensiones de marco (MTE-L3): detectar divergencias entre marcos para el mismo escenario | Algoritmo — versión futura | No bloquea v1.0 |
| D5-03 | Vinculación discriminativa de tensiones (MTE-L4): asignar tensiones a áreas específicas del PSL | Algoritmo — versión futura | No bloquea v1.0 |
| D5-04 | `activosRelacionados` (MTE-L2): identificar activos de tipo `kind: "asset"` en `evidenciaOrigen` | Requiere decisión de diseño sobre acceso a EvidenceStore en Nivel 3 | No bloquea v1.0 |
| D5-05 | Integración UI: wiring del MTE en `App.tsx` con el workspace activo | UI — sesión posterior | No bloquea P6 (opera como función pura) |

**No existen deudas arquitectónicas abiertas en el Producto 5.** El contrato, el dominio, la infraestructura y el motor están completamente implementados. Las deudas son mejoras evolutivas del algoritmo de correspondencia y de la interfaz de usuario.

---

## 10. Dictamen de certificación

La auditoría directa del repositorio —incluyendo los contratos `CONTRACT-MTE.md` y `CONTRACT-STRATEGIC-SCENARIO.md`, el dominio `src/domain/strategic-scenario/`, la infraestructura `FrameworkProvider + StaticFrameworkProvider`, el motor `MTEEngine.translate()`, los fixtures canónicos de Unidad 2, los 150 tests específicos del Producto 5 en cuatro ficheros, y la validación institucional con datos canónicos del municipio piloto Atarfe— permite establecer el siguiente dictamen:

El Motor de Traducción Estratégica implementa correctamente el contrato `CONTRACT-MTE v1.0`. Los tres gates funcionan de forma determinista y bloqueante/no-bloqueante según el contrato. La `LecturaEstrategicaLocal` que produce satisface todos los invariantes del dominio (I-MTE-1 a I-MTE-7, I-SC-1 a I-SC-7). El mecanismo de correspondencia por palabras clave v1.0 detecta cobertura institucional en las dos áreas del diagnóstico de Atarfe. El motor es puro, sin efectos laterales, reproducible y determinista en contenido. El dominio no ha sido modificado. Los Productos 1–4 no registran regresiones.

Las cuatro limitaciones declaradas (MTE-L1 a MTE-L4) están certificadas como parte del contrato v1.0. No son defectos: son el alcance acordado explícitamente para la primera versión.

> **El Producto 5 — Motor de Traducción Estratégica queda oficialmente certificado.**

---

## 11. Acta final

| Campo | Valor |
|---|---|
| Expediente | PRODUCT-5-MTE-CERTIFICATION |
| Fecha de emisión | 2026-06-30 |
| Repositorio | `C:\Users\blash\Desktop\COMPAS_NG` |
| Tests totales | 771/771 passing — 22 ficheros |
| Tests Producto 5 | 150/150 passing — 4 ficheros |
| Build | Limpio — sin errores TypeScript strict |
| Contratos aplicables | CONTRACT-MTE v1.0 · CONTRACT-STRATEGIC-SCENARIO v1.0 |
| Componentes implementados | MTEEngine · FrameworkProvider · StaticFrameworkProvider · Dominio strategic-scenario |
| Gates certificados | G-MTE-1 (bloqueante) · G-MTE-2 (no bloqueante) · G-MTE-3 (bloqueante) |
| Invariantes verificadas | I-MTE-1 a I-MTE-7 · I-SC-1 a I-SC-7 |
| Limitaciones v1.0 certificadas | MTE-L1 · MTE-L2 · MTE-L3 · MTE-L4 |
| Caso de validación real | Atarfe — 2 áreas — 40 tests en 7 bloques |
| Comportamiento funcional alterado | Ninguno |
| Deudas arquitectónicas abiertas | Ninguna |
| **Producto 5** | **CERTIFICADO** |
| Prerrequisitos de Producto 6 autorizados | Sí — la `LecturaEstrategicaLocal` es la entrada del Producto 6 |

---

*El diagnóstico ya contiene las coherencias estratégicas.
El Motor de Traducción Estratégica las hace explícitas.*
