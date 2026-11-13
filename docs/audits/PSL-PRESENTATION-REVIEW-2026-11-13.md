# Perfiles externos · revisión de presentación · 13/11/2026

Este corte sucede a la auditoría de contenido del 12 de noviembre. No valida científicamente los perfiles ni declara conformidad contractual completa. La inspección usa las versiones remotas y sus vistas de COMPÁS, no las semillas del repositorio.

## Estado comprobado

| Municipio | Vigente | Resultados | Conclusiones | Recomendaciones | Estado |
|---|---|---:|---:|---|---|
| Alfacar | 0.6-C1 | 41 | 9 | 3 Conocer, 6 Contrastar | En revisión |
| Atarfe | 0.6-C1 | 27 | 8 | 2 Conocer, 6 Contrastar | En revisión |
| Loja | 0.4-C1 | 97 | 9 | 6 Conocer, 6 Contrastar | En revisión |
| Zagra | 0.2-C1 | 30 | 8 | 4 Conocer, 7 Contrastar | En revisión |

La relectura administrativa de Firebase de este corte confirmó PDF, texto y resultados en los cuatro expedientes. Originales comprobados: Alfacar 12, Atarfe 2, Loja 4 y Zagra 6; cero fallos SHA-256. Atarfe conserva una revisión porque su responsable eliminó las anteriores; no es un fallo de persistencia ni una eliminación realizada por esta auditoría.

Las cuatro presentaciones vigentes reconocen las páginas iniciales y los recuentos anteriores. Consultar una histórica no cambia la vigente: al entrar en Alfacar estaba seleccionada la v0.3, mientras la biblioteca remota mantenía 0.6-C1 activa. Se consultó explícitamente la 0.6-C1 antes de evaluarla. Tras cambiar de ámbito se esperó a la biblioteca remota; el contenido transitorio del navegador no se tomó como diagnóstico vigente.

## Defectos de representación observados y corrección propuesta

1. Filas delimitadas por ` | ` se dibujaban como párrafos en las páginas y en el texto íntegro imprimible: Alfacar 99, Atarfe 73, Loja 98, Zagra 73 párrafos con barras en la presentación completa. Se añade un lector de tablas literales compartido por páginas de datos, lector y transcripción imprimible. Solo transforma grupos rectangulares de dos o más filas; las líneas ambiguas quedan literales. Escapa texto y no genera indicadores.
2. El panel llamaba «Antes» a cualquier comparador no incluido en los ámbitos geográficos. En Atarfe, un comparador entre mujeres y hombres podía aparecer como antecedente temporal. Se cambia el rótulo a «Otras referencias», conservando la etiqueta aportada por la fuente.
3. La portada añadía la unidad del resultado local a la cifra comparadora. Atarfe llegaba a mostrar «Atarfe, hombres: 726,08 casos por 10.000 mujeres». Como el esquema no admite una unidad propia por comparador, se deja su etiqueta y cifra sin atribuirle automáticamente la unidad local. La unidad local y el dato original se conservan.
4. El diagnóstico «Con denominador» contaba cualquier texto no vacío, incluso «no explicitado». Se aclara que es un campo de base con texto y que no acredita base conocida ni verificada. No se cambia el contenido de los paquetes.

Las correcciones actúan sobre la presentación. No reescriben PDF/JSON, no cambian valores, estados, vínculos ni priorización, y no requieren volver a cargar los perfiles. Su publicación en la aplicación es un paso separado del guardado de perfiles en Firebase.

## Cierre pendiente por revisión

- **Común:** aceptación explícita de autoría y validación técnica humana; mapas, pirámides y núcleo común todavía no certificados. La aprobación del contrato externo propuesto sigue pendiente. No se igualan recuentos de municipios.
- **Alfacar:** diccionario de sexo participativo y correspondencia sección-núcleo sin cerrar; notas heredadas sobre el Informe pendientes de cotejo y de resolución del conflicto con art. 13 bis. No se adopta una tasa alternativa calculada por el perfil.
- **Atarfe:** conciliación documental de 17 registros con validación declarada y 20 inventariados; tres sin identificador; 61585/61419 no fusionados. Esta revisión de presentación no acredita actualización del catálogo de activos ni vigencia de sus fichas. Los cálculos IBSE de la v0.5 se conservan, no se han recalculado aquí.
- **Loja:** identificación territorial de secciones sin convertirlas automáticamente en barrios; cotas estadísticas conservadas; relación entre inventario y activos comunitarios requiere contraste. La sesión de priorización debe registrar la selección de líneas separadamente del perfil.
- **Zagra:** periodos epidemiológicos históricos no rejuvenecidos por la renta 2024; contraste con fuentes y resolución metodológica de las notas heredadas siguen pendientes.
- **Distribución:** cotejo visual final de la aplicación publicada y de sus exportaciones PDF y Word. Las pruebas del lector y la compilación no sustituyen ese cotejo ni verifican todas las imágenes o el contenido científico.

## Verificación del cambio de software

50 pruebas en cuatro archivos: estructura, representación del panel, suficiencia documental y tablas. Incluyen conservación de filas, celdas vacías, citas, caracteres HTML como texto y separación del comparador por sexo respecto al rótulo temporal. Compilación de producción correcta. Un test de descarga conservaba un rótulo anterior y se actualiza al botón existente «Guardar páginas en PDF».
