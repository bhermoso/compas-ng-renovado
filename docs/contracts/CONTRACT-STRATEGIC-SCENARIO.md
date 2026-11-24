# CONTRACT-STRATEGIC-SCENARIO

> Contrato canónico de la entidad EscenarioEstratégico en COMPÁS NG.
> Versión 1.0 — 2026-06-30
> Estado: VIGENTE

---

## Naturaleza

El `EscenarioEstratégico` es una entidad del dominio COMPÁS NG que representa,
de forma explícita y trazable, una coherencia estratégica identificada en la
intersección de dos fuentes de conocimiento:

1. El diagnóstico territorial certificado (`LocalHealthProfile` validado).
2. El conocimiento estratégico institucional disponible en el sistema
   (marcos, estrategias, planes y metodologías de referencia).

El `EscenarioEstratégico` no genera conocimiento nuevo. Hace explícito el
conocimiento que ya existe, latente, en la combinación de esas dos fuentes.

El Motor de Traducción Estratégica (MTE) identifica las coherencias estratégicas
contenidas en el diagnóstico y las hace explícitas como instancias de esta
entidad. Las coherencias son objetivas; el MTE las explicita como objetos
discretos, trazables e inmutables.

---

## Misión

Servir como unidad canónica de transferencia de conocimiento estratégico en
el ciclo de planificación de COMPÁS NG.

El `EscenarioEstratégico` agrupa el conocimiento diagnóstico de un municipio
y lo pone en relación con los instrumentos estratégicos institucionales que le
corresponden, para que los productos de planificación (Productos 6–9) puedan
operar sobre esa información de forma estructurada, trazable y sin ambigüedad.

El escenario no planifica: proporciona la base estructurada sobre la que la
planificación puede construirse.

---

## Principio de Objetividad

El `EscenarioEstratégico` representa exclusivamente relaciones objetivas
derivadas del diagnóstico territorial certificado y del conocimiento estratégico
institucional disponible.

No incorpora:

- inferencias propias del sistema;
- interpretaciones;
- recomendaciones;
- valoraciones;
- decisiones;
- priorizaciones;
- propuestas de actuación.

Si en el futuro surgiera cualquier propuesta de ampliación funcional del
`EscenarioEstratégico`, este principio prevalece sobre cualquier decisión de
implementación. Toda ampliación que no derive directamente del diagnóstico
territorial o del conocimiento estratégico institucional es incompatible con
esta entidad y pertenece a los productos consumidores.

---

## Invariantes

**I-SC-1 — Trazabilidad obligatoria al diagnóstico**
Todo `EscenarioEstratégico` tiene al menos un `areaOrigen` trazable a una
`PSLAreaIntervencion` del `LocalHealthProfile` que lo originó. Sin trazabilidad
al diagnóstico, el escenario no puede existir.

**I-SC-2 — Tema derivado, no generado**
El campo `tema` se deriva de los títulos de las áreas de origen tal como están
en el PSL. No puede sintetizarse, parafrasearse ni generarse con independencia
del PSL. Una sola área de origen: su título exacto. Varias áreas: sus títulos
separados por " · ". El tema es una etiqueta derivada, no una descripción
propia del sistema.

**I-SC-3 — Referencias institucionales citables**
Toda `ReferenciaInstitucional` incluida en el escenario traza a un elemento
verificable del conocimiento estratégico institucional disponible, e incluye
una cita canónica (`sourceTrace`) que permite verificar la correspondencia de
forma independiente.

**I-SC-4 — Tensiones restringidas**
Las tensiones del escenario son de tipo `"evidencia"` (derivadas del diagnóstico
territorial: conflictos o tensiones ya identificados en el PSL) o de tipo
`"marco"` (detectadas en divergencias entre instrumentos estratégicos para el
mismo ámbito). Ningún otro tipo de tensión puede añadirse sin revisión de este
contrato.

**I-SC-5 — Inmutabilidad**
El `EscenarioEstratégico` es inmutable desde que se explicita. Ningún producto
consumidor puede modificarlo. Los productos que lo consumen producen nuevas
entidades derivadas; no transforman el escenario. Si el `LocalHealthProfile` de
origen se revalida, los escenarios deben explicitarse de nuevo desde el nuevo PSL.

**I-SC-6 — Principio de Objetividad como invariante estructural**
El escenario no contiene texto generado autónomamente por el sistema, juicios
de valor, prioridades relativas ni prescripciones de actuación de ningún tipo.

**I-SC-7 — Coherencia de cobertura**
`sinCoberturaMarcal` es `true` si y solo si `referenciasInstitucionales` está
vacío. No puede haber escenario con cobertura declarada y sin referencias, ni
escenario sin cobertura y con referencias.

**I-SC-8 — Validación humana obligatoria**
Todo `EscenarioEstratégico`, como componente de la `LecturaEstrategicaLocal`,
porta implícitamente `requiresHumanValidation: true` heredado del artefacto
que lo contiene. Ningún producto puede tratar los escenarios como decisiones
validadas sin acto explícito de validación técnica humana.

---

## Productor autorizado

El Motor de Traducción Estratégica (MTE — Producto 5) es el único motor
autorizado a explicitar instancias de `EscenarioEstratégico` en el sistema.
Ningún otro motor, compilador ni servicio puede producir esta entidad directamente.

---

## Consumidores autorizados

| Producto | Rol respecto al escenario |
|---|---|
| **Producto 5 — MTE** | Productor: explicita escenarios desde PSL + conocimiento estratégico institucional |
| **Producto 6 — Plan de Acción** | Consumidor primario: genera objetivos y actuaciones a partir de escenarios |
| **Producto 7 — Compilador del PLS** | Consumidor documental: incorpora los escenarios como sección del Plan Local de Salud |
| **Producto 8 — Evaluación** | Consumidor de referencia: usa los escenarios como línea base conceptual del diagnóstico |
| **Producto 9 — Documento Ejecutivo** | Consumidor narrativo: usa los escenarios como estructura de comunicación |

Todos los consumidores respetan la inmutabilidad del escenario (I-SC-5).
Los consumidores producen nuevas entidades derivadas; no modifican el escenario.

---

## Prohibiciones

El `EscenarioEstratégico` **nunca** puede contener:

- actuaciones de intervención de ningún tipo;
- objetivos del Plan Local de Salud;
- responsables institucionales o técnicos;
- plazos, cronogramas o calendarios;
- presupuestos o asignaciones de recursos;
- prioridades relativas entre escenarios;
- texto generado autónomamente sin derivación directa del PSL o del conocimiento
  estratégico institucional;
- recomendaciones de cualquier tipo;
- valoraciones sobre la importancia, urgencia o gravedad de los problemas.

---

## Referencia cruzada

| Documento | Relación |
|---|---|
| `CONTRACT-MTE.md` | Define el motor que explicita `EscenarioEstratégico` |
| `CONTRACT-INTERPRETATION.md` | Capas de conocimiento; el escenario opera en la frontera entre interpretación territorial (Nivel 2) y planificación (Nivel 3) |
| `CONTRACT-MIT-PSL.md` (histórico; doctrina vigente del Perfil: `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`) | Definía el `LocalHealthProfile` como única fuente de información territorial para el Nivel 3 |
| `CONTRACT-ACTION-PLAN.md` | Define el consumidor primario (Producto 6) y la regla PSL-C1 que el MTE respeta |

---

*El conocimiento estratégico ya existe en el territorio y en los marcos institucionales.
El EscenarioEstratégico lo hace visible.*
