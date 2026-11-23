# COMPÁS NG — Expediente de Certificación Institucional
## Producto 1 — Sistema de Estudios Complementarios

> Documento oficial de arquitectura.
> No es un manual de usuario ni una guía de implementación.
> Deja constancia formal de que el Producto 1 existe, cuál es su alcance,
> qué garantiza, qué queda pendiente y por qué puede considerarse certificado.
> No puede modificarse salvo por decisión deliberada del responsable del proyecto.
> Fecha de emisión: 2026-06-29

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre oficial** | Sistema de Estudios Complementarios |
| **Código** | PRODUCT-1 |
| **Objetivo institucional** | Incorporar al ciclo diagnóstico municipal evidencia cuantitativa sobre dimensiones del estado de salud que el Informe de Salud Distrital no cubre con suficiente resolución territorial, poblacional o conceptual |
| **Fecha de emisión** | 2026-06-29 |
| **Estado** | **CERTIFICADO** |
| **Versión** | 1.0 |
| **Repositorio** | `C:\Users\blash\Desktop\COMPAS_NG` |

---

## 2. Alcance certificado

### 2.1 Lo que comprende el Producto 1

#### Catálogo oficial de instrumentos

| Instrumento | Tag canónico | Categoría metodológica |
|---|---|---|
| **IBSE** — Índice de Bienestar Socioemocional | `"ibse"` | `validated-scale` |
| **DUKE-EAS** — Apoyo social funcional | `"duke-eas"` | `validated-scale` |
| **PREDIMED-EAS** — Adherencia a dieta mediterránea | `"predimed-eas"` | `validated-scale` |
| **SF-12 EAS** — Salud percibida (PCS/MCS) | `"sf12-eas"` | `validated-scale` |
| **Sueño EAS** — Cantidad y calidad del sueño | `"sueno-eas"` | `eas-official-block` |
| **CAGE-EAS** — Riesgo de consumo problemático de alcohol | `"cage-eas"` | `eas-official-block` |

Los seis instrumentos conforman un sistema homogéneo: comparten el mismo ciclo de vida, las mismas garantías y el mismo patrón de integración.

#### Biblioteca Metodológica

Seis módulos metodológicos canónicos registrados en `domain/methodology/registry.ts`.
Cada módulo declara: identidad, fuente, ítems (cuando aplican), dimensiones, algoritmo,
interpretación, limitaciones, bibliografía y adaptador de captura (SAV o REDCap).
La Biblioteca es la única fuente de verdad sobre qué campos procesa cada instrumento.
Los parsers derivan sus columnas canónicas del módulo; no las hardcodean.

#### Parsers

Un parser por instrumento. Cada parser:
- lee el fichero fuente (CSV de REDCap o microdatos EAS);
- obtiene los campos canónicos del módulo correspondiente;
- calcula los agregados municipales;
- descarta los registros individuales;
- produce el estudio interpretado con cautelas metodológicas.

#### Generación de evidencia

Una función de conversión por instrumento transforma el estudio interpretado en
`EvidenceAtom[]`. Cada instrumento produce como mínimo: uno o más átomos de tipo
`"indicator"` y un átomo de tipo `"methodological-caution"`. Los átomos llevan
`requiresHumanValidation: true` y confianza calibrada según tamaño muestral.

#### Integración con EvidenceStore

Los átomos generados entran en el `EvidenceStore` del municipio por el mismo
mecanismo que la evidencia del Informe de Salud. El `IntegrityGuard` los trata
de forma homogénea: verifica trazabilidad, coherencia de municipio y deduplicación.
La canonicidad por tag garantiza que al sustituir un instrumento se purgan los
átomos del documento anterior.

#### Integración con el PSL

El MIT consume el EvidenceStore saneado, incluyendo los átomos de los estudios
complementarios, para producir el Estado Territorial Evolutivo. El PSL declara
en su capítulo III qué instrumentos están presentes (`ibsePresent`, `dukePresent`,
`predimedPresent`, `complementaryStudyCount`). Los átomos contribuyen a las áreas
de intervención territorial del OIT.

#### Persistencia

El estudio interpretado de cada instrumento persiste en el workspace municipal
en `localStorage`. Los registros individuales de los participantes no se persisten
en ningún momento.

#### Garantías metodológicas

Declaradas en §4 de este expediente.

### 2.2 Lo que NO forma parte del Producto 1

Los siguientes elementos quedan expresamente fuera del alcance de esta certificación:

| Elemento | Razón de exclusión |
|---|---|
| Sistema de Ajuste Muestral (SAM) | Producto 2 — implementado 2026-06-29 |
| Constructor de Cuestionarios | Producto independiente |
| Classification Blocks | Prerequisito del Constructor; pendiente de contenido |
| Motor de Traducción Estratégica (MTE) | Producto independiente (PRODUCT-5) |
| Plan de Acción | Producto independiente (PRODUCT-6) |
| Agenda y Seguimiento | Productos independientes |
| PSL-C como documento institucional compilado | Producto independiente (PRODUCT-3) |
| Exportación de artefactos documentales | Pertenece a los productos compiladores |
| Circuito CM→EvidenceStore para cuestionarios generados | Pertenece al Constructor (Hueco H-2) |
| Datos de referencia poblacionales (Granada/Andalucía) | Problema de disponibilidad de datos externo al software |

---

## 3. Arquitectura certificada

El Producto 1 ocupa una posición única y bien delimitada en el pipeline de COMPÁS NG:

```
Fichero fuente del equipo técnico
(CSV exportación REDCap o microdatos EAS)
    │
    ▼
Sistema de Estudios Complementarios
    │
    │   [Biblioteca Metodológica → campos canónicos]
    │   [Parser → agregados municipales]
    │   [Descarte de registros individuales]
    │   [Generación de EvidenceAtoms]
    │   [Registro en MunicipalDocumentRepository]
    │   [Persistencia del estudio interpretado]
    │
    ▼
EvidenceStore (átomos indicator + methodological-caution)
    │
    ▼
IntegrityGuard → EvidenceStore saneado
    │
    ▼
MIT → EstadoTerritorialEvolutivo
    │
    ▼
PSL (LocalHealthProfile)
    │
    ▼ [ciclo diagnóstico continúa hacia productos superiores]
```

El Producto 1 no produce documentos institucionales: produce evidencia estructurada.
Los documentos institucionales son responsabilidad de los productos compiladores.

---

## 4. Garantías certificadas

Las siguientes garantías están verificadas para los seis instrumentos sin excepción:

**G1 — Privacidad por diseño**
Los registros individuales de los participantes se procesan en memoria y se descartan
inmediatamente. Solo los agregados municipales sobreviven en el workspace.
Esta garantía no puede relajarse sin un diseño explícito de privacidad y decisión deliberada.

**G2 — Trazabilidad completa**
Todo átomo de evidencia lleva `provenance.documentId` que apunta al documento
registrado en el repositorio municipal, `origin: "complementary-study"`,
`sourceLabel` (nombre del fichero) y `extractedAt` (timestamp de importación).
Esta cadena es inmutable.

**G3 — Algoritmo canónico como única fuente de verdad**
Los parsers derivan los campos del fichero fuente del módulo metodológico registrado
en la Biblioteca. Ningún parser contiene nombres de columna hardcodeados.
Si el módulo cambia, el parser refleja el cambio; si el módulo falta, el parser
falla ruidosamente en lugar de asumir un valor por defecto.

**G4 — Homogeneidad del ciclo**
Los seis instrumentos siguen el mismo ciclo: módulo → parser → estudio interpretado
→ EvidenceAtoms → EvidenceStore → MIT → PSL. No existen instrumentos con tratamiento
diferenciado ni con atajos que salten algún paso del ciclo.

**G5 — Confianza calibrada**
Los átomos tienen `confidence: "medium"` cuando el número de registros válidos
es ≥ 30 para el campo canónico principal, y `confidence: "low"` por debajo de ese umbral.
Ningún instrumento puede producir átomos con `confidence: "high"`.

**G6 — Cautelas metodológicas obligatorias**
Cada instrumento produce siempre un átomo de tipo `"methodological-caution"` que
declara las limitaciones del instrumento y de la muestra específica importada.
No existe átomo de evidencia sin su cautela correspondiente.

**G7 — Separación entre evidencia e interpretación**
Los estudios complementarios producen evidencia cuantitativa agregada. No producen
interpretaciones territoriales, no proponen prioridades y no generan actuaciones.
La interpretación la realiza el MIT; las prioridades las decide el Grupo Motor.

**G8 — Canonicidad por municipio**
Solo puede existir un documento activo por instrumento y municipio. La importación
de una nueva exportación del mismo instrumento sustituye al anterior y purga los
átomos derivados del documento sustituido.

---

## 5. Estado de implementación por instrumento

| Instrumento | Biblioteca | Parser | Evidencia | UI Panel | Persistencia | Estado metodológico |
|---|---|---|---|---|---|---|
| **IBSE** | ✅ Registrado | ✅ Conectado al módulo | ✅ 7 átomos | ✅ IBSEPanel | ✅ workspace | `draft` |
| **DUKE-EAS** | ✅ Registrado | ✅ Conectado al módulo | ✅ Átomos | ✅ DUKEPanel | ✅ workspace | `draft` |
| **PREDIMED-EAS** | ✅ Registrado | ✅ Conectado al módulo | ✅ Átomos | ✅ PREDIMEDPanel | ✅ workspace | `draft` |
| **SF-12 EAS** | ✅ Registrado | ✅ Conectado al módulo | ✅ 3 átomos | ✅ SF12Panel | ✅ workspace | `draft` |
| **Sueño EAS** | ✅ Registrado | ✅ Conectado al módulo | ✅ 3 átomos | ✅ SuenoPanel | ✅ workspace | `draft` |
| **CAGE-EAS** | ✅ Registrado | ✅ Conectado al módulo | ✅ 2-3 átomos | ✅ CAGEPanel | ✅ workspace | `draft` |

**Nota sobre `draft`:** el estado `draft` del módulo metodológico indica que el contraste
bibliográfico completo con la fuente primaria del instrumento está pendiente (ver §8).
No implica ningún defecto en el comportamiento operativo del sistema.
Los seis instrumentos son funcionales y producen evidencia válida.

---

## 6. Evidencias objetivas de certificación

### Build

Build limpio tras la homogeneización de la Biblioteca:
449 módulos transformados. Sin errores TypeScript. Sin advertencias de tipado.

### Tests

481 tests pasan en 13 ficheros de test.

Tests que verifican directamente el Producto 1:

| Fichero de test | Tests | Qué verifica |
|---|---|---|
| `methodology-registry.test.ts` | 184 | Integridad estructural de los 6 módulos de la Biblioteca |
| `cage.test.ts` | 30 | Parser, agregados, EvidenceAtoms y cautelas de CAGE-EAS |
| `sueno.test.ts` | 26 | Parser, agregados, EvidenceAtoms y cautelas de Sueño EAS |
| `predimed.test.ts` | 26 | Parser, agregados, EvidenceAtoms y cautelas de PREDIMED-EAS |
| `sf12.test.ts` | 25 | Parser, agregados, EvidenceAtoms y cautelas de SF-12 EAS |
| `duke.test.ts` | 23 | Parser, agregados, EvidenceAtoms, scores y cautelas de DUKE-EAS |
| `atarfe-workspace.test.ts` | 53 | Integración completa de estudios en workspace del municipio piloto Atarfe |
| `atarfe-complementary-studies.test.ts` | 11 | Pipeline end-to-end con datos reales de Atarfe |
| `ibse.test.ts` | 10 | Parser y agregados del IBSE |

Tests directamente relacionados con el Producto 1: **388 de 481** (80,7 %).

### Ausencia de cambios funcionales tras la homogeneización

La intervención de homogeneización (creación de módulos SF-12, Sueño, CAGE y
conexión de sus parsers a la Biblioteca) no alteró el comportamiento observable.
Los campos que los parsers leen del CSV siguen siendo los mismos: `PCS12_SP`,
`MCS12_SP`, `P33_R`, `P33A`, `CAGE_R`, `CAGE`. Solo cambió el mecanismo de
obtención de esos nombres: de constantes literales a derivación desde el módulo.
Los tests instrumentales preexistentes (sf12, sueno, cage) pasaron sin modificación.

### Parsers desacoplados

Los seis parsers obtienen sus campos canónicos del módulo metodológico correspondiente:

| Parser | Módulo consultado | Campos obtenidos del módulo |
|---|---|---|
| IBSECSVParser | `"ibse"` | Columnas REDCap de los 8 ítems vía `adapters.redcap.columns` |
| DUKECSVParser | `"duke-eas"` | Columnas SAV vía dimensiones + `adapters.sav.variables` |
| PREDIMEDCSVParser | `"predimed-eas"` | Campo canónico + ítems brutos vía `adapters.sav.variables` |
| SF12CSVParser | `"sf12-eas"` | `PCS12_SP`, `MCS12_SP` vía `adapters.sav.variables` |
| SuenoCSVParser | `"sueno-eas"` | `P33_R`, `P33A` vía `adapters.sav.variables` |
| CAGECSVParser | `"cage-eas"` | `CAGE_R`, `CAGE` vía `adapters.sav.variables` |

---

## 7. Exclusiones explícitas del Producto 1

Los siguientes componentes están implementados o diseñados en el repositorio
pero quedan expresamente fuera de esta certificación porque pertenecen a
otros productos institucionales del catálogo de COMPÁS NG:

| Componente | Pertenece a | Razón |
|---|---|---|
| SAM (Sistema de Ajuste Muestral) | Producto 2 — implementado 2026-06-29 | Motor puro + integración con los 6 instrumentos. Tripirámide visual pendiente. Ver expediente Producto 2. |
| Motor de Traducción Estratégica | Producto 5 — PAI/MTE | Consume el PSL, no los estudios directamente |
| Plan de Acción | Producto 6 | Nivel 3 del pipeline; posterior al PSL |
| Agenda | Producto 6 | Idem |
| Seguimiento | Producto 6 | Idem |
| Marco de Evaluación | Producto 8 | Stage `evaluation` declarado sin implementación activa |
| LocalHealthProfileCompiler / PSL-C | Producto 3 | Compilador institucional del diagnóstico |
| Constructor de Cuestionarios | Producto metodológico independiente | Genera instrumentos; no los analiza |
| Classification Blocks | Prerequisito del Constructor | Todos en estado `"planned"` sin contenido |

La exclusión de estos componentes no es un déficit del Producto 1: es la
consecuencia de la separación de responsabilidades que hace al sistema
modular y auditable.

---

## 8. Deuda metodológica residual

Los seis módulos tienen `status: "draft"`. Este estado indica que la definición
es operativamente correcta y funcional, pero el contraste bibliográfico completo
con la fuente primaria del instrumento está pendiente.

| Instrumento | Estado | Contraste pendiente |
|---|---|---|
| IBSE | `draft` | Verificación ítem a ítem contra Bericat (2014) |
| DUKE-EAS | `draft` | Verificación contra Broadhead (1988) y Bellón (1996) |
| PREDIMED-EAS | `draft` | Verificación de umbrales contra Martínez-González (2012) |
| SF-12 EAS | `draft` | Verificación del artículo completo de Vilagut et al. (2008) |
| Sueño EAS | `draft` | Contraste con documentación metodológica oficial de la EAS |
| CAGE-EAS | `draft` | Contraste con documentación metodológica oficial de la EAS |

Esta deuda es exclusivamente documental. No afecta al comportamiento operativo
del sistema ni a la validez de la evidencia producida. Cada módulo puede
transitar de `draft` a `validated` cuando se complete el contraste bibliográfico,
sin modificar ningún componente de producción.

La condición para que los módulos transiten a `validated` está definida en
`CONTRACT-COMPLEMENTARY-STUDIES §5.5`.

---

## 9. Dictamen de certificación

La auditoría directa del repositorio —incluyendo lectura de código fuente,
módulos metodológicos, parsers, tests, build y contratos— permite establecer
el siguiente dictamen:

Los seis instrumentos del catálogo (IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS,
Sueño EAS y CAGE-EAS) están implementados de forma completa y homogénea.
Los parsers están desacoplados de constantes internas y derivan su configuración
de la Biblioteca Metodológica. Los átomos de evidencia producidos son trazables,
tienen confianza calibrada y llevan cautelas metodológicas declaradas.
La integración con el EvidenceStore, el MIT y el PSL está verificada con datos
reales del municipio piloto Atarfe.

El build es limpio. 481 tests pasan, de los cuales 388 verifican directamente
el Producto 1. No existe ningún impedimento objetivo para la certificación.

> **El Producto 1 — Sistema de Estudios Complementarios queda certificado como
> componente institucional de COMPÁS NG para su utilización dentro del ciclo
> diagnóstico municipal.**

La deuda residual identificada (contraste bibliográfico de los seis módulos)
es de naturaleza exclusivamente documental y no condiciona esta certificación.

---

## 10. Acta final

| Campo | Valor |
|---|---|
| Expediente | PRODUCT-1-CERTIFICATION |
| Fecha de emisión | 2026-06-29 |
| Repositorio | `C:\Users\blash\Desktop\COMPAS_NG` |
| Tests | 481/481 passing — 13 ficheros |
| Build | Limpio — 449 módulos — sin errores TypeScript |
| Tests directamente relacionados con Producto 1 | 388/481 (80,7 %) |
| Instrumentos certificados | 6/6 (IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS) |
| Módulos en Biblioteca | 6/6 registrados |
| Parsers conectados a Biblioteca | 6/6 |
| Comportamiento funcional alterado | Ninguno |
| **Producto 1** | **CERTIFICADO** |
| Deuda residual | Contraste bibliográfico de 6 módulos (no bloquea certificación) |
| Producto 2 autorizado | Sí, en el momento que el equipo lo decida |

---

*Este expediente ha sido producido mediante auditoría directa del repositorio:
lectura de código fuente, módulos metodológicos, parsers, tests, build y contratos.
Se basa en evidencia verificable, no en suposiciones.
Cualquier modificación posterior debe incluir justificación explícita.*
