# COMPÁS NG · Segunda pasada de unificación visual

**Fecha:** 4 de noviembre de 2026  
**Referencia de identidad:** [VISUAL-CONTRACT.md](VISUAL-CONTRACT.md)  
**Referencia editorial:** portada COMPÁS y principio NHS de densidad informativa.

## Alcance

Esta intervención continúa la PR #103. No cambia el contrato ni la identidad
de la portada: blanco, gris institucional, tipografía sans y seis colores COMPÁS
restringidos a la marca y al ciclo. El azul sigue siendo el único acento
interactivo ordinario. Las advertencias clínicas, metodológicas y de seguridad
conservan el color **solo como señal semántica contenida**, preferentemente
en un borde, nunca como una gran superficie coloreada.

| Superficie | Estilos afectados | Patrón aplicado |
| --- | --- | --- |
| Diagnóstico territorial | `App.css` · `diag-*`, `diagnosis-*` | Paneles y estados convertidos en filas legibles y avisos discretos |
| Priorización temática | `App.css` · `tp-*` | Casillas, ranking y modal neutros, selección azul sin cajas rellenas |
| Plan de Acción y RELAS | `App.css` · `pcm-*`, `plan-*` | Formularios, navegación lineal, decisiones y trazabilidad sin rellenos cromáticos |
| Estudios y calidad metodológica | `App.css` · `study-*` | Dictámenes de calidad y umbrales como etiquetas con bordes semánticos |
| Evidencias, PSL histórico y administración | `App.css` · `psl-doc-*`, `reco-*`, `ges-*`, `pai-*` | Notificaciones y estados de revisión sin pastillas saturadas |
| Agenda de implantación | `AgendaBoard.css` | Tablero funcional, columnas neutras, prioridades con marca fina |
| Participación ciudadana | `CitizenParticipationSummary.css` | Rankings y tablas, sin tarjetas decorativas |
| Paneles SAM | `SamAssessmentPanel.css`, `SamObservedAssessment.css`, `SamTriPyramid.css` | Tablas y señales; patrón de barras conservado por su función analítica |
| Espacio de coordinación independiente | `CoordinatorPreview.css` | Cabecera con franja canónica y contenido editorial; botones blancos |
| Navegación transversal | `index.css` | Sin pastillas decorativas y neutros canónicos |

## Salvaguardas

- Los estados **validado**, **pendiente**, **sin cobertura** y **error**
  permanecen distintos en el texto y en líneas de verde, ámbar o rojo
  respectivamente; no se presentan como si una operación provisional
  estuviese validada.
- La altura, los datos y la interacción del formulario no dependen de
  un color. Se mantienen etiquetas, focos de teclado, tablas, filtros,
  cuadros de confirmación y texto de cautela.
- Las barras de encuesta y la pirámide SAM conservan sus representaciones
  analíticas: la trama de la pirámide no es un degradado decorativo.
- El tamaño del contenido sigue respondiendo en móvil.
- No se modifica Firestore, IndexedDB, el contenido municipal ni la
  interpretación epidemiológica.

## Regresión y alcance del control

`tests/visual-historical-guardrails.test.ts` comprueba la preservación
de la portada y el uso de filas, la reserva de los colores, la navegación,
la separación semántica de estados y la pantalla independiente de
coordinación. Continúan los tests de la PR #103 para el Perfil y Firebase.

**Deuda técnica documentada:** `App.css` conserva declaraciones históricas
anteriores al bloque «SEGUNDA PASADA»; la nueva capa las neutraliza visualmente
en las superficies inspeccionadas, pero todavía no se ha eliminado línea por
línea el código heredado. Los tests de regresión inspeccionan el bloque final
y los estilos de componentes revisados. Una limpieza mecánica completa requerirá
comprobación visual de cada vista y de las salidas impresas para no perjudicar
estados ni datos que aún dependan de reglas antiguas.

**Verificación remota:** la compilación y CI no equivalen a un recorrido
completo en el expediente autenticado de todos los municipios. Queda la
comprobación visual de Diagnóstico, Perfil, Priorización, Plan y Agenda en
una sesión real de COMPÁS.
