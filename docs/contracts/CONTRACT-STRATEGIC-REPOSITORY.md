# CONTRACT-STRATEGIC-REPOSITORY

> Contrato del Repositorio Estratégico Territorial de COMPÁS NG.
> Versión 1.1 — Sprint 1 — 2026-06-27

---

## Estado

**Diseño conceptual. No implementar en Sprint 1.**

Este contrato define la estructura, las responsabilidades y los contratos de datos del Repositorio Estratégico Territorial. La implementación se realizará cuando el Motor de Traducción Estratégica esté listo para consumirlo.

---

## Propósito

El Repositorio Estratégico Territorial almacena los recursos normativos, estratégicos y programáticos que sirven de referencia para la elaboración de Planes Locales de Salud.

No es una base de conocimiento general. Es el conjunto de recursos estratégicos que el equipo técnico reconoce como marcos de referencia para su territorio.

---

## Denominaciones canónicas en COMPÁS NG

Los siguientes acrónimos tienen un único significado válido dentro de COMPÁS NG, independientemente de cualquier uso externo al proyecto. El contrato fija estas denominaciones.

| Acrónimo | Denominación oficial canónica |
|---|---|
| ESCA | Estrategia de Salud Comunitaria de Andalucía (2026–2030) |
| RELAS | Red Local de Acción en Salud |
| RELAS-G | Guías metodológicas de la Red Local de Acción en Salud |
| EBE | En Buena Edad |
| PSMA | Plan de Salud Mental de Andalucía |
| PEM | Plan Estratégico de Personas Mayores de Andalucía |
| EPVSA | Estrategia de Promoción de una Vida Saludable en Andalucía |

---

## Recursos que puede albergar

| Recurso | Acrónimo | Tipo |
|---|---|---|
| Estrategia de Salud Comunitaria de Andalucía (2026–2030) | ESCA | Estrategia de salud |
| Red Local de Acción en Salud | RELAS | Marco estratégico-programático |
| Guías metodológicas RELAS | RELAS-G | Guía metodológica |
| En Buena Edad | EBE | Marco programático |
| Plan de Salud Mental de Andalucía | PSMA | Plan estratégico |
| Plan Estratégico de Personas Mayores de Andalucía | PEM | Plan estratégico |
| Estrategia de Promoción de una Vida Saludable en Andalucía | EPVSA | Referencia epidemiológica |
| Otros | — | A determinar por el equipo técnico |

---

## Contrato de datos de un recurso estratégico

```typescript
// Diseño conceptual — no implementar todavía

interface StrategicResource {
  id: string;
  name: string;
  acronym: string;
  type: "strategy" | "strategic-plan" | "epidemiological-reference" | "programmatic-guide" | "normative-framework";
  issuer: string;              // institución emisora
  year: number;
  version?: string;

  lines: StrategicLine[];
  objectives: StrategicObjective[];
  indicators: StrategicIndicator[];
  actions: StrategicAction[];
  programmes: StrategicProgramme[];

  targetPopulation: string[];  // grupos poblacionales diana
  determinants: string[];      // determinantes de salud abordados
  communityAssets: string[];   // activos comunitarios referenciados
  references: string[];        // bibliografía y normativa base

  // Metadatos de carga
  loadedAt: string;
  loadedBy?: string;
  sourceDocumentId?: string;
}

interface StrategicLine {
  id: string;
  code: string;
  title: string;
  description?: string;
}

interface StrategicObjective {
  id: string;
  lineId: string;
  code: string;
  title: string;
  description?: string;
  indicators: string[];  // referencias a StrategicIndicator.id
}

interface StrategicIndicator {
  id: string;
  objectiveId: string;
  title: string;
  measurementUnit?: string;
  baseline?: number;
  target?: number;
}

interface StrategicAction {
  id: string;
  objectiveId: string;
  title: string;
  description?: string;
  targetPopulation?: string[];
}

interface StrategicProgramme {
  id: string;
  title: string;
  description?: string;
  actionIds: string[];
  targetPopulation?: string[];
}
```

---

## Responsabilidades del Repositorio

1. **Almacenar** recursos estratégicos validados por el equipo técnico.
2. **Indexar** líneas, objetivos, indicadores y actuaciones para su recuperación.
3. **Exponer** la estructura a los motores de nivel superior (Motor de Traducción Estratégica).
4. **No inferir** ninguna correspondencia automática entre el PSL y los recursos estratégicos. Esa es la función del Motor de Traducción Estratégica.

---

## Lo que el Repositorio no hace

- No evalúa si un recurso es aplicable al municipio.
- No sugiere actuaciones.
- No pondera objetivos.
- No genera texto narrativo.
- No establece alineaciones automáticas con el PSL.

Toda lógica de aplicación territorial pertenece al Motor de Traducción Estratégica.

---

## Diferencia respecto al MunicipalDocumentRepository

| | MunicipalDocumentRepository | StrategicRepository |
|---|---|---|
| Contenido | Documentos del municipio concreto | Recursos estratégicos supramunicipales |
| Alcance | Específico por municipio | Compartido por todos los municipios |
| Estructura | Documentos sin esquema fijo | Recursos con esquema estructurado |
| Función | Trazabilidad documental | Referencia para traducción estratégica |

---

## Ciclo de vida de un recurso

```
Carga manual por el equipo técnico
    ↓
Revisión de estructura (validación de campos obligatorios)
    ↓
Registro en el Repositorio
    ↓
Disponibilidad para el Motor de Traducción Estratégica
    ↓
[Actualización o sustitución por versión posterior]
```

---

## Referencia cruzada

- Motor de Traducción Estratégica → CONTRACT-STRATEGIC-TRANSLATION.md
- Documentos municipales → CONTRACT-REPOSITORY.md
- Perfil de Salud Local → CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md (antes CONTRACT-MIT-PSL.md, histórico)

---

*La decisión territorial corresponde siempre al equipo técnico.*
