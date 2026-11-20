# IBSE Atarfe — contraste del CSV recibido el 20/11/2026

## Naturaleza de la comprobación

Se inspeccionó localmente el fichero aportado por el responsable, `MonitorIBSEATARFE202_DATA_2026-11-19_2343.csv`, sin incorporarlo al repositorio público ni a Firestore. Contiene registros de respuestas con edad, sexo e identificadores de REDCap; esos microdatos se mantienen fuera de GitHub.

- Tamaño: 64 126 bytes.
- SHA-256 de los **bytes del CSV recibido**: `e10a5d021daa3ede134868100fdf7e944a1e2ab00d64d51c75112e2b4749ccd8`.
- Encabezado: 19 columnas, incluidas `record_id`, `sexo`, `edad`, cuatro factores, `ibse_total` y `monitor_ibse_complete`.
- 910 registros y 910 identificadores de registro distintos.
- `monitor_ibse_complete == 2`: 898 registros; `== 0`: 12.
- Entre los completos, 811 registros poseen `ibse_total` numérico y 87 no presentan total.
- Media aritmética del total de esos 811: **63,22056103575832**, redondeada a **63,2/100**.
- Hay 821 registros con total no vacío sin filtrar por estado: **no** deben confundirse con las 811 respuestas completas válidas.

## Comparación con el expediente

El archivo simplificado `fixtures/ibse-atarfe.csv` documentado el 23/10/2026 tenía 909 registros, 811 válidos y media 63,2, pero no contenía edad y sexo. El CSV recibido ahora tiene 910 filas y sí contiene edad y sexo; sus 811 índices completos reproducen el tamaño analítico y la media comunicados. La discrepancia de una fila bruta puede proceder de una exportación posterior o del criterio de inclusión, pero **no se ha comprobado un emparejamiento fila a fila**. La coincidencia del tamaño válido y la media no certifica identidad de muestras ni descarta diferencias en otros indicadores.

El candidato separado `ibse_atarfe_2026-02-23.csv` de 374 filas descrito en `IBSE-ATARFE-PONDERACION-2026-10-23.md` sigue **sin procedencia acreditada** y no debe utilizarse para reemplazar la muestra del expediente.

## Decisión metodológica

1. **No alterar el estudio persistido, sus evidencias ni el Perfil** hasta auditar valores por factor, selección de válidos y coincidencia de registros con un export de procedencia contrastada.
2. Conservar el CSV recibido como fuente privada candidata a original de REDCap, identificada por su SHA-256 binario. No publicar microdatos ni fechas de respuesta individual.
3. Tratar la ponderación por edad y sexo como **nuevo cálculo separado**; revisar universo (15+, 16+, muestra mixta), cobertura, celdas vacías y referencia demográfica, sin confundir muestra voluntaria ajustada con representatividad.
4. Permitir importar CSV en la misma bandeja documental, con revisión, huella y confirmación explícita; evitar crear automáticamente un segundo estudio IBSE.
5. Registrar por separado **observado**, **ajustado** y **validado**. Ningún cambio en estas reglas debe modificar el estudio automáticamente.

## Pendiente de ensayo

- Reconciliación registro a registro con exportación conservada, preferiblemente por un proceso local y sin subir microdatos a GitHub.
- Pruebas de importación y restauración en una sesión autenticada y con las reglas Firestore actualmente publicadas.
- Prueba de interfaz que evite doble incorporación del estudio IBSE y distinga originales de derivados documentales.
