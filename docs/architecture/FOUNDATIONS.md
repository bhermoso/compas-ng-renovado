# COMPÁS NG — Fundamentos arquitectónicos

> Documento de referencia permanente. No debe modificarse sin decisión explícita.

---

## 1. Naturaleza del proyecto

COMPÁS NG es una reconstrucción arquitectónica desde cero de la herramienta COMPÁS.
No es una refactorización de la SPA monolítica anterior (`index.html`), sino un sistema
independiente con arquitectura modular, tipado estricto y separación clara de
responsabilidades.

La reconstrucción persigue dos objetivos simultáneos:

- **Corrección**: cada módulo hace exactamente lo que debe, sin efectos colaterales.
- **Sostenibilidad**: cualquier desarrollador puede auditar, reparar o extender el
  sistema con seguridad.

---

## 2. El municipio como unidad canónica de trabajo

Toda operación en COMPÁS NG tiene un municipio como contexto obligatorio.

- No existe estado global desligado de un municipio.
- El workspace de cada municipio se persiste de forma independiente.
- Cambiar de municipio carga un espacio de trabajo completamente distinto.
- Los municipios de demostración no comparten estado entre sí.

---

## 3. El Repositorio Documental Municipal

El **Repositorio Documental Municipal** es el núcleo del sistema. Contiene los documentos
oficiales de un municipio: informes de salud, estudios complementarios, activos
comunitarios, datos REDCap, etc.

Principios del repositorio:

- Cada documento tiene un tipo (`kind`), un identificador único y metadatos de procedencia.
- Existen **tipos canónicos** (una sola versión activa por municipio) y **tipos acumulables**
  (pueden coexistir múltiples documentos del mismo tipo).
- Tipos canónicos actuales: `health-report`, `community-asset`.
- La sustitución de un documento canónico elimina el anterior del repositorio **y** purga
  sus representaciones derivadas del `evidenceStore`.

---

## 4. El documento original como fuente de verdad

El documento original es **siempre** la fuente de verdad. Las representaciones derivadas
(átomos de evidencia, entidades estructuradas, snapshots) son **secundarias y regenerables**.

Principios:

- El documento original se preserva íntegro en el repositorio.
- Ninguna operación de análisis, síntesis o interpretación modifica el documento fuente.
- Si una representación derivada resulta incorrecta, se regenera a partir del documento
  original, nunca al revés.
- Los documentos de tipo `health-report` se preservan además como `HealthReportDocument`
  estructurado, separado del repositorio de documentos planos.

---

## 5. Representaciones derivadas

Las representaciones derivadas son estructuras generadas **a partir** de los documentos:

| Representación | Descripción |
|---|---|
| `EvidenceAtom` | Unidad mínima de evidencia estructurada extraída de un documento |
| `EvidenceStore` | Colección de átomos de evidencia de un municipio |
| `MunicipalSnapshot` | Vista agregada del estado documental de un municipio |
| `MunicipalInventory` | Inventario diagnóstico derivado del snapshot |

Estas estructuras **nunca sustituyen al documento original** y pueden ser purgadas y
regeneradas sin pérdida de información. Si un documento es sustituido, sus derivados
se eliminan junto con él.

---

## 6. Tipos canónicos frente a tipos acumulables

| Comportamiento | Tipos |
|---|---|
| **Canónico** — una sola versión activa | `health-report`, `community-asset` |
| **Acumulable** — pueden coexistir múltiples | Resto de tipos documentales |

Al ingestar un documento canónico:

1. Se elimina el documento anterior del mismo tipo del repositorio.
2. Se purgan del `evidenceStore` los átomos cuyo `provenance.origin` corresponde a ese tipo.
3. Se registra el nuevo documento y se generan sus representaciones derivadas.

Para documentos de tipo `redcap-export` cuya identidad se discrimina por tag —por ejemplo IBSE o Priorización Temática—, la canonicidad opera por `tag` mediante `removeDocumentsByTag`, no por `kind`. Véase `CONTRACT-REPOSITORY.md §4.2`.

---

## 7. Arquitectura en capas

```
domain/          Entidades, contratos y lógica de negocio pura. Sin dependencias externas.
application/     Casos de uso. Orquesta dominio. Sin acceso directo a UI ni infraestructura.
infrastructure/  Adaptadores externos: persistencia localStorage, parsers de ficheros.
ui/              Componentes React. Solo presenta datos; no contiene lógica de negocio.
```

Restricciones:

- `domain/` no importa de `application/`, `infrastructure/` ni `ui/`.
- `application/` no importa de `ui/`.
- `ui/` no importa de `infrastructure/` directamente.
- Los contratos entre capas se definen mediante interfaces TypeScript en `domain/`.

---

## 8. Trazabilidad y preservación documental

Todo `EvidenceAtom` incluye metadatos de procedencia (`provenance`):

- `origin`: tipo de fuente (`community-assets`, `health-report`, `redcap`, etc.).
- `documentId`: identificador del documento que generó el átomo.
- `sourceLabel`: título legible del documento fuente.
- `extractedAt`: marca temporal de la extracción.

Esta trazabilidad permite auditar de dónde proviene cada unidad de evidencia y regenerarla
si el documento fuente es sustituido.

---

## 9. Restricciones de generación automática

COMPÁS NG **no genera automáticamente decisiones institucionales**. Los siguientes
resultados son siempre producto de deliberación y validación humana explícita:

- Prioridades definitivas de salud del municipio.
- Aprobaciones del Plan de Acción o del Plan Local de Salud.
- Síntesis diagnósticas definitivas con carácter institucional.

COMPÁS NG **sí genera borradores técnicos orientativos**, marcados con
`requiresHumanValidation: true`, a partir del Perfil de Salud Local (PSL):

- Sugerencias de encaje con líneas estratégicas EPVSA.
- Objetivos, actuaciones e indicadores preliminares del Plan de Acción.
- Candidatos a priorización derivados de las áreas de intervención territorial.

Un borrador técnico no es una decisión. Toda propuesta del sistema requiere
revisión y validación explícita del equipo de salud pública antes de incorporarse
al proceso. Los motores analíticos son módulos deliberativos auxiliares, nunca
fuentes de decisión autónoma.

---

## 10. Principio de mínima intervención

Cada cambio en COMPÁS NG debe ser:

- **Mínimo**: acotado al bloque afectado, sin refactorizaciones no solicitadas.
- **Auditable**: con diff claro y reversible mediante los backups de sesión.
- **Verificable**: comprobado en la interfaz antes de darse por cerrado.
- **Trazable**: registrado en git con mensaje que explique el porqué, no el qué.

---

---

## Gobernanza documental

Los documentos de COMPÁS NG no tienen la misma función ni el mismo nivel normativo.

La siguiente matriz define el papel de cada uno dentro del sistema.

| Capa documental | Documento(s) principal(es) | Función | Nivel normativo |
|---|---|---|---|
| Constitución | `ARCHITECTURE-CONSTITUTION.md` | Principios permanentes | Máximo |
| Fundamentos | `FOUNDATIONS.md` | Modelo estructural del sistema | Muy alto |
| Constitución operativa | `docs/architecture/OPERATING-CONSTITUTION.md` | Reglas operativas y criterios de ejecución | Muy alto |
| Arquitectura | `docs/architecture/*` | Diseño arquitectónico y productos institucionales | Alto |
| Contratos | `docs/contracts/*` | Especificaciones verificables de implementación | Alto |
| Metodología | `docs/methodology/*` | Marco metodológico y científico | Alto |
| Gobernanza evolutiva | `docs/architecture/ARCHITECTURAL-GAP-REGISTER.md` | Gestión auditada de huecos y reservas | Alto |
| Planificación | `docs/historico/ROADMAP.md` (histórico) | Secuencia temporal de evolución | Medio |

### Jerarquía documental

En caso de discrepancia entre documentos, prevalecerá el documento situado en el nivel normativo superior:

1. `ARCHITECTURE-CONSTITUTION.md`
2. `FOUNDATIONS.md`
3. `OPERATING-CONSTITUTION.md`
4. Contratos (`docs/contracts`)
5. Arquitectura (`docs/architecture`)
6. Metodología (`docs/methodology`)
7. `ARCHITECTURAL-GAP-REGISTER.md`
8. `docs/historico/ROADMAP.md` (histórico)

El Roadmap nunca modifica la arquitectura.
El Architectural Gap Register nunca redefine contratos.
Los contratos nunca contradicen la Constitución.
Toda evolución debe respetar esta jerarquía documental.

---

*Última revisión: 2026-06-23 — §9 actualizado para distinguir borradores técnicos de decisiones institucionales.*
*Revisado: 2026-06-27 — Añadidos documentos relacionados.*
*Revisado: 2026-06-27 — Cierre Sprint 0: tabla de documentos relacionados ampliada con todos los contratos vigentes.*

---

## Principio endocualitativo

COMPÁS NG debe ser capaz de integrar evidencia cuantitativa, documental y endocualitativa.

Se entiende por evidencia endocualitativa la información narrativa generada dentro del propio proceso local de salud: actas, entrevistas, grupos focales, talleres, jornadas, reuniones del Grupo Motor, presentaciones de resultados, hitos, acuerdos, desacuerdos, rupturas, cambios de criterio y otros documentos del proceso.

Esta información debe preservarse como fuente original dentro del Repositorio Documental Municipal y podrá alimentar, en el futuro, una memoria longitudinal trazable del proceso local.

La información endocualitativa no debe utilizarse para generar automáticamente decisiones, recomendaciones ni conclusiones institucionales. Su función será contextualizar, explicar y documentar el proceso, siempre bajo validación profesional.
