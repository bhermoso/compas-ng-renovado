# Normalización de fichas documentales de Loja y Atarfe · 20-11-2026

## Decisión y alcance

Se ha confirmado que el seed histórico de Loja contiene la ficha `doc-action-plan-loja-2022` con `kind=strategic-framework`, pese a que se trata de un **borrador histórico de Plan de Acción municipal**. Es incorrecto tratarlo como marco estratégico común.

La normalización cambia exactamente un metadato:

| Municipio | Documento | Antes | Después |
|---|---|---|---|
| Loja | `doc-action-plan-loja-2022` | `strategic-framework` | `territorial-documentation` |
| Atarfe | Ninguno | — | Sin cambios |

El documento de Loja conserva ID, título, archivo ODT referenciado, texto, etiquetas, ámbito, fechas, revisión, huella, relaciones y cualquier original registrado. El tipo `territorial-documentation` no significa que el plan sea diagnóstico; la organización funcional del Gestor documental lo muestra en **Planes de Acción municipales**, por su etiqueta `action-plan`. No crea un plan aprobado.

La corrección no se aplica por parecido en el título: exige el ID, el municipio, el tipo histórico, la escala municipal, etiquetas específicas y el nombre de archivo.

## Aplicación

La normalización se ejecuta al **hidratar el seed inicial de Loja**. No toca el seed original en el repositorio: mantiene su valor previo como evidencia de procedencia. Los nuevos expedientes construidos desde el seed presentan el tipo corregido. Las pruebas cotejan ambos seeds y confirman que Atarfe, su IBSE y sus evidencias permanecen íntegros.

## Pendiente para el expediente remoto real

**No se ha escrito ni modificado Firebase**, ni corregido automáticamente las sesiones ya guardadas en navegador o servidor. Un expediente remoto puede tener más fuentes y versiones que el seed.

Para trasladar la misma corrección a un expediente ya activo, deben cumplirse los siguientes controles: (1) leer Firebase autenticado; (2) descargar y comprobar copia íntegra incluyendo originales; (3) comprobar en vivo los metadatos exactos del documento; (4) presentar diferencia de un solo campo y revisión remota esperada; (5) guardar de forma atómica con control de concurrencia y (6) cotejar el expediente tras guardar. No se debe activar una migración de toda la base a partir del seed.

No borrar, reemplazar ni resucitar documentos por una corrección de etiqueta.
