# GOV-VIS-01 — Informe de auditoría visual 06b: fondos

> Contexto: COMPAS-NG-p6b · Commit 0 (previo al commit 1 de bordes).  
> Objetivo: unificar fondos de bloque grande bajo `var(--blanco)` / `var(--fondo-principal)`.  
> Fecha: 2026-10-13.

---

## 1. Criterio de clasificación: fondos claros azulados

Se consideran "fondo claro azulado" los valores hex con los tres canales RGB ≥ 235,
sesgo azul–grisáceo visible (B ≥ G ≥ R en al menos 2 de 3 canales), y sin saturación
de color de marca ni de estado (sin rojo, ámbar, verde intenso). La tabla siguiente lista
los valores encontrados y su clasificación.

| Valor | RGB | Clasificación | Motivo |
|---|---|---|---|
| `#f1f5f9` (`--fondo-secundario`) | 241 245 249 | Azul–grisáceo | Slate-100 canónico |
| `#f0f4f8` | 240 244 248 | Azul–grisáceo | Slate-100 equivalente |
| `#edf2f7` | 237 242 247 | Azul–grisáceo | Slate-100 frío |
| `#f4f7fb` | 244 247 251 | Azul–grisáceo | Muy cercano a `--fondo-principal` |
| `#f7f8fc` | 247 248 252 | Azul–grisáceo | Prácticamente igual a `--fondo-principal` |
| `#f7f9fc` | 247 249 252 | Azul–grisáceo | Variante mínima |
| `#eef2f7` | 238 242 247 | Azul–grisáceo | Variante tabla |
| `#eef6ff` | 238 246 255 | Azure de estado | Usado en activo/seleccionado → no tocar |
| `#f0f7ff` | 240 247 255 | Azure de estado | Hint informativo → no tocar |
| `#f8fbff` | 248 251 255 | Azure muy claro | Componentes internos → no tocar |
| `#f8faff` | 248 250 255 | Azure muy claro | Similar; callout interno → no tocar |

---

## 2. Selectores cambiados (→ `var(--fondo-principal)`)

| Línea | Selector | Valor anterior | Justificación de cambio |
|---|---|---|---|
| 4 | `:root` | `#f7f8fc` | Fondo body/página — contenedor raíz |
| 1331 | `.home-mission` | `#f4f7fb` | Sección de franja Home |
| 1490 | `.home-products` | `#f4f7fb` | Sección de productos Home |
| 1560 | `.home-sources` | `#f0f4f8` | Bloque de fuentes Home (padding + border + border-radius) |
| 6194 | `.territorial-comparison` | `#f7f9fc` | Panel de comparación territorial (padding + border-bottom) |

**Total: 5 sustituciones.**

---

## 3. Selectores retenidos con `--fondo-secundario` o hex azulado

Todos los usos de `var(--fondo-secundario)` (~36 ocurrencias) y los hex azulados en
selectores de componentes pequeños se conservan. La siguiente tabla cubre los casos
con mayor riesgo de duda.

| Línea | Selector | Valor | Motivo de retención |
|---|---|---|---|
| 311 | `.pcm-bulk-actions button:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 467 | `.status-pill--empty` | `var(--fondo-secundario)` | Badge/pill de estado |
| 647 | *(badge inline)* | `var(--fondo-secundario)` | Badge |
| 854 | `.app-nav__tab:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 1672 | *(pill, border-radius 999px)* | `var(--fondo-secundario)` | Badge/pill |
| 2130 | `.study-report__tag` | `var(--fondo-secundario)` | Tag de etiqueta |
| 2750 | `.workflow-step__num--info` | `var(--fondo-secundario)` | Número circular de paso |
| 3515 | `th` (tabla) | `var(--fondo-secundario)` | Cabecera de tabla (zebra equivalente) |
| 3705 | `.tp-modal__close:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 3871 | `.tp-modal__btn-cancel:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 4044 | `.tp-import-zone__hint` | `var(--fondo-secundario)` | Caja nota/callout pequeña |
| 4295–4300 | `.psl-doc-status-chip--*` | `var(--fondo-secundario)` | Chips de estado del PSL |
| 4695–4696 | `.reco-summary-chip--*` | `var(--fondo-secundario)` | Chips de recomendación |
| 4733 | `.reco-section__header:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 4911 | `.lt1-section__header:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 5540 | `.psl-doc-origin-chip` | `var(--fondo-secundario)` | Chip de origen del documento |
| 6240 | `thead th` (`.territorial-comparison`) | `#edf2f7` | Cabecera de tabla (separación zebra) |
| 6514 | `.lhpc__phase--pending .lhpc__phase-num` | `var(--fondo-secundario)` | Indicador de fase (badge) |
| 6776 | `.exp-psl-chip--empty` | `var(--fondo-secundario)` | Badge |
| 6908 | `.ev-store-panel__toggle:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 7804 | *(badge inline)* | `var(--fondo-secundario)` | Badge |
| 8667 | `.ges-btn--secondary` | `var(--fondo-secundario)` | Botón secundario (estado normal) |
| 8677 | `.ges-status-badge--archived` | `var(--fondo-secundario)` | Badge de estado archivado |
| 8683 | `.ges-badge--status-planned` | `var(--fondo-secundario)` | Badge de estado planificado |
| 8784 | `.ges-lib-card__toggle:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 8800 | `.ges-lib-var` | `var(--fondo-secundario)` | Código inline (monospace) |
| 9003 | `.ekc-alertas__count` | `var(--fondo-secundario)` | Contador circular (badge) |
| 9032 | `.ekc-alerta__tipo` | `var(--fondo-secundario)` | Etiqueta de tipo (monospace) |
| 10037 | `.pslc-viewer__meta code` | `#eef2f7` | Elemento `<code>` inline |
| 10302 | `.pv-bar__pista` | `var(--fondo-secundario)` | Pista de barra de progreso |
| 11134 | `.pie-delibera__item::before` | `var(--fondo-secundario)` | Número circular (::before) |
| 11245 | `.doc-repo__open:hover` | `var(--fondo-secundario)` | Estado `:hover` |
| 8856 | `.ekc-nivel__chip--estructuralmente-completo` | `#f4f7fb` | Badge/chip de nivel |
| 8935 | `.ekc-cobertura__estado--ok` | `#f4f7fb` | Indicador de estado (pequeño) |
| 9242 | `.ekc-hip-item__badge--resuelta-como-interpretacion` | `#f4f7fb` | Badge |
| 9472 | `.ekc-interp-item__badge--activa` | `#f4f7fb` | Badge |
| 9562 | `.ekc-interp-form--inline` | `#f4f7fb` | Modificador inline de formulario (componente, no sección) |
| 9805 | `.ekc-q-item__badge--resuelta` | `#f4f7fb` | Badge |

---

## 4. Tabla de contraste WCAG AA

Los fondos grandes usados tras este commit son `var(--blanco)` = `#ffffff` y
`var(--fondo-principal)` = `#f8fafc`. Se verifica contraste de `--texto-secundario`
sobre ambos.

### 4.1 Fórmulas

Luminancia relativa L = 0.2126·R' + 0.7152·G' + 0.0722·B'  
donde c' = c/255; si c' ≤ 0.04045 → c'/12.92; si no → ((c'+0.055)/1.055)^2.4  
Ratio = (L_claro + 0.05) / (L_oscuro + 0.05)

### 4.2 Resultados

| Texto | Valor | L(texto) | Fondo | Valor | L(fondo) | Ratio | WCAG AA (≥4.5) |
|---|---|---|---|---|---|---|---|
| `--texto-secundario` actual | `#64748b` | 0.171 | `--blanco` | `#ffffff` | 1.000 | **4.76 : 1** | ✓ |
| `--texto-secundario` actual | `#64748b` | 0.171 | `--fondo-principal` | `#f8fafc` | 0.953 | **4.55 : 1** | ✓ |
| `--texto-secundario` nuevo | `#526070` | 0.113 | `--blanco` | `#ffffff` | 1.000 | **6.44 : 1** | ✓ |
| `--texto-secundario` nuevo | `#526070` | 0.113 | `--fondo-principal` | `#f8fafc` | 0.953 | **6.15 : 1** | ✓ |

Ambos valores de `--texto-secundario` pasan WCAG AA en los dos fondos. El valor actual
`#64748b` pasa con margen mínimo sobre `--fondo-principal` (4.55 vs 4.5 umbral); el nuevo
`#526070` ofrece mayor margen en ambos fondos.

> Si se adopta `#526070` como nuevo `--texto-secundario`, este commit ya es compatible
> sin cambios adicionales en los fondos.

---

## 5. Vista previa: A (antes del commit 0) vs B (tras todos los commits)

| Área | A — antes del commit 0 | B — tras commit 0 (fondos) |
|---|---|---|
| Fondo de página | `#f7f8fc` (azul-grisáceo leve) | `#f8fafc` (`--fondo-principal`) — prácticamente igual, token canónico |
| Sección Home Mission | `#f4f7fb` | `#f8fafc` — ligeramente más cálido |
| Sección Home Products | `#f4f7fb` | `#f8fafc` |
| Bloque Home Sources | `#f0f4f8` | `#f8fafc` — cambio perceptible: el bloque pierde el tono más oscuro |
| Panel Comparación Territorial | `#f7f9fc` | `#f8fafc` — diferencia mínima |
| Hover / badges / chips | Sin cambio | Sin cambio |
| Cabecera tabla comparación | `#edf2f7` | Sin cambio (retenido para separación zebra) |

El cambio más visible es `.home-sources`: pasaba de un azul-grisáceo apreciable
(`#f0f4f8`) a blanco roto (`#f8fafc`). El resto de cambios son prácticamente imperceptibles
a nivel visual pero eliminan tokens fuera del sistema de design.

---

*Generado: 2026-10-13 · GOV-VIS-01 Commit 0 · COMPAS-NG-p6b*
