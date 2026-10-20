# COMPÁS NG — Contrato de Identidad Visual

> Contrato arquitectónico de producto. No es una guía CSS ni un catálogo de componentes.
> Define la identidad institucional de COMPÁS NG y los principios visuales permanentes
> que deben respetarse en cualquier interfaz, cuaderno, informe o documentación.
> Los valores de color, tipografía y composición son la expresión material de estos
> principios, no reglas técnicas de implementación.
> Última revisión: 2026-06-27 — Sprint 0 cierre definitivo: referencias institucionales añadidas, §5 gramática visual de capas, §11 LocalHealthPlanningCycle, §12 componentes pendientes.

---

## Naturaleza de este documento

Este documento es un **contrato de identidad institucional**, no una guía de estilos CSS.

Establece qué debe transmitir visualmente COMPÁS NG y qué no. Define principios permanentes
que evolucionarán junto con la plataforma pero nunca se abandonarán.

La implementación concreta de estos principios (valores CSS, nombres de clase, estructura de componentes)
está en `src/App.css` y los componentes de `src/ui/components/`. Esos ficheros son la
traducción técnica de este contrato; no lo definen ni lo sustituyen.

---

## 0. Referencias institucionales

El diseño visual de COMPÁS NG se inspira en dos referencias institucionales canónicas:

### NHS Health Profiles (England)

Los NHS Local Health Profiles de Public Health England son el modelo de referencia
para la presentación de datos de salud territorial. Sus características visuales
son aplicables a COMPÁS NG:

- Alta densidad informativa en espacio compacto
- Tipografía como elemento estructural primario
- Tablas y bloques de datos en lugar de charts decorativos
- Indicadores simples (colores binarios: favorable / desfavorable)
- Presentación editorial, no de dashboard
- El documento de datos parece un documento institucional, no una aplicación

### Formularios REDCap

REDCap es el sistema de captura de datos habitual en los Estudios Complementarios.
Sus principios de presentación de formularios son aplicables a las interfaces de
revisión y validación de COMPÁS NG:

- Formulario estructurado con campos etiquetados
- Estado visible de cumplimentación por sección
- Jerarquía de grupos → campos → validación
- Sin decoración innecesaria; el formulario es el contenido

### Lo que NO es COMPÁS NG

COMPÁS NG no es ninguna de estas cosas:

- **No es SaaS**: no tiene features, plans, dashboards ni onboarding.
- **No es producto IA**: no tiene chat, copilot widget ni sugerencias animadas.
- **No es aplicación React**: no tiene tarjetas flotantes, gradientes de fondo ni transiciones de showcase.
- **No es dashboard corporativo**: no tiene KPIs circulares, barras de progreso decorativas ni métricas de vanidad.

Si la interfaz en algún momento recuerda a cualquiera de estos cuatro tipos, ese
elemento debe revisarse antes de mergear.

---

## 1. Principio rector

COMPÁS NG es una herramienta institucional de salud pública. Su apariencia visual debe
transmitir **rigor, confianza y claridad documental**.

La identidad visual es institucional y sobria. COMPÁS NG no es una aplicación de consumo,
no es una startup y no es un prototipo experimental. Cualquier elemento visual que evoque
esas categorías debe eliminarse.

### Test de identidad

COMPÁS NG debe reconocerse como tal aunque desaparezcan todos los textos. Si eliminar
todos los textos hace que la interfaz sea indistinguible de un dashboard SaaS genérico,
la identidad visual es insuficiente.

---

## 2. Paleta de color

### Gradiente institucional COMPÁS

```
linear-gradient(90deg,
  #0074c8  0%,
  #00acd9 20%,
  #94d40b 40%,
  #ffb61b 60%,
  #ff6600 80%,
  #dc143c 100%)
```

**Uso autorizado:** franja de identidad en cabeceras principales, portadas de cuadernos,
bordes decorativos de fichas técnicas e informes institucionales.

**Uso prohibido:** fondos de pantalla completa, fondos de cards, elementos interactivos,
textos, iconos.

**Excepción de marca (enmienda 2026-10-20, decisión del autor):** el gradiente institucional
puede aplicarse al texto del **wordmark «COMPÁS»** de la portada y de las portadas de
documentos institucionales. Es la herencia visual del COMPÁS histórico (COMPAS-RESCATE-20260514)
que el autor decide conservar como firma de marca.

- Alcance: solo el wordmark. Ningún otro texto (subtítulos, encabezados, cuerpo, etiquetas,
  botones, enlaces) lleva gradiente.
- Composición del wordmark: mayúsculas, peso semibold–bold, espaciado de letras amplio y la
  misma familia sans del resto de la interfaz. No es una fuente decorativa.
- Legibilidad: el wordmark es un logotipo, no texto informativo. El nombre sigue siendo texto
  real en el documento (accesible a lectores de pantalla y copiable). El ámbar y el lima del
  gradiente tienen contraste bajo sobre blanco; por eso la excepción no se extiende a texto
  que deba leerse.
- Esta excepción no modifica §6: no autoriza gradientes de fondo, tipografía editorial ni
  varios colores de acento en componentes de datos. Las barras por fase de la portada
  (un color por columna, solo en el borde) ya cumplen «un acento por componente» y no
  requieren excepción.
- Logos institucionales: este contrato no autoriza su uso. Su publicación depende de la
  autorización registrada en `logoRegistry` (estado `CONFIRMADA`) y de los ficheros originales
  oficiales. El 2026-10-20 el autor confirma en chat la caja de cinco logos del COMPÁS histórico
  en la portada; los ficheros actuales son provisionales (baja resolución) hasta tener los
  originales.
- Botones secundarios: fondo blanco, borde fino y borde izquierdo de 3 px en azul institucional
  (herencia del histórico). Un solo acento por botón; no se aplica a botones primarios, de
  peligro ni a los que se presentan como enlace.

### Colores primarios

| Token | Valor | Uso |
|---|---|---|
| Azul institucional | `#0074c8` | Acento primario, enlaces activos |
| Azul claro | `#00acd9` | Acento secundario, destacados |
| Verde salud | `#94d40b` | Indicadores positivos, confirmaciones |
| Ámbar | `#ffb61b` | Alertas, cautelas metodológicas |
| Naranja | `#ff6600` | Prioridades, énfasis de acción |
| Rojo | `#dc143c` | Errores, indicadores críticos |

### Neutros

| Uso | Valor |
|---|---|
| Fondo principal | `#f8fafc` |
| Fondo secundario | `#f1f5f9` |
| Bordes | `#e2e8f0` |
| Texto principal | `#1e293b` |
| Texto secundario | `#64748b` |
| Blanco | `#ffffff` |

---

## 3. Tipografía

- **Jerarquía clara**: h1 → h2 → h3 → cuerpo con diferenciación visible entre niveles.
- **Sin fuentes decorativas**: solo tipografía del sistema o fuentes sans-serif neutras.
- **Cuerpo legible**: tamaño mínimo 14 px en pantalla, interlineado generoso (1.5–1.6).
- **Peso semibold** para títulos de panel y etiquetas institucionales.
- **Mayúsculas pequeñas** (`eyebrow`) solo para epígrafes de sección, nunca en cuerpo.
- **Monospace** exclusivamente para código, identificadores técnicos y valores de datos.

---

## 4. Composición y densidad visual

- Predominio de **blanco y grises claros** como fondo dominante.
- **Baja densidad visual**: espacio en blanco generoso, márgenes amplios.
- Los paneles de contenido tienen fondo blanco sobre fondo de página gris muy claro.
- Los cards no usan sombras pronunciadas: máximo `box-shadow` sutil (1–2 px, opacidad baja).
- El color se usa **de forma contenida**: un acento por componente, no múltiples colores
  compitiendo.
- Las listas de documentos y evidencias usan separadores finos, no franjas de color.

---

## 5. Gramática visual de las capas del conocimiento

COMPÁS NG trabaja con seis capas conceptuales distintas. La interfaz debe
representar visualmente estas capas de forma que el usuario pueda distinguirlas
sin ambigüedad. Esta distinción no es estética: es epistémica.

### 5.1 Documento (Capa 1)

**Qué representa**: fuente primaria original preservada en el repositorio.

**Tratamiento visual**:
- Identificado con el tipo canónico ("Informe de Salud", "Estudio complementario",
  "Activo comunitario") como etiqueta primaria.
- Badge "Documento fuente principal" para el Informe de Salud.
- El texto completo del documento fuente no se muestra directamente; se accede
  a través de un acordeón o visor con indicación explícita de su naturaleza
  primaria.
- Nunca mezclado con unidades de evidencia derivadas.

### 5.2 Evidencia (Capa 2)

**Qué representa**: representación estructurada de contenidos del documento,
en forma de `EvidenceAtom`.

**Tratamiento visual**:
- Presentada en sección separada del repositorio documental ("Evidencias
  estructuradas"), nunca en la misma lista que los documentos.
- Identificada por su tipo semántico (Indicador, Determinante, Activo
  comunitario, etc.), no por su estructura técnica interna.
- Acompañada de su fuente de origen en lenguaje institucional
  ("Informe de Salud", "IBSE", "Participación ciudadana"), nunca de
  identificadores técnicos internos (`health-report`, `ibse`, etc.).
- No muestra campos técnicos de implementación (`provenance.documentId`,
  `requiresHumanValidation`) en la vista normal del usuario.

### 5.3 Interpretación (Capa 3)

**Qué representa**: lectura estructurada del conjunto de evidencia,
producida por el MIT y la Reconciliación.

**Tratamiento visual**:
- Presentada en la pestaña "Análisis territorial", separada del repositorio.
- Siempre acompañada de indicación de que requiere revisión técnica.
- Los resultados de interpretación (lectura territorial, áreas de
  intervención) se muestran antes que el estado del proceso interno.
- Los términos técnicos del motor (MIT, LT1, OIT, MIR) no aparecen en
  la interfaz principal. Se usan lenguaje institucional equivalente.

### 5.4 Hipótesis y deliberación (Capas 4–5)

**Qué representa**: proposiciones técnicas y proceso de consenso.

**Tratamiento visual**:
- Las propuestas asistidas del sistema (candidaturas técnicas, sugerencias
  de priorización) llevan siempre el badge "Propuesta asistida · Pendiente
  de revisión técnica" o equivalente.
- El espacio de deliberación (capítulos V, VI, VII del PSL) se distingue
  visualmente del contenido generado mediante la zona de edición del equipo
  técnico.
- Nunca se presenta una propuesta asistida como si fuera el resultado de
  una deliberación ya realizada.

### 5.5 Decisión institucional (Capa 6)

**Qué representa**: compromisos formales validados institucionalmente.

**Tratamiento visual**:
- El estado `validated` del PSL se representa con indicador visual diferenciado
  (fondo, borde o etiqueta de validación con nombre y fecha del responsable).
- Los paneles del Nivel 3 (EPVSA, Plan de Acción, Agenda, Seguimiento) están
  visualmente bloqueados hasta que el PSL está validado.
- Un PSL en estado `generated` nunca tiene apariencia de documento aprobado.

### 5.6 Principio de separación visual

La interfaz de COMPÁS NG debe impedir que el usuario confunda:

- un documento fuente con una unidad de evidencia derivada;
- una lectura asistida del sistema con un diagnóstico técnico validado;
- una propuesta de priorización con una decisión deliberada;
- un borrador técnico con un Plan de Acción aprobado.

Cuando exista ambigüedad visual entre capas, debe resolverse siempre
a favor de la mayor cautela: marcar como provisional, no como definitivo.

---

## 6. Elementos prohibidos

Los siguientes elementos están explícitamente excluidos del sistema visual de COMPÁS NG:

- Gradientes como fondos de pantalla o de cards.
- Animaciones de entrada/salida llamativas (fade-in largo, slide-up, bounce).
- Iconos decorativos sin función semántica.
- Colores de acento múltiples en un mismo componente.
- Tipografía de display o editorial.
- Estilos que recuerden a dashboards de BI, herramientas SaaS o apps móviles de consumo.
- Badges, pills o etiquetas en colores saturados como decoración.
- Efectos de glassmorphism, neumorphism o similares.

---

## 7. Animaciones y transiciones

Las animaciones solo están justificadas cuando **aportan significado funcional**:

- Indicar que un proceso está en curso (spinner de carga, indicador de progreso).
- Confirmar que una acción se ha completado (transición de estado suave).
- Orientar la atención del usuario hacia un cambio de estado relevante.

Especificaciones:

- **Duración**: 150–250 ms para transiciones de estado; máximo 400 ms para cambios de vista.
- **Easing**: `ease-in-out` o `ease-out`. Nunca `bounce`, `elastic` ni similares.
- **Propiedades animables**: `opacity`, `transform` (solo translate/scale suave). Evitar
  animar `height`, `width` o `color` directamente por coste de repaint.
- Las animaciones **nunca deben comprometer la legibilidad** del contenido durante la transición.
- En contextos de accesibilidad (`prefers-reduced-motion`), todas las animaciones deben
  eliminarse o reducirse a cambios instantáneos.

---

## 8. Principios de aplicación

Estos principios se aplican a toda superficie del producto: interfaz de la aplicación,
cuadernos de trabajo, informes, fichas técnicas y documentación.

### 7.1 Interfaz de la aplicación

- La barra de navegación principal lleva la franja del gradiente COMPÁS como único
  elemento de identidad cromática.
- Los paneles de contenido tienen fondo blanco sobre fondo de página gris muy claro.
- El estado de los documentos y estudios se indica con indicadores visuales sobrios
  (puntos, bordes, etiquetas monocromáticas), nunca con badges de color.
- Los botones de acción primaria usan el azul institucional (`#0074c8`).
- Las listas de documentos y evidencias usan separadores finos, no tarjetas flotantes.

### 7.2 Cuadernos y documentación

- La portada lleva la franja del gradiente COMPÁS como elemento de identidad.
- El cuerpo usa tipografía sobria, jerarquía clara y márgenes amplios.
- Las secciones se separan por líneas finas, no por bloques de color.
- El gradiente no se representa en Markdown; se menciona como referencia de color.

### 7.3 Informes y fichas técnicas

- La cabecera lleva el wordmark COMPÁS junto a la franja del gradiente institucional.
- Los datos y cifras clave usan tamaño mayor y peso semibold, con el azul institucional
  como único color de acento.
- Las notas metodológicas se separan visualmente del cuerpo con tipografía menor.

---

## 9. Componente permanente: Ciclo de Planificación Local

El componente `LocalHealthPlanningCycle` es un **elemento arquitectónico permanente** de
la interfaz de COMPÁS NG. Representa el expediente institucional del municipio en su
ciclo completo de planificación local de salud.

### 8.1 Propósito

Comunicar al usuario en todo momento:

- en qué fase se encuentra el municipio;
- qué fases están completadas, en curso o pendientes;
- qué fases están bloqueadas y por qué;
- qué fases requieren revisión o validación.

### 8.2 Fases representadas

1. Adhesión a RELAS
2. Informe de Salud
3. Perfil de Salud Local
4. Priorización
5. Plan de Acción
6. Agendas anuales
7. Plan Local de Salud

### 8.3 Estados de fase

| Estado | Significado |
|---|---|
| Completada | La fase tiene los requisitos documentados |
| En curso | La fase está en proceso activo |
| Pendiente | La fase aún no ha comenzado |
| No disponible | Faltan requisitos de fases anteriores |
| Revisar | La fase fue completada pero la evidencia ha cambiado |

### 8.4 Principios de identidad del componente

- El estado se **infiere automáticamente** desde el workspace (documentos, evidencias,
  validaciones). No se inventa ningún estado que el sistema no pueda verificar.
- Se muestra **siempre visible** en todas las vistas, entre la cabecera de navegación y
  el contenido específico de cada vista.
- Usa **lenguaje institucional** exclusivamente. No expone términos técnicos del pipeline
  interno (MIT, MIR, OIT, pipeline, traza, motor).
- El diseño es **sobrio y funcional**: franja compacta horizontal, indicadores monocromáticos,
  sin animaciones, sin badges en colores saturados.
- Los estados `blocked` y `pending` usan grises muy claros; `current` usa el azul
  institucional como único acento; `completed` usa el verde salud de forma contenida.

### 8.5 Implementación

- Archivo: `src/ui/components/LocalHealthPlanningCycle.tsx`
- Posición en App: entre `</nav>` y `<main>`, renderizado en todas las vistas
- Estilos: clase raíz `.lhpc` y modificadores `.lhpc__phase--{status}` en `src/App.css`

---

## 11. Evolución del Ciclo de Planificación Local

El componente `LocalHealthPlanningCycle` en su estado actual es una franja horizontal
funcional. Esta sección documenta su dirección de evolución hacia un **monitor institucional
de proceso**, sin autorizar su implementación hasta Sprint 1.

### 11.1 Dirección de evolución

El ciclo debe evolucionar desde "segunda navegación" hacia "monitor de estado del expediente":

- **Aspecto**: proceso administrativo institucional, no wizard de pasos
- **Formato**: banda horizontal continua con bloques densos
- **Densidad**: alta — cada bloque muestra fase, estado y subestado en espacio compacto
- **Gradiente**: la progresión de fases forma un gradiente visual discontinuo, donde
  las fases completadas tienen más "peso visual" que las bloqueadas
- **Indicador activo**: la fase en curso se resalta de forma discreta (no tab activo, no badge)
- **Referencias**: comparable al indicador de progreso de un expediente REDCap o al
  mapa de estados de un NHS Health Profile

### 11.2 Lo que NO debe ser

- No debe parecerse a una barra de progreso de onboarding
- No debe parecerse a tabs de navegación secundaria
- No debe tener colores saturados en las fases completadas
- No debe tener animaciones de transición entre estados

### 11.3 Contrato de implementación futura

Cuando se implemente la versión evolucionada, deberá:

1. Preservar la lógica de inferencia de `derivePhases()` sin modificación
2. Preservar el tipo `PhaseStatus` y sus 5 estados
3. Preservar la propiedad `navigateTo` y el callback `onNavigate`
4. Cambiar exclusivamente la presentación visual (CSS y estructura HTML del render)
5. Verificar con Atarfe como municipio canónico antes de mergear

---

## 12. Componentes UI pendientes de integración

Los siguientes componentes existen en el código pero no están actualmente en el flujo
principal de usuario. No son prototipos: son implementaciones con propósito futuro
documentado. No deben eliminarse. No deben activarse en producción hasta que su
propósito esté completamente implementado.

### 12.1 QuestionnaireBuilderPanel

**Propósito futuro**: Constructor metodológico de cuestionarios municipales.

Permitirá combinar, dentro de un cuestionario único:

- bloques de clasificación sociodemográfica (EAS, INE, IECA)
- escalas psicométricas validadas (IBSE, SF-12, DUKE, PREDIMED y futuras)
- módulos de participación ciudadana
- instrumentos propios del municipio

Manteniendo la identidad metodológica de cada instrumento: sin fusionar ítems de
distintas escalas, sin redefinir opciones de respuesta, sin alterar algoritmos
canónicos. El cuestionario resultante puede exportarse como diccionario REDCap.

**Aspecto institucional previsto**: formulario REDCap — estructurado, denso, con
jerarquía visible de grupos, ítems y opciones de respuesta. No un editor gráfico.

### 12.2 LocalHealthProfilePanel

**Propósito futuro**: Generador del Perfil de Salud Local sintético.

Inspirado en los NHS Local Health Profiles y Public Health England, será un visor
compacto que sintetiza el estado de salud territorial del municipio a partir del PSL.
Alimentado exclusivamente desde: Repositorio → EvidenceStore → PSL.

Su output debe percibirse como un documento institucional, no como un dashboard.
Los indicadores se presentarán en formato editorial: filas de datos con descripción,
valor, referencia provincial y tendencia, sin charts decorativos.

### 12.3 StrategicFrameworkPanel

**Propósito futuro**: Traductor estratégico entre PSL y planificación.

Conectará las áreas de intervención del PSL con los marcos estratégicos institucionales:
EPVSA, ESCA, RELAS, Plan Estratégico de Mayores de Andalucía, En Buena Edad y otros
marcos autorizados. Facilitará al equipo técnico la correspondencia entre el diagnóstico
territorial y las líneas de acción disponibles.

No es un catálogo. Es un puente metodológico entre interpretación y decisión.

---

## 13. Relación con la implementación

Los valores concretos de este contrato (paleta de color, tipografía, composición) se
implementan en `src/App.css`. Los componentes de `src/ui/components/` los aplican.

Cuando exista contradicción entre este contrato y la implementación técnica, prevalece
el contrato. La implementación debe corregirse, nunca el contrato.

Este contrato no debe convertirse en un catálogo de reglas CSS. Si una regla de
implementación no puede expresarse como principio de identidad, pertenece al código,
no a este documento.

## 14. Relación con el Contrato de Navegación

`CONTRACT-NAVIGATION` complementa este documento en la capa semántica: define qué vocabulario es visible para el usuario, qué representa cada espacio de trabajo y los principios para el ciclo institucional. Ambos contratos operan en planos distintos y no se contradicen:

- Este contrato governa **cómo se ve** la interfaz (identidad visual, estilo, composición).
- `CONTRACT-NAVIGATION` governa **qué se dice y qué representa** la interfaz (vocabulario, semántica, estructura institucional).

En caso de tensión entre principios visuales y principios semánticos, el caso debe revisarse explícitamente. No existe jerarquía predefinida entre los dos contratos en sus planos respectivos; la jerarquía aplica cuando ambos tratan el mismo objeto.

---

*Primera versión: 2026-06-21 — Contrato formalizado tras estabilización de Zagra.*
*Revisado: 2026-06-27 — Transformado en contrato de identidad institucional.*
*Revisado: 2026-06-27 — Sprint 0B: §9 Ciclo de Planificación Local.*
*Revisado: 2026-06-27 — Sprint 0 cierre definitivo: §0 Referencias institucionales
(NHS Health Profiles, REDCap); §11 Evolución LocalHealthPlanningCycle; §12 Componentes
pendientes de integración; §10 renumerado §13.*
*Revisado: 2026-10-20 — §2: excepción de marca para el wordmark «COMPÁS» (gradiente en el texto del
logotipo, sin extenderse a otros textos).*
