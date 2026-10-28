# CONTRACT-EVIDENCE-QUALITY

> Enmienda vigente SAM-3.0.0 — 2026-10-28 (ADR-SAM-001). Prevalece sobre las reglas históricas de clasificación que figuran más abajo. Cochran + FPC solo proporciona una referencia descriptiva condicionada a selección aleatoria simple. Se retiran los niveles derivados del 60 % y 100 %: las evaluaciones nuevas devuelven sampleQuality = "not-evaluable", canClassifyQuality = false y los átomos SAM nuevos confidence = "not-evaluable". Tamaño, composición y confianza son dimensiones independientes.
> coverageGlobal conserva por compatibilidad el cociente n/n teórico × 100; no es cobertura poblacional. populationRatioPercent es n/N × 100; solo se publica populationCoveragePercent cuando constan participantes únicos residentes y coincidencia de universo y periodo (participationBasis); nunca se deduce de un cociente grande. Sin verificación: «No evaluable» y motivo. No hay nuevos umbrales de calidad ni de cobertura elevada.
> describeSAM comparte la explicación entre interfaz, evidencias y perfiles nuevos. Conserva las diferencias demográficas y las celdas vacías sin convertir semejanza en representatividad. Una participación muy elevada constituye una fortaleza, sin eliminar sesgos. Los perfiles ya guardados y las evidencias históricas permanecen intactos; las nuevas notas identifican el SAM histórico. planSAMEvidenceMigration prepara una migración explícita con copia íntegra del original para archivo y sustitución revisada; no persiste nada.

> Contrato de calidad de la evidencia en COMPÁS NG.
> Versión 1.0 — Sprint 1 — 2026-06-27

---

## Propósito

Definir explícitamente qué significa "calidad de la evidencia" en COMPÁS NG y cómo debe representarse en cada capa del sistema.

---

## Flujo canónico de la evidencia

```
Dato bruto
    ↓
Calidad de la evidencia
    ↓
Interpretación asistida
    ↓
Decisión humana
```

Ninguna capa puede saltar a la siguiente sin que la anterior sea visible para el equipo técnico.

El sistema asiste; nunca sustituye la decisión técnica.

---

## Dimensiones de calidad

La calidad de la evidencia se articula en cuatro dimensiones independientes.

### 1. Calidad documental

Evalúa la fiabilidad de la fuente primaria del dato.

| Nivel | Criterio |
|---|---|
| Alto | Fuente oficial, verificada, con autoría institucional explícita. |
| Medio | Fuente reconocida pero sin verificación completa del proceso de producción. |
| Bajo | Fuente de origen incierto, sin autoría, o con proceso de producción desconocido. |

**Indicadores:**
- Autoría institucional identificada.
- Fecha de producción documentada.
- Versión o edición explícita.
- Acceso al documento fuente verificado.

---

### 2. Calidad muestral

Describe tamaño, completitud y composición; estas dimensiones no demuestran representatividad. La siguiente tabla recoge heurísticas históricas de completitud, no criterios válidos para asignar confianza SAM.

| Nivel | Criterio |
|---|---|
| Alto | n ≥ 100 con tasa de incompletos < 5 %. |
| Medio | n ≥ 30 con tasa de incompletos < 15 %. |
| Bajo | n < 30 o tasa de incompletos ≥ 15 %. |

**Indicadores:**
- n bruto (registros totales procesados).
- n válido (registros que cumplen criterios de completitud).
- Tasa de incompletos: `(n – n válido) / n × 100`.
- Procedimiento de selección muestral (aleatorio, de conveniencia, censal).
- Referencia a muestra teórica (si disponible).

**Nota sobre SampleQualityResult:**

El tipo `kind: "sample-quality"` en EvidenceAtom es el mecanismo actual para registrar la calidad muestral. Su uso es correcto para los estudios complementarios actuales.

Una evolución hacia `EvidenceQualityAssessment` (que integre las cuatro dimensiones en un único átomo estructurado) solo procede si en el futuro se requiere evaluación transversal automática de la calidad. En el Sprint 1 no se realizará esa evolución: añadiría complejidad sin beneficio inmediato demostrable.

---

### 3. Calidad metodológica

Evalúa si el instrumento o procedimiento utilizado para producir el dato es apropiado.

| Nivel | Criterio |
|---|---|
| Alto | Instrumento validado en la población de referencia con publicación peer-reviewed. |
| Medio | Instrumento con validez reportada pero no específica para la población o contexto. |
| Bajo | Instrumento sin evidencia de validez formal, o con adaptación no validada. |

**Indicadores:**
- Existencia de validación publicada.
- Adecuación del instrumento a la población diana.
- Recodificaciones reconstructivas documentadas (p. ej., regla EAS-DUKE).
- Adaptaciones no estándar identificadas.

---

### 4. Calidad inferencial

Evalúa si la conclusión derivada del dato es válida dados sus límites.

| Nivel | Criterio |
|---|---|
| Alto | Inferencia directa desde la muestra, sin extrapolación no justificada. |
| Medio | Inferencia con alguna extrapolación documentada y justificada. |
| Bajo | Inferencia que supera los límites de la muestra sin justificación explícita. |

**Indicadores:**
- ¿Se infiere sobre la población o solo sobre la muestra?
- ¿Existe comparación con referencias externas (provincial, autonómica)?
- ¿La síntesis automática indica que es derivada y requiere validación humana?

---

## Representación en el sistema

### En EvidenceAtom

La calidad se expresa en el campo `confidence`:

| Valor | Correspondencia |
|---|---|
| `"not-evaluable"` | SAM sin información suficiente de diseño; tamaño y composición no determinan confianza. |
| `"high"` | Calidad muestral alta + metodológica alta. |
| `"medium"` | Calidad muestral media o metodológica media. |
| `"low"` | Calidad muestral baja, metodológica baja, o inferencial baja. |

El campo `methodology.limitations` registra las cautelas específicas que determinan el nivel de confianza.

El campo `methodology.requiresHumanValidation` es `true` en todos los átomos derivados automáticamente.

### En el EvidenceStore

El EvidenceStore permite filtrar átomos por `confidence` mediante `getEvidenceAtomsByConfidence()`.

El EvidenceStoreIntegrityGuard valida que los átomos derivados (`qualitative-observation`) no se presenten como fuentes primarias.

### En el MIT

El Motor de Interpretación Territorial prioriza los átomos con `confidence: "medium"` y `confidence: "high"`.

Los átomos con `confidence: "low"` se incluyen como señales de alerta, no como base de inferencias.

Los átomos con `kind: "qualitative-observation"` se emplean exclusivamente como contexto de apoyo, nunca como evidencia primaria.

### En el PSL

El Perfil de Salud Local incluye la calidad de la evidencia en cada capítulo mediante la trazabilidad al EvidenceStore.

Ningún capítulo del PSL puede validarse si todos sus átomos fuente tienen `confidence: "low"`.

---

## Principio de no sustitución

La calidad de la evidencia informa. Nunca modifica los resultados del estudio.

Un dato con baja calidad muestral no se descarta: se registra con sus limitaciones y se presenta al equipo técnico para que éste decida su peso en la planificación.

---

## Referencia cruzada

- Calidad muestral → ver CONTRACT-DYNAMIC-TRIPYRAMID.md (Tripirámide Dinámica).
- Integración con EvidenceStore → ver CONTRACT-EVIDENCE.md.
- Uso por MIT → ver CONTRACT-MIT-PSL.md.

---

*La decisión territorial corresponde siempre al equipo técnico.*
