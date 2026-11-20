# Reorganización municipal: Atarfe y Loja (20-11-2026)

## Alcance comprobado

Se inspeccionaron los expedientes iniciales del repositorio (seeds), **no los datos actuales remotos de Firebase**.

### Atarfe, INE 18022

- Informe de la situación de salud en Atarfe, ficha `doc-health-report-atarfe`, original nombrado `Informe_Salud_Atarfe.docx`.
- Estudio IBSE REDCap municipal, ficha `doc-ibse-atarfe`, `ibse-atarfe.csv`; agregado `ibseStudy` y evidencias del expediente conservados.
- Inventario Localiza Salud, ficha `doc-localiza-atarfe`.

**No hay registros `strategic-framework` en el seed de Atarfe**: no hace falta retirar planes comunes de estas tres fichas. Las fuentes, los agregados IBSE y los vínculos permanecen municipales.

### Loja, INE 18122

- `doc-health-report-loja-historical`: informe histórico de salud.
- `doc-profile-loja-complete`: Perfil de Salud Local histórico completo, como documentación territorial, no informe primario nuevo.
- `doc-health-update-loja-2019` y `doc-profile-update-loja-2020`: dos estudios/actualizaciones complementarios.
- `doc-prioritisation-loja-2022`: material de priorización participativa.
- `doc-action-plan-loja-2022`: borrador histórico de Plan de Acción municipal, con `territorialScale=municipio` y etiqueta `action-plan`.

La sexta ficha está **mal encuadrada formalmente** como `kind=strategic-framework` en el seed histórico. En la nueva organización se presenta como **Plan de Acción municipal**; no se envía a la biblioteca estratégica común ni se modifica su registro persistido, ID o trazabilidad.

## Qué se ha cambiado

`municipal-document-organization.ts` y el Gestor documental ofrecen una **lectura funcional agrupada** en: informes, perfiles, estudios, activos, priorización, planes locales, referencias estratégicas y otras fuentes. Se muestran recuentos de los grupos presentes; el catálogo conserva búsqueda, estados, acceso a fichas, procedencia, vínculos y originales. Los documentos no se duplican ni se eliminan por cambiar de sección.

Las pruebas ejecutan la clasificación **sobre ambos archivos seed JSON reales** y comprueban que todos los IDs sobreviven sin alterar el contenido original.

## Límites y siguientes compuertas

- No se han eliminado fichas, PDF, DOCX, CSV ni textos.
- No se ha reescrito Firebase ni el almacenamiento del navegador; la reordenación es una **vista canónica funcional** de los registros existentes y nuevos.
- Los datos remotos pueden contener documentos adicionales respecto a estos seeds.
- No se migrarán los planes municipales a referencias de uso general, aunque estén etiquetados con un tipo documental genérico.
- Para limpiar realmente un expediente remoto: backup recuperable incluyendo originales, verificación Firebase, inventario de dependencias y operación reversible, separada y confirmada.
