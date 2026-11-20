# Segunda fase: auditoría previa a la migración estratégica

## Resultado implementado

En «Diagnóstico territorial → Documentación de referencia estratégica» aparece «Auditar duplicados estratégicos del expediente», con una tabla y exportación JSON de revisión. La función `auditStrategicMigration` nunca escribe, elimina, edita, sincroniza ni transforma evidencias.

### Clasificación conservadora

- **Referencia exacta:** `kind=strategic-framework` y `source.url` idéntica a una de las rutas PDF comunes empaquetadas. Es una candidatura a cotejar, **no acreditación de que el archivo conservado sea el mismo**.
- **Municipal:** escala municipal explícita o etiqueta territorial conocida; debe permanecer en el expediente de origen.
- **Revisión manual:** cualquier otro marco estratégico, incluso si su título coincide con uno de los comunes. Ni el texto ni el título bastan para inferir que el documento es transversal.

El informe incluye ID, nombre, vínculos a evidencias, conciliaciones, validaciones de activos, cadena de revisiones, existencia de registro de original, SHA-256 declarada cuando exista y versión de repositorio. La salida no contiene el texto completo ni bytes de originales.

## Condiciones para permitir una migración real

1. Realizar y probar copia de recuperación con originales y versión remota de cada expediente.
2. Confirmar que la biblioteca compartida tiene custodia y persistencia independientes, permisos, versionado y acceso verificable; el catálogo de cuatro PDF empaquetados es **solo de lectura**, no un almacén para migraciones.
3. Cotejar huellas del original en ambos contenedores, no limitarse a URLs o títulos.
4. Registrar un vínculo explícito desde el expediente municipal al documento compartido, con razón de migración y versión canónica. No copiar marcos como EvidenceAtoms locales.
5. Si existen vínculos de evidencia, revisión, conciliaciones o activos, bloquea el traslado hasta resolver la continuidad referencial y demostrar equivalencia.
6. Presentar antes/después; ejecutar únicamente la migración de cada expediente autorizado; posibilidad de revertir.
7. No modificar seeds, tombstones, memoria del navegador o Firestore por defecto.

## Alcance excluido

No existe borrado automático ni migración de datos en esta fase. Los informes de salud, microdatos, IBSE, estudios complementarios, priorización, perfiles, planes y activos continúan exclusivamente municipales.
