# COMPÁS NG — Hoja de ruta

> Nota de actualización — 13 de septiembre de 2026:
> este roadmap conserva contexto histórico de Sprint 0/1. Para el estado vivo
> de producto, decisiones de limpieza y alcance actual del Plan de Acción, leer
> `docs/ESTADO-ACTUAL-COMPAS-NG.md`. Las menciones antiguas a rutas legacy o a
> componentes pendientes deben interpretarse a la luz de ese documento.

> Última revisión: 2026-07-13.
> Cada hito se activa solo cuando el anterior está estabilizado y verificado en interfaz.

---

## Estado actual (2026-06-28 — Sprint 1 certificado)

**Sprint 0 certificado. Sprint 1 certificado con condiciones.**
Véase el expediente formal de certificación:
`docs/certification/CERTIFICATION-SPRINT-0-1.md`

El Sprint 2 queda autorizado sujeto a los cuatro prerequisitos del expediente (§12).
El prerequisito de mayor impacto es la Biblioteca Metodológica (SF-12, Sueño, CAGE).
Véase `docs/architecture/OPERATING-CONSTITUTION.md §4–5` para los criterios del Gate 1 (ya superados).

El plano arquitectónico completo del sistema está en:
`docs/architecture/BLUEPRINT-PRODUCTION.md`

El sistema dispone de:

- Repositorio Documental Municipal funcional con sustitución canónica.
- Parser de Activos Comunitarios que genera un átomo por activo (no por línea).
- Purga de átomos derivados al sustituir un documento canónico.
- Purga de átomos huérfanos al hidratar desde localStorage.
- Informe de Salud cargable como DOCX y PDF, preservado como documento íntegro.
- **Trece Estudios Complementarios implementados**: IBSE (REDCap), DUKE-EAS, PREDIMED-EAS,
  SF-12 EAS, Sueño EAS, CAGE-EAS e IPAQ-EAS (sobre microdatos EAS Granada) más AUDIT-C,
  GHQ-12, PHQ-9, PSQI, Fagerström y SBQ (encuestas municipales REDCap).
  Cada uno dispone de dominio, parser, EvidenceAtoms, panel UI, workspace y persistencia.
  Todos tienen `MethodologicalModule` registrado en la Biblioteca Metodológica.
- Priorización Temática con importación REDCap y explotación estadística.
- Persistencia por municipio en localStorage con saneamiento de duplicados y reparación
  de trazabilidad (estados inconsistentes study-sin-documento).
- **MIT (Motor de Interpretación Territorial)**: produce el Estado Territorial Evolutivo
  a partir del EvidenceStore, con dimensión diagnóstica (LT1), áreas de intervención
  territorial y dimensión longitudinal.
- **Motor de Reconciliación Interpretativa**: detecta conflictos entre fuentes y estados;
  escala las tensiones relevantes a Áreas de Intervención Territorial.
- **Perfil de Salud Local (PSL)**: objeto canónico del Nivel 2. Ciclo de vida:
  `generated` → `validated` (con persistencia y detección de desactualización).
- **Plan de Acción** (borrador técnico): generado exclusivamente a partir del PSL.
- **Agenda** y **Seguimiento** como borradores técnicos iniciales.
- **Ciclo de Planificación Local**: componente institucional permanente, siempre visible,
  que representa el estado del expediente municipal en las 7 fases del ciclo RELAS.
- **Bloqueo de Nivel 3**: EPVSA, Plan de Acción, Agenda y Seguimiento requieren PSL
  validado. Sin PSL validado, estos paneles muestran estado bloqueado con requisitos.
- Municipio piloto: Atarfe. Verificado end-to-end como expediente piloto. Las referencias antiguas a seis estudios quedan superadas por el catálogo canónico vigente de 13 Estudios Complementarios.

### Contratos arquitectónicos completados en Sprint 0

| Contrato | Fecha |
|---|---|
| `CONTRACT-REPOSITORY.md` | 2026-06-22 |
| `CONTRACT-EVIDENCE.md` | 2026-06-22 |
| `CONTRACT-PERSISTENCE.md` | 2026-06-27 |
| `CONTRACT-COMPLEMENTARY-STUDIES.md` | 2026-06-27 |
| `CONTRACT-MIT-PSL.md` | 2026-06-24 |
| `CONTRACT-ACTION-PLAN.md` | 2026-06-24 |
| `CONTRACT-COMPILER.md` | 2026-06-24 (reserva arquitectónica) |
| `CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE.md` | 2026-06-27 (investigación futura) |
| `CONTRACT-INTERPRETATION.md` | 2026-06-27 (nuevo — cierre Sprint 0) |

---

## Hito 1 — Consolidación del Repositorio Documental Municipal ✓ COMPLETADO

**Objetivo completado en Sprint 0.**

El Repositorio Documental Municipal está funcional con:
- Modelo `MunicipalDocument` completo con metadatos de procedencia.
- Visualización con agrupamiento por categoría (Fuente primaria / Estudios
  complementarios / Activos comunitarios / Otras fuentes).
- Eliminación manual de documentos individuales con purga automática de evidencias.
- MunicipalInventoryPanel como inventario legible del estado documental.
- Canonicidad por `kind` (health-report, community-asset) y por `tag`
  (estudios complementarios y priorización temática).

---

## Hito 2 — Soporte para Informe de Salud en PDF ✓ COMPLETADO

**Objetivo completado en Sprint 0.**

El Informe de Salud es cargable como DOCX y PDF mediante la interfaz de carga.
- DOCX: texto extraído vía Mammoth, renderizado como HTML en el visor.
- PDF: preservado como fuente primaria sin extracción de texto y sin generación de EvidenceAtoms, conforme a D-HR-01.
- Pendiente futuro: visor PDF nativo en interfaz para el Informe de Salud en PDF.

**Deuda documentada:** El PDF original no se persiste en localStorage (limitación de
cuota). No existe OCR ni texto extraído para el pipeline de evidencias. El documento fuente
debe conservarse fuera del sistema por el equipo técnico.

---

## Hito 3 — Explotación no destructiva de Perfiles de Salud y Activos Comunitarios

**Objetivo:** Diseñar cómo los documentos del repositorio alimentan futuros motores
analíticos sin modificar ni consumir el documento original.

Principios:

- Los documentos son **leídos, nunca modificados** por los motores.
- Los motores operan sobre representaciones derivadas (`EvidenceAtom`, `MunicipalSnapshot`).
- Toda representación derivada incluye trazabilidad al documento fuente.
- La regeneración de derivados no requiere acción del usuario si el documento fuente
  está disponible.

Tareas pendientes:

- Definir la interfaz canónica que los motores consumen (`MunicipalSnapshot` actual o
  una abstracción superior).
- Establecer qué información del Perfil de Salud alimenta qué tipo de análisis.
- Establecer qué activos comunitarios alimentan qué dimensiones del diagnóstico.

---

## Hito 4 — Consolidación de Estudios Complementarios ✓ COMPLETADO

**Objetivo completado en commits `0bf5026`, `9aad479`, `7f47034`, `20080cd`, `9c73fa0`
y ampliado posteriormente con siete instrumentos adicionales.**

Los trece Estudios Complementarios están implementados con dominio, parser, EvidenceAtoms,
panel UI, workspace y persistencia. Todos tienen `MethodologicalModule` registrado en la
Biblioteca Metodológica. El Hito 4 se considera cerrado.

| Estudio | Fuente | Parser | Estado |
|---|---|---|---|
| IBSE | REDCap CSV | `IBSECSVParser` | ✓ Implementado |
| DUKE-EAS | EAS CSV | `DUKECSVParser` | ✓ Implementado |
| PREDIMED-EAS | EAS CSV | `PREDIMEDCSVParser` | ✓ Implementado |
| SF-12 EAS | EAS CSV | `SF12CSVParser` | ✓ Implementado |
| Sueño EAS | EAS CSV | `SuenoCSVParser` | ✓ Implementado |
| CAGE-EAS | EAS CSV | `CAGECSVParser` | ✓ Implementado |
| IPAQ-EAS | EAS CSV | `IPAQCSVParser` | ✓ Implementado |
| AUDIT-C | REDCap CSV | `AUDITCCSVParser` | ✓ Implementado |
| GHQ-12 | REDCap CSV | `GHQ12CSVParser` | ✓ Implementado |
| PHQ-9 | REDCap CSV | `PHQ9CSVParser` | ✓ Implementado |
| PSQI | REDCap CSV | `PSQICSVParser` | ✓ Implementado |
| Fagerström | REDCap CSV | `FagerstromCSVParser` | ✓ Implementado |
| SBQ | REDCap CSV | `SBQCSVParser` | ✓ Implementado |

**Deuda técnica residual** (documentada en `CONTRACT-COMPLEMENTARY-STUDIES.md`):
Los instrumentos EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE, IPAQ) tienen módulos
metodológicos registrados pero varios parsers EAS derivaron inicialmente sus columnas
de forma hardcodeada. Pendiente completar la transición al estado `Validado` para
todos los módulos en `draft`. No bloquea el uso en producción.

**Restricción vigente:** Ningún estudio activa automáticamente recomendaciones ni modifica
el Plan de Acción.

---

## Hito 5 — Integración controlada de Priorización Temática REDCap

**Objetivo:** Conectar los datos de priorización ciudadana (ya importables desde REDCap)
con el resto del sistema de forma controlada y desacoplada.

Estado actual:

- La importación CSV REDCap de priorización funciona.
- La priorización está desacoplada de los motores analíticos.
- No hay conexión automática entre priorización y Plan de Acción.

Pendiente de decisión:

- ¿Qué visibilidad tiene la priorización en el análisis territorial?
- ¿Cómo se pondera junto a los datos epidemiológicos?
- ¿En qué momento del flujo se integra formalmente en el Plan Local?

**Principio rector:** La priorización es una capa deliberativa intermedia. No sustituye
al diagnóstico técnico ni genera automáticamente objetivos de Plan.

---

## Hito 6 — Interfaces para motores inteligentes

**Objetivo:** Preparar los contratos de acceso que futuros motores analíticos o de IA
usarán para consultar el estado del municipio, sin acceso directo al documento original.

Principios:

- Los motores **leen** representaciones derivadas, nunca el documento fuente.
- Los motores **proponen**, nunca deciden ni modifican el repositorio.
- Toda propuesta de un motor queda pendiente de validación técnica explícita.
- El documento original permanece íntegro e inmodificable independientemente de lo que
  los motores produzcan.

Tareas pendientes:

- Definir la interfaz de consulta canónica para motores (`MunicipalSnapshot` o superior).
- Establecer el modelo de propuesta-validación para outputs de motores.
- Decidir qué motores se incorporan primero y en qué orden.

---

## Lo que no está en esta hoja de ruta

Las siguientes capacidades están **explícitamente fuera del alcance** hasta nueva decisión:

- **Compilador del Plan Local de Salud**: producto documental compilado a partir del
  Plan de Acción validado. El Plan de Acción actual es un borrador técnico, no el Plan Local de Salud definitivo.
- Flujos de aprobación institucional, firmas o permisos.
- Conexión con Variables EAS o CMI sin intervención técnica.
- Despliegue en producción con datos reales sin revisión de seguridad.

---

## Componentes UI pendientes de integración

Los siguientes componentes existen en el código (`src/ui/components/`) pero no están
en el flujo principal de usuario. Tienen propósito futuro documentado.

| Componente | Estado | Propósito | Referencia |
|---|---|---|---|
| `QuestionnaireBuilderPanel` | Pendiente de integración | Constructor metodológico de cuestionarios municipales REDCap | VISUAL-CONTRACT §12.1 |
| `LocalHealthProfilePanel` | Legado/no canónico | Generador PSL sintético anterior a la lectura canónica actual; no debe confundirse con `PerfilLocalDeSaludPanel`, que sí está integrado en el flujo del Perfil | VISUAL-CONTRACT §12.2 |
| `StrategicFrameworkPanel` | Pendiente de integración | Traductor estratégico PSL → EPVSA / ESCA / RELAS | VISUAL-CONTRACT §12.3 |

Ninguno de estos componentes debe activarse en producción hasta Sprint 1.

---

*Última revisión: 2026-06-27 — Sprint 0 cierre definitivo: Gate 1 cerrado.*

---

## Línea futura — Memoria endocualitativa del proceso local

COMPÁS NG incorporará progresivamente una capacidad endocualitativa orientada a conservar y analizar documentación narrativa del proceso local de salud.

Ejemplos:

- actas del Grupo Motor;
- reuniones técnicas;
- entrevistas;
- grupos focales;
- talleres participativos;
- presentaciones de resultados;
- actos de priorización ciudadana;
- jornadas comunitarias;
- documentos de seguimiento;
- hitos, acuerdos, desacuerdos y cambios de orientación.

Esta línea no se implementará como automatización decisoria, sino como infraestructura para construir memoria longitudinal, trazabilidad del proceso y contexto interpretativo para profesionales de salud pública.

No se abordará antes de consolidar el Repositorio Documental Municipal, los contratos documentales y la arquitectura de Estudios Complementarios.

---

## Registro de huecos arquitectónicos

La deuda técnica, las implementaciones pendientes, las decisiones metodológicas abiertas
y las reservas arquitectónicas se clasifican en:

`docs/architecture/ARCHITECTURAL-GAP-REGISTER.md`

Este registro evita tratar como deuda técnica todo aquello que simplemente está diseñado,
reservado o pendiente de decisión metodológica.
