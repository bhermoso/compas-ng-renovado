# Consulta documental y conservación de originales

El catálogo completo permite localizar todos los documentos registrados, incluidos informes de salud, estudios complementarios, activos, documentación territorial y marcos estratégicos. La clasificación por fases se mantiene en los paneles especializados.

Cada documento ofrece el acceso que realmente existe: enlace a la fuente, descarga del archivo conservado en este navegador, texto conservado o aviso de original ausente. «Registrado» describe la incorporación al expediente; no acredita aprobación ni disponibilidad del original.

Los PDF de referencia incluidos explícitamente en el código se incorporan a la compilación. Los documentos que incorporan los usuarios no se publican: se conservan en IndexedDB, separados por identificador de ámbito y de documento. Las cargas documentales PDF/DOCX, los CSV de estudios, la priorización temática y las importaciones del gestor de encuestas conservan sus originales.

Los registros anteriores pueden necesitar que se adjunte de nuevo el archivo. Vincular un original requiere confirmar su correspondencia; no recalcula datos, texto ni evidencias. La eliminación de un registro solicita también la eliminación de su archivo local y comunica los errores de almacenamiento.

## Límites actuales

- La separación por ámbito en el navegador no sustituye la autenticación ni los permisos de un servidor.
- La exportación JSON del expediente no incluye los originales. Es necesario descargarlos por separado para trasladarlos a otro equipo.
- Borrar los datos del sitio elimina los originales locales. No es una copia de seguridad remota.
- Sustituir un documento mediante una nueva carga puede dejar una copia antigua sin referencia en el almacenamiento local. Queda pendiente la gestión de versiones y la limpieza de archivos huérfanos.
- Los archivos perdidos antes de esta corrección no pueden reconstruirse a partir de sus metadatos.
